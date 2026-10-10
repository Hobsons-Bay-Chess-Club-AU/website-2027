import {readFile,writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {loadEnv} from './env.mjs';
import {validatePackage} from './validate-cms.mjs';
const schema=JSON.parse(await readFile('contentful/schema.json','utf8'));
const seed=JSON.parse(await readFile('contentful/seed.json','utf8'));
const assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
const editors=JSON.parse(await readFile('contentful/editor-interfaces.json','utf8')).editorInterfaces;
validatePackage(schema,seed,assets);
for(const asset of assets){
 const relative=path.relative(process.cwd(),path.resolve(asset.path));
 if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Asset upload paths must stay inside this project.');
 await access(asset.path);
}
const apply=process.argv.includes('--apply'),publish=process.argv.includes('--publish');
if(publish&&!apply)throw new Error('--publish requires --apply.');
console.log(JSON.stringify({mode:apply?(publish?'import-and-publish':'import-drafts'):'dry-run',contentTypes:schema.contentTypes.length,entries:seed.entries.length,assets:assets.length,editorInterfaces:editors.length,overwriteExisting:false},null,2));
if(!apply)process.exit(0);
const env=loadEnv();
if(!env.space||!env.managementToken)throw new Error('Add CONTENTFUL_MANAGEMENT_TOKEN to the local .env. Delivery/Preview keys cannot write.');
const base='https://api.contentful.com/spaces/'+encodeURIComponent(env.space)+'/environments/'+encodeURIComponent(env.environment);
const report={startedAt:new Date().toISOString(),environment:env.environment,publish,createdTypes:[],configuredEditors:[],createdAssets:[],createdEntries:[],skipped:[],published:[],error:null};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const versionHeaders=item=>({'X-Contentful-Version':String(item.sys.version)});
async function request(route,{method='GET',body,headers={},allow404=false,baseUrl=base,raw=false}={}){
 for(let attempt=0;attempt<5;attempt++){
  let response;
  try{response=await fetch(baseUrl+route,{method,headers:{Authorization:'Bearer '+env.managementToken,'Content-Type':raw?'application/octet-stream':'application/vnd.contentful.management.v1+json',...headers},body:body===undefined?undefined:raw?body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});}
  catch{throw new Error('Contentful '+method+' '+route+' failed. Inspect the import report before retrying.');}
  if(response.status===429&&attempt<4){await delay(Math.min(10000,1000*(Number(response.headers.get('x-contentful-ratelimit-reset'))||1)));continue;}
  if(response.status===404&&allow404)return null;
  if(!response.ok){
   let reason='';try{
    const error=await response.json();
    reason=error.sys?.id==='OrganizationAccessGrantRequired'
     ? ' Authorize this token for the organization under Contentful Settings > CMA tokens > Authorize access.'
     : typeof error.message==='string'?' '+error.message.replaceAll(env.managementToken,'[redacted]'):'';
   }catch{}
   throw new Error('Contentful '+method+' '+route+': HTTP '+response.status+'.'+reason);
  }
  return response.status===204?null:response.json();
 }
}
const mime=name=>({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pgn:'application/x-chess-pgn'}[name.split('.').at(-1).toLowerCase()]||'application/octet-stream');
try{
 const locales=await request('/locales'),locale=locales.items.find(l=>l.default)?.code;
 if(!locale)throw new Error('Contentful has no default locale.');
 const models=new Map();
 for(const type of schema.contentTypes){
  const existing=await request('/content_types/'+type.sys.id,{allow404:true});
  if(existing?.fields.length&&type.fields.some(f=>!existing.fields.some(e=>e.id===f.id&&e.type===f.type&&e.linkType===f.linkType)))throw new Error('Existing model '+type.sys.id+' has a different schema. This importer will not overwrite it.');
  models.set(type.sys.id,existing);
 }
 // Create all model IDs before applying cross-type reference validations.
 for(const type of schema.contentTypes){
  if(models.get(type.sys.id))continue;
  const created=await request('/content_types/'+type.sys.id,{method:'PUT',body:{name:type.name,description:type.description,fields:[]}});
  models.set(type.sys.id,created);report.createdTypes.push(type.sys.id);
 }
 for(const type of schema.contentTypes){
  let existing=models.get(type.sys.id);
  const fields=type.fields.map(field=>field.defaultValue?{...field,defaultValue:{[locale]:field.defaultValue[seed.locale]}}:field);
  if(!existing.fields.length)existing=await request('/content_types/'+type.sys.id,{method:'PUT',headers:versionHeaders(existing),body:{name:type.name,description:type.description,displayField:type.displayField,fields}});
  else report.skipped.push('content-type:'+type.sys.id);
  models.set(type.sys.id,existing);
 }
 for(const type of schema.contentTypes){
  const existing=models.get(type.sys.id),fresh=report.createdTypes.includes(type.sys.id)||!existing.sys.publishedVersion;
  if(!existing.sys.publishedVersion)await request('/content_types/'+type.sys.id+'/published',{method:'PUT',headers:versionHeaders(existing)});
  if(fresh){
   const editor=await request('/content_types/'+type.sys.id+'/editor_interface');
   await request('/content_types/'+type.sys.id+'/editor_interface',{method:'PUT',headers:versionHeaders(editor),body:{controls:editors.find(e=>e.contentTypeId===type.sys.id).controls}});
   report.configuredEditors.push(type.sys.id);
  }
 }
 console.log('Models and native editors ready.');
 const cdn=new Map();
 for(const asset of assets){
  let existing=await request('/assets/'+asset.id,{allow404:true});
  if(!existing){
   const upload=await request('/uploads',{method:'POST',body:await readFile(asset.path),raw:true,baseUrl:'https://upload.contentful.com/spaces/'+encodeURIComponent(env.space)});
   existing=await request('/assets/'+asset.id,{method:'PUT',body:{fields:{title:{[locale]:asset.title},file:{[locale]:{fileName:asset.fileName,contentType:mime(asset.fileName),uploadFrom:{sys:{type:'Link',linkType:'Upload',id:upload.sys.id}}}}}}});
   report.createdAssets.push(asset.id);
  }else report.skipped.push('asset:'+asset.id);
  if(!existing.fields.file?.[locale]?.url){
   await request('/assets/'+asset.id+'/files/'+encodeURIComponent(locale)+'/process',{method:'PUT',headers:versionHeaders(existing)});
   for(let attempt=0;attempt<20;attempt++){
    await delay(750);existing=await request('/assets/'+asset.id);
    if(existing.fields.file?.[locale]?.url)break;
   }
  }
  let url=existing.fields.file?.[locale]?.url;
  if(!url)throw new Error('Asset '+asset.id+' is still processing. Retry once it completes.');
  if(url.startsWith('//'))url='https:'+url;
  cdn.set(asset.localUrl,url);
  if(publish&&!existing.sys.publishedVersion){await request('/assets/'+asset.id+'/published',{method:'PUT',headers:versionHeaders(existing)});report.published.push('asset:'+asset.id);}
  if(cdn.size%10===0)console.log('Processed '+cdn.size+'/'+assets.length+' assets.');
 }
 const rewrite=value=>{
  if(typeof value==='string'){for(const [local,url] of cdn)value=value.replaceAll(local,url);return value;}
  if(Array.isArray(value))return value.map(rewrite);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)]));
  return value;
 };
 let processed=0;
 for(const entry of seed.entries){
  let existing=await request('/entries/'+entry.sys.id,{allow404:true});
  if(existing)report.skipped.push('entry:'+entry.sys.id);
  else{
   const fields=Object.fromEntries(Object.entries(entry.fields).map(([key,value])=>[key,{[locale]:rewrite(value[seed.locale])}]));
   existing=await request('/entries/'+entry.sys.id,{method:'PUT',headers:{'X-Contentful-Content-Type':entry.sys.contentType.sys.id},body:{fields}});
   report.createdEntries.push(entry.sys.id);
  }
  processed++;if(processed%25===0)console.log('Imported '+processed+'/'+seed.entries.length+' entries.');
 }
 // References can form cycles; publish only after all entries exist.
 if(publish)for(const entry of seed.entries){
  const existing=await request('/entries/'+entry.sys.id);
  if(!existing.sys.publishedVersion){await request('/entries/'+entry.sys.id+'/published',{method:'PUT',headers:versionHeaders(existing)});report.published.push('entry:'+entry.sys.id);}
 }
 report.finishedAt=new Date().toISOString();
 console.log(JSON.stringify({createdTypes:report.createdTypes.length,configuredEditors:report.configuredEditors.length,createdAssets:report.createdAssets.length,createdEntries:report.createdEntries.length,skipped:report.skipped.length,published:report.published.length,report:'contentful/import-report.json'},null,2));
}catch(error){report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{await writeFile('contentful/import-report.json',JSON.stringify(report,null,2));}
