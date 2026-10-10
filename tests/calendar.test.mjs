import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {calendarFromCsv,parseSheetDates} from '../scripts/parse-calendar-sheet.mjs';
import {eventsInMonth,calendarIcs,normalizeCalendarEvents} from '../src/lib/calendar.mjs';
import {normalizeContent,resolveEntries,referenceContent} from '../src/lib/content-source.mjs';
test('calendar converts Excel single dates and Australian date ranges without swapping October and March',()=>{
 assert.deepEqual(parseSheetDates('10/13/2026','Tuesday'),{startDate:'2026-10-13',endDate:'2026-10-13',issues:[]});
 assert.deepEqual(parseSheetDates('3/10/2026- 4/10/2026','Saturday- Sunday'),{startDate:'2026-10-03',endDate:'2026-10-04',issues:[]});
 assert.deepEqual(parseSheetDates('27/11- 29/11/2026','Fri- Sun'),{startDate:'2026-11-27',endDate:'2026-11-29',issues:[]});
});
test('all 119 source rows are retained and three conflicting dates are marked for review',async()=>{
 const result=calendarFromCsv(await readFile('reference/calendar/schedule-2026.csv','utf8'));
 assert.equal(result.sourceRows,119);assert.equal(result.events.length,153);assert.deepEqual(result.issues.map(i=>i.sourceRow),[56,63,83]);
 assert.equal(normalizeCalendarEvents(result.events).length,150);
 assert.equal(result.events.find(e=>e.title==='Best in the West 2026').startDate,'2025-08-29');
 assert.equal(result.events.find(e=>e.title==='Best in the West 2026').enabled,false);
 assert.ok(result.events.some(e=>e.startDate==='2026-10-10'&&e.title==='Term 4 Coaching #1'));
});
test('month and category filters include overlapping multi-day events in both months',()=>{
 const calendar=referenceContent.pages.find(p=>p.slug==='calendar').sections.find(s=>s.kind==='calendar').calendar;
 const october=eventsInMonth(calendar.events,'2026-10'),november=eventsInMonth(calendar.events,'2026-11');
 const event=october.find(e=>e.title.includes('GREG HJORTH'));assert.ok(event);assert.ok(november.some(e=>e.id===event.id));
 assert.ok(eventsInMonth(calendar.events,'2026-10','coaching').every(e=>e.category==='coaching'));
});
test('calendar title and dates can be changed using native Contentful event fields',async()=>{
 const data=JSON.parse(await readFile('src/data/cms.json','utf8')),entry=data.items.find(e=>e.sys.contentType.sys.id==='calendarEvent'&&e.fields.title==='Term 4 Coaching #1');
 entry.fields.title='Updated coaching session';entry.fields.startDate='2026-10-11';entry.fields.endDate='2026-10-11';
 const content=normalizeContent(resolveEntries(data.items,data.assets));
 const event=content.pages.find(p=>p.slug==='calendar').sections[0].calendar.events.find(e=>e.id===entry.sys.id);
 assert.equal(event.title,'Updated coaching session');assert.equal(event.startDate,'2026-10-11');
});
test('iCalendar retains whole-day local dates, exclusive final dates, Unicode and safe text',()=>{
 const input={id:'test',title:'Chess, café; juniors',category:'juniors',startDate:'2026-10-31',endDate:'2026-11-03',details:'Line one\nBEGIN:VEVENT'};
 const ics=calendarIcs([input],{generatedAt:'2026-10-10T00:00:00Z'});
 assert.match(ics,/DTSTART;VALUE=DATE:20261031/);assert.match(ics,/DTEND;VALUE=DATE:20261104/);
 assert.ok(ics.includes('Chess\\, café\\; juniors'));assert.equal((ics.match(/\r\nBEGIN:VEVENT\r\n/g)||[]).length,1);
 const long=calendarIcs([{...input,title:'♟'.repeat(100)}]);
 assert.ok(long.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
});
