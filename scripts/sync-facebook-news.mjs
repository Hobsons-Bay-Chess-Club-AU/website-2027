import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';
import {parsePublicFacebook,facebookArticle,facebookPermalink,articleHash,syncDecision} from './facebook-source.mjs';
const args=process.argv.slice(2),apply=args.includes('--apply'),input=args.find(a=>a.startsWith('--file='))?.slice(7);
const report={checkedAt:new Date().toISOString(),mode:apply?'import-drafts':'dry-run',source:input?'browser-capture':'public-page',found:0,created:0,updatedDrafts:0,skipped:[],error:null};
try{
 let posts;
 if(input){
  const capture=JSON.parse(await readFile(input,'utf8'));posts=capture.posts;
  if(!Array.isArray(posts)||posts.some(p=>!p.id||!p.message||!facebookPermalink(p.permalink_url)||Number.isNaN(Date.parse(p.created_time))))throw new Error('The browser capture needs valid post IDs, captions, dates and public HBCC permalinks.');
 }else{
  const response=await fetch('https://www.facebook.com/hobsonsbaychess/',{headers:{'User-Agent':'HBCC website news reference capture'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Facebook public scrape returned HTTP '+response.status+'. No news was changed.');
  const html=await response.text();if(html.length>5000000)throw new Error('Facebook returned an unexpectedly large page.');
  posts=parsePublicFacebook(html);
 }
 posts=posts.filter(p=>Date.parse(p.created_time)<=Date.now()+86400000).sort((a,b)=>Date.parse(b.created_time)-Date.parse(a.created_time)).slice(0,25);
 report.found=posts.length;
 if(!apply){console.log(JSON.stringify({...report,articles:posts.map(p=>({title:facebookArticle(p).fields.title,date:p.created_time,source:p.permalink_url}))},null,2));process.exitCode=0;}
 else{
  const api=contentfulClient(loadEnv()),locale=await api.locale();
  const existing=(await api.all('entries')).filter(e=>e.sys.contentType.sys.id==='post'),flatten=e=>Object.fromEntries(Object.entries(e.fields).map(([key,value])=>[key,value[locale]]));
  for(const post of posts){
   const current=existing.find(e=>{const f=flatten(e);return f.facebookPostId===String(post.id).split('_').at(-1)||facebookPermalink(f.originalUrl)===facebookPermalink(post.permalink_url);});
   const decision=syncDecision(current&&flatten(current),post);
   if(!['create','update-draft'].includes(decision)){report.skipped.push({id:post.id,reason:decision});continue;}
   const article=facebookArticle(post),old=current&&flatten(current),fields={...old,...article.fields,...(old?{slug:old.slug}:{} )};
   let bytes,contentType='image/jpeg';
   if(post.imagePath){
    const resolved=path.resolve(post.imagePath),relative=path.relative(process.cwd(),resolved);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Captured news images must stay inside the project.');
    bytes=await readFile(resolved);contentType=/\.png$/i.test(resolved)?'image/png':/\.webp$/i.test(resolved)?'image/webp':'image/jpeg';
   }else if(post.imageUrl){
    let url=new URL(post.imageUrl),response;
    for(let redirects=0;redirects<5;redirects++){
     if(url.protocol!=='https:'||url.username||url.password||!url.hostname.endsWith('.fbcdn.net'))throw new Error('Only public Facebook CDN image URLs are accepted.');
     response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
     if([301,302,303,307,308].includes(response.status)){url=new URL(response.headers.get('location'),url);continue;}break;
    }
    if(!response?.ok)throw new Error('The public Facebook image could not be downloaded.');
    contentType=response.headers.get('content-type')?.split(';')[0]||'';
    if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw new Error('Facebook returned an unsupported image format.');
    bytes=Buffer.from(await response.arrayBuffer());
   }
   if(bytes){
    if(bytes.length>20000000)throw new Error('The Facebook image exceeds 20 MB.');
    const suffix=contentType==='image/png'?'png':contentType==='image/webp'?'webp':'jpg',id='fb-image-'+createHash('sha256').update(bytes).digest('hex').slice(0,24);
    await api.uploadAsset({id,title:fields.title,fileName:id+'.'+suffix,contentType},locale,bytes);
    fields.image={sys:{type:'Link',linkType:'Asset',id}};fields.imageAlt=fields.title;
   }
   fields.facebookImportHash=articleHash(fields);
   const localized=Object.fromEntries(Object.entries(fields).filter(([,value])=>value!==undefined).map(([key,value])=>[key,{[locale]:value}]));
   const saved=await api.putEntry(current?.sys.id||article.id,'post',localized,current);
   if(current)report.updatedDrafts++;else{report.created++;existing.push(saved);}
  }
  console.log(JSON.stringify(report,null,2));
 }
}catch(error){report.error=error.message;process.exitCode=1;console.error(error.message);}
finally{await writeFile('contentful/facebook-sync-report.json',JSON.stringify(report,null,2));}
