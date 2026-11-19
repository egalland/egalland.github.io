import * as THREE from './vendor/three.module.js';
import {SVGRenderer} from './vendor/SVGRenderer.js';
import {normalizeAppearance} from './appearance.js';

const sphereCache=new Map();
function sharedSphere(segments){if(!sphereCache.has(segments)){const g=new THREE.SphereGeometry(1,segments,Math.round(segments*.72));g.userData.persistent=true;sphereCache.set(segments,g);}return sphereCache.get(segments);}
// The face gets the most geometry; small stitches stay light on mobile and SVG.
function oval(g,x,y,z,sx,sy,sz,color,material,{cloth=false,face=false,tilt=0}={}){
 const segments=face?(material.lowDetail?24:40):Math.max(sx,sy,sz)>.2?(material.lowDetail?16:24):(material.lowDetail?10:16);
 const geometry=face?new THREE.SphereGeometry(1,segments,Math.round(segments*.72)):sharedSphere(segments);
 const mesh=new THREE.Mesh(geometry,material(color,cloth));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.z=tilt;mesh.castShadow=Math.max(sx,sy,sz)>.06;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function cord(g,points,r,color,material,cloth=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(9,points.length*4),r,material.lowDetail?7:10,false),material(color,cloth));g.add(mesh);mesh.castShadow=true;return mesh;}
function tapered(g,points,radii,colors,material){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),length=material.lowDetail?24:40,radial=material.lowDetail?16:24,geometry=new THREE.TubeGeometry(curve,length,1,radial,false),pos=geometry.attributes.position;
 for(let i=0;i<=length;i++){const t=i/length,at=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(at)),radius=THREE.MathUtils.lerp(radii[j],radii[j+1],at-j),center=curve.getPointAt(t);for(let k=0;k<=radial;k++){const n=i*(radial+1)+k;pos.setXYZ(n,center.x+(pos.getX(n)-center.x)*radius,center.y+(pos.getY(n)-center.y)*radius,center.z+(pos.getZ(n)-center.z)*radius);}}
 geometry.computeVertexNormals();geometry.clearGroups();const split=Math.round(length*.72)*radial*6,total=geometry.index.count;geometry.addGroup(0,colors.length>1?split:total,0);if(colors.length>1)geometry.addGroup(split,total-split,1);const mesh=new THREE.Mesh(geometry,colors.map(c=>material(c,true)));mesh.castShadow=true;g.add(mesh);return mesh;
}
function seam(g,points,color){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),line=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));g.add(line);return line;}
function foxEar(head,x,material,color){
 const shape=new THREE.Shape();shape.moveTo(-.105,0);shape.quadraticCurveTo(-.09,.18,-.025,.31);shape.quadraticCurveTo(0,.35,.027,.30);shape.quadraticCurveTo(.10,.12,.108,0);shape.quadraticCurveTo(0,-.035,-.105,0);
 const outer=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.022,bevelThickness:.022,bevelSegments:3,steps:1,curveSegments:material.lowDetail?9:14}),material(color,true));outer.position.set(x,.20,-.025);outer.rotation.z=x<0?.21:-.21;head.add(outer);
 const inner=new THREE.Mesh(new THREE.ShapeGeometry(shape,material.lowDetail?9:14),material('#dcab98',false));inner.scale.set(.58,.67,1);inner.position.set(x,.235,.037);inner.rotation.z=outer.rotation.z;head.add(inner);
}

