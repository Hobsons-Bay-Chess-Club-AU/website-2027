export const calendarCategories = {
 seniors:'Seniors', juniors:'Juniors', coaching:'Coaching', external:'External tournaments',
 social:'Social', training:'Training', club:'Club events', closed:'No club chess'
};
export function dateOnly(value) {
 const date=String(value||'').slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new Error('Invalid calendar date '+date);
 return date;
}
export function addDays(date,days=1) {
 const value=new Date(dateOnly(date)+'T00:00:00Z');value.setUTCDate(value.getUTCDate()+days);return value.toISOString().slice(0,10);
}
export function normalizeCalendarEvents(events) {
 return events.filter(e=>e.enabled!==false&&!e.needsReview).map(e=>{
  const startDate=dateOnly(e.startDate),endDate=dateOnly(e.endDate||e.startDate);
  if(endDate<startDate)throw new Error('Calendar event ends before it starts: '+e.title);
  if(!e.title||!calendarCategories[e.category])throw new Error('Calendar event needs a title and category.');
  return {...e,startDate,endDate};
 }).sort((a,b)=>a.startDate.localeCompare(b.startDate)||a.category.localeCompare(b.category)||a.title.localeCompare(b.title));
}
export function eventsInMonth(events,month,category='all') {
 if(!/^\d{4}-\d{2}$/.test(month))throw new Error('Invalid calendar month.');
 const first=month+'-01',value=new Date(first+'T00:00:00Z');value.setUTCMonth(value.getUTCMonth()+1);
 const last=addDays(value.toISOString().slice(0,10),-1);
 return events.filter(e=>e.startDate<=last&&e.endDate>=first&&(category==='all'||e.category===category));
}
export function calendarMonth(events,today=new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Melbourne'})) {
 const month=today.slice(0,7);
 return events.some(e=>e.startDate.slice(0,4)===today.slice(0,4))?month:(events[0]?.startDate.slice(0,7)||month);
}
const escapeIcs=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function foldLine(value) {
 const encoder=new TextEncoder(),lines=[];let line='',bytes=0;
 for(const character of value){const size=encoder.encode(character).length;if(bytes+size>75){lines.push(line);line=' ';bytes=1;}line+=character;bytes+=size;}
 lines.push(line);return lines.join('\r\n');
}
export function calendarIcs(events,{title='HBCC club calendar',generatedAt=new Date().toISOString()}={}) {
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Hobsons Bay Chess Club//Club Calendar//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:'+escapeIcs(title)];
 const stamp=generatedAt.replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
 for(const e of normalizeCalendarEvents(events)) {
  const details=[e.details,e.schoolSchedule,e.arbiter&&'Arbiters: '+e.arbiter].filter(Boolean).join('\n');
  lines.push('BEGIN:VEVENT','UID:'+String(e.id).replace(/[^a-zA-Z0-9_-]/g,'')+'@hobsonsbaychess.com','DTSTAMP:'+stamp,
   'DTSTART;VALUE=DATE:'+e.startDate.replaceAll('-',''),'DTEND;VALUE=DATE:'+addDays(e.endDate).replaceAll('-',''),
   'SUMMARY:'+escapeIcs(e.title),'CATEGORIES:'+escapeIcs(calendarCategories[e.category]),'DESCRIPTION:'+escapeIcs(details),'TRANSP:TRANSPARENT','END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(foldLine).join('\r\n')+'\r\n';
}
