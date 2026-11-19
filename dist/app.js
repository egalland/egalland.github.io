import {createRigs,makeRigSkins} from './rigs.mjs';
import {fixedShip,walkState,banarModels} from './kinematics.mjs';
import {makeClosedCanopy,CABIN_RECT,CABIN_FLOOR} from './canopy.mjs';

const $=id=>document.getElementById(id);
const TAU=Math.PI*2, DURATION=34;
let W=1600,H=900,portrait=false;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const mix=(a,b,p)=>a+(b-a)*p;
const identity=()=>new Float32Array([1,0,0,0,1,0,0,0,1]);
function matrix(sx=1,sy=1,r=0,x=0,y=0){const c=Math.cos(r),s=Math.sin(r);return new Float32Array([c*sx,s*sx,0,-s*sy,c*sy,0,x,y,1])}
function mul(a,b){const c=new Float32Array(9);for(let i=0;i<3;i++)for(let j=0;j<3;j++)c[i*3+j]=a[j]*b[i*3]+a[3+j]*b[i*3+1]+a[6+j]*b[i*3+2];return c}
const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let prefs={quality:'auto',atmosphere:!motionReduced,parallax:!motionReduced};
try{const saved=JSON.parse(localStorage.getItem('banars-cinema-settings')||'null');if(saved)prefs={...prefs,...saved};if(!['auto','hd','4k'].includes(prefs.quality))prefs.quality='auto'}catch{}
const state={ready:false,playing:!motionReduced,time:0,last:0,chapter:-1,pointer:{x:0,y:0},look:{x:0,y:0},frame:0};
let renderer,rigs,textures={},images={},toastTimer;
const chapters=[{t:0,name:'Une drôle de promenade'},{t:5,name:'Un visiteur dans la nuit'},{t:10,name:'Les banars prennent de la hauteur'},{t:16,name:'La fête du troisième type'},{t:27.4,name:'L’alien reprend le volant'}];
function toast(s){$('toast').textContent=s;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3300)}
function savePrefs(){try{localStorage.setItem('banars-cinema-settings',JSON.stringify(prefs))}catch{}}
function party(t){return smooth((t-15.3)/1.1)*(1-smooth((t-27.2)/.85))}
function shipAt(t){return fixedShip(t,{portrait,height:H})}

