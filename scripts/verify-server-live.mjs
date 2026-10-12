import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';
import {loadContent} from '../src/lib/content-source.mjs';
import {load as html} from 'cheerio';

const env=loadEnv(),origin=process.env.VERCEL_SITE_URL||'https://hbcc-website-2027.vercel.app';
const content=await loadContent({env:{...process.env,CONTENT_SOURCE:'contentful',SITE_VARIANT:'v2',CONTENTFUL_USE_PREVIEW:'false'}});
const report={checkedAt:new Date().toISOString(),origin,variant:'v2',pages:[],cacheHits:[],security:[],preview:null,webhook:null};
const request=(path,options={})=>fetch(new URL(path,origin),{redirect:'manual',signal:AbortSignal.timeout(60000),...options});
for(const path of ['/','/news/',...content.pages.map(page=>`/${page.slug}/`),...content.posts.map(post=>`/${post.slug}/`),'/calendar.ics','/sitemap.xml','/robots.txt']){
 const response=await request(path),body=await response.text();assert.equal(response.status,200,path);
 assert.ok(!body.includes('Draft preview'),path+' must use published content');
 const $=html(body);
 if(response.headers.get('content-type')?.includes('text/html')){
  assert.equal($('link[rel=canonical]').attr('href'),new URL(path,origin).href);
  assert.equal($('.review-banner').length,0,'Launch pages have no review banner');
 }
 report.pages.push({path,status:response.status,cache:response.headers.get('x-vercel-cache')});
}
for(const path of ['/','/membership/','/calendar/']){
 const response=await request(path);assert.equal(response.headers.get('x-vercel-cache'),'HIT',path+' should be CDN cached');
 report.cacheHits.push(path);
}
const check=async(label,path,options,status)=>{const response=await request(path,options);assert.equal(response.status,status,label);report.security.push({label,status});return response;};
await check('Unknown routes return 404','/hbcc-route-does-not-exist/',{},404);
await check('Unsigned webhook rejected','/api/revalidate/',{method:'POST',body:'{}'},401);
await check('Webhook rejects wrong space','/api/revalidate/',{method:'POST',headers:{'x-hbcc-webhook-secret':process.env.CONTENTFUL_WEBHOOK_SECRET,'x-contentful-topic':'ContentManagement.Entry.publish'},body:JSON.stringify({sys:{id:'invalid',space:{sys:{id:'other'}},environment:{sys:{id:env.environment}}}})},400);
await check('Webhook GET rejected','/api/revalidate/',{},405);
await check('Preview rejects cross-site login','/api/preview/',{method:'POST',headers:{Origin:'https://example.com'},body:'code=wrong'},403);
const login=await check('Preview login authenticates','/api/preview/',{method:'POST',headers:{Origin:origin,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code:process.env.CONTENTFUL_PREVIEW_SECRET,next:'/membership/'})},303);
const cookies=login.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
assert.equal(login.headers.getSetCookie().length,2);
assert.ok(login.headers.getSetCookie().every(value=>/HttpOnly/i.test(value)&&/Secure/i.test(value)));
const draft=await request('/membership/',{headers:{Cookie:cookies}});assert.equal(draft.status,200);assert.equal(draft.headers.get('x-content-mode'),'draft');assert.match(draft.headers.get('cache-control'),/no-store/);assert.ok((await draft.text()).includes('Draft preview'));
const published=await request('/membership/');assert.equal(published.headers.get('x-content-mode'),'published');assert.ok(!(await published.text()).includes('Draft preview'));
report.preview={authenticated:true,privateNoStore:true,httpOnlySecureCookies:true,publicIsolated:true};

