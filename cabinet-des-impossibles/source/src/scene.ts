import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Cabinet, Curiosity, Behavior } from './model';

type Exhibit={root:T.Group; art:T.Group; item:Curiosity; pieces:T.Object3D[]; wings:T.Group[]; curtains:T.Mesh[]; shield:T.Group; stars:T.Group; halo:T.Mesh; amounts:Record<string,number>; active:Set<Behavior>; selected:T.Mesh;};
const metal=(color:string|number)=>new T.MeshStandardMaterial({color,metalness:.72,roughness:.3});
const matte=(color:string|number)=>new T.MeshStandardMaterial({color,roughness:.75});
function mesh(g:T.BufferGeometry,m:T.Material,parent:T.Object3D,x=0,y=0,z=0){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
function box(p:T.Object3D,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);}
function ball(p:T.Object3D,m:T.Material,r:number,x=0,y=0,z=0){return mesh(new T.SphereGeometry(r,24,18),m,p,x,y,z);}
function ring(p:T.Object3D,m:T.Material,r:number,t:number,x=0,y=0,z=0){return mesh(new T.TorusGeometry(r,t,10,72),m,p,x,y,z);}
function labelTexture(text:string,small='CABINET DES IMPOSSIBLES'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d')!;c.fillStyle='#b89c71';c.fillRect(0,0,512,128);c.fillStyle='#242822';c.textAlign='center';c.font='26px Georgia';c.fillText(text.substring(0,30),256,56);c.font='13px sans-serif';c.fillText(small,256,92);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
}
function artFor(item:Curiosity){
 const root=new T.Group(), gold=metal(item.color), dark=matte('#23312e'), ivory=matte('#e0d7bd');
 const pieces:T.Object3D[]=[],wings:T.Group[]=[],curtains:T.Mesh[]=[];
 if(item.shape==='bird'){
  const body=mesh(new T.OctahedronGeometry(.48,0),gold,root,0,.16,0);body.scale.set(.64,1.15,1.22);body.rotation.x=.3;
  ball(root,gold,.22,0,.65,.25);const beak=mesh(new T.ConeGeometry(.10,.34,4),gold,root,0,.63,.53);beak.rotation.x=Math.PI/2;
  for(const sign of [-1,1]){
   ball(root,matte('#111b17'),.035,sign*.17,.69,.36);
   const wing=new T.Group();wing.position.set(sign*.18,.28,-.05);root.add(wing);wings.push(wing);
   for(let i=0;i<6;i++){const f=mesh(new T.ConeGeometry(.14,1.25-i*.09,3),gold,wing,sign*(.28+i*.115),.18-i*.10,-i*.045);f.rotation.z=sign*(-.9-i*.09);f.rotation.x=-.22;}
   const foot=box(root,gold,.06,.4,.06,sign*.15,-.38,.04);foot.rotation.x=.12;box(root,gold,.15,.04,.24,sign*.15,-.57,.13);
  }
  for(let i=0;i<3;i++){const tail=mesh(new T.ConeGeometry(.1,.85,3),gold,root,(i-1)*.12,-.1,-.56);tail.rotation.x=-1.15;}
 }else if(item.shape==='orb'){
  for(let i=0;i<8;i++){
   const s=mesh(new T.SphereGeometry(.72,18,12,(i%4)*Math.PI/2+.055,Math.PI/2-.11,Math.floor(i/4)*Math.PI/2+.04,Math.PI/2-.08),ivory,root);
   s.position.set(Math.sin(i*Math.PI/2+.7)*.18,i<4?.12:-.1,Math.cos(i*Math.PI/2+.7)*.18);s.userData.home=s.position.clone();pieces.push(s);
  }
  const core=ball(root,new T.MeshStandardMaterial({color:'#f2c37d',emissive:'#e6a841',emissiveIntensity:1.3,metalness:.6,roughness:.2}),.57);core.name='core';
  const orbit=ring(root,gold,.99,.018);orbit.rotation.x=1;orbit.rotation.y=.3;
 }else if(item.shape==='chair'){
  const velvet=new T.MeshStandardMaterial({color:item.color,roughness:1});
  box(root,velvet,1.1,.3,.95,0,-.05,0);const back=box(root,velvet,1.1,1.15,.26,0,.48,-.38);back.rotation.x=-.12;
  for(const s of [-1,1]){box(root,gold,.09,.7,.09,s*.43,-.53,.31);box(root,gold,.09,.7,.09,s*.43,-.53,-.33);box(root,velvet,.22,.25,1.05,s*.58,.24,0);box(root,gold,.06,.4,.06,s*.58,.05,.3);}
  for(let x=0;x<3;x++)for(let y=0;y<3;y++)ball(root,gold,.025,(x-1)*.27,.24+y*.24,-.205);
 }else if(item.shape==='portal'){
  for(const s of [-1,1]){box(root,gold,.12,1.95,.2,s*.72,0,0);box(root,gold,1.56,.12,.2,0,s*.93,0);}
  box(root,dark,1.4,1.8,.08,0,0,-.08);
  const star=ring(root,gold,.42,.025,0,0,.01);star.rotation.x=.4;ring(root,gold,.3,.014,0,0,.02).rotation.y=.7;ball(root,gold,.12,0,0,.04);
  for(const s of [-1,1]){const curtain=box(root,new T.MeshStandardMaterial({color:'#314c45',roughness:.9}),.66,1.72,.06,s*.34,0,.12);curtains.push(curtain);for(let i=0;i<15;i++)box(curtain,gold,.07,.045,.035,-s*.31,-.75+i*.108,.05);}
  const pull=ring(root,gold,.09,.025,0,.68,.22);pull.scale.y=1.6;
 }else if(item.shape==='creature'){
  const b=ball(root,matte(item.color),.58,0,.05,0);b.scale.set(1,.92,.75);
  for(const s of [-1,1]){const eye=ball(root,ivory,.19,s*.24,.22,.38);eye.scale.z=.45;ball(root,matte('#101e1b'),.075,s*.24,.23,.48);const foot=ball(root,gold,.18,s*.31,-.5,.17);foot.scale.set(1.2,.5,1.5);}
  const crown=mesh(new T.ConeGeometry(.26,.5,5,1,true),gold,root,.19,.78,0);crown.rotation.z=-.3;
  box(root,dark,.18,.035,.03,.02,-.13,.44);
 }else if(item.shape==='trophy'){
  mesh(new T.CylinderGeometry(.32,.48,.15,32),gold,root,0,-.63,0);mesh(new T.CylinderGeometry(.08,.16,.7,20),gold,root,0,-.25,0);
  const cup=mesh(new T.SphereGeometry(.47,32,20,0,Math.PI*2,Math.PI/2,Math.PI/2),gold,root,0,.52,0);cup.rotation.x=Math.PI;
  const astre=mesh(new T.IcosahedronGeometry(.28,0),gold,root,0,.86,0);pieces.push(astre);
  for(const s of [-1,1]){const handle=ring(root,gold,.29,.045,s*.43,.33,0);handle.scale.x=.7;}
  const orb=ring(root,gold,.69,.025,0,.65,0);orb.rotation.y=.5;orb.rotation.x=.2;
 }else if(item.shape==='seed'){
  const seed=ball(root,gold,.22,0,-.38,0);seed.scale.y=1.3;
  const curve=new T.CatmullRomCurve3([new T.Vector3(0,-.3,0),new T.Vector3(-.06,.1,0),new T.Vector3(.15,.65,0)]);mesh(new T.TubeGeometry(curve,20,.025,8,false),gold,root);
  for(const s of [-1,1]){const leaf=ball(root,matte(item.color),.3,s*.22,.26+(s+1)*.15,0);leaf.scale.set(1,.35,.6);leaf.rotation.z=s*.6;}
  const orbit=ring(root,gold,.78,.016);orbit.rotation.y=Math.PI/2;ring(root,gold,.78,.016);
  for(const sign of [-1,1]){
   const path=new T.CatmullRomCurve3([new T.Vector3(sign*.62,-.65,.08),new T.Vector3(sign*.78,-.05,.05),new T.Vector3(sign*.64,.55,.02),new T.Vector3(sign*.24,.95,0)]);
   const geometry=new T.TubeGeometry(path,28,.13,10,false);const positions=geometry.attributes.position;
   for(let i=0;i<=28;i++){const center=path.getPointAt(i/28);for(let j=0;j<=10;j++){const index=i*11+j;const p=new T.Vector3().fromBufferAttribute(positions,index).sub(center).multiplyScalar(1-i/28*.98).add(center);positions.setXYZ(index,p.x,p.y,p.z);}}geometry.computeVertexNormals();mesh(geometry,ivory,root);
  }
 }else{
  for(let i=0;i<24;i++){const r=ring(root,gold,.35+.09*Math.sin(i*.23),.043,Math.sin(i*.18)*.15,(i-12)*.07,0);r.rotation.x=Math.PI/2;r.userData.home=r.position.clone();pieces.push(r);}
 }
 if(item.behaviors.includes('zip')&&item.shape!=='portal'){
  for(const s of [-1,1]){const curtain=box(root,new T.MeshStandardMaterial({color:'#314c45',roughness:.9}),.66,1.72,.06,s*.34,0,.8);curtains.push(curtain);for(let i=0;i<15;i++)box(curtain,gold,.07,.045,.035,-s*.31,-.75+i*.108,.05);}
 }
 // Uploaded pictures become a physical, framed keepsake beside the sculpture.
 if(item.image){const tex=new T.TextureLoader().load(item.image);tex.colorSpace=T.SRGBColorSpace;const frame=new T.Group();frame.position.set(0,.25,.66);frame.rotation.x=-.05;root.add(frame);box(frame,gold,1.02,.83,.06);mesh(new T.PlaneGeometry(.92,.73),new T.MeshBasicMaterial({map:tex}),frame,0,0,.04);}
 root.children.forEach((child,i)=>{child.userData.rest=child.position.clone();child.userData.scatter=new T.Vector3(Math.sin(i*2.4)*.24,Math.cos(i*1.7)*.18,Math.sin(i*3.1)*.2);});
 return {root,pieces,wings,curtains};
}

