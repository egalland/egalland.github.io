import test from 'node:test';
import assert from 'node:assert/strict';
import {orbit,wave,arrivalScatter} from '../portfolio-assets/themes/kinetics.mjs';
import {createCloud,projectParticle} from '../portfolio-assets/themes/point-cloud.mjs';

const view={cx:0,cy:0,scale:100,yaw:0,pitch:0};
const point=(x,y,z)=>({x,y,z,c:[.3,.5,.8]});
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('une aiguille tourne autour de son propre centre et la page revient sur sa reliure',()=>{
 const hand=point(.7,.2,0),center=[.2,.2,0];
 orbit(hand,center,[0,0,1],1);
 const cloud=createCloud([hand]);
 const quarter=projectParticle(cloud,0,view,Math.PI/2);
 assert.ok(distance(quarter.slice(0,2),[20,-70])<2.5);
 const still=projectParticle(cloud,0,view,0,true);
 assert.deepEqual(still,projectParticle(cloud,0,{...view,scatter:1},20,true));

 const leaf=point(1,0,0);
 orbit(leaf,[0,0,0],[0,-1,0],1,Math.PI);
 const book=createCloud([leaf]);
 assert.ok(projectParticle(book,0,view,Math.PI/2)[2]>.97);
 assert.ok(projectParticle(book,0,view,Math.PI)[0]<-97);
 assert.ok(projectParticle(book,0,view,Math.PI*2)[0]>97);
});

test('le morphing part de la pose visible, y compris la vague et les points en circulation',()=>{
 const source=point(.3,.2,.1);
 source.track={a:[0,0,0],b:[1,0,0],speed:.21};source.phase=.3;
 wave(source,[0,.42,.3],1.2,.8);
 const time=2.6,oldCloud=createCloud([source]),target=[point(-1.4,1.2,.8)];
 const moving=projectParticle(oldCloud,0,view,time);
 const next=createCloud(target,{from:[source],fromTime:time});
 assert.ok(distance(moving,projectParticle(next,0,{...view,blend:0},time))<.0001);
 assert.ok(distance(moving,projectParticle(next,0,{...view,blend:1},time))>60);
});

test('le rassemblement attend une entrée visible et ne repart pas quand on remonte',()=>{
 const slot={};
 assert.equal(arrivalScatter(slot,4,.04,false),1);
 assert.equal(slot.enteredAt,undefined);
 assert.equal(arrivalScatter(slot,12,.42,false),1);
 const mid=arrivalScatter(slot,12.65,.80,false);
 assert.ok(mid>.4&&mid<.65);
 assert.equal(arrivalScatter(slot,16,.03,false),0);
 assert.equal(arrivalScatter(slot,19,.9,false),0);
 assert.equal(arrivalScatter({},0,.9,true),0);
});
