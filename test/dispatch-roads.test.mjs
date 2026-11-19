import test from 'node:test';
import assert from 'node:assert/strict';
import { contactAt, destinations, nearbyDrivableStreets } from '../public/paris-world.js';
import { planDispatch, dispatchRoadPose, stepDispatch, dispatchWorkSpot, stepDispatchFoot } from '../public/dispatch-roads.js';

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
  const spot=dispatchWorkSpot(state,target,.3,{role:'police',heading:0,moving:false,closeContact:true,down:false,walkable:clear,available:clear});
  let last,maxSide=0;
  for(let i=0;i<=360;i++){
    last=stepDispatchFoot(state,spot,.3+i/30,2.3,clear,target);
    assert.ok(clear(last));maxSide=Math.max(maxSide,Math.abs(last.y));
  }
  assert.ok(maxSide>4.1);
  assert.ok(Math.hypot(last.x-target.x,last.y-target.y)>1.45);assert.ok(Math.hypot(last.x-target.x,last.y-target.y)<1.6);
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

test('Crews from the same curb choose separate working positions and leave a forward walking exit',()=>{
  const target={x:0,y:0},roles=['police','swat','medic','firefighter'],chosen=[];
  for(const role of roles){
    const state={foot:{x:-8,y:0},arrived:0};
    const options={role,heading:0,moving:false,closeContact:['police','swat'].includes(role),down:false,walkable:()=>true,
      available:q=>chosen.every(v=>Math.hypot(q.x-v.x,q.y-v.y)>1.6)};
    const spot=dispatchWorkSpot(state,target,0,options);
    assert.ok(Math.abs(Math.atan2(spot.y,spot.x))>=1.02);
    const range=Math.hypot(spot.x,spot.y);
    if(role==='medic')assert.ok(range>=1.9&&range<2.7);
    if(options.closeContact)assert.ok(range>1.45&&range<1.6);
    const idle=dispatchWorkSpot(state,target,1,{...options,heading:1.59});
    assert.deepEqual([idle.x,idle.y],[spot.x,spot.y],'turning a camera while standing does not move the crew');
    const clear=q=>Math.hypot(q.x,q.y)>1.23;
    for(let i=0;i<240;i++){
      const foot=stepDispatchFoot(state,spot,.3+i*.05,2.5,clear,target);
      assert.ok(clear(foot),'approach also keeps clear of the target');
    }
    chosen.push(spot);
  }
});

test('Units change flanks for a wall, a parked vehicle or a second crew and let the medic approach a fallen player',()=>{
  const target={x:0,y:0},occupied=[];
  for(const role of ['medic','police','medic','swat','firefighter']){
    const state={foot:{x:4,y:6}},floor=q=>q.y<2.6&&q.x> -5;
    const options={role,heading:-.26,closeContact:false,down:true,moving:false,walkable:floor,
      available:q=>floor(q)&&!(q.x< -1.4&&q.y<0)&&occupied.every(b=>Math.hypot(q.x-b.x,q.y-b.y)>1.65)};
    const spot=dispatchWorkSpot(state,target,4,options);
    assert.ok(options.available(spot));
    assert.ok(Math.hypot(spot.x,spot.y)>=2);
    if(role==='medic'&&!occupied.length)assert.ok(Math.hypot(spot.x,spot.y)<2.7);
    occupied.push(spot);
  }
});
