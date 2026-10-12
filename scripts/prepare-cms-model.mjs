import {writeFile} from 'node:fs/promises';

const field=(id,name,type,required=false,extra={})=>({id,name,type,required,localized:false,...extra});
const text=(id,name,required=false)=>field(id,name,'Symbol',required,{validations:[{size:{max:256}}]});
const long=(id,name,required=false)=>field(id,name,'Text',required);
const enabled=()=>field('enabled','Show on website','Boolean',false,{defaultValue:{'en-US':true}});
const select=(id,name,values,required=false)=>field(id,name,'Symbol',required,{validations:[{in:values}]});
const asset=(id,name,required=false)=>field(id,name,'Link',required,{linkType:'Asset',validations:[{linkMimetypeGroup:['image']}]});
const ref=(id,name,types,required=false)=>field(id,name,'Link',required,{linkType:'Entry',validations:[{linkContentType:types}]});
const refs=(id,name,types,required=false)=>field(id,name,'Array',required,{items:{type:'Link',linkType:'Entry',validations:[{linkContentType:types}]},validations:[{size:{max:200,...(required?{min:1}:{})}}]});
const rich=(id,name,policies=false)=>field(id,name,'RichText',false,{validations:[{enabledMarks:['bold','italic','underline','code','superscript','subscript']},{enabledNodeTypes:['heading-2','heading-3','heading-4','heading-5','heading-6','ordered-list','unordered-list','hr','blockquote','embedded-asset-block','embedded-entry-block','hyperlink','entry-hyperlink','asset-hyperlink','table']},{nodes:{'embedded-entry-block':[{linkContentType:['contentCard','section','galleryImage']}],'entry-hyperlink':[{linkContentType:['page','post',...(policies?['policy']:[])]}]}}]});
const slug=field('slug','URL slug','Symbol',true,{validations:[{unique:true},{regexp:{pattern:'^[a-z0-9-]+(?:/[a-z0-9-]+)*$'}}]});
const icon=()=>select('icon','Icon',['none','chess','pawn','board','membership','history','people','junior','calendar','events','attendance','facebook','instagram','youtube']);
const type=(id,name,description,displayField,fields)=>({sys:{id},name,description,displayField,fields});
const contentTypes=[
 type('siteSettings','Website settings','Start here: homepage, menus, branding and footer.','title',[
  text('title','Club name',true),text('shortName','Short name',true),asset('logo','Club logo',true),asset('favicon','Browser icon'),long('defaultDescription','Default search description',true),
  ref('homePage','Homepage',['page'],true),ref('mainMenu','Main menu',['navigationMenu'],true),refs('footerMenus','Footer link columns',['navigationMenu']),ref('legalMenu','Legal links',['navigationMenu']),ref('policyPage','Policies hub',['page']),
  text('email','Public contact email',true),long('address','Venue address',true),refs('headerSocialLinks','Header social links',['navigationItem']),refs('socialLinks','Footer social links',['navigationItem']),text('footerBrandLabel','Footer brand text'),text('contactHeading','Contact heading'),text('connectHeading','Social heading'),text('instagramLabel','Instagram link text'),
  ref('joinBanner','Join/contact banner',['section']),refs('footerGallery','Footer image gallery',['galleryImage']),long('copyright','Copyright — use {year} for current year'),
  text('newsTitle','News listing heading',true),long('newsDescription','News listing description'),text('readMoreLabel','Read-more label',true),text('homeLabel','Home breadcrumb',true),text('newsLabel','News breadcrumb',true),text('menuLabel','Menu heading',true)
 ]),
 type('navigationMenu','Menu','Drag items to change order. Main navigation, footer columns and legal links.','title',[text('title','Menu name / column heading',true),refs('items','Menu items in display order',['navigationItem'],true)]),
 type('navigationItem','Menu item / button / social link','Choose a page, policy, tournament destination or URL. Link children to create submenus.','label',[
  text('label','Link text',true),ref('page','Website page',['page','post']),ref('policy','Policy in the Policies hub',['policy']),ref('tournamentFeed','Tournament service',['tournamentFeed']),select('tournamentDestination','Tournament destination',['leaderboard','upcoming','calendar']),text('url','External URL, local route, email or anchor'),refs('children','Submenu items',['navigationItem']),field('openInNewTab','Open in new tab','Boolean'),icon(),enabled()
 ]),
 type('page','Website page','Edit hero and ordered sections. Rich text does not require HTML.','title',[
  text('title','Page title',true),slug,select('template','Page template',['content','home'],true),long('description','Summary / search description',true),text('seoTitle','Search/social title override'),asset('heroImage','Hero background'),text('heroTitle','Hero title override'),text('heroStrapline','Homepage gold strapline'),long('heroDescription','Hero introduction'),
  asset('partnerImage','Partner graphic'),text('partnerAlt','Partner alternative text'),ref('partnerLink','Partner link',['navigationItem']),refs('heroActions','Hero buttons',['navigationItem']),refs('featureCards','Homepage feature cards',['contentCard']),refs('sections','Sections in display order',['section']),field('noindex','Hide from search engines','Boolean'),enabled(),
  field('wordpressId','Original WordPress ID','Integer'),text('originalUrl','Original URL — reference')
 ]),
 type('post','News article','Club news with native rich text, media and optional Facebook import details. Facebook sync saves drafts for editorial review.','title',[
  text('title','Article title',true),slug,field('publishedAt','Article date','Date',true),long('excerpt','Short summary'),asset('image','Cover image'),text('imageAlt','Cover alternative text'),text('author','Author'),text('category','Category'),rich('body','Article body'),text('seoTitle','Search/social title override'),field('noindex','Hide from search engines','Boolean'),enabled(),field('migrationReviewRequired','Imported content needs review','Boolean'),field('wordpressId','Original WordPress ID','Integer'),text('originalUrl','Original URL — reference'),
  text('facebookPostId','Original Facebook post ID'),field('facebookSyncEnabled','Allow Facebook updates','Boolean'),text('facebookSourceHash','Facebook source fingerprint'),text('facebookImportHash','Last imported article fingerprint')
 ]),
 type('section','Page / homepage section','Choose layout and edit its fields. Link to a page and drag to reorder. Fields apply to the selected layout.','internalName',[
  text('internalName','Editor name',true),select('kind','Section layout',['richText','columns','cards','accordion','gallery','embed','statistics','leaderboardEvents','feature','schedule','sponsors','news','quote','cta','calendar','policies'],true),enabled(),
  select('layoutStyle','Layout variation',['default','pricing','benefits','steps','split','portraits','roster','affiliations']),
  text('title','Section heading'),text('subtitle','Supporting text'),text('secondaryTitle','Second column heading'),text('eyebrow','Small heading / attribution'),rich('body','Formatted text',true),asset('image','Background / feature image'),text('imageAlt','Image alternative text'),
  refs('actions','Buttons / heading links',['navigationItem']),refs('children','Column sections',['section']),refs('cards','Cards or questions',['contentCard']),refs('statistics','Club statistics',['statistic']),refs('days','Weekly schedule days',['scheduleDay']),refs('sponsors','Sponsors in order',['sponsor']),refs('policies','Policies in display order',['policy']),refs('posts','Featured news',['post']),refs('gallery','Gallery images',['galleryImage']),ref('tournamentFeed','Tournament service',['tournamentFeed']),
  select('tone','Background style',['light','dark','gold']),field('limit','Items to display','Integer',false,{validations:[{range:{min:1,max:20}}]}),text('emptyText','No-items message'),long('embedUrl','Approved YouTube or Google embed URL'),ref('calendar','Club calendar',['calendarSchedule'])
 ]),
 type('contentCard','Card / question / timeline item','Reusable features, information cards, FAQs and timelines.','title',[
  text('title','Title / question',true),select('presentation','Card style',['card','faq','timeline','pricing','step','profile','roster'],true),text('eyebrow','Small heading / year'),text('price','Display price, e.g. $90+'),long('description','Short description'),rich('body','Formatted content / answer',true),asset('image','Image'),text('imageAlt','Image alternative text'),icon(),ref('link','Card action',['navigationItem']),enabled()
 ]),
 type('statistic','Club statistic','Individual value and label. Do not relabel historical counts without new figures.','label',[text('label','Label',true),text('value','Display value, e.g. 130+',true),icon(),enabled()]),
 type('scheduleDay','Weekly schedule day','All seven days. Link sessions on playing days.','day',[select('day','Day',['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],true),refs('sessions','Sessions in order',['scheduleSession']),text('closedText','No-session message',true)]),
 type('scheduleSession','Weekly session','Normal club times. Event dates remain on the tournament website.','title',[text('title','Session name',true),text('time','Display time',true),text('location','Venue label'),ref('link','Optional details link',['navigationItem'])]),
 type('sponsor','Sponsor / partner','Edit logo, name and destination; reorder on the section.','name',[text('name','Sponsor name',true),asset('image','Sponsor logo',true),text('website','Website or local sponsor page'),long('description','Description'),enabled()]),
 type('galleryImage','Gallery image','Native media picker, alternative text and optional link.','title',[text('title','Editor name',true),asset('image','Image',true),text('alt','Alternative text',true),ref('link','Image link',['navigationItem']),enabled()]),
 type('policy','Club policy','Reusable club policies. Edit the title and summary, replace the approved document, or provide formatted policy text. Linked sections control display order.','title',[
  text('title','Policy title',true),field('slug','Stable section link','Symbol',true,{validations:[{unique:true},{regexp:{pattern:'^[a-z][a-z0-9-]*$'}}]}),
  long('summary','Short description'),field('document','Approved document (PDF)','Link',false,{linkType:'Asset'}),rich('body','Optional policy text',true),
  text('version','Document version, if supplied'),field('effectiveDate','Effective date, if supplied','Date'),enabled()
 ]),
 type('calendarSchedule','Club calendar','Choose the year and linked events. The initial schedule was imported from Schedule 2026.xlsx.','title',[
  text('title','Calendar name',true),field('year','Calendar year','Integer',true),long('description','Calendar introduction'),long('sourceUrl','Original spreadsheet'),refs('events','Calendar events',['calendarEvent'],true)
 ]),
 type('calendarEvent','Calendar event','Edit a tournament round, coaching session, social night or closure. Dates use Melbourne local calendar days; source times were not supplied.','title',[
  text('title','Event name',true),field('startDate','First date','Date',true),field('endDate','Last date (inclusive)','Date',true),
  select('category','Category',['seniors','juniors','coaching','external','social','training','club','closed'],true),
  long('details','Details'),text('schoolSchedule','School term / holiday'),text('eventType','Original event type'),long('arbiter','Arbiters'),
  field('sourceRow','Original spreadsheet row','Integer'),text('sourceDateText','Original written date'),text('sourceDay','Original weekday'),long('sourceUrl','Original spreadsheet'),
  field('needsReview','Date needs confirmation','Boolean'),enabled()
 ]),
 type('tournamentFeed','Tournament website integration','Tournament scores and registration remain on the existing service. The club calendar is managed separately.','title',[
  text('title','Editor name',true),field('year','Expected leaderboard year','Integer',true,{validations:[{range:{min:2020,max:2100}}]}),text('dataUrl','Open leaderboard JSON URL',true),text('leaderboardUrl','Full leaderboard URL',true),text('upcomingUrl','Upcoming events URL',true),text('calendarUrl','Calendar URL',true),
  field('rows','Leaderboard rows','Integer',true,{validations:[{range:{min:1,max:20}}]}),field('eventsLimit','Upcoming cards','Integer',true,{validations:[{range:{min:1,max:10}}]}),text('pointsLabel','Points column label',true),text('updatedLabel','Data timestamp label',true),long('pointsExplanation','Scoring explanation',true),text('unavailableText','Unavailable message',true)
 ])
];
const helps={
 'navigationItem.page':'A page reference follows future slug changes. Leave URL blank when a page is selected.',
 'navigationItem.policy':'Select a Club policy to link to its section in the Policies hub. Its stable link follows the policy entry; a hidden policy returns visitors to the hub.',
 'navigationItem.url':'Use https://, /path/, mailto: or #anchor. Select one destination. A selected policy takes priority, then a page, tournament destination or URL.',
 'navigationItem.tournamentFeed':'Choose the shared tournament service and destination to keep these links in sync with its URL settings.',
 'navigationItem.children':'Drag to reorder. Supports nested menus. Do not link an item to itself.',
 'page.slug':'Lowercase words and hyphens, no surrounding slash. Homepage uses home. Preserve existing slugs for inbound links.',
 'page.sections':'Drag to reorder. Open a linked section to edit. Removing its reference hides it on this page.',
 'section.kind':'Content pages: Rich text, Columns, Cards, Accordion, Gallery or Embed. Homepage layouts use the corresponding linked collections.',
 'section.body':'Use the rich text toolbar: tables, lists, links and embedded images. Embed Card entries for FAQs/timelines.',
 'section.layoutStyle':'Pricing: fee cards. Benefits: four panels. Steps: numbered joining steps. Split: image/text columns. Portraits: committee photos. Roster: compact names and roles. Affiliations: contained linked logos.',
 'section.policies':'Select the Policies layout and drag policy references into the order visitors should see them. Publish each policy and its document.',
 'contentCard.price':'Display value from the approved membership schedule. Pricing cards show this prominently; do not infer new fees.',
 'policy.slug':'Lowercase letters and hyphens. This is a section anchor in /policies/; native policy links follow changes automatically.',
 'policy.document':'Upload or choose the club-approved policy PDF. Replacing this reference updates every use of this policy after publication and rebuild.',
 'policy.body':'Optional approved text. Supply a document or non-empty policy text before publishing. Do not duplicate a PDF here unless the club wants an HTML version.',
 'siteSettings.policyPage':'Choose the page containing the Policies layout. Native policy links follow this page and each policy’s stable section link.',
 'section.tournamentFeed':'Required for Leaderboard + Events. Scores and event cards refresh from the existing tournament service.',
 'section.actions':'First link is primary. Leaderboard + Events: first = Full Table, second = All Events.',
 'section.posts':'Featured articles in order; leave empty to show the newest published club news automatically.',
 'section.calendar':'Choose a Club calendar for the Calendar layout. Edit its linked Calendar event entries to update dates.',
 'calendarEvent.startDate':'Use the exact local date. The spreadsheet supplied dates without session times.',
 'calendarEvent.endDate':'Inclusive last day. A single-day event uses the same first and last date.',
 'calendarEvent.needsReview':'Conflicting spreadsheet dates remain hidden drafts. Confirm dates, turn this off, choose Show, and add the event to the calendar before publishing.',
 'post.facebookSyncEnabled':'Future imports remain drafts. Turn off to keep an article entirely under manual editorial control. Manual article edits are protected from overwrite.',
 'post.originalUrl':'Public source permalink. Shown as a source link on imported club news.',
 'tournamentFeed.dataUrl':'Currently https://tournament.hobsonsbaychess.com/open-ratings.json. Its year must match Expected leaderboard year.',
 'siteSettings.copyright':'Example: © {year} Hobsons Bay Chess Club. All Rights Reserved.',
 'post.migrationReviewRequired':'Imported football theme demo content: replace or disable before launch.'
};
const editorInterfaces=contentTypes.map(t=>({contentTypeId:t.sys.id,controls:t.fields.map(f=>({fieldId:f.id,widgetNamespace:'builtin',widgetId:f.type==='RichText'?'richTextEditor':f.type==='Link'?(f.linkType==='Asset'?'assetLinkEditor':'entryLinkEditor'):f.type==='Array'?'entryLinksEditor':f.type==='Text'?'multipleLine':f.type==='Boolean'?'boolean':f.type==='Integer'?'numberEditor':f.type==='Date'?'datePicker':f.id==='slug'?'slugEditor':f.validations?.some(v=>v.in)?'dropdown':'singleLine',settings:{helpText:helps[`${t.sys.id}.${f.id}`]||'',...(f.type==='Boolean'?{trueLabel:f.id==='enabled'?'Show':'Yes',falseLabel:f.id==='enabled'?'Hide':'No'}:{})}}))}));
await writeFile('contentful/schema.json',JSON.stringify({version:2,contentTypes},null,2));
await writeFile('contentful/editor-interfaces.json',JSON.stringify({editorInterfaces},null,2));
console.log(`Prepared ${contentTypes.length} structured types and editor interfaces.`);
