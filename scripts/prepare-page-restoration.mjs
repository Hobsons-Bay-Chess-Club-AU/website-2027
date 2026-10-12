import {readFile,writeFile} from 'node:fs/promises';
import {pageRestorationUpdate} from './page-restoration-update.mjs';
import {localizeChanges} from './membership-policy-update.mjs';
const seed=JSON.parse(await readFile('contentful/seed.json','utf8'));
const items=seed.entries.map(e=>({id:e.sys.id,type:e.sys.contentType.sys.id,...Object.fromEntries(Object.entries(e.fields).map(([k,v])=>[k,v[seed.locale]]))}));
const changes=localizeChanges(pageRestorationUpdate(items),seed.locale);
for(const change of changes){const index=seed.entries.findIndex(e=>e.sys.id===change.sys.id);if(index<0)seed.entries.push(change);else seed.entries[index]=change;}
await writeFile('contentful/seed.json',JSON.stringify(seed,null,2));
console.log(JSON.stringify({restoredReferenceEntries:changes.length,totalReferenceEntries:seed.entries.length}));
