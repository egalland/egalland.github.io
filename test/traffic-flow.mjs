import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrafficFlow } from '../public/traffic-flow.js';
import { vehicleSpec } from '../public/vehicle-types.js';

const origin=1811000000000,dt=1/30;
function lane(routeId,distance){
  if(distance>180)return null;
  const crossing=routeId==='north';
  return {x:crossing?-1.5:distance,y:crossing?distance:1.5,angle:crossing?Math.PI/2:0,
    junction:distance>=-32&&distance<7?{id:'centre',distance:-distance,angle:crossing?Math.PI/2:0,x:0,y:0}:null,
    routeLength:400,routeLoop:false};
}
const straight=(id,d)=>({...lane(id,d),junction:null});
function seed(id,routeId,d,speed=8,type='car'){
  return {id,routeId,type,cruiseSpeed:8,routeDistance:d,...lane(routeId,d),speed,moving:true};
}
function run(flow,seeds,seconds,{from=0,blockers=[],...other}={}){
  const samples=[];
  for(let i=0;i<Math.round(seconds/dt);i++){
    const time=from+i*dt;
    samples.push(flow.step(seeds,{dt,epoch:origin+1000*time,blockers:typeof blockers==='function'?blockers(time):blockers,...other}));
  }
  return samples;
}
function overlap(a,b){
  const sa=vehicleSpec(a.type),sb=vehicleSpec(b.type);
  const ah=a.angle===0?sa.halfLength:sa.halfWidth,av=a.angle===0?sa.halfWidth:sa.halfLength;
  const bh=b.angle===0?sb.halfLength:sb.halfWidth,bv=b.angle===0?sb.halfWidth:sb.halfLength;
  return Math.abs(a.x-b.x)<ah+bh&&Math.abs(a.y-b.y)<av+bv;
}

test('a queue brakes for a player in its lane, keeps bumper gaps and starts again',()=>{
  const flow=createTrafficFlow(straight),seeds=[seed('front','east',-20),seed('rear','east',-34,8,'bus')];
  const stopped=run(flow,seeds,10,{blockers:[{id:'player',x:0,y:1.5,r:.42}]});
  for(const [a,b] of stopped){
    assert.ok(a.x+vehicleSpec(a.type).halfLength<-.42);
    assert.ok(!overlap(a,b));
  }
  const [front,rear]=stopped.at(-1);
  assert.ok(front.x> -6 && rear.x> -16);
  assert.ok(front.speed<.08&&rear.speed<.08);
  const [moving,trailing]=run(flow,seeds,8,{from:10}).at(-1);
  assert.ok(moving.x>25&&trailing.x>10);
});

test('a sidewalk user and a parked vehicle in an adjacent lane do not brake traffic',()=>{
  const flow=createTrafficFlow(straight),seeds=[seed('driver','east',-24)];
  const end=run(flow,seeds,7,{blockers:[{x:0,y:-1.5,isCar:true,type:'bus',angle:Math.PI},{x:3,y:4,r:.4}]}).at(-1)[0];
  assert.ok(end.x>29 && end.speed>7.8);
});

test('cross traffic gives way, clears the junction in order and makes progress in both directions',()=>{
  const seeds=[seed('A','east',-23,7,'bus'),seed('B','north',-22,7,'sedan'),
    seed('C','east',-42),seed('D','north',-43)];
  const simulate=(order)=>run(createTrafficFlow(lane),order,24);
  const frames=simulate(seeds),other=simulate([...seeds].reverse());
  assert.deepEqual(frames.at(-1),other.at(-1));
  let sawYield=false;
  for(const frame of frames){
    for(let i=0;i<frame.length;i++)for(let j=i+1;j<frame.length;j++)assert.ok(!overlap(frame[i],frame[j]));
    if(frame.some(c=>c.speed<1.2&&c.routeDistance> -17&&c.routeDistance< -6))sawYield=true;
  }
  assert.ok(sawYield);
  assert.ok(frames.at(-1).every(c=>c.routeDistance>18));
});

