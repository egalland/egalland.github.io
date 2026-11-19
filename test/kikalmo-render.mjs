// Optional raster/mesh QA: npm packages sharp and @napi-rs/canvas, or CODEX_PRIMARY_RUNTIME_NODE_MODULES.
// No network access is needed. The shim rasterizes our production self-contained SVGs with librsvg.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {equipment} from '../public/kikalmo-art.js';
import {getKikalmoLook,drawKikalmoPortrait} from '../public/kikalmo-avatar.js';
import {kikalmoShell} from '../public/kikalmo-shell.js';
import {drawKikalmoPuppet} from '../public/kikalmo-canvas.js';
import {createKikalmoModel} from '../public/kikalmo-model.js';
import * as THREE from '../public/three.js';

const req=createRequire(import.meta.url);
const paths=[process.cwd(),...(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]:[])];
const sharp=req(req.resolve('sharp',{paths})),native=req(req.resolve('@napi-rs/canvas',{paths}));
globalThis.document={createElement:()=>native.createCanvas(224,224)};
const src=Object.getOwnPropertyDescriptor(native.Image.prototype,'src').set;
globalThis.Image=class extends native.Image{
  set src(value){
    if(value.startsWith('file:'))return src.call(this,readFileSync(fileURLToPath(value)));
    if(value.startsWith('data:image/svg')){
      const svg=decodeURIComponent(value.slice(value.indexOf(',')+1));
      sharp(Buffer.from(svg)).png().toBuffer().then(bytes=>src.call(this,bytes)).catch(e=>this.onerror(e));return;
    }
    src.call(this,value);
  }
};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function square(surface){
  const c=native.createCanvas(100,100),g=c.getContext('2d');g.drawImage(surface,0,0,100,100);
  return g.getImageData(0,0,100,100).data;
}
function changed(a,b){let n=0;for(let i=0;i<a.length;i+=4)if(Math.max(...[0,1,2,3].map(j=>Math.abs(a[i+j]-b[i+j])))>=8)n++;return n;}
const profiles=[[0,{shape:0}],...Object.entries(equipment).map(([id,[slot]])=>[+id,{shape:0,[slot]:+id}])];
const textures=new Map(),geometry=new Set(),aliases=[],samples=new Map();
for(let i=0;i<profiles.length;i+=3){
  const batch=profiles.slice(i,i+3);
  await Promise.all(batch.map(async([id,a])=>{
    const art=await getKikalmoLook(a).promise;assert.ok(art,'original portrait '+id);
    const pixels=square(art.front),hash=digest(pixels);
    if(textures.has(hash))aliases.push([textures.get(hash),id].sort((a,b)=>a-b));else textures.set(hash,id);
    assert.ok(pixels.some((x,i)=>i%4===3&&x>225),'visible portrait '+id);
    const shell=kikalmoShell(art);geometry.add(digest(Buffer.from(shell.depth.buffer)));
    if([0,1,2,90,163,164,233].includes(id))samples.set(id,pixels);
  }));
}
assert.deepEqual(aliases.sort((a,b)=>a[0]-b[0]),[[13,71],[17,64]]);
assert.ok(geometry.size>98);
const differences={beretColors:changed(samples.get(1),samples.get(2)),ultimateCostumes:changed(samples.get(163),samples.get(164))};
assert.ok(differences.beretColors>120);assert.ok(differences.ultimateCostumes>1000);

const testLooks=[{shape:0},{shape:4,headwear:210,adornment:221,premiumHair:34},{shape:2,costume:90},{shape:3,costume:162,facewear:95}];
const volumes=new Set();
for(const appearance of testLooks){
  const art=await getKikalmoLook(appearance).promise;
  const model=createKikalmoModel(appearance,7);
  model.update({appearance,speed:2.5},.016,0);model.group.updateMatrixWorld(true);
  const obj=model.group.children.find(o=>o.isSkinnedMesh);assert.ok(obj,'skinned 3D geometry');
  assert.equal(obj.skeleton.bones.length,7);const v=obj.geometry.getAttribute('position');assert.ok(v.count>900);
  const box=new THREE.Box3().setFromBufferAttribute(v);assert.ok(box.max.x-box.min.x>.3);
  const initial=model.group.children[2].position.clone();
  model.update({appearance,ragdoll:{blend:1,head:[.7,.26,0],hips:[0,.20,0],chest:[.44,.24,0]}},.016,0);
  assert.ok(initial.distanceTo(model.group.children[2].position)>.8);
  volumes.add(digest(Buffer.from(v.array.buffer)));model.dispose();
  const views=new Set();for(const a of [0,Math.PI/2,Math.PI]){
    const c=native.createCanvas(224,224),g=c.getContext('2d');
    drawKikalmoPuppet(g,{appearance,speed:1.4},112,212,189,0,a);const d=square(c);
    assert.ok(d.some((x,i)=>i%4===3&&x>230));views.add(digest(d));
  }
  assert.equal(views.size,3,'front, back and side of '+JSON.stringify(appearance));
  function frame(motion,motionPhase){
    const c=native.createCanvas(180,200);
    drawKikalmoPuppet(c.getContext('2d'),{appearance,id:'pose',motion,motionPhase,walk:1,speed:0},90,195,174,.1,.9);
    return square(c);
  }
  const idle=frame('idle',0),reach=frame('climb',.25),pull=frame('climb',.66);
  assert.ok(changed(idle,reach)>190&&changed(reach,pull)>190,'linked silhouette reaches and pulls '+JSON.stringify(appearance));
  assert.ok(art.tag.width>30);
}
assert.equal(volumes.size,testLooks.length);
const portrait=native.createCanvas(100,120);assert.ok(await drawKikalmoPortrait(portrait,testLooks[1]));
console.log(JSON.stringify({renderedProfiles:profiles.length,distinctFronts:textures.size,distinctReliefMaps:geometry.size,originalAliases:aliases,pixelsChangedOf10000:differences,skinnedModels:volumes.size,canvasAngles:3}));
