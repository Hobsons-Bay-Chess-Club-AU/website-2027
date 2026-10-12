export function policyHref(policy,entries){
 const values=Object.values(entries);
 const settings=values.find(e=>e.type==='siteSettings');
 const hub=entries[settings?.policyPage?.sys?.id]||values.find(e=>e.type==='page'&&e.slug==='policies');
 if(!hub||hub.enabled===false)throw new Error('Select and publish the Policies hub in Website settings.');
 const url=hub.template==='home'?'/':`/${hub.slug}/`;
 if(policy.enabled===false)return url;
 if(!policy.slug||!/^[a-z][a-z0-9-]*$/.test(policy.slug))throw new Error('Policy '+policy.id+' needs a stable section link.');
 return url+'#'+policy.slug;
}
