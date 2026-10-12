import {readFile,writeFile} from 'node:fs/promises';
import {membershipPolicyUpdate,localizeChanges,etiquetteAsset} from './membership-policy-update.mjs';
import {aboutLayoutUpdate} from './about-layout-update.mjs';
const seed=JSON.parse(await readFile('contentful/seed.json','utf8'));
const items=seed.entries.map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v[seed.locale]]))}));
const membership=membershipPolicyUpdate(items);
const merged=new Map(items.map(e=>[e.id,e]));for(const e of membership)merged.set(e.id,e);
const changes=localizeChanges([...membership,...aboutLayoutUpdate([...merged.values()])],seed.locale);
for(const change of changes){const index=seed.entries.findIndex(e=>e.sys.id===change.sys.id);if(index<0)seed.entries.push(change);else seed.entries[index]=change;}
await writeFile('contentful/seed.json',JSON.stringify(seed,null,2));
const assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
if(!assets.some(a=>a.id===etiquetteAsset.id)){assets.push(etiquetteAsset);await writeFile('contentful/assets.json',JSON.stringify(assets,null,2));}
console.log(JSON.stringify({updatedReferenceEntries:changes.length,totalReferenceEntries:seed.entries.length,policyDocuments:changes.filter(e=>e.sys.contentType.sys.id==='policy').length}));
