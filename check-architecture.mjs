import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {ARCHITECTURE,createLandmark,collectFaces} from './src/landmarks.js';
for(const [id,a] of Object.entries(ARCHITECTURE)){
 const model=createLandmark(id,'lotr');assert(model,id);let triangles=0;model.traverseVisible(o=>{if(!o.isMesh)return;assert.equal(o.userData.landmarkId,id);const p=o.geometry.attributes.position;for(const v of p.array)assert(Number.isFinite(v),`${id}: non-finite position`);triangles+=(o.geometry.index?.count||p.count)/3});
 const b=new THREE.Box3().setFromObject(model);const s=b.getSize(new THREE.Vector3());assert(s.x>8&&s.y>10&&s.z>8,`${id}: invalid dimensions`);assert(triangles<65000,`${id}: too many triangles`);
 const faces=collectFaces(model);assert(faces.length>100);assert(faces.every(f=>f.v.every(Number.isFinite)));console.log(`${id}: ${Math.round(triangles)} triangles`);
}
const ruins=createLandmark('OstInEdhil','lotr'),intact=createLandmark('OstInEdhil','second');assert(new THREE.Box3().setFromObject(ruins).getSize(new THREE.Vector3()).y<new THREE.Box3().setFromObject(intact).getSize(new THREE.Vector3()).y);
for(const n of [1,2,3]){const data=JSON.parse(readFileSync(`dist/assets/scatter-${n}.json`,'utf8'));assert(data.trees.length>10);for(const p of [...data.trees,...data.rocks])assert(p.every(Number.isFinite));}
console.log('✓ Architecture geometry, era-specific ruins and geographic scenery validated.');