if(process.argv.includes('--cms-probe')){
 const cms=contentfulClient(env),locale=await cms.locale(),contact=content.pages.find(page=>page.slug==='contact');
 const original=await cms.request('/entries/'+contact.id);
 assert.equal(original.sys.version,original.sys.publishedVersion+1,'Contact must have no pending editorial changes');
 const probeId='v2-preview-check-'+randomUUID().slice(0,8),probeSlug='v2-'+probeId;
 let probe,current=original,contactChanged=false;
 const spaceBase='https://api.contentful.com/spaces/'+env.space;
 const webhook=(await cms.request('/webhook_definitions',{baseUrl:spaceBase})).items.find(item=>item.name==='HBCC Vercel published-content ISR');
 assert.ok(webhook?.active,'Contentful ISR webhook must be active');
 const callSummary=async()=>{
  const response=await fetch(spaceBase+'/webhooks/'+webhook.sys.id+'/calls',{headers:{Authorization:'Bearer '+env.managementToken}});
  if(!response.ok)return [];
  const data=await response.json();
  return (data.items||[]).map(item=>({id:item.sys?.id,status:item.statusCode,topic:item.eventType,createdAt:item.sys?.createdAt}));
 };
 try{
  const fields=structuredClone(original.fields);fields.title[locale]='Private Contentful preview verification';fields.slug[locale]=probeSlug;fields.noindex={[locale]:true};
  probe=await cms.putEntry(probeId,'page',fields);
  const path='/'+probeId+'/';
  assert.equal((await request(path)).status,404);
  const redirect=await request('/api/preview/?'+new URLSearchParams({entryId:probeId,env:env.environment}),{headers:{Cookie:cookies}});
  assert.equal(redirect.status,303);assert.equal(redirect.headers.get('location'),path);
  const response=await request(path,{headers:{Cookie:cookies}});assert.equal(response.status,200);assert.ok((await response.text()).includes('Private Contentful preview verification'));
  assert.equal((await request(path)).status,404,'Unpublished page must remain unavailable to visitors');
  report.preview.unpublishedEntryVerified=true;
  // An invisible metadata whitespace change exercises a real publish/webhook.
  const changed=structuredClone(original.fields);changed.description[locale]+=' ';
  current=await cms.putEntry(original.sys.id,'page',changed,current);contactChanged=true;
  current=await cms.publish('entries',current);
  let fresh=false;
  for(let attempt=0;attempt<12;attempt++){
   const response=await request('/contact/');const $=html(await response.text());
   if($('meta[name=description]').attr('content')===changed.description[locale]){fresh=true;break;}
   await new Promise(resolve=>setTimeout(resolve,2500));
  }
  assert.ok(fresh,'Actual Contentful publication should refresh cached HTML via its webhook');
  report.webhook={id:webhook.sys.id,publishRefreshVerified:true};
 }finally{
  if(contactChanged){
   const latest=await cms.request('/entries/'+original.sys.id);
   assert.equal(latest.sys.version,current.sys.version,'Preserve any concurrent editorial changes');
   current=await cms.putEntry(original.sys.id,'page',original.fields,latest);
   current=await cms.publish('entries',current);
  }
  if(probe){const latest=await cms.request('/entries/'+probeId);assert.equal(latest.sys.version,probe.sys.version);await cms.request('/entries/'+probeId,{method:'DELETE',headers:cms.version(latest)});}
 }
 let restored=false;
 for(let attempt=0;attempt<12;attempt++){
  const $=html(await (await request('/contact/')).text());
  if($('meta[name=description]').attr('content')===original.fields.description[locale]){restored=true;break;}
  await new Promise(resolve=>setTimeout(resolve,2500));
 }
 assert.ok(restored,'Original published metadata must be restored');
 report.webhook.originalContentRestored=true;
 const calls=await callSummary();
 report.webhook.deliveries=calls.filter(call=>call.status).map(({id,status,createdAt})=>({id,status,createdAt})).slice(0,5);
 console.log(JSON.stringify({webhookCalls:report.webhook.deliveries}));
}
const exit=await request('/api/exit-preview/?next=/membership/',{headers:{Cookie:cookies}});assert.equal(exit.status,303);assert.equal(exit.headers.getSetCookie().length,2);
await writeFile('docs/VERCEL-VERIFICATION.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checkedAt:report.checkedAt,origin,pages:report.pages.length,security:report.security,preview:report.preview,webhook:report.webhook}));
