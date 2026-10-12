import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {loadEnv} from './env.mjs';
import {normalizeBase,withBase} from '../src/lib/site-url.mjs';
loadEnv();
const packageUrl=new URL('../node_modules/astro/package.json',import.meta.url);
const pkg=JSON.parse(await readFile(packageUrl,'utf8'));
const executable=fileURLToPath(new URL(typeof pkg.bin==='string'?pkg.bin:pkg.bin.astro,packageUrl));
const mode=process.argv[2];
const env={...process.env};
let args;
if(mode==='production'){env.CONTENT_SOURCE='contentful';env.SITE_VARIANT='current';env.SITE_STAGING='false';args=['build'];}
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
 env.SITE_VARIANT='current';
 env.CONTENT_SOURCE=source;
 args=['build'];
}
else if(mode==='review'){
 env.SITE_CURRENT_BASE_PATH=normalizeBase(env.SITE_BASE_PATH);
 env.SITE_BASE_PATH=withBase('/v2/',env.SITE_CURRENT_BASE_PATH);
 env.SITE_VARIANT='v2';env.SITE_STAGING='true';args=['build'];
}
else if(mode==='cms-preview'){env.CONTENTFUL_USE_PREVIEW='true';env.CONTENT_SOURCE='contentful';args=['dev','--host','127.0.0.1','--port','4328'];}
else throw new Error('Choose production, pages, review or cms-preview.');
function run(script,arguments_,environment){
 return new Promise(resolve=>{
  const child=spawn(process.execPath,[script,...arguments_],{env:environment,stdio:'inherit',shell:false});
  child.on('error',()=>{console.error('Could not launch the build command. Run npm ci first.');resolve(1);});
  child.on('exit',code=>resolve(code??1));
 });
}
let code=await run(executable,args,env);
if(code===0&&mode==='pages'){
 const verifier=fileURLToPath(new URL('./verify-build.mjs',import.meta.url));
 const reviewEnv={...env,SITE_VARIANT:'v2',SITE_STAGING:'true',SITE_CURRENT_BASE_PATH:env.SITE_BASE_PATH,SITE_BASE_PATH:withBase('/v2/',env.SITE_BASE_PATH)};
 // Both outputs must exist before checking comparison links in either direction.
 code=await run(executable,['build'],reviewEnv);
 if(code===0)code=await run(verifier,[],env);
 if(code===0)code=await run(verifier,[],reviewEnv);
}
process.exitCode=code;
