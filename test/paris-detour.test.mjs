import test from 'node:test';
import assert from 'node:assert/strict';
import { createDetourPlanner } from '../public/traffic-detour.js';
import { createTrafficFlow } from '../public/traffic-flow.js';
import { trafficAlternatives, sampleTrafficRoute, trafficVehicleAt, contactAt } from '../public/paris-world.js';
import { vehicleSpec } from '../public/vehicle-types.js';
import { packTraffic, cleanTrafficPacket, receiveTraffic } from '../public/traffic-sync.js';

const route='r184245_1sh3897',d=219.58827490987926,at=1782250000000;
const original=trafficVehicleAt(route,1),spec=vehicleSpec(original.type);
const sample=sampleTrafficRoute,planner=createDetourPlanner(trafficAlternatives,sample);
const block=sample(route,d+26);
const barrier={...block,id:'parked-in-lane',isCar:true,type:'van',speed:0,r:1,...vehicleSpec('van')};
const streetBlocked=(x,y,angle,spec)=>!!contactAt(x,y,{angle,halfLength:spec.halfLength,halfWidth:spec.halfWidth});

test('a blocked exit at Étoile leads to an actual connected detour which is shared by late clients',()=>{
  const seed={...original,...sample(route,d),routeDistance:d,speed:0};
  const flow=createTrafficFlow(sample,planner);
  let drive=seed,changed=false,travel=0;
  const snapshots=[];
  for(let i=0;i<360;i++){
    const prev=drive;
    [drive]=flow.step([seed],{dt:1/30,epoch:at+i*1000/30,observer:seed,blockers:[barrier],blockedPose:streetBlocked});
    assert.ok(drive);assert.equal(drive.id,seed.id);
    assert.ok(!contactAt(drive.x,drive.y,{angle:drive.angle,halfLength:spec.halfLength,halfWidth:spec.halfWidth,colliders:[barrier]}));
    const step=Math.hypot(drive.x-prev.x,drive.y-prev.y);travel+=step;assert.ok(step<.45);
    if(prev.routeId!==drive.routeId){assert.equal(prev.routeId,route);changed=true;}
    if(changed)snapshots.push(drive);
  }
  assert.ok(changed,'selects a different legal exit before reaching the parked van');
  assert.ok(travel>35);
  const pose=snapshots.at(-1);
  const packet=cleanTrafficPacket(packTraffic([pose],pose,new Set(),at),at);
  assert.equal(packet.cars[0][4],pose.routeId);
  const late={id:'late',joinedAt:81,x:pose.x,y:pose.y};
  const leader={...late,id:'first',joinedAt:8,traffic:packet};
  const feed=receiveTraffic([leader],late,[],at,trafficVehicleAt,sample);
  assert.equal(feed.checkpoints[0].id,original.id);
  assert.equal(feed.checkpoints[0].routeId,pose.routeId);
  const [joined]=createTrafficFlow(sample,planner).step([],{dt:0,epoch:at,observer:late,checkpoints:feed.checkpoints});
  assert.equal(joined.type,pose.type);assert.equal(joined.id,pose.id);
  assert.ok(Math.hypot(joined.x-pose.x,joined.y-pose.y)<.02);
});

test('a vehicle waits if the turn has no room or if the obstruction is on the shared approach',()=>{
  for(const blockedDistance of [5,26]){
    const alt=planner({routeId:route,routeDistance:d,spec,blockedDistance,obstructedAt:()=>blockedDistance>5,blockedPose:streetBlocked});
    assert.equal(alt,null);
  }
});
