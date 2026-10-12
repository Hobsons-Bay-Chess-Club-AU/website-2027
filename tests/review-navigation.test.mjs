import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewNavigation} from '../src/lib/review-navigation.mjs';
import {createReviewEntries} from '../src/lib/review-content.mjs';
import {resolveEntries} from '../src/lib/content-source.mjs';

test('version comparison keeps published pages and articles under the repository path',()=>{
 const sharedPaths=['/membership/','/calendar/','/club-news/'];
 for(const page of sharedPaths){
  const current=reviewNavigation({basePath:'/website-2027/',pathname:'/website-2027'+page,sharedPaths});
  assert.equal(current.switchHref,'/website-2027/v2'+page);
  assert.equal(current.changesHref,'/website-2027/v2/review/');
  assert.equal(current.otherVersion,'v2');
  const v2=reviewNavigation({review:true,basePath:'/website-2027/v2/',pathname:current.switchHref,sharedPaths});
  assert.equal(v2.switchHref,'/website-2027'+page);
  assert.equal(v2.otherVersion,'current');
 }
});

test('V2-only and unknown pages switch to a working homepage instead of a missing counterpart',()=>{
 for(const page of ['coaching','privacy-policy','review','404.html']){
  const link=reviewNavigation({review:true,basePath:'/website-2027/v2/',pathname:`/website-2027/v2/${page}/`,sharedPaths:['/membership/']});
  assert.equal(link.switchHref,'/website-2027/');
 }
 assert.equal(reviewNavigation({basePath:'/website-2027/',pathname:'/outside/'}).switchHref,'/website-2027/v2/');
});

test('version links support root and nested deployments and reject a mismatched V2 base',()=>{
 assert.equal(reviewNavigation({pathname:'/'}).switchHref,'/v2/');
 assert.equal(reviewNavigation({review:true,basePath:'/v2/',pathname:'/v2/news/'}).switchHref,'/news/');
 assert.equal(reviewNavigation({review:true,basePath:'/team/site/v2/',pathname:'/team/site/v2/'}).switchHref,'/team/site/');
 assert.throws(()=>reviewNavigation({review:true,basePath:'/website-2027/'}),/V2 review navigation/);
});

test('V2 counterpart paths follow enabled CMS pages and posts without including overlay-only pages',async()=>{
 const fixture=JSON.parse(await readFile('src/data/cms.json','utf8'));
 const entries=resolveEntries(fixture.items,fixture.assets);
 entries.find(e=>e.id==='wp-page-4424').slug='join-the-club';
 const enabledPost=entries.find(e=>e.type==='post'&&e.enabled!==false);
 const settings=createReviewEntries(entries).find(e=>e.type==='siteSettings');
 assert.ok(settings.reviewCurrentPaths.includes('/join-the-club/'));
 assert.ok(settings.reviewCurrentPaths.includes(`/${enabledPost.slug}/`));
 for(const path of ['/coaching/','/privacy-policy/','/review/'])assert.ok(!settings.reviewCurrentPaths.includes(path));
 const link=reviewNavigation({review:true,basePath:'/website-2027/v2/',pathname:'/website-2027/v2/join-the-club/',sharedPaths:settings.reviewCurrentPaths});
 assert.equal(link.switchHref,'/website-2027/join-the-club/');
});
