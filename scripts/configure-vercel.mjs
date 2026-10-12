import {mkdir,writeFile,appendFile} from 'node:fs/promises';
import {loadEnv} from './env.mjs';
const cms=loadEnv();
if(!process.env.VERCEL_API_KEY)throw new Error('Add VERCEL_API_KEY to the local .env.');
const token=process.env.VERCEL_API_KEY;
const teamId=process.env.VERCEL_ORG_ID||'team_T7jlz5yhaP6TlN4bqb1Nz8ad';
const name='hbcc-website-2027';
const query='?teamId='+encodeURIComponent(teamId);
async function call(route,{method='GET',body}={}){
 const response=await fetch('https://api.vercel.com'+route+(route.includes('?')?'&teamId='+encodeURIComponent(teamId):query),{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const data=await response.json();
 if(!response.ok){const error=new Error('Vercel configuration failed: HTTP '+response.status+' ('+(data.error?.code||'unknown')+').');error.code=data.error?.code;error.details=String(data.error?.message||'');throw error;}
 return data;
}
const projects=await call('/v9/projects?limit=100');
let project=projects.projects.find(p=>p.name===name);
const configuration={name,framework:'astro',buildCommand:'npm run build:vercel',installCommand:'npm ci'};
if(!project){
 try{project=await call('/v11/projects',{method:'POST',body:{...configuration,gitRepository:{type:'github',repo:'Hobsons-Bay-Chess-Club-AU/website-2027'}}});}
 catch(error){if(!/github|git|repository/i.test(error.code+' '+error.details))throw error;project=await call('/v11/projects',{method:'POST',body:configuration});console.log('GitHub integration needs connection in Vercel; the source deployment remains available.');}
}else project=await call('/v9/projects/'+project.id,{method:'PATCH',body:configuration});
const site=process.env.VERCEL_SITE_URL||'https://'+name+'.vercel.app';
const values={CONTENTFUL_SPACE_ID:cms.space,CONTENTFUL_ENVIRONMENT:cms.environment,CONTENTFUL_DELIVERY_TOKEN:cms.deliveryToken,CONTENTFUL_PREVIEW_TOKEN:cms.previewToken,CONTENT_SOURCE:'contentful',CONTENTFUL_USE_PREVIEW:'false',SITE_DEPLOY_TARGET:'vercel',SITE_VARIANT:'v2',SITE_BASE_PATH:'/',SITE_LAUNCH:'true',SITE_STAGING:'true',SITE_URL:site,ISR_REVALIDATE_TOKEN:process.env.ISR_REVALIDATE_TOKEN,CONTENTFUL_WEBHOOK_SECRET:process.env.CONTENTFUL_WEBHOOK_SECRET,CONTENTFUL_PREVIEW_SECRET:process.env.CONTENTFUL_PREVIEW_SECRET};
if(Object.values(values).some(value=>!value))throw new Error('Required Vercel/Contentful configuration is missing.');
await call('/v10/projects/'+project.id+'/env?upsert=true',{method:'POST',body:Object.entries(values).map(([key,value])=>({key,value,type:/TOKEN|SECRET/.test(key)?'encrypted':'plain',target:['production','preview']}))});
await mkdir('.vercel',{recursive:true});
await writeFile('.vercel/project.json',JSON.stringify({projectId:project.id,orgId:teamId,projectName:name}));
for(const [key,value] of Object.entries({VERCEL_ORG_ID:teamId,VERCEL_PROJECT_ID:project.id,VERCEL_SITE_URL:site}))if(!process.env[key])await appendFile('.env','\n'+key+'='+value+'\n');
console.log(JSON.stringify({projectId:project.id,teamId,name,site,githubConnected:!!project.link,environmentKeys:Object.keys(values)}));
