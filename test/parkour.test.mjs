import test from 'node:test';
import assert from 'node:assert/strict';
import {createParkour} from '../public/parkour.js';
import {contactAt} from '../public/paris-world.js';
import {terrainHeight,terrainGradient} from '../public/terrain-height.js';
import {PLAYER_RADIUS} from '../public/crowd-motion.js';

const start={x:325,y:-744,angle:0};
const deck=(type='terraceTop',h=1.62)=>({id:'ledge',type,h,x:start.x+2,y:start.y,angle:0,halfLength:1,halfWidth:1.15,standable:true,climbable:true});
function trial(...colliders){
  const p={...start},input={x:0,y:0,angle:0,sprint:false},world={colliders};
  assert.equal(contactAt(p.x,p.y,{radius:PLAYER_RADIUS,footZ:0,...world}),null);
  const controls=createParkour(p,terrainHeight,terrainGradient);
  function tick(){controls.step(1/120,input,world);}
  function run(seconds){for(let i=0;i<Math.round(seconds*120);i++)tick();}
  return {p,input,world,controls,tick,run,press(){controls.setPressed(true);controls.setPressed(false);}};
}

test('a buffered second tap jumps upon landing, while a held button produces only one takeoff',()=>{
  const {p,controls,run,tick}=trial();
  controls.setPressed(true);run(.45);
  assert.ok(p.motion==='fall' && p.lift>0.8);
  run(.8);assert.equal(p.lift,0);assert.equal(p.motion,'idle');
  controls.setPressed(false);controls.setPressed(true);controls.setPressed(false);
  run(.69);assert.ok(!controls.grounded && p.verticalSpeed<0);
  controls.setPressed(true);controls.setPressed(false);
  for(let i=0;i<17;i++)tick();
  assert.equal(p.motion,'jump');assert.ok(p.lift>.18);
});

test('parkour refuses tall walls, active traffic, people and a vault with an obstructed landing',()=>{
  for(const obstacle of [
    deck('wall',8),
    {...deck('sedan'),isCar:true,standable:false,climbable:false,moving:true},
    {...deck('walker'),person:true,standable:false,climbable:false}
  ]){
    const {p,input,world,controls,press,run}=trial(obstacle);
    assert.equal(controls.hint(0,world),'jump');
    input.x=1;press();run(1.8);
    assert.ok(p.x<=obstacle.x-obstacle.halfLength-PLAYER_RADIUS+.03);
    assert.equal(p.lift,0);
  }
  const bench={id:'seat',type:'bench',h:.85,r:.72,x:start.x+1.8,y:start.y};
  const wall={...deck('wall',6),id:'wall',x:start.x+4.8,halfLength:2.1};
  const {controls,world,p,input,press,run}=trial(bench,wall);
  assert.equal(controls.hint(0,world),'jump');
  input.x=1;press();run(1.7);
  assert.ok(p.x<=wall.x-wall.halfLength-PLAYER_RADIUS+.03);
});

test('mantling checks the live landing, and walking off a supported edge grants a short jump grace period',()=>{
  const {p,controls,world,input,press,run,tick}=trial(deck());
  assert.equal(controls.hint(0,world),'climb');
  press();run(.20);assert.equal(p.motion,'climb');assert.ok(p.lift>.2);
  world.colliders.length=0;run(.04);assert.equal(p.motion,'fall');
  run(.6);assert.equal(p.lift,0);
  Object.assign(p,start);controls.reset();world.colliders.push(deck());
  press();run(1.2);assert.ok(controls.grounded&&p.lift>1.5);
  input.x=1;
  for(let i=0;i<250&&controls.grounded;i++)tick();
  assert.equal(p.motion,'fall');
  run(.025);press();tick();assert.equal(p.motion,'jump');assert.ok(p.verticalSpeed>5);
});

test('terrace tops keep a level world-space height when the local ground slopes',()=>{
  const {p,input,controls,world,press,run}=trial(deck());
  assert.equal(controls.hint(0,world),'climb');
  press();run(1.2);
  const roofZ=terrainHeight(world.colliders[0].x,world.colliders[0].y)+world.colliders[0].h;
  assert.ok(Math.abs(terrainHeight(p.x,p.y)+p.lift-roofZ)<.002);
  input.y=1;run(.35);assert.ok(controls.grounded);
  assert.ok(Math.abs(terrainHeight(p.x,p.y)+p.lift-roofZ)<.002);
});

test('the local contact shadow stays on the terrace while the player jumps above its deck',()=>{
  const {p,press,run,tick}=trial(deck());
  press();run(1.2);assert.ok(p.lift>1.5);
  const deckHeight=p.lift;assert.ok(Math.abs(p.supportHeight-deckHeight)<.002);
  press();run(.36);assert.ok(p.lift>deckHeight+.9);
  assert.ok(Math.abs(p.supportHeight-deckHeight)<.002);
  for(let i=0;i<60;i++)tick();
  assert.ok(Math.abs(p.supportHeight-deckHeight)<.002);
});
