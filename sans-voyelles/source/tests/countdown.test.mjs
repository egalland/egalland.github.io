import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('lib/countdown.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {synchronizeCountdown:sync,countdownRemaining:left,countdownFraction:fraction}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const snap={game:'game',round:1,phase:'guess',deadline:115000,serverNow:100000};
let clock=sync(null,snap,2000);assert.equal(left(clock,2000),15000);assert.equal(fraction(clock,2000),1);assert.equal(left(clock,7000),10000);
// A slower network response must not refill the current bar.
clock=sync(clock,{...snap,serverNow:100800},3000);assert.equal(left(clock,3000),14000);
clock=sync(clock,{...snap,serverNow:102000},4100);assert.equal(left(clock,4100),12900);
clock=sync(clock,{...snap,serverNow:104000},5000);assert.equal(left(clock,5000),11000);
assert.equal(left(clock,99000),0);assert.equal(fraction(clock,99000),0);
// Early reveal and next round each have their own full-duration scale.
clock=sync(clock,{...snap,phase:'reveal',serverNow:105000,deadline:110000},8000);assert.equal(left(clock,8000),5000);assert.equal(fraction(clock,8000),1);
clock=sync(clock,{...snap,round:2,serverNow:110000,deadline:125000},13000);assert.equal(left(clock,13000),15000);
// A late arrival gets the remaining time, not another 15 seconds.
clock=sync(null,{...snap,serverNow:111000},7000);assert.equal(left(clock,7000),4000);assert.ok(fraction(clock,7000)<.27);
assert.equal(left(clock,25000),0); // resumed background tab
assert.equal(left(sync(null,{...snap,deadline:Infinity},0),0),0);
assert.equal(left(sync(null,{...snap,serverNow:99000},0),0),15000);
const realDate=Date.now;Date.now=()=>9999999999999;assert.equal(left(clock,8000),3000);Date.now=realDate;
console.log('Passed: smooth monotonic countdown, delayed sync, no refill, early reveal, phase reset, late arrival, hidden tab, wall-clock jumps, clamping.');
