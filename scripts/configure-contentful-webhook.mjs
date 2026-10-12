import {loadEnv} from './env.mjs';
import {contentfulClient} from './contentful-client.mjs';

const env=loadEnv(),client=contentfulClient(env);
const baseUrl='https://api.contentful.com/spaces/'+encodeURIComponent(env.space);
const origin=new URL(process.env.VERCEL_SITE_URL||'');
if(origin.protocol!=='https:'||!process.env.CONTENTFUL_WEBHOOK_SECRET)throw new Error('Set the HTTPS Vercel site URL and CONTENTFUL_WEBHOOK_SECRET.');
const name='HBCC Vercel published-content ISR';
const existing=(await client.request('/webhook_definitions',{baseUrl})).items.find(item=>item.name===name);
const body={name,url:new URL('/api/revalidate/',origin).href,topics:['Entry.publish','Entry.unpublish','Entry.delete','Asset.publish','Asset.unpublish','Asset.delete'],filters:[{equals:[{doc:'sys.environment.sys.id'},env.environment]}],headers:[{key:'x-hbcc-webhook-secret',value:process.env.CONTENTFUL_WEBHOOK_SECRET,secret:true}],active:true};
const result=await client.request('/webhook_definitions'+(existing?'/'+existing.sys.id:''),{baseUrl,method:existing?'PUT':'POST',headers:existing?client.version(existing):{},body});
console.log(JSON.stringify({id:result.sys.id,name:result.name,url:result.url,topics:result.topics,active:result.active,environment:env.environment,secretHeader:true}));
