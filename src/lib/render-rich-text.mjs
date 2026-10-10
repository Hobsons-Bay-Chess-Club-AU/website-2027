import {safeUrl} from './sanitize.mjs';
import {siteUrl} from './site-url.mjs';
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const assetUrl=value=>safeUrl(typeof value==='string'?value:value?.url,'');
export const approvedEmbed=value=>{
 try{const u=new URL(value);return u.protocol==='https:'&&['www.youtube.com','www.youtube-nocookie.com','docs.google.com','www.google.com'].includes(u.hostname)?u.href:'';}catch{return '';}
};

export function renderRichText(document,entries={},trail=[]){
 if(!document)return '';
 if(document.nodeType!=='document')throw new Error('Expected a Contentful rich text document.');
 const get=target=>{
  if(target?.type==='asset'||typeof target==='string')return target;
  const id=target?.sys?.id;
  const entry=entries[id];
  if(!entry)throw new Error(`Rich text references missing Contentful entry ${id||'(unknown)'}. Publish its linked content.`);
  if(trail.includes(id)||trail.length>20)throw new Error(`Circular rich text reference at ${id}.`);
  return entry;
 };
 const media=(image,alt='',title='')=>{
  const url=siteUrl(assetUrl(image),'');if(!url)return '';
  if(image?.contentType&&!image.contentType.startsWith('image/'))return `<p><a href="${escapeHtml(url)}">${escapeHtml(title||'Download document')}</a></p>`;
  return `<figure class="cms-image"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"></figure>`;
 };
 const linkTarget=ref=>{
  const item=entries[ref?.sys?.id];if(!item||item.enabled===false)return null;
  const page=entries[item.page?.sys?.id],feed=entries[item.tournamentFeed?.sys?.id];
  const key={leaderboard:'leaderboardUrl',upcoming:'upcomingUrl',calendar:'calendarUrl'}[item.tournamentDestination];
  return {label:item.label,url:page?(page.template==='home'?'/':'/'+page.slug+'/'):feed&&key?feed[key]:item.url,newTab:item.openInNewTab};
 };
 const linked=(html,ref)=>{
  const item=linkTarget(ref);if(!item)return html;
  return '<a href="'+escapeHtml(siteUrl(item.url))+'"'+(item.newTab?' target="_blank" rel="noopener noreferrer"':'')+'>'+html+'</a>';
 };
 const next=nodes=>(nodes||[]).map(render).join('');
 const render=n=>{
  if(n.nodeType==='text'){
   let html=escapeHtml(n.value).replaceAll('\n','<br>');
   for(const mark of n.marks||[]){const tag={bold:'strong',italic:'em',underline:'u',code:'code',superscript:'sup',subscript:'sub'}[mark.type];if(tag)html=`<${tag}>${html}</${tag}>`;}
   return html;
  }
  const inner=()=>next(n.content);
  const tag={paragraph:'p','heading-1':'h2','heading-2':'h2','heading-3':'h3','heading-4':'h4','heading-5':'h5','heading-6':'h6','ordered-list':'ol','unordered-list':'ul','list-item':'li',blockquote:'blockquote','table-row':'tr','table-cell':'td','table-header-cell':'th'}[n.nodeType];
  if(tag){const scope=tag==='th'?' scope="col"':'';return `<${tag}${scope}>${inner()}</${tag}>`;}
  if(n.nodeType==='document')return inner();
  if(n.nodeType==='hr')return '<hr>';
  if(n.nodeType==='table')return `<div class="table-scroll" tabindex="0" role="region" aria-label="Scrollable club table"><table><tbody>${inner()}</tbody></table></div>`;
  if(['hyperlink','entry-hyperlink','asset-hyperlink'].includes(n.nodeType)){
   let url=n.data?.uri;
   if(n.nodeType==='entry-hyperlink'){const target=get(n.data?.target);if(target.enabled===false)return inner();url=target.template==='home'?'/':`/${target.slug}/`;}
   if(n.nodeType==='asset-hyperlink')url=assetUrl(n.data?.target);
   return `<a href="${escapeHtml(siteUrl(url))}">${inner()}</a>`;
  }
  if(n.nodeType==='embedded-asset-block'){
   const a=n.data?.target;return media(a,a?.description||a?.title||'',a?.title);
  }
  if(n.nodeType==='embedded-entry-block'){
   const e=get(n.data?.target);if(e.enabled===false)return '';
   const path=[...trail,e.id];
   if(e.type==='galleryImage')return linked(media(e.image,e.alt||'',e.title),e.link);
   if(e.type==='contentCard'){
    const action=linkTarget(e.link);
    const body=renderRichText(e.body,entries,path)+(action?'<p>'+linked(escapeHtml(action.label),e.link)+'</p>':'');
    if(e.presentation==='faq')return `<details class="club-faq"><summary>${escapeHtml(e.title)}</summary><div>${body}</div></details>`;
    return `<article class="cms-card ${e.presentation==='timeline'?'cms-timeline':''}">${e.eyebrow?`<p class="eyebrow">${escapeHtml(e.eyebrow)}</p>`:''}${e.image?media(e.image,e.imageAlt||''):''}<h3>${escapeHtml(e.title)}</h3>${e.description?`<p>${escapeHtml(e.description)}</p>`:''}${body}</article>`;
   }
   if(e.type==='section'){
    if(e.kind==='embed'){const url=approvedEmbed(e.embedUrl);return url?`<iframe class="club-embed" src="${escapeHtml(url)}" title="${escapeHtml(e.title||'Club information')}" loading="lazy"></iframe>`:'';}
    return renderRichText(e.body,entries,path);
   }
   throw new Error(`Unsupported rich text embedded content type ${e.type}.`);
  }
  throw new Error(`Unsupported rich text node ${n.nodeType}.`);
 };
 return next(document.content);
}

export const richTextPlainText=document=>{
 const visit=n=>n?.nodeType==='text'?n.value:(n?.content||[]).map(visit).join(' ');
 return visit(document).replace(/\s+/g,' ').trim();
};
