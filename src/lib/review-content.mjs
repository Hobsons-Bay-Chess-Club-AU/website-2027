// The proposal is an isolated overlay on published CMS entries. Never writes to
// Contentful, and never mutates the entries used by the current website.
import {sponsorProfileAnchor} from './sponsors.mjs';
export const reviewDate = '12 October 2026';
export const reviewSources = {
 coaching:'https://portal.hobsonsbaychess.com/public/schedule/events/89309-hobsons-bay-junior-coaching-2026-term-4',
 juniors:'https://portal.hobsonsbaychess.com/public/schedule/events/89505-hbcc-junior-club-championship-reserves-rookies-juniors-2026',
 registration:'https://portal.hobsonsbaychess.com/public/schedule/events',
 membership:'https://portal.hobsonsbaychess.com/public/membership_levels',
 login:'https://portal.hobsonsbaychess.com/users/sign_in',
 results:'https://tournament.hobsonsbaychess.com/v2/',
 upcoming:'https://tournament.hobsonsbaychess.com/v2/upcoming',
 tournamentCalendar:'https://tournament.hobsonsbaychess.com/v2/calendar',
 games:'https://games.hobsonsbaychess.com/',
};
const ref=id=>({sys:{type:'Link',linkType:'Entry',id}});
const text=value=>({nodeType:'text',value,marks:[],data:{}});
const paragraph=value=>({nodeType:'paragraph',data:{},content:[text(value)]});
const document=(...values)=>({nodeType:'document',data:{},content:values.map(paragraph)});
const nodeText=node=>node?.nodeType==='text'?node.value:(node?.content||[]).map(nodeText).join('');
const visit=(node,fn)=>{if(!node||typeof node!=='object')return;fn(node);for(const child of node.content||[])visit(child,fn);};
const linkLabel=node=>nodeText(node).replace(/\s+/g,' ').trim().toLowerCase();

