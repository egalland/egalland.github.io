import test from 'node:test';
import assert from 'node:assert/strict';
import {destinations,parkedCars,SPAWN,props,nearbyProps,moveBody,blocked,contactAt,cameraDistance,monuments,routeAgents,districtAt,getTravelPoint,streetAt,pontDeNeuilly} from '../public/paris-world.js';

test('ten geographic fast-travel stops leave the player and their parked vehicle clear of static geometry',()=>{
  assert.equal(destinations.length,10);
  assert.ok(destinations.some(d=>d.key==='louvre'));
  for(const stop of destinations){
    assert.equal(blocked(stop.x,stop.y,.56),false,stop.label);
    const car=parkedCars.find(v=>v.id==='car-'+stop.key);
    assert.ok(car);
    assert.equal(contactAt(car.x,car.y,{angle:car.angle,halfLength:1.96,halfWidth:.85}),null,stop.key);
    assert.ok(Math.hypot(stop.x-car.x,stop.y-car.y)<5.6);
    assert.equal(getTravelPoint(stop.key),stop);
    assert.ok(districtAt(stop.x,stop.y).length);
  }
  assert.match(streetAt(SPAWN.x,SPAWN.y),/Armée/i);
});

test('arches allow passage below the arch, block each actual pier and intercept elevated camera rays',()=>{
  for(const m of Object.values(monuments)){
    assert.equal(blocked(m.x,m.y,.45),false,m.id);
    assert.equal(blocked(m.x,m.y,.45,new Set(),m.h-1),true,m.id);
    const rx=(m.side+m.innerSide)*.5,rz=(m.depth+m.innerDepth)*.5;
    const x=m.x+rx*Math.cos(m.yaw)+rz*Math.sin(m.yaw),y=m.y-rx*Math.sin(m.yaw)+rz*Math.cos(m.yaw);
    assert.equal(blocked(x,y,.45),true,m.id);
    assert.ok(cameraDistance(m.x,m.y,1.7,Math.atan2(y-m.y,x-m.x),Math.hypot(x-m.x,y-m.y),4)<Math.hypot(x-m.x,y-m.y));
  }
});

test('walking and driving use swept static and oriented vehicle contacts without tunneling',()=>{
  const m=monuments.arc,xx=m.x,yy=m.y,a=-m.yaw+Math.atan2(8,16);
  const walked=moveBody(xx,yy,Math.cos(a)*22,Math.sin(a)*22,{radius:.45});
  assert.ok(walked.hit);assert.equal(blocked(walked.x,walked.y,.45),false);
  const parked=parkedCars[0];
  const car={...parked,halfLength:2.2,halfWidth:.95};
  const dx=parked.x-SPAWN.x,dy=parked.y-SPAWN.y;
  const hit=moveBody(SPAWN.x,SPAWN.y,dx*2,dy*2,{radius:.42,colliders:[car]});
  assert.equal(hit.touched?.id,car.id);
  assert.ok(Math.hypot(hit.x-car.x,hit.y-car.y)>1);
  assert.equal(blocked(100000,100000),true);
});

test('objects stop movement until destroyed and bridge stays open across the Seine',()=>{
  const candidates=nearbyProps(SPAWN.x,SPAWN.y,180);
  assert.ok(candidates.length>10);assert.equal(new Set(props.map(p=>p.id)).size,props.length);
  const prop=candidates.find(p=>!blocked(p.x,p.y,.14,new Set([p.id])));
  assert.ok(prop);assert.equal(blocked(prop.x,prop.y,.14),true);assert.equal(blocked(prop.x,prop.y,.14,new Set([prop.id])),false);
  const {start,end}=pontDeNeuilly;
  for(let t=.08;t<.95;t+=.09){
    const x=start[0]+t*(end[0]-start[0]),y=start[1]+t*(end[1]-start[1]);
    assert.equal(contactAt(x,y,{radius:.45})?.type==='water',false);
  }
  const angle=Math.atan2(end[1]-start[1],end[0]-start[0]),c=Math.cos(angle),s=Math.sin(angle);
  const length=Math.hypot(end[0]-start[0],end[1]-start[1])+130;
  for(const lane of [-9,0,8]){
    const x=start[0]-65*c-lane*s,y=start[1]-65*s+lane*c;
    const trip=moveBody(x,y,length*c,length*s,{halfLength:2.1,halfWidth:.92,angle});
    assert.equal(trip.hit,false,'uninterrupted drive between shore approaches');
    assert.ok(Math.hypot(trip.x-x-length*c,trip.y-y-length*s)<.01);
  }
  assert.equal(contactAt(320,-900,{radius:.4})?.type,'water');
});

