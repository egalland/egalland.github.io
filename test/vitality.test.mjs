import test from 'node:test';
import assert from 'node:assert/strict';
import {createVitality,impactEvent,koDurationMs,npcHealthAt,pedestrianDamage,crashDamage} from '../public/vitality.js';
import {ragdollPose} from '../public/ragdoll.js';
const base=1890000000000;

test('Variable collision damage, one first-aid kit and medical supplies share one health state',()=>{
  assert(pedestrianDamage(15)>pedestrianDamage(5));assert(crashDamage(18)>crashDamage(9));
  const v=createVitality(null,base);
  assert.equal(v.aid(base),false);v.hurt(52,{at:base,angle:1,force:.1});
  assert.equal(v.state(base).lifeState,'hurt');
  assert(v.aid(base+1));assert.equal(v.health,73);assert.equal(v.state(base+1).medkits,0);
  assert.equal(v.aid(base+2),false);
  v.tick(base+50,true);assert.equal(v.health,91);assert.equal(v.state(base+50).medkits,1);
  v.tick(base+60,true);assert.equal(v.health,91);
  v.tick(base+12000);assert(v.health>91);assert.equal(v.state(base+12000).recovering,true);
});

test('Knockouts persist over a page transfer, accept ambulance rescue and provide a brief recovery window',()=>{
  const v=createVitality(null,base);
  v.hurt(100,{at:base,angle:1.8,force:.85,cause:'traffic',seed:24});
  assert.equal(v.health,0);assert.equal(v.state(base).lifeState,'down');assert.equal(v.downUntil,base+koDurationMs);
  assert.equal(v.aid(base+3000),false);assert.equal(v.hurt(60,{at:base+600}),false);
  const next=createVitality(JSON.parse(JSON.stringify(v.snapshot())),base+800);
  assert.equal(next.state(base+800).downSeconds,6);assert(next.ragdoll);
  assert.equal(next.tick(base+1450,true),false);assert.equal(next.downUntil,base+2700);
  assert.equal(next.ragdoll.until,next.downUntil);assert.equal(next.tick(base+2701,true),true);
  assert.equal(next.health,75);assert.equal(next.ragdoll,null);assert.equal(next.state(base+2701).lifeState,'recovering');
  assert.equal(next.hurt(100,{at:base+3200}),false);
  assert.equal(next.hurt(100,{at:base+5600}),true);
  const overdue=createVitality(next.snapshot(),base+30000);assert(overdue.tick(base+30000));assert.equal(overdue.health,75);
});

test('NPCs retain hit points across encounters, get back up and gradually recover after a quiet interval',()=>{
  assert.equal(npcHealthAt({health:73,healthAt:base},base+9999),73);
  assert.equal(npcHealthAt({health:73,healthAt:base},base+11000),77);
  const state={health:0,healthAt:base,downUntil:base+6500};
  assert.equal(npcHealthAt(state,base+6400),0);
  assert.equal(npcHealthAt(state,base+6550),65);
  assert.equal(npcHealthAt(state,base+20000),79);
  assert.equal(npcHealthAt(state,base+99999),100);
});

test('The 15 articulated points tumble, retain segment lengths, settle above the ground and replay identically for a late observer',()=>{
  const event=impactEvent(base,.6,.9,6500,24);
  const joints=ragdollPose(event,.7,base),falling=ragdollPose(event,.7,base+280),rest=ragdollPose(event,.7,base+2200);
  const names=Object.keys(joints).filter(n=>n!=='blend');assert.equal(names.length,15);
  assert(joints.head[1]>1.25);assert(falling.head[1]<joints.head[1]);assert(rest.head[1]<.35);
  const length=(pose,a,b)=>Math.hypot(...pose[a].map((n,i)=>n-pose[b][i]));
  for(const [a,b] of [['hips','chest'],['rightKnee','rightFoot'],['leftShoulder','leftElbow'],['rightElbow','rightHand']]){
    assert(Math.abs(length(rest,a,b)-length(joints,a,b))<.016);
  }
  for(const key of names)assert(rest[key].every(Number.isFinite)&&rest[key][1]>=0);
  assert.deepEqual(ragdollPose({...event},.7,base+280),falling);
  const other=ragdollPose({...event,seed:849,angle:2.3},.7,base+280);assert.notDeepEqual(other.leftHand,falling.leftHand);
  assert(ragdollPose(event,.7,base+6300).blend<.6);
  assert.equal(ragdollPose(event,.7,base+6500),null);assert.equal(ragdollPose({...event,force:NaN},.7,base),null);
});
