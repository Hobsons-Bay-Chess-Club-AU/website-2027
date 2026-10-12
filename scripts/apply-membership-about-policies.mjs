import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';
import {membershipPolicyUpdate,etiquetteAsset} from './membership-policy-update.mjs';
import {aboutLayoutUpdate} from './about-layout-update.mjs';

const apply=process.argv.includes('--apply');
const api=contentfulClient(loadEnv());
const [entries,models,assets,locale]=await Promise.all([api.all('entries'),api.all('content_types'),api.all('assets'),api.locale()]);
if(!locale)throw new Error('Contentful default locale is missing.');
const schema=JSON.parse(await readFile('contentful/schema.json','utf8'));
const editorDefinitions=JSON.parse(await readFile('contentful/editor-interfaces.json','utf8')).editorInterfaces;
const entryMap=new Map(entries.map(e=>[e.sys.id,e]));
const modelMap=new Map(models.map(e=>[e.sys.id,e]));
const items=entries.map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v[locale]]))}));
const changeMap=new Map(membershipPolicyUpdate(items).map(e=>[e.id,e]));
const merged=new Map(items.map(e=>[e.id,e]));for(const [id,e] of changeMap)merged.set(id,e);
for(const e of aboutLayoutUpdate([...merged.values()]))changeMap.set(e.id,e);

const allowedExisting=new Set(['hbcc-site-settings','wp-page-4424','wp-page-5242','wp-page-11','wp-page-5242-section-0','wp-page-4419-section-4','wp-page-4332-section-6','footer-club-4','footer-legal-0','footer-legal-1',...Array.from({length:8},(_,i)=>'wp-page-4424-section-'+i),...Array.from({length:8},(_,i)=>'wp-page-11-section-'+i),'wp-page-11-section-6-embed-12',...Array.from({length:3},(_,i)=>'wp-page-11-section-3-image-'+(i+8)),...Array.from({length:3},(_,i)=>'wp-page-11-section-3-image-'+(i+8)+'-link')]);
const targetedFields={siteSettings:['policyPage'],navigationItem:['policy'],section:['kind','layoutStyle','policies','body'],contentCard:['presentation','price','body']};
const modelProposal=[];
const modelBody=model=>({name:model.name,description:model.description,displayField:model.displayField,fields:model.fields});
for(const [id,fieldIds] of Object.entries(targetedFields)){
 const before=modelMap.get(id);if(!before)throw new Error('Missing existing native model '+id);
 const desired=schema.contentTypes.find(t=>t.sys.id===id);
 const after=structuredClone(modelBody(before));
 for(const fieldId of fieldIds){
  const field=desired.fields.find(f=>f.id===fieldId),current=after.fields.find(f=>f.id===fieldId);
  if(!current){after.fields.push(structuredClone(field));continue;}
  if(current.type!==field.type||current.linkType!==field.linkType)throw new Error('Incompatible native field '+id+'.'+fieldId);
  if(fieldId==='body'){
   const nodes=current.validations?.find(v=>v.nodes)?.nodes;
   const allowed=nodes?.['entry-hyperlink']?.find(v=>v.linkContentType)?.linkContentType;
   if(!allowed)throw new Error('Review the existing rich-text validation before modifying '+id);
   if(!allowed.includes('policy'))allowed.push('policy');
  }else if(['kind','presentation'].includes(fieldId)){
   const choices=current.validations?.find(v=>v.in)?.in;
   if(!choices)throw new Error('Missing native layout choices for '+id);
   for(const choice of field.validations.find(v=>v.in).in)if(!choices.includes(choice))choices.push(choice);
  }
 }
 if(!isDeepStrictEqual(modelBody(before),after))modelProposal.push({id,before,after});
}
const policyDefinition=schema.contentTypes.find(t=>t.sys.id==='policy');
if(!modelMap.has('policy'))modelProposal.unshift({id:'policy',before:null,after:modelBody(policyDefinition)});
else if(!policyDefinition.fields.every(f=>modelMap.get('policy').fields.some(existing=>existing.id===f.id&&existing.type===f.type)))throw new Error('An existing policy model has a different shape; preserve it and review the migration.');

