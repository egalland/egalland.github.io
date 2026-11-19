import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {SVGRenderer} from './vendor/SVGRenderer.js';

export function mountPanel(host,circuits,selected){
 let renderer;
 try{
  renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 }catch{
  renderer=new SVGRenderer();
  renderer.setPrecision(2);
  renderer.setClearColor(new THREE.Color('#eae7df'));
 }
 const scene=new THREE.Scene(),parts=new THREE.Group(),devices=new THREE.Group();
 const camera=new THREE.PerspectiveCamera(36,1,.1,100);
 scene.background=new THREE.Color('#eae7df');
 scene.add(parts,devices,new THREE.HemisphereLight(0xffffff,0x9e9183,2.25));
 const sun=new THREE.DirectionalLight(0xfff1dc,2.5);
 sun.position.set(-5,8,10);scene.add(sun);
 const materials=new Map();
 function box(parent,w,h,d,x,y,z,color,metalness=0){
  if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.67,metalness}));
  const part=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),materials.get(color));
  part.position.set(x,y,z);
  parent.add(part);
 }
 // Coffret, rails et silhouette des modules repris de l’Atelier Tableau Siemens 3D.
 box(parts,6.4,8.2,.18,0,0,-.35,0xd6caa9);
 box(parts,6.08,7.88,.22,0,0,-.15,0xe8e8de);
 for(const side of [-1,1]){
  box(parts,.12,7.75,.4,side*3,0,.05,0xbabbb3);
  box(parts,5.95,.16,.36,0,side*3.86,.04,0xbabbb3);
 }
 for(let row=0;row<4;row++){
  const y=2.35-row*1.65;
  box(parts,5.65,.31,.12,0,y,0,0x9ca7aa,.55);
  for(let slot=0;slot<13;slot++){
   const i=row*13+slot,x=-2.65+slot*.405+.19;
   if(!circuits[i])continue;
   const module=new THREE.Group();
   module.position.set(x,y,.45);
   devices.add(module);
   box(module,.38,1.04,.58,0,0,0,i===selected?0xff673e:0xf4f3e9);
   box(module,.335,.09,.025,0,.39,.307,i===selected?0x9c361e:0x4b8d8a);
   box(module,.255,.29,.12,0,-.11,.31,0x2e322f);
  }
 }
 const view=renderer.domElement;
 view.setAttribute('aria-hidden','true');host.append(view);
 const controls=new OrbitControls(camera,view);
 controls.enablePan=false;controls.minDistance=8;controls.maxDistance=42;
 const render=()=>renderer.render(scene,camera);
 let angle='iso';
 const setView=next=>{
  angle=next;
  const fit=Math.max(1,.85/camera.aspect);
  camera.position.set(...(angle==='front'?[0,0,15*fit]:[7*fit,4*fit,14*fit]));
  controls.update();render();
 };
 controls.addEventListener('change',render);
 const resize=new ResizeObserver(()=>{
  const width=host.clientWidth,height=host.clientHeight;
  if(!width||!height)return;
  camera.aspect=width/height;
  camera.updateProjectionMatrix();
  renderer.setSize(width,height);
  setView(angle);
 });
 resize.observe(host);setView(angle);
 return {
  setView,
  explode(on){devices.position.z=on?.9:0;render();},
  destroy(){
   resize.disconnect();
   controls.dispose();
   scene.traverse(mesh=>mesh.geometry?.dispose());
   materials.forEach(item=>item.dispose());
   renderer.dispose?.();
   view.remove();
  }
 };
}
