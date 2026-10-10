import {readFile,writeFile} from 'node:fs/promises';
import {calendarFromCsv} from './parse-calendar-sheet.mjs';
const sourceUrl='https://docs.google.com/spreadsheets/d/e/2PACX-1vRIr-eFPQCMvn-TbOfLNzHheAVduNUKX2wOTsYjJOM8zf_uhqe3B3H8Z01bofnCPg/pubhtml?widget=true&headers=false';
const result=calendarFromCsv(await readFile('reference/calendar/schedule-2026.csv','utf8'),{year:2026,sourceUrl});
const seed=JSON.parse(await readFile('contentful/seed.json','utf8'));
seed.entries=seed.entries.filter(e=>!['calendarEvent','calendarSchedule'].includes(e.sys.contentType.sys.id));
const link=id=>({sys:{type:'Link',linkType:'Entry',id}});
const add=(type,id,fields)=>seed.entries.push({sys:{id,type:'Entry',contentType:{sys:{type:'Link',linkType:'ContentType',id:type}}},fields:Object.fromEntries(Object.entries(fields).filter(([k,v])=>k!=='issues'&&v!==undefined&&v!=='').map(([key,value])=>[key,{[seed.locale]:value}]))});
for(const {id,...fields} of result.events)add('calendarEvent',id,fields);
add('calendarSchedule','hbcc-calendar-2026',{title:'2026 club calendar',year:2026,sourceUrl,description:'Club nights, junior tournaments, coaching and special events.',events:result.events.filter(e=>!e.needsReview).map(e=>link(e.id))});
const section=seed.entries.find(e=>e.sys.id==='wp-page-5225-calendar');
section.fields.internalName={[seed.locale]:'Calendar — 2026 club schedule'};
section.fields.kind={[seed.locale]:'calendar'};
section.fields.calendar={[seed.locale]:link('hbcc-calendar-2026')};
section.fields.title={[seed.locale]:'Club calendar'};
delete section.fields.body;
const calendarPage=seed.entries.find(e=>e.sys.id==='wp-page-5225');
calendarPage.fields.description={[seed.locale]:'See HBCC club nights, junior chess, coaching and special events in the 2026 calendar.'};
for(const entry of seed.entries)if(entry.sys.contentType.sys.id==='navigationItem'&&entry.fields.label?.[seed.locale]==='Calendar'){
 entry.fields.page={[seed.locale]:link('wp-page-5225')};delete entry.fields.url;delete entry.fields.tournamentFeed;delete entry.fields.tournamentDestination;
}
await writeFile('contentful/seed.json',JSON.stringify(seed,null,2));
await writeFile('reference/calendar/import-audit.json',JSON.stringify({...result,capturedAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({sourceRows:result.sourceRows,events:result.events.length,visible:result.events.filter(e=>!e.needsReview).length,rowsNeedingReview:result.issues},null,2));
