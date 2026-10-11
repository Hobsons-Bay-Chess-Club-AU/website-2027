import reference from '../data/cms.json' with {type:'json'};
import {safeUrl} from './sanitize.mjs';
import {renderRichText} from './render-rich-text.mjs';
import {normalizeCalendarEvents} from './calendar.mjs';
import {createReviewEntries} from './review-content.mjs';

export function navigationFragment(value){
 if(!value)return '';
 if(!/^[a-z][a-z0-9-]*$/.test(value))throw new Error('Navigation fragment must be a stable section ID.');
 return '#'+value;
}

let cached,cachedAt=0;
export function resolveEntries(entries,assets=[]){
 const files=new Map(assets.map(a=>[a.sys.id,a]));
 const resolve=(value,key='')=>{
  if(value?.sys?.linkType==='Asset'){
   const asset=files.get(value.sys.id),file=asset?.fields?.file,url=file?.url;
   if(!url)return null;
   const safe=safeUrl(url.startsWith('//')?`https:${url}`:url,'');
   return key==='target'?{id:value.sys.id,type:'asset',url:safe,title:asset.fields.title,description:asset.fields.description,contentType:file.contentType}:safe;
  }
  if(Array.isArray(value))return value.map(v=>resolve(v));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolve(v,k)]));
  return value;
 };
 return entries.map(e=>({id:e.sys.id,type:e.sys.contentType?.sys?.id,...resolve(e.fields||{})}));
}

export function normalizeContent(items){
 const byId=Object.fromEntries(items.map(i=>[i.id,i]));
 const settings=items.filter(i=>i.type==='siteSettings');
 if(settings.length!==1)throw new Error('Publish exactly one HBCC Website settings entry in Contentful.');
 const raw=settings[0];
 const get=(ref,type)=>{
  const entry=byId[ref?.sys?.id];
  if(!entry||type&&entry.type!==type)throw new Error(`Missing published ${type||'content'} reference ${ref?.sys?.id||'(empty)'}. Publish the linked entry.`);
  return entry;
 };
 const refs=(values,type)=> (values||[]).map(v=>get(v,type)).filter(e=>e.enabled!==false);
 const navigation=(entry,trail=[])=>{
  if(entry.enabled===false)return null;
  if(trail.includes(entry.id)||trail.length>8)throw new Error(`Circular or overly deep menu at ${entry.label}.`);
  let href=entry.url;
  if(entry.tournamentFeed){
   const feed=get(entry.tournamentFeed,'tournamentFeed'),key={leaderboard:'leaderboardUrl',upcoming:'upcomingUrl',calendar:'calendarUrl'}[entry.tournamentDestination];
   if(!key)throw new Error('Choose a tournament destination for menu item '+entry.label+'.');
   href=feed[key];
  }
  if(entry.page){const page=get(entry.page);if(page.enabled===false)return null;href=(page.template==='home'?'/':`/${page.slug}/`)+navigationFragment(entry.fragment);}
  if(!entry.label||!href||safeUrl(href,'')==='')throw new Error(`Menu item ${entry.id} needs valid link text and a page or URL.`);
  return {...entry,href:safeUrl(href),children:refs(entry.children,'navigationItem').map(e=>navigation(e,[...trail,entry.id])).filter(Boolean)};
 };
 const menu=ref=>{const entry=get(ref,'navigationMenu');return {...entry,items:refs(entry.items,'navigationItem').map(e=>navigation(e)).filter(Boolean)};};
 const action=ref=>ref?navigation(get(ref,'navigationItem')):null;
 const card=e=>({...e,link:action(e.link),bodyHtml:renderRichText(e.body,byId)});
 const gallery=e=>({...e,link:action(e.link)});
 const section=(e,trail=[])=>{
  if(trail.includes(e.id)||trail.length>12)throw new Error(`Circular section reference at ${e.internalName}.`);
  return {...e,bodyHtml:renderRichText(e.body,byId),actions:refs(e.actions,'navigationItem').map(n=>navigation(n)).filter(Boolean),
   children:refs(e.children,'section').map(n=>section(n,[...trail,e.id])),cards:refs(e.cards,'contentCard').map(card),statistics:refs(e.statistics,'statistic'),
   days:refs(e.days,'scheduleDay').map(day=>({...day,sessions:refs(day.sessions,'scheduleSession').map(s=>({...s,link:action(s.link)}))})),
   sponsors:refs(e.sponsors,'sponsor'),posts:refs(e.posts,'post'),gallery:refs(e.gallery,'galleryImage').map(gallery),tournamentFeed:e.tournamentFeed?get(e.tournamentFeed,'tournamentFeed'):null,
   calendar:e.calendar?(()=>{const calendar=get(e.calendar,'calendarSchedule');return {...calendar,events:normalizeCalendarEvents(refs(calendar.events,'calendarEvent'))};})():null};
 };
 const home=get(raw.homePage,'page');
 if(home.template!=='home'||home.enabled===false)throw new Error('Website settings must select an enabled Homepage template.');
 const pageEntries=items.filter(e=>e.type==='page'&&e.enabled!==false),postEntries=items.filter(e=>e.type==='post'&&e.enabled!==false);
 const slugs=new Set();
 for(const p of [...pageEntries,...postEntries]){
  if(!p.title||!p.slug||!/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(p.slug)||slugs.has(p.slug)||['news','404','sitemap.xml','robots.txt','wp-admin','blog','author/boldthemes','category/hbcc-chess','about/club-history','alonso-already-looking-ahead-after-goal-feast','horstweg-can-be-a-double-gameweek-hero','pre-match-briefing-hammers-vs-eagles','video-highlights-eagles-24-21-rhinos','watch-the-highlights-and-goals-against-seagulls'].includes(p.slug))throw new Error(`Invalid, duplicate or reserved Contentful page/article slug ${p.slug||'(empty)'}.`);
  slugs.add(p.slug);
 }
 const expandPage=p=>{
  const sections=refs(p.sections,'section').map(s=>section(s)),anchors=new Set();
  const check=s=>{
   for(const value of [s.anchor,...(s.cards||[]).map(c=>c.anchor)].filter(Boolean)){
    navigationFragment(value);if(anchors.has(value))throw new Error('Duplicate section anchor '+value+' on '+p.slug);anchors.add(value);
   }
   for(const child of s.children||[])check(child);
  };
  sections.forEach(check);
  return {...p,sections,heroActions:refs(p.heroActions,'navigationItem').map(n=>navigation(n)).filter(Boolean),featureCards:refs(p.featureCards,'contentCard').map(card),partnerLink:action(p.partnerLink)};
 };
 const homepage=expandPage(home);
 const globals={...raw,mainMenu:menu(raw.mainMenu),footerMenus:(raw.footerMenus||[]).map(menu),legalMenu:raw.legalMenu?menu(raw.legalMenu):null,
  headerSocialLinks:refs(raw.headerSocialLinks,'navigationItem').map(n=>navigation(n)).filter(Boolean),socialLinks:refs(raw.socialLinks,'navigationItem').map(n=>navigation(n)).filter(Boolean),
  headerActions:raw.headerActions?menu(raw.headerActions):null,quickActions:raw.quickActions?menu(raw.quickActions):null,
  joinBanner:raw.joinBanner&&get(raw.joinBanner).enabled!==false?section(get(raw.joinBanner,'section')):null,footerGallery:refs(raw.footerGallery,'galleryImage').map(gallery),
  heroImage:home.heroImage,heroDescription:home.heroDescription||raw.defaultDescription};
 for(const field of ['title','logo','email','address','newsTitle','readMoreLabel','homeLabel','newsLabel','menuLabel'])if(!globals[field])throw new Error(`Website settings is missing ${field}.`);
 if(!home.heroImage||!home.heroTitle||!homepage.featureCards.length)throw new Error('Populate the homepage hero image, title and feature cards.');
 return {settings:globals,home:homepage,pages:pageEntries.filter(p=>p.id!==home.id).map(expandPage),posts:postEntries.map(p=>({...p,bodyHtml:renderRichText(p.body,byId)})).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)),entries:byId,source:'contentful'};
}

