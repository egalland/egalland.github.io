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

test('les pensées correspondent au geste et la réplique vient du second curseur',()=>{
 const life=createRobotLife(()=>0),visible=[{i:0,r:{x:20,top:220,width:200,height:30}}],lines=[];
 let code=false;
 for(let t=0;t<55;t+=.15){
  life.update(t,visible,3,false);
  for(let i=0;i<3;i++){
   const a=life.pose(i,t,visible,390,650);if(!a)continue;
   if(a.kind==='code'&&a.text){assert.ok(a.snippet);code=true}
   if(a.kind==='review'&&a.text&&!lines.some(l=>l.text===a.text))lines.push({i,text:a.text});
  }
 }
 assert.ok(code);assert.ok(lines.length>=2);assert.notEqual(lines[0].i,lines[1].i);
});