export function buildCharacter(input,material=(color)=>new THREE.MeshStandardMaterial({color,roughness:1})){
 let tail=null;const a=normalizeAppearance(input),fox=a.kind==='fox',g=new THREE.Group(),body=new THREE.Group(),head=new THREE.Group();g.add(body,head);head.position.y=1.30;
 const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.12,.43,0);rightLeg.position.set(.12,.43,0);g.add(leftLeg,rightLeg);
 for(const leg of [leftLeg,rightLeg]){oval(leg,0,-.12,0,.105,.245,.116,a.pants,material,{cloth:true});oval(leg,0,-.335,.055,.12,.075,.184,'#d6c5aa',material,{cloth:true});cord(leg,[[-.065,-.31,.17],[0,-.32,.20],[.065,-.31,.17]],.006,'#9e8971',material);}
 oval(body,0,.79,0,.268,.327,.211,a.sweater,material,{cloth:true});oval(body,0,1.065,0,.115,.083,.12,a.skin,material);
 const leftArm=new THREE.Group(),rightArm=new THREE.Group();
 for(const [arm,x]of [[leftArm,-.27],[rightArm,.27]]){arm.position.set(x,.98,0);arm.rotation.z=x<0?-.08:.08;body.add(arm);oval(arm,x<0?-.016:.016,-.125,0,.094,.206,.105,a.sweater,material,{cloth:true});oval(arm,0,-.31,.014,.073,.091,.075,a.skin,material);oval(arm,x<0?.055:-.055,-.293,.062,.029,.047,.033,a.skin,material);cord(arm,[[-.073,-.245,.048],[0,-.252,.094],[.073,-.245,.048]],.009,'#c4cdb6',material,true);}
 const stitches=[];for(let x=-.18;x<.20;x+=.065)for(let y=.59;y<.98;y+=.073){const z=.211-Math.abs(x)*.18;stitches.push([x-.018,y+.018,z],[x,y,z+.004],[x,y,z+.004],[x+.018,y+.018,z]);}seam(body,stitches,'#cbd3ba');
 if(a.apron){oval(body,0,.75,.19,.195,.245,.043,'#e2c89d',material,{cloth:true});oval(body,0,.66,.231,.115,.066,.012,'#cfb17e',material,{cloth:true});cord(body,[[-.15,.94,.14],[-.095,1.08,.12],[.095,1.08,.12],[.15,.94,.14]],.014,'#b99b6e',material,true);seam(body,[[-.10,.67,.246],[-.10,.62,.246],[-.08,.61,.246],[-.03,.61,.246],[.01,.61,.246],[.07,.61,.246],[.09,.62,.246],[.10,.67,.246]],'#f5e4c4');}
 const face=oval(head,0,0,0,fox?.301:.293,fox?.307:.322,fox?.267:.275,a.skin,material,{face:true,cloth:fox});
 // A narrower jaw softens the silhouette without stacking balls for the cheeks.
 if(!fox){const p=face.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),t=Math.max(0,-y);p.setX(i,p.getX(i)*(1-t*.13));}face.geometry.computeVertexNormals();}
 if(fox){foxEar(head,-.21,material,a.skin);foxEar(head,.21,material,a.skin);for(const x of [-.082,.082])oval(head,x,-.08,.208,.123,.084,.042,'#f1e3c6',material,{face:true});oval(head,0,-.072,.274,.094,.052,.078,'#f4e8cf',material,{face:true});oval(head,0,-.041,.349,.035,.025,.022,'#42423b',material);tail=tapered(g,[[.15,.50,-.15],[.35,.48,-.24],[.58,.56,-.26],[.69,.68,-.24]],[.075,.153,.132,.012],[a.skin,'#f1e3c6'],material);}
 else{
  for(const x of [-.283,.283]){oval(head,x,-.01,-.015,.057,.092,.058,a.skin,material);oval(head,x,-.011,.033,.022,.047,.008,'#c78e79',material);}
  const covered=a.hat==='beanie'||a.hat==='wizard';oval(head,0,.16,-.06,.278,.21,.24,a.hair,material,{face:true});
  // Swept locks follow the forehead, with no individual spheres poking through the hat.
  if(!covered){oval(head,-.075,.195,.177,.174,.067,.066,a.hair,material,{tilt:.24});oval(head,.12,.19,.157,.104,.06,.068,a.hair,material,{tilt:-.30});}
  oval(head,0,-.025,.272,.025,.039,.029,a.skin,material,{face:true});oval(head,0,-.052,.292,.030,.021,.024,a.skin,material);
 }
 const eyes=[];const blush=new THREE.Color(a.skin).lerp(new THREE.Color('#d98f82'),.25).getStyle();
 for(const x of [-.11,.11]){
  const eye=new THREE.Group();eye.position.set(x,.028,fox?.251:.257);head.add(eye);eyes.push(eye);
  oval(eye,0,0,.004,.042,.024,.014,'#f6efdb',material);oval(eye,x<0?.004:-.004,-.001,.016,.021,.025,.012,'#4c483c',material);oval(eye,x<0?.003:-.003,-.001,.026,.012,.020,.006,'#252e2a',material);oval(eye,-.005,.008,.032,.006,.007,.004,'#fff9e5',material);
  cord(head,[[x-.038,.037,fox?.258:.265],[x,.052,fox?.272:.279],[x+.038,.037,fox?.258:.265]],.005,fox?'#765845':'#786354',material);
  cord(head,[[x-.032,.100,.241],[x,.108,.257],[x+.031,.098,.244]],.0065,fox?'#9d6745':a.hair,material);
  oval(head,x*1.47,-.069,fox?.224:.232,.040,.017,.005,blush,material);
 }
 cord(head,[[-.045,-.124,fox?.284:.254],[0,-.139,fox?.299:.267],[.045,-.124,fox?.284:.254]],.0055,'#996f60',material);
 if(fox)cord(head,[[0,-.065,.350],[0,-.102,.323],[0,-.125,.294]],.0045,'#9c7965',material);
 if(a.glasses){for(const x of [-.11,.11]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.069,.006,8,material.lowDetail?36:52),material('#776e5b',false));ring.scale.y=.83;ring.position.set(x,.028,.291);head.add(ring);}cord(head,[[-.041,.033,.294],[0,.048,.307],[.041,.033,.294]],.005,'#776e5b',material);for(const dir of [-1,1])cord(head,[[dir*.177,.035,.283],[dir*.25,.037,.192],[dir*.283,.014,.047]],.005,'#776e5b',material);}
 if(a.hat==='beanie'){
  oval(head,0,.256,-.029,.297,.180,.269,a.hatColor,material,{face:true,cloth:true});const cuff=new THREE.Mesh(new THREE.TorusGeometry(.268,.031,12,material.lowDetail?40:56),material(a.hatColor,true));cuff.rotation.x=Math.PI/2;cuff.scale.y=.88;cuff.position.set(0,.188,-.019);head.add(cuff);oval(head,.023,.435,-.027,.072,.073,.073,a.hatColor,material,{cloth:true});
  const ribColor=new THREE.Color(a.hatColor).lerp(new THREE.Color('#f4dfbd'),.22).getStyle();for(let i=0;i<12;i++){const phi=i/12*Math.PI*2;cord(head,[[Math.cos(phi)*.275,.195,Math.sin(phi)*.236-.022],[Math.cos(phi)*.246,.31,Math.sin(phi)*.214-.022],[Math.cos(phi)*.129,.402,Math.sin(phi)*.112-.022]],.0035,ribColor,material,true);}
 }
 if(a.hat==='cap'){oval(head,0,.235,-.035,.293,.143,.262,a.hatColor,material,{face:true,cloth:true});oval(head,0,.165,.225,.25,.021,.171,a.hatColor,material,{cloth:true});cord(head,[[-.19,.175,.158],[0,.187,.231],[.19,.175,.158]],.0045,'#ddc99e',material);}
 if(a.hat==='wizard'){oval(head,0,.19,-.024,.331,.026,.290,a.hatColor,material,{cloth:true});tapered(head,[[0,.185,-.025],[0,.39,-.032],[-.025,.58,-.02],[-.112,.68,.015]],[.272,.185,.078,.003],[a.hatColor],material);cord(head,[[-.251,.23,.075],[-.10,.225,.237],[.10,.225,.237],[.25,.23,.075]],.011,'#b69c68',material,true);oval(head,-.08,.398,.151,.022,.034,.007,'#efd6a3',material);}
 cord(body,[[-.12,1.064,.05],[0,1.054,.116],[.12,1.064,.05]],.018,'#c7cfb7',material,true);
 g.userData.rig={head,body,leftArm,rightArm,leftLeg,rightLeg,eyes,tail};g.userData.appearance=a;return g;
}

