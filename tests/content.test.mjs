import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {loadContent,resolveEntries,normalizeContent,referenceContent} from '../src/lib/content.mjs';
import {safeUrl,cleanHtml} from '../src/lib/sanitize.mjs';
import {renderRichText} from '../src/lib/render-rich-text.mjs';
import {leaderboardRows,tournamentDataUrl} from '../src/lib/leaderboard.mjs';
import {loadTournamentData,parseUpcomingEvents} from '../src/lib/tournaments.mjs';
import {validatePackage} from '../scripts/validate-cms.mjs';
const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
const fresh=()=>structuredClone(fixture);
const byId=(data,id)=>data.items.find(e=>e.sys.id===id);
const entryLink=id=>({sys:{type:'Link',linkType:'Entry',id}});
const normalize=data=>normalizeContent(resolveEntries(data.items,data.assets));
const env={CONTENTFUL_SPACEID:'test-space',CONTENTFUL_DELIVERY_API:'test-token',CONTENTFUL_PREVIEW_API:'preview-test-token'};
const response=body=>({ok:true,status:200,json:async()=>body});

test('empty read API keeps the local review; launch mode requires actual CMS content',async()=>{
 let auth,url;
 const content=await loadContent({env,fetch:async(u,o)=>{url=u;auth=o.headers.Authorization;return response({total:0,items:[]});}});
 assert.equal(content.reason,'verified-empty-space');assert.equal(content.pages.length,14);assert.equal(content.home.sections.length,7);
 assert.equal(auth,'Bearer test-token');assert.match(url,/cdn.contentful.com/);assert.ok(!url.includes('test-token'));
 await assert.rejects(loadContent({env:{...env,CONTENT_SOURCE:'contentful'},fetch:async()=>response({total:0,items:[]})}),/Contentful is empty/);
 await assert.rejects(loadContent({env,fetch:async()=>({ok:false,status:401})}),/HTTP 401/);
 await assert.rejects(loadContent({env,fetch:async()=>{throw new Error('secret-token-in-network-message');}}),e=>!e.message.includes('secret-token')&&e.message.includes('could not be reached'));
});
test('draft preview uses its own token and asset references resolve across pagination',async()=>{
 let host,auth,calls=0;
 const content=await loadContent({env:{...env,CONTENT_SOURCE:'contentful',CONTENTFUL_USE_PREVIEW:'true'},fetch:async(url,o)=>{
  host=url;auth=o.headers.Authorization;const split=100,items=calls++===0?fixture.items.slice(0,split):fixture.items.slice(split);
  return response({total:fixture.items.length,items,includes:{Asset:fixture.assets}});
 }});
 assert.match(host,/preview.contentful.com/);assert.equal(auth,'Bearer preview-test-token');assert.equal(calls,2);
 assert.equal(content.home.heroImage,referenceContent.home.heroImage);
 assert.equal(content.settings.mainMenu.items.find(i=>i.label==='Member Login').openInNewTab,true);
});
test('page text, images, menus and section order change through native CMS fields',()=>{
 const data=fresh(),home=byId(data,'hbcc-home-page'),menu=byId(data,'hbcc-main-menu');
 home.fields.heroTitle='An edited club heading';home.fields.sections.reverse();menu.fields.items.reverse();
 const heroId=home.fields.heroImage.sys.id;data.assets.find(a=>a.sys.id===heroId).fields.file.url='//images.ctfassets.net/test/new-image.webp';
 const result=normalize(data);
 assert.equal(result.home.heroTitle,'An edited club heading');assert.equal(result.home.sections[0].kind,'quote');
 assert.equal(result.settings.mainMenu.items[0].label,'Member Login');assert.equal(result.home.heroImage,'https://images.ctfassets.net/test/new-image.webp');
 byId(data,'hbcc-tournament-feed').fields.calendarUrl='https://tournament.hobsonsbaychess.com/v2/calendar?view=month';
 assert.equal(normalize(data).settings.mainMenu.items.find(i=>i.label==='Calendar').href,'/calendar/');
 const membership=result.pages.find(p=>p.slug==='membership'),sectionId=membership.sections[0].id;
 byId(data,sectionId).fields.enabled=false;
 assert.equal(normalize(data).pages.find(p=>p.slug==='membership').sections.length,membership.sections.length-1);
});
test('new pages work, and page references follow slug changes',()=>{
 const data=fresh(),about=data.items.find(e=>e.fields.slug==='about-us');
 about.fields.slug='about-the-club';
 data.items.push({sys:{id:'new-page',contentType:{sys:{id:'page'}}},fields:{title:'New club information',slug:'new-information',template:'content',description:'A new editable page.',sections:[],enabled:true}});
 const content=normalize(data);
 assert.ok(content.pages.some(p=>p.slug==='new-information'));
 assert.equal(content.settings.mainMenu.items.find(i=>i.label==='About').href,'/about-the-club/');
});
test('disabled menu entries hide, nested items preserve hierarchy, cycles fail clearly',()=>{
 const data=fresh(),content=normalize(data),tournaments=content.settings.mainMenu.items.find(i=>i.label==='Tournaments');
 assert.equal(tournaments.children.find(i=>i.label==='Champions').children.length,2);
 assert.equal(tournaments.children.find(i=>i.label==='Upcoming & Register').children.length,4);
 const first=byId(data,'hbcc-main-menu').fields.items[0].sys.id;
 byId(data,first).fields.enabled=false;assert.equal(normalize(data).settings.mainMenu.items.length,content.settings.mainMenu.items.length-1);
 byId(data,first).fields.enabled=true;byId(data,first).fields.children=[entryLink(first)];
 assert.throws(()=>normalize(data),/Circular.*menu/);
});
test('missing published references and colliding page/article routes cannot silently render',()=>{
 const data=fresh(),membership=data.items.find(e=>e.fields.slug==='membership');
 data.items=data.items.filter(e=>e.sys.id!==membership.sys.id);
 assert.throws(()=>normalize(data),/Missing published/);
 const duplicates=fresh(),post=duplicates.items.find(e=>e.sys.contentType.sys.id==='post'&&e.fields.enabled!==false);
 post.fields.slug='membership';assert.throws(()=>normalize(duplicates),/duplicate or reserved/);
});
test('rich text renders editable tables, images and FAQs while escaping injected content',()=>{
 const doc={nodeType:'document',data:{},content:[{nodeType:'paragraph',data:{},content:[{nodeType:'text',value:'<script>alert(1)</script>',marks:[{type:'bold'}],data:{}}]},{nodeType:'hyperlink',data:{uri:'javascript:alert(1)'},content:[{nodeType:'text',value:'bad link',marks:[],data:{}}]}]};
 const html=renderRichText(doc);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes('<script'));assert.ok(!html.includes('javascript:'));
 const membership=referenceContent.pages.find(p=>p.slug==='membership');
 const faq=membership.sections.find(s=>s.kind==='accordion');
 const body=renderRichText({nodeType:'document',data:{},content:faq.cards.map(c=>({nodeType:'embedded-entry-block',data:{target:entryLink(c.id)},content:[]}))},referenceContent.entries);
 assert.match(body,/<details class="club-faq">/);assert.match(body,/When is membership due/);
 const old=cleanHtml('<h1>Club</h1><img src="/safe.webp" onerror="bad()"><iframe src="https://evil.example/"></iframe>');
 assert.ok(!old.includes('onerror'));assert.ok(!old.includes('evil.example'));assert.match(old,/<h2>/);
 assert.equal(safeUrl('//evil.example'),'#');assert.equal(safeUrl('/\\evil.example'),'#');
});
test('2026 classical points match the authoritative source, with stable ties and no rapid scores',async()=>{
 const live=JSON.parse(await readFile('reference/tournaments/open-ratings-live.json','utf8'));
 const top=leaderboardRows(live,2026,8);
 assert.equal(top[0].name,'Nguyen, Anh Kiet');assert.equal(top[0].points,23.5);assert.equal(top[1].points,23);
 assert.equal(top[2].name,'Hogan, Steven');assert.equal(top[3].name,'Lacson, Joemar');assert.equal(top[2].points,20);
 assert.throws(()=>leaderboardRows(live,2025),/year does not match/);
 const sample={year:2026,generatedAt:'2026-10-10T00:00:00Z',players:[{name:'A',tournaments:[{ratingType:'standard',score:3},{ratingType:'rapid',score:9}]}]};
 assert.equal(leaderboardRows(sample,2026)[0].points,3);
});
test('tournament integration validates its URLs and keeps dated results during an outage',async()=>{
 const feed=referenceContent.home.sections.find(s=>s.kind==='leaderboardEvents').tournamentFeed;
 const result=await loadTournamentData(feed,{fetch:async()=>{throw new Error('unavailable');}});
 assert.equal(result.snapshot,true);assert.equal(result.rows[0].points,23.5);assert.ok(result.generatedAt);
 const future=await loadTournamentData({...feed,year:2027},{fetch:async()=>{throw new Error('unavailable');}});
 assert.equal(future.rows.length,0);
 assert.throws(()=>tournamentDataUrl('https://evil.example/open-ratings.json'),/public HBCC/);
 assert.throws(()=>tournamentDataUrl('https://tournament.hobsonsbaychess.com/private'),/Open leaderboard/);
 const events=parseUpcomingEvents(await readFile('reference/tournaments/upcoming.html','utf8'));
 assert.equal(events.length,4);assert.ok(events.every(e=>e.url.includes('/v2/upcoming/')));assert.ok(events.some(e=>e.title.includes('Term 4')));
});
test('migration package uses native fields, valid references and existing media',async()=>{
 const schema=JSON.parse(await readFile('contentful/schema.json','utf8')),seed=JSON.parse(await readFile('contentful/seed.json','utf8')),assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
 assert.equal(schema.contentTypes.length,17);assert.ok(schema.contentTypes.some(t=>t.sys.id==='policy'));assert.ok(schema.contentTypes.some(t=>t.sys.id==='clubChampion'));
 assert.equal(validatePackage(schema,seed,assets).entries,seed.entries.length);
 assert.ok(schema.contentTypes.every(t=>t.fields.every(f=>f.type!=='Object'&&f.id!=='bodyHtml')));
 for(const asset of assets)await access(asset.path);
 assert.ok(!JSON.stringify(fixture).includes('https://hobsonsbaychess.com/wp-content/'));
 assert.ok(!JSON.stringify(fixture).includes('/wp-content/uploads/'));
 const fonts=await readFile('public/fonts/hbcc-fonts.css','utf8');assert.ok(!fonts.includes('https://'));
});
test('page conversion preserves every word of the first-version content except the delegated calendar',async()=>{
 const report=JSON.parse(await readFile('reference/audit/page-conversion-report.json','utf8'));
 assert.equal(report.length,14);assert.ok(report.filter(r=>!r.deliberateReplacement).every(r=>r.missingWords.length===0));
});