test('street traffic and pavement pedestrians are geographically located, move coherently and agree between clients',()=>{
  const t=1750033444788, first=routeAgents(SPAWN.x,SPAWN.y,130,t);
  assert.deepEqual(first,routeAgents(SPAWN.x,SPAWN.y,130,t));
  assert.ok(first.cars.length>=2 && first.actors.length>=4);
  const later=routeAgents(SPAWN.x,SPAWN.y,130,t+400);
  const a=first.actors.find(v=>later.actors.some(w=>w.id===v.id));
  const b=later.actors.find(w=>w.id===a.id);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>.01);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<=a.speed*.4+.01);
});

test('an independent Paris-region tile spawns beside a real road, retains historic travel options and locates its neighbours',async()=>{
  const {readFile}=await import('node:fs/promises');
  const x=6300,y=-9400;
  const fixture={
    buildings:[{id:'local-building',poly:[[x-25,y-15],[x+25,y-15],[x+25,y+15],[x-25,y+15]],h:12}],
    streets:[{id:'local-road',level:0,w:11,kind:'residential',name:'Rue de la République',path:[[x-480,y+37],[x+480,y+37]]}],
    green:[],water:[],
    metadata:{sector:{name:'Saint-Denis',x,y,lat:48.88-y/111320,lon:2.25+x/73190},
      boundary:[[x-700,y-700],[x+700,y-700],[x+700,y+700],[x-700,y+700]]}
  };
  const source=await readFile(new URL('../public/paris-world.js',import.meta.url),'utf8');
  const dataModule='data:text/javascript;base64,'+Buffer.from(Object.entries(fixture).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n')).toString('base64');
  const tileModule='data:text/javascript;base64,'+Buffer.from(source.replace("'./paris-data.js'",JSON.stringify(dataModule))).toString('base64');
  const tile=await import(tileModule);
  assert.equal(tile.destinations.length,1);
  assert.equal(tile.coreDestinations.length,10);
  assert.equal(tile.getTravelPoint('sector'),tile.SPAWN);
  assert.equal(tile.districtAt(tile.SPAWN.x,tile.SPAWN.y),'Saint-Denis');
  assert.equal(tile.streetAt(tile.SPAWN.x,tile.SPAWN.y),'Rue de la République');
  assert.ok(Math.hypot(x-tile.SPAWN.x,y-tile.SPAWN.y)<60);
  assert.equal(tile.blocked(x,y,.5),true);
  assert.equal(tile.blocked(tile.SPAWN.x,tile.SPAWN.y,1),false);
  const car=tile.parkedCars[0];assert.ok(Math.hypot(car.x-tile.SPAWN.x,car.y-tile.SPAWN.y)<5);
  assert.equal(tile.contactAt(car.x,car.y,{halfLength:1.96,halfWidth:.85,angle:car.angle}),null);
  assert.ok(tile.props.length>0);
  assert.ok(tile.routeAgents(tile.SPAWN.x,tile.SPAWN.y,140,1750033444788).actors.length>0);
  const info=tile.sectorInfo(x+685,y);
  assert.equal(info.edge,'east');assert.equal(info.distanceToEdge,15);
  assert.equal(info.closest.x,x+700);assert.equal(info.closest.y,y);
  assert.ok(info.outward.x>.99&&Math.abs(info.outward.y)<.01);
  assert.equal(info.neighbors.length,4);const east=info.neighbors.find(n=>n.direction===info.edge);
  assert.equal(east.x,x+1400);assert.equal(east.y,y);
  assert.ok(Math.abs((east.lon-2.25)*73190-east.x)<1e-7);
});
