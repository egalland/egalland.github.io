import test from 'node:test';
import assert from 'node:assert/strict';
import {solveIK,walkingFoot,banarPose,banarModels,speech,fixedShip,walkState,danceFoot,pilotState} from '../dist/kinematics.mjs';
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('les deux segments gardent leur longueur, même hors de portée',()=>{
 for(const target of [[16,35],[-50,25],[300,0],[0,.001]])for(const bend of [-1,1]){
  const hip=[0,0],ik=solveIK(hip,target,38,37,bend);
  near(distance(hip,ik.joint),38);near(distance(ik.joint,ik.end),37);
  assert.ok([...ik.joint,...ik.end].every(Number.isFinite));
 }
});

test('chaque pied reste ancré pendant l’appui, y compris au départ et à l’arrêt',()=>{
 for(const travel of [110,180])for(let i=0;i<4;i++){
  const scale=[220,294,252,247][i]/banarModels[i].height;
  let previous;
  for(let t=0;t<8;t+=.01){
   const walk=walkState(t,travel,i),stride=travel/(walk.cycles*scale),d=walk.distance/scale;
   const pose=banarPose(i,t,{distance:d,stride,locomotion:true,walk:walk.weight});
   for(let j=0;j<2;j++){
    const foot=pose.feet[j],last=previous?.pose.feet[j];
    near(distance(pose.legs[j].ankle,foot.ankle),0);
    if(last?.stance&&foot.stance)near(walk.distance+foot.ankle[0]*scale,previous.d+last.ankle[0]*scale);
   }
   previous={pose,d:walk.distance};
  }
  const end=walkState(8,travel,i),stride=travel/(end.cycles*scale);
  for(const offset of [.06,.56]){
   const first=walkingFoot(0,offset,0,stride),last=walkingFoot(travel/scale,offset,0,stride);
   assert.ok(first.stance&&last.stance);near(first.x,last.x);
  }
 }
});

test('les pieds se lèvent peu, sans rotation excessive, puis se posent sans rebond',()=>{
 for(let d=0;d<64;d+=.01){
  const foot=walkingFoot(d,.06);
  assert.ok(foot.lift>=0&&foot.lift<=7.00001);assert.ok(Math.abs(foot.angle)<=.055001);
 }
 const edge=(.68-.06)*32;
 assert.ok(walkingFoot(edge+.0001,.06).lift<1e-7);
 assert.ok(walkingFoot((1-.06)*32-.0001,.06).lift<1e-7);
});

test('la cadence ralentit sans recul et les quatre personnages s’arrêtent sur deux appuis',()=>{
 for(let i=0;i<4;i++){
  let last=0;for(let t=0;t<8;t+=.01){const w=walkState(t,180,i);assert.ok(w.distance>=last-1e-7);last=w.distance}
  near(walkState(0,180,i).weight,0);near(walkState(8,180,i).weight,0);near(walkState(8,180,i).distance,180);
 }
});

test('la danse garde un pied d’appui et ne fait pas glisser les pieds posés',()=>{
 for(let i=0;i<4;i++)for(let t=16;t<30;t+=.01){
  const feet=[danceFoot(t,i,0),danceFoot(t,i,1)];assert.ok(feet.some(f=>f.stance));
  for(let j=0;j<2;j++)if(feet[j].stance)near(feet[j].x,(j?1:-1)*14);
 }
});

test('l’alien lâche le volant avant la rétraction et le retrouve après son retour',()=>{
 let reachedDance=false;
 for(let t=0;t<31;t+=.01){
  const pilot=pilotState(t);
  if(pilot.panel>.001)near(pilot.release,1);
  if(pilot.dance>.9){assert.ok(pilot.stand>.99);reachedDance=true}
 }
 assert.ok(reachedDance);near(pilotState(29).release,0);near(pilotState(29).panel,0);near(pilotState(29).stand,0);
});

test('le vaisseau conserve son échelle pendant toute la scène, sans zoom',()=>{
 for(const portrait of [false,true])for(let t=4.6;t<31.2;t+=.1)near(fixedShip(t,{portrait}).s,.76);
 assert.ok(fixedShip(30).x>fixedShip(29).x);
});

test('les becs parlent chacun leur tour et se referment au repos',()=>{
 for(let i=0;i<4;i++){
  let maximum=0;for(let t=0;t<7;t+=.01)maximum=Math.max(maximum,speech(t,i));
  assert.ok(maximum>.2);near(speech(8,i),0);
 }
 assert.ok(speech(1.5,0)>0);near(speech(1.5,1),0);
});
