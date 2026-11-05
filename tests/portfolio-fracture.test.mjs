import test from 'node:test';
import assert from 'node:assert/strict';
import {fractureEdge,edgeAt,arrival,projectPoint} from '../portfolio-assets/themes/fracture.mjs';
import {createShape,sampleShape} from '../portfolio-assets/themes/fusion-shapes.mjs';

test('la fracture reste irrégulière, reproductible et raccordée pour chaque largeur',()=>{
 for(const [w,h] of [[320,340],[390,460],[640,480],[1200,700]]){
  const e=fractureEdge(w,h,5);assert.deepEqual(e,fractureEdge(w,h,5));assert.equal(e[0].y,0);assert.equal(e.at(-1).y,h);
  let reversals=0;
  for(let i=1;i<e.length;i++){assert.ok(e[i].y>e[i-1].y);assert.ok(e[i].x>0&&e[i].x<w);assert.ok(Math.abs(edgeAt(e,e[i].y)-e[i].x)<1e-9);if(e[i].x>e[i-1].x)reversals++;}
  assert.ok(reversals>4);assert.notDeepEqual(e,fractureEdge(w,h,6));
 }
});
test('l’arrivée produit une seule rupture courte puis une composition stable, sans flash en mouvement réduit',()=>{
 let active=0,starts=0,previous=false;
 for(let t=0;t<30;t+=.01){const a=arrival(t);for(const value of Object.values(a))assert.ok(value>=0&&value<=1);if(a.fault>0){active++;if(!previous)starts++;}previous=a.fault>0;}
 assert.equal(starts,1);assert.ok(active<36);assert.deepEqual(arrival(4),{reveal:1,build:1,objects:1,fault:0});assert.deepEqual(arrival(0,true),arrival(4));
});
test('les onze objets ont une géométrie unique, échantillonnée sur leurs vrais segments',()=>{
 for(const kind of ['hero','market','kikalmo','maison','body','book','redim','atlas','timer','biscuit','calendar']){
  const shape=createShape(kind),points=sampleShape(shape);assert.ok(points.length>100);assert.ok(points.length<12000,kind+': '+points.length);
  for(const point of points){assert.ok(point.p.every(Number.isFinite));const path=shape.paths[point.path];assert.equal(point.color,path.color);assert.equal(point.group,path.group);}
  const model=shape.paths[0].vertices[0],p=projectPoint(model,{cx:300,cy:200,scale:100,yaw:.2,pitch:.1});assert.ok(p.every(Number.isFinite));
  assert.deepEqual(points[0].p,model);
 }
});
