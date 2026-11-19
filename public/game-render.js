import * as THREE from './three.js';
import { createCity3D } from './city3d.js';
import { createPuppet, createCar } from './puppets3d.js';
import { createCanvasView } from './canvas-view.js';
import { cameraDistance, nearbyProps } from './paris-world.js';

const clamp = (v,a,b) => Math.min(b,Math.max(a,v));
const blend = (k,dt) => 1-Math.exp(-k*dt);
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

function makeSky() {
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=512;
  const ctx=canvas.getContext('2d'), sky=ctx.createLinearGradient(0,0,0,512);
  for(const [p,c] of [[0,'#8782ad'],[.27,'#b3a2c6'],[.42,'#e9b8bd'],[.51,'#ffd8b5'],[.64,'#e3baaf'],[1,'#c6a8a1']])sky.addColorStop(p,c);
  ctx.fillStyle=sky;ctx.fillRect(0,0,1536,512);
  let seed=1287;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let n=0;n<100;n++){
    const x=random()*1536,y=122+random()*104,w=5+random()*38,h=w*(.07+random()*.05),color=y<169?'#d8bbcb':'#ffe1cc';
    ctx.fillStyle=color;ctx.globalAlpha=.35+random()*.25;
    for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+j*w*.31,y+Math.sin(j)*h*.48,w*(.49+random()*.24),h*(.5+random()*.7),-.02,0,Math.PI*2);ctx.fill();}
  }
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
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
  scene.background=new THREE.Color('#ecc6b5');scene.fog=new THREE.FogExp2('#dfbdb1',.00069);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
  const sky=makeSky();scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xffe6cf,0x978885,1.65));
  const sun=new THREE.DirectionalLight(0xffdcac,2.15);sun.position.set(-.38,.92,-.7);scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe7dbff,.54);fill.position.set(.3,.5,1);scene.add(fill);
  const city=createCity3D(scene);
  const camera=new THREE.PerspectiveCamera(58,1,.08,6300);
  const shadows=makeShadow();scene.add(shadows);
  const shadowTransform=new THREE.Object3D(), projection=new THREE.Vector3(), cameraAim=new THREE.Vector3();
  let width=0,height=0, cameraArm=5.6, camX=spawn.x,camY=spawn.y, lastPropTick=-100,props=[],inFrame=0,slowCount=0,scale=touch?.94:1, active=true;
  const models=new Map(), names=new Map(), effects=[];
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
    const vehicle=!!e.isCar,key=e.renderId||e.id,id=vehicle?'car/'+e.type:'puppet/'+e.type;
    let item=models.get(key);
    if(item && item.kind!==id){scene.remove(item.object.group);item.object.dispose?.();models.delete(key);item=null;}
    if(!item){const object=(vehicle?createCar:createPuppet)(e.type,e.color,hash(String(e.id))%65535);item={kind:id,object};models.set(key,item);scene.add(object.group);}
    item.used=inFrame;const g=item.object.group;
    g.position.set(e.x,0,e.y);g.rotation.y=-(e.angle||0);g.visible=true;
    item.object.update(e,dt,t);
    return item;
  }
  function badge(e,label,bubble){
    let el=names.get(e.id);
    if(!el){el=document.createElement('span');el.style.cssText='position:absolute;transform:translate(-50%,-100%);font:650 11px system-ui;color:#fff3e5;background:#251f30df;border:1px solid #a68ba48a;border-radius:5px;padding:2px 6px;white-space:nowrap;text-shadow:0 1px #302735;';labels.append(el);names.set(e.id,el);}
    el._used=inFrame;projection.set(e.x,e.isCar?2.25:2.14,e.y);projection.project(camera);
    const visible=projection.z>0&&projection.z<1&&Math.abs(projection.x)<1.1&&Math.abs(projection.y)<1;
    el.hidden=!visible;if(!visible)return;
    el.style.left=(50+50*projection.x)+'%';el.style.top=(50-50*projection.y)+'%';
    el.style.fontSize=bubble?'20px':'11px';if(el.textContent!==label)el.textContent=label;
  }
  function effect(kind,x,y,angle=0,len=0,colors=[]) {
    if(!active || effects.length>42)return;
    if(kind==='shot' || kind==='yarn' || kind==='fist'){
      const trace=new THREE.BufferGeometry(),pts=[];
      const steps=kind==='yarn'?15:1;
      for(let i=0;i<=steps;i++){const f=i/steps;const curve=kind==='yarn'?Math.sin(f*15)*Math.sin(Math.PI*f)*.22:0;pts.push(new THREE.Vector3(x+Math.cos(angle)*len*f-Math.sin(angle)*curve,1.02+curve*.3,y+Math.sin(angle)*len*f+Math.cos(angle)*curve));}
      trace.setFromPoints(pts);
      const material=new THREE.LineBasicMaterial({color:kind==='yarn'?0xff9cc3:0xffda91,transparent:true,depthWrite:false});
      const line=new THREE.Line(trace,material);scene.add(line);effects.push({mesh:line,life:kind==='yarn'?.28:.12,max:kind==='yarn'?.28:.12});
      return;
    }
    const palette=colors.length?colors:['#e69ea7','#ffdc9f','#8fcabf','#d6a787'];
    for(let i=0;i<7;i++){
      const m=new THREE.Mesh(new THREE.IcosahedronGeometry(.09+Math.random()*.07),new THREE.MeshBasicMaterial({color:palette[i%palette.length],transparent:true}));
      m.position.set(x,.3+Math.random()*.5,y);scene.add(m);
      const a=Math.random()*Math.PI*2,v=1.3+Math.random()*2;
      effects.push({mesh:m,life:.65,max:.65,vx:Math.cos(a)*v,vy:2+Math.random()*2.5,vz:Math.sin(a)*v});
    }
  }
  function render(state,dt,time) {
    if(!active || !canvas.isConnected)return;
    resize();inFrame++;
    const {p,car,yaw,pitch,destroyed}=state;
    // Tighten the boom immediately at walls, extend it gently after clearing a corner.
    const follow=car?8.15:5.25, focusY=car?1.35:1.17, lift=car?2.92:2.18;
    const snap=state.snap || Math.hypot(camX-p.x,camY-p.y)>25 || inFrame===1;
    const f=snap?1:blend(car?11:19,dt);
    camX+=(p.x-camX)*f;camY+=(p.y-camY)*f;
    const goal=follow+(car?Math.min(2.25,Math.abs(state.speed)*.065):0),wantedY=lift+pitch*2.8,back=yaw+Math.PI;
    const available=clamp(cameraDistance(camX,camY,focusY,back,goal,wantedY,destroyed),.30,goal);
    cameraArm=snap?available:Math.min(available,cameraArm+(available-cameraArm)*blend(6,dt));
    const armHeight=focusY+(wantedY-focusY)*cameraArm/goal;
    camera.position.set(camX+Math.cos(back)*cameraArm,armHeight+.12,camY+Math.sin(back)*cameraArm);
    const aimForward=car?6.3:4.15;
    cameraAim.set(camX+Math.cos(yaw)*aimForward,focusY+pitch*.95,camY+Math.sin(yaw)*aimForward);
    camera.lookAt(cameraAim);camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    if(time-lastPropTick>.30 || snap){props=nearbyProps(p.x,p.y,320);lastPropTick=time;}
    city.update(p,time,{props,destroyed});
    const candidates=state.entities.filter(e=>Number.isFinite(e.x)&&Number.isFinite(e.y)).sort((a,b)=>distance(a,p)-distance(b,p));
    const lowPower=scale<.81;
    const carLimit=lowPower?4:touch?6:8, pedestrianLimit=lowPower?5:touch?7:9;
    let npcs=0,cars=0,index=0;
    for(const e of candidates) {
      const d=distance(e,p),critical=e.self||e.peer;
      if(!critical && (d>(e.isCar?115:68) || (e.isCar?cars>=carLimit:npcs>=pedestrianLimit)))continue;
      if(critical && !e.self && d>210)continue;
      if(e.isCar)cars++;else npcs++;
      entity(e,dt,time);
      if(index<65){
        shadowTransform.position.set(e.x,.052,e.y);
        shadowTransform.rotation.set(0,-(e.angle||0),0);
        shadowTransform.scale.set(e.isCar?4.35:1.1,1,e.isCar?2.05:.74);
        shadowTransform.updateMatrix();shadows.setMatrixAt(index++,shadowTransform.matrix);
      }
      if(e.bubble || (e.peer && d<48))badge(e,e.bubble||e.name,!!e.bubble);
    }
    shadows.count=index;shadows.instanceMatrix.needsUpdate=true;
    for(const [key,v] of models)if(v.used!==inFrame){
      v.object.group.visible=false;
      if(inFrame-v.used>160 || models.size>60){scene.remove(v.object.group);v.object.dispose?.();models.delete(key);}
    }
    for(const [key,el] of names)if(el._used!==inFrame){el.remove();names.delete(key);}
    for(let i=effects.length-1;i>=0;i--){
      const e=effects[i];e.life-=dt;
      if(e.life<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1);continue;}
      if(e.vy!==undefined){e.vy-=7*dt;e.mesh.position.x+=e.vx*dt;e.mesh.position.z+=e.vz*dt;e.mesh.position.y=Math.max(.02,e.mesh.position.y+e.vy*dt);e.mesh.rotation.z+=dt*6;}
      e.mesh.material.opacity=Math.min(1,e.life*5);
    }
    renderer.render(scene,camera);
    if(dt>.049)slowCount++;else slowCount=Math.max(0,slowCount-.5);
    if(slowCount>55 && scale>.68){scale=Math.max(.68,scale-.12);width=0;slowCount=0;}
  }
  const ray=new THREE.Raycaster(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),-.87),point=new THREE.Vector3();
  function aim(x,y,p){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return null;
    ray.setFromCamera(new THREE.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),camera);
    if(ray.ray.intersectPlane(floor,point)&&point.distanceTo(camera.position)<160)return Math.atan2(point.z-p.y,point.x-p.x);
    return Math.atan2(ray.ray.direction.z,ray.ray.direction.x);
  }
  function contextLost(event){event.preventDefault();active=false;onNotice('Affichage 3D interrompu. Recharge la page pour reprendre.');}
  canvas.addEventListener('webglcontextlost',contextLost);
  return {available:true,mode:'webgl',render,aim,effect,dispose(){
    active=false;canvas.removeEventListener('webglcontextlost',contextLost);labels.remove();
    for(const item of models.values())item.object.dispose?.();
    city.dispose?.();renderer.dispose();
  }};
}
