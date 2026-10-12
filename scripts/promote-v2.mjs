import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';
import {v2Promotion,v2ModelFields} from './v2-promotion.mjs';

const env=loadEnv(),client=contentfulClient(env);
const canonicalFields=fields=>Object.fromEntries(Object.entries(fields).map(([key,locales])=>[key,Object.fromEntries(Object.entries(locales).filter(([,value])=>value!==''&&value!==null&&(!Array.isArray(value)||value.length)))]).filter(([,locales])=>Object.keys(locales).length));
const [allEntries,assets,models]=await Promise.all([client.all('entries'),client.all('assets'),client.all('content_types')]);
const originalEntries=allEntries.filter(e=>!e.sys.id.startsWith('v2-'));
const existing=allEntries.find(e=>e.sys.id==='v2-hbcc-site-settings');
if(existing?.sys.publishedVersion){console.log('Native V2 is already promoted; existing editorial content is preserved.');process.exit(0);}
const locale=await client.locale();
const response=await fetch(`https://cdn.contentful.com/spaces/${env.space}/environments/${env.environment}/entries?limit=1000&include=1`,{headers:{Authorization:'Bearer '+env.deliveryToken}});
if(!response.ok)throw new Error('Could not read the published source for V2.');
const snapshot=await response.json();
if(snapshot.total!==snapshot.items.length)throw new Error('Paginate the published source before promoting more than 1,000 entries.');
const plan=v2Promotion(snapshot,models,locale);
await mkdir('reference/admin-export',{recursive:true});
const backupPath='reference/admin-export/v2-promotion-before.json';
try{await readFile(backupPath);}catch{await writeFile(backupPath,JSON.stringify({capturedAt:new Date().toISOString(),allEntries,assets,models}));}
await writeFile('reference/admin-export/v2-promotion-plan.json',JSON.stringify(plan));
console.log(JSON.stringify({phase:'planned',...plan.counts,draftsPreserved:originalEntries.filter(e=>!e.sys.publishedVersion).length}));
for(const model of models.filter(m=>v2ModelFields[m.sys.id])){
 const next=plan.models.find(m=>m.sys.id===model.sys.id);
 if(JSON.stringify(next.fields)===JSON.stringify(model.fields))continue;
 const updated=await client.request('/content_types/'+model.sys.id,{method:'PUT',headers:client.version(model),body:{name:model.name,description:model.description,displayField:model.displayField,fields:next.fields}});
 await client.request('/content_types/'+model.sys.id+'/published',{method:'PUT',headers:client.version(updated)});
}
const currentById=new Map(allEntries.map(e=>[e.sys.id,e]));
const created=new Map();let count=0;
for(const entry of plan.entries){
 let current=currentById.get(entry.id);
 if(current&&!isDeepStrictEqual(canonicalFields(current.fields),canonicalFields(entry.fields))){
  const oldFields=structuredClone(entry.fields);
  if(entry.type==='page')oldFields.slug[locale]=oldFields.slug[locale].replace(/^v2-/,'');
  if(current.sys.publishedVersion||!isDeepStrictEqual(canonicalFields(current.fields),canonicalFields(oldFields)))throw new Error('V2 entry was edited; preserve it and review manually: '+entry.id);
  current=await client.putEntry(entry.id,entry.type,entry.fields,current);
 }
 if(!current)current=await client.putEntry(entry.id,entry.type,entry.fields);
 created.set(entry.id,current);
 if(++count%25===0)console.log(JSON.stringify({phase:'created',count,total:plan.entries.length}));
}
// All linked entries exist before publication. Publish the settings switch last
// so neither current nor V2 can see a partially promoted editorial graph.
const publication=plan.entries.filter(e=>e.id!==plan.settingsId).sort((a,b)=>(a.type==='page'?-1:0)-(b.type==='page'?-1:0));
publication.push(plan.entries.find(e=>e.id===plan.settingsId));count=0;
for(const entry of publication){
 const current=created.get(entry.id);
 if(!current.sys.publishedVersion)await client.publish('entries',current);
 if(++count%25===0)console.log(JSON.stringify({phase:'published',count,total:publication.length}));
}
const after=await client.all('entries');
for(const entry of originalEntries){
 const unchanged=after.find(e=>e.sys.id===entry.sys.id);
 if(!unchanged||JSON.stringify(unchanged.fields)!==JSON.stringify(entry.fields)||unchanged.sys.version!==entry.sys.version)throw new Error('An original entry changed during V2 promotion.');
}
const report={completedAt:new Date().toISOString(),...plan.counts,originalsUnchanged:originalEntries.length,draftsPreserved:originalEntries.filter(e=>!e.sys.publishedVersion).length,settingsId:plan.settingsId};
await writeFile('contentful/v2-promotion-report.json',JSON.stringify(report,null,2));
const schema=JSON.parse(await readFile('contentful/schema.json','utf8'));
for(const model of schema.contentTypes){for(const field of v2ModelFields[model.sys.id]||[])if(!model.fields.some(f=>f.id===field.id))model.fields.push(field);}
await writeFile('contentful/schema.json',JSON.stringify(schema,null,2)+'\n');
console.log(JSON.stringify(report));
