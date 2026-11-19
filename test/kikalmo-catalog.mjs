// Run with node test/kikalmo-catalog.mjs. Verifies every slot, authentic sheet, and integrated mask.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {appearanceSchema,normalizeAppearance} from '../public/kikalmo-schema.js';
import {equipment,buildKikalmoArt} from '../public/kikalmo-art.js';
import {sources,pages} from '../public/kikalmo-atlas.js';

const allIds=Object.values(appearanceSchema).flat().sort((a,b)=>a-b);
assert.deepEqual(allIds,Object.keys(equipment).map(Number).sort((a,b)=>a-b));
assert.equal(allIds.length,191);
for(const [i,page] of pages.entries()){
  const file=readFileSync(new URL('../public/'+page,import.meta.url));
  assert.equal(file.subarray(8,12).toString(),'WEBP',page);
  const dims=file.subarray(12,16).toString()==='VP8X'?[file.readUIntLE(24,3)+1,file.readUIntLE(27,3)+1]:
    [file.readUInt16LE(26)&16383,file.readUInt16LE(28)&16383];
  for(const [path,[index,x,y,w,h]] of Object.entries(sources))if(index===i){
    assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=dims[0]&&y+h<=dims[1],path+' is inside its atlas');
  }
}
let count=0;const ref=new Set(),hashes=new Map();
function inspect(raw,pose=0){
  const a=normalizeAppearance({shape:0,...raw});
  const nodes=buildKikalmoArt(a,pose),signature=[];
  function walk(node){
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){node.forEach(walk);return;}
    const {href,style,viewBox,transform,x,y,width,height}=node.props;
    if(href){const path=href.split('?')[0];assert.ok(sources[path],JSON.stringify([a,pose,path]));ref.add(path);}
    signature.push([node.type,style,href,viewBox,transform,x,y,width,height,node.props.fill,node.props.values,node.props.tableValues]);
    node.children.forEach(walk);
  }
  walk(nodes);count++;return createHash('sha256').update(JSON.stringify(signature)).digest('hex');
}
for(const [id,[slot]] of Object.entries(equipment)){
  assert.ok(appearanceSchema[slot].includes(+id));
  hashes.set(+id,inspect({[slot]:+id}));
}
for(let shape=0;shape<6;shape++)for(let i=0;i<8;i++)inspect({shape,hair:i,outfit:i%6,eyes:i%6,nose:i%7,mouth:i%6,accessory:i%7});
for(const costume of appearanceSchema.costume)for(const facewear of appearanceSchema.facewear)inspect({costume,facewear,adornment:223});
for(const costume of [90,91,92,93,162,163,164,233,234]){
  const frames=new Set();for(let i=0;i<8;i++)frames.add(inspect({costume},i));
  assert.ok(frames.size>1,'original animated frames for '+costume);
}
assert.equal(hashes.get(17),hashes.get(64));
assert.equal(hashes.get(13),hashes.get(71));
assert.ok(new Set(hashes.values()).size>=188);
console.log('Kikalmo',allIds.length,'items,',count,'valid equipment/pose combinations,',ref.size,'original sheets,',pages.length,'atlas pages');
