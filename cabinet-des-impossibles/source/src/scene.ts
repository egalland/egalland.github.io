import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Cabinet, Curiosity, Behavior } from './model';
import { createArtwork, type Artwork, type Motion } from './artworks';

type Exhibit={root:T.Group; art:T.Group; item:Curiosity; animate:Artwork['animate']; baseHeight:number; shield:T.Group; stars:T.Group; halo:T.Mesh; amounts:Record<string,number>; active:Set<Behavior>; selected:T.Mesh;};
const metal=(color:string|number)=>new T.MeshStandardMaterial({color,metalness:.72,roughness:.3});
const matte=(color:string|number)=>new T.MeshStandardMaterial({color,roughness:.75});
function mesh(g:T.BufferGeometry,m:T.Material,parent:T.Object3D,x=0,y=0,z=0){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
function box(p:T.Object3D,m:T.Material,w:number,h:number,d:number,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);}
function ball(p:T.Object3D,m:T.Material,r:number,x=0,y=0,z=0){return mesh(new T.SphereGeometry(r,24,18),m,p,x,y,z);}
function ring(p:T.Object3D,m:T.Material,r:number,t:number,x=0,y=0,z=0){return mesh(new T.TorusGeometry(r,t,10,72),m,p,x,y,z);}
function labelTexture(text:string,small='CABINET DES IMPOSSIBLES'){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d')!;c.fillStyle='#b89c71';c.fillRect(0,0,512,128);c.fillStyle='#242822';c.textAlign='center';c.font='26px Georgia';c.fillText(text.substring(0,30),256,56);c.font='13px sans-serif';c.fillText(small,256,92);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;return tex;
}

