import {richTextPlainText} from '../src/lib/render-rich-text.mjs';

const entryLink=id=>({sys:{type:'Link',linkType:'Entry',id}});
const assetLink=id=>({sys:{type:'Link',linkType:'Asset',id}});
const doc=(...content)=>({nodeType:'document',data:{},content});
const plain=value=>doc({nodeType:'paragraph',data:{},content:[{nodeType:'text',value,marks:[],data:{}}]});
const empty=()=>doc();
const words=node=>richTextPlainText({content:[node]});
const walk=(node,fn)=>{if(!node)return;fn(node);for(const child of node.content||[])walk(child,fn);};
export const etiquetteAsset={id:'hbcc-policy-etiquette-pdf',title:'HBCC Chess Sportsmanship and Etiquette',fileName:'HBCC-Chess-Sportsmanship-and-Etiquette.pdf',localUrl:'/wp-assets/hbcc-Chess-Sportsmanship-and-Etiquette.pdf',path:'public/wp-assets/hbcc-Chess-Sportsmanship-and-Etiquette.pdf',contentType:'application/pdf',originalUrl:'https://hobsonsbaychess.com/wp-content/uploads/2026/01/HBCC-Chess-Sportsmanship-and-Etiquette.pdf'};

// Takes native, unlocalized fields, retaining reference IDs and rich-text nodes.
// The same proposal prepares the saved fixture and a version-checked CMA update.
export function membershipPolicyUpdate(items){
 const byId=new Map(items.map(e=>[e.id,e])),changes=new Map();
 const get=id=>{const item=changes.get(id)||byId.get(id);if(!item)throw new Error('Membership update needs '+id);return item;};
 const put=(type,id,fields)=>{const original=getOptional(id);const result={id,type,...structuredClone(original||{}),...fields};changes.set(id,result);return entryLink(id);};
 const getOptional=id=>changes.get(id)||byId.get(id);
 if(get('wp-page-4424-section-0').layoutStyle==='pricing'&&get('wp-page-5242-section-0').kind==='policies'&&get('footer-club-4').policy&&get('footer-legal-0').policy&&get('footer-legal-1').enabled===false)return [];
 const patch=(id,fields)=>put(get(id).type,id,fields);
 const navigation=(id,label,target)=>put('navigationItem',id,{label,enabled:true,openInNewTab:false,...(typeof target==='string'?{url:target}:target)});
 const portal='https://portal.hobsonsbaychess.com/public/membership_levels';
 const policiesId='wp-page-5242',policySection='wp-page-5242-section-0';
 patch('hbcc-site-settings',{policyPage:entryLink(policiesId)});
 const policies=[];
 const policy=(id,title,slug,document)=>{
  policies.push(put('policy',id,{title,slug,document,enabled:true}));
  return id;
 };
 const existingPolicyLinks=[];
 walk(get(policySection).body,n=>{if(n.nodeType==='asset-hyperlink')existingPolicyLinks.push({label:words(n),asset:n.data.target});});
 if(existingPolicyLinks.length!==4&&!getOptional('hbcc-policy-privacy'))throw new Error('Expected the four existing policy documents.');
 const definitions=[
  ['hbcc-policy-code','NDA & Code of Conduct','code-of-conduct',/code of conduct/i],
  ['hbcc-policy-bylaw','HBCC By-Law','by-law',/by.?law/i],
  ['hbcc-policy-childsafe','Child Safe Policy','child-safe',/child safe/i],
  ['hbcc-policy-privacy','Privacy & Photography Policy','privacy-and-photography',/privacy/i],
 ];
 for(const [id,title,slug,match] of definitions){
  const asset=existingPolicyLinks.find(l=>match.test(l.label))?.asset||getOptional(id)?.document;
  if(!asset?.sys?.id)throw new Error('Missing approved document: '+title);
  policy(id,title,slug,asset);
 }
 policy('hbcc-policy-etiquette','Member Etiquette','member-etiquette',assetLink('hbcc-policy-etiquette-pdf'));
 const sourcePolicy=(sectionId,id,title,slug)=>{
  let document;walk(get(sectionId).body,n=>{if(n.nodeType==='asset-hyperlink')document=n.data.target;});
  document=document||getOptional(id)?.document;
  if(!document?.sys?.id)throw new Error('Missing approved document: '+title);
  policy(id,title,slug,document);
 };
 sourcePolicy('wp-page-4419-section-4','hbcc-policy-tournament','Open Tournament Rules','open-tournament-rules');
 sourcePolicy('wp-page-4332-section-6','hbcc-policy-coaching','Junior Coaching Policies','junior-coaching');
 patch(policySection,{kind:'policies',title:'Club Policies & Documents',body:plain('Read the club’s approved documents below. Each policy can be opened or downloaded.'),policies,tone:'light'});
 patch(policiesId,{description:'Club policies, member etiquette, child safety, privacy and tournament rules.'});
 const allPolicies=navigation('membership-all-policies','All Club Policies',{page:entryLink(policiesId)});
 const policyLink=(id,label,policyId)=>navigation(id,label,{policy:entryLink(policyId)});
 const memberEtiquette=policyLink('membership-policy-etiquette','Member Etiquette','hbcc-policy-etiquette');
 const memberPrivacy=policyLink('membership-policy-privacy','Privacy Policy','hbcc-policy-privacy');
 const memberVenue=policyLink('membership-policy-venue','Venue Rules (for tournaments)','hbcc-policy-tournament');
 for(const id of ['footer-club-4','footer-legal-0']){
  patch(id,{policy:entryLink('hbcc-policy-privacy')});
  for(const field of ['page','url','tournamentFeed','tournamentDestination','fragment'])delete changes.get(id)[field];
 }
 patch('footer-legal-1',{enabled:false});

 // Do not regenerate a converted membership page from older reference text.
 if(get('wp-page-4424-section-0').layoutStyle!=='pricing'){
  const fee=get('wp-page-4424-section-0'),feeNodes=fee.body.content;
  const fees=feeNodes.filter(n=>n.nodeType==='paragraph').slice(1);
  if(fees.length!==20)throw new Error('Expected five membership fee groups; review edited content before migrating.');
  const feeCards=[];
  for(let i=0;i<5;i++){
   const nodes=fees.slice(i*4,i*4+4);let url;walk(nodes[3],n=>{if(n.nodeType==='hyperlink')url=n.data.uri;});
   if(!url)throw new Error('Membership fee needs its existing portal link.');
   const link=navigation('membership-fee-link-'+i,words(nodes[3]),url);
   feeCards.push(put('contentCard','membership-fee-'+i,{title:words(nodes[0]),description:words(nodes[1]),price:words(nodes[2]).replace(/\$\s+/g,'$'),presentation:'pricing',link,enabled:true}));
  }
  patch(fee.id,{kind:'cards',layoutStyle:'pricing',title:words(feeNodes[0]),body:doc(feeNodes[1]),cards:feeCards,tone:'light'});

  const benefits=get('wp-page-4424-section-1'),benefitNodes=benefits.body.content;
  const benefitCards=[];
  for(let i=0;i<4;i++)benefitCards.push(put('contentCard','membership-benefit-'+i,{title:words(benefitNodes[2+i*2]),description:words(benefitNodes[3+i*2]),presentation:'card',icon:['chess','people','events','calendar'][i],enabled:true}));
  patch(benefits.id,{kind:'cards',layoutStyle:'benefits',title:words(benefitNodes[0]),body:doc(benefitNodes[1]),cards:benefitCards,tone:'gold'});
  patch('wp-page-4424-section-2',{kind:'statistics',title:'The club in numbers',body:empty(),statistics:structuredClone(get('home-statistics').statistics)});

  const steps=get('wp-page-4424-section-3'),stepNodes=steps.body.content;
  const sourceImage=get(stepNodes.find(n=>n.nodeType==='embedded-entry-block').data.target.sys.id);
  const content=stepNodes.filter(n=>n.nodeType==='paragraph'),stepCards=[];
  for(let i=0;i<4;i++)stepCards.push(put('contentCard','membership-step-'+i,{title:words(content[i*2]).replace(/^Step \d\s*[–-]\s*/,''),eyebrow:'Step '+(i+1),presentation:'step',body:plain(content[i*2+1].content.map(n=>n.value||'').join('').replace(/\n{2,}/g,'\n').trim()),enabled:true}));
  const renew=navigation('membership-renew','Renew Now',portal);
  const image=put('section','membership-join-image',{internalName:'Membership — joining image',kind:'richText',image:sourceImage.image,imageAlt:sourceImage.alt,body:empty(),enabled:true});
  const stepSection=put('section','membership-join-steps',{internalName:'Membership — joining steps',kind:'cards',layoutStyle:'steps',body:empty(),cards:stepCards,actions:[renew],enabled:true});
  patch(steps.id,{kind:'columns',layoutStyle:'split',title:words(stepNodes[0]),body:empty(),children:[image,stepSection],tone:'gold'});

  const etiquette=get('wp-page-4424-section-4'),etiquetteNodes=etiquette.body.content;
  const etiquettePhoto=get(etiquetteNodes.find(n=>n.nodeType==='embedded-entry-block').data.target.sys.id);
  const policyImage=put('section','membership-policy-image',{internalName:'Membership — policy image',kind:'richText',image:etiquettePhoto.image,imageAlt:etiquettePhoto.alt,body:empty(),enabled:true});
  const policyText=put('section','membership-policy-links',{internalName:'Membership — etiquette and policy links',kind:'richText',title:words(etiquetteNodes.find(n=>n.nodeType.startsWith('heading'))),body:doc(...etiquetteNodes.filter(n=>n.nodeType==='paragraph')),actions:[memberEtiquette,memberPrivacy,memberVenue,allPolicies],enabled:true});
  patch(etiquette.id,{kind:'columns',layoutStyle:'split',body:empty(),children:[policyImage,policyText],tone:'light'});

  const juniors=get('wp-page-4424-section-5'),juniorNodes=juniors.body.content;
  const juniorLink=navigation('membership-junior-program','View Juniors Program',{page:entryLink('wp-page-4332')});
  patch(juniors.id,{title:words(juniorNodes[0]),body:doc(...juniorNodes.filter(n=>n.nodeType==='paragraph'&&!words(n).includes('View Juniors Program'))),actions:[juniorLink],tone:'gold'});
  const faq=get('wp-page-4424-section-6');
  patch(faq.id,{title:'Frequently Asked Questions',kind:'accordion',body:empty(),cards:faq.body.content.filter(n=>n.nodeType==='embedded-entry-block').map(n=>n.data.target),tone:'light'});
  const end=get('wp-page-4424-section-7'),endNodes=end.body.content;
  const join=navigation('membership-join','Join Now',portal),calendar=navigation('membership-calendar','View Calendar',{page:entryLink('wp-page-5225')});
  patch(end.id,{title:words(endNodes[0]),body:doc(endNodes[1]),actions:[join,calendar],tone:'gold'});
  patch('wp-page-4424',{heroActions:[join]});
 }
 // Restore missing hub links in related governance sections. Policy PDF refs are
 // replaced by native policy links so changing a document updates all its uses.
 for(const [sectionId,policyId] of [['wp-page-4419-section-4','hbcc-policy-tournament'],['wp-page-4332-section-6','hbcc-policy-coaching']]){
  const body=structuredClone(get(sectionId).body);walk(body,n=>{if(n.nodeType==='asset-hyperlink'){n.nodeType='entry-hyperlink';n.data={target:entryLink(policyId)};}});patch(sectionId,{body});
 }
 const governance=get('wp-page-11-section-5');
 patch(governance.id,{actions:[...(governance.actions||[]).filter(r=>r.sys.id!==allPolicies.sys.id),allPolicies]});
 return [...changes.values()];
}

export function localizeChanges(changes,locale='en-US'){
 return changes.map(({id,type,...fields})=>({sys:{id,type:'Entry',contentType:{sys:{type:'Link',linkType:'ContentType',id:type}}},fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,{[locale]:value}]))}));
}
