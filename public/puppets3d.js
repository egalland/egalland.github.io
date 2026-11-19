import {yarnPalette} from './wool-art.js';
import {puppetAppearance} from './puppet-dyes.js';
import {puppetKnit} from './puppet-material.js';
import {motionSeed,sampleLocomotion} from './locomotion-pose.js';
import * as THREE from './three.js';
import { createStreetVehicle, isStreetVehicle } from './street-vehicles.js';
import { vehicleSpec } from './vehicle-types.js';
import {bodyFabric as carPaint,serviceFabric as fleetPaint,fleetFabric as carYarn} from './vehicle-fabric.js';
import { createRagdollRig } from './ragdoll-render.js';

// All figures face +X and stand on y=0. The scenery and the game camera use metres.
const geo={
  ball:new THREE.SphereGeometry(1,12,8), detailBall:new THREE.SphereGeometry(1,18,12),
  littleBall:new THREE.SphereGeometry(1,8,6), box:new THREE.BoxGeometry(1,1,1),
  cylinder:new THREE.CylinderGeometry(1,1,1,16),cone:new THREE.ConeGeometry(1,1,12),
};
const TAU=Math.PI*2;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const colors={ink:yarnPalette.ink,boot:'#543f45',sole:'#392f3b',glove:'#fbe3b5',trim:'#e9ba69',teal:'#378784',deepTeal:yarnPalette.petrol};

