import test from 'node:test';
import assert from 'node:assert/strict';
import { localDatabase } from '../scripts/local-db.mjs';
import { handleApi } from '../worker/game-api.js';
import { packTraffic, receiveTraffic } from '../public/traffic-sync.js';
import { SPAWN, routeAgents, trafficVehicleAt, sampleTrafficRoute } from '../public/paris-world.js';
import { createTrafficFlow } from '../public/traffic-flow.js';

test('A late observer joins the existing traffic queue, then takes ownership when the first observer leaves',async()=>{
  const db=localDatabase(),at=Date.now(),driver={id:crypto.randomUUID(),token:crypto.randomUUID()},other={id:crypto.randomUUID(),token:crypto.randomUUID()};
  const state={x:SPAWN.x,y:SPAWN.y};
  const original=routeAgents(state.x,state.y,130,1782250000000).cars.find(v=>v.routeId);
  assert.ok(original);
  const progress=Math.min(original.routeDistance+5,original.routeLength-.01);
  const stopped={...original,...sampleTrafficRoute(original.routeId,progress),routeDistance:progress,speed:0};
  const packet=packTraffic([stopped],state,new Set(),at);
  const post=async(action,player,pose)=>{
    const r=await handleApi(new Request('https://example.test/api/world/'+action,{method:'POST',body:JSON.stringify({...player,state:pose})}),{DB:db});
    assert.equal(r.status,200);return r.json();
  };
  try{
    await post('join',driver,{...state,traffic:{...packet,cars:[...packet.cars,['invalid id!',0,99,1],[original.routeId,0,-4,0]]}});
    const late=await post('join',other,state);
    const first=late.players.find(p=>p.id===driver.id),second=late.players.find(p=>p.id===other.id);
    assert.deepEqual(first.traffic.cars,packet.cars);
    // Use a strictly older observer if the local DB completes both joins in the same millisecond.
    const observer={...second,joinedAt:first.joinedAt+1};
    const shared=receiveTraffic(late.players,observer,[],at,trafficVehicleAt,sampleTrafficRoute);
    assert.equal(shared.checkpoints.length,1);assert(shared.followers.has(original.id));
    const flow=createTrafficFlow(sampleTrafficRoute);
    const cars=flow.step([],{dt:0,epoch:at,observer,checkpoints:shared.checkpoints});
    assert.equal(cars[0].id,original.id);assert.equal(cars[0].speed,0);
    assert.ok(Math.hypot(cars[0].x-stopped.x,cars[0].y-stopped.y)<.015);
    assert.equal(packTraffic(cars,observer,shared.followers,at).cars.length,0);
    const distant=await post('sync',other,{x:state.x+900,y:state.y});
    assert.equal(distant.players.find(p=>p.id===driver.id).traffic,undefined);
    await post('leave',driver,state);
    const alone=await post('sync',other,state);
    const handoff=receiveTraffic(alone.players,observer,cars,at,trafficVehicleAt,sampleTrafficRoute);
    assert.equal(packTraffic(cars,observer,handoff.followers,at).cars.length,1);
  }finally{db.close();}
});
