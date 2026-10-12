import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadContent,normalizeContent,resolveEntries} from '../src/lib/content-source.mjs';
import {membershipPolicyUpdate} from '../scripts/membership-policy-update.mjs';
import {aboutLayoutUpdate} from '../scripts/about-layout-update.mjs';
const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
const fresh=()=>structuredClone(fixture);
const entry=(data,id)=>data.items.find(e=>e.sys.id===id).fields;
const normalized=data=>normalizeContent(resolveEntries(data.items,data.assets));
const page=(c,slug)=>c.pages.find(p=>p.slug===slug);
const sections=p=>p.sections.flatMap(function walk(s){return [s,...s.children.flatMap(walk)];});

test('membership fees, benefits, steps and FAQ use editable native entries in both versions',async()=>{
 for(const variant of ['current','v2']){
  const c=await loadContent({env:{CONTENT_SOURCE:'reference',SITE_VARIANT:variant}}),m=page(c,'membership');
  const fees=m.sections.find(s=>s.layoutStyle==='pricing');
  assert.deepEqual(fees.cards.map(c=>c.price),['$90','$70','$50','$90+','$40+']);
  assert.ok(fees.cards.every(c=>c.link.href.startsWith('https://')&&c.presentation==='pricing'));
  assert.equal(m.sections.find(s=>s.layoutStyle==='benefits').cards.length,4);
  assert.equal(sections(m).find(s=>s.layoutStyle==='steps').cards.length,4);
  assert.equal(m.sections.find(s=>s.kind==='accordion').cards.length,5);
  const links=sections(m).flatMap(s=>s.actions);
  for(const [label,slug] of [['Member Etiquette','member-etiquette'],['Privacy Policy','privacy-and-photography'],['Venue Rules (for tournaments)','open-tournament-rules']])assert.equal(links.find(a=>a.label===label).href,'/policies/#'+slug);
  assert.equal(m.heroActions[0].href,'https://portal.hobsonsbaychess.com/public/membership_levels');
 }
 const data=fresh();entry(data,'membership-fee-0').price='$95';entry(data,'membership-fee-0').title='Edited fee label';
 const fee=page(normalized(data),'membership').sections[0].cards[0];assert.equal(fee.price,'$95');assert.equal(fee.title,'Edited fee label');
});

test('policy documents, ordering, visibility and stable links follow native CMS fields',()=>{
 const data=fresh(),p=entry(data,'hbcc-policy-etiquette'),policySection=entry(data,'wp-page-5242-section-0');
 assert.equal(page(normalized(data),'policies').sections[0].policies.length,7);
 p.title='Updated Etiquette';p.slug='updated-etiquette';
 const asset=data.assets.find(a=>a.sys.id===p.document.sys.id);asset.fields.file.url='//assets.ctfassets.net/test/revised.pdf';
 policySection.policies.reverse();entry(data,'wp-page-5242').slug='club-policies';
 let c=normalized(data),policies=page(c,'club-policies').sections[0].policies;
 assert.equal(policies[0].id,'hbcc-policy-coaching');
 assert.equal(policies.find(p=>p.id==='hbcc-policy-etiquette').document,'https://assets.ctfassets.net/test/revised.pdf');
 assert.equal(c.entries['hbcc-policy-etiquette'].title,'Updated Etiquette');
 assert.equal(sections(page(c,'membership')).flatMap(s=>s.actions).find(a=>a.label==='Member Etiquette').href,'/club-policies/#updated-etiquette');
 assert.equal(sections(page(c,'tournaments')).flatMap(s=>s.actions).find(a=>a.label==='View Rules').href,'/club-policies/#open-tournament-rules');
 p.enabled=false;c=normalized(data);
 assert.equal(page(c,'club-policies').sections[0].policies.length,6);
 assert.equal(sections(page(c,'membership')).flatMap(s=>s.actions).find(a=>a.label==='Member Etiquette').href,'/club-policies/');
 p.enabled=true;delete p.document;
 assert.throws(()=>normalized(data),/approved document or policy text/);
});

test('About restores the original introduction, committee, volunteers, arbiters and logo links',async()=>{
 const source=JSON.parse(await readFile('reference/audit/about-restoration.json','utf8'));
 for(const variant of ['current','v2']){
  const c=await loadContent({env:{CONTENT_SOURCE:'reference',SITE_VARIANT:variant}}),about=page(c,'about-us');
  assert.equal(about.heroTitle,source.heroTitle);assert.equal(about.heroDescription,source.heroDescription);
  const ss=sections(about),intro=ss.find(s=>s.id==='about-introduction-copy');
  for(const paragraph of source.introduction)assert.ok(intro.bodyHtml.includes(paragraph.replaceAll("'",'&#39;')));
  assert.deepEqual(ss.find(s=>s.id==='wp-page-11-section-1').cards.map(c=>c.title),source.committee.map(p=>p.name));
  assert.deepEqual(ss.find(s=>s.id==='about-volunteer-list').cards.map(c=>c.title),source.volunteers.map(p=>p.name));
  assert.deepEqual(ss.find(s=>s.id==='wp-page-11-section-4').cards.map(c=>c.title),source.arbiters.map(p=>p.name));
  assert.equal(ss.find(s=>s.layoutStyle==='affiliations').gallery.length,3);
  assert.ok(ss.find(s=>s.id==='about-governance-copy').actions.every(a=>a.href.startsWith('/policies/')));
 }
 const data=fresh();entry(data,'about-committee-0').description='Edited committee role';
 assert.equal(page(normalized(data),'about-us').sections[1].cards[0].description,'Edited committee role');
});

test('one-time layout migrations preserve subsequent editorial changes',()=>{
 const items=fixture.items.map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...structuredClone(e.fields)}));
 const fee=items.find(e=>e.id==='membership-fee-0');fee.price='$95';
 const committee=items.find(e=>e.id==='about-committee-0');committee.description='Edited role';
 assert.ok(!membershipPolicyUpdate(items).some(e=>e.id===fee.id));
 assert.deepEqual(aboutLayoutUpdate(items),[]);
});