class SceneGL{
 constructor(canvas){
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{alpha:false,antialias:true,premultipliedAlpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
  if(!gl)throw Error('Le rendu animé nécessite WebGL 2. Essayez un navigateur récent.');
  const vert=`#version 300 es
  precision highp float;
  in vec2 aUV;uniform vec4 uRect;uniform mat3 uMatrix;uniform vec2 uResolution;out vec2 vUV;
  void main(){vec2 p=uRect.xy+aUV*uRect.zw;vec3 world=uMatrix*vec3(p,1.);gl_Position=vec4(world.x/uResolution.x*2.-1.,1.-world.y/uResolution.y*2.,0.,1.);vUV=aUV;}
  `;
  const frag=`#version 300 es
  precision highp float;uniform sampler2D uTexture;uniform vec3 uColor;uniform float uOpacity,uBrightness,uReflect;uniform vec4 uRim;in vec2 vUV;out vec4 outColor;
  void main(){vec2 uv=vUV;if(uReflect>.5)uv.y=1.-uv.y;vec4 p=texture(uTexture,uv);if(p.a<.015)discard;
   if(uReflect>.5){p=(p+texture(uTexture,uv+vec2(.006,.002))+texture(uTexture,uv-vec2(.006,.002)))/3.;p.a*=pow(1.-vUV.y,2.)*.65;}
   float edge=0.;if(uRim.a>.01){float a=texture(uTexture,uv+vec2(.003,0.)).a;float b=texture(uTexture,uv-vec2(.003,0.)).a;edge=clamp(p.a-min(a,b),0.,1.);}
   outColor=vec4(p.rgb*uColor*uBrightness+uRim.rgb*edge*uRim.a,p.a*uOpacity);}
  `;
  this.program=this.programFor(vert,frag);this.loc={};for(const name of ['uRect','uMatrix','uResolution','uColor','uOpacity','uBrightness','uReflect','uRim'])this.loc[name]=gl.getUniformLocation(this.program,name);
  const uv=[],N=1,M=1;for(let y=0;y<M;y++)for(let x=0;x<N;x++){const a=x/N,b=y/M,d=1/N,e=1/M;uv.push(a,b,a+d,b,a,b+e,a,b+e,a+d,b,a+d,b+e)}
  this.count=uv.length/2;this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(uv),gl.STATIC_DRAW);const pos=gl.getAttribLocation(this.program,'aUV');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  this.pointsProgram=this.programFor(`#version 300 es\nprecision highp float;in vec4 aPos;in vec3 aColor;uniform float uScale;uniform vec2 uResolution;out float vAlpha;out vec3 vColor;void main(){gl_Position=vec4(aPos.x/uResolution.x*2.-1.,1.-aPos.y/uResolution.y*2.,0.,1.);gl_PointSize=aPos.z*uScale;vAlpha=aPos.w;vColor=aColor;}`,`#version 300 es\nprecision highp float;in float vAlpha;in vec3 vColor;out vec4 outColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;outColor=vec4(vColor,exp(-d*d*5.)*vAlpha);}`);
  this.pointsVAO=gl.createVertexArray();gl.bindVertexArray(this.pointsVAO);this.pointsBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.pointsBuffer);const ap=gl.getAttribLocation(this.pointsProgram,'aPos'),ac=gl.getAttribLocation(this.pointsProgram,'aColor');gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,4,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(ac);gl.vertexAttribPointer(ac,3,gl.FLOAT,false,28,16);this.pointScale=gl.getUniformLocation(this.pointsProgram,'uScale');this.pointsResolution=gl.getUniformLocation(this.pointsProgram,'uResolution');
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(.018,.034,.055,1);
 }
 programFor(v,f){const g=this.gl;const compile=(type,src)=>{const s=g.createShader(type);g.shaderSource(s,src);g.compileShader(s);if(!g.getShaderParameter(s,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(s));return s};const p=g.createProgram();g.attachShader(p,compile(g.VERTEX_SHADER,v));g.attachShader(p,compile(g.FRAGMENT_SHADER,f));g.linkProgram(p);if(!g.getProgramParameter(p,g.LINK_STATUS))throw Error(g.getProgramInfoLog(p));return p}
 texture(img){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,img);return {texture:t,width:img.width,height:img.height}}
 begin(){const g=this.gl;g.viewport(0,0,this.canvas.width,this.canvas.height);g.clear(g.COLOR_BUFFER_BIT)}
 draw(name,rect,o={}){const g=this.gl,l=this.loc,t=textures[name];if(!t)return;g.useProgram(this.program);g.bindVertexArray(this.vao);g.bindTexture(g.TEXTURE_2D,t.texture);g.uniform4fv(l.uRect,rect);g.uniform2f(l.uResolution,W,H);g.uniformMatrix3fv(l.uMatrix,false,o.matrix||identity());g.uniform3fv(l.uColor,o.color||[1,1,1]);g.uniform1f(l.uOpacity,o.alpha??1);g.uniform1f(l.uBrightness,o.brightness??1);g.uniform1f(l.uReflect,o.reflect?1:0);g.uniform4fv(l.uRim,o.rim||[.25,.7,.8,0]);g.drawArrays(g.TRIANGLES,0,this.count)}
 points(data){const g=this.gl;if(!data.length)return;g.useProgram(this.pointsProgram);g.bindVertexArray(this.pointsVAO);g.bindBuffer(g.ARRAY_BUFFER,this.pointsBuffer);g.bufferData(g.ARRAY_BUFFER,new Float32Array(data),g.DYNAMIC_DRAW);g.uniform1f(this.pointScale,this.canvas.width/W);g.uniform2f(this.pointsResolution,W,H);g.blendFunc(g.SRC_ALPHA,g.ONE);g.drawArrays(g.POINTS,0,data.length/7);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA)}
}

