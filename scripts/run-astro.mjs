import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {loadEnv} from './env.mjs';
import {normalizeBase} from '../src/lib/site-url.mjs';
loadEnv();
const packageUrl=new URL('../node_modules/astro/package.json',import.meta.url);
const pkg=JSON.parse(await readFile(packageUrl,'utf8'));
const executable=fileURLToPath(new URL(typeof pkg.bin==='string'?pkg.bin:pkg.bin.astro,packageUrl));
const mode=process.argv[2];
const env={...process.env};
let args;
if(mode==='production'){env.CONTENT_SOURCE='contentful';args=['build'];}
else if(mode==='pages'){
 const source=env.CONTENT_SOURCE||'contentful';
 if(!['contentful','reference'].includes(source))throw new Error('Pages builds must explicitly use contentful or reference.');
 if(!env.SITE_URL)throw new Error('Set SITE_URL from the GitHub Pages configuration.');
 const site=new URL(env.SITE_URL);
 if(site.protocol!=='https:'||site.username||site.password||site.search||site.hash||site.pathname!=='/')throw new Error('SITE_URL must be an HTTPS origin. Use SITE_BASE_PATH for the repository path.');
 const staging=site.hostname.endsWith('.github.io');
 if(source==='reference'&&!staging)throw new Error('Reference content can only deploy to a GitHub preview URL. Custom domains require published Contentful content.');
 env.SITE_BASE_PATH=normalizeBase(env.SITE_BASE_PATH);
 env.SITE_STAGING=String(staging);
 env.CONTENT_SOURCE=source;
 args=['build'];
}
else if(mode==='cms-preview'){env.CONTENTFUL_USE_PREVIEW='true';env.CONTENT_SOURCE='contentful';args=['dev','--host','127.0.0.1','--port','4328'];}
else throw new Error('Choose production, pages or cms-preview.');
const child=spawn(process.execPath,[executable,...args],{env,stdio:'inherit',shell:false});
child.on('error',()=>{console.error('Could not launch Astro. Run npm ci first.');process.exitCode=1;});
child.on('exit',(code)=>{process.exitCode=code??1;});
