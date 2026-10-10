import {readFile,readdir,access,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {load} from 'cheerio';
import {loadEnv} from './env.mjs';
const root=path.resolve('dist');
const htmlFiles=[];
const textFiles=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())await walk(p);else {if(p.endsWith('.html'))htmlFiles.push(p);if(/\.(html|[cm]?js|json|css|txt|xml)$/.test(p))textFiles.push(p);}}}
await walk(root);
const missing=[],wordpressAssets=[],unsafe=[];
const credentials=loadEnv();
const secrets=[credentials.deliveryToken,credentials.previewToken,credentials.managementToken].filter(v=>v&&v.length>16);
for(const file of textFiles){const text=await readFile(file,'utf8');if(secrets.some(secret=>text.includes(secret)))unsafe.push({file:path.relative(root,file),issue:'A server credential appears in the output'});}
let checked=0;
for(const file of htmlFiles){
 const html=await readFile(file,'utf8'),$=load(html);
 if($('h1').length!==1)unsafe.push({file:path.relative(root,file),issue:'Expected exactly one h1'});
 for(const el of $('a[href],img[src],link[href],iframe[src]').toArray()){
  const tag=el.tagName,attr=tag==='img'||tag==='iframe'?'src':'href',value=$(el).attr(attr);
  if(/^https:\/\/hobsonsbaychess\.com\/wp-content\//.test(value))wordpressAssets.push({file:path.relative(root,file),value});
  if(!value||!value.startsWith('/')||value.startsWith('//'))continue;
  const url=new URL(value,'https://hbcc.example');
  let target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
  try{await access(target);checked++;}catch{missing.push({file:path.relative(root,file),value,text:$(el).text().trim().slice(0,80)});}
 }
 if(/javascript\s*:/i.test(html))unsafe.push({file:path.relative(root,file),issue:'javascript URL detected'});
}
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
for(const asset of [...new Set(JSON.stringify(data).match(/\/(wp-assets|fonts)\/[^"\\\s<]+/g)||[])]){
 try{await access(path.join(root,asset));checked++;}catch{missing.push({file:'site content',value:asset});}
}
const report={checkedAt:new Date().toISOString(),htmlPages:htmlFiles.length,checkedLocalLinksAndAssets:checked,missing,wordpressAssets,unsafe};
await writeFile('docs/verification.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(missing.length||wordpressAssets.length||unsafe.length)process.exitCode=1;
