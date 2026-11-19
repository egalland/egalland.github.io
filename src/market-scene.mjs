import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createSceneData,envelopeSections,interpolateMedian } from './scene-data.mjs';

const V=THREE.Vector3;
const clamp=THREE.MathUtils.clamp;
const price=n=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:n<1000?2:0,minimumFractionDigits:n<1000?2:0}).format(n);
const date=(t,day=false)=>new Date(t).toLocaleString('fr-FR',{timeZone:'Europe/Paris',...(day?{day:'2-digit',month:'short'}:{day:'2-digit',month:'numeric',hour:'2-digit',minute:'2-digit'})});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const glowColor=new THREE.Color('#70ffdc').multiplyScalar(2.1);
const iceColor=new THREE.Color('#8bd7ff').multiplyScalar(1.5);

function disposeGroup(group) {
  const geometries=new Set(),materials=new Set();
  group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));if(o.isInstancedMesh)o.dispose();});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();
}
function segments(points,color,opacity=1) {
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
}
function polyline(points,color,opacity=1) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:false}));
}
function tube(points,radius,color,opacity=1) {
  const path=new THREE.CurvePath();
  for(let i=1;i<points.length;i++)path.add(new THREE.LineCurve3(points[i-1],points[i]));
  return new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(8,points.length*2),radius,6,false),new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1}));
}
function ring(x,y,ry,rz,color,opacity=.3) {
  return polyline(Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2;return new V(x,y+Math.sin(a)*ry,Math.cos(a)*rz);}),color,opacity);
}

