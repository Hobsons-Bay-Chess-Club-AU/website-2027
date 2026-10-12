import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';

const tidy=value=>value.replace(/\s+/g,' ').trim();
const text=($,node)=>{
 const values=[],walk=n=>{if(n.type==='text')values.push(n.data);else for(const child of n.children||[])walk(child);};
 node.toArray().forEach(walk);return tidy(values.join(' '));
};
const sources={};
for(const slug of ['play-chess','juniors','tournaments','sponsors','contact','champions']){
 const html=await readFile('reference/screenshots/page-review/'+slug+'-wordpress.html','utf8'),$=load(html);
 const sections=$('main .bt_bb_section'),hero=sections.first();
 sources[slug]={url:'https://hobsonsbaychess.com/'+slug+'/',sha256:createHash('sha256').update(html).digest('hex'),heroTitle:text($,hero.find('.bt_bb_headline_content').first()),heroDescription:text($,hero.find('.bt_bb_headline_subheadline').first()),
  sections:sections.slice(1).toArray().map(s=>({heading:text($,$(s).find('.bt_bb_headline_content').first()),intro:text($,$(s).find('.bt_bb_headline_subheadline').first()),icons:$(s).find('.bt_bb_icon').toArray().map(i=>text($,$(i))).filter(Boolean)}))};
}
const html=await readFile('reference/screenshots/page-review/2025-championship-standings.html','utf8'),$=load(html);
const row=$('table tr').filter((_,tr)=>$(tr).find('td').first().text().trim()==='1').first();
if(!$('body').text().includes('Standings at round 7')||!row.text().includes('McIntyre,Julian')||!row.text().includes('5.0'))throw new Error('Review the final championship results before adding a winner.');
const champion2025={year:2025,playerName:'Julian McIntyre',score:'5 points',standingsUrl:'https://tournament.hobsonsbaychess.com/www2025HobsonsBayClubChampionship/standings.html',verifiedAt:'2026-10-12',sourceSha256:createHash('sha256').update(html).digest('hex'),sourceHeading:'Standings at round 7'};
await writeFile('reference/audit/page-restoration.json',JSON.stringify({capturedAt:'2026-10-12',sources,champion2025},null,2));
console.log(JSON.stringify({sourcePages:Object.keys(sources),missingIconGroups:Object.fromEntries(Object.entries(sources).map(([slug,s])=>[slug,s.sections.map(x=>x.icons.length)])),champion2025}));
