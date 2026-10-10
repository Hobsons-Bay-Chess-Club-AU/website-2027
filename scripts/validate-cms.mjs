export function validatePackage(schema,seed,assets){
 const types=new Map(schema.contentTypes.map(t=>[t.sys.id,t]));
 const entries=new Map(seed.entries.map(e=>[e.sys.id,e])),assetIds=new Set(assets.map(a=>a.id));
 if(entries.size!==seed.entries.length||types.size!==schema.contentTypes.length||assetIds.size!==assets.length)throw new Error('CMS package has duplicate IDs.');
 const validLink=(value,field)=>{
  const id=value?.sys?.id,kind=value?.sys?.linkType;
  if(value?.sys?.type!=='Link'||!id||kind!==field.linkType)throw new Error('Invalid native CMS reference.');
  if(kind==='Asset'&&!assetIds.has(id))throw new Error('Missing CMS asset '+id);
  if(kind==='Entry'){
   const entry=entries.get(id);if(!entry)throw new Error('Missing CMS entry '+id);
   const allowed=field.validations?.find(v=>v.linkContentType)?.linkContentType;
   if(allowed&&!allowed.includes(entry.sys.contentType.sys.id))throw new Error('Wrong reference content type for '+id);
  }
 };
 const rich=n=>{
  if(!n||typeof n.nodeType!=='string')throw new Error('Invalid rich text node.');
  if(n.nodeType==='text'){if(typeof n.value!=='string')throw new Error('Invalid rich text value.');return;}
  if(!Array.isArray(n.content)||!n.data)throw new Error('Invalid rich text structure.');
  if(n.data.target)validLink(n.data.target,{linkType:n.data.target.sys?.linkType});
  n.content.forEach(rich);
 };
 for(const entry of seed.entries){
  const type=types.get(entry.sys.contentType.sys.id);if(!type)throw new Error('Unknown CMS content type.');
  for(const field of type.fields){
   const value=entry.fields[field.id]?.[seed.locale];
   if(field.required&&(value===undefined||value===null||value===''))throw new Error('Required field missing: '+type.sys.id+'.'+field.id);
  }
  for(const [key,localized] of Object.entries(entry.fields)){
   const field=type.fields.find(f=>f.id===key);if(!field)throw new Error('Unknown field '+key);
   const value=localized[seed.locale];if(value===undefined)throw new Error('Missing seed locale.');
   if(field.type==='Link')validLink(value,field);
   if(field.type==='Array'){if(!Array.isArray(value))throw new Error('Expected reference array.');value.forEach(v=>validLink(v,field.items));}
   if(field.type==='RichText'){if(value.nodeType!=='document')throw new Error('Expected rich text document.');rich(value);}
   if(['Symbol','Text'].includes(field.type)&&typeof value!=='string')throw new Error('Expected text in '+key);
   if(field.type==='Boolean'&&typeof value!=='boolean')throw new Error('Expected toggle in '+key);
   if(field.type==='Integer'&&!Number.isInteger(value))throw new Error('Expected integer in '+key);
   const choices=field.validations?.find(v=>v.in)?.in;if(choices&&!choices.includes(value))throw new Error('Invalid selection in '+key);
   const size=field.validations?.find(v=>v.size)?.size;
   if(size&&((size.max!==undefined&&value.length>size.max)||(size.min!==undefined&&value.length<size.min)))throw new Error('Invalid field size: '+type.sys.id+'.'+key);
  }
 }
 return {contentTypes:types.size,entries:entries.size,assets:assetIds.size};
}
