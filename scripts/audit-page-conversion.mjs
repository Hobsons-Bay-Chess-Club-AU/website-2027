import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {referenceContent} from '../src/lib/content.mjs';
const old=JSON.parse(await readFile('src/data/site.json','utf8'));
const words=html=>{
 const $=load(html);let text=[];
 const visit=n=>{if(n.type==='text')text.push(n.data);for(const c of n.children||[])visit(c);};
 visit($.root()[0]);return text.join(' ').replace(/\s+/g,' ').trim().split(/\s+/);
};
const body=sections=>sections.map(s=>s.bodyHtml+body(s.children||[])).join(' ');
const report=[];
for(const page of old.pages){
 const migrated=referenceContent.pages.find(p=>p.slug===page.slug);
 const original=words(page.bodyHtml),current=words(body(migrated.sections));
 const counts=list=>list.reduce((all,w)=>(all[w]=(all[w]||0)+1,all),{});
 const before=counts(original),after=counts(current);
 const lost=Object.entries(before).flatMap(([word,count])=>Array(Math.max(0,count-(after[word]||0))).fill(word));
 report.push({slug:page.slug,originalWords:original.length,convertedWords:current.length,missingWords:lost,deliberateReplacement:page.slug==='calendar'});
}
await writeFile('reference/audit/page-conversion-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report.map(r=>({...r,missingWords:r.missingWords.slice(0,35)})),null,2));
if(report.some(r=>!r.deliberateReplacement&&r.missingWords.length))process.exitCode=1;
