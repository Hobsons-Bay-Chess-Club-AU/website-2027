import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveEntries,normalizeContent} from '../src/lib/content-source.mjs';
import {contentVersion} from '../src/lib/content-versions.mjs';
import {getContent,withContentRequest} from '../src/lib/content.mjs';
import {v2Promotion} from '../scripts/v2-promotion.mjs';
import {createSnapshotLoader} from '../src/lib/server/content-cache.mjs';
import {previewSession,validPreviewSession,localReturnPath,webhookEvent,contentPaths} from '../src/lib/server/security.mjs';
import {previewPath} from '../src/lib/server/preview-path.mjs';

const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
const schema=JSON.parse(await readFile('contentful/schema.json','utf8'));
const plan=v2Promotion({items:fixture.items,includes:{Asset:fixture.assets}},schema.contentTypes);
const native=()=>resolveEntries([...fixture.items,...plan.entries.map(e=>({sys:{id:e.id,contentType:{sys:{id:e.type}}},fields:Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v['en-US']]))}))],fixture.assets);
const projected=()=>normalizeContent(contentVersion(native(),'v2'));

test('V2 promotion preserves original records and makes the approved menus native and editable',()=>{
 const original=JSON.stringify(fixture);
 const entries=native(),v2=normalizeContent(contentVersion(entries,'v2')),current=normalizeContent(contentVersion(entries,'current'));
 assert.equal(current.pages.length,14);assert.equal(v2.pages.length,17);
 assert.equal(current.settings.mainMenu.items[0].label,'Home');
 assert.deepEqual(v2.settings.mainMenu.items.map(i=>i.label),['Play','Calendar','Tournaments','Coaching','Club','News']);
 entries.find(e=>e.id===v2.settings.mainMenu.items[0].id).label='Visit and Play';
 assert.equal(normalizeContent(contentVersion(entries,'v2')).settings.mainMenu.items[0].label,'Visit and Play');
 assert.equal(JSON.stringify(fixture),original);
});

test('native V2 page references follow CMS slug edits and retain policy and calendar destinations',()=>{
 const entries=native();entries.find(e=>e.id==='v2-wp-page-4424').slug='join-hbcc';
 const c=normalizeContent(contentVersion(entries,'v2'));
 assert.equal(c.settings.headerActions.items[0].href,'/join-hbcc/');
 assert.equal(c.settings.policyPage.sys.id,'v2-wp-page-5242');
 const calendar=c.pages.find(p=>p.slug==='calendar').sections.find(s=>s.calendar).calendar;
 assert.equal(calendar.reviewVersion,'v2');assert.ok(calendar.annualPdf);
 assert.equal(calendar.events.find(e=>e.title==='Term 4 Coaching #4').startDate,'2026-11-07');
});

test('request content is shared within a render and isolated between simultaneous draft and public renders',async()=>{
 let calls=0;
 const render=label=>withContentRequest(async()=>{calls++;await new Promise(r=>setTimeout(r,2));return {label};},async()=>{const results=await Promise.all([getContent(),getContent(),getContent()]);assert.ok(results.every(c=>c.label===label));});
 await Promise.all([render('published'),render('draft')]);assert.equal(calls,2);
});

test('CMS pages cannot replace the private editor or webhook endpoints',()=>{
 for(const slug of ['api','api/preview','editor','editor/login']){
  const entries=native();entries.find(e=>e.id==='v2-wp-page-4424').slug='v2-'+slug;
  assert.throws(()=>normalizeContent(contentVersion(entries,'v2')),/Reserved Contentful/);
 }
});

test('published snapshot cache deduplicates loads and refreshes after invalidation',async()=>{
 const map=new Map(),cache={get:async key=>map.get(key),set:async(key,value)=>map.set(key,value),delete:async key=>map.delete(key)};
 let calls=0;
 const loader=createSnapshotLoader({cache,load:async()=>{calls++;await new Promise(r=>setTimeout(r,2));return {revision:calls};}});
 const first=await Promise.all([loader.read(),loader.read(),loader.read()]);assert.equal(calls,1);assert.ok(first.every(v=>v.revision===1));
 await loader.read();assert.equal(calls,1);
 await loader.invalidate();assert.equal((await loader.read()).revision,2);
});

test('a snapshot loading before invalidation cannot overwrite the fresh cache',async()=>{
 const map=new Map(),cache={get:async key=>map.get(key),set:async(key,value)=>map.set(key,value),delete:async key=>map.delete(key)};
 let oldResolve,started;const began=new Promise(r=>{started=r;});let calls=0;
 const loader=createSnapshotLoader({cache,load:()=>++calls===1?new Promise(r=>{oldResolve=r;started();}):Promise.resolve({revision:2})});
 const old=loader.read();await began;await loader.invalidate();await loader.read();oldResolve({revision:1});await old;
 assert.equal((await loader.read()).revision,2);
});

test('draft sessions reject tampering, expired signatures and excessive lifetimes',()=>{
 const secret='a'.repeat(48),now=Date.now(),session=previewSession(secret,now);
 assert.equal(validPreviewSession(session,secret,now),true);
 assert.equal(validPreviewSession(session+'x',secret,now),false);
 assert.equal(validPreviewSession(session,secret,now+7200001),false);
 assert.equal(validPreviewSession(session,'b'.repeat(48),now),false);
 assert.equal(validPreviewSession('NaN.bad',secret,now),false);
});

test('preview redirects stay local and entry previews find the selected page through shared sections',()=>{
 for(const value of ['https://evil.example/','//evil.example/','/\\evil/','/../','/api/revalidate/','/editor/login/','/membership/?secret=x'])assert.equal(localReturnPath(value),'/');
 assert.equal(localReturnPath('/membership/'),'/membership/');
 const c=projected();assert.equal(previewPath(c,'v2-wp-page-4424'),'/membership/');
 assert.equal(previewPath(c,'v2-hbcc-site-settings'),'/');
 assert.equal(previewPath(c,c.pages.find(p=>p.slug==='membership').sections[0].id),'/membership/');
 assert.equal(previewPath(c,'missing-entry'),null);
});

test('webhooks enforce scope and only revalidate trusted published paths',()=>{
 const payload={sys:{id:'entry-id',space:{sys:{id:'space'}},environment:{sys:{id:'master'}},publishedCounter:3}};
 assert.equal(webhookEvent(payload,'ContentManagement.Entry.publish',{space:'space',environment:'master'}).revision,3);
 assert.throws(()=>webhookEvent(payload,'ContentManagement.Entry.save',{space:'space',environment:'master'}));
 assert.throws(()=>webhookEvent(payload,'ContentManagement.Entry.publish',{space:'other',environment:'master'}));
 const paths=contentPaths(projected());assert.ok(paths.includes('/membership/'));assert.ok(paths.includes('/calendar.ics'));assert.ok(!paths.some(p=>p.startsWith('/api/')));
});
