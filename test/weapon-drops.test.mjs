import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFile } from 'node:fs/promises';
import { authoredWeaponDrops, decodeDropId, encodeDropId, gridDrop, isEligibleDropId } from '../public/drop-id.js';

const kinds=['shotgun','smg','yarn'];
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

async function checkLocalGround() {
  const { weaponDrops, nearbyWeaponDrops }=await import('../public/weapon-drops.js');
  const { SPAWN, destinations, parkedCars, moveBody, contactAt }=await import('../public/paris-world.js');
  const colliders=parkedCars.map(car=>({...car,halfLength:2.06,halfWidth:.9}));
  assert.deepEqual([...new Set(weaponDrops.map(d=>d.weapon))].sort(),kinds);
  assert.equal(new Set(weaponDrops.map(d=>d.id)).size,weaponDrops.length);
  for(const drop of weaponDrops){
    assert.ok(isEligibleDropId(drop.id),drop.id);
    assert.equal(contactAt(drop.x,drop.y,{radius:.65,colliders}),null,drop.id);
    assert.deepEqual(nearbyWeaponDrops(drop.x,drop.y,67.9),[drop]);
  }
  for(const stop of destinations){
    const fixed=authoredWeaponDrops.filter(d=>distance(d,stop)<=55);
    assert.equal(fixed.length,1,stop.label);
    const [drop]=fixed;
    assert.ok(weaponDrops.some(item=>item.id===drop.id),stop.label);
    const walk=moveBody(stop.x,stop.y,drop.x-stop.x,drop.y-stop.y,{radius:.45,colliders});
    assert.equal(walk.hit,false,stop.label);
    assert.ok(distance(drop,walk)<.01,stop.label);
  }
  return {SPAWN,weaponDrops,nearbyWeaponDrops};
}

if(!isMainThread){
  const {lon,lat}=workerData;
  globalThis.location={search:'?lon='+lon+'&lat='+lat};
  globalThis.fetch=async path=>new Response(await readFile(new URL('../public'+path,import.meta.url)));
  const {weaponDrops}=await checkLocalGround();
  parentPort.postMessage(weaponDrops.length);
}else{
  test('round-trips canonical IDs and verifies world positions independently of a geographic dataset',()=>{
    assert.equal(authoredWeaponDrops.length,13);
    for(const drop of [...authoredWeaponDrops,gridDrop(40,51)]){
      assert.deepEqual(decodeDropId(drop.id),{weapon:drop.weapon,x:drop.x,y:drop.y});
      assert.equal(isEligibleDropId(drop.id),true);
      assert.equal(isEligibleDropId(encodeDropId(drop.weapon,drop.x+.1,drop.y)),false);
      assert.equal(isEligibleDropId(encodeDropId(kinds.find(k=>k!==drop.weapon),drop.x,drop.y)),false);
    }
    assert.equal(encodeDropId('yarn',-12.32,-.01),'wp-yarn:-123:0');
    for(const id of [null,'','wp-rifle:1:2','wp-smg:01:2','wp-smg:-0:1','wp-smg:1e2:9','wp-yarn:9999999:9999999']){
      assert.equal(decodeDropId(id),null);
    }
  });

  test('each central Paris stop has one walkable fixed item and only the introductory yarn is close to spawn',async()=>{
    const {weaponDrops,nearbyWeaponDrops,SPAWN}=await checkLocalGround();
    assert.ok(weaponDrops.length>=50 && weaponDrops.length<=120);
    const intro=nearbyWeaponDrops(SPAWN.x,SPAWN.y,120);
    assert.equal(intro.length,1);
    const [yarn]=intro,r=distance(SPAWN,yarn);
    assert.equal(yarn.weapon,'yarn');
    assert.ok(r>=12 && r<=18);
    assert.ok(((yarn.x-SPAWN.x)*Math.cos(SPAWN.angle)+(yarn.y-SPAWN.y)*Math.sin(SPAWN.angle))/r>.99);
    const nearby=nearbyWeaponDrops(SPAWN.x,SPAWN.y,850);
    assert.deepEqual(nearby,[...weaponDrops].filter(d=>distance(d,SPAWN)<=850).sort((a,b)=>distance(a,SPAWN)-distance(b,SPAWN)));
  });

  for(const [name,lon,lat] of [['Eiffel',2.29232,48.85935],['Notre-Dame',2.34790,48.85348],['Sacré-Cœur',2.34318,48.88480]]){
    test(name+' includes accessible and evenly dispersed items in its own IGN dataset',async()=>{
      const count=await new Promise((resolve,reject)=>{
        const worker=new Worker(new URL(import.meta.url),{workerData:{lon,lat}});
        worker.once('message',resolve);
        worker.once('error',reject);
      });
      assert.ok(count>=5 && count<=15,'observed '+count+' items');
    });
  }
}
