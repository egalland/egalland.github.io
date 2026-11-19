import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Vector3} from '../public/three.js';
import {getKikalmoLook} from '../public/kikalmo-avatar.js';
import {createKikalmoModel} from '../public/kikalmo-model.js';

const require=createRequire(import.meta.url),paths=[process.cwd(),process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES].filter(Boolean);
const native=require(require.resolve('@napi-rs/canvas',{paths})),sharp=require(require.resolve('sharp',{paths}));

// Rasterize the triangle coverage at an exact side view. Portrait cells that are
// transparent at the sampled UV leave the underlying textile visible as in WebGL.
function sidePixels(surface){
  const width=92,height=160,scale=83,z=new Float32Array(width*height).fill(-Infinity),kind=new Int8Array(width*height).fill(-1);
  const geo=surface.geometry,p=geo.attributes.position,uv=geo.attributes.uv,indices=geo.index.array;
  const textures=surface.material.slice(0,2).map(({map})=>{const c=map.image;return {w:c.width,h:c.height,rgba:c.getContext('2d').getImageData(0,0,c.width,c.height).data};});
  for(const group of geo.groups){
    const id=group.materialIndex;
    for(let i=group.start;i<group.start+group.count;i+=3){
      const points=[indices[i],indices[i+1],indices[i+2]].map(n=>[width/2+p.getX(n)*scale,height-4-p.getY(n)*scale,p.getZ(n),uv.getX(n),uv.getY(n)]);
      const [a,b,c]=points,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.0001)continue;
      const bounds=(axis,limit)=>[Math.max(0,Math.floor(Math.min(...points.map(pt=>pt[axis])))),Math.min(limit-1,Math.ceil(Math.max(...points.map(pt=>pt[axis]))))];
      const [x0,x1]=bounds(0,width),[y0,y1]=bounds(1,height);
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        const px=x+.5-c[0],py=y+.5-c[1],s=((b[1]-c[1])*px+(c[0]-b[0])*py)/den,t=((c[1]-a[1])*px+(a[0]-c[0])*py)/den,r=1-s-t;
        if(Math.min(s,t,r)<0)continue;
        const at=j=>a[j]*s+b[j]*t+c[j]*r,d=at(2),k=y*width+x;if(d<=z[k])continue;
        if(id<2){
          const {w,h,rgba}=textures[id],u=Math.min(w-1,Math.max(0,Math.floor(at(3)*w))),v=Math.min(h-1,Math.max(0,Math.floor((1-at(4))*h)));
          if(rgba[(v*w+u)*4+3]<51)continue;
        }
        z[k]=d;kind[k]=id;
      }
    }
  }
  return {width,height,kind};
}
test('the Kikalmo profile closes with opaque dyed knits bound to the existing costume skeleton',async t=>{
  const previous={document:globalThis.document,Image:globalThis.Image};
  const set=Object.getOwnPropertyDescriptor(native.Image.prototype,'src').set;
  globalThis.document={createElement:()=>native.createCanvas(224,224)};
  globalThis.Image=class extends native.Image{set src(url){
    if(url.startsWith('file:'))return set.call(this,readFileSync(fileURLToPath(url)));
    if(url.startsWith('data:image/svg')){sharp(Buffer.from(decodeURIComponent(url.slice(url.indexOf(',')+1)))).png().toBuffer().then(b=>set.call(this,b)).catch(e=>this.onerror(e));return;}
    set.call(this,url);
  }};
  t.after(()=>{for(const [k,v] of Object.entries(previous))if(v===undefined)delete globalThis[k];else globalThis[k]=v;});
  for(const appearance of [{shape:2,costume:90},{shape:4,headwear:210,adornment:221,premiumHair:34}]){
    assert.ok(await getKikalmoLook(appearance).promise);
    const person=createKikalmoModel(appearance),actor={appearance,id:'profile',angle:0};
    person.update(actor,.016,0);person.group.updateMatrixWorld(true);
    const surface=person.group.children.find(o=>o.isSkinnedMesh),seam=surface.geometry.groups[2];
    const material=surface.material[seam.materialIndex];
    assert.ok(material.vertexColors&&material.alphaTest===0);
    const {width,height,kind}=sidePixels(surface);
    let textile=0,covered=0,wideRows=0;
    for(let y=0;y<height;y++){
      let first=width,last=-1;
      for(let x=0;x<width;x++)if(kind[y*width+x]>=0){covered++;if(kind[y*width+x]===2)textile++;first=Math.min(first,x);last=x;}
      if(last-first>=20)wideRows++;
    }
    assert.ok(textile>covered*.12&&wideRows>50,'visible knitted profile with broad volume');
    const p=surface.geometry.index.array[seam.start+1],a=surface.getVertexPosition(p,new Vector3());
    person.update({...actor,motion:'climb',motionPhase:.48},.016,.32);person.group.updateMatrixWorld(true);
    assert.ok(a.distanceTo(surface.getVertexPosition(p,new Vector3()))>.005,'knitted rim moves with its joint');
    t.diagnostic('Side-on textile: '+textile+' of '+covered+' visible pixels, '+wideRows+' rows wider than 20 px');
    person.dispose();
  }
});