const entryProposal=[];
for(const [id,e] of changeMap){
 const current=entryMap.get(id);
 if(current&&!allowedExisting.has(id)&&!/^(membership-|about-|hbcc-policy-)/.test(id))throw new Error('Entry outside the requested scope: '+id);
 if(current&&current.sys.contentType.sys.id!==e.type)throw new Error('Refusing to change the type of '+id);
 const fields=structuredClone(current?.fields||{});
 for(const [key,value] of Object.entries(e))if(!['id','type'].includes(key)&&value!==undefined)fields[key]={...(fields[key]||{}),[locale]:value};
 // These two existing footer items now have one native policy destination.
 if(['footer-club-4','footer-legal-0'].includes(id))for(const key of ['page','url','tournamentFeed','tournamentDestination','fragment'])delete fields[key];
 if(!current||!isDeepStrictEqual(fields,current.fields))entryProposal.push({id,type:e.type,before:current,fields});
}
for(const change of [...modelProposal,...entryProposal])if(change.before&&change.before.sys.publishedVersion!==change.before.sys.version-1)throw new Error('Unpublished editorial changes must be reviewed before updating '+change.id);
const summary={mode:apply?'apply-and-publish':'dry-run',models:modelProposal.map(e=>e.id),newEntries:entryProposal.filter(e=>!e.before).length,updatedEntries:entryProposal.filter(e=>e.before).length,newAssets:assets.some(a=>a.sys.id===etiquetteAsset.id)?0:1,untouchedDrafts:entries.filter(e=>e.sys.publishedVersion!==e.sys.version-1&&!entryProposal.some(p=>p.id===e.sys.id)).length};
console.log(JSON.stringify(summary));
if(!apply)process.exit(0);
if(!entryProposal.length&&!modelProposal.length){console.log('The one-time update is already applied; editorial content is preserved.');process.exit(0);}
await mkdir('reference/screenshots',{recursive:true});
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
const snapshotPath='reference/screenshots/contentful-layout-before-'+stamp+'.json';
await writeFile(snapshotPath,JSON.stringify({capturedAt:new Date().toISOString(),locale,entries,models,assets},null,2));
const report={startedAt:new Date().toISOString(),snapshotPath,...summary,activatedModels:[],createdEntries:[],updatedEntries:[],publishedEntries:[],publishedAssets:[],error:null};
const reportPath='reference/screenshots/contentful-layout-update-report.json';
const save=()=>writeFile(reportPath,JSON.stringify(report,null,2));
const assertVersion=(current,before,id)=>{if(current?.sys?.version!==before?.sys?.version)throw new Error('Contentful changed during the update: '+id);};
try{
 for(const proposal of modelProposal){
  const current=await api.request('/content_types/'+proposal.id,{allow404:true});assertVersion(current,proposal.before,proposal.id);
  let updated=await api.request('/content_types/'+proposal.id,{method:'PUT',body:proposal.after,headers:current?api.version(current):{}});
  updated=await api.publish('content_types',updated);modelMap.set(proposal.id,updated);report.activatedModels.push(proposal.id);
 }
 for(const id of ['policy',...Object.keys(targetedFields)]){
  const editor=await api.request('/content_types/'+id+'/editor_interface');
  const desired=editorDefinitions.find(e=>e.contentTypeId===id).controls;
  const controls=structuredClone(editor.controls||[]);
  const fieldIds=id==='policy'?policyDefinition.fields.map(f=>f.id):targetedFields[id];
  for(const fieldId of fieldIds){
   const definition=desired.find(c=>c.fieldId===fieldId),current=controls.find(c=>c.fieldId===fieldId);
   if(!current)controls.push(definition);
   else if(definition.settings?.helpText&&!current.settings?.helpText?.includes(definition.settings.helpText))current.settings={...current.settings,helpText:[current.settings?.helpText,definition.settings.helpText].filter(Boolean).join(' ')};
  }
  if(!isDeepStrictEqual(controls,editor.controls))await api.request('/content_types/'+id+'/editor_interface',{method:'PUT',headers:api.version(editor),body:{controls}});
 }
 let asset=await api.uploadAsset(etiquetteAsset,locale);
 if(asset.sys.publishedVersion!==asset.sys.version-1){asset=await api.publish('assets',asset);report.publishedAssets.push(asset.sys.id);}
 // Create all new references before touching existing pages. Publishing follows
 // dependency order, so each parent refers to already-published native entries.
 const ready=new Map();
 for(const proposal of entryProposal.filter(e=>!e.before)){
  if(await api.request('/entries/'+proposal.id,{allow404:true}))throw new Error('New entry ID was created concurrently: '+proposal.id);
  const updated=await api.putEntry(proposal.id,proposal.type,proposal.fields);ready.set(proposal.id,updated);report.createdEntries.push(proposal.id);
 }
 const proposals=new Map(entryProposal.map(e=>[e.id,e]));
 const order=[],visited=new Set(),visiting=new Set();
 const dependencies=value=>{if(value?.sys?.linkType==='Entry')return [value.sys.id];if(Array.isArray(value))return value.flatMap(dependencies);if(value&&typeof value==='object')return Object.values(value).flatMap(dependencies);return [];};
 const visit=id=>{if(visited.has(id))return;if(visiting.has(id))throw new Error('Circular publication dependency at '+id);visiting.add(id);for(const dependency of dependencies(proposals.get(id).fields))if(proposals.has(dependency))visit(dependency);visiting.delete(id);visited.add(id);order.push(id);};
 for(const id of proposals.keys())visit(id);
 for(const id of order){
  const proposal=proposals.get(id);let updated=ready.get(id);
  if(proposal.before){const current=await api.request('/entries/'+id);assertVersion(current,proposal.before,id);updated=await api.putEntry(id,proposal.type,proposal.fields,current);report.updatedEntries.push(id);}
  else{const current=await api.request('/entries/'+id);assertVersion(current,updated,id);}
  await api.publish('entries',updated);report.publishedEntries.push(id);
  if(report.publishedEntries.length%20===0){await save();console.log(JSON.stringify({published:report.publishedEntries.length,total:order.length}));}
 }
 report.completedAt=new Date().toISOString();await save();
 console.log(JSON.stringify({completed:true,activatedModels:report.activatedModels,publishedEntries:report.publishedEntries.length,publishedAssets:report.publishedAssets.length,untouchedDrafts:summary.untouchedDrafts}));
}catch(error){report.error=error.message;await save();throw error;}
