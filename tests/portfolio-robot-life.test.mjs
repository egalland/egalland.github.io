import test from 'node:test';
import assert from 'node:assert/strict';
import {createRobotLife} from '../portfolio-assets/themes/robot-life.mjs';

test('les robots alternent quatre occupations et laissent la priorité au chantier',()=>{
 const life=createRobotLife(()=>.99);
 const visible=[{i:3,r:{x:20,top:200,width:210,height:40}}];
 const actors=t=>Array.from({length:7},(_,i)=>life.pose(i,t,visible,390,650)).filter(Boolean);
 const seen=new Set();
 for(let t=0;t<48;t+=.1){
  life.update(t,visible,7,false);
  const group=actors(t);
  for(const a of group){seen.add(a.kind);assert.ok(a.x>0&&a.x<390)}
  assert.ok(group.filter(a=>a.text).length<=1);
  if(group.some(a=>a.kind==='review'))assert.equal(group.length,2);
 }
 assert.deepEqual(seen,new Set(['code','inspect','rest','review']));
 life.update(49,visible,7,true);assert.deepEqual(actors(49),[]);
 life.update(50,[],7,false);assert.deepEqual(actors(50),[]);
});

test('chaque scène affiche un seul mot et le partenaire reste silencieux',()=>{
 const life=createRobotLife(()=>0),visible=[{i:0,r:{x:20,top:220,width:200,height:30}}];
 const speakers=new Set(),seen=new Set();
 for(let t=0;t<44;t+=.15){
  life.update(t,visible,3,false);
  for(let i=0;i<3;i++){
   const a=life.pose(i,t,visible,390,650);if(!a?.text)continue;
   assert.match(a.text,/^\p{L}+$/u);
   seen.add(a.kind);
   if(a.kind==='review')speakers.add(i);
  }
 }
 assert.equal(seen.size,4);assert.equal(speakers.size,1);
});
