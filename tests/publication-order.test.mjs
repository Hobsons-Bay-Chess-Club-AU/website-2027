import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationOrder} from '../scripts/publication-order.mjs';
const ref=id=>({sys:{type:'Link',linkType:'Entry',id}});
test('existing page backlinks do not block dependency-first native CMS publication',()=>{
 const proposals=[{id:'play',type:'page',before:{sys:{publishedVersion:2}},fields:{section:ref('intro')}},{id:'intro',type:'section',fields:{action:ref('contact-link')}},{id:'contact-link',type:'navigationItem',fields:{page:ref('contact')}},{id:'contact',type:'page',before:{sys:{publishedVersion:2}},fields:{section:ref('venue')}},{id:'venue',type:'section',fields:{action:ref('play-link')}},{id:'play-link',type:'navigationItem',fields:{page:ref('play')}}];
 const order=publicationOrder(proposals);
 assert.ok(order.indexOf('contact-link')<order.indexOf('intro'));assert.ok(order.indexOf('intro')<order.indexOf('play'));assert.ok(order.indexOf('venue')<order.indexOf('contact'));
 assert.throws(()=>publicationOrder([{id:'a',type:'section',fields:{child:ref('b')}},{id:'b',type:'section',fields:{child:ref('a')}}]),/Circular publication/);
});