export function animateCharacter(g,time,{walking=false,working=false,blink=true,pose='standing'}={}){
 const r=g.userData.rig;if(!r)return;if(r.tail)r.tail.scale.set(.55,.8,.7);const t=time*.001;if(pose==='sleep'){if(r.tail)r.tail.position.z=.24;r.body.position.y=Math.sin(t*1.2)*.003;r.head.position.z=.25;r.head.rotation.set(0,0,.045);r.leftLeg.rotation.x=r.rightLeg.rotation.x=0;r.leftArm.rotation.x=r.rightArm.rotation.x=.04;for(const eye of r.eyes||[])eye.scale.y=.055;return;}if(r.tail)r.tail.position.z=0;r.head.position.z=0;r.body.position.y=Math.sin(t*1.5)*.007;r.head.rotation.z=Math.sin(t*.8)*.019;r.head.rotation.y=Math.sin(t*.46)*.035;
 r.leftLeg.rotation.x=pose==='seated'?-1.25:walking?Math.sin(t*6)*.31:0;r.rightLeg.rotation.x=pose==='seated'?-1.25:walking?-Math.sin(t*6)*.31:0;r.leftArm.rotation.x=working?-.70+Math.sin(t*4)*.10:walking?-Math.sin(t*6)*.24:Math.sin(t*1.5)*.025;r.rightArm.rotation.x=working?-.73-Math.sin(t*4)*.10:walking?Math.sin(t*6)*.24:-Math.sin(t*1.5)*.025;
 const phase=(t+1.1)%5.7,lid=blink&&phase<.17?Math.max(.08,Math.abs(phase-.085)/.085):1;for(const eye of r.eyes||[])eye.scale.y=lid;
}

