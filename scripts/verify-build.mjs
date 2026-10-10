import {readFile,readdir,access,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
import {loadEnv} from './env.mjs';
import {normalizeBase,withBase} from '../src/lib/site-url.mjs';
const root=path.resolve('dist');
const htmlFiles=[];
const textFiles=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else {if(p.endsWith('.html'))htmlFiles.push(p);if(/\.(html|[cm]?js|json|css|txt|xml)$/.test(p))textFiles.push(p);}}}
await walk(root);
const missing=[],wordpressAssets=[],unsafe=[];
const credentials=loadEnv();
const base=normalizeBase(process.env.SITE_BASE_PATH);
const site=new URL(process.env.SITE_URL||'https://hobsonsbaychess.com');
const preview=site.hostname.endsWith('.github.io');
const secrets=[credentials.deliveryToken,credentials.previewToken,credentials.managementToken].filter(v=>v&&v.length>16);
for(const file of textFiles){const text=await readFile(file,'utf8');if(secrets.some(secret=>text.includes(secret)))unsafe.push({file:path.relative(root,file),issue:'A server credential appears in the output'});}
let checked=0;
let redirects=0;
const fileUrl=file=>new URL(withBase('/'+path.relative(root,file).replaceAll('\\','/'),base),site);
async function checkUrl(value,file,context=fileUrl(file)){
 if(!value||/^(?:#|data:|mailto:|tel:)/.test(value))return;
 let url;try{url=new URL(value,context);}catch{unsafe.push({file:path.relative(root,file),issue:'Invalid resource URL'});return;}
 if(url.origin!==site.origin)return;
 if(base!=='/'&&!url.pathname.startsWith(base)){
  unsafe.push({file:path.relative(root,file),value,issue:'Local URL is outside the configured repository path'});return;
 }
 const pathname=decodeURIComponent(url.pathname.slice(base.length-1));
 let target=path.resolve(root,'.'+pathname);
 if(pathname.endsWith('/'))target=path.join(target,'index.html');
 const relative=path.relative(root,target);
 if(relative.startsWith('..')||path.isAbsolute(relative)){
  unsafe.push({file:path.relative(root,file),issue:'Resource URL leaves the build directory'});return;
 }
 try{await access(target);checked++;}catch{missing.push({file:path.relative(root,file),value});}
}
for(const file of htmlFiles){
 const html=await readFile(file,'utf8'),$=load(html);
 const refresh=$('meta').toArray().find(el=>$(el).attr('http-equiv')?.toLowerCase()==='refresh');
 if(refresh){
  redirects++;
  const target=$(refresh).attr('content')?.match(/url=(.+)$/i)?.[1];
  if(target)await checkUrl(target,file);else unsafe.push({file:path.relative(root,file),issue:'Redirect has no destination'});
 }else{
  if($('h1').length!==1)unsafe.push({file:path.relative(root,file),issue:'Expected exactly one h1'});
  if(preview&&!$('meta[name="robots"]').attr('content')?.includes('noindex'))unsafe.push({file:path.relative(root,file),issue:'GitHub preview must be marked noindex'});
 }
 for(const el of $('a[href],img[src],link[href],iframe[src],script[src]').toArray()){
  const tag=el.tagName,attr=['img','iframe','script'].includes(tag)?'src':'href',value=$(el).attr(attr);
  if(/^https:\/\/hobsonsbaychess\.com\/wp-content\//.test(value))wordpressAssets.push({file:path.relative(root,file),value});
  await checkUrl(value,file);
 }
 for(const el of $('[style]').toArray())for(const match of $(el).attr('style').matchAll(/url\(\s*['"]?([^'"\s)]+)/g))await checkUrl(match[1],file);
 if(/javascript\s*:/i.test(html))unsafe.push({file:path.relative(root,file),issue:'javascript URL detected'});
}
for(const file of textFiles.filter(f=>f.endsWith('.css'))){
 const text=await readFile(file,'utf8');
 for(const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)/g))await checkUrl(match[1],file);
}
const sitemap=load(await readFile(path.join(root,'sitemap.xml'),'utf8'),{xmlMode:true});
for(const el of sitemap('loc').toArray())await checkUrl(sitemap(el).text(),path.join(root,'sitemap.xml'));
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
for(const asset of [...new Set(JSON.stringify(data).match(/\/(wp-assets|fonts)\/[^"\\\s<]+/g)||[])]){
 try{await access(path.join(root,asset));checked++;}catch{missing.push({file:'site content',value:asset});}
}
const report={checkedAt:new Date().toISOString(),site:site.origin,basePath:base,htmlPages:htmlFiles.length,contentPages:htmlFiles.length-redirects,redirectPages:redirects,checkedLocalLinksAndAssets:checked,missing,wordpressAssets,unsafe};
await writeFile('docs/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(missing.length||wordpressAssets.length||unsafe.length)process.exitCode=1;