// The same layered scene remains available when a device has no WebGL context.
class Scene2D{
 constructor(canvas){this.canvas=canvas;this.g=canvas.getContext('2d',{alpha:false});if(!this.g)throw Error('Ce navigateur ne permet pas d’afficher la projection animée.');this.dot=surface(32,32,glow)}
 texture(image){return {image,width:image.width,height:image.height,cache:new Map()}}
 begin(){const g=this.g;g.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.fillStyle='#07101b';g.fillRect(0,0,W,H)}
 draw(name,rect,o={}){
  const tex=textures[name];if(!tex)return;let img=tex.image;
  const brightness=Math.round((o.brightness??1)*10)/10;
  if(brightness!==1||o.reflect){const key=`${brightness}-${!!o.reflect}`;if(!tex.cache.has(key)){
   const c=surface(tex.width,tex.height,(q,w,h)=>{q.filter=`brightness(${brightness})`;if(o.reflect){q.translate(0,h);q.scale(1,-1)}q.drawImage(img,0,0);q.setTransform(1,0,0,1,0,0);q.filter='none';if(o.reflect){q.globalCompositeOperation='destination-in';const grad=q.createLinearGradient(0,0,0,h);grad.addColorStop(0,'rgba(255,255,255,.5)');grad.addColorStop(1,'rgba(255,255,255,0)');q.fillStyle=grad;q.fillRect(0,0,w,h)}});tex.cache.set(key,c)}img=tex.cache.get(key)}
  const g=this.g,m=o.matrix||identity(),[x,y,w,h]=rect;g.save();g.transform(m[0],m[1],m[3],m[4],m[6],m[7]);g.globalAlpha=o.alpha??1;
  g.drawImage(img,x,y,w,h);g.restore();
 }
 points(data){const g=this.g;g.save();g.globalCompositeOperation='lighter';for(let i=0;i<data.length;i+=7){const [x,y,size,alpha]=data.slice(i,i+4);g.globalAlpha=alpha;g.drawImage(this.dot,x-size/2,y-size/2,size,size)}g.restore()}
}

