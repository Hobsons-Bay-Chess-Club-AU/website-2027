import notes from '../data/review-notes.json';
import audit from '../../docs/ALL-PAGES-AUDIT.md?raw';
import {getContent} from '../lib/content.mjs';
import {siteUrl} from '../lib/site-url.mjs';
// These two downloadable audit documents are build artifacts, not CMS pages.
export const prerender=true;
export async function getStaticPaths(){
 const {settings}=await getContent();
 return settings.reviewVersion?['review-notes.md','all-pages-audit.md'].map(reviewFile=>({params:{reviewFile}})):[];
}
export async function GET({site,params}){
 const {settings}=await getContent();
 if(!settings.reviewVersion)return new Response('Review notes are available in /v2/.',{status:404});
 if(!['review-notes.md','all-pages-audit.md'].includes(params.reviewFile))return new Response('Not found',{status:404});
 if(params.reviewFile==='all-pages-audit.md')return new Response(audit,{headers:{'Content-Type':'text/markdown; charset=utf-8'}});
 const url=path=>new URL(siteUrl(path),site).href;
 const body=[`# HBCC V2 — Team Review`, `Prepared ${notes.date}`,`Review website: ${url('/')}`,`Changes and checklist: ${url('/review/')}`,
  '## Changes in this version',...notes.changes.map((c,i)=>`${i+1}. **${c.title}** — ${c.detail}${c.path?'\n   '+url(c.path):''}`),
  '## Action links: before and after',['| Action | Before this review work | Destination in V2 |','| --- | --- | --- |',...notes.linkRepairs.map(row=>'| '+row.join(' | ')+' |')].join('\n'),
  '## Club input still needed',...notes.pending.map(p=>`- **${p.title}** (${p.owner}): ${p.detail}`),
  '## Review checklist',...notes.checks.map(c=>'- [ ] '+c),
  '## Feedback','Reply to the person who shared the link. Include the page URL, device, expected behaviour and suggested change. Checkboxes on the website do not submit feedback.',
  'Membership, About Us, policies and full page-audit repairs are published shared CMS fixes shown in both rebuilt versions. Champions includes 2025 and is ordered newest first; Sponsors includes seven supporters. The remaining navigation/calendar proposals can be promoted after club review. The WordPress production domain is unchanged.',
 ].join('\n\n')+'\n';
 return new Response(body,{headers:{'Content-Type':'text/markdown; charset=utf-8'}});
}