export function createReviewEntries(publishedItems){
 const items=structuredClone(publishedItems),byId=new Map(items.map(e=>[e.id,e]));
 const get=id=>{const e=byId.get(id);if(!e)throw new Error('V2 proposal needs the published entry '+id);return e;};
 const add=(type,id,fields)=>{if(byId.has(id))throw new Error('Duplicate review entry '+id);const e={id,type,...fields};items.push(e);byId.set(id,e);return ref(id);};
 let count=0;
 const action=(label,url,extra={})=>add('navigationItem','review-action-'+(++count),{label,url,enabled:true,...extra});
 const pageAction=(label,id,fragment,extra={})=>add('navigationItem','review-action-'+(++count),{label,page:ref(id),fragment,enabled:true,...extra});
 const section=(id,title,fields={})=>add('section',id,{internalName:title,title,kind:'richText',tone:'light',enabled:true,...fields});
 const card=(id,title,fields={})=>add('contentCard',id,{title,presentation:'card',enabled:true,...fields});
 const menu=(id,title,links)=>add('navigationMenu',id,{title,items:links});
 const repairLinks=(id,rules)=>{visit(get(id).body,node=>{
  if(!['hyperlink','entry-hyperlink','asset-hyperlink'].includes(node.nodeType))return;
  const replacement=rules[linkLabel(node)];if(!replacement)return;
  node.nodeType='hyperlink';node.data={uri:replacement.url};
  if(replacement.label)node.content=[text(replacement.label)];
 });for(const child of get(id).children||[])repairLinks(child.sys.id,rules);};
 const anchor=(id,value)=>{get(id).anchor=value;};
 const settings=get('hbcc-site-settings');settings.reviewVersion='v2';settings.reviewDate=reviewDate;
 let annualNode;
 const findAnnual=id=>{visit(get(id).body,n=>{if(n.nodeType==='asset-hyperlink')annualNode=n;});for(const child of get(id).children||[])findAnnual(child.sys.id);};
 findAnnual('wp-page-4272-section-1');
 const annualPdf=annualNode?.data?.target?.url;
 if(!annualPdf)throw new Error('V2 needs the existing annual schedule PDF.');

 const join=pageAction('Join / Renew','wp-page-4424');
 const login=action('Member Login',reviewSources.login,{openInNewTab:true});
 const whatson=action("What's On",'/calendar/?view=upcoming');
 const register=action('Register for an Event',reviewSources.registration);
 const results=action('Pairings & Results',reviewSources.results);
 settings.headerActions=menu('review-header-actions','Membership actions',[join,login]);
 settings.quickActions=menu('review-quick-actions','Quick tasks',[whatson,register,results]);

 const play=pageAction('Play','wp-page-4272',undefined,{children:[
  pageAction('First Visit','wp-page-4272','first-visit'),pageAction('Adult & Social Chess','wp-page-4272','social-chess'),
  pageAction('Junior Chess','wp-page-4332'),pageAction('Weekly Club Times','wp-page-4272','weekly-schedule'),pageAction('Venue & Getting Here','wp-page-13'),
 ]});
 const calendar=pageAction('Calendar','wp-page-5225',undefined,{children:[
  pageAction('All Club Dates','wp-page-5225'),action('Senior Tournaments','/calendar/?category=seniors'),
  action('Junior Tournaments','/calendar/?category=juniors'),action('Coaching Dates','/calendar/?category=coaching'),
  register,action('Annual Schedule (original PDF)',annualPdf),
 ]});
 const tournaments=pageAction('Tournaments','wp-page-4419',undefined,{children:[
  action('Upcoming Tournaments',reviewSources.upcoming),register,results,pageAction('Live Boards','wp-page-5209'),
  action('Games & PGNs',reviewSources.games),pageAction('Flagship Events','wp-page-4419','flagship'),pageAction('Best in the West','wp-page-5044'),
 ]});
 const coaching=pageAction('Coaching','review-coaching-page',undefined,{children:[
  pageAction('Programs & Levels','review-coaching-page','programs'),pageAction('Meet the Coaches','review-coaching-page','coaches'),
  pageAction('Junior Coaching','review-coaching-page','programs'),pageAction('Private Coaching','review-coaching-page','private-coaching'),pageAction('Enrol or Enquire','review-coaching-page','enrol'),
 ]});
 const club=pageAction('Club','wp-page-11',undefined,{children:[
  pageAction('About HBCC','wp-page-11',undefined,{group:'About & people'}),pageAction('Committee & Volunteers','wp-page-11','committee',{group:'About & people'}),pageAction('Arbiters','wp-page-11','arbiters',{group:'About & people'}),
  pageAction('History','wp-page-4852',undefined,{group:'History'}),pageAction('Champions & Honour Boards','wp-page-5008',undefined,{group:'History'}),pageAction('Peter Caissa Memorial','wp-page-5021',undefined,{group:'History'}),
  pageAction('Sponsors','wp-page-4382',undefined,{group:'Membership & support'}),pageAction('Become a Sponsor','wp-page-4382','become-a-sponsor',{group:'Membership & support'}),
  pageAction('Membership','wp-page-4424',undefined,{group:'Membership & support'}),pageAction('Policies','wp-page-5242',undefined,{group:'Membership & support'}),pageAction('Contact & Venue','wp-page-13',undefined,{group:'Membership & support'}),
 ]});
 const news=action('News','/news/');
 settings.mainMenu=menu('review-main-menu','Main navigation',[play,calendar,tournaments,coaching,club,news]);

 // Fix the inherited journeys in this version, retaining the original pages.
 repairLinks('wp-page-4272-section-1',{'view seniors calendar':{url:'/calendar/?category=seniors'}});
 repairLinks('wp-page-4272-section-2',{'register for social night':{url:'/calendar/?category=social&view=upcoming',label:'Find Social Nights'}});
 for(const id of ['wp-page-4272-section-6','wp-page-4424-section-7'])repairLinks(id,{'view calendar':{url:'/calendar/'}});
 for(const e of items.filter(e=>e.id.startsWith('wp-page-4424-')||e.id.startsWith('wp-page-4332-')||e.id.startsWith('wp-page-11-'))){
  if(!e.body)continue;
  repairLinks(e.id,{
   'renew now':{url:reviewSources.membership},'view juniors program':{url:'/juniors/'},
   'join the club':{url:'/membership/'},'join hbcc today':{url:'/membership/'},
   'enrol in juniors':{url:'/coaching/#enrol'},'enroll now':{url:'/coaching/#enrol',label:'Enrol or Enquire'},
   'view juniors calendar':{url:'/calendar/?category=juniors'},
  });
 }
 get('home-view-calendar').page=ref('wp-page-5225');
 get('calendar-service-link').label='Tournament Calendar';
 const footerResults=get('footer-club-3');footerResults.label='Pairings & Results';footerResults.url=reviewSources.results;delete footerResults.tournamentFeed;delete footerResults.tournamentDestination;
 for(const id of ['footer-club-4','footer-legal-0']){const link=get(id);link.page=ref('review-privacy-page');delete link.policy;delete link.url;}
 get('footer-legal-1').enabled=false;
 const footerQuick=get('hbcc-footer-quick');footerQuick.items.push(pageAction('Coaching','review-coaching-page'));
 for(const e of items){
  if(e.body)visit(e.body,node=>{if(node.nodeType==='text')node.value=node.value.replace(/\[\/?bold_timeline[^\]]*\]/g,'').replace('WHo We Are','Who We Are').replace('Steven hogan','Steven Hogan').replace('OUR ADRESS','OUR ADDRESS');});
 }
 get('wp-page-4332-section-8-faq-58').body=document('Contact the coaching team to discuss your child’s age, experience and the most suitable starting group.');
 get('wp-page-5209').title='Live Boards';
 get('wp-page-5209').description='Watch club tournament broadcasts and replay games from completed events.';
 visit(get('wp-page-5209-section-0').body,node=>{
  if(node.nodeType==='text')node.value=node.value.replace('Current Live Broadcasts','Broadcast Archive').replace('Select a tournament below to watch the games live on Lichess.','Replay these completed tournaments on Lichess. Check Upcoming Tournaments for the next event.');
 });
 get('wp-page-5209-section-0').actions=[action('Upcoming Tournaments',reviewSources.upcoming)];
 anchor('wp-page-4272-section-2','social-chess');anchor('wp-page-11-section-1','committee');anchor('wp-page-11-section-2','volunteers');anchor('wp-page-11-section-4','arbiters');

 const firstVisit=section('review-first-visit','Your First Visit',{
  anchor:'first-visit',tone:'gold',body:document('New to the club or returning after a break? Start with social chess, choose a suitable competition, or contact us for guidance. Juniors can explore the junior pathway and coaching programs.',
  'We play at 108 Queen Street, Altona. Arrive 10–15 minutes before your session. The club provides boards, pieces and clocks; bring a pen if you keep score. Check the event page for its start time, entry conditions and any registration requirement.'),
  actions:[action("What's On",'/calendar/?view=upcoming'),pageAction('Ask the Club','wp-page-13'),pageAction('Junior Chess','wp-page-4332')],
 });
 const weekly=section('review-play-weekly','Typical Weekly Schedule',{kind:'schedule',anchor:'weekly-schedule',days:structuredClone(get('home-weekly-schedule').days),actions:[pageAction('Club Calendar','wp-page-5225')]});
 get('wp-page-4272').sections.unshift(firstVisit);get('wp-page-4272').sections.splice(4,0,weekly);

 // Derive cards from the same published Junior program/coach sections each build.
 // This keeps the preview roster and the Junior page tied to one source.
 const makeSourceCards=(sourceId,imagePrefix,titlePairs,cardPrefix)=>{
  const source=get(sourceId);
  if(source.kind==='cards'&&source.cards?.length){
   return source.cards.map(r=>{if(imagePrefix==='program')get(r.sys.id).link=pageAction('Enrol or Enquire','review-coaching-page','enrol');return r;});
  }
  const nodes=source.body.content,images=nodes.filter(n=>n.nodeType==='embedded-entry-block');
  return images.map((image,i)=>{
   const start=nodes.indexOf(image),end=nodes.indexOf(images[i+1]);
   const chunk=nodes.slice(start+1,end<0?undefined:end);
   const titleNode=chunk.find(n=>n.nodeType.startsWith('heading-'));
   const title=titleNode?nodeText(titleNode).replace(/\s+/g,' ').trim():titlePairs[i];
   const description=chunk.filter(n=>n.nodeType==='paragraph').map(nodeText).join(' ').replace(/\s+/g,' ').trim();
   const photo=get(image.data.target.sys.id);
   return card(cardPrefix+i,title,{image:photo.image,imageAlt:title,description,link:imagePrefix==='program'?pageAction('Enrol or Enquire','review-coaching-page','enrol'):undefined});
  });
 };
 const programs=makeSourceCards('wp-page-4332-section-2','program',[], 'review-program-');
 const coaches=makeSourceCards('wp-page-4332-section-5','coach',[], 'review-coach-');
 const programsSource=get('wp-page-4332-section-2'),coachesSource=get('wp-page-4332-section-5');
 const nativePrograms=programsSource.kind==='cards',nativeCoaches=coachesSource.kind==='cards';
 programsSource.kind='cards';programsSource.title||='Programs & Levels';programsSource.anchor='programs';programsSource.cards=programs;
 if(!nativePrograms)programsSource.body=document(nodeText(programsSource.body.content.find(n=>n.nodeType==='paragraph')).replace(/\s+/g,' ').trim()||'Juniors are grouped by chess experience so that each child can learn at an appropriate level. Contact us to discuss the right group.');
 coachesSource.kind='cards';coachesSource.title||='Coaching & Support Team';coachesSource.anchor='coaches';coachesSource.cards=coaches;
 if(!nativeCoaches)coachesSource.body=document(nodeText(coachesSource.body.content.find(n=>n.nodeType==='paragraph')).replace(/\s+/g,' ').trim()||'Meet the coaches named on the club’s current website. The team is supported by club volunteers.');
 const termDates=['2026-10-10','2026-10-17','2026-10-24','2026-11-07','2026-11-14','2026-11-21','2026-11-28','2026-12-05'];
 const term=section('review-coaching-term','Term 4, 2026',{
  tone:'gold',body:document('Eight Saturday sessions: 10, 17 and 24 October; 7, 14, 21 and 28 November; and 5 December. No coaching on 31 October. Session times depend on the group and coach; check the term listing and your coordinator’s advice.',
   'The current term’s group ticket sales have ended, and one-on-one tickets are sold out. Contact the club about availability or the next intake.'),
  actions:[action('Current Term Details',reviewSources.coaching),action('Coaching Calendar','/calendar/?category=coaching')],
 });
 const privateCoaching=section('review-private-coaching','Private Coaching',{anchor:'private-coaching',body:document('One-on-one lessons offer targeted training, game analysis and a personalised study plan. Term 4 one-on-one tickets are currently sold out. Please enquire about availability and future sessions.'),actions:[pageAction('Enquire About Private Coaching','wp-page-13')]});
 const enrol=section('review-coaching-enrol','Enrol or Enquire',{anchor:'enrol',tone:'gold',body:document('New families: contact the club with your child’s experience and the program you are interested in. The existing junior enrolment process includes an enquiry, a registration link and a 15-minute Zoom orientation.',
  'Returning families: check the current term listing for details and availability, or browse the club’s event directory for future intakes. Contact us if ticket sales have ended or you need help choosing a group.'),actions:[pageAction('Contact the Coaching Team','wp-page-13'),action('Current Term Details',reviewSources.coaching),register]});
 add('page','review-coaching-page',{title:'Coaching',slug:'coaching',template:'content',enabled:true,noindex:true,heroTitle:'Chess Coaching at HBCC',description:'A clear pathway from first moves to competitive chess: explore programs, coaches, term dates and how to enquire.',heroImage:get('wp-page-4332').heroImage,
  sections:[ref('wp-page-4332-section-2'),term,ref('wp-page-4332-section-5'),privateCoaching,ref('wp-page-4332-section-6'),enrol]});
 get('wp-page-4332-section-3').actions=[pageAction('Programs & Term Dates','review-coaching-page'),pageAction('Enrol or Enquire','review-coaching-page','enrol')];

 const tournamentHub=section('review-tournament-hub','Find Your Tournament',{
  tone:'gold',body:document('Use the tournament service for upcoming competitions and pairings/results, the club portal for registration, and the games service for PGNs. Club dates, coaching and social sessions are also on the main calendar.'),
  actions:[action('Upcoming Tournaments',reviewSources.upcoming),register,results,pageAction('Live Boards','wp-page-5209'),action('Games & PGNs',reviewSources.games),action('Oceania Youth 2027','https://oceaniayouth2027.hobsonsbaychess.com/')],
 });
 const flagship=get('wp-page-4419-section-0');
 if(flagship.kind==='cards'&&flagship.cards?.length){
  flagship.anchor='flagship';
  for(const r of flagship.cards)get(r.sys.id).link=results;
 }else{
 const flagshipImages=flagship.body.content.filter(n=>n.nodeType==='embedded-entry-block');
 const flagshipNames=['Honourable Bob Cup','C. J. S. Purdy Cup','HBCC Club Championship','Koshnitsky Cup'];
 const flagshipDescriptions=flagship.body.content.filter(n=>n.nodeType==='paragraph').slice(1).map(nodeText);
 flagshipDescriptions[3]='A recurring classical competition commemorating Igor Koshnitsky.';
 const flagshipIntro=flagship.body.content.find(n=>n.nodeType==='paragraph');
 flagship.kind='cards';flagship.title='Flagship Events';flagship.anchor='flagship';flagship.body=document(nodeText(flagshipIntro)||'The club runs these recurring competitions. Check the tournament directory for each year’s dates and divisions.');
 flagship.cards=flagshipImages.map((n,i)=>card('review-flagship-'+i,flagshipNames[i],{image:get(n.data.target.sys.id).image,imageAlt:flagshipNames[i],description:flagshipDescriptions[i],link:results}));
 }
 get('wp-page-4419').sections.unshift(tournamentHub);

 const sponsorEntries=(get('wp-page-4382-section-0').sponsors||get('home-sponsors').sponsors).map(r=>get(r.sys.id));
 const sponsorCards=sponsorEntries.map((s,i)=>{
  const id=sponsorProfileAnchor(s.id);
  const external=s.website&&!s.website.startsWith('/')?s.website:null;
  const result=card('review-sponsor-'+i,s.name,{anchor:id,image:s.image,imageAlt:s.name,description:s.description||undefined,link:external?action('Visit '+s.name,external):undefined});
  if(!external)s.website='/sponsors/#'+id;
  return result;
 });
 const sponsorListing=get('wp-page-4382-section-0');sponsorListing.kind='cards';sponsorListing.layoutStyle='sponsorProfiles';sponsorListing.title='Our Sponsors & Partners';sponsorListing.body=document(sponsorListing.subtitle||'Thank you to the businesses and organisations supporting chess in our community.');sponsorListing.subtitle='';sponsorListing.cards=sponsorCards;
 const packages=get('wp-page-4382-section-2');packages.kind='richText';packages.layoutStyle='default';packages.cards=[];packages.body=document('Choose a package that suits your business. We can tailor inclusions for the right partner.','Ask the club for the current sponsorship pack, package prices and availability. The sponsorship team can discuss suitable inclusions and any current member offers.');packages.actions=[pageAction('Request Sponsorship Pack','wp-page-13')];
 anchor('wp-page-4382-section-7','become-a-sponsor');
 visit(get('wp-page-4382-section-4').body,n=>{if(n.nodeType==='text')n.value=n.value.replace('Member Offer?','Example member offer:').replace('We?d','We’d');});

 const policies=get('wp-page-5242-section-0'),typedPrivacy=items.find(e=>e.id==='hbcc-policy-privacy');let privacyLink;
 visit(policies.body,n=>{if(n.nodeType==='asset-hyperlink'&&linkLabel(n).includes('privacy'))privacyLink=structuredClone(n);});
 if(!typedPrivacy&&!privacyLink)throw new Error('V2 needs the existing privacy and photography policy.');
 const privacy=section('review-privacy-section','Privacy & Photography',{anchor:'privacy',...(typedPrivacy?{kind:'policies',policies:[ref(typedPrivacy.id)],body:document('Read the club’s existing Privacy & Photography Policy. Contact the club with questions about this document.')}:{body:{nodeType:'document',data:{},content:[paragraph('Read the club’s existing Privacy & Photography Policy. Contact the club with questions about this document.'),{nodeType:'paragraph',data:{},content:[privacyLink]}]}}),actions:[pageAction('All Club Policies','wp-page-5242')]});
 add('page','review-privacy-page',{title:'Privacy & Photography',slug:'privacy-policy',template:'content',description:'The club’s existing privacy and photography policy and contact details.',enabled:true,noindex:true,sections:[privacy]});
 if(!typedPrivacy)get('wp-page-5242').sections.push(privacy);

 // Program-specific schedule corrections, with the original imported text kept.
 for(let i=0;i<8;i++){
  const e=items.find(e=>e.type==='calendarEvent'&&e.title==='Term 4 Coaching #'+(i+1));
  if(!e)throw new Error('Missing Term 4 coaching session '+(i+1));
  e.startDate=termDates[i];e.endDate=termDates[i];e.url=reviewSources.coaching;e.verifiedSource=reviewSources.coaching;e.lastChecked='2026-10-12';e.eventType='Saturday coaching';
  e.details='Group and coach times vary. Check the current term listing; contact the club about future availability.';
 }
 for(const e of items.filter(e=>e.type==='calendarEvent'&&/Junior.*(?:Championship|Club Championship)/i.test(e.title)&&e.startDate>='2026-10-17')){
  e.url=reviewSources.juniors;e.verifiedSource=reviewSources.juniors;e.lastChecked='2026-10-12';
 }
 const breakEvent=get('calendar-2026-5bc4d2ba1fdb593e');breakEvent.title='Junior tournament break — Volunteer Appreciation Night';breakEvent.category='juniors';breakEvent.closureScope='Junior competition';breakEvent.url=reviewSources.juniors;breakEvent.verifiedSource=reviewSources.juniors;breakEvent.lastChecked='2026-10-12';breakEvent.details='No junior championship round this evening. Term 4 coaching session 7 is listed separately for this date.';
 const noCoaching=add('calendarEvent','review-no-coaching-oct31',{title:'Coaching break — Greg Hjorth weekender',category:'coaching',startDate:'2026-10-31',endDate:'2026-10-31',details:'No coaching this week. Junior championship round 3 is still scheduled.',closureScope:'Coaching',url:reviewSources.coaching,verifiedSource:reviewSources.coaching,lastChecked:'2026-10-12',enabled:true});
 const schedule=get('hbcc-calendar-2026');schedule.events.push(noCoaching);schedule.reviewVersion='v2';schedule.annualPdf=annualPdf;schedule.revisionText='Original annual PDF; the reviewed calendar above includes later Term 4 corrections.';
 schedule.description='Browse club dates, filter by activity or see what’s coming up. Term 4 coaching follows the current booking schedule; junior tournament breaks are shown separately.';
 add('page','review-team-review',{title:'V2 Changes & Review Checklist',slug:'review',template:'content',description:'The proposed changes, decisions for the club and visitor journeys to check before the new website is promoted.',enabled:true,noindex:true,sections:[]});
 return items;
}
