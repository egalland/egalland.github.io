import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, authorized } from './server.mjs';
const w = (minutes, usedPercent = 25) => ({windowDurationMins: minutes, usedPercent, resetsAt: 2000000000});
test('maps actual windows and percentages', () => {
 const r = normalize({rateLimitsByLimitId: {codex: {primary:w(300),secondary:w(10080,80)}}},100000);
 assert.deepEqual(r.windows.map(x=>[x.minutes,x.remaining]),[[300,75],[10080,20]]);
 assert.equal(r.fetchedAt,100);
});
test('never uses another model bucket', () => {
 assert.throws(()=>normalize({rateLimitsByLimitId:{other:{primary:w(300)}}}));
});
test('unavailable secondary stays absent', () => {
 assert.equal(normalize({rateLimits:{limitId:'codex',primary:w(60),secondary:null}}).windows.length,1);
});
test('reject invalid quota values', () => {
 for(const v of [-1,101,null,'25']) assert.throws(()=>normalize({rateLimits:{limitId:'codex',primary:w(300,v)}}));
});
test('auth rejects missing and wrong tokens',()=>{
 assert.equal(authorized(undefined,'secret'),false);
 assert.equal(authorized('Bearer nope','secret'),false);
 assert.equal(authorized('Bearer secret','secret'),true);
});
import { readQuotas } from './server.mjs';
import { fileURLToPath } from 'node:url';
test('stdio initialization and quota read against a fake process', async()=>{
 const result=await readQuotas(fileURLToPath(new URL('./fake-codex.mjs',import.meta.url)));
 assert.equal(result.windows[0].remaining,65);
});
test('missing Codex produces an explicit failure',async()=>{
 await assert.rejects(readQuotas('/nonexistent/codex'));
});

test('Node launcher supports an npm-installed Codex script', async()=>{
 const previous=process.env.CODEX_SCRIPT;
 try {
  process.env.CODEX_SCRIPT=fileURLToPath(new URL('./fake-codex.mjs',import.meta.url));
  const result=await readQuotas();
  assert.equal(result.windows[0].remaining,65);
 } finally {
  if(previous===undefined) delete process.env.CODEX_SCRIPT; else process.env.CODEX_SCRIPT=previous;
 }
});