export class MarketScene {
  constructor({canvas,container,labels,tooltip,onFailure}) {
    this.canvas=canvas;this.container=container;this.labelRoot=labels;this.tooltip=tooltip;this.onFailure=onFailure;
    this.options={view:'spatial',animate:true,effects:true,volumes:true,band:true,motion:'system',type:'candle'};
    this.model=null;this.key='';this.active=true;this.inView=true;this.frame=0;this.lastRender=0;this.elapsed=0;this.drawn=0;this.dirty=true;this.pointerDown=false;this.manualTouch=false;this.cameraTween=null;this.selectedIndex=-1;this.mobile=innerWidth<=760||matchMedia('(pointer:coarse)').matches;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'high-performance'});
    this.renderer.setClearColor('#08121b',1);this.renderer.setPixelRatio(Math.min(devicePixelRatio,this.mobile?1.35:1.75));
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#08121b');this.scene.fog=new THREE.FogExp2('#08121b',.012);
    this.camera=new THREE.PerspectiveCamera(36,1,.1,180);this.camera.position.set(8,17,36);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.target.set(0,5,0);
    this.controls.enableDamping=true;this.controls.dampingFactor=.09;this.controls.minDistance=19;this.controls.maxDistance=80;
    this.controls.minPolarAngle=.3;this.controls.maxPolarAngle=Math.PI*.62;this.controls.minAzimuthAngle=-.85;this.controls.maxAzimuthAngle=.85;
    this.controls.enablePan=false;this.controls.enabled=!this.mobile;canvas.style.touchAction=this.mobile?'pan-y':'none';
    this.controls.addEventListener('change',()=>this.invalidate());
    this.controls.addEventListener('start',()=>{this.pointerDown=true;this.cameraTween=null;this.hideProbe();this.invalidate();});
    this.controls.addEventListener('end',()=>{this.pointerDown=false;this.invalidate();});
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
    this.bloom=new UnrealBloomPass(new THREE.Vector2(512,512),.58,.6,1.05);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.scene.add(new THREE.HemisphereLight('#b8e9ff','#10261f',2));
    const key=new THREE.DirectionalLight('#d4f4ff',3.2);key.position.set(-8,18,15);this.scene.add(key);
    const mint=new THREE.PointLight('#58f6cd',85,60,2);mint.position.set(2,8,7);this.scene.add(mint);
    const violet=new THREE.PointLight('#8083ff',110,60,2);violet.position.set(13,10,-8);this.scene.add(violet);
    this.environment=new THREE.Group();this.dataGroup=new THREE.Group();this.projectionGroup=new THREE.Group();this.volumeGroup=new THREE.Group();this.probeGroup=new THREE.Group();
    this.scene.add(this.environment,this.dataGroup,this.projectionGroup,this.volumeGroup,this.probeGroup);
    this.makeEnvironment();this.makeProbe();
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.pickPlane=new THREE.Plane(new V(0,0,1),0);this.pickPoint=new V();
    this.pointerStart=null;this.handlers=[];
    this.listen(canvas,'pointerdown',e=>{this.pointerStart={x:e.clientX,y:e.clientY};});
    this.listen(canvas,'pointermove',e=>{if(!this.pointerDown&&e.pointerType!=='touch')this.pick(e);});
    this.listen(canvas,'pointerleave',()=>this.hideProbe());
    this.listen(canvas,'pointerup',e=>{if(this.pointerStart&&Math.hypot(e.clientX-this.pointerStart.x,e.clientY-this.pointerStart.y)<7)this.pick(e,true);this.pointerStart=null;});
    this.listen(canvas,'keydown',e=>this.onKey(e));
    this.listen(canvas,'dblclick',()=>this.resetCamera());
    this.listen(canvas,'webglcontextlost',e=>{e.preventDefault();this.active=false;cancelAnimationFrame(this.frame);this.onFailure?.('Le contexte graphique a été interrompu.');});
    this.listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0;this.canvas.dataset.renderState='sleeping';}else this.invalidate();});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
    this.intersectionObserver=new IntersectionObserver(entries=>{this.inView=entries[0].isIntersecting;if(!this.inView){cancelAnimationFrame(this.frame);this.frame=0;this.canvas.dataset.renderState='sleeping';}else this.invalidate();},{rootMargin:'60px'});this.intersectionObserver.observe(container);
    this.resize();this.controls.update();this.invalidate();
  }
  listen(target,name,handler,opts){target.addEventListener(name,handler,opts);this.handlers.push(()=>target.removeEventListener(name,handler,opts));}
  reduced(){return this.options.motion==='none'||matchMedia('(prefers-reduced-motion:reduce)').matches;}
  moving(){return this.options.animate&&!this.reduced();}
  makeEnvironment() {
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{uTime:{value:0},uMotion:{value:1}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uMotion;
      void main(){vec2 p=vUv*vec2(30.,14.);vec2 g=abs(fract(p-.5)-.5)/max(fwidth(p),vec2(.001));float line=1.-min(min(g.x,g.y),1.);float fade=smoothstep(0.,.12,vUv.x)*(1.-smoothstep(.85,1.,vUv.x))*smoothstep(0.,.17,vUv.y)*(1.-smoothstep(.8,1.,vUv.y));float beam=pow(max(0.,1.-abs(vUv.x-fract(uTime*.035))/.10),4.)*.24*uMotion;vec3 c=mix(vec3(.08,.25,.31),vec3(.19,.6,.53),beam);gl_FragColor=vec4(c,(line*.34+beam*.08)*fade);}`});
    this.floor=new THREE.Mesh(new THREE.PlaneGeometry(36,18),material);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=-.1;this.environment.add(this.floor);
    const side=[];for(let i=0;i<=10;i++){const x=-15+i*3;side.push(new V(x,.8,-.65),new V(x,12.8,-.65),new V(x,-3.3,3.5),new V(x,-3.3,-.65));}
    this.environment.add(segments(side,'#21444f',.25));
    this.environment.add(segments([new V(-15,.8,-.65),new V(-15,13.3,-.65),new V(-15,.8,-.65),new V(15.4,.8,-.65)],'#548296',.6));
    this.environment.add(segments([new V(-15,-3.3,3.8),new V(15.4,-3.3,3.8),new V(-15,-3.3,-.4),new V(15.4,-3.3,-.4)],'#346371',.4));
    const seed=i=>{const n=Math.sin(i*78.233+5.123)*43758.5453;return n-Math.floor(n);};
    const positions=new Float32Array(100*3);for(let i=0;i<100;i++){positions[i*3]=(seed(i*3)-.5)*55;positions[i*3+1]=seed(i*3+1)*24-5;positions[i*3+2]=-4-seed(i*3+2)*18;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    this.environment.add(new THREE.Points(geo,new THREE.PointsMaterial({color:'#6a9aac',size:.035,transparent:true,opacity:.35,sizeAttenuation:true,depthWrite:false})));
  }
  makeProbe() {
    this.reticle=new THREE.Mesh(new THREE.TorusGeometry(.17,.013,5,36),new THREE.MeshBasicMaterial({color:glowColor}));
    this.cursorDot=new THREE.Mesh(new THREE.SphereGeometry(.055,8,8),new THREE.MeshBasicMaterial({color:'#effff9'}));
    const lines=segments([new V(0,-3.25,0),new V(0,13.4,0)],'#9feee3',.33);this.probeLine=lines;
    this.probeGroup.add(this.reticle,this.cursorDot,lines);this.probeGroup.visible=false;
  }
  update(input) {
    if(!this.active)return;
    const previous=this.options;this.options={...previous,...input.prefs};this.input=input;
    const a=input.data?.[0],b=input.data?.at(-1),f=input.forecast;
    const nextKey=[input.prefs.symbol,input.prefs.interval,input.zoom,input.prefs.type,input.prefs.band,a?.time,b?.time,b?.close,f?.seed,f?.horizon,f?.mode,this.worldWidth].join('|');
    if(nextKey!==this.key){this.key=nextKey;this.rebuild(createSceneData(input.data,f,input.zoom,input.prefs.band,this.worldWidth));}
    this.volumeGroup.visible=this.options.volumes;this.environment.children.filter(o=>o.userData.volume).forEach(o=>o.visible=this.options.volumes);
    this.bloom.enabled=this.options.effects&&!this.mobile&&!this.lowPower;
    this.floor.material.uniforms.uMotion.value=this.moving()?1:0;
    if(previous.view!==this.options.view)this.setView(this.options.view);
    this.canvas.setAttribute('aria-label',input.description||'Graphique de marché en trois dimensions.');
    this.canvas.dataset.renderer='threejs';this.canvas.dataset.view=this.options.view;
    this.invalidate();
  }
  rebuild(model) {
    disposeGroup(this.dataGroup);disposeGroup(this.projectionGroup);disposeGroup(this.volumeGroup);
    this.model=model;this.hideProbe();this.labelRoot.replaceChildren();this.labels=[];this.candleMesh=null;this.flow=null;
    if(!model)return;
    const {candles,future,width,step}=model;this.environment.scale.x=width/30;
    const grid=[];model.ticks.forEach(t=>grid.push(new V(-width/2,t.y,-.65),new V(width/2+.2,t.y,-.65)));
    this.dataGroup.add(segments(grid,'#355b69',.4));
    const box=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D(),color=new THREE.Color();
    const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.24,metalness:.23,emissive:'#326559',emissiveIntensity:.24});
    const body=new THREE.InstancedMesh(box,material,candles.length);this.candleMesh=body;
    const wick=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.82}),candles.length);
    const volume=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.4,metalness:.25,transparent:true,opacity:.7}),candles.length);
    const edges=[],edgeColors=[];
    for(const p of candles){
      color.set(p.up?'#72eac8':'#de819b');
      const height=Math.max(.035,Math.abs(p.close-p.open)),bottom=Math.min(p.open,p.close),bw=Math.min(.26,step*.64),depth=this.options.view==='front'?.16:.32;
      dummy.position.set(p.x,bottom+height/2,0);dummy.scale.set(bw,height,depth);dummy.updateMatrix();body.setMatrixAt(p.index,dummy.matrix);body.setColorAt(p.index,color);
      dummy.position.set(p.x,(p.high+p.low)/2,0);dummy.scale.set(Math.min(.023,step*.13),Math.max(.04,p.high-p.low),.023);dummy.updateMatrix();wick.setMatrixAt(p.index,dummy.matrix);wick.setColorAt(p.index,color);
      dummy.position.set(p.x,-3.2+p.volumeHeight/2,2.1);dummy.scale.set(Math.min(.30,step*.72),Math.max(.025,p.volumeHeight),1.65);dummy.updateMatrix();volume.setMatrixAt(p.index,dummy.matrix);volume.setColorAt(p.index,color.clone().multiplyScalar(.7));
      const x0=p.x-bw/2,x1=p.x+bw/2,y0=bottom,y1=bottom+height,z=.166;
      edges.push(new V(x0,y0,z),new V(x1,y0,z),new V(x1,y0,z),new V(x1,y1,z),new V(x1,y1,z),new V(x0,y1,z),new V(x0,y1,z),new V(x0,y0,z));
      for(let i=0;i<8;i++)edgeColors.push(color.r*1.25,color.g*1.25,color.b*1.25);
    }
    for(const mesh of [body,wick,volume]){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();}
    const edge=segments(edges,'#ffffff',.5);edge.geometry.setAttribute('color',new THREE.Float32BufferAttribute(edgeColors,3));edge.material.vertexColors=true;
    if(this.options.type==='candle')this.dataGroup.add(body,wick,edge);else{
      body.geometry.dispose();body.material.dispose();body.dispose();wick.geometry.dispose();wick.material.dispose();wick.dispose();edge.geometry.dispose();edge.material.dispose();this.candleMesh=null;
      const points=candles.map(p=>new V(p.x,p.close,0));this.dataGroup.add(tube(points,.035,glowColor));this.dataGroup.add(tube(points,.085,'#57ddb9',.10));
      const ribbon=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];ribbon.push(a.x,.8,0,b.x,.8,0,a.x,a.y,0,a.x,a.y,0,b.x,.8,0,b.x,b.y,0);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ribbon,3));this.dataGroup.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:'#56dfbf',transparent:true,opacity:.055,side:THREE.DoubleSide,depthWrite:false})));
    }
    this.volumeGroup.add(volume);
    const last=candles.at(-1),anchor=new V(last.x,last.close,0);
    const base=segments([new V(-width/2,last.close,-.1),new V(width/2,last.close,-.1)],'#75a7ad',.33);this.dataGroup.add(base);
    this.anchor=new THREE.Mesh(new THREE.SphereGeometry(.105,14,14),new THREE.MeshBasicMaterial({color:glowColor}));this.anchor.position.copy(anchor);this.dataGroup.add(this.anchor);
    this.anchorRings=[];for(let i=0;i<2;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.25+i*.14,.012,5,52),new THREE.MeshBasicMaterial({color:'#8de8da',transparent:true,opacity:.5-i*.15,depthWrite:false}));r.position.copy(anchor);this.anchorRings.push(r);this.dataGroup.add(r);}
    const boundary=[];for(let i=0;i<13;i++)boundary.push(new V(last.x,i+.4,0),new V(last.x,i+.65,0));this.dataGroup.add(segments(boundary,'#589a9b',.32));
    const stem=segments([new V(last.x,.8,0),new V(last.x,.8,5.3)],'#63d8c0',.4);this.dataGroup.add(stem);
    if(future.length>1)this.makeForecast(future);
    model.ticks.forEach((t,i)=>this.addLabel(price(t.value),new V(-width/2-.45,t.y,-.5),'axis-label axis-price',i));
    this.addLabel('USDT',new V(-width/2-.4,14,-.5),'axis-unit');
    const indexes=[0,Math.floor(candles.length/2),candles.length-1];
    indexes.forEach((i,k)=>this.addLabel(date(candles[i].raw.time,this.input.prefs.interval==='1d'),new V(candles[i].x,.20,.35),'axis-label time-label',k));
    this.addLabel('VOLUME',new V(-width/2+.35,-3.85,2.3),'volume-label');
    this.addLabel('DERNIÈRE CLÔTURE',new V(last.x,last.close+.8,0),'anchor-label-3d');
    if(future.length>1){const end=future.at(-1);
      this.addLabel(price(end.raw.median)+' USDT',new V(end.x+.3,end.median,0),'median-label');
      if(this.options.band){this.addLabel('90 % · '+price(end.raw.p90),new V(end.x+.15,end.high+.35,0),'quantile-label upper-label');this.addLabel('10 % · '+price(end.raw.p10),new V(end.x+.15,end.low-.4,0),'quantile-label lower-label');}
    }
    this.revealStart=performance.now();this.revealDuration=this.moving()?900:0;
    this.canvas.dataset.candles=String(candles.length);this.canvas.dataset.future=String(future.length-1);
    this.invalidate();
  }
  makeForecast(future) {
    const n=24;
    if(this.options.band)for(const inner of [false,true]){
      const sections=envelopeSections(future,inner),positions=[],uvs=[],indices=[];
      sections.forEach((s,i)=>{for(let j=0;j<=n;j++){const a=j/n*Math.PI*2;positions.push(s.x,s.center+Math.sin(a)*s.radiusY,Math.cos(a)*s.radiusZ);uvs.push(i/(sections.length-1),j/n);}});
      for(let i=0;i<sections.length-1;i++)for(let j=0;j<n;j++){const a=i*(n+1)+j,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
      const material=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{uTime:{value:0},uReveal:{value:0},uInner:{value:inner?1:0},uMotion:{value:1}},vertexShader:`varying vec2 vUv; varying vec3 vNormal; void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv; varying vec3 vNormal; uniform float uTime; uniform float uReveal; uniform float uInner; uniform float uMotion;
        void main(){if(vUv.x>uReveal)discard;float edge=pow(1.-abs(vNormal.z),1.6);float scan=pow(max(0.,1.-abs(fract(vUv.x-uTime*.16)-.5)/.10),4.)*uMotion;vec3 col=mix(vec3(.30,.31,.75),vec3(.19,.88,.70),smoothstep(0.,.6,vUv.y));col+=vec3(.18,.35,.3)*scan;float alpha=(.045+edge*.11+uInner*.035+scan*.04)*smoothstep(0.,.1,vUv.x);gl_FragColor=vec4(col,alpha);}`});
      const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=inner?3:2;this.projectionGroup.add(mesh);
      sections.forEach((s,i)=>{if(i>0&&(i%Math.max(3,Math.round(sections.length/6))===0||i===sections.length-1))this.projectionGroup.add(ring(s.x,s.center,s.radiusY,s.radiusZ,inner?'#75e4bb':'#758cdd',inner?.23:.25));});
    }
    if(this.options.band)for(const key of ['low','high','q25','q75']){
      const points=future.map(p=>new V(p.x,p[key],0));this.projectionGroup.add(polyline(points,key==='high'||key==='low'?'#7e9fe1':'#7ee2c4',.6));
    }
    const points=future.map(p=>new V(p.x,p.median,0));
    this.projectionGroup.add(tube(points,.037,glowColor));this.projectionGroup.add(tube(points,.10,'#6effd3',.11));
    const end=future.at(-1);this.endDot=new THREE.Mesh(new THREE.IcosahedronGeometry(.105,1),new THREE.MeshBasicMaterial({color:iceColor}));this.endDot.position.set(end.x,end.median,0);this.projectionGroup.add(this.endDot);
    const pos=new Float32Array(28*3),colors=new Float32Array(28*3);
    for(let i=0;i<28;i++){const c=new THREE.Color('#b6ffdf').multiplyScalar(1.5);c.toArray(colors,i*3);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    this.flow=new THREE.Points(geometry,new THREE.PointsMaterial({vertexColors:true,size:.085,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));this.flow.frustumCulled=false;this.projectionGroup.add(this.flow);
  }
  addLabel(text,point,cls,index=0) {
    const element=document.createElement('span');element.className='scene-label '+cls;element.textContent=text;this.labelRoot.append(element);this.labels.push({element,point,cls,index});
  }
  resize() {
    const r=this.container.getBoundingClientRect();if(!r.width||!r.height)return;
    const mobile=innerWidth<=760||matchMedia('(pointer:coarse)').matches;
    if(mobile!==this.mobile){this.mobile=mobile;this.manualTouch=false;this.controls.enabled=!mobile;this.canvas.style.touchAction=mobile?'pan-y':'none';this.renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.35:1.75));this.bloom.enabled=this.options.effects&&!mobile&&!this.lowPower;
      const button=document.querySelector('#scene-interact');if(button){button.setAttribute('aria-pressed','false');button.querySelector('span').textContent='Manipuler';}
    }
    this.width=r.width;this.height=r.height;this.renderer.setSize(r.width,r.height,false);this.composer.setSize(r.width,r.height);
    this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();
    const previous=this.worldWidth;this.worldWidth=Math.min(30,Math.max(15,24*this.camera.aspect));
    if(this.input&&Math.abs((previous||30)-this.worldWidth)>.2){this.key='';this.update(this.input);}
    this.resetCamera(false);this.invalidate();
  }
  cameraPosition(view) {
    const distance=Math.max(18/(2*Math.tan(Math.PI/10)),((this.worldWidth||30)+5)/(2*Math.tan(Math.PI/10)*this.camera.aspect))*1.08;
    const direction=view==='front'?new V(0,0,1):view==='volume'?new V(.06,.84,1):new V(.18,.32,1);
    return {position:direction.normalize().multiplyScalar(distance).add(new V(0,4.8,0)),target:new V(0,4.8,0),distance};
  }
  setView(view,animate=true) {
    this.hideProbe();const next=this.cameraPosition(view);
    this.controls.minDistance=next.distance*.52;this.controls.maxDistance=next.distance*2;
    this.controls.enableRotate=view!=='front';
    if(animate&&!this.reduced())this.cameraTween={start:performance.now(),from:this.camera.position.clone(),targetFrom:this.controls.target.clone(),to:next.position,targetTo:next.target};
    else {this.camera.position.copy(next.position);this.controls.target.copy(next.target);this.controls.update();this.cameraTween=null;}
    this.invalidate();
  }
  resetCamera(animate=true){this.setView(this.options.view,animate);}
  setTouchInteraction(enabled) {this.manualTouch=enabled;this.controls.enabled=!this.mobile||enabled;this.canvas.style.touchAction=this.controls.enabled?'none':'pan-y';this.canvas.classList.toggle('is-manipulating',enabled);this.invalidate();return enabled;}
  pick(event,announce=false) {
    if(!this.model||!this.active)return;
    const r=this.canvas.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    let index;
    if(this.candleMesh){const hit=this.raycaster.intersectObject(this.candleMesh,false)[0];if(hit)index=hit.instanceId;}
    if(index===undefined){const hit=this.raycaster.ray.intersectPlane(this.pickPlane,this.pickPoint);
      if(!hit||hit.x< -this.model.width/2-this.model.step||hit.x>this.model.width/2+this.model.step||hit.y< -3.8||hit.y>14){this.hideProbe();return;}
      index=Math.round((hit.x+this.model.width/2)/this.model.step);
    }
    this.showProbe(clamp(index,0,this.model.candles.length+this.model.bands.length-1),announce);
  }
  showProbe(index,announce=false) {
    if(!this.model)return;
    const m=this.model,isFuture=index>=m.candles.length,p=isFuture?m.future[index-m.candles.length+1]:m.candles[index];if(!p)return;
    const value=isFuture?p.raw.median:p.raw.close,yy=isFuture?p.median:p.close;
    this.selectedIndex=index;this.probeGroup.visible=true;
    this.reticle.position.set(p.x,yy,.17);this.cursorDot.position.set(p.x,yy,.2);this.probeLine.position.x=p.x;
    this.probeWorld=new V(p.x,yy,.2);
    this.tooltip.innerHTML=`<div class="probe-top"><i></i>${isFuture?'SCÉNARIO STATISTIQUE':'BOUGIE CLÔTURÉE'}</div><small>${esc(date(p.raw.time))} · Paris</small><strong>${price(value)} <span>USDT</span></strong>`+(isFuture?`<div class="probe-grid"><span>Q10<b>${price(p.raw.p10)}</b></span><span>Q90<b>${price(p.raw.p90)}</b></span></div>`:`<div class="probe-grid"><span>Ouv.<b>${price(p.raw.open)}</b></span><span>Haut<b>${price(p.raw.high)}</b></span><span>Bas<b>${price(p.raw.low)}</b></span><span>Volume<b>${new Intl.NumberFormat('fr-FR',{notation:'compact',maximumFractionDigits:2}).format(p.raw.volume)}</b></span></div>`);
    this.tooltip.hidden=false;
    const ohlc=document.querySelector('#ohlc');if(ohlc)ohlc.textContent=isFuture?'Médiane · '+price(value):`O ${price(p.raw.open)} H ${price(p.raw.high)} B ${price(p.raw.low)} C ${price(value)}`;
    if(announce){const live=document.querySelector('#scene-readout');if(live)live.textContent=`${isFuture?'Scénario':'Clôture'} du ${date(p.raw.time)} : ${price(value)} USDT.`;}
    this.invalidate();
  }
  hideProbe() {this.selectedIndex=-1;this.tooltip.hidden=true;this.probeGroup.visible=false;this.probeWorld=null;const ohlc=document.querySelector('#ohlc');if(ohlc)ohlc.textContent='Bougies clôturées';this.invalidate();}
  onKey(event) {
    if(!this.model)return;
    const max=this.model.candles.length+this.model.bands.length-1;
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();this.showProbe(clamp((this.selectedIndex<0?this.model.candles.length-1:this.selectedIndex)+(event.key==='ArrowRight'?1:-1),0,max),true);}
    else if(event.key==='Home'||event.key==='End'){event.preventDefault();this.showProbe(event.key==='Home'?0:max,true);}
    else if(event.key==='Escape')this.hideProbe();
    else if(event.key.toLowerCase()==='r'){event.preventDefault();this.resetCamera();}
  }
  renderLabels() {
    const project=point=>{const p=point.clone().project(this.camera);return {x:(p.x+1)/2*this.width,y:(1-p.y)/2*this.height,visible:p.z>-1&&p.z<1&&p.x>-1.1&&p.x<1.1&&p.y>-1.1&&p.y<1.1};};
    for(const label of this.labels||[]){const p=project(label.point);let visible=p.visible;
      if(this.width<450&&label.cls.includes('axis-price')&&label.index%2===1)visible=false;
      if(label.cls.includes('volume-label')&&!this.options.volumes)visible=false;
      if(label.cls.includes('quantile-label')&&this.options.view==='volume')visible=false;
      label.element.hidden=!visible;if(!visible)continue;
      let x=p.x,y=p.y;
      if(label.cls.includes('median-label')){x=clamp(x,65,this.width-100);y=clamp(y,85,this.height-85);}
      else if(label.cls.includes('quantile-label')){x=clamp(x,80,this.width-90);y=clamp(y,80,this.height-90);}
      else {x=clamp(x,label.cls.includes('axis-price')?47:13,this.width-15);y=clamp(y,70,this.height-60);}
      label.element.style.left=x+'px';label.element.style.top=y+'px';
    }
    if(this.probeWorld){const p=project(this.probeWorld),box=this.tooltip;
      box.style.left=clamp(p.x+(p.x>this.width*.6?-215:20),8,Math.max(8,this.width-210))+'px';box.style.top=clamp(p.y-85,66,this.height-185)+'px';
    }
  }
  invalidate() {
    this.dirty=true;
    if(!this.frame&&!this.rendering&&this.active&&this.inView&&!document.hidden)this.frame=requestAnimationFrame(t=>this.render(t));
  }
  render(now) {
    this.frame=0;
    if(!this.active||!this.inView||document.hidden){this.canvas.dataset.renderState='sleeping';return;}
    const moving=this.moving(),budget=this.mobile||this.lowPower?1000/24:1000/30;
    if(now-this.lastRender<budget&&(moving||this.cameraTween)){this.frame=requestAnimationFrame(t=>this.render(t));return;}
    this.rendering=true;this.dirty=false;
    const start=performance.now(),delta=Math.min(.1,(now-(this.lastRender||now))/1000);this.lastRender=now;
    if(moving)this.elapsed+=delta;
    let changed=false;
    try{
      if(this.cameraTween){const t=clamp((now-this.cameraTween.start)/750,0,1),ease=1-(1-t)**4;
        this.camera.position.lerpVectors(this.cameraTween.from,this.cameraTween.to,ease);this.controls.target.lerpVectors(this.cameraTween.targetFrom,this.cameraTween.targetTo,ease);if(t===1)this.cameraTween=null;
      }
      changed=this.controls.update();
      this.floor.material.uniforms.uTime.value=this.elapsed;
      const reveal=this.revealDuration?clamp((now-this.revealStart)/this.revealDuration,0,1):1;
      for(const obj of this.projectionGroup.children){if(obj.material?.uniforms?.uReveal){obj.material.uniforms.uReveal.value=reveal;obj.material.uniforms.uTime.value=this.elapsed;obj.material.uniforms.uMotion.value=moving?1:0;}}
      if(this.flow&&this.model){const a=this.flow.geometry.attributes.position;
        for(let i=0;i<a.count;i++){const t=(i/a.count+this.elapsed*.13)%1,p=interpolateMedian(this.model.future,t);a.setXYZ(i,p.x,p.y,.08);}
        a.needsUpdate=true;this.flow.visible=this.options.effects;
      }
      for(const [i,r] of (this.anchorRings||[]).entries()){const scale=1+(moving?.12*Math.sin(this.elapsed*1.7+i*2):0);r.scale.setScalar(scale);}
      if(this.bloom.enabled)this.composer.render();else this.renderer.render(this.scene,this.camera);
      this.renderLabels();this.drawn++;
      this.canvas.dataset.renderState=moving?'animated':'paused';
      if(this.drawn%30===0)this.canvas.dataset.drawCalls=String(this.renderer.info.render.calls);
      const cost=performance.now()-start;
      if(this.drawn>8){this.cost=(this.cost||cost)*.9+cost*.1;if(this.cost>40&&!this.lowPower){this.lowPower=true;this.bloom.enabled=false;this.renderer.setPixelRatio(1);this.renderer.setSize(this.width,this.height,false);this.composer.setSize(this.width,this.height);}}
    }catch(error){this.active=false;this.onFailure?.(error.message);}
    this.rendering=false;
    if(this.active&&(moving||this.cameraTween||changed||this.dirty||(this.revealDuration&&now-this.revealStart<this.revealDuration)))this.invalidate();
  }
  dispose() {
    this.active=false;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.intersectionObserver.disconnect();this.handlers.forEach(f=>f());this.controls.dispose();
    [this.dataGroup,this.projectionGroup,this.volumeGroup,this.environment,this.probeGroup].forEach(disposeGroup);
    this.bloom.dispose();this.composer.dispose();this.renderer.dispose();this.labelRoot.replaceChildren();
  }
}
