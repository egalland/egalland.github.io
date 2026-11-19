import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTrafficRoutes,sampleRoadRoute} from '../public/traffic-roads.js';

function street(id,path,options={}){
  const length=path.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-path[i][0],p[1]-path[i][1]),0);
  return {id,key:0,path,length,road:{id,path,w:8,kind:'residential',level:0,...options}};
}
const square=()=>[
  street('a',[[0,0],[60,0]]),street('b',[[60,0],[60,60]]),
  street('c',[[60,60],[0,60]]),street('d',[[0,60],[0,0]])
];
const difference=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

test('a complete right-hand circuit closes smoothly, turns at real endpoints and reports signed junction distances',()=>{
  const roads=[...square(),street('side',[[60,0],[100,0]])];
  const routes=buildTrafficRoutes(roads,[[roads[0]]]);
  assert.equal(routes.size,1);
  const [r]=routes.values();assert.ok(r.closed);assert.equal(r.junctions.length,1);
  const east=sampleRoadRoute(r,17);assert.ok(Math.abs(east.y-2)<.001);assert.ok(Math.abs(east.angle)<.001);
  const {d,id}=r.junctions[0];assert.equal(id,'60,0,0');
  for(const delta of [-3,0,4]){
    const j=sampleRoadRoute(r,d-delta).junction;assert.equal(j.id,id);assert.ok(Math.abs(j.distance-delta)<1e-7);
  }
  for(let d=0;d<r.length+1;d+=.4){
    const p=sampleRoadRoute(r,d-.2),q=sampleRoadRoute(r,d+.2);
    assert.ok(Math.hypot(q.x-p.x,q.y-p.y)<=.401);
    assert.ok(difference(p.angle,q.angle)<.5);
  }
  const same=[...buildTrafficRoutes(roads.toReversed(),[[roads[0]]]).values()][0];
  assert.deepEqual(r,same);
});

test('one-way streets cannot be taken backwards and overpasses do not create false junctions',()=>{
  const roads=square();roads[0].road.oneway=-1;
  const [r]=buildTrafficRoutes(roads,[[roads[0]]]).values();
  assert.ok(r);const west=sampleRoadRoute(r,15);assert.ok(Math.abs(west.y+2)<.001);
  assert.ok(Math.abs(Math.abs(west.angle)-Math.PI)<.001);
  roads[1].road.oneway=1;assert.equal(buildTrafficRoutes(roads,[[roads[0]]]).size,0);
  const isolated=square();isolated[1].road.level=1;assert.equal(buildTrafficRoutes(isolated,[[isolated[0]]]).size,0);
});

test('dead ends do not cause instant U-turns, impassable seeds leave room for a nearby viable road',()=>{
  const leaf=street('dead-end',[[0,0],[-30,0]]),roads=square();
  const network=buildTrafficRoutes([...roads,leaf],[[leaf,roads[0]]]);
  assert.equal(network.size,1);
  const [r]=network.values();assert.ok(r.points.every(p=>p[0]>=0));
  assert.equal(buildTrafficRoutes(roads,[[roads[0]]],{laneClear:p=>p.x<45}).size,0);
});

test('a through-road clipped by both edges exits the tile once and never wraps into view',()=>{
  const roads=[street('through',[[0,0],[80,0]]),street('continuation',[[80,0],[160,0]])];
  const [r]=buildTrafficRoutes(roads,[[roads[0]]],{atEdge:([x])=>x===0||x===160}).values();
  assert.ok(r&&!r.closed);
  assert.equal(sampleRoadRoute(r,-.01),null);assert.equal(sampleRoadRoute(r,r.length+.01),null);
  assert.ok(Math.abs(sampleRoadRoute(r,100).x-100)<.01);
  assert.equal(buildTrafficRoutes(roads,[[roads[0]]],{atEdge:([x])=>x===0}).size,0);
});
