import {spawnSync} from 'node:child_process';
import {loadEnv} from './env.mjs';

const repository='Hobsons-Bay-Chess-Club-AU/website-2027';
const env=loadEnv();
if(!env.space||!env.deliveryToken)throw new Error('Configure the Contentful space and Delivery key in local .env first.');
if(!process.argv.includes('--apply')){
  console.log('Ready to configure '+repository+': Contentful space, Delivery key and environment. Use --apply.');
  process.exit(0);
}
for(const [name,value] of [['CONTENTFUL_SPACE_ID',env.space],['CONTENTFUL_DELIVERY_TOKEN',env.deliveryToken]]){
  const result=spawnSync('gh',['secret','set',name,'--repo',repository],{input:value,encoding:'utf8',shell:false});
  if(result.error||result.status!==0)throw new Error('Could not configure GitHub Actions secret '+name+'. Check gh authentication and repository permissions.');
  console.log('Configured Actions secret '+name+'.');
}
const result=spawnSync('gh',['variable','set','CONTENTFUL_ENVIRONMENT','--repo',repository],{input:env.environment,encoding:'utf8',shell:false});
if(result.error||result.status!==0)throw new Error('Could not configure CONTENTFUL_ENVIRONMENT.');
console.log('Configured Contentful environment. Preview and Management tokens stay local.');
