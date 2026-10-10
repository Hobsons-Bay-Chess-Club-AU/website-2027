import {getContent} from '../lib/content.mjs';
import {calendarIcs} from '../lib/calendar.mjs';
export async function GET(){
 const content=await getContent(),schedules=Object.values(content.entries).filter((entry:any)=>entry.type==='calendarSchedule');
 const events=content.pages.flatMap(page=>page.sections.filter(s=>s.kind==='calendar').flatMap(s=>s.calendar?.events||[]));
 const unique=[...new Map(events.map(e=>[e.id,e])).values()];
 return new Response(calendarIcs(unique,{title:schedules[0]?.title||'HBCC club calendar'}),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="hbcc-club-calendar.ics"'}});
}