const surfaces={
  yarn:new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,map:puppetKnit()}),
  plain:new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true}),
  glow:new THREE.MeshBasicMaterial({color:0xffffff,vertexColors:true}),
};
const unpacked=new WeakMap();
function addPart(parent,geometry,x,y,z,sx,sy,sz,color,rotX=0,rotY=0,rotZ=0,style='yarn'){
  const mesh=new THREE.Mesh(geometry,surfaces[style]||surfaces.yarn);
  mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.set(rotX,rotY,rotZ);
  mesh.userData.tint=new THREE.Color(color||'#ffffff');mesh.userData.surface=style;
  parent.add(mesh);return mesh;
}
function ball(parent,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0,style='yarn'){
  return addPart(parent,geo.ball,x,y,z,sx,sy,sz,color,rx,ry,rz,style);
}
function joint(parent,name,x=0,y=0,z=0){
  const g=new THREE.Group();g.name=name;g.position.set(x,y,z);parent.add(g);return g;
}
// Bake each rigid section into vertex-coloured material batches. All instances of a template
// share the resulting buffers, while their joint transforms are independent.
function batchGroup(group){
  const sets=new Map(),p=new THREE.Vector3(),n=new THREE.Vector3(),norm=new THREE.Matrix3();
  for(const mesh of [...group.children]){
    if(!mesh.isMesh||!mesh.userData.tint)continue;
    const g=mesh.geometry;
    if(!unpacked.has(g))unpacked.set(g,g.index?g.toNonIndexed():g);
    const src=unpacked.get(g),pa=src.attributes.position,no=src.attributes.normal,uv=src.attributes.uv,co=src.attributes.color;
    const tint=mesh.userData.tint,style=mesh.userData.surface||'yarn';
    const out=sets.get(style)||{p:[],n:[],u:[],c:[]};sets.set(style,out);
    mesh.updateMatrix();norm.getNormalMatrix(mesh.matrix);
    for(let i=0;i<pa.count;i++){
      p.fromBufferAttribute(pa,i).applyMatrix4(mesh.matrix);out.p.push(p.x,p.y,p.z);
      if(no)n.fromBufferAttribute(no,i).applyNormalMatrix(norm);else n.set(0,1,0);
      out.n.push(n.x,n.y,n.z);out.u.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
      out.c.push(tint.r*(co?co.getX(i):1),tint.g*(co?co.getY(i):1),tint.b*(co?co.getZ(i):1));
    }
    group.remove(mesh);
  }
  for(const [style,o] of sets){
    const geometry=new THREE.BufferGeometry();
    for(const [name,arr,size] of [['position',o.p,3],['normal',o.n,3],['color',o.c,3],['uv',o.u,2]]){
      geometry.setAttribute(name,new THREE.Float32BufferAttribute(arr,size));
    }
    geometry.computeBoundingSphere();
    group.add(new THREE.Mesh(geometry,surfaces[style]||surfaces.yarn));
  }
  return group;
}
function cord(parent,points,radius,color,style='yarn'){
  const ps=points.map(pt=>new THREE.Vector3(...pt));
  const geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),Math.max(3,(ps.length-1)*3),radius,5,false);
  return addPart(parent,geo,0,0,0,1,1,1,color,0,0,0,style);
}
function taper(points,radii,sides=12){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const steps=(points.length-1)*4,frames=curve.computeFrenetFrames(steps,false);
  const pos=[],uv=[],ix=[];
  for(let i=0;i<=steps;i++){
    const u=i/steps,v=u*(radii.length-1),a=Math.min(radii.length-2,Math.floor(v)),r=THREE.MathUtils.lerp(radii[a],radii[a+1],v-a);
    const center=curve.getPointAt(u);
    for(let j=0;j<=sides;j++){
      const ang=TAU*j/sides;
      const pt=center.clone().addScaledVector(frames.normals[i],r*Math.cos(ang)).addScaledVector(frames.binormals[i],r*Math.sin(ang));
      pos.push(pt.x,pt.y,pt.z);uv.push(j/sides,u);
      if(i<steps&&j<sides){const k=i*(sides+1)+j;ix.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}
    }
  }
  const g=new THREE.BufferGeometry();g.setIndex(ix);
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function earWedge(dir){
  const pts=[[.07,0,-.086*dir],[.07,0,.094*dir],[-.03,.245,.044*dir],[-.06,.0,-.069*dir],[-.075,.0,.080*dir]];
  const faces=[[0,1,2],[4,3,2],[1,4,2],[3,0,2],[0,3,4],[0,4,1]];
  const p=[],uv=[];
  for(let v of faces){
    if(dir>0)v=[v[2],v[1],v[0]];
    for(let i=0;i<3;i++){p.push(...pts[v[i]]);uv.push(i===0?0:i===1?1:.5,i===2?1:0);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
const ears=[earWedge(-1),earWedge(1)];
function earModel(head,side,animal,pal){
  const e=joint(head,side<0?'earL':'earR',-.045,.315,.178*side),s=side>0?1:0;
  if(animal==='bear'){
    ball(e,0,.055,0,.08,.11,.102,pal.shade);ball(e,.047,.058,0,.053,.073,.079,pal.inner);
  }else if(animal==='rabbit'){
    ball(e,-.016,.143,0,.074,.22,.085,pal.fur,.18*side,0,.09);ball(e,.038,.15,.002*side,.039,.16,.049,pal.inner,.18*side,0,.09);
  }else{
    addPart(e,ears[s],0,.0,0,1,1,1,pal.fur);
    addPart(e,ears[s],.048,.017,0,.54,.76,.68,pal.inner);
    addPart(e,ears[s],.064,.026,-.004*side,.42,.53,.5,pal.cream);
    addPart(e,ears[s],-.024,.177,.031*side,.33,.33,.36,pal.shade);
    cord(e,[[-.06,.042,.042*side],[-.062,.08,.04*side],[-.048,.142,.041*side]],.008,pal.cream);
  }
  return e;
}
function cloakGeometry(){
  const steps=18,positions=[],uv=[],idx=[];
  const rings=[[.04,.24,.14],[-.125,.29,.19],[-.30,.335,.30],[-.41,.34,.36]];
  rings.forEach(([y,wide,depth],i)=>{
    for(let j=0;j<=steps;j++){
      const u=j/steps,theta=TAU*u,c=Math.cos(theta),s=Math.sin(theta);
      const rear=(1-c)*.5,frac=i/(rings.length-1);
      const x=depth*c-.05-.07*rear*frac, yy=y+(.11*(1-rear)-.022*Math.cos(theta*7))*frac;
      positions.push(x,yy,s*wide);uv.push(u,frac);
      if(i<rings.length-1 && j<steps){const q=i*(steps+1)+j;idx.push(q,q+1,q+steps+1,q+1,q+steps+2,q+steps+1);}
    }
  });
  const g=new THREE.BufferGeometry();g.setIndex(idx);g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
const capeShape=cloakGeometry();
function addFoxCape(torso){
  const cape=joint(torso,'cape',-.015,.20,0);
  addPart(cape,capeShape,0,0,0,1,1,1,colors.teal);
  for(const y of [-.326,-.352]){
    const points=[];
    for(let j=0;j<=24;j++){
      const theta=j/24*TAU,c=Math.cos(theta),s=Math.sin(theta),rear=(1-c)*.5;
      points.push([(.319+.018*(y<-.34))*c-.051-.073*rear,y+(.09*(1-rear)-.017*Math.cos(theta*7)),s*(y<-.34?.342:.333)]);
    }
    cord(cape,points,y<-.34?.010:.006,y<-.34?colors.trim:'#80c9a5');
  }
  // The gold embroidered spool reads from the chase camera on the back of the cape.
  const badge=joint(cape,'embroidery',-.379,-.25,0);
  badge.rotation.z=-.52;
  ball(badge,0,0,0,.012,.08,.069,'#205b63');
  const gold='#ffd27c';
  cord(badge,[[-.011,.052,-.045],[-.017,.055,0],[-.011,.052,.045]],.009,gold);
  cord(badge,[[-.012,-.047,-.045],[-.017,-.052,0],[-.012,-.047,.045]],.009,gold);
  for(let i=0;i<3;i++){const yy=-.025+i*.021;cord(badge,[[-.017,yy,-.033],[-.024,yy+.015,0],[-.017,yy+.023,.033]],.006,gold);}
  // Bake the embroidered badge into the cape batch rather than another animated joint.
  badge.updateMatrix();
  for(const part of [...badge.children]){part.applyMatrix4(badge.matrix);cape.add(part);}cape.remove(badge);
  return cape;
}
function serviceUniform(torso,head,type,cloth,edge){
  const brass='#ffd173';
  if(type==='police'){
    ball(head,0,.34,0,.297,.103,.294,'#34455f');ball(head,.169,.302,0,.196,.026,.237,'#30323e');
    ball(head,.267,.347,0,.018,.033,.034,brass);
    cord(torso,[[.20,.12,-.12],[.217,.04,0],[.18,-.09,.11]],.018,'#baa779');
    ball(torso,.189,.12,-.11,.018,.048,.038,brass);
  }else if(type==='medic'){
    ball(head,0,.342,0,.261,.08,.255,'#eee6d2');ball(head,0,.303,0,.250,.022,.249,'#4d807c');
    cord(torso,[[.14,.158,-.141],[.196,.017,-.018],[.164,-.128,.129]],.019,edge);
    addPart(head,geo.box,.25,.348,0,.023,.067,.024,'#317e70');addPart(head,geo.box,.246,.348,0,.025,.023,.067,'#317e70');
    ball(torso,-.165,-.003,.08,.151,.197,.187,'#f1e0bd');
    addPart(torso,geo.box,-.309,.03,.09,.018,.091,.027,'#3a8975');
    addPart(torso,geo.box,-.311,.03,.09,.018,.026,.084,'#3a8975');
  }else if(type==='firefighter'){
    ball(head,0,.345,0,.274,.168,.289,'#edb54c');ball(head,-.036,.278,0,.324,.035,.32,'#cd9442');
    cord(head,[[-.23,.391,0],[0,.515,0],[.218,.406,0]],.025,'#ffe1a0');ball(head,.26,.354,0,.02,.044,.04,'#8b413d');
    for(const y of [-.105,-.052])ball(torso,0,y,0,.20,.022,.235,'#f2cd67');
  }else if(type==='swat'){
    ball(head,0,.321,0,.289,.183,.29,'#424b5a');ball(head,0,.285,0,.305,.035,.299,'#2f3444');
    ball(head,.236,.173,0,.063,.061,.216,'#393a46');ball(head,.282,.172,0,.023,.04,.179,'#81a4b2',0,0,0,'plain');
    ball(torso,-.018,.018,0,.213,.198,.263,'#525a66');
    for(const s of [-1,1])addPart(torso,geo.box,.187,-.035,s*.093,.045,.105,.11,'#68727c');
  }else{
    for(const s of [-1,1])cord(torso,[[.135,.19,s*.14],[.167,.061,s*.1],[.133,-.058,s*.16]],.014,edge);
  }
}
function makeBody(look,high){
  const {type,animal,pelt:pal,coat:cloth,trim:edge,service}=look;
  const isFox=type==='fox',out=[cloth,edge];
  const group=new THREE.Group(),core=joint(group,'core',0,.69,0),torso=joint(core,'torso',0,.065,0);
  const head=joint(core,'head',.025,.49,0);
  const fur=pal.fur;
  ball(torso,0,-.025,0,.193,.277,.223,out[0]);
  ball(torso,.015,.26,0,.113,.13,.121,isFox?colors.deepTeal:out[0]);
  ball(torso,.01,-.224,0,.156,.089,.182,'#4d5262');
  ball(head,.005,.124,0,.279,.252,.291,fur);
  if(!high){
    for(const s of [-1,1]){
      let y=.145;
      if(animal==='rabbit')ball(head,-.025,.382,s*.170,.065,.183,.066,fur,.16*s);
      else if(animal==='bear')ball(head,-.035,.319,s*.205,.067,.086,.08,fur);
      else addPart(head,ears[s<0?0:1],-.025,.294,.158*s,.88,.91,.87,fur);
      ball(head,.155,.078,s*.119,.153,.104,.143,pal.cream);
      ball(head,.217,y+.018,s*.14,.045,.057,.032,colors.ink);
      ball(core,.039,-.522,s*.115,.128,.144,.075,colors.boot);
      ball(core,-.029,-.313,s*.236,.08,.126,.070,out[0]);
    }
    ball(head,.309,.094,0,.059,.039,.06,colors.ink);
    if(isFox){ball(core,-.254,-.096,.12,.23,.09,.095,fur,.1,.3,.32);ball(core,-.44,-.016,.216,.123,.075,.07,pal.cream);}
    if(service){
      const tone=type==='firefighter'?'#deb05e':type==='medic'?'#efe3c6':cloth;
      ball(head,0,.333,0,.286,.103,.285,tone);
      if(type==='police'||type==='swat')ball(head,.115,.287,0,.20,.030,.235,colors.ink);
      else if(type==='firefighter')ball(head,-.016,.287,0,.318,.028,.318,'#b38755');
      if(type==='medic'){
        ball(torso,-.152,0,.035,.11,.146,.14,'#d9c6a3');
        addPart(torso,geo.box,-.263,.015,.036,.014,.074,.022,edge);
        addPart(torso,geo.box,-.264,.015,.036,.014,.021,.073,edge);
      }
    }
    batchGroup(head);batchGroup(core);batchGroup(torso);
    return group;
  }
  // Cheek tufts and double yarn brows give the fox a different profile from the rounder passersby.
  for(const sign of [-1,1]){
    ball(head,.129,.069,sign*.147,.165,.115,.143,pal.cream,.15*sign,0,-.09);
    if(animal==='fox'||animal==='cat'){
      const tuft=taper([[.13,.055,sign*.22],[.10,.07,sign*.284],[.07,.122,sign*.345]],[.069,.051,.002],7);
      addPart(head,tuft,0,0,0,1,1,1,pal.cream);
    }
    if(animal==='raccoon')ball(head,.191,.175,sign*.15,.086,.081,.086,pal.shade,.18*sign);
    const cheekCross=[[.114,.08,.276],[.100,.065,.286],[.08,.091,.289]];
    cord(head,cheekCross.map(([x,y,z])=>[x,y,z*sign]),.006,'#dbad83');
    cord(head,[[.18,.255,.164*sign],[.20,.256,.132*sign],[.231,.243,.098*sign]],.010,pal.shade);
    earModel(head,sign,animal,pal);
  }
  ball(head,.250,.074,0,.126,.081,.109,pal.cream);
  ball(head,.340,.104,0,.062,.042,.072,colors.ink,0,0,.12);
  ball(head,.381,.122,-.015,.016,.01,.022,'#dfbea2',0,0,0,'plain');
  cord(head,[[.333,.079,-.047],[.346,.061,0],[.32,.043,.047]],.007,'#855e55');
  const eyes=joint(head,'eyes',0,.179,0);
  for(const s of [-1,1]){
    ball(eyes,.205,0,s*.129,.072,.093,.061,'#fff0cd',.17*s,.14*s,0,'plain');
    ball(eyes,.253,-.002,s*.148,.04,.068,.035,colors.ink,.17*s,.16*s,0,'plain');
    ball(eyes,.285,.021,s*.151,.014,.020,.018,'#fff6d7',0,0,0,'plain');
  }
  // Wrap raised strand seams behind the head. They read from the follow camera when the face is hidden.
  for(const s of [-1,1])for(let i=0;i<3;i++){
    const z=s*(.047+.058*i),x=-.26+.02*i,y=.172+.009*i;
    cord(head,[[x+.009,y+.018,z-.014],[x-.005,y-.007,z],[x+.004,y+.018,z+.015]],.0055,i===2?pal.cream:pal.shade);
  }
  // Raised, turned hems show up on the back and the side in the chase camera.
  // The same seam runs across civilian jackets, uniform coats and the hero cape collar.
  const collar=[];
  for(let j=0;j<=16;j++){
    const a=j*TAU/16;collar.push([.133*Math.cos(a),.181-.018*Math.max(0,Math.cos(a)),.162*Math.sin(a)]);
  }
  cord(torso,collar,.012,out[1]);
  if(!service&&!isFox){
    cord(torso,[[-.151,.089,-.114],[-.182,.048,0],[-.151,.089,.114]],.006,'#77636c');
    for(const y of [-.06,.025,.104])ball(torso,.192,y,0,.012,.022,.024,out[1],0,0,0,'plain');
  }
  serviceUniform(torso,head,type,out[0],out[1]);
  if(isFox){
    addFoxCape(torso);
    ball(torso,.002,.201,0,.191,.068,.245,'#24736f');
    cord(torso,[[.121,.202,-.171],[.172,.137,-.09],[.19,.139,0],[.172,.137,.09],[.121,.202,.171]],.019,'#f5c979');
    ball(torso,.198,.143,0,.033,.056,.056,'#d49b54');ball(torso,.225,.145,0,.023,.04,.036,'#6fe0c9');
  }
  for(const s of [-1,1]){
    const side=s<0?'L':'R',arm=joint(core,'arm'+side,.001,.182,s*.224),leg=joint(core,'leg'+side,-.016,-.24,s*.112);
    const sleeve=isFox?'#385561':out[0];
    const elbow=joint(arm,'elbow'+side,.008,-.162,.040*s);
    const knee=joint(leg,'knee'+side,-.012,-.141,0);
    addPart(arm,taper([[0,0,0],[.003,-.085,.031*s],[.008,-.17,.040*s]],[.071,.069,.058],8),0,0,0,1,1,1,sleeve);
    addPart(elbow,taper([[0,.012,0],[.013,-.080,.014*s],[.04,-.15,.01*s]],[.059,.054,.047],8),0,0,0,1,1,1,sleeve);
    ball(elbow,.037,-.107,.010*s,.063,.043,.063,isFox?colors.trim:out[1]);
    ball(elbow,.061,-.166,.011*s,.085,.083,.080,colors.glove,.1*s,0,.05);
    ball(elbow,.111,-.149,-.018*s,.043,.057,.042,colors.glove);
    for(let k=0;k<2;k++)cord(elbow,[[.041+k*.033,-.168,.083*s],[.047+k*.027,-.193,.079*s]],.0045,'#aa8974');
    addPart(leg,taper([[0,0,0],[-.009,-.074,0],[-.012,-.147,0]],[.075,.071,.06],8),0,0,0,1,1,1,'#454052');
    addPart(knee,taper([[0,.009,0],[.007,-.054,0],[.016,-.114,0]],[.061,.057,.051],8),0,0,0,1,1,1,'#454052');
    ball(knee,.029,-.134,0,.081,.068,.073,'#8b675c');
    ball(knee,.073,-.211,.002*s,.147,.088,.093,colors.boot,0,0,-.08);
    ball(knee,.078,-.253,.002*s,.15,.039,.095,colors.sole);
    cord(knee,[[.093,-.154,-.046],[.111,-.150,0],[.094,-.156,.046]],.006,'#c69a75');
  }
  if(animal==='fox'||animal==='raccoon'||animal==='cat'){
    const tail=joint(core,'tail',-.108,-.158,.095);
    const path=[[-.015,-.015,.015],[-.155,-.113,.088],[-.293,-.075,.218],[-.389,.02,.335],[-.399,.14,.404],[-.344,.235,.474]];
    addPart(tail,taper(path.slice(0,5),[.037,.081,.116,.145,.086],12),0,0,0,1,1,1,pal.fur);
    const tip=[path[3],[-.397,.063,.362],path[4],path[5],[-.323,.272,.511]];
    addPart(tail,taper(tip,[.142,.134,.099,.053,.001],12),0,0,0,1,1,1,pal.cream);
    if(animal==='raccoon'){ball(tail,-.287,-.060,.223,.094,.105,.111,pal.shade,0,0,-.41);}
  }else if(animal==='rabbit')ball(core,-.189,-.142,0,.083,.087,.087,pal.cream);
  group.traverse(o=>{if(o.isGroup)batchGroup(o);});
  return group;
}
function bakeStaticHierarchy(root){
  root.updateMatrixWorld(true);
  const all=[];
  root.traverse(o=>{if(o.isMesh)all.push(o);});
  const g=new THREE.Group();
  for(const original of all){
    const m=original.clone();m.matrix.copy(original.matrixWorld);m.matrix.decompose(m.position,m.quaternion,m.scale);
    m.userData.tint=new THREE.Color(1,1,1);m.userData.surface=Object.keys(surfaces).find(k=>surfaces[k]===original.material)||'yarn';g.add(m);
  }
  batchGroup(g);return g;
}
const peopleTemplates=new Map();
export function createPuppet(type='fox',color,seed=0){
  const look=puppetAppearance(type,color,seed);
  type=look.type;
  const {animal,coat:cloth,pick}=look;
  const key=type+'|'+animal+'|'+cloth;
  if(!peopleTemplates.has(key)){
    peopleTemplates.set(key,{near:makeBody(look,true),far:bakeStaticHierarchy(makeBody(look,false))});
  }
  const template=peopleTemplates.get(key),near=template.near.clone(true),far=template.far.clone(true);
  const group=new THREE.Group(),lod=new THREE.LOD();group.add(lod);lod.addLevel(near,0);lod.addLevel(far,type==='fox'?48:29,.12);
  const bone={};near.traverse(o=>{if(o.name)bone[o.name]=o;});
  let styleSeed=motionSeed(seed),lastId;
  let phaseIdle=(pick%141)*.039,tailLag=0,em=0,impact=0,shot=0;
  const hero=type==='fox',ragRig=createRagdollRig(bone),farDistance=lod.levels[1].distance;
  function update(pose={},dt=1/60,time=0){
    ragRig.restore();
    if(pose.id!==lastId){lastId=pose.id;styleSeed=motionSeed(lastId??seed);}
    const motion=sampleLocomotion(pose,time,styleSeed);
    const articulated=pose.ragdoll||motion.effort>.02;
    lod.levels[1].distance=articulated?Infinity:farDistance;
    if(articulated){near.visible=true;far.visible=false;}
    dt=clamp(Number(dt)||0,0,.1);phaseIdle+=dt;
    const {phase,step:a,pace:rel,turn,breath:idleBreath}=motion,b=Math.cos(phase*2);
    const waveSignal=pose.emote?1:0;
    em+=(waveSignal-em)*(1-Math.exp(-dt*14));
    impact=Math.max(clamp(Number(pose.impact)||0,0,1),impact*Math.exp(-dt*8));
    shot=Math.max(clamp(Number(pose.fire)||0,0,1),shot*Math.exp(-dt*14));
    far.position.y=motion.bob;
    far.rotation.set(motion.roll*.55,0,-motion.lean*.50);
    if(!near.visible)return;
    bone.core.position.y=.69+motion.bob-.039*impact;
    bone.core.rotation.z=pose.stunned&&!pose.ragdoll?-1.26:-motion.lean+.12*impact;
    bone.core.rotation.x=motion.roll;bone.core.rotation.y=motion.twist;
    const squash=motion.squash-.10*impact;
    bone.torso.scale.set(1-squash*.52,1+squash,1-squash*.50);
    bone.head.position.y=.49+.30*squash+.009*Math.cos(phase*2-.6)*rel;
    bone.head.rotation.z=motion.lean*.36+.022*b*rel+.057*impact+.009*(1-rel)*idleBreath;
    bone.head.rotation.x=-motion.roll*.55;
    bone.head.rotation.y=-motion.twist*.61-turn*.145+.14*em*Math.sin(phaseIdle*7);
    const blinkCycle=(phaseIdle+pick*.113)%3.63;
    bone.eyes.scale.y=1-.91*Math.max(0,1-Math.abs(blinkCycle-.10)/.079);
    for(const s of [-1,1]){
      const k=s<0?'L':'R',leg=bone['leg'+k],arm=bone['arm'+k],ear=bone['ear'+k];
      const limb=s<0?motion.left:motion.right;
      leg.rotation.z=limb.thigh+motion.lean*.52;
      leg.scale.y=1+(limb.legStretch||0);arm.scale.y=1+(limb.armStretch||0);
      leg.rotation.x=-s*.036;bone['knee'+k].rotation.z=limb.shin;
      arm.rotation.z=limb.arm+motion.lean*.48;
      arm.rotation.x=-s*limb.splay;
      bone['elbow'+k].rotation.z=limb.elbow;
      if(s>0){const free=1-motion.effort;arm.rotation.z+=free*(1.11*shot+em*(2.4+.20*Math.sin(phaseIdle*13)));arm.rotation.x+=free*em*(.36+.16*Math.sin(phaseIdle*14));}
      ear.rotation.x=s*(.085+.029*Math.sin(phase*2-.5)*rel)+turn*.07;
      ear.rotation.z=-.025*(1-rel)*idleBreath+.069*Math.sin(phase*2-.38)*rel+.13*impact;
    }
    if(bone.cape){bone.cape.rotation.z=-.07*rel-.04*b*rel-.018*idleBreath;bone.cape.rotation.x=.045*a*rel+turn*.03;}
    if(bone.tail){
      tailLag+=(turn-tailLag)*(1-Math.exp(-dt*5.5));
      bone.tail.rotation.y=.10*Math.sin(phaseIdle*2.4)+.15*Math.sin(phase-.6)*rel-.3*tailLag;
      bone.tail.rotation.z=(hero?.06:.02)+.075*Math.sin(phase*2-.9)*rel+.048*idleBreath-em*.17;
    }
    if(pose.ragdoll)ragRig.apply(pose.ragdoll);
  }
  return {group,update,dispose(){group.removeFromParent();}};
}
// A section runs across the body from its front to the back. A broad top and
// rounded shoulders give the knitted car one continuous, upholstered silhouette.
const carShapeCache = new Map();
function carLoft(key, sections, exponent = .55) {
  if (carShapeCache.has(key)) return carShapeCache.get(key);
  const slices = 16, positions = [], uvs = [], indices = [];
  const signedPower = v => Math.sign(v) * Math.pow(Math.abs(v),exponent);
  sections.forEach(([x, bottom, top, halfWidth], index) => {
    for (let n=0;n<=slices;n++) {
      const a = n / slices * Math.PI * 2;
      positions.push(x, (bottom+top)/2+(top-bottom)/2*signedPower(Math.cos(a)), halfWidth*signedPower(Math.sin(a)));
      uvs.push(index/(sections.length-1), n/slices);
    }
  });
  for(let j=0;j<sections.length-1;j++) for(let i=0;i<slices;i++) {
    const a=j*(slices+1)+i,b=a+1,c=a+slices+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  for(let end=0;end<=1;end++) {
    const i=end*(sections.length-1),[x,lo,hi]=sections[i];
    const center=positions.length/3;
    positions.push(x,(lo+hi)/2,0);uvs.push(.5,.5);
    for(let n=0;n<slices;n++){
      const a=i*(slices+1)+n;
      if(end===0)indices.push(center,a+1,a);else indices.push(center,a,a+1);
    }
  }
  const mesh=new THREE.BufferGeometry();
  mesh.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  mesh.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  mesh.setIndex(indices);mesh.computeVertexNormals();carShapeCache.set(key,mesh);return mesh;
}

function carWindshield(key,phase) {
  if(carShapeCache.has(key))return carShapeCache.get(key);
  const back=phase==='rear';
  const sign=back ? -1 : 1;
  const xBottom=back ? -1.23 : .99, xTop=back ? -.77 : .45;
  const yBottom=back ? 1.12 : 1.13, yTop=1.59;
  const bottomWidth=back ? .54 : .60,topWidth=.51;
  const geom = new THREE.BufferGeometry();
  const v = [xBottom,yBottom,-bottomWidth, xTop,yTop,-topWidth, xTop,yTop,topWidth, xBottom,yBottom,bottomWidth];
  geom.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
  geom.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,1,1,0],2));
  geom.setIndex(sign>0 ? [0,1,2,0,2,3] : [0,2,1,0,3,2]);
  geom.computeVertexNormals();carShapeCache.set(key,geom);return geom;
}
function carSideWindow(front,side) {
  const key='side-window-'+Number(front)+'-'+side;
  if(carShapeCache.has(key))return carShapeCache.get(key);
  const points=front?
    [[-.03,1.07,.73],[-.03,1.59,.604],[.39,1.57,.602],[.79,1.10,.699]]:
    [[-1.10,1.07,.69],[-.72,1.53,.589],[-.17,1.59,.604],[-.17,1.07,.73]];
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(([x,y,z])=>[x,y,z*side]),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,0,1,1,1,1,0],2));
  geometry.setIndex(side>0?[0,2,1,0,3,2]:[0,1,2,0,2,3]);geometry.computeVertexNormals();
  carShapeCache.set(key,geometry);return geometry;
}
const carCloth=carYarn.binding,carDark=carYarn.ink,carCream=carYarn.thread;
function carPart(group,geom,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0,style='yarn'){
  return addPart(group,geom,x,y,z,sx,sy,sz,color,rx,ry,rz,style);
}
function carBox(g,x,y,z,w,h,d,c,rx=0,ry=0,rz=0,style='yarn'){
  return carPart(g,geo.box,x,y,z,w,h,d,c,rx,ry,rz,style);
}
function carBall(g,x,y,z,w,h,d,c,style='yarn'){
  return carPart(g,geo.ball,x,y,z,w,h,d,c,0,0,0,style);
}
function carButton(g,x,y,z,r,length,c) {
  return carPart(g,geo.cylinder,x,y,z,r,length,r,c,Math.PI/2,0,0,'yarn');
}
function carTrim(g,a,b,r,c){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),dir=to.clone().sub(from);
  const mid=from.clone().lerp(to,.5);
  const item=carPart(g,geo.cylinder,mid.x,mid.y,mid.z,r,dir.length(),r,c);
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return item;
}
function lensThread(g,x,y,z,spacing){
  for(const side of [-1,1])carBall(g,x,y,z+side*spacing,.006,.013,.011,carYarn.welt);
  carBox(g,x+.003,y+.002,z,.008,.009,spacing*1.6,carYarn.thread);
}
function carGrille(g,x,y,wide){
  carBall(g,x,y,0,.088,.24,wide,'#464656');
  for(let i=-3;i<=3;i++)carBox(g,x+.090,y,i*wide*.213,.012,.32*(1-.18*Math.abs(i)/3),.028,'#e3cba0');
}
function carBumpers(g,xfront,xrear,width){
  for(const [x,dir] of [[xfront,1],[xrear,-1]]){
    carBox(g,x,.45,0,.14,.105,width*1.86,'#c3b29b');
    for(const s of [-1,1]){
      carBall(g,x,.45,s*width*.91,.077,.061,.076,'#f3dec2');
      carBox(g,x+dir*.075,.46,s*width*.43,.09,.14,.16,'#707681');
    }
    lacedSeam(g,[x+dir*.035,.70,-width*.42],[x+dir*.035,.70,width*.42],6);
    carBox(g,x+dir*.077,.53,0,.02,.12,.42,carCream);
    carBox(g,x+dir*.091,.525,-.16,.006,.09,.065,'#387298');
    for(let i=0;i<4;i++)carBox(g,x+dir*.091,.535,-.07+i*.052,.006,.058,.018,'#525260');
  }
}
function carChassis(g,paint,service,variant){
  const body=carLoft('sport-body',[
    [-1.92,.50,.80,.60],[-1.82,.42,.92,.78],[-1.52,.41,1.04,.85],[-.8,.41,1.01,.84],
    [.20,.41,1.02,.85],[.85,.42,.99,.83],[1.58,.43,.96,.76],[1.84,.49,.90,.67],[1.96,.56,.81,.49]
  ]);
  carPart(g,body,0,0,0,1,1,1,paint);
  const shell=carLoft('sport-cabin',[
    [-1.32,.89,1.06,.64],[-1.13,.91,1.25,.70],[-.74,.94,1.62,.69],[-.42,.94,1.70,.70],
    [.18,.94,1.72,.70],[.45,.94,1.65,.68],[.78,.94,1.33,.69],[1.01,.94,1.08,.67]
  ],.77);
  const capColor=service==='police'?'#e8dfc8':service==='taxi'||variant%3===0?carCloth:paint;
  carPart(g,shell,0,0,0,1,1,1,capColor);
  for(const k of ['front','rear'])trimmedGlass(g,carWindshield('glass-'+k,k),k==='front'?carYarn.frontPane:carYarn.pane);
  for(const s of [-1,1]){
    for(const front of [true,false])trimmedGlass(g,carSideWindow(front,s),front?carYarn.pane:carYarn.shadePane);
    // Contrast piping at the rocker, waist and skirt.
    lacedSeam(g,[-1.06,.74,s*.85],[.85,.74,s*.85],9);
    carBox(g,-.11,.50,s*.829,2.59,.06,.07,'#2e3445');
    carTrim(g,[-1.57,.87,s*.831],[1.51,.86,s*.794],.024,'#e8c9a3');
    carBox(g,.23,.97,s*.823,.18,.034,.04,carCloth);
    carBox(g,-.73,.97,s*.823,.16,.034,.04,carCloth);
    carBall(g,1.65,.83,s*.615,.217,.169,.174,capColor);
    carBall(g,1.79,.855,s*.635,.125,.119,.13,'#ffe8ab','glow');
    carBall(g,-1.74,.83,s*.677,.104,.11,.12,'#8a3c48');
    carBall(g,-1.81,.85,s*.686,.064,.074,.08,carYarn.stop,'glow');
    lensThread(g,1.909,.855,s*.635,.033);lensThread(g,-1.871,.85,s*.686,.022);
    for(const xx of [-1.22,1.27])carBall(g,xx,.63,s*.72,.555,.25,.188,paint);
    carBox(g,.686,1.08,s*.80,.13,.07,.11,capColor);
    if(service==='police'){
      carBox(g,-.10,.81,s*.849,1.98,.16,.028,'#ede1c8');
      carBox(g,-.10,.82,s*.866,1.92,.04,.012,'#6ba9c4');
    }
    if(service==='taxi')for(let i=0;i<7;i++)carBox(g,-.78+i*.20,.81,s*.849,.10,.09,.02,carDark);
  }
  carTrim(g,[1.04,.995,0],[1.86,.914,0],.023,'#e6c5a1');
  carGrille(g,1.91,.72,.40);
  carBumpers(g,1.98,-1.94,.86);
}
// Cut every pane from the same three tones of felt. Bake the jamb, a pair of
// diagonal highlights and the lower cord into the rigid body material batch.
function carPanel(g,points,color){
  const space=points.map(p=>new THREE.Vector3(...p)),[a,b,c,d]=space;
  const normal=b.clone().sub(a).cross(c.clone().sub(a)).normalize();
  const outward=normal.x*(a.x+c.x)+normal.z*(a.z+c.z)>=0;
  if(!outward)normal.multiplyScalar(-1);
  const vertices=[],inks=[],uv=[],indices=[],sample=new THREE.Vector3(),other=new THREE.Vector3();
  function patch(corners,tint,raise){
    const offset=vertices.length/3,col=new THREE.Color(tint);
    for(const [u,v] of corners){
      sample.lerpVectors(a,b,u).lerp(other.lerpVectors(d,c,u),v).addScaledVector(normal,raise);
      vertices.push(sample.x,sample.y,sample.z);inks.push(col.r,col.g,col.b);uv.push(u,v);
    }
    for(const i of outward?[0,1,2,0,2,3]:[0,2,1,0,3,2])indices.push(offset+i);
  }
  patch([[0,0],[1,0],[1,1],[0,1]],carYarn.shadePane,0);
  patch([[.03,.06],[.97,.06],[.95,.95],[.05,.95]],color,.003);
  patch([[.08,.08],[.18,.08],[.45,.93],[.33,.93]],carYarn.gleam,.006);
  patch([[.23,.10],[.255,.10],[.52,.92],[.495,.92]],'#b6ccba',.006);
  patch([[.06,.025],[.94,.025],[.92,.055],[.08,.055]],carYarn.binding,.006);
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geom.setAttribute('color',new THREE.Float32BufferAttribute(inks,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geom.setIndex(indices);geom.computeVertexNormals();
  return carPart(g,geom,0,0,0,1,1,1,'#ffffff');
}
function trimmedGlass(g,original,tint){
  const attr=original.attributes.position;
  carPanel(g,[0,3,2,1].map(i=>[attr.getX(i),attr.getY(i),attr.getZ(i)]),tint);
}
function lacedSeam(g,from,to,steps){
  // Low-poly stitches share one geometry and the body's existing yarn batch.
  const p=new THREE.Vector3(...from),span=new THREE.Vector3(...to).sub(p),at=new THREE.Vector3();
  const length=span.length()/steps*.55;
  const axis=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),span.clone().normalize());
  for(let i=0;i<steps;i++){
    at.copy(p).addScaledVector(span,(i+.5)/steps);
    const stitch=carBox(g,at.x,at.y,at.z,length,.023,.026,carYarn.binding);
    stitch.quaternion.copy(axis);
  }
}
function townCar(g,type,paint){
  const sport=type==='sport',l=sport?2.12:1.71,w=sport?.94:.79;
  const belt=sport?.70:.91,roof=sport?1.20:1.58;
  const rear=sport?-1.57:-1.45,front=sport?1.04:.86;
  const rearTop=sport?-.58:-1.02,frontTop=sport?.17:.23,glass=w*.87,top=w*.72;
  const shell=carLoft(type+'-shell',[
    [-l+.09,.38,belt*.87,w*.72],[-l+.20,.30,belt*.99,w*.93],[-l*.65,.30,belt+.03,w],
    [0,.31,belt+.015,w],[l*.64,.30,belt-.06,w*.96],[l-.18,.34,belt-.12,w*.89],[l-.09,.39,belt-.17,w*.70]
  ],.46);
  carPart(g,shell,0,0,0,1,1,1,paint);
  // A tall, short greenhouse on the hatch and a swept, low canopy on the coupé.
  const lower=belt-.014;
  const canopy=carLoft(type+'-canopy',[[rear,lower,lower+.065,glass],[rearTop,lower,roof,top],
    [frontTop,lower,roof-.012,top],[front,lower,lower+.065,glass]],.3);
  carPart(g,canopy,0,0,0,1,1,1,'#456977');
  const wind=(bottom,end,sign)=>carPanel(g,[[bottom+sign*.017,lower+.036,-glass*.84],[bottom+sign*.017,lower+.036,glass*.84],
    [end+sign*.016,roof-.046,top*.83],[end+sign*.016,roof-.046,-top*.83]],sign>0?'#98c3c6':'#6b949e');
  wind(front,frontTop,1);wind(rear,rearTop,-1);
  carBox(g,(rearTop+frontTop)/2,roof-.005,0,frontTop-rearTop+.08,.080,top*1.94,sport?paint:'#efe3c2');
  for(const s of [-1,1]){
    carPanel(g,[[rear+.10,belt+.072,s*glass],[front-.10,belt+.072,s*glass],
      [frontTop-.03,roof-.078,s*top],[rearTop+.05,roof-.078,s*top]],'#81aab3');
    for(const [foot,tip] of [[rear,rearTop],[front,frontTop],[sport?-.58:-.60,sport?-.37:-.52]])
      carTrim(g,[foot,belt+.032,s*glass],[tip,roof-.017,s*top],.032,paint);
    carTrim(g,[rear+.005,belt+.05,s*glass],[front-.005,belt+.05,s*glass],.022,'#ecd8a2');
    lacedSeam(g,[-.86,belt-.13,s*(w+.008)],[.49,belt-.13,s*(w+.008)],7);
    carBox(g,-.28,belt-.055,s*w,.20,.028,.027,'#d3c4a1');
    carBox(g,0,.41,s*w*.99,2*l*.70,.05,.045,sport?'#344350':'#dbceb5');
    carBall(g,l-.12,belt-.16,s*w*.68,.09,sport?.047:.10,sport?.17:.114,'#ffeba0','glow');
    carBall(g,-l+.08,belt-.12,s*w*.68,.045,sport?.047:.10,.121,carYarn.stop,'glow');
    lensThread(g,l-.035,belt-.16,s*w*.68,.033);lensThread(g,-l+.036,belt-.12,s*w*.68,.028);
    if(sport){
      carBox(g,-1.50,belt+.105,s*.58,.08,.2,.07,'#3b3e49',0,0,-.16);
      carBox(g,1.42,belt-.087,s*.19,.77,.035,.075,'#e8d8ad',0,0,-.06);
    }else carTrim(g,[rearTop-.01,roof+.047,s*.36],[frontTop+.01,roof+.047,s*.36],.014,'#c8af8d');
  }
  if(sport)carBox(g,-1.56,belt+.24,0,.32,.065,1.76,paint,0,0,-.06);
  carBox(g,l-.098,belt-.26,0,.04,.13,w*(sport?1.12:.68),carDark);
  carBumpers(g,l-.098,-l+.098,w*.96);
}
function cityBus(g,paint){
  const l=4.25,w=1.19,lower=1.20,top=2.80;
  const shell=carLoft('city-bus',[
    [-4.24,.42,2.58,1.10],[-4.11,.35,2.77,w],[-3.91,.35,2.82,w],
    [3.92,.35,2.82,w],[4.10,.37,2.76,1.16],[4.23,.48,2.56,1.08]
  ],.22);
  carPart(g,shell,0,0,0,1,1,1,paint);
  for(const s of [-1,1]){
    carBox(g,0,1.05,s*w,7.99,.55,.032,'#ece2c5');
    carBox(g,0,lower+.05,s*(w+.016),8.02,.047,.021,'#e7b05f');
    for(let i=0;i<7;i++){
      const x=-3.45+i*1.13;
      const door=s>0 && (i===3||i===6);
      carBox(g,x,door?1.54:1.83,s*w,door?.94:1.00,door?1.79:.91,.041,'#354f60');
      const z=s*(w+.031);
      carPanel(g,[[x-.45,1.53,z],[x+.45,1.53,z],[x+.45,2.25,z],[x-.45,2.25,z]],door?carYarn.pane:i%2?carYarn.frontPane:carYarn.pane);
      if(door)carBox(g,x,1.48,s*(w+.032),.060,1.77,.018,'#586c70');
      else carBox(g,x,2.08,s*(w+.032),.92,.027,.018,'#dde4cb');
    }
    carBall(g,4.16,.84,s*.78,.094,.10,.14,'#f9dfa4','glow');
    carBall(g,-4.16,1.04,s*.91,.055,.17,.092,carYarn.stop,'glow');
    lensThread(g,4.251,.84,s*.78,.039);lensThread(g,-4.213,1.04,s*.91,.025);
  }
  for(const s of [-1,1]){
    const cap=s*(l-.005);
    carPanel(g,[[cap,1.32,-.96],[cap,1.32,.96],[cap,2.32,.96],[cap,2.32,-.96]],s>0?carYarn.frontPane:carYarn.pane);
    lacedSeam(g,[cap,1.10,-.83],[cap,1.10,.83],9);
    carBox(g,s*(l-.014),2.43,0,.04,.28,1.51,'#33444b');
    for(const [y,z,ww] of [[2.49,-.48,.16],[2.48,-.11,.18],[2.42,-.11,.17],[2.36,-.11,.18],[2.40,.34,.24],[2.40,.62,.09]]){
      carBox(g,s*(l+.009),y,z,.016,.021,ww,'#eec16e');
    }
    for(const [y,z] of [[2.45,-.40],[2.39,-.40],[2.45,-.04],[2.39,-.04]])carBox(g,s*(l+.009),y,z,.016,.067,.025,'#edba68');
  }
  carBox(g,0,top+.035,0,7.73,.13,2.15,'#d5d4b6');
  carBox(g,-1.12,top+.14,0,1.36,.17,.94,'#8eada4');
  for(let i=0;i<5;i++)carBox(g,-1.63+i*.22,top+.232,0,.089,.014,.68,'#576c70');
}

