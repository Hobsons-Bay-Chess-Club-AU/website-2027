import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicFacebook,facebookPermalink,facebookArticle,sourceHash,articleHash,syncDecision} from '../scripts/facebook-source.mjs';
test('a Facebook profile or login page cannot create a fabricated news article',()=>{
 assert.throws(()=>parsePublicFacebook('<title>Hobsons Bay Chess Club</title><meta property="og:description" content="Sports club">'),/without dated HBCC posts/);
 assert.equal(facebookPermalink('https://evil.example/hobsonsbaychess/posts/123'),null);
 assert.equal(facebookPermalink('https://www.facebook.com/hobsonsbaychess/posts/abc?tracking=1'),'https://www.facebook.com/hobsonsbaychess/posts/abc');
});
test('the public scraper only accepts dated club posts with a source permalink',()=>{
 const post={'@type':'SocialMediaPosting',author:{name:'Hobsons Bay Chess Club'},identifier:'123',articleBody:'Junior chess returns this Saturday.',datePublished:'2026-10-09T08:00:00Z',url:'https://www.facebook.com/hobsonsbaychess/posts/123'};
 const parsed=parsePublicFacebook('<script type="application/ld+json">'+JSON.stringify([post,{...post,author:{name:'Visitor'},identifier:'456'}])+'</script>');
 assert.equal(parsed.length,1);assert.equal(parsed[0].id,'123');
});
test('Facebook news imports remain draft content and protect manual editorial changes',()=>{
 const post={id:'123',message:'Club update\nA new coaching session.',created_time:'2026-10-09T08:00:00Z',permalink_url:'https://www.facebook.com/hobsonsbaychess/posts/123'};
 const {fields}=facebookArticle(post);fields.facebookImportHash=articleHash(fields);
 assert.equal(syncDecision(null,post),'create');assert.equal(fields.migrationReviewRequired,true);
 assert.equal(syncDecision(fields,post),'unchanged');
 const changed={...post,message:'An updated coaching announcement.'};
 assert.equal(syncDecision(fields,changed),'update-draft');
 assert.equal(syncDecision({...fields,title:'An editor wrote this title'},changed),'edited-in-contentful');
 assert.equal(syncDecision({...fields,facebookSyncEnabled:false},changed),'editor-controlled');
 assert.notEqual(sourceHash(post),sourceHash(changed));
});