test('a crossing pedestrian starts braking before touching the lane',()=>{
  const flow=createTrafficFlow(straight),seeds=[seed('driver','east',-10,8)];
  const frames=run(flow,seeds,2.8,{blockers:t=>[{x:0,y:3.3-1.4*t,vx:0,vy:-1.4,r:.41}]});
  assert.ok(frames[3][0].speed<8);
  for(let i=0;i<frames.length;i++){
    const c=frames[i][0],dy=Math.max(0,Math.abs(c.y-(3.3-1.4*i*dt))-.9),dx=Math.max(0,Math.abs(c.x)-2.06);
    assert.ok(dx**2+dy**2>=.41**2);
  }
});

test('a stopped car remains local after the free-running seed leaves; claims and travel reset release it',()=>{
  const flow=createTrafficFlow(straight),seeds=[seed('car','east',-14)];
  const options={observer:{x:-3,y:1.5},blockers:[{x:1,y:1.5,r:.45}]};
  run(flow,seeds,2,options);
  assert.equal(run(flow,[],5,{...options,from:2}).at(-1).length,1);
  assert.equal(flow.step([],{...options,dt,excluded:new Set(['car'])}).length,0);
  run(flow,seeds,1,options);
  flow.reset();
  assert.equal(flow.step([],{...options,dt}).length,0);
});

test('peer checkpoints restore delayed vehicles, wrap on loops and apply each stamp once',()=>{
  const wrap=(_,d)=>({x:((d%100)+100)%100,y:0,angle:0,junction:null,routeLoop:true,routeLength:100});
  const flow=createTrafficFlow(wrap);
  const remote={...seed('driver','loop',98,4),stamp:origin,routeLength:100,routeLoop:true};
  const first=flow.step([],{dt:0,epoch:origin,checkpoints:[remote],observer:{x:96,y:0}})[0];
  assert.equal(first.x,98);
  const next={...remote,routeDistance:1,speed:4,stamp:origin+100};
  let c=flow.step([],{dt:.05,epoch:origin+100,checkpoints:[next],observer:{x:96,y:0}})[0];
  assert.ok(c.routeDistance>98 && c.routeDistance<99);
  for(let i=1;i<=25;i++){
    c=flow.step([],{dt:.05,epoch:origin+100+50*i,checkpoints:[next],observer:{x:96,y:0}})[0];
  }
  assert.ok(c.routeDistance>102&&c.x<12);
});

test('no vehicle spawns on top of a player or continues past an open map edge',()=>{
  const flow=createTrafficFlow((id,d)=>d>10?null:straight(id,d));
  const start=seed('car','east',0);
  assert.equal(flow.step([start],{dt,blockers:[{x:0,y:1.5,r:.4}]}).length,0);
  flow.reset();
  const frames=run(flow,[start],2);
  assert.ok(frames.some(frame=>frame.length===0));
});

test('road scenery stops large vehicles with their actual oriented dimensions',()=>{
  const flow=createTrafficFlow(straight),seeds=[seed('bus','east',-15,8,'bus')];
  const end=run(flow,seeds,5,{blockedPose:(x,y,angle,spec)=>x+spec.halfLength>0}).at(-1)[0];
  assert.ok(end.x>=-7.7&&end.x<=-4.25&&end.speed===0);
});

test('a blocked outbound lane leaves the intersection free for crossing traffic',()=>{
  const seeds=[seed('east','east',-17,7),seed('north','north',-22,7)];
  const queue={x:9,y:1.5,angle:0,type:'bus',isCar:true};
  const flow=createTrafficFlow(lane),end=run(flow,seeds,9,{blockers:[queue]}).at(-1);
  const east=end.find(c=>c.id==='east'),north=end.find(c=>c.id==='north');
  assert.ok(east.routeDistance< -6&&east.speed<.1&&east.brake);
  assert.ok(north.routeDistance>20);
  assert.ok(run(flow,seeds,6,{from:9}).at(-1).find(c=>c.id==='east').routeDistance>12);
});

test('opposing taxis pass in narrow parallel lanes with physical clearance',()=>{
  const narrow=(id,d)=>({x:id==='left'?-d:d,y:id==='left'?0:2,angle:id==='left'?Math.PI:0,junction:null});
  const seeds=[seed('one','left',-19,6,'taxi'),seed('two','right',-15,6,'taxi')];
  const end=run(createTrafficFlow(narrow),seeds,6).at(-1);
  assert.ok(end[0].x< -18&&end[1].x>20);
});
