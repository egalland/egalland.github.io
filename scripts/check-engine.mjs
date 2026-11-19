import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeKlines, simulate, backtest, STEP } from '../dist/engine.mjs';

const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/snapshot.json',import.meta.url)));
let checked=0;
for(const [symbol,intervals] of Object.entries(snapshot.markets)) {
  for(const [interval,rows] of Object.entries(intervals)) {
    const data=normalizeKlines(rows,snapshot.fetchedAt);
    assert(data.length>=499,`${symbol}/${interval}: closed candles`);
    assert(data.every((c,i)=>!i||c.time-data[i-1].time===STEP[interval]),'No gaps in sample');
    const options={horizon:24,interval,seed:101};
    const a=simulate(data,options),b=simulate(data,options);
    assert.deepEqual(a,b,'Reproducible seed');
    assert(a.upside>=0&&a.upside<=1);
    for(const [i,p] of a.bands.entries()) {
      assert([p.p10,p.p25,p.median,p.p75,p.p90].every(v=>Number.isFinite(v)&&v>0));
      assert(p.p10<=p.p25&&p.p25<=p.median&&p.median<=p.p75&&p.p75<=p.p90,'Ordered quantiles');
      assert.equal(p.time,data.at(-1).time+(i+1)*STEP[interval]);
    }
    const withChangedFuture=data.map(c=>({...c}));
    withChangedFuture.at(-1).close*=1.5;
    const old=backtest(data,options),changed=backtest(withChangedFuture,options);
    assert.deepEqual(old.folds.map(f=>f.predicted),changed.folds.map(f=>f.predicted),'Future truth does not leak into its predictions');
    assert.notEqual(old.folds.at(-1).error,changed.folds.at(-1).error,'Changed test truth changes measured error');
    assert.equal(old.count,8);
    checked++;
  }
}
const flat=Array.from({length:200},(_,i)=>({time:1000000+i*3600000,end:1000000+(i+1)*3600000-1,open:100,high:100,low:100,close:100,volume:1}));
assert(simulate(flat).bands.every(p=>p.p10===100&&p.median===100&&p.p90===100),'Flat history stays flat');
assert.throws(()=>simulate(flat,{horizon:0}));
assert.throws(()=>normalizeKlines([]));
console.log(JSON.stringify({passed:true,marketIntervalCombinations:checked,checks:['closed candles','sample continuity','deterministic seeds','ordered positive quantiles','forecast timestamps','walk-forward leakage','flat history','invalid inputs']}));
