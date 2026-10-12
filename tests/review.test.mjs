import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {loadContent,normalizeContent,resolveEntries,referenceContent} from '../src/lib/content-source.mjs';
import {createReviewEntries} from '../src/lib/review-content.mjs';
import {readCalendarState,writeCalendarState,visibleCalendarEvents} from '../src/lib/calendar-state.mjs';

const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
const raw=()=>resolveEntries(fixture.items,fixture.assets);
const review=()=>normalizeContent(createReviewEntries(raw()));
const page=(c,slug)=>c.pages.find(p=>p.slug===slug);
const calendar=c=>page(c,'calendar').sections.find(s=>s.calendar).calendar.events;
const hrefFor=(p,label)=>{
 const visit=s=>[...s.actions,...s.cards.flatMap(c=>c.link?[c.link]:[]),...s.children.flatMap(visit)];
 const action=p.sections.flatMap(visit).find(a=>a.label.toLowerCase()===label.toLowerCase());
 if(action)return action.href;
 const bodies=s=>[s.bodyHtml,...s.children.flatMap(bodies)];
 const $=load(p.sections.flatMap(bodies).join(''));
 return $('a').toArray().find(a=>$(a).text().trim().toLowerCase()===label.toLowerCase())?.attribs.href;
};

test('V2 is an opt-in isolated proposal and leaves the current CMS content unchanged',async()=>{
 const source=raw(),before=JSON.stringify(source);createReviewEntries(source);
 assert.equal(JSON.stringify(source),before);
 const current=await loadContent({env:{CONTENT_SOURCE:'reference'}}),v2=await loadContent({env:{CONTENT_SOURCE:'reference',SITE_VARIANT:'v2'}});
 assert.equal(current.pages.length,14);assert.equal(current.settings.reviewVersion,undefined);
 assert.equal(current.settings.mainMenu.items[0].label,'Home');
 assert.deepEqual(v2.settings.mainMenu.items.map(i=>i.label),['Play','Calendar','Tournaments','Coaching','Club','News']);
 assert.equal(v2.pages.length,17);
 assert.equal(current.settings.footerMenus[0].items.find(i=>i.id==='footer-club-3').href,referenceContent.settings.footerMenus[0].items.find(i=>i.id==='footer-club-3').href);
});

test('review link repairs reach the correct destinations and preserve standings purpose',()=>{
 const c=review();
 assert.equal(hrefFor(page(c,'play-chess'),'View Calendar'),'/calendar/');
 assert.equal(hrefFor(page(c,'play-chess'),'Find Social Nights'),'/calendar/?category=social&view=upcoming');
 assert.equal(hrefFor(page(c,'membership'),'Renew Now'),'https://portal.hobsonsbaychess.com/public/membership_levels');
 assert.equal(hrefFor(page(c,'membership'),'View Juniors Program'),'/juniors/');
 assert.equal(hrefFor(page(c,'juniors'),'Enrol in Juniors'),'/coaching/#enrol');
 assert.equal(c.home.sections.find(s=>s.kind==='leaderboardEvents').actions[0].href,'https://tournament.hobsonsbaychess.com/v2/leaderboard/open');
 assert.equal(c.settings.footerMenus[0].items.find(i=>i.id==='footer-club-3').href,'https://tournament.hobsonsbaychess.com/v2/');
 assert.ok(!c.settings.legalMenu.items.some(i=>i.label==='Cookie Policy'));
});

test('page references retain fragments through slug changes and duplicate anchors fail',()=>{
 const entries=createReviewEntries(raw());
 entries.find(e=>e.id==='wp-page-4272').slug='club-chess';
 const c=normalizeContent(entries);
 assert.equal(c.settings.mainMenu.items[0].children[0].href,'/club-chess/#first-visit');
 entries.find(e=>e.id==='wp-page-4272-section-2').anchor='first-visit';
 assert.throws(()=>normalizeContent(entries),/Duplicate section anchor/);
 entries.find(e=>e.id==='wp-page-4272-section-2').anchor='bad value';
 assert.throws(()=>normalizeContent(entries),/stable section ID/);
});

