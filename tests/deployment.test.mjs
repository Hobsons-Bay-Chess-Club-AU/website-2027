import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {normalizeBase,withBase} from '../src/lib/site-url.mjs';

test('repository hosting keeps local paths under its base and preserves external services',()=>{
  assert.equal(withBase('/membership/?from=menu#fees','/website-2027/'),'/website-2027/membership/?from=menu#fees');
  assert.equal(withBase('/','website-2027'),'/website-2027/');
  assert.equal(withBase('/fonts/hbcc-fonts.css','/'),'/fonts/hbcc-fonts.css');
  for(const url of ['https://images.ctfassets.net/space/hero.webp','https://tournament.hobsonsbaychess.com/v2/calendar','#main','mailto:info@hobsonsbaychess.com'])assert.equal(withBase(url,'/website-2027'),url);
  assert.equal(normalizeBase('/nested/repository/'),'/nested/repository/');
  assert.throws(()=>normalizeBase('/../outside'),/SITE_BASE_PATH/);
});

test('custom-domain deployment refuses the reference snapshot before building',()=>{
  const result=spawnSync(process.execPath,['scripts/run-astro.mjs','pages'],{env:{...process.env,CONTENT_SOURCE:'reference',SITE_URL:'https://hobsonsbaychess.com',SITE_BASE_PATH:'/'},encoding:'utf8',shell:false});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Custom domains require published Contentful content/);
});
