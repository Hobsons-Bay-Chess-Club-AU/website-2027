import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';
import {pageRestorationUpdate} from './page-restoration-update.mjs';
import {publicationOrder} from './publication-order.mjs';

const apply=process.argv.includes('--apply'),api=contentfulClient(loadEnv());
const [entries,models,assets,locale]=await Promise.all([api.all('entries'),api.all('content_types'),api.all('assets'),api.locale()]);
if(!locale)throw new Error('The Contentful default locale is missing.');
const entryMap=new Map(entries.map(e=>[e.sys.id,e])),modelMap=new Map(models.map(e=>[e.sys.id,e]));
const resume=process.argv.includes('--resume');
const previous=resume?JSON.parse(await readFile('reference/screenshots/contentful-page-restoration-report.json','utf8')):null;
const originalSnapshot=resume?JSON.parse(await readFile(previous.snapshotPath,'utf8')):null;
if(resume&&(!previous.error||previous.publishedEntries.length||originalSnapshot.locale!==locale))throw new Error('This recovery supports the interrupted creation phase only. Review the saved report.');
const originalIds=new Set((originalSnapshot?.entries||entries).map(e=>e.sys.id));
const items=(originalSnapshot?.entries||entries).map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v[locale]]))}));
const changes=pageRestorationUpdate(items),schema=JSON.parse(await readFile('contentful/schema.json','utf8'));
const editors=JSON.parse(await readFile('contentful/editor-interfaces.json','utf8')).editorInterfaces;
const modelBody=model=>({name:model.name,description:model.description,displayField:model.displayField,fields:model.fields});
const fieldChanges={section:['kind','layoutStyle','anchor','champions'],navigationItem:['fragment'],contentCard:['anchor']};
const modelProposal=[];
for(const [id,fieldIds] of Object.entries(fieldChanges)){
 const before=modelMap.get(id),desired=schema.contentTypes.find(t=>t.sys.id===id);if(!before)throw new Error('Missing native model '+id);
 const after=structuredClone(modelBody(before));
 for(const fieldId of fieldIds){
  const field=desired.fields.find(f=>f.id===fieldId),existing=after.fields.find(f=>f.id===fieldId);
  if(!existing){after.fields.push(structuredClone(field));continue;}
  if(existing.type!==field.type||existing.linkType!==field.linkType)throw new Error('Incompatible field '+id+'.'+fieldId);
  const desiredChoices=field.validations?.find(v=>v.in)?.in;
  if(desiredChoices){const choices=existing.validations?.find(v=>v.in)?.in;if(!choices)throw new Error('Review existing layout validation for '+id+'.'+fieldId);for(const choice of desiredChoices)if(!choices.includes(choice))choices.push(choice);}
 }
 if(!isDeepStrictEqual(modelBody(before),after))modelProposal.push({id,before,after});
}
const championModel=schema.contentTypes.find(t=>t.sys.id==='clubChampion');
if(!modelMap.has('clubChampion'))modelProposal.unshift({id:'clubChampion',before:null,after:modelBody(championModel)});
else if(!championModel.fields.every(f=>modelMap.get('clubChampion').fields.some(g=>g.id===f.id&&g.type===f.type)))throw new Error('Review the existing Club champion model before updating it.');
const proposals=[];
for(const change of changes){
 const current=entryMap.get(change.id);
 if(change.id!=='sponsor-4'&&!/^(restored-|wp-page-(4272|4332|4419|4382|5008|13|4852|5044|5021)(?:$|-))/.test(change.id))throw new Error('Entry outside the page-restoration scope: '+change.id);
 if(current&&current.sys.contentType.sys.id!==change.type)throw new Error('Refusing to change an existing entry type.');
 const fields=structuredClone(current?.fields||{});
 for(const [key,value] of Object.entries(change))if(!['id','type'].includes(key)&&value!==undefined)fields[key]={...(fields[key]||{}),[locale]:value};
 const recoveredDraft=resume&&!originalIds.has(change.id)&&previous.createdEntries.includes(change.id);
 if(recoveredDraft&&(!current||current.sys.version!==1||current.sys.publishedVersion||!isDeepStrictEqual(fields,current.fields)))throw new Error('The migration draft changed after creation: '+change.id);
 if(!current||!isDeepStrictEqual(fields,current.fields)||recoveredDraft)proposals.push({id:change.id,type:change.type,before:current,fields,recoveredDraft});
}
for(const p of [...modelProposal,...proposals])if(p.before&&!p.recoveredDraft&&p.before.sys.publishedVersion!==p.before.sys.version-1)throw new Error('Unpublished editorial changes must be reviewed before modifying '+p.id);
const order=publicationOrder(proposals);
const summary={mode:apply?'apply-and-publish':'dry-run',models:modelProposal.map(p=>p.id),newEntries:proposals.filter(p=>!p.before).length,updatedEntries:proposals.filter(p=>p.before&&!p.recoveredDraft).length,recoveredDrafts:proposals.filter(p=>p.recoveredDraft).length,untouchedDrafts:entries.filter(e=>e.sys.publishedVersion!==e.sys.version-1&&!proposals.some(p=>p.id===e.sys.id)).length};
console.log(JSON.stringify(summary));
if(!apply)process.exit(0);
if(!proposals.length&&!modelProposal.length){console.log('The page restoration is already applied; subsequent editorial changes are preserved.');process.exit(0);}
await mkdir('reference/screenshots',{recursive:true});
const snapshotPath=previous?.snapshotPath||'reference/screenshots/contentful-pages-before-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json';
if(!resume)await writeFile(snapshotPath,JSON.stringify({capturedAt:new Date().toISOString(),locale,entries,models,assets},null,2));
const report={startedAt:previous?.startedAt||new Date().toISOString(),...(resume?{resumedAt:new Date().toISOString()}:{}),snapshotPath,...summary,activatedModels:previous?.activatedModels||[],createdEntries:previous?.createdEntries||[],updatedEntries:[],publishedEntries:[],error:null};
const save=()=>writeFile('reference/screenshots/contentful-page-restoration-report.json',JSON.stringify(report,null,2));
const assertVersion=(current,before,id)=>{if(current?.sys?.version!==before?.sys?.version)throw new Error('Contentful changed during the update: '+id);};
try{
 for(const p of modelProposal){
  const current=await api.request('/content_types/'+p.id,{allow404:true});assertVersion(current,p.before,p.id);
  const updated=await api.request('/content_types/'+p.id,{method:'PUT',body:p.after,headers:current?api.version(current):{}});
  await api.publish('content_types',updated);report.activatedModels.push(p.id);
 }
 for(const id of ['clubChampion',...Object.keys(fieldChanges)]){
  const editor=await api.request('/content_types/'+id+'/editor_interface'),desired=editors.find(e=>e.contentTypeId===id).controls,controls=structuredClone(editor.controls||[]);
  for(const fieldId of id==='clubChampion'?championModel.fields.map(f=>f.id):fieldChanges[id]){
   const definition=desired.find(c=>c.fieldId===fieldId),existing=controls.find(c=>c.fieldId===fieldId);
   if(!existing)controls.push(definition);
   else if(definition.settings?.helpText&&!existing.settings?.helpText?.includes(definition.settings.helpText))existing.settings={...existing.settings,helpText:[existing.settings?.helpText,definition.settings.helpText].filter(Boolean).join(' ')};
  }
  if(!isDeepStrictEqual(controls,editor.controls))await api.request('/content_types/'+id+'/editor_interface',{method:'PUT',headers:api.version(editor),body:{controls}});
 }
 const ready=new Map();
 for(const p of proposals.filter(p=>!p.before)){
  if(await api.request('/entries/'+p.id,{allow404:true}))throw new Error('A new entry was created concurrently: '+p.id);
  const updated=await api.putEntry(p.id,p.type,p.fields);ready.set(p.id,updated);report.createdEntries.push(p.id);
 }
 const planned=new Map(proposals.map(p=>[p.id,p]));
 for(const id of order){
  const p=planned.get(id);let updated=ready.get(id);
  if(p.recoveredDraft){const current=await api.request('/entries/'+id);assertVersion(current,p.before,id);updated=current;}
  else if(p.before){const current=await api.request('/entries/'+id);assertVersion(current,p.before,id);updated=await api.putEntry(id,p.type,p.fields,current);report.updatedEntries.push(id);}
  else assertVersion(await api.request('/entries/'+id),updated,id);
  await api.publish('entries',updated);report.publishedEntries.push(id);
  if(report.publishedEntries.length%20===0){await save();console.log(JSON.stringify({published:report.publishedEntries.length,total:order.length}));}
 }
 report.completedAt=new Date().toISOString();await save();console.log(JSON.stringify({completed:true,publishedEntries:report.publishedEntries.length,activatedModels:report.activatedModels,untouchedDrafts:summary.untouchedDrafts}));
}catch(error){report.error=error.message;await save();throw error;}
