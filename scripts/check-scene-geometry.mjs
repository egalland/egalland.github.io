import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { MarketScene } from '../dist/market-scene.mjs';
import { normalizeKlines,simulate } from '../dist/engine.mjs';
import { createSceneData } from '../dist/scene-data.mjs';

const snapshot=JSON.parse(fs.readFileSync(new URL('../dist/snapshot.json',import.meta.url)));
const data=normalizeKlines(snapshot.markets.BTCUSDT['1h']);
const forecast=simulate(data,{horizon:48,interval:'1h'});
let geometries=0,frames=0;
for(const type of ['candle','line'])for(const viewport of [{width:800,height:500},{width:350,height:440}]){
  const scene=Object.create(MarketScene.prototype);
  scene.options={type,view:'spatial',band:true,animate:false};
  scene.dataGroup=new THREE.Group();scene.projectionGroup=new THREE.Group();scene.volumeGroup=new THREE.Group();scene.environment=new THREE.Group();
  scene.labelRoot={replaceChildren(){}};scene.labels=[];scene.addLabel=(text,point,cls)=>scene.labels.push({text,point,cls});
  scene.hideProbe=()=>{};scene.invalidate=()=>{};scene.canvas={dataset:{}};scene.input={prefs:{interval:'1h'}};
  scene.worldWidth=Math.min(30,Math.max(15,24*viewport.width/viewport.height));
  const model=createSceneData(data,forecast,120,true,scene.worldWidth);scene.rebuild(model);
  for(const group of [scene.dataGroup,scene.volumeGroup,scene.projectionGroup])group.traverse(object=>{
    if(!object.geometry)return;geometries++;
    for(const [key,attribute] of Object.entries(object.geometry.attributes)){
      if(key==='position'&&object===scene.flow)continue; // initialized in the first render
      assert([...attribute.array].every(Number.isFinite),`${type}: finite ${key}`);
    }
    if(object.isInstancedMesh){assert([...object.instanceMatrix.array].every(Number.isFinite));object.computeBoundingBox();assert(!object.boundingBox.isEmpty());}
  });
  assert.equal(scene.volumeGroup.children[0].count,120);
  if(type==='candle')assert.equal(scene.candleMesh.count,120);
  for(const view of ['spatial','front','volume']){
    scene.camera=new THREE.PerspectiveCamera(36,viewport.width/viewport.height,.1,180);
    const pose=scene.cameraPosition(view);scene.camera.position.copy(pose.position);scene.camera.lookAt(pose.target);scene.camera.updateMatrixWorld();
    const points=[...model.candles.flatMap(p=>[new THREE.Vector3(p.x,p.high,.2),new THREE.Vector3(p.x,p.low,.2)]),...model.future.flatMap(p=>[new THREE.Vector3(p.x,p.low,0),new THREE.Vector3(p.x,p.high,0)])];
    for(const p of points){p.project(scene.camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>-1&&p.z<1,`${view}: data inside viewport ${viewport.width}`);}
    frames++;
  }
}
console.log(JSON.stringify({passed:true,geometriesChecked:geometries,cameraFramesChecked:frames,checks:['valid scene geometry','finite normals and transforms','instanced candle and volume counts','desktop and portrait camera framing']}));