function surface(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c}
function glow(c,w,h){const gr=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);gr.addColorStop(0,'rgba(180,255,230,.7)');gr.addColorStop(.2,'rgba(88,223,196,.32)');gr.addColorStop(1,'rgba(20,100,130,0)');c.fillStyle=gr;c.fillRect(0,0,w,h)}
function makeProcedurals(){
 textures.glow=renderer.texture(surface(256,256,glow));
 textures.shadow=renderer.texture(surface(256,128,(c,w,h)=>{c.scale(1,.5);const gr=c.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(0,3,8,.83)');gr.addColorStop(1,'rgba(0,3,8,0)');c.fillStyle=gr;c.fillRect(0,0,256,256)}));
 textures.beam=renderer.texture(surface(768,1024,(c,w,h)=>{
  c.beginPath();c.moveTo(w*.40,0);c.lineTo(w*.60,0);c.lineTo(w,h);c.lineTo(0,h);c.closePath();c.clip();
  const a=c.createLinearGradient(0,0,w,0);a.addColorStop(0,'rgba(93,255,218,0)');a.addColorStop(.20,'rgba(146,255,229,.08)');a.addColorStop(.49,'rgba(189,255,232,.33)');a.addColorStop(.51,'rgba(189,255,232,.33)');a.addColorStop(.8,'rgba(146,255,229,.08)');a.addColorStop(1,'rgba(93,255,218,0)');c.fillStyle=a;c.fillRect(0,0,w,h);
  c.globalCompositeOperation='destination-in';const b=c.createLinearGradient(0,0,0,h);b.addColorStop(0,'rgba(255,255,255,.95)');b.addColorStop(.8,'rgba(255,255,255,.6)');b.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=b;c.fillRect(0,0,w,h);
 }));
 Object.assign(textures,makeClosedCanopy(renderer,surface,images.night));
 textures.deck=renderer.texture(surface(1000,110,(c,w,h)=>{c.beginPath();c.ellipse(500,54,490,47,0,0,TAU);const gr=c.createLinearGradient(0,0,0,110);gr.addColorStop(0,'#577a7c');gr.addColorStop(.45,'#243d43');gr.addColorStop(1,'#0d2029');c.fillStyle=gr;c.fill();c.strokeStyle='#a7e9dc52';c.lineWidth=2;c.stroke();for(let k=0;k<8;k++){c.beginPath();c.moveTo(500,54);c.lineTo(k*150-20,100);c.strokeStyle='#96b8b50e';c.lineWidth=2;c.stroke()}}));
 let seed=714;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 textures.fog=renderer.texture(surface(1024,256,(c,w,h)=>{for(let k=0;k<36;k++){const x=rand()*w,y=rand()*h,rx=70+rand()*140,ry=8+rand()*27;c.save();c.translate(x,y);c.scale(rx,ry);const gr=c.createRadialGradient(0,0,0,0,0,1);gr.addColorStop(0,`rgba(145,184,192,${.1+rand()*.12})`);gr.addColorStop(1,'rgba(145,184,192,0)');c.fillStyle=gr;c.fillRect(-1,-1,2,2);c.restore()}}));
 textures.heart=renderer.texture(surface(96,96,(c,w,h)=>{c.shadowColor='#ff7494';c.shadowBlur=10;c.translate(48,48);c.beginPath();c.moveTo(0,18);c.bezierCurveTo(-39,-5,-19,-35,0,-14);c.bezierCurveTo(19,-35,39,-5,0,18);c.strokeStyle='#f5a8acb0';c.lineWidth=2.5;c.stroke()}));
 textures.foreground=renderer.texture(surface(1600,900,(c,w,h)=>{c.drawImage(images.night,0,0,w,h);c.globalCompositeOperation='destination-in';const gr=c.createLinearGradient(0,750,0,900);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,.95)');c.fillStyle=gr;c.fillRect(0,0,w,h)}));
}

let randomSeed=833;const random=()=>{randomSeed=(randomSeed*1664525+1013904223)>>>0;return randomSeed/4294967296};
const motes=Array.from({length:115},(_,i)=>({x:random()*W,y:random()*H,z:.15+random()*.85,p:random()*TAU,s:1+random()*3,i}));
const dust=Array.from({length:90},()=>({x:random()*2-1,y:random(),z:random(),p:random()*TAU}));
const chars=[{h:220,slot:-220},{h:294,slot:-110},{h:252,slot:5},{h:247,slot:110}];
function scene(t){
 renderer.begin();
 const px=prefs.parallax?state.look.x:0,py=prefs.parallax?state.look.y:0;
 const camera=matrix(1,1,0,px*11,py*7);
 const groundY=portrait?H*.76:790,insideHeights=portrait?[166,215,180,176]:[139,182,155,151];
 const bgScale=Math.max((W+40)/textures.night.width,(H+24)/textures.night.height),bw=textures.night.width*bgScale,bh=textures.night.height*bgScale;
 const backgroundRect=[(W-bw)/2,(H-bh)/2,bw,bh];
 renderer.draw('night',backgroundRect,{matrix:matrix(1,1,0,px*5,py*3),brightness:.87,color:[.94,.98,1]});
 const reset=t>=32,actorTime=reset?0:t,ship=shipAt(t),dancing=party(t),crewDance=smooth((t-15.3)/1.1);
 const travel=portrait?110:180;
 const beam=smooth((t-9.4)/1.3)*(1-smooth((t-15)/1.0));
 if(prefs.atmosphere){renderer.draw('fog',[-170+Math.sin(t*.10)*90,H*.59,W+340,H*.21],{matrix:camera,alpha:.5});
  if(ship.visible){renderer.draw('glow',[ship.x-360*ship.s,groundY-144,720*ship.s,180],{matrix:camera,alpha:.24*clamp((t-5)/4),brightness:1.15});
   if(beam>0){renderer.draw('beam',[ship.x-365*beam,ship.y+ship.s*95,730*beam,groundY-ship.y-ship.s*95],{matrix:camera,alpha:beam});renderer.draw('glow',[ship.x-370,groundY-75,740,160],{matrix:camera,alpha:.28*beam})}}
 }
 let shipMatrix;
 if(ship.visible){
  shipMatrix=mul(camera,matrix(ship.s,ship.s,ship.r,ship.x,ship.y));
  renderer.draw('domeBack',CABIN_RECT,{matrix:shipMatrix});renderer.draw('cabinSkirt',[-380,-36,760,105],{matrix:shipMatrix});renderer.draw('deck',[-369,-25,738,70],{matrix:shipMatrix,brightness:.74});
  if(prefs.atmosphere){renderer.draw('glow',[-210,-195,420,230],{matrix:shipMatrix,alpha:.11+dancing*.1,color:[.35,.6,1]});renderer.draw('glow',[-350,-125,700,190],{matrix:shipMatrix,alpha:dancing*.1,color:[.85,.35,.65]})}
  rigs.alien(213,CABIN_FLOOR,198,t,shipMatrix);
 }
 for(let i=0;i<4;i++){
  const ch=chars[i],charH=ch.h*(portrait?1.10:1),p=reset?0:clamp((t-10.8-i*.38)/3.0);
  const walk=walkState(actorTime,travel,i),bodyScale=charH/banarModels[i].height;
  const gx=(portrait?190+i*175:510+i*207)-travel+walk.distance,gy=groundY;
  const walkOptions={distance:walk.distance/bodyScale,stride:travel/(walk.cycles*bodyScale),locomotion:true,walk:walk.weight};
  if(p===0){
   const ww=charH*.65;
   renderer.draw('shadow',[gx-ww*.56,gy-8,ww*1.12,27],{matrix:camera,alpha:.8});
   rigs.banar(i,gx,gy,charH,actorTime,camera,{...walkOptions,reflection:true});
   rigs.banar(i,gx,gy,charH,actorTime,camera,walkOptions);
   if(t<9.8||reset){const q=(actorTime*.23+i*.23)%1;renderer.draw('heart',[gx-22+Math.sin(actorTime+i)*8,gy-charH-65-q*45,38,38],{matrix:camera,alpha:.48*Math.sin(q*Math.PI)})}
  }else if(p<1){
   const e=smooth(p),finalH=insideHeights[i]*ship.s;
   const x=mix(gx,ship.x+ch.slot*ship.s,e)+Math.sin(p*TAU*1.2+i)*Math.sin(p*Math.PI)*28,y=mix(gy,ship.y+CABIN_FLOOR*ship.s,e),h=mix(charH,finalH,e);
   rigs.banar(i,x,y,h,t,camera,{...walkOptions,walk:0,settle:e,air:Math.sin(p*Math.PI)});
  }else if(ship.visible){rigs.banar(i,ch.slot,CABIN_FLOOR,insideHeights[i],t,shipMatrix,{dance:crewDance})}
 }

 if(ship.visible){
  renderer.draw('domeFront',CABIN_RECT,{matrix:shipMatrix});
  renderer.draw('hull',[-420,-4,840,201],{matrix:shipMatrix,brightness:.92,color:[.85,.97,.94],rim:[.2,.65,.7,.2]});
  if(prefs.atmosphere){
   renderer.draw('glow',[-170,126,340,97],{matrix:shipMatrix,alpha:.28});
   for(let i=0;i<7;i++){const x=-340+i*113,y=61+Math.abs(x)*.04;renderer.draw('glow',[x-21,y-10,42,21],{matrix:shipMatrix,alpha:.12+.08*Math.sin(t*1.7+i),color:[1,.68,.31]})}
   const glint=160+Math.sin(t*.43)*170;renderer.draw('glow',[glint-130,-1,260,8],{matrix:shipMatrix,alpha:.19,color:[.7,.98,1]});
  }
 }
 if(prefs.atmosphere){
  renderer.draw('fog',[-240-Math.sin(t*.07)*100,H*.825,W+480,H*.19],{matrix:matrix(1,1,0,px*22,py*9),alpha:.30});
  const points=[];
  for(const m of motes){const y=((m.y/900*H-t*(1.8+m.z*2))%H+H)%H,x=m.x/1600*W+Math.sin(t*.19+m.p)*9+px*(5+m.z*16);const alpha=(.08+.11*Math.sin(t*.9+m.p))*m.z;points.push(x,y,m.s*m.z+1,Math.max(.02,alpha),.69,.86,.85)}
  if(beam>.01&&ship.visible)for(const d of dust){const q=(d.y+t*.15)%1,x=ship.x+d.x*mix(320,36,q)*beam+Math.sin(t*1.3+d.p)*7,y=mix(groundY-4,ship.y+ship.s*100,q);points.push(x,y,1.5+d.z*3,.34*beam*(.5+d.z),.62,.98,.82)}
  // Near-camera out-of-focus motes give a separate foreground depth plane.
  for(let i=0;i<7;i++){const x=(motes[i].x/1600*W+t*(7+i*1.2))%W,y=H*.75+Math.sin(t*.16+i)*150;points.push(x+px*25,y,14+i*3,.025,.8,.9,.65)}
  renderer.points(points);
 }
 renderer.draw('foreground',[backgroundRect[0]+px*19,backgroundRect[1]+py*7,backgroundRect[2],backgroundRect[3]],{alpha:.75,brightness:.82});
 const fade=t>=30.9&&t<32?smooth((t-30.9)/1.1):t>=32?1-smooth((t-32)/2):0;
 if(fade>.001)renderer.draw('black',[0,0,W,H],{alpha:fade});
}

function updateUI(t,force=false){
 const n=Math.max(0,chapters.findLastIndex(c=>t>=c.t));
 if(n!==state.chapter||force){state.chapter=n;$('chapter-no').textContent=`0${n+1} / 05`;$('chapter-name').textContent=chapters[n].name}
 if(document.activeElement!==$('timeline'))$('timeline').value=String(t);
 $('timeline').style.setProperty('--progress',`${t/DURATION*100}%`);
 const secs=Math.floor(t);$('time').textContent=`00:${String(secs).padStart(2,'0')} / 00:34`;
 $('intro').classList.toggle('away',t>4.6);$('intro').setAttribute('aria-hidden',String(t>4.6));
}
function resize(){
 if(!renderer)return;
 portrait=innerHeight/innerWidth>4/3;W=portrait?900:1600;H=portrait?Math.round(900*$('scene').clientHeight/$('scene').clientWidth):900;
 let width,height;
 if(prefs.quality==='auto'){width=portrait?Math.min(1440,Math.max(720,Math.ceil($('scene').clientWidth*Math.min(devicePixelRatio||1,1.5)/2)*2)):Math.min(2560,Math.max(1280,Math.ceil($('scene').clientWidth*Math.min(devicePixelRatio||1,1.5)/16)*16));height=Math.round(width*H/W/2)*2}
 else{const edge=prefs.quality==='4k'?3840:1920;if(portrait){height=edge;width=Math.round(edge*W/H/2)*2}else{width=edge;height=edge*9/16}}
 $('scene').width=width;$('scene').height=height;
 $('quality').querySelector('option[value="4k"]').textContent=portrait?'4K · portrait':'4K · 3840 × 2160';
 $('quality').querySelector('option[value="hd"]').textContent=portrait?'Full HD · portrait':'Full HD · 1920 × 1080';
 $('render-info').textContent=width+' × '+height+' · '+(prefs.quality==='auto'?'adapté à votre écran':prefs.quality==='4k'?'rendu 4K':'rendu Full HD');
 if(state.ready)scene(state.time);
}
function togglePlay(){if(!state.ready)return;state.playing=!state.playing;$('play').setAttribute('aria-label',state.playing?'Mettre en pause':'Lancer la projection');$('play-icon').setAttribute('d',state.playing?'M8 5v14M16 5v14':'M8 5l11 7-11 7Z');$('play').title=state.playing?'Pause · Espace':'Lecture · Espace'}
function seek(t){state.time=clamp(t,0,DURATION-.001);if(state.ready){scene(state.time);updateUI(state.time,true)}}
function animate(ms){const dt=state.last?Math.min((ms-state.last)/1000,.25):0;state.last=ms;
 state.look.x=mix(state.look.x,state.pointer.x,Math.min(1,dt*3));state.look.y=mix(state.look.y,state.pointer.y,Math.min(1,dt*3));
 if(state.ready){if(state.playing&&!document.hidden)state.time=(state.time+dt)%DURATION;scene(state.time);if(state.frame++%4===0)updateUI(state.time)}requestAnimationFrame(animate)}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else{await $('cinema').requestFullscreen();if(innerHeight>innerWidth&&screen.orientation?.lock)try{await screen.orientation.lock('landscape')}catch{}}}catch{toast('Le plein écran n’est pas disponible dans cette vue.')}}
function fail(error){state.playing=false;$('loading').hidden=true;$('intro').classList.add('away');$('error').hidden=false;$('error-text').textContent=error.message||'Une image n’a pas pu être chargée. Vérifiez votre connexion et relancez la projection.';console.error(error)}
function loadImage(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Une image du film n’a pas pu être chargée. Vérifiez votre connexion et relancez la projection.'));im.src=url})}
async function init(){
 try{
  try{renderer=new SceneGL($('scene'))}catch{renderer=new Scene2D($('scene'))}
  const response=await fetch('assets/rigs/layout.json');if(!response.ok)throw Error('Les personnages n’ont pas pu être préparés.');
  const layout=await response.json(),names=['night','hull',...Object.keys(layout)];
  let done=0;await Promise.all(names.map(async name=>{images[name]=await loadImage(`assets/${layout[name]?'rigs/':''}${name}.webp`);textures[name]=renderer.texture(images[name]);$('load-text').textContent=`Préparation de la projection · ${++done} / ${names.length}`}));
  for(const [name,image] of Object.entries(makeRigSkins(surface,images)))textures[name]=renderer.texture(image);
  rigs=createRigs({renderer,textures,matrix,mul});
  makeProcedurals();textures.black=renderer.texture(surface(2,2,c=>{c.fillStyle='#020811';c.fillRect(0,0,2,2)}));
  state.ready=true;document.body.dataset.ready='true';resize();scene(0);$('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,650);
  for(const id of ['play','replay','next','timeline'])$(id).disabled=false;
  if(motionReduced&&state.playing){state.playing=false}if(!state.playing){$('play-icon').setAttribute('d','M8 5l11 7-11 7Z');$('play').setAttribute('aria-label','Lancer la projection')}
  updateUI(0,true);requestAnimationFrame(animate);
 }catch(e){fail(e)}
}
$('play').addEventListener('click',togglePlay);$('replay').addEventListener('click',()=>seek(0));$('retry').addEventListener('click',()=>location.reload());
document.querySelector('.wordmark').addEventListener('click',e=>{e.preventDefault();seek(0)});
$('next').addEventListener('click',()=>{const next=chapters.find(c=>c.t>state.time+.2);seek(next?next.t:0)});
$('timeline').addEventListener('input',e=>seek(Number(e.target.value)));
$('fullscreen').addEventListener('click',fullscreen);document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Quitter le plein écran':'Passer en plein écran')});
function settings(open){$('settings-panel').hidden=!open;$('settings').setAttribute('aria-expanded',String(open))}
$('settings').addEventListener('click',()=>settings($('settings-panel').hidden));$('close-settings').addEventListener('click',()=>settings(false));
$('quality').value=prefs.quality;$('atmosphere').checked=prefs.atmosphere;$('parallax').checked=prefs.parallax;
$('quality').addEventListener('change',e=>{prefs.quality=e.target.value;savePrefs();resize();if(prefs.quality==='4k')toast('Rendu 4K activé · '+$('scene').width+' × '+$('scene').height)});
for(const key of ['atmosphere','parallax'])$(key).addEventListener('change',e=>{prefs[key]=e.target.checked;if(key==='parallax'&&!prefs.parallax)state.pointer={x:0,y:0};savePrefs();if(state.ready)scene(state.time)});
$('cinema').addEventListener('pointermove',e=>{if(e.target.closest('button,input,select,aside'))return;state.pointer={x:clamp(e.clientX/innerWidth*2-1,-1,1),y:clamp(e.clientY/innerHeight*2-1,-1,1)}});
$('cinema').addEventListener('pointerleave',()=>state.pointer={x:0,y:0});
addEventListener('resize',resize);addEventListener('keydown',e=>{if(e.target.closest('input,select,button'))return;if(e.code==='Space'){e.preventDefault();togglePlay()}if(e.key.toLowerCase()==='r')seek(0);if(e.key.toLowerCase()==='f')fullscreen();if(e.key==='Escape')settings(false)});
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('Le navigateur a interrompu le rendu graphique. Relancez la projection pour continuer.'))});
window.__banars={seek,pause(){if(state.playing)togglePlay()},play(){if(!state.playing)togglePlay()},get state(){return {ready:state.ready,time:state.time,playing:state.playing,quality:prefs.quality,width:$('scene').width,height:$('scene').height,chapter:state.chapter}}};
init();
