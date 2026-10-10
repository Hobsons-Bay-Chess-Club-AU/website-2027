import {createHash} from 'node:crypto';
import {dateOnly} from '../src/lib/calendar.mjs';
export function parseCsv(input) {
 const rows=[];let row=[],cell='',quoted=false;
 const source=input.replace(/^\uFEFF/,'');
 for(let i=0;i<source.length;i++){
  const c=source[i];
  if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(c===','&&!quoted){row.push(cell);cell='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell='';}
  else cell+=c;
 }
 if(quoted)throw new Error('Calendar CSV has an unterminated quoted value.');
 row.push(cell);if(row.some(v=>v.trim()))rows.push(row);return rows;
}
const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function makeDate(parts,order,year) {
 const [a,b,c]=parts.map(Number),y=c||year,m=order==='mdy'?a:b,d=order==='mdy'?b:a;
 if(!y||m<1||m>12||d<1||d>31)return null;
 try{return dateOnly(String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'));}catch{return null;}
}
export function parseSheetDates(raw,day,year=2026) {
 const parts=raw.trim().split(/\s*-\s*/),range=parts.length===2;
 const endYear=Number(parts.at(-1).split('/')[2])||year;
 const parse=(value,order)=>makeDate(value.trim().split('/'),order,endYear);
 const start=parse(parts[0],range?'dmy':'mdy'),end=range?parse(parts[1],'dmy'):start;
 if(!start||!end)throw new Error('Unreadable calendar source date '+raw);
 const expected=day.split('-').map(v=>v.trim().slice(0,3).replace('Tues','Tue').replace('Thurs','Thu'));
 const actual=value=>weekdays[new Date(value+'T00:00:00Z').getUTCDay()];
 const issues=[];
 if(start.slice(0,4)!==String(year)||end.slice(0,4)!==String(year))issues.push('Source year differs from Schedule '+year+'.');
 if(end<start)issues.push('Source date range ends before it starts.');
 if(expected[0]!==actual(start)||range&&expected[1]!==actual(end))issues.push('Source weekday does not match the written date.');
 return {startDate:start,endDate:end,issues};
}
export function calendarFromCsv(csv,{year=2026,sourceUrl=''}={}) {
 const rows=parseCsv(csv),headers=rows.shift().map(v=>v.trim());
 const required=['DATE','DAY','EVENT TYPE','SENIORS  TOURNAMENTS','ROOKIES & JUNIORS TOURNAMENTS','COACHING'];
 if(required.some(key=>!headers.includes(key)))throw new Error('The calendar spreadsheet headers have changed. Review its format before importing.');
 const events=[],issues=[];
 rows.forEach((row,index)=>{
  const record=Object.fromEntries(headers.map((h,i)=>[h,(row[i]||'').trim()])),sourceRow=index+2;
  if(!record.DATE)return;
  const dates=parseSheetDates(record.DATE,record.DAY,year);
  if(dates.issues.length)issues.push({sourceRow,date:record.DATE,day:record.DAY,issues:dates.issues});
  const type=record['EVENT TYPE'],senior=record['SENIORS  TOURNAMENTS'],junior=record['ROOKIES & JUNIORS TOURNAMENTS'],coaching=record.COACHING;
  const useful=value=>value&&!/^(No Chess|Juniors only|Not Applicable)$/i.test(value);
  const common=type==='External'?'external':type==='Club Social Night'?'social':type==='Seminar'?'training':type==='AGM'?'club':null;
  const add=(title,category)=>{
   const id='calendar-'+year+'-'+createHash('sha256').update(sourceRow+'|'+category+'|'+title).digest('hex').slice(0,16);
   events.push({id,title,category,...dates,schoolSchedule:record['SCHOOL SCHEDULE'],eventType:type,
    arbiter:/^Not Applicable$/i.test(record.Arbiter)?'':record.Arbiter,sourceRow,sourceDateText:record.DATE,sourceDay:record.DAY,sourceUrl,
    needsReview:dates.issues.length>0,enabled:dates.issues.length===0,details:dates.issues.length?'Needs date review: '+dates.issues.join(' '):''});
  };
  if(useful(senior))add(senior,common||(senior.includes('Training')?'training':'seniors'));
  if(useful(junior)&&junior!==senior)add(junior,common||'juniors');
  if(useful(coaching))add(coaching,'coaching');
  if(!useful(senior)&&!useful(junior)&&!useful(coaching)&&(/No Chess/i.test(senior)||/No Chess/i.test(junior)))add('No club chess','closed');
 });
 return {year,sourceRows:rows.length,events,issues};
}
