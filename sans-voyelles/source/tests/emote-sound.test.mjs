import ts from 'typescript';import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('lib/emote-sound.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {EMOTE_OPTIONS,messageTime,playEmoteSound}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(EMOTE_OPTIONS.length,10);assert.match(messageTime(1000),/^\d{2}:\d{2}:01$/);assert.equal(messageTime(),'--:--:--');
const signatures=[];
for(const emoji of EMOTE_OPTIONS){const trace=[];const param=()=>({value:0,setValueAtTime:(...a)=>trace.push(['set',...a]),linearRampToValueAtTime:(...a)=>trace.push(['linear',...a]),exponentialRampToValueAtTime:(...a)=>trace.push(['ramp',...a])});const node=()=>({connect(){},disconnect(){},start(t){trace.push(['start',t])},stop(t){trace.push(['stop',t])},frequency:param(),gain:param()});const ac={currentTime:0,sampleRate:8000,destination:{},createOscillator:node,createGain:node,createBiquadFilter:node,createBufferSource:node,createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})};playEmoteSound(ac,emoji);assert.ok(trace.some(t=>t[0]==='start'),emoji);assert.ok(trace.filter(t=>t[0]==='stop').every(t=>t[1]>0&&t[1]<1),emoji);signatures.push(JSON.stringify(trace));}
assert.equal(new Set(signatures).size,10,'Each emote has a different sound sequence');
console.log('Passed: ten distinct short synthesized reactions and message timestamps including seconds.');
