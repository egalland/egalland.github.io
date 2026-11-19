import test from 'node:test';
import assert from 'node:assert/strict';
import {contactAt,moveBody,pontDeNeuilly,monuments} from '../public/paris-world.js';

const [ax,ay]=pontDeNeuilly.start,[bx,by]=pontDeNeuilly.end;
const centre={x:(ax+bx)/2,y:(ay+by)/2};
const angle=.67,c=Math.cos(angle),s=Math.sin(angle);
function point(forward,side){
  return {x:centre.x+c*forward-s*side,y:centre.y+s*forward+c*side};
}
const bus={...centre,id:'stationary-bus',halfLength:4.25,halfWidth:1.225,angle};

test('a pedestrian slides along a rotated bus flank using its shoulder clearance',()=>{
  const start=point(-2.7,bus.halfWidth+.431);
  const options={radius:.43,colliders:[bus]};
  const move=moveBody(start.x,start.y,c*1.6+s*.6,s*1.6-c*.6,options);
  assert.equal(move.touched?.id,bus.id);
  assert.ok(Math.abs(move.normalX+s)<1e-6&&Math.abs(move.normalY-c)<1e-6);
  assert.ok(Math.abs((move.x-start.x)*c+(move.y-start.y)*s-1.6)<.012);
  assert.equal(contactAt(move.x,move.y,options),null);
});

test('a car making shallow side contact with a long bus keeps tangential motion',()=>{
  const options={halfLength:2.1,halfWidth:.9,angle,colliders:[bus]};
  const start=point(-2.2,bus.halfWidth+options.halfWidth+.002);
  const move=moveBody(start.x,start.y,1.7*c+.4*s,1.7*s-.4*c,options);
  assert.equal(move.touched?.id,bus.id);
  assert.ok(Math.abs((move.x-start.x)*c+(move.y-start.y)*s-1.7)<.01);
  assert.equal(contactAt(move.x,move.y,options),null);
});

test('contact at a bumper corner uses the circular shoulder against the actual corner',()=>{
  const cornerAngle=angle+Math.PI/4,nx=Math.cos(cornerAngle),ny=Math.sin(cornerAngle);
  const corner=point(bus.halfLength,bus.halfWidth),radius=.43;
  const start={x:corner.x+nx*(radius+.001),y:corner.y+ny*(radius+.001)};
  const options={radius,colliders:[bus]},move=moveBody(start.x,start.y,-nx*.08,-ny*.08,options);
  assert.equal(move.touched?.id,bus.id);
  assert.ok(Math.abs(move.normalX-nx)<1e-6&&Math.abs(move.normalY-ny)<1e-6);
  assert.equal(contactAt(move.x,move.y,options),null);
});

test('a long car grazes the corner of an Arc de Triomphe pier on its flank',()=>{
  const m=monuments.arc,a=-m.yaw-Math.PI/4,c=Math.cos(a),s=Math.sin(a);
  const corner={x:m.x+m.side*Math.cos(m.yaw)+m.depth*Math.sin(m.yaw),
    y:m.y-m.side*Math.sin(m.yaw)+m.depth*Math.cos(m.yaw)};
  const start={x:corner.x+c*1.5-s*.902,y:corner.y+s*1.5+c*.902};
  const options={angle:a,halfLength:2.6,halfWidth:.9};
  const move=moveBody(start.x,start.y,c*.25+s*.1,s*.25-c*.1,options);
  assert.equal(move.touched?.type,'building');
  assert.ok(Math.abs(move.normalX+s)<1e-6&&Math.abs(move.normalY-c)<1e-6);
  assert.ok(Math.abs((move.x-start.x)*c+(move.y-start.y)*s-.25)<.001);
  assert.equal(contactAt(move.x,move.y,options),null);
});

test('a standing player can recover from a peer suddenly occupying their position',()=>{
  const options={radius:.43,colliders:[bus]};
  const start=point(2.8,.08),move=moveBody(start.x,start.y,0,0,options);
  assert.equal(move.touched?.id,bus.id);
  assert.equal(contactAt(move.x,move.y,options),null);
  const shift=Math.hypot(move.x-start.x,move.y-start.y);
  assert.ok(Math.abs(shift-(bus.halfWidth+.43-.08))<.005);
});

test('overlap recovery cannot move the player through an intervening obstacle',()=>{
  const truck={x:centre.x-.1,y:centre.y,id:'incoming',r:2.15};
  const barrier={x:centre.x+1.25,y:centre.y,id:'rail',halfLength:.09,halfWidth:2,angle:0};
  const move=moveBody(centre.x,centre.y,0,0,{radius:.43,colliders:[truck,barrier]});
  assert.equal(move.x,centre.x);
  assert.equal(move.y,centre.y);
});

test('recovering from two coincident peers clears both hitboxes in one step',()=>{
  const options={radius:.43,colliders:[{id:'peer-a',...centre,r:.43},{id:'peer-b',...centre,r:.43}]};
  const move=moveBody(centre.x,centre.y,0,0,options);
  assert.equal(contactAt(move.x,move.y,options),null);
  assert.ok(Math.hypot(move.x-centre.x,move.y-centre.y)<.865);
});
