import test from 'node:test';
import assert from 'node:assert/strict';
import {motionSeed,sampleLocomotion,linkedPose} from '../public/locomotion-pose.js';
import {createPuppet} from '../public/puppets3d.js';

const pose=(motion,phase=0,extra={})=>({id:'pedestrian-23',motion,motionPhase:phase,walk:.9,...extra});
const sample=e=>sampleLocomotion(e,.52,motionSeed(e.id));

test('gait follows distance, leans with grade and turns, and assigns reproducible idle variations',()=>{
  const walk=pose('walk',0,{stride:.4,turn:.6}),fast={...walk,stride:.99};
  const slow=sample(walk),run=sample(fast);
  assert.ok(run.left.thigh<slow.left.thigh-.2);
  assert.ok(sample({...walk,slope:.3}).lean>sample({...walk,slope:-.25}).lean+.10);
  assert.ok(slow.roll>sample({...walk,turn:-.6}).roll+.05);
  const idle=pose('idle'),walker=sample({...walk,walk:walk.walk+Math.PI});
  assert.ok(walker.left.thigh>0&&slow.left.thigh<0);
  assert.notEqual(sample(idle).roll,sample({...idle,id:'pedestrian-24'}).roll);
  assert.deepEqual(sample(idle),sample({...idle}));
});

test('flight is continuous across its apex and touches down before the squash and rebound',()=>{
  const jump=sample(pose('jump',.499,{verticalSpeed:.01})),fall=sample(pose('fall',.501,{verticalSpeed:-.01}));
  assert.ok(Math.abs(jump.right.thigh-fall.right.thigh)<.01);
  const end=sample(pose('fall',1)),land=sample(pose('land')),hit=sample(pose('land',.23)),back=sample(pose('land',1));
  assert.ok(Math.abs(end.left.thigh-land.left.thigh)<.01&&Math.abs(end.left.elbow-land.left.elbow)<.01);
  assert.ok(hit.bob<land.bob-.07&&hit.squash<-.15);
  assert.equal(back.bob,sample(pose('idle')).bob);
  assert.ok(sample(pose('fall',.1,{verticalSpeed:-6})).left.splay>.45);
});

test('knitted mesh and linked armature both reach overhead, pull down and lead with alternate knees',()=>{
  const mesh=createPuppet('fox','#542',3);
  const bone=n=>mesh.group.getObjectByName(n);
  const reaching=pose('climb',.23),pulling=pose('climb',.68);
  mesh.update(reaching,1/60,.52);
  const near=bone('armR').rotation.z;
  mesh.update(pulling,1/60,.52);
  assert.ok(near-bone('armR').rotation.z>.85);
  assert.ok(bone('kneeL').rotation.z<-.55&&bone('kneeR').rotation.z<-.55);
  for(const name of ['climb','vault']){
    const rig=e=>linkedPose(e,sample(e),.52),reached=rig(pose(name,.23)),pulled=rig(pose(name,.68));
    assert.ok(reached.arms[0][2][1]>pulled.arms[0][2][1]+.055);
    assert.ok(Math.abs(pulled.legs[0][2][0]-pulled.legs[1][2][0])>.10);
  }
  mesh.dispose();
});
