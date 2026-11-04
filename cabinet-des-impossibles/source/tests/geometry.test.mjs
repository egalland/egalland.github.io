import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {defaults} from '../src/model.ts';
const compiled=await build({entryPoints:['src/artworks.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {createArtwork,geometryStats}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const blank={rescue:0,flight:0,salon:0,zip:0,silly:0,trophy:0,defense:0,bend:0};
const animated=Object.fromEntries(Object.keys(blank).map(k=>[k,1]));
const totals={triangles:0,meshes:0};
for(const item of defaults().objects){
 test(`${item.shape}: finite geometry at rest and with combined interactions`,()=>{
  const a=createArtwork({...item,behaviors:Object.keys(blank)});
  for(const [time,motion,still] of [[0,blank,true],[1.7,animated,false],[9.3,animated,true],[20,blank,false]]){
   a.animate(time,motion,still);a.root.updateMatrixWorld(true);
   a.root.traverse(o=>{
    if(!o.isMesh)return;
    for(const attr of ['position','normal'])assert.ok([...o.geometry.attributes[attr].array].every(Number.isFinite),`${item.shape} has invalid ${attr}`);
    o.geometry.computeBoundingSphere();assert.ok(Number.isFinite(o.geometry.boundingSphere.radius)&&o.geometry.boundingSphere.radius<5);
   });
  }
  const stats=geometryStats(a.root);assert.ok(stats.triangles>2000);assert.ok(stats.triangles<100000);assert.ok(stats.meshes<120);
  totals.triangles+=stats.triangles;totals.meshes+=stats.meshes;
  console.log(item.shape,JSON.stringify(stats));
 });
}
test('total geometry budget stays below 450k triangles and 450 draw meshes',()=>{assert.ok(totals.triangles<450000);assert.ok(totals.meshes<450);});
test('ribbon retains a stable resting shape after repeated bends',()=>{const item=defaults().objects.find(o=>o.shape==='ribbon'),a=createArtwork(item);const mesh=a.root.children.find(o=>o.isMesh);const initial=Array.from(mesh.geometry.attributes.position.array);a.animate(3,animated,false);a.animate(4,blank,true);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),initial);});
