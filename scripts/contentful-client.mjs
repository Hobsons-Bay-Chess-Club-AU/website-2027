import {readFile} from 'node:fs/promises';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function contentfulClient(env,{fetcher=fetch}={}){
 if(!env.space||!env.managementToken)throw new Error('Add the Contentful space and Management token to the local .env.');
 const base='https://api.contentful.com/spaces/'+encodeURIComponent(env.space)+'/environments/'+encodeURIComponent(env.environment);
 async function request(route,{method='GET',body,headers={},allow404=false,baseUrl=base,raw=false}={}){
  for(let attempt=0;attempt<5;attempt++){
   let response;
   try{response=await fetcher(baseUrl+route,{method,headers:{Authorization:'Bearer '+env.managementToken,'Content-Type':raw?'application/octet-stream':'application/vnd.contentful.management.v1+json',...headers},body:body===undefined?undefined:raw?body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});}catch{throw new Error('Contentful '+method+' '+route+' could not be reached.');}
   if(response.status===429&&attempt<4){await delay(Math.min(10000,1000*(Number(response.headers.get('x-contentful-ratelimit-reset'))||1)));continue;}
   if(response.status===404&&allow404)return null;
   if(!response.ok){
    let reason='';try{const error=await response.json();reason=JSON.stringify({id:error.sys?.id,message:error.message,details:error.details}).replaceAll(env.managementToken,'[redacted]').slice(0,1500);}catch{}
    throw new Error('Contentful '+method+' '+route+': HTTP '+response.status+'. '+reason);
   }
   return response.status===204?null:response.json();
  }
 }
 const version=item=>({'X-Contentful-Version':String(item.sys.version)});
 async function all(resource){
  const items=[];let total=0;
  do{const page=await request('/'+resource+'?limit=1000&skip='+items.length);total=page.total;if(!page.items?.length&&items.length<total)throw new Error('Contentful list ended early.');items.push(...page.items);}while(items.length<total);
  return items;
 }
 async function locale(){return (await request('/locales')).items.find(item=>item.default)?.code;}
 async function uploadAsset(asset,code,bytes){
  let current=await request('/assets/'+asset.id,{allow404:true});
  if(!current){
   const upload=await request('/uploads',{method:'POST',body:bytes||await readFile(asset.path),raw:true,baseUrl:'https://upload.contentful.com/spaces/'+encodeURIComponent(env.space)});
   const file={fileName:asset.fileName,contentType:asset.contentType||(/\.png$/i.test(asset.fileName)?'image/png':'image/jpeg'),uploadFrom:{sys:{type:'Link',linkType:'Upload',id:upload.sys.id}}};
   current=await request('/assets/'+asset.id,{method:'PUT',body:{fields:{title:{[code]:asset.title},file:{[code]:file}}}});
  }
  if(!current.fields.file?.[code]?.url){
   await request('/assets/'+asset.id+'/files/'+encodeURIComponent(code)+'/process',{method:'PUT',headers:version(current)});
   for(let i=0;i<30;i++){await delay(700);current=await request('/assets/'+asset.id);if(current.fields.file?.[code]?.url)break;}
  }
  if(!current.fields.file?.[code]?.url)throw new Error('Contentful image is still processing: '+asset.id);
  return current;
 }
 async function putEntry(id,type,fields,current){
  return request('/entries/'+id,{method:'PUT',headers:current?version(current):{'X-Contentful-Content-Type':type},body:{fields}});
 }
 async function publish(resource,item){return request('/'+resource+'/'+item.sys.id+'/published',{method:'PUT',headers:version(item)});}
 return {request,version,all,locale,uploadAsset,putEntry,publish};
}
