import test from 'node:test';
import assert from 'node:assert/strict';
import { contactAt, destinations, nearbyDrivableStreets } from '../public/paris-world.js';
import { planDispatch, dispatchRoadPose, stepDispatch, stepDispatchFoot } from '../public/dispatch-roads.js';

test('The four emergency vehicles pull over in distinct, navigable spaces on real Paris roads',()=>{
  for(const scene of destinations){
    const roads=nearbyDrivableStreets(scene.x,scene.y,62),reserved=[];
    for(const type of ['police','ambulance','swat','firetruck']){
      const clear=(q,spec,parked)=>!contactAt(q.x,q.y,{angle:q.angle,halfLength:spec.halfLength+.16,
        halfWidth:spec.halfWidth+.12,colliders:parked?reserved:[]});
      const plan=planDispatch(scene,type,roads,clear,q=>!contactAt(q.x,q.y,{radius:.44}));
      assert.ok(plan,scene.label+' '+type);
      assert.equal(clear(plan.park,plan.spec,true),true);
      assert.ok(!contactAt(plan.door.x,plan.door.y,{radius:.44,colliders:[{...plan.park,...plan.spec}]}));
      for(let d=0;d<=plan.length;d+=.6)assert.ok(clear(dispatchRoadPose(plan,d),plan.spec,false),scene.label+' '+type+' on approach');
      reserved.push({...plan.park,halfLength:plan.spec.halfLength+.8,halfWidth:plan.spec.halfWidth+.35});
    }
  }
});

test('A response brakes on its route for a pedestrian and resumes when the lane clears',()=>{
  const roads=[{id:'street',path:[[0,0],[100,0]],w:7,oneway:1}];
  const plan=planDispatch({x:62,y:5},'police',roads,()=>true,()=>true);
  const state={plan},blocker=dispatchRoadPose(plan,13);
  let active=true,at=0,last,stopped=false;
  for(let i=0;i<430;i++){
    at+=1/60;
    last=stepDispatch(state,at,1/60,(q,spec)=>!active||Math.hypot(q.x-blocker.x,q.y-blocker.y)>spec.halfLength+.5);
    if(i===150){stopped=state.speed<.15;active=false;}
    if(active)assert.ok(Math.hypot(last.x-blocker.x,last.y-blocker.y)>plan.spec.halfLength+.5);
  }
  assert.ok(stopped);assert.ok(state.arrived>0);assert.ok(Math.hypot(last.x-plan.park.x,last.y-plan.park.y)<.04);
});

test('A crew walks around a wall between its door and the suspect and stops within speaking distance',()=>{
  const state={foot:{x:1,y:0},arrived:0},target={x:13,y:1};
  const clear=q=>!(q.x>=4&&q.x<=8&&q.y>=-4&&q.y<=4);
  let last,maxSide=0;
  for(let i=0;i<=360;i++){
    last=stepDispatchFoot(state,target,.3+i/30,2.3,clear);
    assert.ok(clear(last));maxSide=Math.max(maxSide,Math.abs(last.y));
  }
  assert.ok(maxSide>4.1);
  assert.ok(Math.hypot(last.x-target.x,last.y-target.y)>.9);assert.ok(Math.hypot(last.x-target.x,last.y-target.y)<1.2);
  assert.equal(last.moving,false);
});

test('Vehicles parked at Paris travel stops leave the passing lanes clear, including Concorde',async()=>{
  const {parkedCars,routeAgents,sampleTrafficRoute}=await import('../public/paris-world.js');
  const {vehicleSpec}=await import('../public/vehicle-types.js');
  let concordePasses=0;
  for(const stop of destinations){
    const parked=parkedCars.find(v=>v.id==='car-'+stop.key);
    const collider={...parked,...vehicleSpec(parked.type)},options={colliders:[collider]};
    const observed=new Map();
    for(let sec=0;sec<=64;sec+=6){
      const {cars}=routeAgents(stop.x,stop.y,95,1781500000000+sec*1000);
      for(const car of cars)if(car.routeId)observed.set(car.routeId+' '+car.type,car);
    }
    for(const car of observed.values()){
      const spec=vehicleSpec(car.type);Object.assign(options,{halfLength:spec.halfLength+.2,halfWidth:spec.halfWidth+.2});
      for(let d=0;d<car.routeLength;d+=1.1){
        const q=sampleTrafficRoute(car.routeId,d);
        if(Math.hypot(q.x-parked.x,q.y-parked.y)>8)continue;
        options.angle=q.angle;
        assert.notEqual(contactAt(q.x,q.y,options)?.id,parked.id,stop.label+' '+car.type);
        if(stop.key==='concorde')concordePasses++;
      }
    }
  }
  assert.ok(concordePasses>12,'Concorde traffic actually passed the parked car');
});
