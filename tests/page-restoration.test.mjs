import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadContent,normalizeContent,resolveEntries} from '../src/lib/content-source.mjs';
import {orderedChampions} from '../src/lib/champions.mjs';
import {pageRestorationUpdate} from '../scripts/page-restoration-update.mjs';
import source from '../reference/audit/page-restoration.json' with {type:'json'};

const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
const raw=()=>resolveEntries(structuredClone(fixture.items),fixture.assets);
const page=(c,slug)=>c.pages.find(p=>p.slug===slug);
const flatten=s=>[s,...s.children.flatMap(flatten)];
const sections=p=>p.sections.flatMap(flatten);
const pageText=p=>sections(p).map(s=>s.bodyHtml+' '+s.cards.map(c=>c.title+' '+(c.description||'')+' '+c.bodyHtml).join(' ')).join(' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');

test('fresh WordPress icon copy survives the native CMS conversion in both versions',async()=>{
 for(const variant of ['current','v2']){
  const c=await loadContent({env:{CONTENT_SOURCE:'reference',SITE_VARIANT:variant}});
  for(const [slug,indices] of [['play-chess',[1,2]],['juniors',[6]],['tournaments',[1,4]]]){
   const text=pageText(page(c,slug));
   for(const i of indices)for(const value of source.sources[slug].sections[i].icons){
    const copy=value.replace(/^[^:]+:\s*(?=Juniors|We expect|Please arrive|Important updates)/,'');
    assert.ok(text.includes(copy),variant+' '+slug+' omitted '+copy);
   }
  }
  assert.ok(pageText(page(c,'juniors')).includes(source.sources.juniors.sections[2].intro));
  assert.ok(pageText(page(c,'juniors')).includes(source.sources.juniors.sections[5].intro));
 }
});

test('2025 champion is sourced from final results and honours sort by year after CMS changes',()=>{
 const entries=raw(),c=normalizeContent(entries),champions=page(c,'champions').sections[0].champions;
 assert.equal(champions.length,12);assert.equal(champions[0].year,2025);assert.equal(champions[0].playerName,'Julian McIntyre');
 assert.equal(champions[0].standingsUrl,source.champion2025.standingsUrl);assert.equal(champions[0].score,'5 points');
 assert.ok(champions.every((e,i)=>i===0||champions[i-1].year>e.year));assert.ok(!champions.some(e=>e.year===2020||e.year===2021||e.year===2026));
 const honour=entries.find(e=>e.id==='wp-page-5008-section-0');honour.champions.reverse();
 entries.find(e=>e.id==='restored-club-champion-2025').playerName='Edited champion name';
 assert.equal(page(normalizeContent(entries),'champions').sections[0].champions[0].playerName,'Edited champion name');
 const winner={year:2025,playerName:'Julian McIntyre'};
 assert.throws(()=>orderedChampions([winner,{...winner}]),/Duplicate/);assert.throws(()=>orderedChampions([{...winner,year:2026.5}]),/valid year/);
 assert.throws(()=>orderedChampions([{...winner,standingsUrl:'javascript:alert(1)'}]),/public standings/);
 assert.deepEqual(orderedChampions([{...winner,enabled:false}]),[]);
});

test('all seven sponsor logos, original FAQs and Contentful descriptions remain editable',async()=>{
 for(const variant of ['current','v2']){
  const c=await loadContent({env:{CONTENT_SOURCE:'reference',SITE_VARIANT:variant}}),p=page(c,'sponsors'),listing=p.sections[0],names=variant==='current'?listing.sponsors.map(s=>s.name):listing.cards.map(c=>c.title);
  assert.equal(names.length,7);assert.ok(names.includes('Bacchus Marsh Grammar'));
  assert.equal(sections(p).find(s=>s.kind==='accordion').cards.length,4);
  if(variant==='v2')assert.ok(!sections(p).flatMap(s=>s.cards).some(c=>c.price));
 }
 const entries=raw();entries.find(e=>e.id==='restored-sponsor-bacchus-marsh-grammar').name='Updated supporter';
 assert.ok(page(normalizeContent(entries),'sponsors').sections[0].sponsors.some(s=>s.name==='Updated supporter'));
});

test('Contact retains map, arrival advice, forfeit periods, etiquette and working destinations',()=>{
 const c=normalizeContent(raw()),p=page(c,'contact'),all=sections(p),text=pageText(p),actions=all.flatMap(s=>s.actions);
 assert.ok(all.some(s=>s.kind==='embed'&&s.embedUrl.includes('google')));
 assert.ok(text.includes('30-minute forfeit period'));assert.ok(text.includes('20-minute forfeit period'));assert.ok(text.includes('five or seven weeks'));
 assert.equal(actions.find(a=>a.label==='Member Etiquette').href,'/policies/#member-etiquette');
 assert.equal(actions.find(a=>a.label==='Email the Club').href,'mailto:info@hobsonsbaychess.com');
 assert.ok(actions.every(a=>a.href!=='#'));assert.ok(!text.includes('message sent'));
});

test('re-running page restoration preserves subsequent editorial changes',()=>{
 const entries=fixture.items.map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...structuredClone(e.fields)}));
 entries.find(e=>e.id==='restored-club-champion-2025').playerName='Edited champion';
 entries.find(e=>e.id==='restored-club-calendar').label='Edited calendar action';
 entries.find(e=>e.id==='restored-parent-information-0').title='Edited parent guidance';
 assert.deepEqual(pageRestorationUpdate(entries),[]);
});