export class Gallery {
 readonly renderer:T.WebGLRenderer;readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(42,1,.1,100);readonly controls:OrbitControls;
 private exhibits:Exhibit[]=[];private room=new T.Group();private ray=new T.Raycaster();private cursor=new T.Vector2();private animation=0;private last=0;private time=0;private observer:ResizeObserver;private current='';private focusTo:T.Vector3|null=null;private lookTo:T.Vector3|null=null;private wallMat=matte('#34433b');private floorMat=matte('#333c32');private ambient=new T.HemisphereLight('#d9e3cf','#382f28',2.7);private sun=new T.DirectionalLight('#ffdda2',3.2);private running=true;private inspecting=false;private dragging=false;private dragId='';private down={x:0,y:0};private plane=new T.Plane(new T.Vector3(0,1,0),0);private thumbnails=new Map<string,string>();
 reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;edit=false;onSelect:(id:string)=>void=()=>{};onMove:(id:string,x:number,z:number)=>void=()=>{};
 constructor(private container:HTMLElement){
  this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.setClearColor('#192822');container.append(this.renderer.domElement);
  this.renderer.domElement.setAttribute('aria-label','Salon en trois dimensions. Sélectionnez aussi les objets dans la collection sous la scène.');
  const pm=new T.PMREMGenerator(this.renderer),env=new RoomEnvironment();const target=pm.fromScene(env,.04);this.scene.environment=target.texture;env.dispose();pm.dispose();
  this.scene.fog=new T.FogExp2('#192822',.015);this.camera.position.set(8.4,7,13.9);
  this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,1.6,0);this.controls.enableDamping=!this.reduced;this.controls.dampingFactor=.07;this.controls.minDistance=3;this.controls.maxDistance=27;this.controls.maxPolarAngle=Math.PI/2-.03;this.controls.minPolarAngle=.25;this.controls.minAzimuthAngle=-1.14;this.controls.maxAzimuthAngle=1.14;this.controls.enablePan=false;this.controls.addEventListener('start',()=>{this.focusTo=null;this.lookTo=null;});
  this.scene.add(this.ambient,this.sun);this.sun.position.set(0,10,6);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-10,right:10,top:8,bottom:-8,near:1,far:25});this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.025;
  this.makeRoom();this.scene.add(this.room);
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();this.camera.position.copy(this.homePosition());
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
   const art=createArtwork(item);const bounds=new T.Box3().setFromObject(art.root);const baseHeight=1.38-bounds.min.y*item.scale;art.root.position.y=baseHeight;art.root.rotation.y=item.rotation*Math.PI/180;art.root.scale.setScalar(item.scale);root.add(art.root);
   const selected=ring(root,new T.MeshBasicMaterial({color:'#e9c881',transparent:true,opacity:.8}),.94,.014,0,.02,0);selected.rotation.x=-Math.PI/2;selected.visible=item.id===this.current;
   const halo=mesh(new T.RingGeometry(.84,1.65,80),new T.MeshBasicMaterial({color:'#f7cb77',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),root,0,.015,0);halo.rotation.x=-Math.PI/2;
   const shield=new T.Group();shield.position.y=2.25;root.add(shield);const glass=new T.MeshPhysicalMaterial({color:'#a1d8c9',transparent:true,opacity:.12,metalness:.12,roughness:.08,side:T.DoubleSide,depthWrite:false});const profile=[];for(let j=0;j<=24;j++){const angle=j/24*Math.PI/2;profile.push(new T.Vector2(Math.cos(angle)*1.03,.2+Math.sin(angle)*1.04));}profile.unshift(new T.Vector2(1.03,-1.05));mesh(new T.LatheGeometry(profile,56),glass,shield);for(const h of [-1.04,-.98])ring(shield,new T.MeshStandardMaterial({color:'#86b9a2',metalness:.65,roughness:.25}),1.04,.018,0,h,0).rotation.x=Math.PI/2;shield.visible=false;
   const stars=new T.Group();stars.position.y=2.7;root.add(stars);for(let i=0;i<12;i++){const a=i*Math.PI/6;mesh(new T.OctahedronGeometry(i%2?.045:.08),gold,stars,Math.sin(a)*1.1,Math.cos(a)*1.1,0);}stars.visible=false;
   root.traverse(o=>{o.userData.id=item.id;});this.scene.add(root);this.exhibits.push({root,art:art.root,item,animate:art.animate,baseHeight,shield,stars,halo,amounts:{},active:new Set(),selected});
  }this.setAmbience(data.ambience);this.updateVisibility();
 }
 private disposeObject(root:T.Object3D){const mats=new Set<T.Material>(),geos=new Set<T.BufferGeometry>(),textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geos.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}});for(const m of mats){for(const value of Object.values(m)){if(value instanceof T.Texture&&!value.userData.shared)textures.add(value);}m.dispose();}geos.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());}
 select(id:string,focus=false){this.current=id;for(const e of this.exhibits)e.selected.visible=e.item.id===id;this.updateVisibility();if(focus||this.inspecting)this.focus(id);}
 private updateVisibility(){if(this.inspecting&&!this.exhibits.some(e=>e.item.id===this.current)){this.overview();return;}this.room.visible=!this.inspecting;for(const e of this.exhibits)e.root.visible=!this.inspecting||e.item.id===this.current;this.container.parentElement?.classList.toggle('inspecting',this.inspecting);}
 private homePosition(){const ratio=Math.max(1,1.45/this.camera.aspect);return new T.Vector3(8.4*ratio,1.6+5.4*ratio,13.9*ratio);}
 focus(id:string){const e=this.exhibits.find(e=>e.item.id===id);if(!e)return;e.root.updateWorldMatrix(true,true);this.inspecting=true;this.current=id;this.updateVisibility();this.controls.minAzimuthAngle=-Infinity;this.controls.maxAzimuthAngle=Infinity;this.controls.minDistance=1.4;this.controls.maxDistance=13;this.controls.maxPolarAngle=Math.PI*.87;const bounds=new T.Box3().setFromObject(e.art),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const distance=Math.max(size.y,size.x/this.camera.aspect)/ (2*Math.tan(this.camera.fov*Math.PI/360))*1.35;this.lookTo=center;this.focusTo=center.clone().add(new T.Vector3(1,.38,2.4).normalize().multiplyScalar(distance));if(this.reduced)this.snap();}
 overview(){this.inspecting=false;this.updateVisibility();this.controls.minAzimuthAngle=-1.14;this.controls.maxAzimuthAngle=1.14;this.controls.minDistance=3;this.controls.maxDistance=40;this.controls.maxPolarAngle=Math.PI/2-.03;this.focusTo=this.homePosition();this.lookTo=new T.Vector3(0,1.6,0);if(this.reduced)this.snap();}
 private snap(){if(this.focusTo)this.camera.position.copy(this.focusTo);if(this.lookTo)this.controls.target.copy(this.lookTo);this.focusTo=null;this.lookTo=null;this.controls.update();}
 zoom(delta:number){this.camera.position.lerp(this.controls.target,delta);this.controls.update();}
 setAmbience(a:Cabinet['ambience']){const config={night:['#192822','#34433b','#d9e3cf','#ffdda2',1.12],amber:['#38291e','#584436','#ffe4bd','#ffb85f',1.25],dawn:['#666e68','#65766d','#e5edee','#fff0d5',1.5]}[a];this.renderer.setClearColor(config[0] as string);(this.scene.fog as T.FogExp2).color.set(config[0] as string);this.wallMat.color.set(config[1] as string);this.ambient.color.set(config[2] as string);this.sun.color.set(config[3] as string);this.renderer.toneMappingExposure=config[4] as number;}
 trigger(id:string,b:Behavior){const e=this.exhibits.find(e=>e.item.id===id);if(!e)return false;if(e.active.has(b))e.active.delete(b);else e.active.add(b);return e.active.has(b);}
 resetActions(){for(const e of this.exhibits)e.active.clear();}
 setPaused(v:boolean){this.running=!v;}
 thumbnail(item:Curiosity){const key=JSON.stringify([item.shape,item.color,item.behaviors]);const cached=this.thumbnails.get(key);if(cached)return cached;const scene=new T.Scene();scene.background=new T.Color('#e3dfd2');scene.environment=this.scene.environment;scene.add(new T.HemisphereLight('#fff9e5','#647363',3));const light=new T.DirectionalLight('#fff1cc',4);light.position.set(2,4,5);scene.add(light);const art=createArtwork({...item,image:undefined,scale:1});scene.add(art.root);art.root.rotation.y=-.35;const camera=new T.PerspectiveCamera(38,1,.1,20);const bounds=new T.Box3().setFromObject(art.root),center=bounds.getCenter(new T.Vector3()),sizeArt=bounds.getSize(new T.Vector3());camera.position.copy(center).add(new T.Vector3(1.6,.9,3).normalize().multiplyScalar(Math.max(sizeArt.x,sizeArt.y)*1.9));camera.lookAt(center);const size=new T.Vector2();this.renderer.getSize(size);const ratio=this.renderer.getPixelRatio();this.renderer.setPixelRatio(1);this.renderer.setSize(200,200,false);this.renderer.render(scene,camera);const url=this.renderer.domElement.toDataURL('image/webp',.8);this.renderer.setPixelRatio(ratio);this.renderer.setSize(size.x,size.y,false);this.disposeObject(art.root);this.thumbnails.set(key,url);return url;}
 screenshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 private hit(event:PointerEvent){const r=this.renderer.domElement.getBoundingClientRect();this.cursor.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.cursor,this.camera);return this.ray.intersectObjects(this.exhibits.filter(e=>e.root.visible).map(e=>e.root),true)[0];}
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
   e.art.position.y=e.baseHeight+a.flight*(this.reduced?.2:Math.max(0,Math.sin(t*2))*.45);e.art.rotation.y=e.item.rotation*Math.PI/180+a.silly*Math.sin(t*2.2)*.7;e.art.rotation.z=a.silly*Math.sin(t*4)*.16+a.bend*.26;
   e.art.scale.setScalar(e.item.scale);e.art.scale.y*=1+a.salon*(this.reduced?.05:Math.sin(t*1.8)*.06);
   e.art.rotation.x=e.item.shape!=='ribbon'?a.bend*.18:0;
   e.animate(t,a as Motion,this.reduced,this.cursor);
   e.shield.visible=a.defense>.01;e.shield.scale.setScalar(.7+a.defense*.3);e.shield.rotation.y=a.defense*.15;
   e.stars.visible=a.trophy>.01;e.stars.scale.setScalar(Math.max(.01,a.trophy));e.stars.rotation.y=this.reduced?0:t*.3;
   (e.halo.material as T.MeshBasicMaterial).opacity=a.salon*.13+a.rescue*.05;e.halo.scale.setScalar(1+a.salon*(this.reduced?0:Math.sin(t)*.08));

  }
  const dust=this.room.getObjectByName('dust');if(dust)dust.rotation.y=Math.sin(t*.08)*.04;this.controls.update();this.renderer.render(this.scene,this.camera);this.animation=requestAnimationFrame(this.loop);
 };
}
