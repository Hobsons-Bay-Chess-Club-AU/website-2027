import {readFile,writeFile,mkdir} from 'node:fs/promises';
import sharp from 'sharp';
const selected=JSON.parse(await readFile('reference/facebook/selected-news.json','utf8'));
const seed=JSON.parse(await readFile('contentful/seed.json','utf8')),assets=JSON.parse(await readFile('contentful/assets.json','utf8'));
const link=(id,linkType='Entry')=>({sys:{type:'Link',linkType,id}});
const text=value=>({nodeType:'text',value,marks:[],data:{}});
const paragraph=value=>({nodeType:'paragraph',data:{},content:[text(value)]});
await mkdir('public/news-assets',{recursive:true});
for(const image of selected.images){
 const original='reference/facebook/media/'+image.fileName,localUrl='/news-assets/'+image.fileName.replace(/\.jpg$/,'.webp');
 await sharp(original).rotate().resize({width:1440,withoutEnlargement:true}).webp({quality:86}).toFile('public'+localUrl);
 const asset={id:image.id,title:image.title,fileName:image.fileName,path:original,localUrl,sourceUrl:image.sourceUrl};
 const index=assets.findIndex(a=>a.id===image.id);if(index===-1)assets.push(asset);else assets[index]=asset;
}
for(const entry of seed.entries)if(entry.sys.contentType.sys.id==='post'&&entry.fields.wordpressId){
 entry.fields.enabled={[seed.locale]:false};entry.fields.noindex={[seed.locale]:true};
}
for(const article of selected.articles){
 const content=article.paragraphs.map(paragraph);
 content.push({nodeType:'embedded-asset-block',data:{target:link(article.image,'Asset')},content:[]},paragraph(article.credit));
 for(const source of article.links)content.push({nodeType:'paragraph',data:{},content:[{nodeType:'hyperlink',data:{uri:source.url},content:[text(source.label)]}]});
 const fields={title:article.title,slug:article.slug,publishedAt:article.publishedAt,excerpt:article.excerpt,image:link(article.image,'Asset'),imageAlt:article.imageAlt,
  body:{nodeType:'document',data:{},content},author:'Hobsons Bay Chess Club',category:'Club news',enabled:true,migrationReviewRequired:false,originalUrl:article.originalUrl,
  facebookPostId:article.facebookPostId,facebookSyncEnabled:false};
 const entry={sys:{id:article.id,type:'Entry',contentType:{sys:{type:'Link',linkType:'ContentType',id:'post'}}},fields:Object.fromEntries(Object.entries(fields).map(([key,value])=>[key,{[seed.locale]:value}]))};
 const index=seed.entries.findIndex(e=>e.sys.id===entry.sys.id);if(index===-1)seed.entries.push(entry);else seed.entries[index]=entry;
}
seed.entries.find(e=>e.sys.id==='home-news').fields.posts={[seed.locale]:[]};
const tournamentNews=seed.entries.find(e=>e.sys.id==='wp-page-4419-section-3');
if(tournamentNews){
 tournamentNews.fields.internalName={[seed.locale]:'Tournaments — Latest club news'};
 tournamentNews.fields.kind={[seed.locale]:'news'};tournamentNews.fields.title={[seed.locale]:'Latest from HBCC'};
 tournamentNews.fields.posts={[seed.locale]:[]};tournamentNews.fields.limit={[seed.locale]:3};
 tournamentNews.fields.actions={[seed.locale]:[link('home-all-news')]};delete tournamentNews.fields.body;
}
await writeFile('contentful/seed.json',JSON.stringify(seed,null,2));
await writeFile('contentful/assets.json',JSON.stringify(assets,null,2));
console.log(JSON.stringify({clubArticles:selected.articles.length,clubImages:selected.images.length,templateArticlesHidden:5,homepageSelection:'newest published'},null,2));
