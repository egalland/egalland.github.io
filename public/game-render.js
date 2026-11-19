import {makeEmoteIcon} from './emote-art.js';
import {textileSky,sunBearing} from './textile-sky.js';
import {createBleedFibers} from './bleed-fibers.js';
import {createBleedMesh} from './bleed-mesh.js';
import {fiberLifetime,impactFibers} from './puppet-combat.js';
import {terrainHeight,terrainGradient,walkingPose} from './terrain-height.js';
import {buildShotEffect,effectDuration} from './weapon-effects.js';
import {propDebris} from './prop-wear.js';
import { vehicleSpec } from './vehicle-types.js';
import * as THREE from './three.js';
import { createCity3D } from './city3d.js';
import { createPuppet, createCar } from './puppets3d.js';
import {appearanceKey,getKikalmoLook} from './kikalmo-avatar.js';
import {createKikalmoModel} from './kikalmo-model.js';
import { createCanvasView } from './canvas-view.js';
import { createPickupDisplay } from './pickup-models.js';
import { cameraDistance, nearbyProps } from './paris-world.js';

const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const blend = (k,dt) => 1-Math.exp(-k*dt);
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

function makeSky() {
  const texture=new THREE.CanvasTexture(textileSky());texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;texture.repeat.x=-1;texture.offset.x=.5;
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(4300,32,16),new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false}));
  sphere.renderOrder=-50;return sphere;
}
function makeShadow() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const c=canvas.getContext('2d'),g=c.createRadialGradient(32,32,1,32,32,32);
  g.addColorStop(0,'rgba(55,36,52,.7)');g.addColorStop(.55,'rgba(62,38,55,.42)');g.addColorStop(1,'rgba(62,38,55,0)');
  c.fillStyle=g;c.fillRect(0,0,64,64);
  const material=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,toneMapped:false});
  const geometry=new THREE.PlaneGeometry(1,1);geometry.rotateX(-Math.PI/2);
  const shadows=new THREE.InstancedMesh(geometry,material,65);shadows.frustumCulled=false;shadows.count=0;return shadows;
}
function hash(str){let n=2166136261;for(const ch of str){n=Math.imul(n^ch.charCodeAt(0),16777619);}return n>>>0;}

