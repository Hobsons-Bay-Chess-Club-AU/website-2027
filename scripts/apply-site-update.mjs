import {readFile,writeFile} from 'node:fs/promises';
import {loadEnv} from './env.mjs';
import {validatePackage} from './validate-cms.mjs';
import {contentfulClient} from './contentful-client.mjs';
const schema=JSON.parse(await readFile('contentful/schema.json','utf8')),seed=JSON.parse(await readFile('contentful/seed.json','utf8')),assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
const editors=JSON.parse(await readFile('contentful/editor-interfaces.json','utf8')).editorInterfaces;
const apply=process.argv.includes('--apply'),publish=process.argv.includes('--publish');
console.log(JSON.stringify({mode:apply?(publish?'update-and-publish':'update-drafts'):'dry-run',...validatePackage(schema,seed,assets)},null,2));
if(!apply)process.exit(0);
const api=contentfulClient(loadEnv()),report={startedAt:new Date().toISOString(),models:[],editors:[],createdEntries:[],updatedEntries:[],publishedEntries:[],publishedAssets:[],draftsRetained:[],error:null};
try{
 const locale=await api.locale();if(!locale)throw new Error('The Contentful environment needs a default locale.');
 const models=new Map((await api.all('content_types')).map(t=>[t.sys.id,t]));
 for(const type of schema.contentTypes){
  let current=models.get(type.sys.id);
  if(!current){current=await api.request('/content_types/'+type.sys.id,{method:'PUT',body:{name:type.name,description:type.description,fields:[]}});models.set(type.sys.id,current);}
  for(const field of current.fields){const next=type.fields.find(f=>f.id===field.id);if(next&&(next.type!==field.type||next.linkType!==field.linkType))throw new Error('Refusing an incompatible content type change: '+type.sys.id+'.'+field.id);}
 }
 for(const type of schema.contentTypes){
  let current=models.get(type.sys.id);
  const fields=type.fields.map(f=>f.defaultValue?{...f,defaultValue:{[locale]:f.defaultValue[seed.locale]}}:f);
  fields.push(...current.fields.filter(f=>!fields.some(next=>next.id===f.id)));
  if(JSON.stringify(fields)!==JSON.stringify(current.fields)||current.description!==type.description){
   current=await api.request('/content_types/'+type.sys.id,{method:'PUT',headers:api.version(current),body:{name:type.name,description:type.description,displayField:type.displayField,fields}});report.models.push(type.sys.id);
  }
  if(!current.sys.publishedVersion||current.sys.version!==current.sys.publishedVersion+1)current=await api.publish('content_types',current);
  models.set(type.sys.id,current);
  const editor=await api.request('/content_types/'+type.sys.id+'/editor_interface');
  const controls=editors.find(e=>e.contentTypeId===type.sys.id).controls;
  controls.push(...(editor.controls||[]).filter(c=>!controls.some(next=>next.fieldId===c.fieldId)));
  if(JSON.stringify(controls)!==JSON.stringify(editor.controls)){await api.request('/content_types/'+type.sys.id+'/editor_interface',{method:'PUT',headers:api.version(editor),body:{controls}});report.editors.push(type.sys.id);}
 }
 console.log('Calendar and news models activated.');
 const remoteAssets=new Map((await api.all('assets')).map(a=>[a.sys.id,a])),cdn=new Map();
 for(const asset of assets){
  let current=remoteAssets.get(asset.id);if(!current)current=await api.uploadAsset(asset,locale);
  const url=current.fields.file?.[locale]?.url;if(!url)throw new Error('An imported asset has not finished processing: '+asset.id);
  cdn.set(asset.localUrl,url.startsWith('//')?'https:'+url:url);
  if(publish&&!current.sys.publishedVersion){current=await api.publish('assets',current);report.publishedAssets.push(asset.id);}
 }
 console.log('News images uploaded; '+assets.length+' assets checked.');
 const rewrite=value=>{
  if(typeof value==='string'){for(const [local,url] of cdn)value=value.replaceAll(local,url);return value;}
  if(Array.isArray(value))return value.map(rewrite);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewrite(v)]));
  return value;
 };
 const entries=new Map((await api.all('entries')).map(e=>[e.sys.id,e]));
 const controlled=entry=>['calendarEvent','calendarSchedule'].includes(entry.sys.contentType.sys.id)||entry.sys.id.startsWith('hbcc-news-')||entry.sys.id==='home-news'||['wp-page-5225','wp-page-5225-calendar','wp-page-4419-section-3'].includes(entry.sys.id)||entry.sys.contentType.sys.id==='post'&&entry.fields.wordpressId||entry.sys.contentType.sys.id==='navigationItem'&&entry.fields.label?.[seed.locale]==='Calendar';
 for(const entry of seed.entries){
  let current=entries.get(entry.sys.id);
  if(!current||controlled(entry)){
   const fields=Object.fromEntries(Object.entries(entry.fields).map(([key,value])=>[key,{[locale]:rewrite(value[seed.locale])}]));
   if(!current||JSON.stringify(current.fields)!==JSON.stringify(fields)){
    const created=!current;current=await api.putEntry(entry.sys.id,entry.sys.contentType.sys.id,fields,current);
    (created?report.createdEntries:report.updatedEntries).push(entry.sys.id);
   }
   entries.set(entry.sys.id,current);
  }
  if((report.createdEntries.length+report.updatedEntries.length)%25===0&&controlled(entry))console.log('Calendar/news entries processed: '+(report.createdEntries.length+report.updatedEntries.length));
 }
 if(publish)for(const entry of seed.entries){
  const current=entries.get(entry.sys.id);
  if(current.fields.enabled?.[locale]===false||current.fields.needsReview?.[locale]===true){report.draftsRetained.push(entry.sys.id);continue;}
  if(!current.sys.publishedVersion||current.sys.version!==current.sys.publishedVersion+1){await api.publish('entries',current);report.publishedEntries.push(entry.sys.id);}
  if(report.publishedEntries.length&&report.publishedEntries.length%50===0)console.log('Published '+report.publishedEntries.length+' entries.');
 }
 report.finishedAt=new Date().toISOString();
 console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([key])=>key!=='error').map(([key,value])=>[key,Array.isArray(value)?value.length:value])),null,2));
}catch(error){report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{await writeFile('contentful/update-report.json',JSON.stringify(report,null,2));}