test('coaching and Juniors use one roster derived from the published coach source',()=>{
 const entries=raw(),source=entries.find(e=>e.id==='wp-page-4332-section-5');
 entries.find(e=>e.id===source.cards[0].sys.id).description='Coaching coordinator';
 source.body.content.push({nodeType:'paragraph',data:{},content:[{nodeType:'text',value:'Additional CMS coaching introduction.',marks:[],data:{}}]});
 const c=normalizeContent(createReviewEntries(entries));
 const coaches=page(c,'coaching').sections.find(s=>s.anchor==='coaches').cards;
 assert.deepEqual(coaches.map(c=>c.title),['Anirudh Krishnan','Tony Davis','Ronald Enano','Joemar Lacson']);
 assert.equal(coaches[0].description,'Coaching coordinator');
 assert.ok(page(c,'coaching').sections.find(s=>s.anchor==='coaches').bodyHtml.includes('Additional CMS coaching introduction.'));
 assert.deepEqual(page(c,'juniors').sections.find(s=>s.anchor==='coaches').cards,coaches);
 const text=Object.values(c.entries).map(e=>JSON.stringify(e.body||'')).join('');
 assert.ok(!text.includes('bold_timeline'));assert.ok(!text.includes('[X]'));
});

test('Term 4 corrections preserve the junior round, original imported text and v1 dates',()=>{
 const c=review(),events=calendar(c),lessons=events.filter(e=>/^Term 4 Coaching #/.test(e.title));
 assert.deepEqual(lessons.map(e=>e.startDate),['2026-10-10','2026-10-17','2026-10-24','2026-11-07','2026-11-14','2026-11-21','2026-11-28','2026-12-05']);
 assert.ok(events.some(e=>e.startDate==='2026-10-31'&&e.category==='juniors'));
 assert.ok(events.some(e=>e.startDate==='2026-11-28'&&e.closureScope==='Junior competition'));
 assert.ok(!events.some(e=>e.startDate==='2026-11-28'&&e.category==='closed'));
 assert.equal(lessons[3].sourceDateText,'10/31/2026');assert.ok(lessons.every(e=>e.verifiedSource&&e.url));
 assert.equal(calendar(referenceContent).find(e=>e.title==='Term 4 Coaching #4').startDate,'2026-10-31');
});

test('calendar URL state survives round-trip and ignores invalid filters or months',()=>{
 const defaults={month:'2026-10',view:'agenda',minimum:'2026-01',maximum:'2026-12'};
 const state=readCalendarState('?category=coaching&view=upcoming&month=2026-11',defaults);
 assert.deepEqual(state,{month:'2026-11',category:'coaching',view:'upcoming'});
 const url=writeCalendarState('https://example.com/website-2027/v2/calendar/?campaign=team#main',state);
 assert.match(url,/^\/website-2027\/v2\/calendar\/\?/);assert.match(url,/campaign=team/);assert.match(url,/#main$/);
 assert.deepEqual(readCalendarState(new URL(url,'https://example.com').search,defaults),state);
 assert.deepEqual(readCalendarState('?category=toString&month=2026-13&view=bad',defaults),{month:'2026-10',category:'all',view:'agenda'});
 assert.equal(readCalendarState('?month=2027-01',defaults).month,'2026-10');
});

test('upcoming agenda includes ongoing and future months while excluding ended events',()=>{
 const events=calendar(review()),state={month:'2026-10',category:'coaching',view:'upcoming'};
 const visible=visibleCalendarEvents(events,state,'2026-10-12');
 assert.ok(visible.every(e=>e.endDate>='2026-10-12'&&e.category==='coaching'));
 assert.ok(visible.some(e=>e.startDate==='2026-12-05'));
 assert.ok(!visible.some(e=>e.startDate==='2026-10-10'));
 assert.ok(!visibleCalendarEvents(events,{...state,view:'agenda'},'2026-10-12').some(e=>e.startDate==='2026-12-05'));
 assert.equal(visibleCalendarEvents(events,state,'2027-01-01').length,0);
});
