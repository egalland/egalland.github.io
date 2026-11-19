import {equipmentHeight} from './equipment.js';
import * as THREE from './vendor/three.module.js';
import {SVGRenderer} from './vendor/SVGRenderer.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {compute,ROOM_TYPES,OBJECTS,objectRect,objectLevel,openingLevel,openingSegment,levelOf,unionCells,railingSegments,area} from './engine.js';
import {wallPieces,levelOffsets,envelopeWalls} from './volume-geometry.js';

// A depth-buffered scene: floors, walls, furniture and stairs share real coordinates.
export class VolumeView{
 constructor(canvas,{onSelect,onZoom,onFailure}={}){
  this.canvas=canvas;this.onSelect=onSelect;this.onZoom=onZoom;this.materials=new Map();this.wallParts=[];this.visible=false;this.frame=0;
  try{const context=canvas.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:true});if(!context)throw Error('No hardware context');this.renderer=new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'low-power'});}
  catch{this.software=true;this.renderer=new SVGRenderer();this.renderer.setQuality('low');this.renderer.domElement.id='volume-software';this.renderer.domElement.setAttribute('aria-label','Vue 3D interactive');canvas.parentElement.insertBefore(this.renderer.domElement,canvas);}
  this.element=this.renderer.domElement;
  if(!this.software){this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.2;}
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#f2f0eb');this.camera=new THREE.PerspectiveCamera(36,1,.05,500);
  this.camera.position.set(16,17,21);this.controls=new OrbitControls(this.camera,this.element);this.controls.enableDamping=!this.software;this.controls.dampingFactor=.1;this.controls.maxPolarAngle=Math.PI*.47;this.controls.minPolarAngle=.12;this.controls.minDistance=2;this.controls.maxDistance=180;this.controls.screenSpacePanning=true;this.controls.rotateSpeed=.7;this.controls.zoomSpeed=.8;this.controls.touches.ONE=THREE.TOUCH.ROTATE;this.controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  this.controls.addEventListener('change',()=>{this.cutWalls();this.schedule();if(this.fitDistance)this.onZoom?.(this.fitDistance/this.camera.position.distanceTo(this.controls.target));});
  this.controls.addEventListener('start',()=>this.schedule());
  this.scene.add(this.software?new THREE.AmbientLight('#fffef1',.45):new THREE.HemisphereLight('#fffef3','#adb69e',2.3));this.sun=new THREE.DirectionalLight('#fff5e1',this.software?.55:3.1);this.sun.position.set(-12,22,12);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1536,1536);this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.025;this.sun.shadow.radius=3;this.scene.add(this.sun,this.sun.target);
  const fill=new THREE.DirectionalLight('#dfebff',this.software?.15:1);fill.position.set(8,10,-12);this.scene.add(fill);
  this.unit=new THREE.BoxGeometry(1,1,1);this.rounded=this.software?this.unit:new RoundedBoxGeometry(1,1,1,2,.07);this.wood=this.texture('wood');this.tile=this.texture('tile');
  this.content=new THREE.Group();this.scene.add(this.content);this.raycaster=new THREE.Raycaster();
  let press=null;this.element.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY,time:performance.now()};});
  this.element.addEventListener('pointerup',e=>{if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>7||performance.now()-press.time>450){press=null;return;}press=null;const r=this.element.getBoundingClientRect();this.raycaster.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),this.camera);for(const hit of this.raycaster.intersectObject(this.content,true)){let p=hit.object;while(p&&!p.userData.entity)p=p.parent;if(p?.userData.entity){this.onSelect?.(p.userData.entity.type,p.userData.entity.id);break;}}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.hide();onFailure?.();});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas.parentElement);
 }
 texture(kind){
  const c=document.createElement('canvas');c.width=512;c.height=512;const g=c.getContext('2d');g.fillStyle=kind==='tile'?'#f0f1e9':'#eee1c7';g.fillRect(0,0,512,512);
  if(kind==='tile'){g.strokeStyle='#c5cbbb';g.lineWidth=3;for(let n=0;n<=512;n+=128){g.beginPath();g.moveTo(n,0);g.lineTo(n,512);g.moveTo(0,n);g.lineTo(512,n);g.stroke();}}
  else{for(let i=0;i<8;i++){const x=i*64;g.fillStyle=['#eadcc1','#e8d9bb','#f0e3c9','#e5d5b7'][i%4];g.fillRect(x+1,0,62,512);g.strokeStyle='#bca37b';g.globalAlpha=.33;g.lineWidth=1;g.beginPath();g.moveTo(x,0);g.lineTo(x,512);g.moveTo(x,(i%3)*171);g.lineTo(x+64,(i%3)*171);g.stroke();for(let j=0;j<6;j++){g.beginPath();g.moveTo(x+8+j*8,0);g.bezierCurveTo(x+13+j*8,180,x+3+j*8,320,x+8+j*8,512);g.strokeStyle='#a88d652b';g.stroke();}g.globalAlpha=1;}}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,this.renderer.capabilities?.getMaxAnisotropy?.()||1);return t;
 }
 material(color,finish='plain'){
  const key=color+finish;if(!this.materials.has(key))this.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:finish==='glass'?.2:.8,metalness:finish==='metal'?.25:0,map:finish==='wood'?this.wood:finish==='tile'?this.tile:null,transparent:finish==='glass',opacity:finish==='glass'?.28:1,depthWrite:finish!=='glass',side:THREE.DoubleSide}));return this.materials.get(key);
 }
 box(parent,x,z,y,w,h,l,color,entity=null,rounded=false,finish='plain'){
  const mesh=new THREE.Mesh(rounded?this.rounded:this.unit,this.material(color,finish));mesh.position.set(x+w/2,z+h/2,y+l/2);mesh.scale.set(Math.max(.008,w),Math.max(.008,h),Math.max(.008,l));if(this.software)mesh.renderOrder=this.order||0;mesh.castShadow=finish!=='glass';mesh.receiveShadow=true;if(entity)mesh.userData.entity=entity;parent.add(mesh);return mesh;
 }
 cylinder(parent,x,z,y,r,h,color,top=r){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,r,h,14),this.material(color));mesh.position.set(x,z+h/2,y);if(this.software)mesh.renderOrder=this.order||0;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 sphere(parent,x,z,y,r,color){const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(r,this.software?1:2),this.material(color));mesh.position.set(x,z,y);if(this.software)mesh.renderOrder=this.order||0;mesh.castShadow=true;parent.add(mesh);return mesh;}
 rod(parent,a,b,r=.025,color='#798775'){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,A.distanceTo(B),8),this.material(color,'metal'));mesh.position.copy(A).add(B).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.sub(A).normalize());if(this.software)mesh.renderOrder=this.order||0;mesh.castShadow=true;parent.add(mesh);return mesh;}
 floor(parent,r,z,thickness,color,finish,entity){
  this.box(parent,r.x,z-thickness,r.y,r.w,thickness,r.l,'#bca989',entity);
  const geo=new THREE.PlaneGeometry(r.w,r.l,this.software?Math.ceil(r.w):1,this.software?Math.ceil(r.l):1),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,uv.getX(i)*r.w/2,uv.getY(i)*r.l/2);}uv.needsUpdate=true;
  const top=new THREE.Mesh(geo,this.material(color,finish));top.rotation.x=-Math.PI/2;top.position.set(r.x+r.w/2,z+.003,r.y+r.l/2);if(this.software)top.renderOrder=(this.order||0)+.1;top.receiveShadow=true;if(entity)top.userData.entity=entity;parent.add(top);
  if(this.software&&finish==='wood'){const positions=[];for(let x=Math.ceil(r.x/.23)*.23;x<r.x+r.w-.01;x+=.23)positions.push(x,z+.008,r.y,x,z+.008,r.y+r.l);if(positions.length){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#a18b66',transparent:true,opacity:.2}));lines.renderOrder=(this.order||0)+.12;parent.add(lines);}}
 }
 furniture(parent,s,o,z){
  const r=objectRect(s,o),quarter=o.rotation===90||o.rotation===270,w=quarter?o.l:o.w,l=quarter?o.w:o.l,g=new THREE.Group();g.position.set(r.x+r.w/2,z,r.y+r.l/2);g.rotation.y=-(o.rotation||0)*Math.PI/180;g.userData.entity={type:'object',id:o.id};parent.add(g);
  if(this.software){const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,18),new THREE.MeshBasicMaterial({color:'#425340',transparent:true,opacity:.09}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;shadow.scale.set(w*.6,l*.6,1);shadow.renderOrder=(this.order||0)-.5;g.add(shadow);}
  const box=(x,h,y,bw,bh,bl,c='#c7b496',round=false,finish='plain')=>this.box(g,x-w/2,h,y-l/2,bw,bh,bl,c,null,round,finish),col=OBJECTS[o.kind].color;
  const legs=(height=.68,inset=.1)=>{for(const x of[inset,w-inset-.05])for(const y of[inset,l-inset-.05])box(x,.03,y,.05,height,.05,'#7d806b');};
  if(OBJECTS[o.kind].group==='ceiling'){
   const height=o.equipmentHeight??OBJECTS[o.kind].h;
   if(o.kind==='steelBeam'){
    const flange=Math.min(.035,height/3);
    box(0,-height,0,w,flange,l,col,false,'metal');
    box(0,-flange,0,w,flange,l,col,false,'metal');
    box(w*.36,-height+flange,0,w*.28,height-2*flange,l,col,false,'metal');
   }else if(o.kind==='pendant'){
    this.rod(g,[0,0,0],[0,-height,0],.013,'#605949');
    this.cylinder(g,0,-height,0,Math.min(w,l)*.47,.15,col,Math.min(w,l)*.24);
   }else if(o.kind==='spot'){
    this.cylinder(g,0,-height,0,Math.min(w,l)*.47,height,'#e6cf93');
   }else{
    box(0,o.kind==='ceiling'?0:-height,0,w,height,l,col,false,o.kind==='beam'?'wood':'plain');
    if(o.kind==='vent')for(let i=1;i<6;i++)box(w*.12,-height-.006,l*i/6,w*.76,.009,.009,'#566f67');
   }
  }else if(o.kind==='pool'){
   const depth=o.equipmentHeight??1.45,edge=Math.min(.15,w*.18,l*.18),coping='#d8ccb3';
   for(const x of[0,w-edge])box(x,-depth,0,edge,depth+.03,l,coping);
   for(const y of[0,l-edge])box(edge,-depth,y,w-2*edge,depth+.03,edge,coping);
   box(edge,-.075,edge,w-2*edge,.04,l-2*edge,'#69b7c4');
   box(w*.49,-.032,l*.10,w*.02,.004,l*.80,'#418c9f');
   for(let i=1;i<8;i++)box(w*.18,-.030,l*i/8,w*.64,.004,.012,'#a9d9d9');
  }else if(o.kind==='poolLadder'){
   for(const x of[-w*.35,w*.35]){
    this.rod(g,[x,-.7,l*.3],[x,.6,l*.3],.025,'#9aaeb0');
    this.rod(g,[x,.6,l*.3],[x,.6,-l*.37],.025,'#9aaeb0');
    this.rod(g,[x,.6,-l*.37],[x,0,-l*.37],.025,'#9aaeb0');
   }
   for(let i=0;i<4;i++)this.rod(g,[-w*.35,-i*.22,l*.3],[w*.35,-i*.22,l*.3],.025,'#9aaeb0');
  }else if(o.kind==='poolShower'){
   box(0,0,0,w,.065,l,'#c9cbbc');
   this.rod(g,[0,.05,-l*.3],[0,2.05,-l*.3],.026,'#849a97');
   this.rod(g,[0,2.05,-l*.3],[0,2.05,l*.13],.026,'#849a97');
   this.cylinder(g,0,2,l*.1,.11,.03,'#849a97');
  }else if(o.kind==='poolCover'){
   this.rod(g,[-w*.47,.22,0],[w*.47,.22,0],.10,'#8bb2b6');
   for(const x of[0,w-.07])box(x,0,0,.07,.3,l,'#8a9e97');
  }else if(o.kind==='poolFilter'){
   box(0,0,0,w,.52,l,'#98a798',true);
   this.cylinder(g,0,.52,0,Math.min(w,l)*.25,.22,'#657c70');
  }else if(o.kind==='lounger'){
   legs(.24,.08);
   box(0,.24,0,w,.075,l,col,true);
   const back=box(0,.29,.06,w,.08,l*.37,'#d9c49f',true);back.rotation.x=.48;
  }else if(o.kind==='stairs'){
   const rise=Math.max(.3,levelOf(s,o.targetLevelId).elevation-levelOf(s,objectLevel(s,o)).elevation),n=Math.min(60,Math.max(3,Math.ceil(rise/.18)));
   for(let i=0;i<n;i++)box(0,0,i*l/n,w,rise*(i+1)/n,l/n,'#c9b18a');
   for(const x of[-w/2+.03,w/2-.03]){this.rod(g,[x,1,-l/2],[x,rise+1,l/2],.025);for(let i=0;i<=n;i+=Math.max(1,Math.floor(n/5)))this.rod(g,[x,rise*i/n,-l/2+l*i/n],[x,rise*i/n+1,-l/2+l*i/n],.018);}
  }else if(o.kind==='sofa'){
   box(.04,.12,.04,w-.08,.29,l-.08,'#9cab8b',true);box(0,.15,0,.16,.62,l,col,true);box(w-.16,.15,0,.16,.62,l,col,true);box(.12,.37,0,w-.24,.52,.18,'#a8ba95',true);for(let i=0;i<3;i++)box(.18+i*(w-.36)/3,.4,.22,(w-.42)/3,.14,Math.max(.2,l-.29),'#c5d1b3',true);legs(.15,.14);
  }else if(o.kind==='bed'){
   box(0,.1,0,w,.28,l,'#a3ada0',true);box(.05,.37,.05,w-.1,.19,l-.1,'#f4f1e8',true);box(0,.11,0,w,.95,.1,'#b5bfae',true);box(.07,.56,l*.34,w-.14,.04,l*.61,'#b7cdc2',true);for(const x of[.12,w*.53])box(x,.57,.16,w*.36,.12,.36,'#fffdf4',true);
  }else if(['table','coffee','desk','workbench'].includes(o.kind)){const h=o.kind==='coffee'?.38:.74;legs(h-.05);box(0,h,0,w,.07,l,col,true);}
  else if(o.kind==='plant'){
   this.cylinder(g,0,.02,0,Math.min(w,l)*.32,.32,'#b49c7c',Math.min(w,l)*.4);for(let i=0;i<6;i++)this.sphere(g,Math.cos(i*2.4)*w*.2,.43+(i%3)*.12,Math.sin(i*2.4)*l*.2,Math.min(w,l)*.3,['#7c986a','#94ac7a','#64875b'][i%3]);
  }else if(o.kind==='kitchen'||o.kind==='island'){
   box(0,.07,0,w,.78,l,'#aab49e');box(-.025,.85,-.025,w+.05,.055,l+.05,'#e5dfd0',true);for(let x=.05;x<w-.2;x+=.6){box(x,.13,l-.012,Math.min(.57,w-x-.04),.64,.018,'#b7bfaa');box(x+.11,.72,l+.01,.2,.018,.025,'#71836a');}
   if(o.kind==='kitchen'){box(w*.65,.91,.07,w*.28,.012,l*.72,'#45544a');for(let i=0;i<4;i++)this.cylinder(g,w*.7+(i%2)*w*.12-w/2,.93,.16+Math.floor(i/2)*l*.35-l/2,.055,.008,'#849081');box(.13,.911,.1,Math.min(.6,w*.25),.012,l*.64,'#a4bbb5',true);}
  }else if(['wardrobe','fridge','shelf'].includes(o.kind)){
   const h=o.kind==='fridge'?1.82:o.kind==='wardrobe'?2:1.7;
   if(o.kind==='shelf'){for(const x of[.025,w-.065])box(x,.03,.02,.04,h,l-.04,'#7d8c7a');for(let j=0;j<5;j++){box(0,.1+j*(h-.2)/4,0,w,.045,l,col);if(j<4)for(let i=0;i<Math.min(4,Math.floor(w/.45));i++)box(.08+i*.46,.15+j*(h-.2)/4,.06,.34,.22,l-.12,['#bfae8c','#9ea99a','#d1c9ad'][i%3]);}}
   else{box(0,.02,0,w,h,l,col,true);box(w*.5,.05,l+.005,.012,h-.08,.01,'#8d9c8c');for(const x of[w*.45,w*.55])box(x,h*.45,l+.015,.022,.28,.035,'#6b7c70');}
  }else if(o.kind==='shower'){
   box(0,.01,0,w,.08,l,'#e2e8e2',true);box(0,.09,0,.025,1.95,l,'#aaccc5',false,'glass');box(0,.09,0,w,1.95,.025,'#aaccc5',false,'glass');this.rod(g,[-w/2+.08,.1,-l/2+.05],[-w/2+.08,1.8,-l/2+.05],.022,'#889d96');
  }else if(o.kind==='wc'){
   box(.02,.04,.08,Math.max(.2,w-.04),.33,l*.7,'#f1f1e9',true);box(0,.35,0,w,.42,l*.27,'#f4f4ed',true);box(.015,.37,l*.27,w-.03,.08,l*.65,'#fcfbf4',true);
  }else if(o.kind==='sink'){
   box(0,.05,0,w,.74,l,'#bca788',true);box(-.02,.8,-.02,w+.04,.055,l+.04,'#e4e7dc',true);box(w*.2,.858,l*.16,w*.6,.018,l*.62,'#b2c8c2',true);
  }else if(o.kind==='printer'){
   box(0,.02,0,w,.08,l,'#52685f');for(const x of[.015,w-.045])box(x,.1,0,.03,.65,.04,'#667b70');box(0,.75,0,w,.045,.055,'#667b70');box(.05,.1,.05,w-.1,.015,l-.1,'#88b793');box(w*.4,.35,l*.35,w*.2,.15,l*.2,'#d5c8a7');
  }else if(o.kind==='car'){
   box(.04,.25,0,w-.08,.5,l,col,true);box(.13,.75,l*.25,w-.26,.6,l*.45,'#b4c6c6',true);for(const x of[-.03,w-.14])for(const y of[l*.16,l*.74])box(x,.14,y,.17,.35,.45,'#4d5750',true);
  }else box(0,.03,0,w,.5,l,col,true);
 }
 update(s,u,{fit=false}={}){
  this.visible=true;this.canvas.hidden=!!this.software;this.element.style.display='block';this.controls.enabled=true;
  const key=JSON.stringify([s,u.levelId,u.allLevels,u.exploded,u.overhead]);this.cutaway=u.cutaway!==false;
  if(key!==this.key){this.key=key;this.rebuild(s,u);fit=true;}
  this.highlight(s,u.selected);this.resize();if(fit)this.fit();this.cutWalls();this.schedule();if(this.fitDistance)this.onZoom?.(this.fitDistance/this.camera.position.distanceTo(this.controls.target));
 }
 rebuild(s,u){
  this.content.traverse(o=>{if(o.geometry&&!['BoxGeometry','RoundedBoxGeometry'].includes(o.geometry.type))o.geometry.dispose();});this.content.clear();this.wallParts=[];
  const C=compute(s),levels=u.allLevels===false?C.levels.filter(l=>l.id===u.levelId):C.levels,offsets=levelOffsets(C.levels,u.exploded&&u.allLevels!==false),B=s.building;
  const poolsOn=id=>s.objects.filter(o=>o.kind==='pool'&&objectLevel(s,o)===id).map(o=>objectRect(s,o));
  this.order=-100;
  for(const patch of unionCells([{x:0,y:0,w:B.w,l:B.l}],poolsOn(s.levels[0].id)))this.floor(this.content,patch,0,.2,'#d4d0c4','plain');
  const sliced=u.allLevels===false||u.exploded;
  const ordered=[...C.levels].sort((a,b)=>a.elevation-b.elevation);
  function shellTop(lev){return Math.min(B.h,ordered.find(l=>l.elevation>lev.elevation)?.elevation??B.h);}
  const drawShellCeiling=(group,z)=>{this.order=100;this.box(group,-B.wallThickness/2,z-B.ceilingThickness,-B.wallThickness/2,B.w+B.wallThickness,B.ceilingThickness,B.l+B.wallThickness,'#ecebde');};
  const drawEnvelopeParts=(group,lower,upper,z)=>{
   const t=B.wallThickness;
   for(const p of envelopeWalls(s,lower,upper)){
    const mesh=p.axis==='h'?this.box(group,p.start,z+p.bottom,p.pos-t/2,p.length,p.height,t,'#d8d3c7'):this.box(group,p.pos-t/2,z+p.bottom,p.start,t,p.height,p.length,'#ccc6b9');
    this.wallParts.push({mesh,p,z});
   }
   if(upper===B.h&&lower<upper&&B.shellCeiling&&u.overhead==='closed')drawShellCeiling(group,z+upper-lower);
  };
  if(!sliced){this.order=-5;drawEnvelopeParts(this.content,0,B.h,0);}
  for(const lev of [...levels].sort((a,b)=>a.elevation-b.elevation)){
   this.order=[...C.levels].sort((a,b)=>a.elevation-b.elevation).findIndex(l=>l.id===lev.id)*10;const z=offsets.get(lev.id),group=new THREE.Group();group.name=lev.name;this.content.add(group);
   if(sliced){const order=this.order;drawEnvelopeParts(group,lev.elevation,shellTop(lev),z);this.order=order;}
   const pools=poolsOn(lev.id);
   if(lev.kind!=='ground')for(const r of unionCells(lev.deck,pools))this.floor(group,r,z,lev.thickness,'#e0cda8','wood');
   for(const q of lev.surfaces||[])for(const r of unionCells([q],[...lev.holes,...lev.rooms,...pools]))this.floor(group,r,z+.014,lev.kind==='ground'?.1:Math.max(.04,lev.thickness-.014),q.finish==='concrete'?'#cdd4c9':'#e0c9a0',q.finish,{type:'surface',id:q.id});
   for(const r of lev.rooms)for(const cell of unionCells([r],[...lev.holes,...pools]))this.floor(group,cell,z+.025,.035,ROOM_TYPES[r.type].color,r.type==='bath'?'tile':'wood',{type:'room',id:r.id});
   this.order+=1;for(const p of wallPieces(s,lev,{omitExterior:B.walls&&lev.elevation<B.h})){
    const h=p.height,mesh=p.axis==='h'?this.box(group,p.start,z+p.bottom,p.pos-.06,p.length,h,.12,'#e3e7d8'):this.box(group,p.pos-.06,z+p.bottom,p.start,.12,h,p.length,'#d5ddca');
    this.wallParts.push({mesh,p,z});
   }
   if(lev.kind!=='ground'){
    const posts=[...(lev.surfaces||[]),...(lev.platform?[lev.platform]:[]),...lev.rooms],corners=new Set();
    if(!(u.exploded&&u.allLevels!==false))for(const r of posts)for(const [x,y] of[[r.x+.08,r.y+.08],[r.x+r.w-.08,r.y+.08],[r.x+.08,r.y+r.l-.08],[r.x+r.w-.08,r.y+r.l-.08]]){const key=x.toFixed(2)+':'+y.toFixed(2);if(corners.has(key))continue;corners.add(key);this.box(group,x-.065,0,y-.065,.13,Math.max(.05,z-lev.thickness),.13,'#8d9d83',null,false,'metal');}
   }
   for(const b of railingSegments(lev,B)){
    const horizontal=b.axis==='h',length=b.b-b.a,n=Math.max(1,Math.ceil(length/1.15));
    for(let i=0;i<=n;i++){const q=b.a+length*i/n,x=horizontal?q:b.pos,y=horizontal?b.pos:q;this.rod(group,[x,z,y],[x,z+1,y],.021,'#72826b');}
    for(const h of[.48,1])this.rod(group,horizontal?[b.a,z+h,b.pos]:[b.pos,z+h,b.a],horizontal?[b.b,z+h,b.pos]:[b.pos,z+h,b.b],.026,'#7a8c70');
   }
   for(const o of s.objects.filter(o=>objectLevel(s,o)===lev.id)){
    if(OBJECTS[o.kind].group!=='ceiling'){
     this.furniture(group,s,o,z+.055);continue;
    }
    if(!u.overhead||u.overhead==='open'||o.kind==='ceiling'&&u.overhead!=='closed')continue;
    const before=this.order;
    this.order+=o.kind==='ceiling'?4:2;
    this.furniture(group,s,o,z+equipmentHeight(s,o));
    this.order=before;
   }
   for(const o of s.openings.filter(o=>openingLevel(s,o)===lev.id)){
    const p=openingSegment(s,o),horizontal=Math.abs(p.y1-p.y2)<.01,e={type:'opening',id:o.id},bottom=z+o.sill;
    const part=(a,h,w,height,color,finish='plain')=>horizontal?this.box(group,p.x1+a,bottom+h,p.y1-.035,w,height,.07,color,e,false,finish):this.box(group,p.x1-.035,bottom+h,p.y1+a,.07,height,w,color,e,false,finish);
    if(o.kind==='window'){part(0,0,o.w,o.h,'#a2c4bc','glass');for(const a of[0,o.w-.035])part(a,0,.035,o.h,'#718c80');for(const h of[0,o.h-.035])part(0,h,o.w,.035,'#718c80');part(o.w/2-.018,0,.035,o.h,'#718c80');}
    else{part(0,0,.045,o.h,'#b19c7c');part(o.w-.045,0,.045,o.h,'#b19c7c');part(0,o.h-.045,o.w,.045,'#b19c7c');part(.06,0,o.w-.12,.035,'#ad9c7d');}
   }
  }
  this.bounds=new THREE.Box3().setFromObject(this.content);const size=this.bounds.getSize(new THREE.Vector3()),center=this.bounds.getCenter(new THREE.Vector3()),extent=Math.max(size.x,size.y,size.z,8);
  // Studio ground and shadow field extend beyond exterior terraces.
  const geo=new THREE.PlaneGeometry(extent*3,extent*3),ground=new THREE.Mesh(geo,this.material('#e8e4db'));ground.rotation.x=-Math.PI/2;ground.position.set(center.x,-.24,center.z);ground.receiveShadow=true;ground.userData.background=true;if(!this.software)this.content.add(ground);else geo.dispose();
  const shadow=this.sun.shadow.camera;shadow.left=shadow.bottom=-extent;shadow.right=shadow.top=extent;shadow.near=.5;shadow.far=extent*6;shadow.updateProjectionMatrix();this.sun.position.set(center.x-extent,extent*1.8,center.z+extent);this.sun.target.position.copy(center);this.sun.shadow.needsUpdate=true;
 }
 highlight(s,selected){
  if(this.outline){this.scene.remove(this.outline);this.outline.geometry.dispose();this.outline.material.dispose();this.outline=null;}
  this.selectionBounds=null;if(!selected)return;const o=selected.type==='room'?s.rooms.find(q=>q.id===selected.id):selected.type==='surface'?s.surfaces?.find(q=>q.id===selected.id):selected.type==='object'?s.objects.find(q=>q.id===selected.id):null;if(!o)return;
  const group=new THREE.Box3();for(const root of this.content.children){if(root.userData.background)continue;root.traverse(mesh=>{if(mesh.userData.entity?.id===selected.id||mesh.parent?.userData.entity?.id===selected.id)group.expandByObject(mesh);});}
  if(group.isEmpty())return;if(selected.type==='room')group.max.y+=o.h;this.selectionBounds=group.clone();this.outline=new THREE.Box3Helper(group,new THREE.Color('#ba4a2e'));this.outline.material.depthTest=false;this.outline.renderOrder=5;this.scene.add(this.outline);
 }
 cutWalls(){
  if(!this.wallParts)return;const direction=this.camera.position.clone().sub(this.controls.target);
  for(const {mesh,p,z} of this.wallParts){const facing=p.normal===0||p.normal*(p.axis==='h'?direction.z:direction.x)>0,limit=this.cutaway&&facing?.85:Infinity,height=Math.max(0,Math.min(p.height,limit-p.bottom));mesh.visible=height>.005;mesh.scale.y=Math.max(.008,height);mesh.position.y=z+p.bottom+height/2;}
 }
 focusSelected(){if(this.selectionBounds)this.fit(this.selectionBounds);}
 fit(bounds=this.bounds){
  if(!bounds)return;const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());center.y=Math.max(.3,center.y*.7);const a=this.camera.aspect||1,vfov=this.camera.fov*Math.PI/180,radius=Math.max(1,size.length()/2),halfAngle=Math.min(vfov/2,Math.atan(Math.tan(vfov/2)*a)),distance=radius/Math.sin(halfAngle)*1.1;
  const direction=this.camera.position.clone().sub(this.controls.target).normalize();if(!Number.isFinite(direction.x)||direction.length()<.1)direction.set(1,1,1).normalize();this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,distance);this.fitDistance=distance;this.controls.maxDistance=Math.max(100,distance*4);this.camera.far=Math.max(500,distance*8);this.camera.updateProjectionMatrix();this.controls.update();this.schedule();
 }
 zoom(factor){const delta=this.camera.position.clone().sub(this.controls.target);this.camera.position.copy(this.controls.target).add(delta.divideScalar(factor));this.controls.update();this.schedule();}
 setCamera(kind){const direction=kind==='top'?new THREE.Vector3(.001,1,.001):kind==='front'?new THREE.Vector3(.1,.4,1):new THREE.Vector3(1,1.1,1.3);this.camera.position.copy(this.controls.target).add(direction.normalize().multiplyScalar(this.fitDistance||20));this.fit();}
 resize(){if(!this.visible)return;const parent=this.canvas.parentElement,w=parent.clientWidth,h=parent.clientHeight;if(w<1||h<1)return;if(this.width!==w||this.height!==h){this.width=w;this.height=h;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.schedule();}}
 schedule(){if(this.frame||!this.visible)return;this.frame=requestAnimationFrame(()=>{this.frame=0;if(!this.visible)return;const changing=this.controls.update();this.renderer.render(this.scene,this.camera);if(changing)this.schedule();});}
 hide(){this.visible=false;this.controls.enabled=false;this.canvas.hidden=true;this.element.style.display='none';if(this.frame)cancelAnimationFrame(this.frame);this.frame=0;}
 imageBlob(){
  this.renderer.render(this.scene,this.camera);
  if(!this.software)return new Promise(resolve=>this.canvas.toBlob(resolve,'image/png'));
  // Paint the already projected vector paths directly; no SVG image decoder or external resource is needed.
  const canvas=document.createElement('canvas');canvas.width=this.width*2;canvas.height=this.height*2;const context=canvas.getContext('2d');context.fillStyle='#f2f0eb';context.fillRect(0,0,canvas.width,canvas.height);context.scale(2,2);context.translate(this.width/2,this.height/2);
  for(const element of this.element.querySelectorAll('path')){const path=new Path2D(element.getAttribute('d')||''),style=element.style;if(style.fill&&style.fill!=='none'){context.globalAlpha=Number(style.fillOpacity||style.opacity||1);context.fillStyle=style.fill;context.fill(path);}if(style.stroke&&style.stroke!=='none'){context.globalAlpha=Number(style.strokeOpacity||style.opacity||1);context.strokeStyle=style.stroke;context.lineWidth=parseFloat(style.strokeWidth)||1;context.lineJoin=style.strokeLinejoin||'round';context.lineCap=style.strokeLinecap||'round';context.stroke(path);}}
  return new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
 }

}
