import * as THREE from './three.js';
import {appearanceKey,getKikalmoLook,kikalmoFrame,zones} from './kikalmo-avatar.js';
import {kikalmoShell} from './kikalmo-shell.js';

const built=new WeakMap(),inactive=new Map();
const shape=new THREE.SphereGeometry(1,12,9);
const colors=new Map(),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const joints=['hips','chest','head','leftShoulder','rightShoulder','leftHip','rightHip'];
const anchors=[[0,.46,0],[0,.83,0],[0,1.1,0],[0,.86,-.26],[0,.86,.26],[0,.44,-.14],[0,.44,.14]];
function material(color){
  if(!colors.has(color))colors.set(color,new THREE.MeshLambertMaterial({color}));
  return colors.get(color);
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
  function edge(a,b){seam.push(a,b,b+offset,a,b+offset,a+offset);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const k=j*cols+i;if(!cells[k])continue;
    const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
    front.push(a,c,b,b,c,d);back.push(a+offset,b+offset,c+offset,b+offset,d+offset,c+offset);
    if(!i||!cells[k-1])edge(a,c);if(i===cols-1||!cells[k+1])edge(d,b);
    if(!j||!cells[k-cols])edge(b,a);if(j===rows-1||!cells[k+cols])edge(c,d);
  }
  const mesh=new THREE.BufferGeometry();
  mesh.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));mesh.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  mesh.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));mesh.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));
  mesh.setIndex([...front,...back,...seam]);mesh.addGroup(0,front.length,0);mesh.addGroup(front.length,back.length,1);mesh.addGroup(front.length+back.length,seam.length,1);
  mesh.computeVertexNormals();mesh.computeBoundingSphere();
  const mats=[art.front,art.rear].map(p=>{
    const tex=new THREE.CanvasTexture(p);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;
    return new THREE.MeshLambertMaterial({map:tex,side:THREE.DoubleSide,alphaTest:.20,emissive:'#443e39',emissiveIntensity:.20});
  });
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
  let active=null,entry=null,surface=null,elapsed=seed*.001,move=0;
  function setSurface(art){
    if(art===active)return;
    if(surface){group.remove(surface);release();}
    active=art;entry=geometry(art);inactive.delete(art);entry.refs++;surface=new THREE.SkinnedMesh(entry.mesh,entry.mats);
    surface.frustumCulled=false;surface.bind(skeleton,new THREE.Matrix4());group.add(surface);
  }
  function release(){
    if(!entry||--entry.refs>0)return;
    inactive.set(active,entry);
    if(inactive.size<=12)return;
    const [key,old]=inactive.entries().next().value;inactive.delete(key);built.delete(key);
    old.mesh.dispose();for(const m of old.mats){m.map.dispose();m.dispose();}
  }
  function update(e,dt=.016,t=0){
    const goal=clamp((Math.abs(e.speed||0)||((e.move||e.moving)?2.5:0))/3,0,1.5);
    move+=(goal-move)*(1-Math.exp(-dt*12));elapsed+=dt*(2.5+Math.min(1,move)*6.2);
    const art=getKikalmoLook(a,kikalmoFrame(a,t))?.art||getKikalmoLook(a,0)?.art;if(art)setSurface(art);
    const st=Math.sin(elapsed)*move,bounce=Math.abs(Math.cos(elapsed))*move*.039;
    const rag=e.ragdoll||e.pose?.ragdoll,blend=clamp(rag?.blend||0);
    for(let i=0;i<bones.length;i++){
      const b=bones[i],co=anchors[i];b.position.set(co[0],co[1]+bounce,co[2]);
      let rz=i===2?.016*Math.cos(elapsed*2):0;
      if(i===3||i===4)rz=st*(i===3?.53:-.53)+(i===4&&e.emote?1.45:0)+(i===4?(e.fire||0)*.62:0);
      if(i===5||i===6)rz=st*(i===5?-.57:.57);
      b.rotation.set(i===2?-.027*st:0,i===2?-(e.turn||0)*.12:0,rz);
      const joint=rag?.[joints[i]]||(i===5||i===6?rag?.hips:null);
      if(joint&&blend){tmp.fromArray(joint);b.position.lerp(tmp,blend);b.quaternion.slerp(identity,blend);}
    }
    if(limb.visible){
      for(const side of [0,1]){
        const sign=side?1:-1,name=side?'right':'left',swing=st*sign,arm=arms[side],leg=legs[side];
        p.copy(bones[3+side].position);q.set(-swing*.15,p.y-.20,p.z+sign*.035);r.set(-swing*.26,q.y-.17,q.z+sign*.018);
        if(side&&e.emote){q.y=p.y+.10;r.y=p.y+.34;r.z+=.07*Math.sin(t*10);}else if(side&&e.fire){r.x+=e.fire*.20;r.y+=e.fire*.11;}
        if(blend){if(rag[name+'Elbow'])q.lerp(tmp.fromArray(rag[name+'Elbow']),blend);if(rag[name+'Hand'])r.lerp(tmp.fromArray(rag[name+'Hand']),blend);}
        stick(arm[0],p,q,.068);stick(arm[1],q,r,.055);arm[2].position.copy(r);
        p.copy(bones[5+side].position);q.set(swing*.12,p.y-.20,p.z);r.set(swing*.22,.07+Math.max(0,-swing)*.09,p.z);
        if(blend){if(rag[name+'Knee'])q.lerp(tmp.fromArray(rag[name+'Knee']),blend);if(rag[name+'Foot'])r.lerp(tmp.fromArray(rag[name+'Foot']),blend);}
        stick(leg[0],p,q,.075);stick(leg[1],q,r,.064);leg[2].position.copy(r);leg[2].position.x+=.045;
      }
    }
  }
  return {group,update,dispose(){release();skeleton.dispose();group.removeFromParent();}};
}
const identity=new THREE.Quaternion();
