import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalize} from '../dist/model.js';
import {networkRoute,suggestPoints,technicalEstimate} from '../dist/technical.js';
import {envelopeWalls} from '../dist/volume-geometry.js';
import {packPlan,unpackPlan,captureVersion} from '../dist/plan-versions.js';

test('proposals respect manual modifications and excluded points',()=>{
 const s=defaults();
 s.technical.points=suggestPoints(s,'ground');
 const excluded=s.technical.points.pop();
 s.technical.excluded.push(excluded.source);
 s.technical.points[0].x=1.8;
 const data=normalize(s);
 assert.equal(data.technical.points[0].x,1.8);
 assert.deepEqual(suggestPoints(data,'ground'),[]);
 assert.equal(technicalEstimate(data).circuits.some(c=>c.name==='Plaque'),true);
});

test('waypoints and custom circuits survive a named version and a JSON round trip',()=>{
 const s=defaults();
 s.building.kind='house';
 s.technical.points=suggestPoints(s,'ground');
 const socket=s.technical.points.find(p=>p.kind==='socket');
 socket.via.electric={x:4,y:5};
 socket.circuit='Prises séjour';
 s.technical.prices['labour-electric']=2;
 const snapshot=captureVersion(s,'ground','Option maison');
 s.building.kind='warehouse';
 const loaded=unpackPlan(JSON.parse(JSON.stringify(packPlan(s,'ground',[snapshot]))));
 const before=loaded.versions[0].data;
 assert.equal(before.building.kind,'house');
 assert.equal(loaded.data.building.kind,'warehouse');
 assert.equal(before.technical.points.find(p=>p.id===socket.id).circuit,'Prises séjour');
 assert.ok(networkRoute(before,socket,'electric').some(p=>p.x===4&&p.y===5));
 assert.ok(technicalEstimate(before).budget>0);
 assert.equal(unpackPlan(s).versions.length,0);
});

test('the exterior shell cuts openings and excludes room partitions',()=>{
 const s=normalize(defaults()),B=s.building;
 const wallArea=envelopeWalls(s).reduce((sum,p)=>sum+p.height*p.length,0);
 const expected=2*(B.w+B.l)*B.h-s.openings.filter(o=>o.host==='building').reduce((sum,o)=>sum+o.w*o.h,0);
 assert.ok(Math.abs(wallArea-expected)<.0001);
 s.building.walls=false;
 assert.deepEqual(envelopeWalls(s),[]);
});
