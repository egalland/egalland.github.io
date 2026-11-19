import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const src=await readFile('components/field-effects.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {FieldEffects,PARTICLE_LIMIT}=await import('data:text/javascript;base64,'+Buffer.from(js.replace(/import \{ artwork \} from [^;]+;/,"const artwork=()=>undefined;")).toString('base64'));
const labels=[];
const ctx={save(){},restore(){},fillRect(){},fillText(text){labels.push(text)},measureText(){return {width:20}},beginPath(){},arc(){},fill(){}};
const game=new FieldEffects(),point={face:'top',u:102,v:50,depth:0},home={id:'base',kind:'base',own:true,hull:500,point};
const origin=1_000_000;
function paint(ms,delivered,actors=[],settings={}){
  game.draw(ctx,{now:origin+ms,face:'top',zoom:3,width:600,height:450,reduced:false,project:()=>({x:100,y:100}),
    actors:[home,...actors],view:{now:origin+ms,generation:'one',simulationBehind:0,me:{home:point,delivered,army:{order:'hold'}}},...settings});
}
paint(0,12);assert.equal(game.count,0);
paint(2400,17);assert.equal(game.count,1);assert(labels.includes('+5 au dépôt'));
paint(2400,17);assert.equal(game.count,1,'Rendering the same server snapshot must not repeat a delivery');
paint(6100,42);assert.equal(game.count,0,'An inactive tab must not replay a backlog of effects');
const drills=Array.from({length:200},(_,i)=>({id:'unit/'+i,kind:'rig',hull:100,point,emission:{kind:'dust',width:6,height:1,interval:300}}));
paint(6200,42,drills);assert.equal(game.count,PARTICLE_LIMIT);
paint(6400,42,drills,{reduced:true});assert.equal(game.count,0);
paint(6800,42,drills,{zoom:.2});assert.equal(game.count,0);
paint(6900,42,drills,{project:()=>({x:-800,y:-800})});assert.equal(game.count,0);
paint(7100,42,drills);assert(game.count>0);
paint(9200,42,drills.map(({emission,...idle})=>idle));assert.equal(game.count,0,'A stopped machine must stop emitting');
console.log('PASS Actual deliveries appear once. Paused work, hidden routes, regional zoom, inactive tabs and reduced motion release the bounded particle pool.');
