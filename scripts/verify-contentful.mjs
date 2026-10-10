import {readFile} from 'node:fs/promises';
import {loadEnv} from './env.mjs';
import {loadContent} from '../src/lib/content.mjs';
loadEnv();
const seed=JSON.parse(await readFile('contentful/seed.json','utf8'));
const content=await loadContent({env:{...process.env,CONTENT_SOURCE:'contentful',CONTENTFUL_USE_PREVIEW:process.argv.includes('--published')?'false':'true'}});
const expected=seed.entries.map(e=>e.sys.id),missing=expected.filter(id=>!content.entries[id]);
console.log(JSON.stringify({mode:process.argv.includes('--published')?'published':'draft-preview',source:content.source,entryCount:Object.keys(content.entries).length,missingSeedEntries:missing,clubPages:content.pages.length,menuItems:content.settings.mainMenu.items.length,homepageSections:content.home.sections.length},null,2));
if(missing.length)process.exitCode=1;
