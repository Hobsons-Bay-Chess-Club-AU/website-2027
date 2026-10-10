import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const path='public/fonts/hbcc-fonts.css';
let css=await readFile(path,'utf8');
const urls=[...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]))];
const manifest=JSON.parse(await readFile('reference/manifest.json','utf8'));
await mkdir('reference/fonts',{recursive:true});
for(const url of urls){
 const parsed=new URL(url);
 if(!/^(fonts\.wp\.com|fonts\.gstatic\.com)$/.test(parsed.hostname))throw new Error('Unexpected font host.');
 const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`Font download failed: HTTP ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 const name=createHash('sha256').update(url).digest('hex').slice(0,10)+'-'+parsed.pathname.split('/').at(-1);
 const localUrl=`/fonts/${name}`;
 await writeFile('public'+localUrl,bytes);await writeFile(`reference/fonts/${name}`,bytes);
 css=css.replaceAll(url,localUrl);
 manifest.assets.push({url,path:`reference/fonts/${name}`,localUrl,contentType:'font/woff2',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile(path,css.replaceAll('url(/fonts/','url(./').replaceAll('url(/wp-assets/','url(../wp-assets/'));
await writeFile('reference/manifest.json',JSON.stringify(manifest,null,2));
await writeFile('reference/asset-map.json',JSON.stringify(Object.fromEntries(manifest.assets.filter(a=>a.localUrl).map(a=>[a.url,a.localUrl])),null,2));
console.log(`Self-hosted ${urls.length} additional font files. No remote font requests remain.`);
