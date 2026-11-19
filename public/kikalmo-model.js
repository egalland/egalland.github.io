import {puppetKnit} from './puppet-material.js';
import {motionSeed,sampleLocomotion,linkedPose,kikalmoAnchors as anchors} from './locomotion-pose.js';
import * as THREE from './three.js';
import {appearanceKey,getKikalmoLook,kikalmoFrame,zones} from './kikalmo-avatar.js';
import {kikalmoShell,costumeThreads} from './kikalmo-shell.js';

const built=new WeakMap(),inactive=new Map();
const shape=new THREE.SphereGeometry(1,12,9);
const colors=new Map(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const joints=['hips','chest','head','leftShoulder','rightShoulder','leftHip','rightHip'];
function material(color){
  if(!colors.has(color))colors.set(color,new THREE.MeshLambertMaterial({color,map:puppetKnit()}));
  return colors.get(color);
}
// A small repeat knitted in both directions around the stuffed perimeter. Its
// colour comes from the actual garment at that edge, independent of portrait UVs.
let clothTexture;
function knitTexture(){
  if(clothTexture)return clothTexture;
  const size=32,bytes=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=(x+.5)/size,v=(y+.5)/size;
    const stitch=.5+.43*Math.cos(Math.PI*v);
    const d=Math.min(Math.abs(u-stitch),Math.abs(1-u-stitch));
    const twist=Math.cos(2*Math.PI*(u*6-v*3))*.016;
    const shade=Math.round(255*(.77+.19*Math.exp(-48*d*d)+twist));
    const i=(y*size+x)*4;bytes.set([shade,shade,shade,255],i);
  }
  clothTexture=new THREE.DataTexture(bytes,size,size);
  clothTexture.wrapS=clothTexture.wrapT=THREE.RepeatWrapping;
  clothTexture.magFilter=THREE.LinearFilter;clothTexture.minFilter=THREE.LinearMipmapLinearFilter;
  clothTexture.generateMipmaps=true;clothTexture.needsUpdate=true;return clothTexture;
}
function geometry(art){
  if(built.has(art))return built.get(art);
  const s=kikalmoShell(art),{w,h,depth,dims,pixels,material:tags}=s;
  const rows=50,cols=Math.max(19,Math.min(64,Math.round(rows*w/h))),offset=(cols+1)*(rows+1);
  const pos=[],uv=[],si=[],sw=[],front=[],back=[],seam=[],cells=new Uint8Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const x=Math.min(w-1,Math.floor((i+.5)*w/cols)),y=Math.min(h-1,Math.floor((j+.5)*h/rows));
    const near=Math.max(1,Math.round(w/cols/2)),check=(dx,dy)=>pixels[(clamp(y+dy,0,h-1)*w+clamp(x+dx,0,w-1))*4+3];
    cells[j*cols+i]=Math.max(check(0,0),check(-near,-near),check(near,near),check(near,-near),check(-near,near))>28;
  }
  const isCostume=!!art.appearance.costume;
  for(const side of [1,-1])for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=i/cols,v=j/rows,idx=Math.round(v*(h-1))*w+Math.round(u*(w-1));
    const lateral=(.5-u)*dims.width,up=dims.bottom+(1-v)*dims.height,role=tags[idx];
    pos.push(side*depth[idx]*(side===1?1:.83),up,lateral);uv.push(u,1-v);
    let bone=up>1.1?2:1,next=bone,t=0;
    if(up<.82){bone=0;next=1;t=clamp((up-.47)/.35);}
    else if(up<1.25){bone=1;next=2;t=clamp((up-.95)/.30);}
    if(role===zones.headwear||role===zones.hair||role===zones.facewear||role===zones.feature||role===zones.nose){bone=next=2;t=0;}
    if(isCostume&&up<.55){bone=0;next=lateral<0?5:6;t=clamp((.57-up)/.36);}
    else if(isCostume&&up<1.19&&up>.50&&Math.abs(lateral)>.23){bone=1;next=lateral<0?3:4;t=clamp((Math.abs(lateral)-.23)*3.8);}
    si.push(bone,next,0,0);sw.push(1-t,t,0,0);
  }
  const edges=[],widthAt=new Map(),vertexColors=new Array(2*offset*3).fill(1);
  function edge(a,b,di,dj){
    // Follow the exterior of each occupied cell, including holes between limbs.
    // Read slightly inside the cutout so a transparent border never erases the side.
    const i=a%(cols+1),j=Math.floor(a/(cols+1)),k=b%(cols+1),l=Math.floor(b/(cols+1));
    const x=(i+k)*.5*w/cols,y=(j+l)*.5*h/rows;
    const channels=[0,0,0];let samples=0,relief=.018;
    for(const inset of [.28,.62,1,1.6]){
      for(const across of [-.26,0,.26]){
        const sx=clamp(Math.floor(x+(di*inset+dj*across)*w/cols),0,w-1);
        const sy=clamp(Math.floor(y+(dj*inset+di*across)*h/rows),0,h-1);
        const idx=sy*w+sx,px=idx*4;if(pixels[px+3]<125)continue;
        samples++;for(let ch=0;ch<3;ch++)channels[ch]+=pixels[px+ch];
        relief=Math.max(relief,depth[idx]);
      }
    }
    // Broad pieces have a padded seam. Fine embroidery keeps a narrower rim.
    const half=clamp(relief*.70,.026,.15);
    for(const index of [a,b])widthAt.set(index,Math.max(half,widthAt.get(index)||0));
    const rgb=samples?channels.map(v=>v/(samples*255)):[.41,.32,.37];
    const dye=new THREE.Color().setRGB(...rgb,THREE.SRGBColorSpace);
    edges.push({a,b,di,dj,dye});
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const k=j*cols+i;if(!cells[k])continue;
    const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
    front.push(a,c,b,b,c,d);back.push(a+offset,b+offset,c+offset,b+offset,d+offset,c+offset);
    if(!i||!cells[k-1])edge(a,c,1,0);if(i===cols-1||!cells[k+1])edge(d,b,-1,0);
    if(!j||!cells[k-cols])edge(b,a,0,1);if(j===rows-1||!cells[k+cols])edge(c,d,0,-1);
  }
  for(const [i,half] of widthAt){
    pos[i*3]=Math.max(pos[i*3],half);
    pos[(i+offset)*3]=Math.min(pos[(i+offset)*3],-half*.83);
  }
  // Three rings join the skinned front and rear. The middle ring forms a soft
  // bead, with a common outward direction at each corner to keep the hull closed.
  const outward=new Map();
  for(const {a,b,di,dj} of edges)for(const i of [a,b]){
    const v=outward.get(i)||[0,0];v[0]+=di;v[1]+=dj;outward.set(i,v);
  }
  for(const {a,b,di,dye} of edges){
    const start=pos.length/3;
    for(const ring of [0,1,2])for(const i of [a,b]){
      const [dz,dy]=outward.get(i),len=Math.hypot(dz,dy)||1;
      const round=ring===1 ? .012/len : 0;
      const x=ring===0?pos[i*3]:ring===2?pos[(i+offset)*3]:.002;
      const y=pos[i*3+1]+dy*round,z=pos[i*3+2]+dz*round;
      pos.push(x,y,z);uv.push(x/.059,(di?y:z)/.062);
      vertexColors.push(dye.r,dye.g,dye.b);
      si.push(...si.slice(i*4,i*4+4));sw.push(...sw.slice(i*4,i*4+4));
    }
    for(let v=start;v<start+4;v+=2)seam.push(v,v+3,v+1,v,v+2,v+3);
  }
  const mesh=new THREE.BufferGeometry();
  mesh.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));mesh.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  mesh.setAttribute('color',new THREE.Float32BufferAttribute(vertexColors,3));
  mesh.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));mesh.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  mesh.setIndex([...front,...back,...seam]);mesh.addGroup(0,front.length,0);mesh.addGroup(front.length,back.length,1);mesh.addGroup(front.length+back.length,seam.length,2);
  mesh.computeVertexNormals();mesh.computeBoundingSphere();
  const mats=[art.front,art.rear].map(p=>{
    const tex=new THREE.CanvasTexture(p);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
    return new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,alphaTest:.20,emissive:'#443e39',emissiveIntensity:.20});
  });
  mats.push(new THREE.MeshLambertMaterial({map:knitTexture(),vertexColors:true,side:THREE.DoubleSide,emissive:'#332831',emissiveIntensity:.12}));
  let entry={mesh,mats,refs:0};built.set(art,entry);return entry;
}
const tmp=new THREE.Vector3(),delta=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
function sphere(parent,color,rx,ry,rz){
  const o=new THREE.Mesh(shape,material(color));o.scale.set(rx,ry,rz);parent.add(o);return o;
}
function stick(mesh,a,b,r){
  delta.subVectors(b,a);mesh.position.copy(a).addScaledVector(delta,.5);
  mesh.scale.set(r,Math.max(.01,delta.length()*.55),r);mesh.quaternion.setFromUnitVectors(Y,delta.normalize());
}
export function createKikalmoModel(value,seed=0){
  const a=JSON.parse(appearanceKey(value));
  const group=new THREE.Group(),bones=anchors.map(anchor=>{const b=new THREE.Bone();b.position.set(...anchor);group.add(b);return b;});
  group.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);skeleton.calculateInverses();
  const limb=new THREE.Group();group.add(limb);
  const shirts=['#a17176','#768a6a','#745e77','#445d76','#ad7048','#917b63'],arms=[],legs=[];
  for(let i=0;i<2;i++){
    arms.push([sphere(limb,shirts[a.outfit]||shirts[0],1,1,1),sphere(limb,a.color,1,1,1),sphere(limb,a.color,.093,.10,.088)]);
    legs.push([sphere(limb,'#51495a',1,1,1),sphere(limb,'#51495a',1,1,1),sphere(limb,'#503f43',.133,.070,.083)]);
  }
  limb.visible=!a.costume;
  const p=new THREE.Vector3(),q=new THREE.Vector3(),r=new THREE.Vector3();
  let styleSeed=motionSeed(seed),lastId;
  let active=null,entry=null,surface=null;
  function setSurface(art){
    if(art===active)return;
    if(surface){group.remove(surface);release();}
    active=art;entry=geometry(art);
    if(a.costume){
      const {sleeve,boot}=costumeThreads(art);
      for(const [upper,lower,palm] of arms){upper.material=lower.material=material(sleeve);palm.material=material('#efcfaa');}
      for(const leg of legs)for(const part of leg)part.material=material(boot);
    }
    inactive.delete(art);entry.refs++;surface=new THREE.SkinnedMesh(entry.mesh,entry.mats);
    surface.frustumCulled=false;surface.bind(skeleton,new THREE.Matrix4());group.add(surface);
  }
  function release(){
    if(!entry||--entry.refs>0)return;
    inactive.set(active,entry);
    if(inactive.size<=12)return;
    const [key,old]=inactive.entries().next().value;inactive.delete(key);built.delete(key);
    old.mesh.dispose();for(const m of old.mats){if(m.map!==clothTexture)m.map.dispose();m.dispose();}
  }
  function update(e,dt=.016,t=0){
    if(e.id!==lastId){lastId=e.id;styleSeed=motionSeed(lastId??seed);}
    const pose=e.pose||e,gait=sampleLocomotion(pose,t,styleSeed),rig=linkedPose(pose,gait,t);
    const art=getKikalmoLook(a,kikalmoFrame(a,t))?.art||getKikalmoLook(a,0)?.art;if(art)setSurface(art);
    const rag=e.ragdoll||pose.ragdoll,blend=clamp(rag?.blend||0);
    for(let i=0;i<bones.length;i++){
      const b=bones[i];b.position.fromArray(rig.anchors[i]);
      let rz=-gait.lean*(i===2?.63:1),rx=gait.roll,ry=i===2?-gait.turn*.12+gait.twist*.4:gait.twist*(i===0?.18:1);
      if(i===3||i===4){
        const side=i-3,leg=side?gait.right:gait.left;
        rz=rig.shoulders[side];rx=(side?-1:1)*leg.splay;
      }else if(i>=5){rz=rig.hips[i-5];rx=0;}
      b.rotation.set(rx,ry,rz);
      const squash=i<3?gait.squash*(1-blend):0;
      b.scale.set(1-.5*squash,1+squash,1-.5*squash);
      const joint=rag?.[joints[i]]||(i===5||i===6?rag?.hips:null);
      if(joint&&blend){tmp.fromArray(joint);b.position.lerp(tmp,blend);b.quaternion.slerp(identity,blend);}
    }
    // A one-piece costume supplies its resting hands and boots in the cloth itself.
    // Its striking hand or foot emerges from the sleeve only during the swing.
    limb.visible=!a.costume||(!blend&&(!!gait.handSide||!!gait.footSide));
    if(limb.visible){
      for(const side of [0,1]){
        const name=side?'right':'left',arm=arms[side],leg=legs[side];
        if(a.costume){
          for(const part of arm)part.visible=gait.handSide===(side?1:-1);
          for(const part of leg)part.visible=gait.footSide===(side?1:-1);
        }
        p.copy(bones[3+side].position);q.fromArray(rig.arms[side][1]);r.fromArray(rig.arms[side][2]);
        if(blend){if(rag[name+'Elbow'])q.lerp(tmp.fromArray(rag[name+'Elbow']),blend);if(rag[name+'Hand'])r.lerp(tmp.fromArray(rag[name+'Hand']),blend);}
        stick(arm[0],p,q,.068);stick(arm[1],q,r,.055);arm[2].position.copy(r);
        p.copy(bones[5+side].position);q.fromArray(rig.legs[side][1]);r.fromArray(rig.legs[side][2]);
        if(blend){if(rag[name+'Knee'])q.lerp(tmp.fromArray(rag[name+'Knee']),blend);if(rag[name+'Foot'])r.lerp(tmp.fromArray(rag[name+'Foot']),blend);}
        stick(leg[0],p,q,.075);stick(leg[1],q,r,.064);leg[2].position.copy(r);leg[2].position.x+=.045;
      }
    }
  }
  return {group,update,dispose(){release();skeleton.dispose();group.removeFromParent();}};
}
const identity=new THREE.Quaternion();
