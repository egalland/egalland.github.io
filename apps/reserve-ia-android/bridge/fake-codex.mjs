#!/usr/bin/env node
// Fixture locale : ne contacte aucun service, n'ouvre aucun compte.
import {createInterface} from 'node:readline';
const rl=createInterface({input:process.stdin});
let ready=false;
rl.on('line',line=>{
 const m=JSON.parse(line);
 if(m.method==='initialize') console.log(JSON.stringify({id:m.id,result:{}}));
 else if(m.method==='initialized') ready=true;
 else if(m.method==='account/rateLimits/read') {
  if(!ready) console.log(JSON.stringify({id:m.id,error:{message:'Not initialized'}}));
  else console.log(JSON.stringify({id:m.id,result:{rateLimits:{limitId:'codex',primary:{usedPercent:35,windowDurationMins:300,resetsAt:2000000000}}}}));
 }
});
