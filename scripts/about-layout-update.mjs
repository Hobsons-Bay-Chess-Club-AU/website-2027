import source from '../reference/audit/about-restoration.json' with {type:'json'};

const ref=id=>({sys:{type:'Link',linkType:'Entry',id}});
const text=value=>({nodeType:'text',value,marks:[],data:{}});
const paragraph=value=>({nodeType:'paragraph',data:{},content:[text(value)]});
const doc=(...content)=>({nodeType:'document',data:{},content});
const plain=(...values)=>doc(...values.map(paragraph));
const heading=value=>({nodeType:'heading-3',data:{},content:[text(value)]});

// Restore material missing from the first WordPress conversion. All editable
// cards and sections use native fields and retain the existing media references.
export function aboutLayoutUpdate(items){
 const byId=new Map(items.map(e=>[e.id,e])),changes=new Map();
 const get=id=>{const e=changes.get(id)||byId.get(id);if(!e)throw new Error('About update needs '+id);return e;};
 const put=(type,id,fields)=>{changes.set(id,{...structuredClone(byId.get(id)||{}),id,type,...fields});return ref(id);};
 const patch=(id,fields)=>put(get(id).type,id,fields);
 // This is a one-time transformation, not a recurring overwrite of editors.
 if(get('wp-page-11-section-1').layoutStyle==='portraits')return [];
 const action=(id,label,target)=>put('navigationItem',id,{label,enabled:true,openInNewTab:false,...target});
 const member=action('about-membership','Become a Member',{page:ref('wp-page-4424')});
 const contact=action('about-contact','Contact the Club',{page:ref('wp-page-13')});
 const policies=ref('membership-all-policies');
 const photo=(id,galleryId,alt)=>put('section',id,{internalName:'About — '+alt,kind:'richText',image:get(galleryId).image,imageAlt:alt,body:doc(),enabled:true});

 patch('wp-page-11',{heroTitle:source.heroTitle,heroDescription:source.heroDescription,description:source.heroDescription});
 const introPhoto=photo('about-introduction-image','wp-page-11-section-0-image-1','A club night at Hobsons Bay Chess Club');
 const intro=put('section','about-introduction-copy',{internalName:'About — introduction',kind:'richText',title:'Who We Are',body:plain(...source.introduction),actions:[member,contact],enabled:true});
 patch('wp-page-11-section-0',{kind:'columns',layoutStyle:'split',title:'',body:doc(),children:[introPhoto,intro],tone:'light'});

 const committee=source.committee.map((person,i)=>put('contentCard','about-committee-'+i,{title:person.name,description:person.role,presentation:'profile',image:get(person.imageEntry).image,imageAlt:person.name,enabled:true}));
 patch('wp-page-11-section-1',{kind:'cards',layoutStyle:'portraits',title:'Executive Committee',body:plain('HBCC is run by a volunteer committee elected annually.'),cards:committee,tone:'gold'});

 const volunteers=source.volunteers.map((person,i)=>put('contentCard','about-volunteer-'+i,{title:person.name,description:person.role,presentation:'roster',enabled:true}));
 const volunteerPhoto=photo('about-volunteer-image','wp-page-11-section-2-image-7','HBCC arbiters and volunteers');
 const volunteerList=put('section','about-volunteer-list',{internalName:'About — volunteer roster',kind:'cards',layoutStyle:'roster',body:doc(),cards:volunteers,enabled:true});
 patch('wp-page-11-section-2',{kind:'columns',layoutStyle:'split',title:'Extended Committee & Key Volunteers',body:plain('Many dedicated volunteers help run tournaments, junior programs and club operations.'),children:[volunteerPhoto,volunteerList],tone:'light'});

 const organisations=['Australian Chess Federation','Chess Victoria','Oceania Chess'];
 const affiliations=organisations.map((name,i)=>{
  const id='wp-page-11-section-3-image-'+(i+8),image=get(id);
  patch(image.link.sys.id,{label:name});
  patch(id,{title:name,alt:name});return ref(id);
 });
 patch('wp-page-11-section-3',{kind:'gallery',layoutStyle:'affiliations',title:'Affiliations & Recognition',body:plain('HBCC is affiliated with Chess Victoria and participates in the broader Victorian and Australian chess community.'),gallery:affiliations,tone:'gold'});

 const arbiters=source.arbiters.map((person,i)=>put('contentCard','about-arbiter-'+i,{title:person.name,...(person.title?{eyebrow:person.title}:{}),presentation:'roster',enabled:true}));
 patch('wp-page-11-section-4',{kind:'cards',layoutStyle:'roster',title:'Our Arbiters',body:plain('At Hobsons Bay Chess Club, our tournaments are supported by a dedicated team of accredited arbiters who help ensure every event is fair, consistent, and enjoyable for all players.'),cards:arbiters,tone:'light'});

 const governancePhoto=photo('about-governance-image','wp-page-11-section-5-image-11','Chess pieces on a board');
 const governanceActions=[
  action('about-policy-rules','Club Rules (By-Law)',{policy:ref('hbcc-policy-bylaw')}),
  action('about-policy-conduct','Member Code of Conduct / Etiquette',{policy:ref('hbcc-policy-etiquette')}),
  action('about-policy-childsafe','Child Safe Policy',{policy:ref('hbcc-policy-childsafe')}),
  action('about-policy-privacy','Privacy & Photography Policy',{policy:ref('hbcc-policy-privacy')}),policies,
 ];
 const governance=put('section','about-governance-copy',{internalName:'About — governance links',kind:'richText',title:'Governance & Policies',body:plain('HBCC is an incorporated association run by volunteers, with a focus on fair play and junior safety.'),actions:governanceActions,enabled:true});
 patch('wp-page-11-section-5',{kind:'columns',layoutStyle:'split',title:'',body:doc(),actions:[],children:[governancePhoto,governance],tone:'gold'});

 const map=get('wp-page-11-section-6-embed-12');patch(map.id,{internalName:'Hobsons Bay Chess Club venue map',title:''});
 const venue=put('section','about-venue-copy',{internalName:'About — venue and opening hours',kind:'richText',body:doc(heading('Our Address'),paragraph('108 Queen St, Altona VIC 3018, Australia'),heading('Opening Hours'),paragraph('Tuesdays: 7pm – 11:59pm\nSaturdays: 4pm – 11pm')),actions:[action('about-email','info@hobsonsbaychess.com',{url:'mailto:info@hobsonsbaychess.com'}),action('about-calendar','View Calendar',{page:ref('wp-page-5225')})],enabled:true});
 patch('wp-page-11-section-6',{kind:'columns',layoutStyle:'split',title:'Where We Play',body:doc(),children:[ref(map.id),venue],tone:'light'});
 patch('wp-page-11-section-7',{kind:'richText',title:'Want to Get Involved?',body:plain('info@hobsonsbaychess.com'),actions:[action('about-join','Join HBCC Today',{page:ref('wp-page-4424')}),contact],tone:'gold'});
 return [...changes.values()];
}