function carVan(g,type,paint){
  const body=carLoft('van-body',[
    [-2.45,.42,1.00,.72],[-2.37,.39,1.93,.94],[-2.16,.39,2.00,.98],[-.46,.39,2.00,.98],
    [.02,.39,1.96,.95],[.30,.39,1.75,.91],[.56,.39,1.40,.88],[.91,.40,1.23,.89],
    [1.65,.43,1.19,.86],[2.12,.45,1.07,.77],[2.31,.55,.96,.68]
  ],.48);
  carPart(g,body,0,0,0,1,1,1,paint);
  const stripe=type==='firetruck'?'#f1b858':type==='swat'?'#7d90a6':'#49a593';
  for(const s of [-1,1]){
    carBox(g,-.74,1.05,s*.974,2.90,.13,.028,stripe);
    carBox(g,-1.25,.66,s*.975,1.68,.25,.023,type==='firetruck'?'#b4a098':paint);
    for(let i=0;i<4;i++)if(type==='firetruck')carBox(g,-1.25,.57+i*.064,s*.992,1.58,.017,.012,'#716d73');
    if(type==='van'){
      carBox(g,-1.11,1.55,s*.972,1.53,.52,.022,'#ead9ad');
      for(let i=0;i<3;i++)carTrim(g,[-1.65+i*.26,1.45,s*.995],[-1.42+i*.26,1.66,s*.995],.027,'#99885a');
    }else carBox(g,-.46,1.56,s*.940,.68,.41,.035,'#5a8692');
    if(type!=='van')carBox(g,-1.47,1.56,s*.945,.66,.40,.035,type==='swat'?'#414858':'#6c99a0');
    carBox(g,.24,1.49,s*.883,.37,.34,.044,'#6e9ca1',0,0,-.22);
    carBall(g,1.9,1.03,s*.65,.23,.15,.19,paint);
    carBall(g,2.09,1.04,s*.66,.096,.10,.12,'#ffe4a1','glow');
    carBall(g,-2.389,1.14,s*.77,.075,.125,.12,carYarn.stop,'glow');
    lensThread(g,2.183,1.04,s*.66,.03);lensThread(g,-2.462,1.14,s*.77,.028);
    if(type==='ambulance'){
      carBox(g,-1.33,1.48,s*.969,.10,.34,.025,carCream);
      carBox(g,-1.33,1.48,s*.971,.32,.10,.027,carCream);
    }
    for(const xx of [-1.55,1.43])carBall(g,xx,.66,s*.83,.62,.26,.22,paint);
  }
  // Driver's forward glass leans from the roof down to the hood.
  carPanel(g,[[.634,1.314,-.75],[.634,1.314,.75],[.334,1.790,.71],[.334,1.790,-.71]],carYarn.frontPane);
  carBox(g,.48,1.56,0,.065,.548,.04,paint,0,0,.56);
  carGrille(g,2.266,.84,.47);carBumpers(g,2.34,-2.45,.97);
  carBox(g,-2.405,1.22,0,.040,1.09,.041,'#776a6d');
  for(const side of [-1,1]){
    const z=side*.39,x=-2.448;
    carPanel(g,[[x,1.42,z-.28],[x,1.42,z+.28],[x,1.79,z+.28],[x,1.79,z-.28]],carYarn.pane);
    lacedSeam(g,[x,1.06,z-.24],[x,1.06,z+.24],3);
  }
  if(type==='ambulance'){
    carBox(g,-2.456,1.14,0,.026,.36,.10,carYarn.thread);
    carBox(g,-2.457,1.14,0,.028,.11,.35,carYarn.thread);
  }
  if(type==='firetruck'){
    for(const s of [-1,1])carTrim(g,[-2.29,2.11,s*.32],[.20,2.11,s*.32],.050,carCloth);
    for(let j=0;j<9;j++)carTrim(g,[-2.13+j*.27,2.11,-.32],[-2.13+j*.27,2.11,.32],.025,carCloth);
  }
  if(type==='swat')for(let j=0;j<3;j++)carBox(g,-1.89+j*.48,2.00,0,.29,.13,1.1,'#3b424d');
}
const spoolWelt=new THREE.TorusGeometry(1,.045,4,24);
function buttonWheel(g,r,side){
  carPart(g,spoolWelt,0,0,side*.121,r*.86,r*.86,.23,carYarn.welt);
  for(let i=0;i<8;i++){
    const theta=Math.PI*i*.25;
    carBox(g,Math.cos(theta)*r*.65,Math.sin(theta)*r*.65,side*.153,.066,.021,.016,carYarn.brass,0,0,theta+.82);
  }
}
function carWheel(radius,side,service) {
  const wheel=new THREE.Group();
  carButton(wheel,0,0,0,radius,.205,'#2e2d3a');
  carButton(wheel,0,0,side*.098,radius*.77,.034,service==='swat'?'#6f7480':carCream);
  carButton(wheel,0,0,side*.125,radius*.56,.034,'#777780');
  carButton(wheel,0,0,side*.148,radius*.38,.032,'#b5ac9a');
  carButton(wheel,0,0,side*.168,radius*.12,.025,'#e5cfb2');
  for(let k=0;k<3;k++){
    const angle=k*Math.PI*2/3;
    carBall(wheel,Math.cos(angle)*radius*.41,Math.sin(angle)*radius*.41,side*.161,.026,.026,.012,'#545766');
  }
  buttonWheel(wheel,radius,side);
  batchGroup(wheel);return wheel;
}
function carServiceDetails(g,type,isVan){
  const height=isVan?2.03:1.72;
  if(type==='taxi') {
    carBox(g,-.04,height+.10,0,.34,.17,.56,'#f7de9c');
    carBox(g,.138,height+.11,0,.012,.067,.30,'#78613d');
    return null;
  }
  if(!['police','ambulance','firetruck','swat'].includes(type))return null;
  const y=height+.08, x=isVan?-.14:.05;
  carBox(g,x,y,0,.27,.080,.88,'#3d3c4c');
  const beacon=new THREE.Group();
  beacon.position.set(x,y+.119,0);
  for(const s of [-1,1]){
    const tint=type==='firetruck' && s<0?'#f9a372':'#68d4fa';
    carBall(beacon,0,0,s*.280,.116,.105,.144,tint,'glow');
  }
  batchGroup(beacon);
  g.add(beacon);return beacon;
}
export function createCar(type='car',color,seed=0){
  type=String(type?.type??type).toLowerCase();
  if(isStreetVehicle(type))return createStreetVehicle(THREE,{geo,addPart,batchGroup},type,color,seed);
  if(type==='fire'||type==='firefighter')type='firetruck';
  if(type==='medic')type='ambulance';
  if(type==='cop')type='police';
  const index=(Math.abs(Number(seed)||0)*1741)|0, variant=Math.abs(index)%carPaint.length;
  const supplied=typeof color==='string' && /^#(?:[0-9a-f]{3}){1,2}$/i.test(color);
  const isVan=['van','firetruck','swat','ambulance'].includes(type),bus=type==='bus';
  const shaped=type==='compact'||type==='sport';
  const spec=vehicleSpec(type);
  const paint=fleetPaint[type] || (supplied ? color : carPaint[variant]);
  const group=new THREE.Group(),frame=new THREE.Group(),body=new THREE.Group();
  group.name='Maille véhicule '+type;body.name='Carrosserie';
  group.add(frame);frame.add(body);
  if(bus)cityBus(body,paint);
  else if(shaped)townCar(body,type,paint);
  else if(isVan)carVan(body,type,paint);
  else carChassis(body,paint,type,variant);
  if(!bus&&!shaped){
    const sourceLength=isVan?2.54:2.06,sourceWidth=isVan?1.10:.97;
    frame.scale.set(spec.halfLength/sourceLength,spec.height/(isVan?2.30:type==='taxi'||type==='police'?1.93:1.72),spec.halfWidth/sourceWidth);
  }
  const beacon=carServiceDetails(body,type,isVan);
  batchGroup(body);
  const wheelRadius=bus?.48:isVan?.434:type==='compact'?.304:type==='sport'?.34:.372;
  const axleZ=bus?1.10:isVan?.94:type==='compact'?.68:type==='sport'?.82:.805;
  const axles=bus?[-2.50,2.73]:isVan?[-1.54,1.45]:type==='compact'?[-1.06,1.03]:type==='sport'?[-1.31,1.36]:[-1.22,1.25];
  const wheels=[];
  for(const x of axles)for(const s of [-1,1]){
    const wheel=carWheel(wheelRadius,s,type);
    wheel.userData.front=x>0;
    wheel.position.set(x,wheelRadius,s*axleZ);
    frame.add(wheel);wheels.push(wheel);
  }
  let spin=0,previousSpeed=0,lastHeading=null,pitch=0,roll=0,compression=0,steer=0;
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  function update(pose={},dt=.016,time=0){
    dt=clamp(Number(dt)||.016,.001,.09);const t=Number(time)||0;
    const speed=Number.isFinite(pose.speed)?pose.speed:pose.moving?6:0;
    const heading=Number.isFinite(pose.angle)?pose.angle:null;
    let steering=Number(pose.steer??pose.turn)||0;
    if(!steering && heading!==null && lastHeading!==null)steering=clamp(Math.atan2(Math.sin(heading-lastHeading),Math.cos(heading-lastHeading))/dt*.36,-1,1);
    if(heading!==null)lastHeading=heading;
    const blend=1-Math.exp(-9*dt),velocity=Math.min(1,Math.abs(speed)/14);
    steer+=(clamp(steering,-1,1)*.42-steer)*blend;
    const acceleration=clamp((speed-previousSpeed)/dt,-14,14);previousSpeed=speed;
    pitch+=((acceleration*.0018-(pose.brake?.042:0))-pitch)*blend;
    roll+=(steer*velocity*.22-roll)*blend;
    compression+=(Math.min(.14,Math.abs(Number(pose.impact)||0)*.12)-compression)*Math.min(1,dt*15);
    body.position.y=(Math.sin(t*(4+velocity*5)+variant)*.009+Math.sin(t*13+variant)*.004)*velocity-compression*.26;
    body.scale.set(1+compression*.12,1-compression*.6,1+compression*.34);
    body.rotation.z=pitch;body.rotation.x=roll;
    spin-=speed*dt/wheelRadius;
    for(const wheel of wheels){wheel.rotation.order='YXZ';wheel.rotation.y=wheel.userData.front?-steer:0;wheel.rotation.z=spin;}
    if(beacon){
      // The little purls of the beacon breathe without changing anyone else's shared material.
      const flash=pose.siren===false?.18:(Math.sin(t*11.5+variant)>0?1:.45);
      beacon.scale.set(1,.74+.33*flash,1);
    }
  }
  update({},.016,0);
  return {group,update,dispose(){
    group.traverse(o=>{if(o.isMesh && o.geometry && !Object.values(geo).includes(o.geometry) && ![...carShapeCache.values()].includes(o.geometry))o.geometry.dispose();});
    group.removeFromParent();
  }};
}
