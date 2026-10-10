import {load} from 'cheerio';
import {createHash} from 'node:crypto';
const clubName='Hobsons Bay Chess Club';
export function facebookPermalink(value){
 try{const url=new URL(value);if(url.protocol!=='https:'||!['www.facebook.com','facebook.com'].includes(url.hostname)||!/^\/(?:hobsonsbaychess|\d+)\/posts\/[a-zA-Z0-9]+\/?$/.test(url.pathname))return null;return 'https://www.facebook.com'+url.pathname.replace(/\/$/,'');}catch{return null;}
}
function validPost(post){
 const originalUrl=facebookPermalink(post.permalink_url),message=String(post.message||'').trim(),date=new Date(post.created_time);
 if(!originalUrl||!message||!post.id||Number.isNaN(date.getTime()))return null;
 return {id:String(post.id).split('_').at(-1),message,created_time:date.toISOString(),permalink_url:originalUrl,imageUrl:post.imageUrl||post.full_picture||'',imagePath:post.imagePath||''};
}
export function parsePublicFacebook(html){
 const $=load(html),posts=[],seen=new Set();
 const add=input=>{const post=validPost(input);if(post&&!seen.has(post.permalink_url)){seen.add(post.permalink_url);posts.push(post);}};
 const walk=value=>{
  if(!value||typeof value!=='object')return;
  if(value['@type']==='SocialMediaPosting'&&value.author?.name===clubName){
   const url=facebookPermalink(value.url||value.mainEntityOfPage?.['@id']);
   if(url)add({id:value.identifier||url.split('/').at(-1),message:value.articleBody||value.text,created_time:value.datePublished,permalink_url:url,full_picture:typeof value.image==='string'?value.image:value.image?.url});
  }
  if(value.__typename==='Story'&&value.actors?.some(actor=>actor.name===clubName)){
   const story=value.comet_sections?.content?.story||value,attachment=story.attachments?.[0]?.styles?.attachment;
   const message=story.message?.text||value.message?.text,created=value.creation_time||story.creation_time;
   const url=facebookPermalink(value.url||story.url),id=value.post_id||story.post_id||url?.split('/').at(-1);
   if(url&&created)add({id,message,created_time:new Date(Number(created)*1000).toISOString(),permalink_url:url,full_picture:attachment?.media?.image?.uri});
  }
  for(const child of Object.values(value))if(child&&typeof child==='object')walk(child);
 };
 $('script[type="application/json"],script[type="application/ld+json"]').each((_,node)=>{try{walk(JSON.parse($(node).text()));}catch{}});
 if(!posts.length)throw new Error('Facebook returned its public page profile without dated HBCC posts. No news was changed. Use a browser-captured post file; unattended scraping is currently blocked by Facebook.');
 return posts.sort((a,b)=>Date.parse(b.created_time)-Date.parse(a.created_time));
}
export function sourceHash(post){
 let image='';try{image=new URL(post.imageUrl).pathname;}catch{image=post.imagePath||'';}
 return createHash('sha256').update(JSON.stringify([post.message,post.created_time,post.permalink_url,image])).digest('hex');
}
export const articleFields=['title','publishedAt','excerpt','image','imageAlt','author','category','body','originalUrl'];
export function articleHash(fields){return createHash('sha256').update(JSON.stringify(articleFields.map(key=>[key,fields[key]??null]))).digest('hex');}
export function syncDecision(existing,post){
 if(!existing)return 'create';
 if(existing.facebookSyncEnabled!==true)return 'editor-controlled';
 if(existing.facebookImportHash&&articleHash(existing)!==existing.facebookImportHash)return 'edited-in-contentful';
 if(existing.facebookSourceHash===sourceHash(post))return 'unchanged';
 return 'update-draft';
}
export function facebookArticle(post){
 const first=post.message.split(/\r?\n/).find(line=>line.trim())||'HBCC club update';
 const title=first.replace(/https?:\/\/\S+/g,'').trim().slice(0,120)||'HBCC club update';
 const key=createHash('sha256').update(post.id).digest('hex').slice(0,12);
 const stem=title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)||'club-update';
 const text=value=>({nodeType:'text',value,marks:[],data:{}});
 const content=post.message.split(/\r?\n/).filter(line=>line.trim()).map(line=>({nodeType:'paragraph',data:{},content:[text(line)]}));
 content.push({nodeType:'paragraph',data:{},content:[{nodeType:'hyperlink',data:{uri:post.permalink_url},content:[text('View the original HBCC Facebook post')]}]});
 return {id:'fb-news-'+key,fields:{title,slug:stem+'-'+key,publishedAt:post.created_time,excerpt:post.message.replace(/\s+/g,' ').slice(0,240),
  body:{nodeType:'document',data:{},content},author:clubName,category:'Club news',originalUrl:post.permalink_url,enabled:true,migrationReviewRequired:true,
  facebookPostId:post.id,facebookSyncEnabled:true,facebookSourceHash:sourceHash(post)}};
}