export class CharacterPreview{
 constructor(host,appearance,material){
  this.host=host;this.material=material;this.angle=.22;this.closed=false;this.dirty=true;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#e5cfad');this.camera=new THREE.OrthographicCamera(-1.25,1.25,1.7,-.5,.1,50);
  const canvas=document.createElement('canvas'),context=canvas.getContext('webgl2',{antialias:true});if(context){this.renderer=new THREE.WebGLRenderer({canvas,context,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));}else{this.renderer=new SVGRenderer();this.renderer.setQuality('high');this.renderer.setPrecision(3);this.software=true;}
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;host.replaceChildren(this.renderer.domElement);const light=new THREE.DirectionalLight('#fff6e5',this.software?.72:3);light.position.set(-3,6,5);this.scene.add(light,new THREE.AmbientLight(this.software?'#c1b6a0':'#fff7e4',this.software?.9:1.7));
  const stand=new THREE.Mesh(new THREE.CylinderGeometry(.61,.67,.10,48),material('#b0bf9b',true));stand.position.y=-.03;this.scene.add(stand);this.setAppearance(appearance);this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();this.last=0;this.frame=this.frame.bind(this);requestAnimationFrame(this.frame);
  let pointer=null;host.style.touchAction='pan-y';host.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer={x:e.clientX,angle:this.angle};host.setPointerCapture(e.pointerId);});host.addEventListener('pointermove',e=>{if(!pointer)return;this.angle=pointer.angle+(e.clientX-pointer.x)*.012;this.dirty=true;});host.addEventListener('pointerup',()=>{pointer=null;});host.addEventListener('pointercancel',()=>{pointer=null;});
 }
 setAppearance(a){if(this.character){this.scene.remove(this.character);this.character.traverse(o=>{if(o.geometry&&!o.geometry.userData.persistent)o.geometry.dispose();});}this.character=buildCharacter(a,this.material);this.scene.add(this.character);this.dirty=true;}
 rotate(){this.angle+=Math.PI/4;this.dirty=true;}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);const aspect=w/h,height=2.35;this.camera.left=-height*aspect/2;this.camera.right=height*aspect/2;this.camera.top=height/2;this.camera.bottom=-height/2;this.camera.updateProjectionMatrix();this.dirty=true;}
 frame(t){if(this.closed)return;requestAnimationFrame(this.frame);if(this.software&&(!this.dirty||t-this.last<300)||!this.software&&t-this.last<32)return;this.last=t;this.dirty=false;this.camera.position.set(Math.sin(this.angle)*4,1.65,Math.cos(this.angle)*4);this.camera.lookAt(0,.96,0);animateCharacter(this.character,t,{blink:!this.software});this.renderer.render(this.scene,this.camera);}
 dispose(){this.closed=true;this.observer.disconnect();this.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.persistent)o.geometry.dispose();});this.renderer.dispose?.();this.host.replaceChildren();}
}
