import {readFile,writeFile,mkdir,readdir,copyFile,rename,stat} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve('.');
const publicDir=path.join(root,'public','wp-assets'),archiveDir=path.join(root,'reference','assets');
const inside=(target,parent)=>{const relative=path.relative(parent,target);return relative!==''&&!relative.startsWith('..')&&!path.isAbsolute(relative);};
if(!inside(publicDir,root)||!inside(archiveDir,root))throw new Error('Asset paths must remain inside the project.');
const manifest=JSON.parse(await readFile('reference/manifest.json','utf8'));
if(manifest.optimizedAt){console.log('The captured assets are already optimized. Capture a fresh reference before optimizing again.');process.exit(0);}
const data=await readFile('src/data/site.json','utf8'),fonts=await readFile('public/fonts/hbcc-fonts.css','utf8');
const needed=new Set((data+'\n'+fonts).match(/\/wp-assets\/[^"'\\\s<)]+/g)||[]);
await mkdir(archiveDir,{recursive:true});
const byFilename=new Map(manifest.assets.filter(a=>a.path.startsWith('public/wp-assets/')).map(a=>[a.path.split('/').at(-1),a]));
let files=0,bytes=0;
const names=await readdir(publicDir);
// Archive stale derivatives first, before creating any new files with their names.
for(const name of names.filter(name=>!needed.has(`/wp-assets/${name}`))){
 const from=path.resolve(publicDir,name),archived=path.resolve(archiveDir,name);
 if(!inside(from,publicDir)||!inside(archived,archiveDir))throw new Error('An asset path escaped its allowed directory.');
 await rename(from,archived);
 const record=byFilename.get(name);
 if(record){record.path=`reference/assets/${name}`;record.localUrl=null;}
}
for(const name of names.filter(name=>needed.has(`/wp-assets/${name}`))){
 const from=path.resolve(publicDir,name),archived=path.resolve(archiveDir,name);
 if(!inside(from,publicDir)||!inside(archived,archiveDir))throw new Error('An asset path escaped its allowed directory.');
 const url=`/wp-assets/${name}`,record=byFilename.get(name);
 if(needed.has(url)){
  if(/\.(png|jpe?g)$/i.test(name)&&!name.includes('favicon')){
   const optimizedName=name.replace(/\.(png|jpe?g)$/i,'.webp');
   const optimized=path.resolve(publicDir,optimizedName);
   if(!inside(optimized,publicDir))throw new Error('An optimized path escaped its allowed directory.');
   await sharp(from).rotate().resize({width:1800,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:88,effort:5}).toFile(optimized);
   await rename(from,archived);
   if(record){record.path=`reference/assets/${name}`;record.localUrl=`/wp-assets/${optimizedName}`;record.optimizedBytes=(await stat(optimized)).size;}
   files++;bytes+=(await stat(optimized)).size;
  }else{
   await copyFile(from,archived);
   if(record)record.path=`reference/assets/${name}`;
   files++;bytes+=(await stat(from)).size;
  }
 }
}
manifest.optimizedAt=new Date().toISOString();manifest.runtimeAssets={files,bytes};
await writeFile('reference/manifest.json',JSON.stringify(manifest,null,2));
await writeFile('reference/asset-map.json',JSON.stringify(Object.fromEntries(manifest.assets.filter(a=>a.localUrl).map(a=>[a.url,a.localUrl])),null,2));
console.log(JSON.stringify({runtimeFiles:files,runtimeBytes:bytes,originalReferenceBytes:manifest.assets.reduce((n,a)=>n+a.bytes,0),originals:'reference/assets'},null,2));
