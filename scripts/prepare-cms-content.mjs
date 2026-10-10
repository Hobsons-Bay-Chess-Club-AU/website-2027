import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {safeUrl} from '../src/lib/sanitize.mjs';
const source=JSON.parse(await readFile('src/data/site.json','utf8'));
const inventory=JSON.parse(await readFile('reference/audit/homepage-inventory.json','utf8'));
const assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
const assetByUrl=new Map(assets.map(a=>[a.localUrl,a]));
const entries=[];
const link=(id,linkType='Entry')=>({sys:{type:'Link',linkType,id}});
const add=(type,id,fields)=>{
 if(entries.some(e=>e.sys.id===id))throw new Error(`Duplicate seed ID ${id}`);
 entries.push({sys:{id,type:'Entry',contentType:{sys:{type:'Link',linkType:'ContentType',id:type}}},fields:Object.fromEntries(Object.entries(fields).filter(([,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>[k,{'en-US':v}]))});
 return link(id);
};
const asset=url=>{
 if(!url)return undefined;
 const item=assetByUrl.get(url);if(!item)throw new Error(`Missing native asset for ${url}`);return link(item.id,'Asset');
};
const pageBySlug=new Map(source.pages.map(p=>[p.slug,p.id]));pageBySlug.set('home','hbcc-home-page');
const localUrl=url=>{
 try{const u=new URL(url,'https://hobsonsbaychess.com');return u.origin==='https://hobsonsbaychess.com'?u.pathname+u.search+u.hash:safeUrl(url);}catch{return safeUrl(url);}
};
const tournament={dataUrl:'https://tournament.hobsonsbaychess.com/open-ratings.json',leaderboardUrl:'https://tournament.hobsonsbaychess.com/v2/leaderboard/open',upcomingUrl:'https://tournament.hobsonsbaychess.com/v2/upcoming',calendarUrl:'https://tournament.hobsonsbaychess.com/v2/calendar'};
const nav=(id,label,url,extra={})=>{
 url=localUrl(url);const slug=url==='/'?'home':url.replace(/^\/|\/$/g,'');
 const page=pageBySlug.get(slug);
 const destination=Object.entries({leaderboard:tournament.leaderboardUrl,upcoming:tournament.upcomingUrl,calendar:tournament.calendarUrl}).find(([,href])=>href===url)?.[0];
 return add('navigationItem',id,{label,...(page?{page:link(page)}:destination?{tournamentFeed:link('hbcc-tournament-feed'),tournamentDestination:destination}:{url}),enabled:true,openInNewTab:false,...extra});
};
const node=(nodeType,content=[],data={})=>({nodeType,data,content});
const text=(value,marks=[])=>({nodeType:'text',value,marks,data:{}});
const paragraph=content=>node('paragraph',content.length?content:[text('')]);
const plain=value=>node('document',[paragraph([text(value)])]);
let embeddedCount=0;
const blockTags=new Set(['div','section','article','header','footer','figure','address','figcaption','dl','dd','dt','p','h1','h2','h3','h4','h5','h6','ul','ol','li','table','tr','td','th','blockquote','hr','img','iframe','details']);

function richText(html,prefix){
 const $=load(html,null,false);
 const inline=(elements,marks=[])=>elements.flatMap(e=>{
  if(e.type==='text')return [text((e.data||'').replace(/\s+/g,' '),marks)];
  if(e.type!=='tag')return [];
  const tag=e.tagName;
  if(tag==='br')return [text('\n',marks)];
  const mark={b:'bold',strong:'bold',i:'italic',em:'italic',u:'underline',code:'code',sup:'superscript',sub:'subscript'}[tag];
  if(mark)return inline(e.children,[...marks,{type:mark}]);
  if(tag==='img'||tag==='iframe'||tag==='details')return [];
  if(tag==='a'){
   const content=inline(e.children,marks);if(!content.length)return [];
   let url=localUrl($(e).attr('href')||'#');
   if(url==='/calendar/')url=tournament.calendarUrl;
   const slug=url==='/'?'home':url.replace(/^\/|\/$/g,'');
   if(pageBySlug.has(slug))return [node('entry-hyperlink',content,{target:link(pageBySlug.get(slug))})];
   const localAsset=assetByUrl.get(url);
   return [node(localAsset?'asset-hyperlink':'hyperlink',content,localAsset?{target:link(localAsset.id,'Asset')}:{uri:safeUrl(url)})];
  }
  if(tag==='span'&&/bt_bb_(counter|price_list_(currency|amount)|latest_posts_item_(date_day|date_month|author))/.test($(e).attr('class')||''))return [text(' ',marks),...inline(e.children||[],marks),text(' ',marks)];
  return inline(e.children||[],marks);
 });
 const blocks=elements=>{
  let result=[],pending=[];
  const flush=()=>{if(pending.some(n=>n.nodeType!=='text'||n.value.trim()))result.push(paragraph(pending));pending=[];};
  for(const e of elements){
   if(e.type==='text'){pending.push(...inline([e]));continue;}
   if(e.type!=='tag')continue;
   const tag=e.tagName;
   if(!blockTags.has(tag)&&!$(e).find([...blockTags].join(',')).length){pending.push(...inline([e]));continue;}
   flush();
   if(tag==='img'){
    const src=$(e).attr('src');if(!src)continue;
    const id=`${prefix}-image-${++embeddedCount}`;
    const alt=$(e).attr('alt')?.trim()||'Chess at Hobsons Bay Chess Club';
    let imageLink;
    if($(e).parent().is('a'))imageLink=nav(`${id}-link`,'View image',$(e).parent().attr('href')||src);
    const target=add('galleryImage',id,{title:`${prefix}: ${alt}`.slice(0,256),image:asset(src),alt:alt.slice(0,256),link:imageLink,enabled:true});
    result.push(node('embedded-entry-block',[],{target}));continue;
   }
   if(tag==='details'){
    const title=$(e).children('summary').text().trim();
    const body=$(e).clone();body.children('summary').remove();
    const target=add('contentCard',`${prefix}-faq-${++embeddedCount}`,{title,presentation:'faq',body:richText(body.html(),`${prefix}-answer-${embeddedCount}`),enabled:true});
    result.push(node('embedded-entry-block',[],{target}));continue;
   }
   if(tag==='iframe'){
    const target=add('section',`${prefix}-embed-${++embeddedCount}`,{internalName:`${prefix} embedded content`,kind:'embed',embedUrl:$(e).attr('src'),title:$(e).attr('title')||'Embedded club information',enabled:true});
    result.push(node('embedded-entry-block',[],{target}));continue;
   }
   if(/^h[1-6]$/.test(tag)){result.push(node(`heading-${Math.max(2,Number(tag[1]))}`,inline(e.children)));continue;}
   if(tag==='ul'||tag==='ol'){
    result.push(node(tag==='ul'?'unordered-list':'ordered-list',$(e).children('li').toArray().map(li=>{const content=blocks(li.children);return node('list-item',content.length?content:[paragraph([text('')])]);})));continue;
   }
   if(tag==='table'){
    const rows=$(e).find('tr').toArray().map(tr=>node('table-row',$(tr).children('td,th').toArray().map(cell=>{const content=blocks(cell.children);return node(cell.tagName==='th'?'table-header-cell':'table-cell',content.length?content:[paragraph([text('')])]);})));
    if(rows.length)result.push(node('table',rows));continue;
   }
   if(tag==='blockquote'){result.push(node('blockquote',blocks(e.children)));continue;}
   if(tag==='hr'){result.push(node('hr'));continue;}
   if(tag==='p'){
    const content=inline(e.children);if(content.some(n=>n.nodeType!=='text'||n.value.trim()))result.push(paragraph(content));
    result.push(...$(e).find('img,iframe,details').toArray().flatMap(child=>blocks([child])));continue;
   }
   result.push(...blocks(e.children||[]));
  }
  flush();return result;
 };
 return node('document',blocks($.root().contents().toArray()));
}

// Recover the original hierarchy directly from the audited public menu.
const $nav=load(inventory.navigation);
const createItems=ul=>$nav(ul).children('li').toArray().map(li=>{
 const a=$nav(li).children('a').first();const sourceId=$nav(li).attr('id')?.replace('menu-item-','')||createHash('sha1').update(a.text()).digest('hex').slice(0,10);
 let href=a.attr('href');const label=a.text().replace(/\s+/g,' ').trim();
 if(label==='Calendar')href=tournament.calendarUrl;
 if(label==='Upcoming & Register')href=tournament.upcomingUrl;
 const children=createItems($nav(li).children('ul'));
 return nav(`menu-item-${sourceId}`,label,href,{children,openInNewTab:a.attr('target')==='_blank'});
});
const mainMenu=add('navigationMenu','hbcc-main-menu',{title:'Main navigation',items:createItems($nav('ul').first())});
const footerClub=add('navigationMenu','hbcc-footer-club',{title:'Club',items:[['About Us','/about-us/'],['News','/news/'],['Policies','/policies/'],['Results & Pairings',tournament.leaderboardUrl],['Privacy','/policies/']].map(([label,url],i)=>nav(`footer-club-${i}`,label,url))});
const footerQuick=add('navigationMenu','hbcc-footer-quick',{title:'Quick Links',items:[['Play Chess','/play-chess/'],['About Us','/about-us/'],['Juniors','/juniors/'],['Sponsors','/sponsors/'],['Tournaments','/tournaments/'],['Membership','/membership/'],['Contact','/contact/']].map(([label,url],i)=>nav(`footer-quick-${i}`,label,url))});
const legalMenu=add('navigationMenu','hbcc-legal-menu',{title:'Legal links',items:[['Privacy Policy','/policies/'],['Cookie Policy','/policies/']].map(([label,url],i)=>nav(`footer-legal-${i}`,label,url))});
const socialLinks=[nav('social-facebook','Facebook',source.settings.facebookUrl,{icon:'facebook',openInNewTab:true}),nav('social-instagram','Instagram',source.settings.instagramUrl,{icon:'instagram',openInNewTab:true}),nav('social-youtube','YouTube','https://www.youtube.com/@HobsonsBayChessClub',{icon:'youtube',openInNewTab:true})];
const featureCards=source.settings.features.map((f,i)=>add('contentCard',`home-feature-${i}`,{title:f.title,presentation:'card',description:f.description,icon:f.icon,link:nav(`home-feature-link-${i}`,f.title,f.href),enabled:true}));
const statistics=source.settings.stats.map((s,i)=>add('statistic',`club-stat-${i}`,{...s,icon:['history','people','junior','calendar','events','attendance'][i],enabled:true}));
const days=source.settings.schedule.map((d,i)=>add('scheduleDay',`weekly-day-${i}`,{day:d.day,closedText:'Closed. No Chess',sessions:d.sessions.map((s,j)=>add('scheduleSession',`weekly-session-${i}-${j}`,{...s,location:source.settings.title}))}));
const sponsorRefs=source.sponsors.map(s=>add('sponsor',s.id,{name:s.id==='sponsor-5'?'Community Bank Altona & Laverton':s.name,image:asset(s.image),website:s.website,enabled:true}));
const feed=add('tournamentFeed','hbcc-tournament-feed',{title:'HBCC 2026 tournament service',year:2026,...tournament,rows:8,eventsLimit:4,pointsLabel:'Points',updatedLabel:'Updated',pointsExplanation:'Open leaderboard · Total classical points across 2026 tournaments.',unavailableText:'The latest results are available on the tournament website.'});
const homeSections=[
 add('section','home-statistics',{internalName:'Homepage — Club in numbers',kind:'statistics',title:'The club in numbers',statistics,enabled:true}),
 add('section','home-results-events',{internalName:'Homepage — 2026 standings and upcoming events',kind:'leaderboardEvents',title:'2026 Standings',subtitle:'Open leaderboard · Classical points',secondaryTitle:'Events',tournamentFeed:feed,actions:[nav('home-full-table','Full Table',tournament.leaderboardUrl),nav('home-all-events','All Events',tournament.upcomingUrl)],enabled:true}),
 add('section','home-weekly-feature',{internalName:'Homepage — Weekly club nights',kind:'feature',title:'Weekly club nights and range of players',subtitle:'Club nights, social chess and tournaments for adults and juniors',image:asset(source.settings.weeklyImage),imageAlt:'Adults and juniors playing chess at HBCC',actions:[nav('home-play-chess','Play Chess with HBCC','/play-chess/')],enabled:true}),
 add('section','home-weekly-schedule',{internalName:'Homepage — Typical weekly schedule',kind:'schedule',title:'Typical Weekly Schedule',days,actions:[nav('home-view-calendar','View Calendar',tournament.calendarUrl)],enabled:true}),
 add('section','home-sponsors',{internalName:'Homepage — Sponsors and partners',kind:'sponsors',title:'Our Sponsors & Partners',sponsors:sponsorRefs,enabled:true}),
 add('section','home-news',{internalName:'Homepage — Latest news',kind:'news',title:'Latest from HBCC',posts:[...source.posts].sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,3).map(p=>link(p.id)),limit:3,actions:[nav('home-all-news','All News','/news/')],enabled:true}),
 add('section','home-testimonial',{internalName:'Homepage — Testimonial',kind:'quote',body:plain("It is an awesome experience and coaches make it so much fun that you don't know you're even learning."),enabled:true})
];
const joinBanner=add('section','hbcc-join-banner',{internalName:'Global — Join and contact banner',kind:'cta',eyebrow:'Inviting visitors to join HBCC',title:'Ready to Make Your Next Move?',subtitle:'Contact us',body:plain(source.settings.email),actions:[nav('join-banner-join','Join HBCC Today','/membership/'),nav('join-banner-contact','Contact us','/contact/')],enabled:true});
const footerGallery=source.settings.footerImages.map((url,i)=>add('galleryImage',`footer-photo-${i}`,{title:`Footer photo ${i+1}`,image:asset(url),alt:['Chess pieces on a board','HBCC chess hero image','Players enjoying a game of chess','A chessboard during a match','A player considering their next move','A junior chess player'][i],enabled:true}));
add('page','hbcc-home-page',{title:'Home',slug:'home',template:'home',description:source.settings.heroDescription,seoTitle:'HBCC | Hobsons Bay Chess Club',heroTitle:source.settings.heroTitle,heroStrapline:source.settings.heroStrapline,heroDescription:source.settings.heroDescription,heroImage:asset(source.settings.heroImage),partnerImage:asset(source.settings.partnerImage),partnerAlt:'Proud Partner — Alkassab Dental Surgery',partnerLink:nav('home-partner-link','Our proud partner Alkassab Dental Surgery','/sponsors/'),heroActions:[nav('hero-tournaments','View Tournaments',tournament.upcomingUrl),nav('hero-membership','Become a Member','/membership/')],featureCards,sections:homeSections,enabled:true});

const conversion=[];
for(const p of source.pages){
 let sections=[];
 if(p.slug==='calendar'){
  sections=[add('section',`${p.id}-calendar`,{internalName:'Calendar — Existing tournament service',kind:'richText',title:'Club calendar',body:plain('Find upcoming club events and view the calendar on our tournament website.'),actions:[nav('calendar-service-link','View Calendar',tournament.calendarUrl),nav('calendar-upcoming-link','Upcoming Events',tournament.upcomingUrl)],enabled:true})];
 }else{
  const $=load(p.bodyHtml,null,false);const sourceSections=$('.bt_bb_section').toArray();
  const parts=sourceSections.length?sourceSections:[$.root()[0]];
  sections=parts.flatMap((e,i)=>{
   const sectionId=`${p.id}-section-${i}`,html=$(e).html()||'';
   const rows=$(e).find('.bt_bb_row').filter((_,r)=>!$(r).parentsUntil(e,'.bt_bb_row').length);
   const columns=rows.length===1?rows.first().children('.bt_bb_column').toArray():[];
   if(columns.length>1){
    const children=columns.map((column,j)=>add('section',`${sectionId}-column-${j}`,{internalName:`${p.title} — Section ${i+1}, column ${j+1}`,kind:'richText',body:richText($(column).html(),`${sectionId}-col-${j}`),enabled:true}));
    return [add('section',sectionId,{internalName:`${p.title} — Section ${i+1}`,kind:'columns',children,tone:i%2?'gold':'light',enabled:true})];
   }
   const body=richText(html,sectionId);if(!body.content.length)return [];
   return [add('section',sectionId,{internalName:`${p.title} — Section ${i+1}`,kind:'richText',body,tone:i%2?'gold':'light',enabled:true})];
  });
 }
 add('page',p.id,{title:p.title,slug:p.slug,template:'content',description:p.description,heroImage:asset(p.heroImage),sections,wordpressId:p.wordpressId,originalUrl:p.originalUrl,enabled:true});
 conversion.push({slug:p.slug,sections:sections.length,sourceText:load(p.bodyHtml).text().replace(/\s+/g,' ').trim()});
}
for(const p of source.posts)add('post',p.id,{title:p.title,slug:p.slug,publishedAt:p.publishedAt,excerpt:p.excerpt,image:asset(p.image),imageAlt:p.title,body:richText(p.bodyHtml,p.id),author:'BoldThemes',category:'HBCC',wordpressId:p.wordpressId,originalUrl:p.originalUrl,migrationReviewRequired:true,enabled:true});
add('siteSettings','hbcc-site-settings',{title:source.settings.title,shortName:'HBCC',logo:asset(source.settings.logo),favicon:asset(source.settings.favicon),defaultDescription:source.settings.heroDescription,homePage:link('hbcc-home-page'),mainMenu,footerMenus:[footerClub,footerQuick],legalMenu,email:source.settings.email,address:source.settings.address,headerSocialLinks:socialLinks.slice(0,2),socialLinks,footerBrandLabel:'Hobsons Bay\nChess Club',contactHeading:'Contact',connectHeading:'Connect',instagramLabel:'More on Instagram',joinBanner,footerGallery,copyright:'© {year} Hobsons Bay Chess Club. All Rights Reserved.',newsTitle:'Latest from HBCC',newsDescription:'Latest from Hobsons Bay Chess Club.',readMoreLabel:'Read more',homeLabel:'Home',newsLabel:'News',menuLabel:'HBCC'});
const seed={version:2,locale:'en-US',entries};
await writeFile('contentful/seed.json',JSON.stringify(seed,null,2));
await writeFile('src/data/cms.json',JSON.stringify({capturedAt:inventory.capturedAt,items:entries.map(e=>({...e,fields:Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v['en-US']]))})),assets:assets.map(a=>({sys:{id:a.id},fields:{title:a.title,description:a.title,file:{url:a.localUrl,contentType:/\.pdf$/.test(a.fileName)?'application/pdf':'image/'+a.fileName.split('.').at(-1)}}}))},null,2));
await writeFile('reference/audit/page-conversion.json',JSON.stringify(conversion,null,2));
console.log(JSON.stringify({entries:entries.length,types:[...new Set(entries.map(e=>e.sys.contentType.sys.id))].length,clubPages:source.pages.length,homeSections:homeSections.length,embeddedItems:embeddedCount,rawHtmlFields:0},null,2));
