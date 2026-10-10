import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { cleanHtml, safeUrl } from '../src/lib/sanitize.mjs';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
const sourcePages = await readJson('reference/api/pages.json');
const sourcePosts = await readJson('reference/api/posts.json');
const media = await readJson('reference/api/media.json');
const assetMap = await readJson('reference/asset-map.json');
const manifest = await readJson('reference/manifest.json');
const pagePaths = ['/about-us/', '/history/', '/play-chess/', '/juniors/', '/tournaments/', '/champions/', '/best-in-the-west/', '/peter-caissa-memorial/', '/dgt-link/', '/calendar/', '/sponsors/', '/membership/', '/contact/', '/policies/'];
await Promise.all(['src/data', 'contentful', 'public/fonts'].map(p => mkdir(p, { recursive: true })));
const origin = 'https://hobsonsbaychess.com';
const decodeText = value => load(`<span>${value || ''}</span>`)('span').text().trim();
const localAsset = url => {
  if (!url) return url;
  try { return assetMap[url] || assetMap[new URL(url, origin).href] || url; } catch { return url; }
};
function rewriteLink(href) {
  if (!href || href === '#') return href || '#';
  if (assetMap[href]) return assetMap[href];
  try {
    const u = new URL(href, origin);
    const aliases = {'/about/club-history/':'/history/','/blog/':'/news/','/author/boldthemes/':'/news/','/category/hbcc-chess/':'/news/'};
    if (u.origin === origin && !u.pathname.startsWith('/wp-')) return `${aliases[u.pathname] || u.pathname}${u.search}${u.hash}`;
  } catch {}
  return safeUrl(href);
}
function migrateHtml(html, { stripHero = false } = {}) {
  const $ = load(html, null, false);
  $('script,style,noscript,form,.bt_bb_separator,.bt_bb_separator_v2,.bt_bb_empty_space,.wpcf7,.bt_bb_google_maps').remove();
  // Plugin accordions become accessible native HTML and need no WordPress script.
  $('.bt_bb_accordion_item').each((_, e) => {
    const title = $(e).children('.bt_bb_accordion_item_title').text();
    const body = $(e).children('.bt_bb_accordion_item_content').html() || '';
    const details = $('<details class="club-faq"><summary></summary><div></div></details>');
    details.find('summary').text(title); details.find('div').html(body); $(e).replaceWith(details);
  });
  $('.bt_bb_counter').each((_,e) => $(e).text($(e).find('.onedigit').map((_,d)=>$(d).attr('data-digit')).get().join('')));
  $('.bt_bb_icon_holder, .bt_bb_section_top_section_coverage_image, .bt_bb_background_image_holder, .bt_bb_section_bottom_section_coverage_image, .bt_bb_section_top_section_coverage, .bt_bb_section_bottom_section_coverage').remove();
  if (stripHero) $('.bt_bb_section').first().remove();
  $('img').each((_,e) => {
    const src = $(e).attr('data-src') || $(e).attr('src');
    if (/blank.gif|data:image/.test(src || '')) { $(e).remove(); return; }
    $(e).attr('src', localAsset(src)).removeAttr('srcset sizes data-src data-srcset data-lazy-src data-lazy-srcset');
  });
  $('a[href]').each((_,e) => $(e).attr('href', rewriteLink($(e).attr('href'))));
  $('table').each((_,e) => $(e).wrap('<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable club table"></div>'));
  $('[class]').each((_,e) => {
    const classes = [...new Set(($(e).attr('class') || '').split(/\s+/))].filter(c => /^(bt_bb_|col-|club-|bold_timeline|bt_timeline)/.test(c) && !/animation|animate|parallax/.test(c));
    $(e).attr('class',classes.join(' '));
  });
  // Theme attribute duplication and tracking data are not part of editorial content.
  $('*').each((_,e) => { for (const attr of Object.keys(e.attribs || {})) if (attr.startsWith('data-') || attr === 'style') $(e).removeAttr(attr); });
  $('iframe').each((_,e) => $(e).attr('class', 'club-embed'));
  return cleanHtml($.html()).replace(/\s{3,}/g,' ');
}
const pages = pagePaths.map(path => {
  const page = sourcePages.find(p => new URL(p.link).pathname === path);
  if (!page) throw new Error(`Missing WordPress club page ${path}`);
  const $ = load(page.content.rendered);
  const hero = $('.bt_bb_section').first();
  const description = hero.find('.bt_bb_headline_subheadline').first().text().trim();
  const sourceImage = hero.find('[data-background_image_src]').first().attr('data-background_image_src');
  let bodyHtml = migrateHtml(page.content.rendered,{stripHero:true});
  if (path === '/contact/') {
    // Contact Form 7 needs a mail backend; never simulate a sent message in the prototype.
    bodyHtml = '<section class="contact-grid"><div><h2>Contact us</h2><p>For club nights, junior coaching, membership, and tournament enquiries.</p><p><a href="mailto:info@hobsonsbaychess.com">info@hobsonsbaychess.com</a></p><h3>Where we play</h3><p>108 Queen St, Altona VIC 3018, Australia</p><p><a href="https://www.google.com/maps/search/?api=1&amp;query=Hobsons+Bay+Chess+Club">View directions ↗</a></p></div><div><h2>Make your next move</h2><p>Find an event, join the club, or come along to a club night.</p><p><a class="text-link" href="/play-chess/">Play Chess →</a></p><p><a class="text-link" href="https://portal.hobsonsbaychess.com/public/schedule/events">View tournaments →</a></p><p><a class="text-link" href="/membership/">Membership →</a></p></div></section>';
  }
  return { id:`wp-page-${page.id}`, wordpressId:page.id, slug:path.slice(1,-1), title:decodeText(page.title.rendered), description:description || `Explore ${decodeText(page.title.rendered).toLowerCase()} at Hobsons Bay Chess Club.`, heroImage:sourceImage ? localAsset(sourceImage) : null, bodyHtml, originalUrl:page.link };
});
const homePage = sourcePages.find(p=>new URL(p.link).pathname === '/');
const $ = load(homePage.content.rendered);
const liveDom = load(await readFile('reference/html/home-fresh.html','utf8'));
const navigation = [
  {label:'Home',href:'/'},
  {label:'About',href:'/about-us/',children:[{label:'History',href:'/history/'}]},
  {label:'Play Chess',href:'/play-chess/'},{label:'Juniors',href:'/juniors/'},
  {label:'Tournaments',href:'/tournaments/',children:[
    {label:'Upcoming & Register',href:'https://portal.hobsonsbaychess.com/public/schedule/events'},
    {label:'Vic Women',href:'https://portal.hobsonsbaychess.com/public/schedule/events/83352-victorian-women-championship-2026'},
    {label:'Vic Junior Rapid and Blitz',href:'https://portal.hobsonsbaychess.com/public/schedule/events/83487-victorian-junior-rapid-blitz-championship-2026'},
    {label:'BITW 2026',href:'https://portal.hobsonsbaychess.com/public/schedule/events/80371-2026-best-in-the-west'},
    {label:'Oceania Youth 2027',href:'https://oceaniayouth2027.hobsonsbaychess.com/'},
    {label:'Champions',href:'/champions/'},{label:'Best in the West',href:'/best-in-the-west/'},
    {label:'Peter Caissa Memorial',href:'/peter-caissa-memorial/'},{label:'DGT Link',href:'/dgt-link/'},
    {label:'Club Database',href:'https://games.hobsonsbaychess.com/'},
  ]},
  {label:'Calendar',href:'/calendar/'},{label:'Sponsors',href:'/sponsors/'},{label:'Membership',href:'/membership/'},{label:'Contact',href:'/contact/'},
  {label:'Member Login',href:'https://portal.hobsonsbaychess.com/'},
];
const socialLinks = liveDom('a[href]').map((_,e)=>liveDom(e).attr('href')).get();
const settings = {
  id:'hbcc-site-settings', title:'Hobsons Bay Chess Club', shortName:'HBCC',
  heroTitle:'Hobsons Bay Chess Club', heroStrapline:'building champions and community through chess', heroDescription:"Largest chess club in Melbourne's West",
  heroImage:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/11/ChatGPT-Image-Nov-30-2025-08_24_09-PM.png'),
  partnerImage:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/12/Off-Peak-5-1-e1767162829690.png'),
  logo:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/12/5af9878f-9d8a-437b-92e8-d46442b04f8c.png'),
  favicon:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/12/favicon_reverse_512-Edited-Edited.png'),
  email:'info@hobsonsbaychess.com',address:'108 Queen St, Altona VIC 3018, Australia',
  portalUrl:'https://portal.hobsonsbaychess.com/public/schedule/events',
  // Cross-checked against the live browser DOM; a cached header returned theme-vendor socials.
  facebookUrl:'https://www.facebook.com/hobsonsbaychess',
  instagramUrl:'https://www.instagram.com/hobsonsbaychess/',
  navigation,
  features:[
    {title:'Play Chess',description:'weekly club nights + tournaments',href:'/play-chess/',icon:'chess'},
    {title:'Juniors',description:'coaching and development pathway',href:'/juniors/',icon:'pawn'},
    {title:'Tournaments',description:'rated and social events, major opens',href:'/tournaments/',icon:'board'},
    {title:'Membership',description:'join, save, and support the club',href:'/membership/',icon:'membership'},
  ],
  stats:$('.bt_bb_counter_holder').map((_,e)=>({value:$(e).find('.onedigit').map((_,d)=>$(d).attr('data-digit')).get().join(''),label:$(e).find('.bt_bb_counter_text').text().trim()})).get(),
  standings:{title:'2025 STANDINGS',subtitle:'Club Championship Open',url:liveDom('a').filter((_,e)=>liveDom(e).text().trim()==='Full Table').attr('href'),rows:[['1','McIntyre, Julian','5'],['2','Krishnan, Anirudh','4.5'],['3','CM Davis, Tony J','4.5'],['4','Nguyen, Anh Kiet','4'],['5','Wongso, Renaldo','3.5'],['6','Whitford, Matthew','3.5'],['7','Hogan, Steven','2.5'],['8','Pasukov, Leo','0.5']]},
  schedule:[{day:'Monday',sessions:[]},{day:'Tuesday',sessions:[{time:'19:30 onwards',title:'Open Tournament'}]},{day:'Wednesday',sessions:[]},{day:'Thursday',sessions:[]},{day:'Friday',sessions:[]},{day:'Saturday',sessions:[{time:'17:00 – 18:00',title:'Junior Coaching'},{time:'18:00 onwards',title:'Rookies & Juniors Tournament'}]},{day:'Sunday',sessions:[]}],
  scheduleUrl:'/calendar/',
  weeklyImage:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/12/4.jpeg'),
  footerImages:['cropped-2_1_11','ChatGPT-Image-Nov-30','vlad-sargu','chase-clark','jeshoots-com','michal-vrba'].map(part=>liveDom('img').filter((_,e)=>(liveDom(e).attr('src')||'').includes(part)).last().attr('src')).filter(Boolean).map(localAsset),
};
const events = [
  {id:'event-bob-open-2026',title:'Honourable Bob Cup Open 2026',startsAt:'2026-01-27T19:30:00+11:00',detail:'Round #1 @ 7:30 PM',order:1,image:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2026/01/Untitled-1706-x-2560-px-10-320x480.png'),registerUrl:'https://portal.hobsonsbaychess.com/public/schedule/events/79867-honourable-bob-open-2026'},
  {id:'event-coaching-2026',title:'HBCC Junior Coaching 2026',startsAt:'2026-01-31T17:00:00+11:00',detail:'Term 1 @ 5 PM',order:2,image:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2025/12/73d6d6c6-d4f3-47f5-bbbd-8667da71b8ac-320x479.jpg'),registerUrl:'https://portal.hobsonsbaychess.com/public/schedule/events/79681-hobsons-bay-junior-coaching-2026-term-1'},
  {id:'event-bob-juniors-2026',title:'Honourable Bob Cup Juniors 2026',startsAt:'2026-01-31T18:00:00+11:00',detail:'Round #1 @ 6 pm',order:3,image:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2026/01/Untitled-1706-x-2560-px-10-320x480.png'),registerUrl:'https://portal.hobsonsbaychess.com/public/schedule/events/79360-honourable-bob-rookies-and-juniors-2026'},
  {id:'event-purdy-2026',title:'C J S Purdy Cup OPEN 2026',startsAt:'2026-03-10T19:30:00+11:00',detail:'Round #1 @ 7:30 PM',order:4,image:localAsset('https://hobsonsbaychess.com/wp-content/uploads/2026/01/Untitled-1706-x-2560-px-7-320x480.png'),registerUrl:settings.portalUrl},
];
events.forEach(event => { event.migrationReviewRequired = true; });
const sponsorFiles=['Alkassab_Normal.png','Off-Peak-3-640x338.png','Off-Peak-4-640x338.png','Sponsor-Logos-HCCC-1-640x338.png','Copy-of-ALSC-3-Square','Visa-Finder-Final-logo'];
const sponsors = sponsorFiles.map((part,i)=>{
  const image = liveDom('img').filter((_,e)=>(liveDom(e).attr('src')||'').includes(part)).first();
  const href=image.closest('a').attr('href');
  return {id:`sponsor-${i+1}`,name:['Alkassab Dental Surgery','Joyous Realty Estate','VACDIRECT Hoppers Crossing','GS Chess','Altona Sports Club','Visa Finder'][i],image:localAsset(image.attr('src')),website:href&&href!=='#'?safeUrl(href):'/sponsors/',order:i+1};
});
const posts=sourcePosts.map(p=>{
 const featured=media.find(m=>m.id===p.featured_media);
 return {id:`wp-post-${p.id}`,wordpressId:p.id,slug:new URL(p.link).pathname.slice(1,-1),title:decodeText(p.title.rendered),publishedAt:p.date_gmt+'Z',excerpt:decodeText(p.excerpt.rendered),bodyHtml:migrateHtml(p.content.rendered),image:featured?localAsset(featured.source_url):null,migrationReviewRequired:true,originalUrl:p.link};
});
const data={capturedAt:manifest.capturedAt,settings,pages,posts,events,sponsors};
await writeFile('src/data/site.json',JSON.stringify(data,null,2));
await writeFile('reference/route-inventory.json',JSON.stringify(sourcePages.map(p=>({wordpressId:p.id,url:p.link,title:decodeText(p.title.rendered),decision:new URL(p.link).pathname==='/'?'rebuild-homepage':pagePaths.includes(new URL(p.link).pathname)?'migrate-club-page':'archive-and-review-demo-route'})),null,2));

const localized=fields=>Object.fromEntries(Object.entries(fields).filter(([k,v])=>k!=='id'&&v!==null&&v!==undefined).map(([k,v])=>[k,{'en-US':Array.isArray(v)?{items:v}:v}]));
const entries=[{sys:{id:settings.id,contentType:{sys:{type:'Link',linkType:'ContentType',id:'siteSettings'}}},fields:localized(settings)},...pages.map(p=>({sys:{id:p.id,contentType:{sys:{type:'Link',linkType:'ContentType',id:'page'}}},fields:localized(p)})),...posts.map(p=>({sys:{id:p.id,contentType:{sys:{type:'Link',linkType:'ContentType',id:'post'}}},fields:localized(p)})),...events.map(p=>({sys:{id:p.id,contentType:{sys:{type:'Link',linkType:'ContentType',id:'event'}}},fields:localized(p)})),...sponsors.map(p=>({sys:{id:p.id,contentType:{sys:{type:'Link',linkType:'ContentType',id:'sponsor'}}},fields:localized(p)}))];
await writeFile('contentful/seed.json',JSON.stringify({version:1,locale:'en-US',entries},null,2));
const usedLocal=[...new Set(JSON.stringify(data).match(/\/wp-assets\/[^"\\\s<]+/g)||[])];
const usedAssets=manifest.assets.filter(a=>usedLocal.includes(a.localUrl));
await writeFile('contentful/assets.json',JSON.stringify(usedAssets.map(a=>({id:`wp-asset-${createHash('sha256').update(a.url).digest('hex').slice(0,20)}`,sourceUrl:a.url,localUrl:a.localUrl,path:a.path,fileName:a.path.split('/').at(-1),title:decodeURIComponent(new URL(a.url).pathname.split('/').at(-1)).replace(/[-_]/g,' ')})),null,2));
// Keep the original font shapes from the current site, with local font files.
let fonts='';
for(const name of await readdir('reference/styles')) if(name.includes('css2')){
 const css=await readFile(`reference/styles/${name}`,'utf8');
 for(const block of css.match(/\/\* latin \*\/[\s\S]*?@font-face\s*\{[^}]+\}/g)||[]){
  if(!/font-family: '(Antonio|Exo)'/.test(block)) continue;
  fonts+=block.replace(/url\(([^)]+)\)/g,(_,u)=>`url(${localAsset(u)})`)+'\n';
 }
}
const solid=manifest.assets.find(a=>a.path.endsWith('FontAwesome5Solid.woff'));
if(solid)fonts+=`@font-face{font-family:HBCCIcons;src:url(${solid.localUrl}) format('woff');font-display:block;font-weight:900;}\n`;
await writeFile('public/fonts/hbcc-fonts.css',fonts.replaceAll('url(/fonts/','url(./').replaceAll('url(/wp-assets/','url(../wp-assets/'));
console.log(JSON.stringify({clubPages:pages.length,posts:posts.length,events:events.length,sponsors:sponsors.length,seedEntries:entries.length,referencedAssets:usedAssets.length,fontsLocal:fonts.includes('/wp-assets/')},null,2));