export function createView(canvas,spawn,onNotice) {
  let renderer;
  try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',alpha:false,stencil:false}); }
  catch(error) {
    console.warn('WebGL indisponible',error);
    return createCanvasView(canvas,spawn,onNotice);
  }
  const touch=matchMedia('(pointer:coarse)').matches;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#f0d9be');scene.fog=new THREE.FogExp2('#d1c2b2',.00066);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.00;
  const sky=makeSky();scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xfff1d7,0x8a8294,1.44));
  const sun=new THREE.DirectionalLight(0xffe2ad,1.92);sun.position.set(Math.cos(sunBearing),1.06,Math.sin(sunBearing));scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd8ebea,.69);fill.position.set(-.6,.47,-.9);scene.add(fill);
  const city=createCity3D(scene), pickupDisplay=createPickupDisplay(scene);
  const camera=new THREE.PerspectiveCamera(58,1,.08,6300);
  const shadows=makeShadow();scene.add(shadows);
  const shadowTransform=new THREE.Object3D(), projection=new THREE.Vector3(), cameraAim=new THREE.Vector3();
  let width=0,height=0, cameraArm=5.6, camX=spawn.x,camY=spawn.y, lastPropTick=-100,props=[],inFrame=0,slowCount=0,scale=touch?.94:1, active=true;
  const models=new Map(), names=new Map(), effects=[];
  const blood=createBleedFibers(),bloodMesh=createBleedMesh(scene);
  const labels=document.createElement('div');
  labels.style.cssText='position:absolute;inset:0;overflow:hidden;pointer-events:none;';
  canvas.after(labels);
  function resize(){
    const w=canvas.clientWidth||innerWidth,h=canvas.clientHeight||innerHeight;
    if(w===width&&h===height)return;
    width=w;height=h;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touch?1.15:1.4)*scale);
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=touch&&w<h?68:58;camera.updateProjectionMatrix();
  }
  function entity(e,dt,t){
    const vehicle=!!e.isCar,key=e.renderId||e.id;
    const look=!vehicle&&getKikalmoLook(e.appearance,0)?.art?appearanceKey(e.appearance):'';
    const id=vehicle?'car/'+e.type:look?'kikalmo/'+look:'puppet/'+e.type;
    let item=models.get(key);
    if(item && item.kind!==id){scene.remove(item.object.group);item.object.dispose?.();models.delete(key);item=null;}
    if(!item){const seed=hash(String(e.id))%65535;const object=look?createKikalmoModel(e.appearance,seed):(vehicle?createCar:createPuppet)(e.type,e.color,seed);item={kind:id,object};models.set(key,item);scene.add(object.group);}
    item.used=inFrame;const g=item.object.group;
    const angle=e.angle||0;
    g.position.set(e.x,terrainHeight(e.x,e.y)+(e.lift||0),e.y);
    g.rotation.set(0,-angle,0,'YXZ');
    if(vehicle){
      const slope=terrainGradient(e.x,e.y),c=Math.cos(angle),s=Math.sin(angle);
      g.rotation.z=Math.atan(slope.x*c+slope.y*s);g.rotation.x=-Math.atan(-slope.x*s+slope.y*c);
    }
    g.visible=true;
    item.object.update(vehicle?e:walkingPose(e),dt,t);
    return item;
  }
  function badge(e,label,bubble){
    let el=names.get(e.id);
    if(!el){el=document.createElement('span');el.className='world-label';labels.append(el);names.set(e.id,el);}
    el._used=inFrame;projection.set(e.x,terrainHeight(e.x,e.y)+(e.lift||0)+(e.isCar?vehicleSpec(e.type).height+.43:2.14),e.y);projection.project(camera);
    const visible=projection.z>0&&projection.z<1&&Math.abs(projection.x)<1.1&&Math.abs(projection.y)<1;
    el.hidden=!visible;if(!visible)return;
    el.style.left=(50+50*projection.x)+'%';el.style.top=(50-50*projection.y)+'%';
    if(el._label!==label||el._bubble!==bubble){
      el._label=label;el._bubble=bubble;
      const art=bubble&&makeEmoteIcon(label);
      el.classList.toggle('world-emote',!!art);
      if(art){el.replaceChildren(art);el.setAttribute('aria-label',label);}
      else{el.textContent=label;el.removeAttribute('aria-label');}
    }
  }
  function effect(kind,x,y,angle=0,len=0,colors=[],lift=0) {
    if(!active || effects.length>42)return;
    const debris=propDebris(kind,colors?.type,angle);
    if(kind==='meleeImpact'||debris){
      const height=terrainHeight(x,y)+lift+(debris?.height||0),duration=debris?.lifetime??fiberLifetime;
      for(const strand of debris?.strands||impactFibers(angle,len)){
        const curve=new THREE.CatmullRomCurve3(strand.points.map(v=>new THREE.Vector3(...v)));
        const geo=new THREE.TubeGeometry(curve,4,strand.thickness||.017,4,false);
        const mat=new THREE.MeshBasicMaterial({color:strand.color,transparent:true,depthWrite:false});
        const mesh=new THREE.Mesh(geo,mat),[vx,vy,vz]=strand.velocity;
        mesh.position.set(x,height,y);scene.add(mesh);
        effects.push({mesh,life:duration,max:duration,vx,vy,vz,fiber:true});
      }
      return;
    }
    if(kind!=='burst'){
      const duration=effectDuration(kind);
      for(const stroke of buildShotEffect(kind,x,y,angle,len)){
        const points=stroke.points.map(p=>new THREE.Vector3(p.x,terrainHeight(x,y)+lift+p.z,p.y));
        const geo=new THREE.BufferGeometry().setFromPoints(points);
        const mat=new THREE.LineBasicMaterial({color:stroke.color,transparent:true,depthWrite:false});
        const mesh=new THREE.Line(geo,mat);
        scene.add(mesh);effects.push({mesh,life:duration,max:duration});
      }
      return;
    }
    const palette=colors.length?colors:['#e69ea7','#ffdc9f','#8fcabf','#d6a787'];
    for(let i=0;i<7;i++){
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.09+Math.random()*.07),new THREE.MeshBasicMaterial({color:palette[i%palette.length],transparent:true}));
      m.position.set(x,terrainHeight(x,y)+lift+.3+Math.random()*.5,y);scene.add(m);
      const a=Math.random()*Math.PI*2,v=1.3+Math.random()*2;
      effects.push({mesh:m,life:.65,max:.65,vx:Math.cos(a)*v,vy:2+Math.random()*2.5,vz:Math.sin(a)*v});
    }
  }
  function render(state,dt,time) {
    if(!active || !canvas.isConnected)return;
    resize();inFrame++;
    const {p,car,yaw,pitch,destroyed}=state;
    // Tighten the boom immediately at walls, extend it gently after clearing a corner.
    const model=car?vehicleSpec(car.type):null;
    const follow=car?8.15+Math.max(0,model.halfLength-2)*1.24:5.25;
    const feet=car?0:p.lift||0;
    const focusY=feet+(car?Math.max(1.35,model.height*.77):1.17),lift=feet+(car?Math.max(2.92,model.height+1.05):2.18);
    const snap=state.snap || Math.hypot(camX-p.x,camY-p.y)>25 || inFrame===1;
    const f=snap?1:blend(car?11:19,dt);
    camX+=(p.x-camX)*f;camY+=(p.y-camY)*f;
    const goal=follow+(car?Math.min(2.25,Math.abs(state.speed)*.065):0),wantedY=lift+pitch*2.8,back=yaw+Math.PI;
    const ground=terrainHeight(camX,camY),groundBehind=terrainHeight(camX+Math.cos(back)*goal,camY+Math.sin(back)*goal);
    const available=clamp(cameraDistance(camX,camY,focusY,back,goal,wantedY,destroyed),.30,goal);
    cameraArm=snap?available:Math.min(available,cameraArm+(available-cameraArm)*blend(6,dt));
    const armHeight=ground+focusY+(groundBehind-ground+wantedY-focusY)*cameraArm/goal;
    camera.position.set(camX+Math.cos(back)*cameraArm,armHeight+.12,camY+Math.sin(back)*cameraArm);
    const aimForward=car?6.3:4.15;
    cameraAim.set(camX+Math.cos(yaw)*aimForward,terrainHeight(camX+Math.cos(yaw)*aimForward,camY+Math.sin(yaw)*aimForward)+focusY+pitch*.95,camY+Math.sin(yaw)*aimForward);
    camera.lookAt(cameraAim);camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    if(time-lastPropTick>.30 || snap){props=nearbyProps(p.x,p.y,320);lastPropTick=time;}
    city.update(p,time,{props,destroyed,propHealth:state.propHealth,propDamageRevision:state.propDamageRevision});
    pickupDisplay.update(state.pickups,p,time);
    const candidates=state.entities.filter(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)).sort((a,b)=>distance(a,p)-distance(b,p));
    const lowPower=scale<.81;
    const carLimit=lowPower?4:touch?6:8, pedestrianLimit=lowPower?5:touch?7:9;
    let npcs=0,cars=0,index=0;
    blood.begin(time,state.epoch??Date.now());bloodMesh.begin();
    for(const e of candidates) {
      const d=distance(e,p),critical=e.self||e.peer;
      if(!critical && (d>(e.isCar?115:68) || (e.isCar?cars>=carLimit:npcs>=pedestrianLimit)))continue;
      if(critical && !e.self && d>210)continue;
      if(e.isCar)cars++;else npcs++;
      entity(e,dt,time);
      if(d<42)bloodMesh.draw(blood.actor(e));
      if(index<65){
        const floor=e.supportHeight||0,angle=e.angle||0,c=Math.cos(angle),s=Math.sin(angle);
        const slope=floor>.12?{x:0,y:0}:terrainGradient(e.x,e.y);
        const scale=1/(1+.08*Math.max(0,(e.lift||0)-floor));
        shadowTransform.position.set(e.x,terrainHeight(e.x,e.y)+floor+.10,e.y);
        shadowTransform.rotation.set(-Math.atan(-slope.x*s+slope.y*c),-angle,Math.atan(slope.x*c+slope.y*s),'YXZ');
        const footprint=e.isCar?vehicleSpec(e.type):null;
        shadowTransform.scale.set(scale*(footprint?footprint.halfLength*2.1:1.1),1,scale*(footprint?footprint.halfWidth*2.2:.74));
        shadowTransform.updateMatrix();shadows.setMatrixAt(index++,shadowTransform.matrix);
      }
      if(e.bubble || (e.peer && d<48))badge(e,e.bubble||e.name,!!e.bubble);
    }
    blood.eachDrop((id,center,strands)=>bloodMesh.draw(strands));bloodMesh.finish();
    shadows.count=index;shadows.instanceMatrix.needsUpdate=true;
    for(const [key,v] of models)if(v.used!==inFrame){
      v.object.group.visible=false;
      if(inFrame-v.used>160 || models.size>60){scene.remove(v.object.group);v.object.dispose?.();models.delete(key);}
    }
    for(const [key,el] of names)if(el._used!==inFrame){el.remove();names.delete(key);}
    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];e.life-=dt;
      if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);continue;}
      if(e.vy!==undefined){e.vy-=7*dt;e.mesh.position.x+=e.vx*dt;e.mesh.position.z+=e.vz*dt;e.mesh.position.y=Math.max(terrainHeight(e.mesh.position.x,e.mesh.position.z)+.02,e.mesh.position.y+e.vy*dt);if(!e.fiber)e.mesh.rotation.z+=dt*6;}
      e.mesh.material.opacity=Math.min(1,e.life*(e.fiber?10:5));
    }
    renderer.render(scene,camera);
    if(dt>.049)slowCount++;else slowCount=Math.max(0,slowCount-.5);
    if(slowCount>55 && scale>.68){scale=Math.max(.68,scale-.12);width=0;slowCount=0;}
  }
  // World (east, south, elevation) to the last drawn viewport; depth is along the camera axis in metres.
  function projectTarget(x,y,elevation=1){
    if(!active||!inFrame||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(elevation))return null;
    projection.set(x,terrainHeight(x,y)+elevation,y).applyMatrix4(camera.matrixWorldInverse);
    const depth=-projection.z;
    if(depth<camera.near||depth>camera.far)return null;
    projection.applyMatrix4(camera.projectionMatrix);
    if(Math.abs(projection.x)>1||Math.abs(projection.y)>1)return null;
    return {x:(1+projection.x)/2,y:(1-projection.y)/2,depth};
  }
  const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.87),point=new THREE.Vector3();
  function aim(x,y,p){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return null;
    ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);
    floor.constant=-(terrainHeight(p.x,p.y)+(p.lift||0)+.87);
    if(ray.ray.intersectPlane(floor,point)&&point.distanceTo(camera.position)<160)return Math.atan2(point.z-p.y,point.x-p.x);
    return Math.atan2(ray.ray.direction.z,ray.ray.direction.x);
  }
  function contextLost(event){event.preventDefault();active=false;onNotice('Affichage 3D interrompu. Recharge la page pour reprendre.');}
  canvas.addEventListener('webglcontextlost',contextLost);
  return {available:true,mode:'webgl',render,aim,projectTarget,effect,dispose(){
    active=false;canvas.removeEventListener('webglcontextlost',contextLost);labels.remove();
    for(const item of models.values())item.object.dispose?.();
    bloodMesh.dispose();pickupDisplay.dispose();city.dispose?.();
    sky.geometry.dispose();sky.material.map.dispose();sky.material.dispose();renderer.dispose();
  }};
}