export class Gallery {
 readonly renderer:T.WebGLRenderer;readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(42,1,.1,100);readonly controls:OrbitControls;
 private exhibits:Exhibit[]=[];private room=new T.Group();private ray=new T.Raycaster();private cursor=new T.Vector2();private animation=0;private last=0;private time=0;private observer:ResizeObserver;private current='';private focusTo:T.Vector3|null=null;private lookTo:T.Vector3|null=null;private wallMat=matte('#34433b');private floorMat=matte('#333c32');private ambient=new T.HemisphereLight('#d9e3cf','#382f28',2.7);private sun=new T.DirectionalLight('#ffdda2',3.2);private running=true;private dragging=false;private dragId='';private down={x:0,y:0};private plane=new T.Plane(new T.Vector3(0,1,0),0);private thumbnails=new Map<string,string>();
 reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;edit=false;onSelect:(id:string)=>void=()=>{};onMove:(id:string,x:number,z:number)=>void=()=>{};
 constructor(private container:HTMLElement){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.setClearColor('#192822');container.append(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','Salon en trois dimensions. Sélectionnez aussi les objets dans la collection sous la scène.');
  const pm=new T.PMREMGenerator(this.renderer),env=new RoomEnvironment();const target=pm.fromScene(env,.04);this.scene.environment=target.texture;env.dispose();pm.dispose();
  this.scene.fog=new T.FogExp2('#192822',.015);this.camera.position.set(10,8.4,16.5);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,1,0);this.controls.enableDamping=!this.reduced;this.controls.dampingFactor=.07;this.controls.minDistance=3;this.controls.maxDistance=27;this.controls.maxPolarAngle=Math.PI/2-.03;this.controls.minPolarAngle=.25;this.controls.minAzimuthAngle=-1.14;this.controls.maxAzimuthAngle=1.14;this.controls.enablePan=false;this.controls.addEventListener('start',()=>{this.focusTo=null;this.lookTo=null;});
  this.scene.add(this.ambient,this.sun);this.sun.position.set(0,10,6);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-10,right:10,top:8,bottom:-8,near:1,far:25});this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.025;
  this.makeRoom();this.scene.add(this.room);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
  this.renderer.domElement.addEventListener('pointerdown',e=>this.pointerDown(e));this.renderer.domElement.addEventListener('pointermove',e=>this.pointerMove(e));this.renderer.domElement.addEventListener('pointerup',e=>this.pointerUp(e));this.renderer.domElement.addEventListener('pointercancel',()=>this.cancelDrag());
  document.addEventListener('visibilitychange',()=>{this.last=0;if(!document.hidden&&!this.animation)this.loop(0);});
  this.loop(0);
 }
 private resize(){const {width,height}=this.container.getBoundingClientRect();this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
 private makeRoom(){
  const brass=metal('#a88b58'), stone=matte('#b9b5a1'),black=matte('#1f2c27');
  box(this.room,this.floorMat,16,.18,12,0,-.13,0);
  const tileGeo=new T.BoxGeometry(.96,.025,.96),tiles=new T.InstancedMesh(tileGeo,matte('#495045'),96);let n=0;const matrix=new T.Matrix4();for(let x=-8;x<8;x++)for(let z=-5;z<7;z++)if((x+z)%2===0){matrix.makeTranslation(x+.5,-.025,z-.5);tiles.setMatrixAt(n++,matrix);}tiles.receiveShadow=true;this.room.add(tiles);
  box(this.room,this.wallMat,16,6,.3,0,2.9,-5);box(this.room,this.wallMat,.3,6,10,-8,2.9,0);
  for(const y of [.15,1.12,4.9,5.7]){box(this.room,brass,16,.035,.10,0,y,-4.81);box(this.room,brass,.10,.035,10,-7.81,y,0);}
  for(let x=-7.5;x<8;x+=3){box(this.room,stone,.17,5.7,.22,x,2.8,-4.72);box(this.room,brass,.31,.12,.3,x,4.95,-4.62);box(this.room,brass,.31,.1,.3,x,.13,-4.62);}
  // Three recessed archways with luminous copper mouldings.
  for(const x of [-4.8,0,4.8]){
   const s=new T.Shape();s.moveTo(-1.65,0);s.lineTo(-1.65,2.55);s.absarc(0,2.55,1.65,Math.PI,0,true);s.lineTo(1.65,0);s.closePath();
   mesh(new T.ShapeGeometry(s,32),black,this.room,x,.4,-4.8);
   const pts=[];pts.push(new T.Vector3(x-1.66,.4,-4.72),new T.Vector3(x-1.66,2.95,-4.72));for(let i=0;i<=32;i++){const a=Math.PI-i/32*Math.PI;pts.push(new T.Vector3(x+Math.cos(a)*1.66,2.95+Math.sin(a)*1.66,-4.72));}pts.push(new T.Vector3(x+1.66,.4,-4.72));
   mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),80,.025,6,false),brass,this.room);
   const light=new T.PointLight('#f1c486',18,6,2);light.position.set(x,3.2,-3.85);this.room.add(light);
   box(this.room,new T.MeshStandardMaterial({color:'#ffe2a8',emissive:'#ffc86d',emissiveIntensity:2}),.055,1,.055,x,3.3,-4.6);
  }
  // A suspended astronomical dial on the rear wall.
  const dial=new T.Group();dial.position.set(0,3.05,-4.48);this.room.add(dial);
  ring(dial,brass,1.07,.018);ring(dial,brass,.94,.009);ring(dial,brass,.64,.012);const moon=ball(dial,metal('#c6b98b'),.35);moon.scale.z=.25;
  for(let i=0;i<48;i++){const a=i*Math.PI/24;const tick=box(dial,brass,.014,i%4===0?.12:.05,.02,Math.sin(a)*1.02,Math.cos(a)*1.02,.03);tick.rotation.z=-a;}
  // Side-wall framed studies and a warm floor lamp.
  for(const z of [-2,1,4]){box(this.room,brass,.07,1.5,1.2,-7.78,2.5,z);box(this.room,black,.08,1.37,1.07,-7.72,2.5,z);const r=ring(this.room,brass,.38,.015,-7.65,2.5,z);r.rotation.y=Math.PI/2;}
  const lamp=new T.Group();lamp.position.set(-6.9,0,3.7);this.room.add(lamp);mesh(new T.CylinderGeometry(.42,.5,.12,32),brass,lamp,0,.06,0);mesh(new T.CylinderGeometry(.035,.045,2.8,12),brass,lamp,0,1.4,0);mesh(new T.ConeGeometry(.62,.6,32,1,true),new T.MeshStandardMaterial({color:'#e2cda3',side:T.DoubleSide,emissive:'#b49a6b',emissiveIntensity:.15}),lamp,0,2.85,0);const lampLight=new T.PointLight('#ffc273',12,6);lampLight.position.set(-6.9,2.7,3.7);this.room.add(lampLight);
  const dust=new T.BufferGeometry(),positions=new Float32Array(240);for(let i=0;i<240;i+=3){positions[i]=Math.sin(i*12.78)*7;positions[i+1]=(Math.cos(i*2.4)+1)*2.3+.1;positions[i+2]=Math.sin(i*8.7)*4;}dust.setAttribute('position',new T.BufferAttribute(positions,3));const specks=new T.Points(dust,new T.PointsMaterial({color:'#d7c296',size:.022,transparent:true,opacity:.38}));specks.name='dust';this.room.add(specks);
 }
 setData(data:Cabinet){
  for(const e of this.exhibits){this.scene.remove(e.root);this.disposeObject(e.root);}this.exhibits=[];
  for(const [index,item] of data.objects.entries()){
   const root=new T.Group();root.position.set(item.x,0,item.z);const plinth=matte('#3d4940'),gold=metal('#b49560');
   mesh(new T.CylinderGeometry(.78,.88,.14,48),gold,root,0,.07,0);mesh(new T.CylinderGeometry(.72,.78,1.1,48),plinth,root,0,.68,0);mesh(new T.CylinderGeometry(.80,.72,.12,48),gold,root,0,1.28,0);mesh(new T.CylinderGeometry(.74,.74,.035,48),matte('#27392e'),root,0,1.36,0);
   const tex=labelTexture(item.title,`N° ${String(index+1).padStart(2,'0')}  ·  COLLECTION PERMANENTE`);const label=mesh(new T.PlaneGeometry(.64,.16),new T.MeshBasicMaterial({map:tex}),root,0,.84,.754);label.rotation.x=-.03;
   const art=artFor(item);art.root.position.y=2.23;art.root.rotation.y=item.rotation*Math.PI/180;art.root.scale.setScalar(item.scale);root.add(art.root);
   const selected=ring(root,new T.MeshBasicMaterial({color:'#e9c881',transparent:true,opacity:.8}),.94,.014,0,.02,0);selected.rotation.x=-Math.PI/2;selected.visible=item.id===this.current;
   const halo=mesh(new T.RingGeometry(.84,1.65,80),new T.MeshBasicMaterial({color:'#f7cb77',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),root,0,.015,0);halo.rotation.x=-Math.PI/2;
   const shield=new T.Group();shield.position.y=2.25;root.add(shield);const glass=new T.MeshPhysicalMaterial({color:'#93d2c2',transparent:true,opacity:.15,metalness:.2,roughness:.08,side:T.DoubleSide,depthWrite:false});mesh(new T.BoxGeometry(1.9,2,1.7),glass,shield);const edges=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(1.9,2,1.7)),new T.LineBasicMaterial({color:'#94d8bd',transparent:true,opacity:.65}));shield.add(edges);shield.visible=false;
   const stars=new T.Group();stars.position.y=2.7;root.add(stars);for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(new T.OctahedronGeometry(i%2?.045:.08),gold,stars,Math.sin(a)*1.1,Math.cos(a)*1.1,0);}stars.visible=false;
   root.traverse(o=>{o.userData.id=item.id;});this.scene.add(root);this.exhibits.push({root,art:art.root,item,pieces:art.pieces,wings:art.wings,curtains:art.curtains,shield,stars,halo,amounts:{},active:new Set(),selected});
  }this.setAmbience(data.ambience);
 }
 private disposeObject(root:T.Object3D){const mats=new Set<T.Material>(),geos=new Set<T.BufferGeometry>(),textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const m of mats){const map=(m as T.MeshStandardMaterial).map;if(map)textures.add(map);m.dispose();}geos.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());}
 select(id:string,focus=false){this.current=id;for(const e of this.exhibits)e.selected.visible=e.item.id===id;if(focus)this.focus(id);}
 focus(id:string){const e=this.exhibits.find(e=>e.item.id===id);if(!e)return;this.lookTo=new T.Vector3(e.root.position.x,2,e.root.position.z);this.focusTo=new T.Vector3(e.root.position.x+2.4,3.6,e.root.position.z+5.5);if(this.reduced)this.snap();}
 overview(){this.focusTo=new T.Vector3(10,8.4,16.5);this.lookTo=new T.Vector3(0,1,0);if(this.reduced)this.snap();}
 private snap(){if(this.focusTo)this.camera.position.copy(this.focusTo);if(this.lookTo)this.controls.target.copy(this.lookTo);this.focusTo=null;this.lookTo=null;this.controls.update();}
 zoom(delta:number){this.camera.position.lerp(this.controls.target,delta);this.controls.update();}
 setAmbience(a:Cabinet['ambience']){const config={night:['#192822','#34433b','#d9e3cf','#ffdda2',1.12],amber:['#38291e','#584436','#ffe4bd','#ffb85f',1.25],dawn:['#666e68','#65766d','#e5edee','#fff0d5',1.5]}[a];this.renderer.setClearColor(config[0] as string);(this.scene.fog as T.FogExp2).color.set(config[0] as string);this.wallMat.color.set(config[1] as string);this.ambient.color.set(config[2] as string);this.sun.color.set(config[3] as string);this.renderer.toneMappingExposure=config[4] as number;}
 trigger(id:string,b:Behavior){const e=this.exhibits.find(e=>e.item.id===id);if(!e)return false;if(e.active.has(b))e.active.delete(b);else e.active.add(b);return e.active.has(b);}
 resetActions(){for(const e of this.exhibits)e.active.clear();}
 setPaused(v:boolean){this.running=!v;}
 thumbnail(item:Curiosity){const key=JSON.stringify([item.shape,item.color,item.image]);const cached=this.thumbnails.get(key);if(cached)return cached;const scene=new T.Scene();scene.background=new T.Color('#e3dfd2');scene.environment=this.scene.environment;scene.add(new T.HemisphereLight('#fff9e5','#647363',3));const light=new T.DirectionalLight('#fff1cc',4);light.position.set(2,4,5);scene.add(light);const art=artFor({...item,scale:1});scene.add(art.root);art.root.rotation.y=-.35;const camera=new T.PerspectiveCamera(38,1,.1,20);camera.position.set(2,1.2,4);camera.lookAt(0,0,0);const size=new T.Vector2();this.renderer.getSize(size);const ratio=this.renderer.getPixelRatio();this.renderer.setPixelRatio(1);this.renderer.setSize(200,200,false);this.renderer.render(scene,camera);const url=this.renderer.domElement.toDataURL('image/webp',.8);this.renderer.setPixelRatio(ratio);this.renderer.setSize(size.x,size.y,false);this.disposeObject(art.root);this.thumbnails.set(key,url);return url;}
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 private hit(event:PointerEvent){const r=this.renderer.domElement.getBoundingClientRect();this.cursor.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.cursor,this.camera);return this.ray.intersectObjects(this.exhibits.map(e=>e.root),true)[0];}
 private pointerDown(e:PointerEvent){this.down={x:e.clientX,y:e.clientY};const hit=this.hit(e);if(this.edit&&e.shiftKey&&hit){this.dragging=true;this.dragId=hit.object.userData.id;this.controls.enabled=false;this.renderer.domElement.setPointerCapture(e.pointerId);this.onSelect(this.dragId);}}
 private pointerMove(e:PointerEvent){const h=this.hit(e);this.renderer.domElement.style.cursor=this.dragging?'grabbing':h?'pointer':'grab';if(this.dragging){const p=new T.Vector3();if(this.ray.ray.intersectPlane(this.plane,p)){const exhibit=this.exhibits.find(x=>x.item.id===this.dragId)!;exhibit.root.position.x=T.MathUtils.clamp(p.x,-6,6);exhibit.root.position.z=T.MathUtils.clamp(p.z,-3.2,3.5);}}}
 private pointerUp(e:PointerEvent){if(this.dragging){const exhibit=this.exhibits.find(x=>x.item.id===this.dragId)!;this.onMove(this.dragId,Math.round(exhibit.root.position.x*10)/10,Math.round(exhibit.root.position.z*10)/10);this.cancelDrag();return;}if(Math.hypot(e.clientX-this.down.x,e.clientY-this.down.y)<5){const h=this.hit(e);if(h)this.onSelect(h.object.userData.id);}}
 private cancelDrag(){this.dragging=false;this.dragId='';this.controls.enabled=true;}
 private loop=(now:number)=>{
  this.animation=0;if(document.hidden)return;const dt=this.last?Math.min((now-this.last)/1000,.05):.016;this.last=now;if(this.running&&!this.reduced)this.time+=dt;const t=this.time;
  if(this.focusTo&&this.lookTo){this.camera.position.lerp(this.focusTo,.07);this.controls.target.lerp(this.lookTo,.07);if(this.camera.position.distanceTo(this.focusTo)<.02){this.focusTo=null;this.lookTo=null;}}
  for(const e of this.exhibits){
   for(const b of ['rescue','flight','salon','zip','silly','trophy','defense','bend'] as Behavior[]){const target=e.active.has(b)?1:0;e.amounts[b]=this.reduced?target:T.MathUtils.lerp(e.amounts[b]??0,target,Math.min(dt*4,1));}
   const a=e.amounts;
   e.art.position.y=2.23+a.flight*(this.reduced?.2:Math.max(0,Math.sin(t*2))*.45);e.art.rotation.y=e.item.rotation*Math.PI/180+a.silly*Math.sin(t*2.2)*.7;e.art.rotation.z=a.silly*Math.sin(t*4)*.16+a.bend*.26;
   e.art.scale.setScalar(e.item.scale);e.art.scale.y*=1+a.salon*(this.reduced?.05:Math.sin(t*1.8)*.06);
   e.wings.forEach((w,i)=>{w.rotation.z=(i===0?1:-1)*(.05+Math.sin(t*(a.flight?11:1.2))*(a.flight*.55+(this.reduced?0:.035)));});
   if(e.item.shape==='orb')e.pieces.forEach((p,i)=>{const home=p.userData.home as T.Vector3;p.position.copy(home).multiplyScalar((1-a.rescue)*(1+(this.reduced?0:Math.sin(t+i)*.1)));});
   if(e.item.shape==='ribbon')e.pieces.forEach((p,i)=>{const home=p.userData.home as T.Vector3;p.position.copy(home);p.position.x+=a.bend*Math.sin(i*.11)*i*.028;p.rotation.z=a.bend*(i/24)*.8;});
   if(e.item.shape!=='ribbon'&&a.bend)e.art.rotation.x=a.bend*.3;else e.art.rotation.x=0;
   e.curtains.forEach((c,i)=>{c.position.x=(i===0?-1:1)*(.34+a.zip*.58);c.scale.x=1-a.zip*.65;});
   e.shield.visible=a.defense>.01;e.shield.scale.setScalar(.7+a.defense*.3);e.shield.rotation.y=a.defense*.15;
   e.stars.visible=a.trophy>.01;e.stars.scale.setScalar(Math.max(.01,a.trophy));e.stars.rotation.y=this.reduced?0:t*.3;
   (e.halo.material as T.MeshBasicMaterial).opacity=a.salon*.13+a.rescue*.05;e.halo.scale.setScalar(1+a.salon*(this.reduced?0:Math.sin(t)*.08));
   if(e.item.shape!=='orb'&&e.item.behaviors.includes('rescue'))e.art.children.forEach(child=>{if(e.curtains.includes(child as T.Mesh))return;const rest=child.userData.rest as T.Vector3,scatter=child.userData.scatter as T.Vector3;if(rest&&scatter){if(e.item.shape!=='ribbon')child.position.copy(rest);child.position.addScaledVector(scatter,1-a.rescue);}});
  }
  const dust=this.room.getObjectByName('dust');if(dust)dust.rotation.y=Math.sin(t*.08)*.04;this.controls.update();this.renderer.render(this.scene,this.camera);this.animation=requestAnimationFrame(this.loop);
 };
}
