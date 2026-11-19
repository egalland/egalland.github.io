import test from 'node:test';
import assert from 'node:assert/strict';
import {peerViewTime, readPeerMotion, recordPeerMotion} from '../public/peer-motion-net.js';
import {createGame} from '../public/game.js';

const foot = (at, x, vx=5) => ({id:'runner', updatedAt:at, joinedAt:1, x, y:10, vx, vy:0, moving:vx!==0, health:100});

test('irregularly delivered poses keep the same position for aiming at any render frame rate', () => {
  const track = {};
  for (const [at, arrival] of [[1000,1024],[1075,1125],[1155,1164],[1280,1330],[1375,1411]]) {
    recordPeerMotion(track, foot(at, (at-1000)*.005), arrival);
    for (const dt of [0, 1000/120, 1000/60, 1000/30]) {
      const t=peerViewTime(arrival+dt);
      const result=readPeerMotion(track,t);
      assert.ok(Math.abs(result.x - Math.max(0,(t-1000)*.005))<.00001);
      assert.equal(result.y,10);
      assert.equal(result.at,Math.max(t,1000));
    }
  }
});

test('lost, duplicated or reversed updates cannot move a player indefinitely or replay an old position', () => {
  const track = {};
  recordPeerMotion(track,foot(2000,0),2020);
  recordPeerMotion(track,foot(2100,.5),2130);
  const frozen=readPeerMotion(track,peerViewTime(5000));
  assert.equal(frozen.at,2280);
  assert.ok(Math.abs(frozen.x-1.4)<1e-9);
  assert.equal(recordPeerMotion(track,foot(2100,.5),5000),false);
  assert.equal(recordPeerMotion(track,foot(2050,-30),5100),false);
  assert.deepEqual(readPeerMotion(track,peerViewTime(6000)),frozen);
});

test('a turn corrects a short prediction continuously, while teleport, vehicle transfer and revival reset the track', () => {
  const track={};
  recordPeerMotion(track,foot(1000,0),1010);
  recordPeerMotion(track,foot(1100,.5),1120);
  const before=readPeerMotion(track,peerViewTime(1310));
  recordPeerMotion(track,foot(1230,.64,-3),1310);
  assert.ok(Math.abs(readPeerMotion(track,peerViewTime(1310)).x-before.x)<1e-7);
  assert.ok(Math.abs(readPeerMotion(track,peerViewTime(1410)).x-(.64-.345))<1e-7);
  recordPeerMotion(track,foot(1450,100),1470);
  assert.equal(readPeerMotion(track,peerViewTime(1470)).x,100);
  recordPeerMotion(track,{...foot(1510,102,0),vehicle:{id:'car'}},1530);
  assert.equal(readPeerMotion(track,peerViewTime(1530)).x,102);
  recordPeerMotion(track,{...foot(1560,103),health:0},1580);
  assert.equal(readPeerMotion(track,peerViewTime(1900)).x,103);
  recordPeerMotion(track,{...foot(4500,104,0),joinedAt:4499},4510);
  assert.equal(readPeerMotion(track,peerViewTime(4510)).x,104);
  assert.equal(recordPeerMotion(track,foot(4490,-2),4550),false);
});

test('a changed roster is visible on the next game frame and unchanged revisions skip roster enumeration', t => {
  const globals=['window','document','requestAnimationFrame','cancelAnimationFrame'];
  const saved=globals.map(key=>globalThis[key]);
  globalThis.window=new EventTarget();globalThis.document=new EventTarget();
  let frame, scene, tick=performance.now(), now=1000000, reads=0, revision=1, roster=[];
  globalThis.requestAnimationFrame=fn=>{frame=fn;return 1;};
  globalThis.cancelAnimationFrame=()=>{};
  const net={id:'observer',status:'online',serverTime:()=>now,world:()=>({}),get rosterRevision(){return revision;},
    peers(){reads++;return roster;},publish(){}};
  const game=createGame({canvas:new EventTarget(),net,buildView:()=>({
    available:true,mode:'canvas',aim:()=>0,render(value){scene=value;},effect(){},dispose(){}
  })});
  t.after(()=>{
    game.destroy();
    globals.forEach((key,i)=>{if(saved[i]===undefined)delete globalThis[key];else globalThis[key]=saved[i];});
  });
  const step=()=>{now+=16;frame(tick+=16);};
  const me=game.getPosition();
  roster=[{id:'runner',x:me.x+7,y:me.y,updatedAt:now,health:100,joinedAt:1,angle:0}];revision++;
  step();
  let remote=scene.entities.find(e=>e.id==='runner');
  assert.equal(remote.x,me.x+7);
  assert.equal(remote.viewAt,roster[0].updatedAt);
  const count=reads;
  step();step();
  assert.equal(reads,count);
  roster=[];revision++;
  step();
  assert.equal(scene.entities.some(e=>e.id==='runner'),false);
});
