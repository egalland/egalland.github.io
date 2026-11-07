import test from 'node:test';
import assert from 'node:assert/strict';
import {scatteredPose,placementPose} from '../portfolio-assets/themes/choreography.mjs';

test('les blocs alternent leur inclinaison et limitent leur déplacement sur mobile',()=>{
 for(let i=0;i<100;i++){
  const desktop=scatteredPose(i,1440),mobile=scatteredPose(i,390);
  assert.ok(desktop.angle*scatteredPose(i+1,1440).angle<0);
  assert.ok(Math.abs(mobile.angle)<=6);assert.ok(Math.abs(mobile.x)<=31);
  assert.ok(Math.abs(mobile.angle)<Math.abs(desktop.angle));
 }
});
test('la correction contre-braque puis termine exactement au repos, sans saut',()=>{
 const source=scatteredPose(7,1440);
 assert.deepEqual(placementPose(source,0),source);
 assert.ok(placementPose(source,.32).angle*source.angle<0);
 assert.deepEqual(placementPose(source,1),{x:0,y:0,angle:0});
 assert.deepEqual(placementPose(source,2),{x:0,y:0,angle:0});
 let previous=placementPose(source,0);
 for(let p=.001;p<=1;p+=.001){
  const current=placementPose(source,p);
  for(const key of ['x','y','angle']){assert.ok(Number.isFinite(current[key]));assert.ok(Math.abs(current[key]-previous[key])<1);}
  previous=current;
 }
});
