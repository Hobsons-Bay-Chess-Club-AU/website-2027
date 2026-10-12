import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';

const source=JSON.parse(await readFile('src/data/site.json','utf8'));
const base='https://hobsons-bay-chess-club-au.github.io/website-2027/';
const after=process.argv.includes('--after'),cached=process.argv.includes('--cached');
const folder='reference/screenshots/page-review'+(after?'-after':'');
await mkdir(folder,{recursive:true});
const tidy=value=>value.replace(/\s+/g,' ').trim();
const words=value=>(value.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]);
const text=($,root)=>{
 const all=[];const walk=n=>{if(n.type==='text')all.push(n.data);else if(!['script','style','noscript'].includes(n.tagName))for(const c of n.children||[])walk(c);};
 for(const n of root.toArray())walk(n);return tidy(all.join(' '));
};
function inventory(html,wordpress){
 const $=load(html),root=$('main').clone();root.find('script,style,noscript').remove();
 // Animated digit reels are presentation, not ten additional factual counts.
 root.find('.bt_bb_counter').each((_,el)=>$(el).text($(el).find('.onedigit').map((_,d)=>$(d).attr('data-digit')).get().join('')));
 const pageText=text($,root),tokens=words(pageText),phrases=[];
 const selectors='h1,h2,h3,h4,h5,h6,p,li,td,th,.bt_bb_icon_holder,.bt_bb_headline_subheadline,.bt_bb_special_headline_subheadline,.bt_bb_service_content_text';
 root.find(selectors).each((_,el)=>{const value=text($,$(el));if(value&&!$(el).find(selectors).length)phrases.push({tag:el.tagName,text:value});});
 const images=new Set(root.find('img[src]').map((_,el)=>$(el).attr('src')).get());
 for(const el of root.find('[style]').toArray())for(const match of ($(el).attr('style')||'').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g))images.add(match[1]);
 return {text:pageText,tokens,phrases,headings:root.find('h1,h2,h3,h4,h5,h6').map((_,el)=>text($,$(el))).get(),links:root.find('a[href]').map((_,el)=>({label:text($,$(el)),href:$(el).attr('href')})).get(),images:[...images],tables:root.find('table').length,tableRows:root.find('table tr').length,iframes:root.find('iframe').map((_,el)=>({src:$(el).attr('src'),title:$(el).attr('title')})).get(),forms:root.find('form').length,faq:root.find(wordpress?'.bt_bb_accordion_item':'details').length,sections:root.find(wordpress?'.bt_bb_section':'.cms-page-content>section').length};
}
async function capture(url,file){
 if(cached)return readFile(folder+'/'+file,'utf8');
 const r=await fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error('HTTP '+r.status+' for '+url);
 const html=await r.text();await writeFile(folder+'/'+file,html);return html;
}
const reports=[];
for(let start=0;start<source.pages.length;start+=3){
 const batch=await Promise.allSettled(source.pages.slice(start,start+3).map(async p=>{
  const [wpHtml,currentHtml,v2Html]=await Promise.all([capture(p.originalUrl,p.slug+'-wordpress.html'),capture(base+p.slug+'/',p.slug+'-current.html'),capture(base+'v2/'+p.slug+'/',p.slug+'-v2.html')]);
  const wp=inventory(wpHtml,true),current=inventory(currentHtml,false),v2=inventory(v2Html,false);
  const findMissing=target=>wp.phrases.filter(p=>words(p.text).length>=5&&!target.tokens.join(' ').includes(words(p.text).join(' ')));
  return {slug:p.slug,title:p.title,sourceUrl:p.originalUrl,sourceSha256:createHash('sha256').update(wpHtml).digest('hex'),wordpress:wp,current:{...current,unmatchedSourcePhrases:findMissing(current)},v2:{...v2,unmatchedSourcePhrases:findMissing(v2)}};
 }));
 for(const result of batch){if(result.status!=='fulfilled')throw result.reason;reports.push(result.value);}
}
await writeFile('reference/audit/full-page-review'+(after?'-after':'')+'.json',JSON.stringify({capturedAt:cached?'2026-10-12T01:38:00.709Z':new Date().toISOString(),method:'Fresh public WordPress HTML versus deployed current/V2 HTML, including icon text and subheadlines with counter reels normalized; phrase differences are candidates requiring semantic review, not automatic loss claims.',pages:reports},null,2));
console.log(JSON.stringify(reports.map(p=>({slug:p.slug,words:[p.wordpress.tokens.length,p.current.tokens.length,p.v2.tokens.length],images:[p.wordpress.images.length,p.current.images.length,p.v2.images.length],tables:[p.wordpress.tables,p.current.tables,p.v2.tables],unmatchedV2:p.v2.unmatchedSourcePhrases.map(p=>p.text.slice(0,170))})),null,2));
