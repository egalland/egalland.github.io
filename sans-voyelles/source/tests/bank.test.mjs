import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const bank=JSON.parse(readFileSync('lib/question-bank.json','utf8'));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').replace(/æ/g,'ae').replace(/[^a-z0-9]/g,'');
assert.equal(bank.length,2000);
assert.deepEqual(bank.slice(0,60).map(q=>q.answer),JSON.parse(readFileSync('tests/fixtures/legacy-answers.json','utf8')),'Active games must retain original question indices');
for(const theme of ['cinema','people','world','animals']){
 const entries=bank.filter(q=>q.theme===theme);
 assert.equal(entries.length,500,theme);
 assert.equal(new Set(entries.map(q=>normalize(q.answer))).size,500,'Duplicate answer: '+theme);
 assert.equal(new Set(entries.map(q=>q.wiki)).size,500,'Duplicate article: '+theme);
 for(const q of entries){
  assert.ok(q.answer.trim()&&q.hint.trim()&&q.wiki.trim());
  assert.ok(/[aeiouy]/.test(normalize(q.answer)),'No vowel to remove: '+q.answer);
  assert.ok(/[bcdfghjklmnpqrstvwxz0-9]/i.test(q.answer.normalize('NFD').replace(/[\u0300-\u036f]/g,'')),'No consonant to display: '+q.answer);
  assert.ok(q.answer.length<=90,'Overlong answer: '+q.answer);
  if(q.illustration){assert.ok(/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(q.illustration.url),'Unexpected image host');assert.ok(/^https:\/\/(fr|en)\.wikipedia\.org\/wiki\//.test(q.illustration.page));}
  for(const alias of q.aliases||[])assert.ok(alias.trim()&&alias.length<=100);
 }
}
console.log('Passed: 2,000 entries, exactly 500 per theme, unique answers/articles, playable words, complete metadata and safe illustration URLs.');
