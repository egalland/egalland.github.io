import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeKlines,simulate } from '../dist/engine.mjs';
import { createSceneData,envelopeSections,interpolateMedian } from '../dist/scene-data.mjs';
const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/snapshot.json',import.meta.url)));
let combinations=0;
for(const [symbol,intervals] of Object.entries(snapshot.markets))for(const [interval,rows] of Object.entries(intervals)){
  const data=normalizeKlines(rows),f=simulate(data,{interval,horizon:48}),s=createSceneData(data,f,120);
  assert.equal(s.candles.length,120);
  assert(s.candles.every((p,i)=>!i||p.x>s.candles[i-1].x),'Time increases left to right');
  for(const p of s.candles)for(const key of ['open','close','high','low'])assert(Math.abs(s.invertY(p[key])-p.raw[key])<1e-7,'Price round trip is exact');
  assert.equal(s.future[0].x,s.candles.at(-1).x,'Projection starts at the observed anchor');
  assert.equal(s.future[0].median,s.candles.at(-1).close);
  for(const inner of [false,true])envelopeSections(s.future,inner).forEach((section,i)=>{
    assert(Math.abs(section.center-section.radiusY-(inner?s.future[i].q25:s.future[i].low))<1e-10);
    assert(Math.abs(section.center+section.radiusY-(inner?s.future[i].q75:s.future[i].high))<1e-10);
    assert(section.radiusZ>0&&Number.isFinite(section.radiusZ));
  });
  assert.deepEqual(interpolateMedian(s.future,0),{x:s.future[0].x,y:s.future[0].median});
  assert.deepEqual(interpolateMedian(s.future,1),{x:s.future.at(-1).x,y:s.future.at(-1).median});
  const end=s.future.at(-1),headOn=createSceneData(data,f,120,false);
  assert.equal(s.invertY(end.median),headOn.invertY(headOn.future.at(-1).median),'Layer visibility does not change displayed prices');
  combinations++;
}
assert.equal(createSceneData([],null),null);
console.log(JSON.stringify({passed:true,marketIntervalCombinations:combinations,checks:['linear price mapping','chronological coordinates','exact forecast anchor','quantile envelope boundaries','median interpolation','data retained across view modes']}));
