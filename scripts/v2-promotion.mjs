import {resolveEntries} from '../src/lib/content-source.mjs';
import {createReviewEntries} from '../src/lib/review-content.mjs';

const symbol=(id,name,validations=[])=>({id,name,type:'Symbol',localized:false,required:false,validations});
const link=(id,name,type)=>({id,name,type:'Link',linkType:'Entry',localized:false,required:false,validations:[{linkContentType:[type]}]});
export const v2ModelFields={
 siteSettings:[symbol('siteVariant','Website version',[{in:['current','v2']}]),link('headerActions','Header membership actions','navigationMenu'),link('quickActions','Header quick tasks','navigationMenu')],
 page:[symbol('siteVariant','Website version',[{in:['current','v2']}])],
 navigationItem:[symbol('group','Dropdown group heading')],
 calendarSchedule:[{id:'annualPdf',name:'Original annual schedule',type:'Link',linkType:'Asset',localized:false,required:false,validations:[]},symbol('revisionText','Annual schedule note'),{id:'enableUpcoming',name:'Enable upcoming agenda',type:'Boolean',localized:false,required:false,validations:[]}],
 calendarEvent:[symbol('url','Event details URL'),symbol('verifiedSource','Verified source URL'),symbol('lastChecked','Source checked on'),symbol('closureScope','Which program is closed')],
};
const dependencies=value=>value?.sys?.linkType==='Entry'?[value.sys.id]:Array.isArray(value)?value.flatMap(dependencies):value&&typeof value==='object'?Object.values(value).flatMap(dependencies):[];
export function v2Promotion(snapshot,models,locale='en-US'){
 const original=resolveEntries(snapshot.items,snapshot.includes?.Asset||[]).filter(e=>!e.id.startsWith('v2-')&&e.siteVariant!=='v2');
 const updated=createReviewEntries(original),before=new Map(original.map(e=>[e.id,e]));
 const copies=new Set(updated.filter(e=>!before.has(e.id)||JSON.stringify(e)!==JSON.stringify(before.get(e.id))||['page','siteSettings'].includes(e.type)).map(e=>e.id));
 let changed=true;
 while(changed){changed=false;for(const e of updated)if(!copies.has(e.id)&&dependencies(e).some(id=>copies.has(id))){copies.add(e.id);changed=true;}}
 const copyId=id=>'v2-'+id;
 const assetByUrl=new Map((snapshot.includes?.Asset||[]).map(a=>[a.fields.file?.url?.startsWith('//')?'https:'+a.fields.file.url:a.fields.file?.url,a.sys.id]));
 const assetRef=value=>{
  const id=typeof value==='string'?assetByUrl.get(value):value?.id;
  if(!id)throw new Error('A V2 asset could not be mapped to its published Contentful file.');
  return {sys:{type:'Link',linkType:'Asset',id}};
 };
 const remap=value=>{
  if(value?.type==='asset'&&value.id)return assetRef(value);
  if(value?.sys?.linkType==='Entry')return {...value,sys:{...value.sys,id:copies.has(value.sys.id)?copyId(value.sys.id):value.sys.id}};
  if(Array.isArray(value))return value.map(remap);
  return value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,remap(v)])):value;
 };
 const modelByType=new Map(models.map(model=>[model.sys.id,{...model,fields:[...model.fields,...(v2ModelFields[model.sys.id]||[]).filter(f=>!model.fields.some(existing=>existing.id===f.id))]}]));
 const entries=updated.filter(e=>copies.has(e.id)).map(e=>{
  const data={...e};
  if(['page','siteSettings'].includes(e.type))data.siteVariant='v2';
  // Keep Contentful's global slug uniqueness while serving each version at
  // its own root. The runtime removes this namespace from V2 page URLs.
  if(e.type==='page')data.slug='v2-'+data.slug;
  if(e.type==='page'&&['review-coaching-page','review-privacy-page'].includes(e.id))data.noindex=false;
  if(e.type==='calendarSchedule'&&e.reviewVersion==='v2')data.enableUpcoming=true;
  const fields=Object.fromEntries(modelByType.get(e.type).fields.filter(f=>data[f.id]!==undefined&&data[f.id]!==null&&data[f.id]!==''&&(!Array.isArray(data[f.id])||data[f.id].length)).map(f=>[f.id,{[locale]:f.type==='Link'&&f.linkType==='Asset'?assetRef(data[f.id]):remap(data[f.id])}]));
  const id=copyId(e.id);if(id.length>64)throw new Error('V2 Contentful ID exceeds 64 characters: '+id);
  return {id,type:e.type,fields};
 });
 return {entries,models:[...modelByType.values()],settingsId:'v2-hbcc-site-settings',counts:{original:original.length,copies:entries.length,expectedPublished:original.length+entries.length}};
}
