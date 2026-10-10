import {readFile} from 'node:fs/promises';
const data=JSON.parse(await readFile('src/data/site.json','utf8'));
const manifest=JSON.parse(await readFile('reference/manifest.json','utf8'));
const remoteAssets=[...new Set(JSON.stringify(data).match(/https?:\/\/hobsonsbaychess\.com\/wp-content\/[^"\\\s<]+/g)||[])];
console.log(JSON.stringify({
 pages:data.pages.map(p=>({slug:p.slug,bodyBytes:p.bodyHtml.length,hero:p.heroImage})),
 settings:{...data.settings,features:undefined,navigation:undefined,stats:undefined,standings:undefined,schedule:undefined,footerImages:undefined},
 sponsors:data.sponsors,remoteAssets,
 errors:manifest.errors.slice(0,8),errorCounts:manifest.errors.reduce((r,e)=>{r[e.error]=(r[e.error]||0)+1;return r;},{}),
},null,2));
