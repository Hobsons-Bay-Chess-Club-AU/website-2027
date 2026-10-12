import reference from '../reference/audit/page-restoration.json' with {type:'json'};

const ref=id=>({sys:{type:'Link',linkType:'Entry',id}});
const asset=id=>({sys:{type:'Link',linkType:'Asset',id}});
const text=value=>({nodeType:'text',value,marks:[],data:{}});
const paragraph=value=>({nodeType:'paragraph',data:{},content:[text(value)]});
const doc=(...content)=>({nodeType:'document',data:{},content});
const plain=(...values)=>doc(...values.filter(Boolean).map(paragraph));
const nodeText=n=>n?.value??(n?.content||[]).map(nodeText).join('');
const tidy=value=>value.replace(/\s+/g,' ').trim();
const list=values=>({nodeType:'unordered-list',data:{},content:values.map(value=>({nodeType:'list-item',data:{},content:[paragraph(value)]}))});
const heading=value=>({nodeType:'heading-3',data:{},content:[text(value)]});

// One-time, bounded restoration. Subsequent runs preserve Contentful edits.
// Every changed field remains a native CMS field, reference or Rich Text node.
export function pageRestorationUpdate(items){
 const byId=new Map(items.map(e=>[e.id,e])),changes=new Map();
 const get=id=>{const e=changes.get(id)||byId.get(id);if(!e)throw new Error('Page restoration needs '+id);return e;};
 const put=(type,id,fields)=>{changes.set(id,{id,type,...structuredClone(changes.get(id)||byId.get(id)||{}),...fields});return ref(id);};
 const patch=(id,fields)=>put(get(id).type,id,fields);
 const action=(id,label,target)=>put('navigationItem','restored-'+id,{label,enabled:true,openInNewTab:false,...target});
 const section=(id,fields)=>put('section','restored-'+id,{internalName:'Page restoration — '+id,kind:'richText',enabled:true,body:doc(),...fields});
 const card=(id,fields)=>put('contentCard','restored-'+id,{presentation:'card',enabled:true,...fields});
 const source=(slug,i)=>reference.sources[slug].sections[i];
 const photo=(id,galleryId)=>section(id,{image:get(galleryId).image,imageAlt:get(galleryId).alt});
 const hero=(id,slug,actions=[])=>{
  if(get(id).heroTitle)return;
  const s=reference.sources[slug];patch(id,{heroTitle:s.heroTitle,...(s.heroDescription?{heroDescription:s.heroDescription,description:s.heroDescription}:{}),...(actions.length?{heroActions:actions}:{})});
 };
 const promote=id=>{
  const s=get(id),nodes=structuredClone(s.body?.content||[]),index=nodes.findIndex(n=>n.nodeType.startsWith('heading-'));
  if(index<0)return;
  const title=tidy(nodeText(nodes.splice(index,1)[0]));patch(id,{title,body:doc(...nodes)});
 };
 const faq=id=>{
  if(get(id).kind==='accordion')return;
  const cards=get(id).body.content.filter(n=>n.nodeType==='embedded-entry-block').map(n=>n.data.target);
  promote(id);patch(id,{kind:'accordion',cards,body:doc()});
 };
 const split=(id,galleryId,body,fields={})=>{
  const original=get(id),copy=section(id+'-copy',{...fields,body});
  patch(id,{kind:'columns',layoutStyle:'split',title:'',body:doc(),actions:[],children:[photo(id+'-image',galleryId),copy],tone:original.tone});
 };
 const imageCards=(id,{names=[],layoutStyle='tiles',intro,trimTail=0}={})=>{
  if(get(id).kind==='cards')return;
  const s=get(id),nodes=structuredClone(s.body.content),images=nodes.filter(n=>n.nodeType==='embedded-entry-block'&&get(n.data.target.sys.id).type==='galleryImage');
  if(!images.length)throw new Error('No card images in '+id);
  const first=nodes.indexOf(images[0]),before=nodes.slice(0,first),title=tidy(nodeText(before.find(n=>n.nodeType.startsWith('heading-'))));
  const cards=images.map((image,i)=>{
   const start=nodes.indexOf(image),end=i+1<images.length?nodes.indexOf(images[i+1]):nodes.length-trimTail;
   const content=nodes.slice(start+1,end),titleNode=content.find(n=>n.nodeType.startsWith('heading-'));
   const media=get(image.data.target.sys.id),cardTitle=names[i]||tidy(nodeText(titleNode));
   if(!cardTitle)throw new Error('A card needs a title in '+id);
   return card(id+'-card-'+i,{title:cardTitle,image:media.image,imageAlt:cardTitle,body:doc(...content.filter(n=>n!==titleNode))});
  });
  patch(id,{kind:'cards',layoutStyle,title,body:intro!==undefined?plain(intro):doc(...before.filter(n=>!n.nodeType.startsWith('heading-'))),cards});
 };
 const steps=(id,galleryId)=>{
  const s=get(id),nodes=s.body.content,paragraphs=nodes.filter(n=>n.nodeType==='paragraph');
  const start=paragraphs.findIndex(n=>/^Step [1-4]/.test(tidy(nodeText(n))));
  if(start<0)throw new Error('No numbered steps in '+id);
  const cards=Array.from({length:4},(_,i)=>card(id+'-step-'+i,{presentation:'step',eyebrow:'Step '+(i+1),title:tidy(nodeText(paragraphs[start+i*2])).replace(/^Step \d\s*[-–]\s*/,''),body:doc(paragraphs[start+i*2+1])}));
  const copy=section(id+'-steps',{kind:'cards',layoutStyle:'steps',title:tidy(nodeText(nodes.find(n=>n.nodeType.startsWith('heading-')))),body:doc(...paragraphs.slice(0,start),...paragraphs.slice(start+8)),cards});
  patch(id,{kind:'columns',layoutStyle:'split',title:'',body:doc(),children:[photo(id+'-image',galleryId),copy]});
 };

 const calendar=byId.has('restored-club-calendar')?ref('restored-club-calendar'):action('club-calendar','View Club Calendar',{page:ref('wp-page-5225')});
 if(get('wp-page-4272-section-1').kind!=='columns'){
  hero('wp-page-4272','play-chess',[calendar]);
  imageCards('wp-page-4272-section-0');imageCards('wp-page-4272-section-3',{layoutStyle:'benefits'});
  for(const [i,imageId] of [[1,31],[2,32]]){
   const id='wp-page-4272-section-'+i,nodes=structuredClone(get(id).body.content);
   const bullets=source('play-chess',i).icons.map(value=>value.replace(/^(?:When|Format|Pairings|Who):\s*/,''));
   const copy=nodes.filter(n=>n.nodeType!=='embedded-entry-block'&&!n.nodeType.startsWith('heading-')&&!bullets.some(b=>tidy(nodeText(n)).includes(b)));
   copy.splice(1,0,list(bullets));
   // Keep the annual-PDF hyperlink intact for the optional V2 download.
   if(i===2){const subheading=nodes.find(n=>n.nodeType==='heading-6');if(subheading)copy.splice(2,0,subheading);}
   split(id,id+'-image-'+imageId,doc(...copy),{title:source('play-chess',i).heading});
  }
  steps('wp-page-4272-section-4','wp-page-4272-section-4-image-37');faq('wp-page-4272-section-5');promote('wp-page-4272-section-6');
 }
 if(get('wp-page-4332-section-6').kind!=='columns'){
  hero('wp-page-4332','juniors');imageCards('wp-page-4332-section-0',{layoutStyle:'benefits'});
  steps('wp-page-4332-section-1','wp-page-4332-section-1-image-47');
  imageCards('wp-page-4332-section-2',{layoutStyle:'benefits',intro:source('juniors',2).intro});
  imageCards('wp-page-4332-section-5',{layoutStyle:'portraits',intro:source('juniors',5).intro});
  // The four coach cards use the same native image/name/body records in V2.
  for(const r of get('wp-page-4332-section-5').cards)patch(r.sys.id,{presentation:'profile',description:tidy(nodeText(get(r.sys.id).body)),body:doc()});
  const parentCards=source('juniors',6).icons.map((value,i)=>{
   const colon=value.indexOf(':');return card('parent-information-'+i,{title:value.slice(0,colon),body:plain(value.slice(colon+1).trim())});
  });
  const copy=section('parent-information',{kind:'cards',layoutStyle:'benefits',title:'Information for Parents',cards:parentCards,actions:[action('coaching-policies','Coaching Policies',{policy:ref('hbcc-policy-coaching')}),action('parent-policies','All Club Policies',{page:ref('wp-page-5242')})]});
  patch('wp-page-4332-section-6',{kind:'columns',layoutStyle:'split',title:'',body:doc(),children:[photo('parent-information-image','wp-page-4332-section-6-image-56'),copy]});
  faq('wp-page-4332-section-8');promote('wp-page-4332-section-3');promote('wp-page-4332-section-4');promote('wp-page-4332-section-7');promote('wp-page-4332-section-9');
  patch('wp-page-4332-section-8-faq-58',{body:plain('Contact the coaching team to discuss your child’s age, experience and the most suitable starting group.')});
 }
 if(get('wp-page-4419-section-1').kind!=='columns'){
  const upcoming=action('upcoming-tournaments','View Upcoming Tournaments',{url:'https://tournament.hobsonsbaychess.com/v2/upcoming'}),results=action('tournament-results','Tournament Results',{url:'https://tournament.hobsonsbaychess.com/v2/'}),games=action('games','Club Games Database',{url:'https://games.hobsonsbaychess.com/'});
  hero('wp-page-4419','tournaments',[upcoming,results,games]);
  imageCards('wp-page-4419-section-0',{names:['Honourable Bob Cup','C. J. S. Purdy Cup','HBCC Club Championship','Koshnitsky Cup'],layoutStyle:'benefits'});
  patch('restored-wp-page-4419-section-0-card-3',{body:plain('A recurring classical competition commemorating Igor Koshnitsky.')});
  imageCards('wp-page-4419-section-2',{layoutStyle:'benefits'});
  split('wp-page-4419-section-1','wp-page-4419-section-1-image-68',doc(paragraph(source('tournaments',1).intro),list(source('tournaments',1).icons)),{title:'Club Competitions',actions:[action('champions','View Champions',{page:ref('wp-page-5008')})]});
  split('wp-page-4419-section-4','wp-page-4419-section-4-image-73',doc(paragraph(source('tournaments',4).intro),list(source('tournaments',4).icons)),{title:'Venue & Tournament Rules',actions:[action('tournament-rules','View Rules',{policy:ref('hbcc-policy-tournament')})]});
  faq('wp-page-4419-section-5');promote('wp-page-4419-section-6');
 }

 if(get('wp-page-4382-section-0').kind==='sponsors'&&!get('wp-page-4382-section-0').layoutStyle)patch('wp-page-4382-section-0',{layoutStyle:'sponsorProfiles'});
 if(get('wp-page-4382-section-0').kind!=='sponsors'){
  hero('wp-page-4382','sponsors',[action('become-sponsor','Become a Sponsor',{page:ref('wp-page-13')})]);
  const supporters=[1,2,3,4,6,5].map(i=>ref('sponsor-'+i));
  patch('sponsor-4',{website:'https://www.gschess.com.au/'});
  const bmg=put('sponsor','restored-sponsor-bacchus-marsh-grammar',{name:'Bacchus Marsh Grammar',image:get('wp-page-4382-section-0-image-87').image,website:'https://www.bmg.vic.edu.au/',enabled:true});supporters.push(bmg);
  // Preserve the existing six homepage sponsor records; the page had a seventh.
  patch('wp-page-4382-section-0',{kind:'sponsors',layoutStyle:'sponsorProfiles',title:'Our Sponsors & Partners',subtitle:source('sponsors',0).intro,body:doc(),sponsors:supporters});
  imageCards('wp-page-4382-section-1',{trimTail:6,intro:source('sponsors',1).intro});
  const statistics=section('sponsor-statistics',{kind:'statistics',title:'The club in numbers',statistics:get('home-statistics').statistics});
  const page=get('wp-page-4382'),sections=structuredClone(page.sections),position=sections.findIndex(r=>r.sys.id==='wp-page-4382-section-1');sections.splice(position+1,0,statistics);patch(page.id,{sections});
  const tiers=[['Partner (Exclusive)','Top visibility across club assets and key events. Limited to 1.','$2,000','Sold Out'],['Gold Sponsor','High visibility across key touchpoints. Limited spots.','$1,000','Sold Out'],['Silver Sponsor','Great value visibility for local businesses.','$500','Enquire Now'],['Bronze Supporter','Entry-level support with a professional presence.','$250','Enquire Now']];
  patch('wp-page-4382-section-2',{kind:'cards',layoutStyle:'benefits',title:'Sponsorship Packages',body:plain(source('sponsors',2).intro),cards:tiers.map(([title,description,price,status],i)=>card('sponsorship-package-'+i,{title,description,presentation:'pricing',price,...(status==='Sold Out'?{eyebrow:status}:{link:action('sponsorship-package-enquiry','Enquire Now',{page:ref('wp-page-13')})})}))});
  split('wp-page-4382-section-3','wp-page-4382-section-3-image-91',doc(paragraph(source('sponsors',3).intro),list(get('wp-page-4382-section-3').body.content.filter(n=>n.nodeType==='paragraph').slice(1).map(n=>tidy(nodeText(n))))),{title:'What Sponsors Receive'});
  imageCards('wp-page-4382-section-4',{layoutStyle:'benefits',names:['Member offer: a discount code for HBCC families','Sponsor-branded prize or “Best Junior” award at a key event','Stall/table at major weekend tournaments','Sponsor spotlight featuring your business and services'],intro:'Examples of sponsorship activations to discuss with the club.'});
  steps('wp-page-4382-section-5','wp-page-4382-section-5-image-96');faq('wp-page-4382-section-6');
  patch('wp-page-4382-section-7',{title:'Ready to Partner With HBCC?',body:plain('We’d love to work with local businesses who value community impact and long-term relationships.'),anchor:'become-a-sponsor',actions:[action('sponsorship-pack','Request Sponsorship Pack',{page:ref('wp-page-13')})]});
 }

 if(get('wp-page-5008-section-0').kind!=='honourBoard'){
  const s=get('wp-page-5008-section-0'),paragraphs=s.body.content.filter(n=>n.nodeType==='paragraph'),winners=[];
  for(let i=0;i<paragraphs.length;i++){
   const year=tidy(nodeText(paragraphs[i]));if(!/^\d{4}$/.test(year))continue;
   const value=tidy(nodeText(paragraphs[i+1])),match=value.match(/^(CM|FM|IM|GM)\s+(.+)$/);
   winners.push(put('clubChampion','restored-club-champion-'+year,{title:year+' — '+value,year:Number(year),playerName:match?match[2]:value,...(match?{playerTitle:match[1]}:{}),enabled:true}));
  }
  const c=reference.champion2025;
  winners.push(put('clubChampion','restored-club-champion-2025',{title:'2025 — '+c.playerName,year:c.year,playerName:c.playerName,score:c.score,standingsUrl:c.standingsUrl,enabled:true}));
  patch(s.id,{kind:'honourBoard',title:'Club Champions',body:plain('Celebrating our club championship winners.'),champions:winners.reverse()});
  patch('wp-page-5008',{heroTitle:'Our Champions',description:'Hobsons Bay Chess Club champions, with the most recent winners first.'});
 }

 if(!get('wp-page-13').sections.some(r=>r.sys.id==='restored-contact-sessions')){
  hero('wp-page-13','contact');
  patch('wp-page-13',{description:'Contact Hobsons Bay Chess Club, find our Altona venue and plan your first visit.'});
  const email=action('contact-email','Email the Club',{url:'mailto:info@hobsonsbaychess.com'}),about=action('contact-committee','Committee & Club Contacts',{page:ref('wp-page-11')}),events=action('contact-registration','Buy Event Tickets',{url:'https://portal.hobsonsbaychess.com/public/schedule/events'});
  const sessions=section('contact-sessions',{kind:'cards',layoutStyle:'tiles',title:'Club Sessions',cards:[
   card('contact-open-session',{title:'Tuesday Open Tournaments',description:'Regular games start at 7:30pm. Arrive early to be ready for your round.',icon:'chess'}),
   card('contact-coaching-session',{title:'Saturday Junior Coaching',description:'Coaching runs during school terms. Times vary by group and coach; check your current term listing.',icon:'junior'}),
   card('contact-junior-session',{title:'Saturday Rookies & Juniors',description:'Regular tournament games start at 6pm. Check the event listing for dates and entry conditions.',icon:'pawn'}),
  ]});
  const venue=section('contact-venue-copy',{title:'Visit Us in Altona',body:doc(heading('Our Address'),paragraph('108 Queen St, Altona VIC 3018, Australia'),heading('Email Us'),paragraph('info@hobsonsbaychess.com'),paragraph('Check the calendar and your event or coaching listing for current session times.')),actions:[email,action('contact-directions','Get Directions',{url:'https://www.google.com/maps/search/?api=1&query=Hobsons+Bay+Chess+Club'}),calendar]});
  const map=ref('wp-page-11-section-6-embed-12');
  patch('wp-page-13-section-0',{kind:'columns',layoutStyle:'split',title:'Where We Play',body:doc(),children:[map,venue]});
  const visitor=section('contact-visitor',{title:'Planning Your First Visit',body:doc(
   paragraph('Thinking of coming along to check us out? Check the calendar for senior events or junior activities.'),
   paragraph('Our rapid or blitz event nights are a good time to come. Longer-format events run for five or seven weeks, so joining on the first round is a good idea.'),
   heading('Choose the Right Activity'),paragraph('For competitive club tournaments, our visitor guidance recommends some casual chess experience, around 6–12 months. New beginners can explore social chess or the junior coaching pathway; contact the club for help choosing a session.'),
   heading('Arrive Before Your Round'),paragraph('Regular open games start at 7:30pm, with a 30-minute forfeit period. Regular rookies and junior games start at 6pm, with a 20-minute forfeit period. Check the specific event rules and arbiter instructions.'),
   heading('Member Etiquette'),paragraph('We take member etiquette seriously. Please read the policy and understand your responsibilities if you cannot attend a round.')
  ),actions:[action('contact-play','Visitor Information',{page:ref('wp-page-4272')}),action('contact-etiquette','Member Etiquette',{policy:ref('hbcc-policy-etiquette')}),calendar]});
  const enquiries=section('contact-enquiries',{title:'Get in Touch',tone:'gold',body:plain('For club nights, junior coaching, membership and tournament enquiries, email the club. Visit About Us for the committee and other club contacts.'),actions:[email,about,events,action('contact-membership','Join or Renew',{page:ref('wp-page-4424')})]});
  patch('wp-page-13',{sections:[sessions,ref('wp-page-13-section-0'),visitor,enquiries]});
 }

 // Remove leaked theme instructions from real content, including the current
 // rebuild. Preserve tables, photographs, native links and historical copy.
 const walk=(node,fn)=>{if(!node)return;fn(node);for(const child of node.content||[])walk(child,fn);};
 for(const original of items.filter(e=>/^(wp-page-4852|wp-page-5044|wp-page-5021)/.test(e.id)&&e.body)){
  const body=structuredClone(original.body);walk(body,n=>{if(n.nodeType==='text')n.value=n.value.replace(/\[\/?bold_timeline[^\]]*\]/g,'');});
  body.content=body.content.filter(n=>n.nodeType!=='paragraph'||tidy(nodeText(n)));
  if(JSON.stringify(body)!==JSON.stringify(original.body))patch(original.id,{body});
 }
 // The original HTTP sponsor address redirects to this verified HTTPS URL.
 if(get('sponsor-4').website==='http://www.gschess.com.au')patch('sponsor-4',{website:'https://www.gschess.com.au/'});
 return [...changes.values()];
}