export const referenceContent={...normalizeContent(resolveEntries(reference.items,reference.assets)),source:'reference'};
export async function loadContent(options={}){
 const env=options.env||{...process.env,...(import.meta.env||{})};
 const variant=env.SITE_VARIANT||'current';
 if(!['current','v2'].includes(variant))throw new Error('SITE_VARIANT must be current or v2.');
 const content=(items,source)=>({...normalizeContent(variant==='v2'?createReviewEntries(items):items),source});
 const saved=()=>variant==='v2'?content(resolveEntries(reference.items,reference.assets),'reference'):{...referenceContent};
 const mode=env.CONTENT_SOURCE||'auto';
 if(!['auto','reference','contentful'].includes(mode))throw new Error('CONTENT_SOURCE must be auto, reference or contentful.');
 if(mode==='reference')return saved();
 const space=env.CONTENTFUL_SPACE_ID||env.CONTENTFUL_SPACEID,preview=env.CONTENTFUL_USE_PREVIEW==='true';
 const token=preview?(env.CONTENTFUL_PREVIEW_TOKEN||env.CONTENTFUL_PREVIEW_API):(env.CONTENTFUL_DELIVERY_TOKEN||env.CONTENTFUL_DELIVERY_API);
 if(!space||!token){if(mode==='contentful')throw new Error('Set Contentful space and Delivery/Preview key in the server environment.');return {...saved(),reason:'not-configured'};}
 const environment=env.CONTENTFUL_ENVIRONMENT||'master',host=preview?'preview.contentful.com':'cdn.contentful.com',fetcher=options.fetch||fetch;
 const entries=[],assets=[];let skip=0,total=0;
 do{
  const url=`https://${host}/spaces/${encodeURIComponent(space)}/environments/${encodeURIComponent(environment)}/entries?limit=1000&include=1&skip=${skip}`;
  let response;try{response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});}catch{throw new Error('Contentful could not be reached. Retry, or use CONTENT_SOURCE=reference for local review.');}
  if(!response.ok)throw new Error(`Contentful returned HTTP ${response.status}. Check the server API configuration.`);
  const body=await response.json();if(!Array.isArray(body.items)||typeof body.total!=='number')throw new Error('Invalid Contentful entries response.');
  entries.push(...body.items);assets.push(...(body.includes?.Asset||[]));total=body.total;skip+=body.items.length;
  if(total>skip&&!body.items.length)throw new Error('Contentful pagination ended early.');
 }while(skip<total);
 if(!entries.length){if(mode==='contentful')throw new Error('Contentful is empty. Import, review and publish the content before building for launch.');return {...saved(),reason:'verified-empty-space'};}
 return content(resolveEntries(entries,assets),'contentful');
}
export const getContent=()=>{
 if(import.meta.env?.DEV&&Date.now()-cachedAt>5000)cached=undefined;
 if(!cached){cachedAt=Date.now();cached=loadContent().catch(e=>{cached=undefined;throw e;});}return cached;
};
export const pageUrl=page=>page.template==='home'?'/':`/${page.slug}/`;
