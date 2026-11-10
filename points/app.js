import {magneticDestination,formationProgress,cursorForce,springStep,projectFor,nextProjectFor,PROJECT_STARTS,LAST_SCENE} from './motion-core.mjs?v=pratiques1';
import {resamplePoints,particlePosition} from './point-motion.mjs';
import imageAssets from './assets/images.mjs';
const $ = (s) => document.querySelector(s);
const sections = [...document.querySelectorAll('.chapter')];
sections.forEach(s=>{const h=s.querySelector('h2');if(h){const lines=h.innerHTML.split(/<br>\s*/);h.innerHTML=lines.map((line,k)=>`<span class="title-line" style="--line-index:${k}"><span>${line}</span></span>`).join(' ');}});
const canvas = $('#particles');
const labels=sections.map(s=>s.dataset.label);
const sourcePalettes = [
  ['#eeeae3','#171716','#f23625','#69675f'],
  ['#13151c','#f1ede3','#e9bc62','#999caa'],
  ['#13151c','#f1ede3','#e9bc62','#999caa'],
  ['#13151c','#f1ede3','#c5afff','#999caa'],
  ['#e9eee9','#152a29','#087c75','#53645e'],
  ['#e9eee9','#152a29','#087c75','#53645e'],
  ['#ece9e1','#252a2a','#d54b29','#60645d'],
  ['#ece9e1','#252a2a','#d54b29','#60645d'],
  ['#10171b','#e8f0ea','#a3ec9d','#8d9fa2'],
  ['#10171b','#e8f0ea','#a3ec9d','#8d9fa2'],
  ['#eee8dc','#283c4b','#8e532c','#655f52'],
  ['#e7edf0','#193744','#156e82','#50646c'],
  ['#eeeae3','#171716','#f23625','#69675f'],
  ['#191622','#f2eada','#ed977e','#bcb2c0']
];
const palettes=sections.map(s=>sourcePalettes[Number(s.dataset.theme)]||sourcePalettes[0]);
const range = (v,a,b) => Math.min(b,Math.max(a,v));
const lerp = (a,b,t) => a+(b-a)*t;
const ease = t => t*t*(3-2*t);
const rgb = h => h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255);
const color = (a,b,t) => a.map((v,i)=>lerp(v,b[i],t));
const css = c => `rgb(${c.map(x=>Math.round(x*255)).join(',')})`;
let seed=6251;
function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
let width=innerWidth,height=innerHeight,dpr=1,now=0,last=0,lastPaint=0,scrollSpeed=0,lastScroll=scrollY,chapter=0,phase=0;
const mobile=()=>width<=600;
const N=matchMedia('(max-width: 600px)').matches?2800:6200;
const pointer={x:-9999,y:-9999,px:-9999,py:-9999,speed:0,active:false,down:false,power:0};
const mq=matchMedia('(prefers-reduced-motion: reduce)');
let userPause=null;try{const p=localStorage.getItem('redline-lab-motion');userPause=p===null?null:p==='paused';}catch{}
let paused=userPause??mq.matches;
let dirty=true;
let reduced=mq.matches;
const points=[], forms=[];
const SITE_FORMS=new Set([3,5,11]);
const SITE_SCENES=new Set(sections.flatMap((s,i)=>s.dataset.sharp?[i]:[]));
let logoImage,puppetImage;
const loadImage=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`Image indisponible: ${src}`));image.src=src;});
const xyz=new Float32Array(N*3), colours=new Float32Array(N*3), sizes=new Float32Array(N);
const offsetX=new Float32Array(N),offsetY=new Float32Array(N),velocityX=new Float32Array(N),velocityY=new Float32Array(N);
const seeds=new Float32Array(N);for(let i=0;i<N;i++) seeds[i]=random();
function point(x,y,z,c='#111111',size=1){return{x,y,z,c:rgb(c),size};}
function line(a,b,count=80,c='#151514',radius=.008){
 count=Math.max(2,Math.round(count));const length=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),track={a,b,step:1/count,speed:.13/Math.max(.3,length)};
 for(let j=0;j<count;j++){const t=(j+.5)/count,jx=(random()-.5)*radius,jy=(random()-.5)*radius;points.push({...point(lerp(a[0],b[0],t)+jx,lerp(a[1],b[1],t)+jy,lerp(a[2],b[2],t),c),track,phase:t,jx,jy});}
}
function rect(x,y,w,h,z=0,c='#151514',count=180){line([x,y,z],[x+w,y,z],count/4,c);line([x+w,y,z],[x+w,y+h,z],count/4,c);line([x+w,y+h,z],[x,y+h,z],count/4,c);line([x,y+h,z],[x,y,z],count/4,c);}
function textCloud(text,x,y,fontSize,c='#f4e8d2',font='Redline',maxWidth=1.7){
  const c2=document.createElement('canvas');c2.width=1100;c2.height=350;const g=c2.getContext('2d');g.fillStyle=c;g.textAlign='center';g.textBaseline='middle';g.font=`700 ${fontSize}px ${font}, Arial`;g.fillText(text,550,175);const data=g.getImageData(0,0,1100,350).data;
  for(let yy=0;yy<350;yy+=4)for(let xx=0;xx<1100;xx+=4){const off=(yy*1100+xx)*4;if(data[off+3]>100)points.push({x:x+(xx-550)/550*maxWidth,y:y-(yy-175)/550*maxWidth,z:(random()-.5)*.09,c:[data[off]/255,data[off+1]/255,data[off+2]/255],size:1.15});}
}
function sampleDrawing(draw,scale=2.2){const c=document.createElement('canvas');c.width=700;c.height=700;const g=c.getContext('2d');draw(g);const d=g.getImageData(0,0,700,700).data;for(let y=0;y<700;y+=4)for(let x=0;x<700;x+=4){const i=(y*700+x)*4;if(d[i+3]>100){const nx=(x-350)/350,ny=(350-y)/350;points.push({x:nx*scale,y:ny*scale,z:.12+.26*Math.max(0,1-nx*nx-ny*ny)+(random()-.5)*.11,c:[d[i]/255,d[i+1]/255,d[i+2]/255],size:1});}}}
function sampleImage(image,scale){
 const c=document.createElement('canvas');c.width=800;c.height=Math.round(800*image.height/image.width);const g=c.getContext('2d');g.drawImage(image,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height).data;
 const h=scale*2*c.height/c.width;
 for(let y=0;y<c.height;y+=3)for(let x=0;x<c.width;x+=3){const i=(y*c.width+x)*4;if(d[i+3]>160){const nx=x/c.width-.5,ny=.5-y/c.height;points.push({x:nx*scale*2,y:ny*h,z:.14+.17*Math.max(0,1-nx*nx*4-ny*ny*4)+(random()-.5)*.055,c:[d[i]/255,d[i+1]/255,d[i+2]/255],size:1.1});}}
}
function ellipse(g,x,y,rx,ry,c){g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
function finish(){forms.push(resamplePoints(points.splice(0),N,random,SITE_FORMS.has(forms.length)));}
async function buildForms(){
 await document.fonts.ready;
 [logoImage,puppetImage]=await Promise.all([loadImage(imageAssets.logo),loadImage(imageAssets.puppet)]);
 // A dense suspended sphere, surrounded by three offset orbital filaments.
 for(let i=0;i<N;i++){const u=random()*Math.PI*2,z=random()*2-1,r=Math.sqrt(1-z*z),R=i%7===0?.78:.9;points.push(point(Math.cos(u)*r*R,z*R,Math.sin(u)*r*R,i%11===0?'#e7a293':'#f23625',1.15));}
 for(let ring=0;ring<3;ring++)for(let i=0;i<700;i++){const a=i/700*Math.PI*2,R=1.4+ring*.23;points.push(point(Math.cos(a)*R,Math.sin(a)*R*.4,Math.sin(a)*R*.85+Math.cos(a)*ring*.08,ring===1?'#f23625':'#4a4541',.68));}finish();
 sampleImage(logoImage,2.0);textCloud('M _ T',0,-.92,100,'#a79bbe','Redline',1.4);
 for(let i=0;i<400;i++){const t=random()*Math.PI*2;points.push(point(Math.cos(t)*2.1,Math.sin(t)*1.1,-.35,'#6d657b',.7));}finish();
 sampleImage(puppetImage,1.7);finish();
 // A precise, planar UI: particles describe the controls rather than large fills.
 const gold='#efd091',lavender='#b5a7d3',rail='#786d99';
 rect(-1.95,-1.26,3.9,2.52,0,lavender,800);line([-1.95,.91,0],[1.95,.91,0],240,rail);line([-1.23,-1.26,0],[-1.23,.91,0],210,rail);
 textCloud('KIKALMO',-.92,1.08,120,gold,'Redline',1.12);
 for(let row=0;row<5;row++){const y=.66-row*.36,c=['#d5ac66','#ab9ebc','#82a99d'][row%3];for(let k=0;k<50;k++){const a=k/50*Math.PI*2;points.push(point(-1.72+Math.cos(a)*.075,y+Math.sin(a)*.075,0,c));}line([-1.56,y+.025,0],[-1.36,y+.025,0],45,lavender);}
 rect(-1.06,-.46,2.8,1.16,0,rail,400);textCloud('M _ T',.34,.26,230,gold,'Redline',1.45);rect(-.65,-.31,2.02,.29,0,lavender,270);
 for(let col=0;col<3;col++){const x=-1.05+col*.96;rect(x,-1.05,.86,.39,0,rail,180);for(let k=0;k<50;k++){const a=k/50*Math.PI*2;points.push(point(x+.18+Math.cos(a)*.08,-.85+Math.sin(a)*.09,0,['#dda46c','#a8bb8e','#b6a0cf'][col]));}line([x+.35,-.8,0],[x+.7,-.8,0],60,lavender);line([x+.35,-.91,0],[x+.58,-.91,0],40,rail);}
 finish();
 // Four solid, connected module outlines at slightly different depths.
 const modules=[[-1.65,.1,1.45,1,.15,'#137f76'],[.05,.2,1.4,.9,-.12,'#c56e45'],[-1.45,-1.15,1.5,.94,-.22,'#6596a0'],[.3,-1.1,1.35,.9,.3,'#137f76']];
 for(const [x,y,w,h,z,c] of modules){rect(x,y,w,h,z,c,420);rect(x+.12,y+.12,w-.24,h-.24,z-.1,c,230);line([x+.1,y+.68,z],[x+w-.1,y+.68,z],60,c);}
 for(let k=0;k<modules.length;k++){const m=modules[k],n=modules[(k+1)%modules.length];line([m[0]+m[2]/2,m[1]+m[3]/2,m[4]],[n[0]+n[2]/2,n[1]+n[3]/2,n[4]],120,'#7b8e86');}finish();
 // Draw the information structure directly in points. Pale raster fills hid the
 // dashboard on the light theme and consumed most of its particle budget.
 const ink='#20574f',mutedInk='#46685f',chartInk='#087c75',warmInk='#a74e2c';
 rect(-1.95,-1.25,3.9,2.5,0,ink,900);
 line([-1.32,-1.25,0],[-1.32,1.25,0],260,ink);
 line([-1.32,.87,0],[1.95,.87,0],260,ink);
 textCloud('MP',-1.64,1.02,150,chartInk,'Redline',.6);
 textCloud('POINT MARCHÉ',.18,1.04,100,ink,'Redline',1.7);
 for(let row=0;row<6;row++)line([-1.81,.51-row*.25,.02],[-1.46,.51-row*.25,.02],50,row===1?chartInk:mutedInk);
 for(let col=0;col<3;col++){
  const x=-1.14+col*1.02;
  rect(x,.17,.86,.49,.03,ink,210);
  line([x+.12,.55,.04],[x+.48,.55,.04],50,mutedInk);
  textCloud(['128','84','12'][col],x+.43,.34,220,col===2?warmInk:chartInk,'Redline',.73);
 }
 rect(-1.14,-.84,1.91,.82,.03,ink,320);
 for(let row=0;row<3;row++)line([-1.02,-.68+row*.24,.02],[.65,-.68+row*.24,.02],65,mutedInk);
 const trend=[[-1.01,-.69],[-.75,-.55],[-.49,-.6],[-.23,-.3],[.03,-.39],[.29,-.16],[.59,-.08]];
 for(let k=1;k<trend.length;k++)line([...trend[k-1],.08],[...trend[k],.08],90,chartInk,.012);
 for(const [x,y] of trend)for(let k=0;k<32;k++){const t=k/32*Math.PI*2;points.push(point(x+Math.cos(t)*.035,y+Math.sin(t)*.035,.09,chartInk,1.12));}
 rect(.93,-.84,.97,.82,.03,ink,230);
 for(let row=0;row<5;row++)line([1.05,-.17-row*.125,.05],[1.72-(row%2)*.18,-.17-row*.125,.05],65,row===0?warmInk:mutedInk);
 line([-1.14,-1.02,.02],[1.89,-1.02,.02],230,ink);
 for(let col=0;col<5;col++)line([-1.12+col*.62,-1.13,.03],[-.72+col*.62,-1.13,.03],40,mutedInk);
 finish();
 // A genuine volumetric plan, with walls lifted from the ground plane.
 const walls=[[[-1.8,-1,-1],[1.6,-1,-1]],[[-1.8,-1,-1],[-1.8,-1,1.2]],[[1.6,-1,-1],[1.6,-1,1.2]],[[-1.8,-1,1.2],[1.6,-1,1.2]],[[-.3,-1,-1],[-.3,-1,.2]],[[-1.8,-1,.2],[.3,-1,.2]],[[.3,-1,.2],[.3,-1,1.2]]];
 for(const [a,b] of walls){line(a,b,130,'#d54b29');line([a[0],.6,a[2]],[b[0],.6,b[2]],100,'#2c4847');line(a,[a[0],.6,a[2]],80,'#2c4847');line(b,[b[0],.6,b[2]],80,'#2c4847');for(let j=0;j<320;j++){let t=random(),h=random();points.push(point(lerp(a[0],b[0],t),lerp(-1,.6,h),lerp(a[2],b[2],t),random()>.8?'#c9ad89':'#6c7a72',.6));}}
 for(let x=-1.8;x<=1.61;x+=.24)line([x,-1,-1],[x,-1,1.2],50,'#9c9f91');finish();
 rect(-1.5,-1.15,2.8,2.45,0,'#294a49',480);for(let row=0;row<3;row++){line([-1.35,.98-row*.72,.04],[1.15,.98-row*.72,.04],140,'#7e9185');for(let col=0;col<7;col++){rect(-1.25+col*.34,.52-row*.72,.25,.42,.15,col<2?'#d54b29':'#456a66',80);line([-1.13+col*.34,.6-row*.72,.2],[-1.13+col*.34,.76-row*.72,.2],25,'#bd8b44');}}
 for(let j=0;j<6;j++){const x=-1.13+j*.34;line([x,-1,.05],[x,-1.5-j*.08,.1],75,j%2?'#cd6c47':'#437b7b');line([x,-1.5-j*.08,.1],[2.0,-1.5-j*.08,-.3],85,j%2?'#cd6c47':'#437b7b');}finish();
 for(let ring=0;ring<3;ring++){let R=1.5-ring*.37;for(let i=0;i<1800;i++){let t=random()*Math.PI*2*(.73+ring*.07),q=random()*Math.PI*2,rad=R+.065*Math.cos(q);points.push(point(rad*Math.cos(t),rad*Math.sin(t),.065*Math.sin(q)+ring*.1,['#a3ec9d','#8dbed3','#dfa0a8'][ring],1.05));}}finish();
 for(let k=0;k<3;k++){const c=['#a3ec9d','#8dbed3','#dfa0a8'][k];for(let i=0;i<2200;i++){let x=(random()-.5)*4.4,y=Math.sin(x*2+k*.8)*(.3+k*.1)+Math.sin(x*4.5)*.14+(k-1)*.6;points.push(point(x,y+(random()-.5)*.04,(k-1)*.4,c));}}for(let k=0;k<9;k++)line([-2+k*.5,-1.4,-.5],[-2+k*.5,1.4,-.5],60,'#38524e');finish();
 // An open book: layered page edges, a curved spread and a central binding.
 const bookPoint=(side,u,y,page=0)=>[side*(.035+1.62*u),y,.16+Math.sin(u*Math.PI)*.36-page*.025];
 for(const side of [-1,1]){
  for(let page=0;page<7;page++)for(const edge of [-1,1])for(let k=0;k<200;k++){
   const u=k/199,[x,y,z]=bookPoint(side,u,edge*(1.07-page*.008),page);points.push(point(x,y,z,page?'#8f7356':'#704c33',page?.78:1.08));
  }
  for(let k=0;k<230;k++){const y=-1.07+k/229*2.14;points.push(point(...bookPoint(side,1,y),'#704c33',1.05));}
  for(let row=0;row<12;row++)for(let k=0;k<100;k++){
   const u=.14+k/99*(row%4===3?.6:.72),[x,y,z]=bookPoint(side,u,.83-row*.15);points.push(point(x,y,z+.012,row<2?'#8e532c':'#5d665f',row<2?1.05:.8));
  }
 }
 line([0,-1.1,.17],[0,1.1,.17],340,'#283c4b',.006);finish();
 // Nested image frames and corner handles describe resizing without a bitmap.
 rect(-1.72,-1.1,3.44,2.2,-.2,'#50646c',980);rect(-1.11,-.71,2.22,1.42,.18,'#156e82',1000);
 for(const side of [-1,1])for(const vertical of [-1,1]){
  rect(side*1.72-.065,vertical*1.1-.065,.13,.13,-.19,'#193744',120);
  rect(side*1.11-.065,vertical*.71-.065,.13,.13,.2,'#156e82',130);
  const x=side*1.53,y=vertical*.97;line([x,y,.06],[side*1.25,vertical*.8,.13],100,'#a05b2d');
  line([side*1.25,vertical*.8,.13],[side*1.38,vertical*.81,.13],45,'#a05b2d');line([side*1.25,vertical*.8,.13],[side*1.28,vertical*.91,.13],45,'#a05b2d');
 }
 line([-.87,-.47,.21],[-.25,.37,.21],260,'#193744');line([-.25,.37,.21],[.2,-.14,.21],200,'#193744');line([.2,-.14,.21],[.57,.13,.21],140,'#193744');line([.57,.13,.21],[.91,-.47,.21],180,'#193744');
 for(let k=0;k<260;k++){const a=k/260*Math.PI*2;points.push(point(.59+Math.cos(a)*.13,.4+Math.sin(a)*.13,.22,'#a05b2d',1.05));}
 textCloud('1600 → 800',0,-1.48,125,'#193744','Redline',1.3);finish();
 textCloud('eg.',0,0,340,'#f23625','Redline',2);finish();
 // Atlas: a globe whose meridians and latitude lines carry the same matter.
 for(let ring=0;ring<10;ring++)for(let i=0;i<370;i++){const a=i/370*Math.PI*2,t=ring/10*Math.PI;points.push(point(Math.cos(a)*Math.sin(t)*1.42,Math.cos(t)*1.42,Math.sin(a)*Math.sin(t)*1.42,ring%3?'#283c4b':'#a46636',.82));}
 for(let ring=0;ring<10;ring++)for(let i=0;i<230;i++){const a=i/230*Math.PI*2,t=ring/10*Math.PI;points.push(point(Math.cos(a)*Math.cos(t)*1.42,Math.sin(a)*1.42,Math.cos(a)*Math.sin(t)*1.42,'#61796f',.8));}finish();
 // Pills: a curved film strip with ten perforations along each edge.
 const film = (x,y) => [x,y+.17*Math.sin(x*1.4),.42*Math.cos(x*1.4)];
 const filmEdge = (x1,x2,y,count,ink) => {
  const parts = Math.ceil((x2-x1)*16);
  for(let part=0;part<parts;part++){
   const from = lerp(x1,x2,part/parts), to = lerp(x1,x2,(part+1)/parts);
   line(film(from,y),film(to,y),count/parts,ink);
  }
 };
 for(const side of [-1,1]){
  filmEdge(-1.95,1.95,side*.86,680,'#f6ddad');
  filmEdge(-1.95,1.95,side*.59,360,'#ac87a4');
  for(let hole=0;hole<10;hole++){
   const x=-1.84+hole*.38, y=side*.73;
   for(const edge of [-1,1]){
    filmEdge(x,x+.22,y+edge*.055,45,'#ed977e');
    const end=edge===1?x+.22:x;
    line(film(end,y-.055),film(end,y+.055),35,'#ed977e');
   }
  }
 }
 for(let frame=0;frame<3;frame++){
  const x=-1.85+frame*1.26, end=x+1.15;
  for(const edge of [-1,1]){
   filmEdge(x,end,edge*.48,240,'#eac49b');
   const side=edge===1?end:x;
   line(film(side,-.48),film(side,.48),140,'#eac49b');
  }
 }
 finish();
 // Inktober: thirty-one cells arranged like a calendar.
 rect(-1.9,-1.33,3.8,2.62,0,'#283c4b',600);line([-1.9,.98,0],[1.9,.98,0],200,'#8e532c');
 for(let day=0;day<31;day++){const col=day%7,row=Math.floor(day/7),x=-1.72+col*.51,y=.52-row*.4;rect(x,y,.4,.29,.03,day%5===0?'#a46636':'#61796f',100);textCloud(String(day+1),x+.2,y+.15,75,'#283c4b','Redline',.48);}finish();
 // Four continuous strands share a centre and cross in different planes.
 const inks=['#db412a','#283c4b','#89795d','#508071'];
 for(let strand=0;strand<inks.length;strand++){
  const phase=strand*Math.PI/2;
  for(let bead=0;bead<1600;bead++){
   const t=bead/1600*Math.PI*2, radius=1.1+.53*Math.cos(2*t+phase);
   points.push(point(radius*Math.cos(t),radius*Math.sin(t),.48*Math.sin(2*t+phase),inks[strand],1));
  }
 }
 finish();
}

let gl=null,ctx=null,program,buffers={},useGL=false;
const root=document.documentElement;
const menu=$('#projectMenu');
const isMenuOpen=()=>menu.matches(':popover-open');
try{localStorage.setItem('portfolio-theme','points');}catch{}
const xCurrent=new Float32Array(N*3),cCurrent=new Float32Array(N*3),sCurrent=new Float32Array(N);
const xStart=new Float32Array(N*3),cStart=new Float32Array(N*3),sStart=new Float32Array(N);
let activeScene=-1,morphStart=-10000,morphDuration=1150,morphValue=1,frameId=0;
let scrollUntil=0,scrollTimer=0,snapDirection=0,scrollTarget=-1,ready=false,rotationX=0,rotationY=0,clickTime=-10000;
let bounds=[],step=innerHeight,dragY=0,lastScene=0,previousBg=null,lastCursorPaint=0;
const frameTitles=sections.map(s=>s.dataset.label.toUpperCase());
const sourceRotations=[[.28,-.2],[.035,-.1],[.025,-.12],[.025,-.1],[.12,-.27],[.025,-.1],[.5,-.55],[.13,-.17],[.1,-.2],[.15,-.23],[.18,-.22],[.025,-.1],[.05,-.1]];
const sceneRotations=sections.map(s=>sourceRotations[Number(s.dataset.formation)]||[.12,-.18]);
function startRenderer(){
 try{gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});}catch{}
 if(gl){
  const vs=`attribute vec3 a_position;attribute vec3 a_color;attribute float a_size;uniform float u_dpr;varying vec3 v_color;void main(){gl_Position=vec4(a_position,1.0);gl_PointSize=a_size*u_dpr;v_color=a_color;}`;
  const fs=`precision mediump float;varying vec3 v_color;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float a=1.-smoothstep(.68,1.,r);gl_FragColor=vec4(v_color,a*.98);}`;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);for(const [name,arr,size] of [['position',xyz,3],['color',colours,3],['size',sizes,1]]){buffers[name]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffers[name]);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.DYNAMIC_DRAW);const at=gl.getAttribLocation(program,'a_'+name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,size,gl.FLOAT,false,0,0);}gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);useGL=true;}catch(e){console.warn('Rendu compatible activé',e.message);}
 }
 if(!useGL)compatibleRenderer();
 else root.dataset.renderer='webgl';
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(useGL){useGL=false;compatibleRenderer();resize();wake();}});
 resize();
}
function compatibleRenderer(){
 let target=canvas;if(gl||!canvas.isConnected){target=document.createElement('canvas');target.id='particles';if(canvas.isConnected)canvas.replaceWith(target);else $('#scene').prepend(target);}ctx=target.getContext('2d');root.dataset.renderer='canvas';
}
function updateBounds(){bounds=[...document.querySelectorAll('.scene-anchor')].map(s=>({top:s.offsetTop,h:s.offsetHeight}));step=bounds[1]?.top||height;}
function resize(){
 width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,mobile()?1.5:1.8);const c=useGL?canvas:ctx?.canvas;
 if(c){c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);if(useGL)gl.viewport(0,0,c.width,c.height);else ctx.setTransform(dpr,0,0,dpr,0,0);}
 updateBounds();dirty=true;wake();
}
function sceneAtScroll(){return range(Math.round(scrollY/Math.max(1,step)),0,LAST_SCENE)}
function goScene(index,instant=false){
 index=range(index,0,LAST_SCENE);scrollTarget=index;scrollUntil=performance.now()+90;clearTimeout(scrollTimer);
 if(ready)setScene(index);
 scrollTo({top:bounds[index]?.top||index*step,behavior:'instant'});
 history.replaceState(null,'','#'+sections[index].id);dirty=true;wake();
}
function selectNearest(){
 if(performance.now()<scrollUntil||isMenuOpen()||!ready)return;
 const target=magneticDestination(scrollY/Math.max(1,step),snapDirection,LAST_SCENE);
 goScene(target);snapDirection=0;
}
function copyToStart(){xStart.set(xCurrent);cStart.set(cCurrent);sStart.set(sCurrent)}
function setScene(index){
 if(index===activeScene)return;
 const first=activeScene===-1;copyToStart();lastScene=Math.max(0,activeScene);activeScene=index;morphStart=performance.now();morphDuration=paused||reduced?0:first?1550:1150;
 if(first){const f=forms[index];for(let k=0;k<N;k++){const n=k*3;xStart[n]=f[k].x*.045;xStart[n+1]=f[k].y*.045;xStart[n+2]=f[k].z*.045;cStart.set(f[k].c,n);sStart[k]=f[k].size;}}
 morphValue=0;
 sections.forEach((s,i)=>{s.classList.toggle('current',i===index);s.inert=i!==index;s.setAttribute('aria-hidden',String(i!==index));s.style.setProperty('--entry-direction',i%2===0?-1:1);});
 $('#formationLabel').textContent=labels[index];$('#sceneNumber').textContent=String(index).padStart(2,'0');$('#currentFrame').textContent=String(index).padStart(2,'0');$('#stepLabel').textContent=frameTitles[index];
 $('#previousFrame').disabled=index===0;$('#nextFrame').disabled=index===LAST_SCENE;
 const p=projectFor(index);document.querySelectorAll('[data-project]').forEach((a,k)=>{a.classList.toggle('active',p===k);if(p===k)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');const start=PROJECT_STARTS[k];[...a.querySelectorAll('b')].forEach((bar,n)=>bar.className=index>start+n?'past':index===start+n?'now':'');});
 // Keep the active label in view without moving the vertical scene track.
 const dock=document.querySelector('.project-dock'), active=dock.querySelector('.active');
 if(active && dock.scrollWidth>dock.clientWidth){
  const left=active.offsetLeft, right=left+active.offsetWidth;
  if(left<dock.scrollLeft)dock.scrollLeft=left;
  else if(right>dock.scrollLeft+dock.clientWidth)dock.scrollLeft=right-dock.clientWidth;
 }
 root.dataset.scene=String(index);root.dataset.project=String(p);const viewToggle=$('[data-view-switch]');if(viewToggle)viewToggle.href='/?theme=curseurs#'+sections[index].dataset.cursor; $('[data-chrome-switch]').href='/?theme=chrome#'+sections[index].dataset.cursor;document.body.classList.toggle('is-intro',index===0);
 root.dataset.flowingPoints=String(forms[index].filter(p=>p.track).length);
 $('#interactionStatus').textContent=frameTitles[index];
 // Theme changes continue through the same matter transition as the scene.
 previousBg=palettes[lastScene].map(rgb);
 dirty=true;wake();
}
function updateTheme(t){
 const a=previousBg||palettes[activeScene].map(rgb),b=palettes[activeScene].map(rgb);
 const bg=color(a[0],b[0],t),fg=color(a[1],b[1],t);
 for(let n=0;n<4;n++)root.style.setProperty(['--bg','--fg','--accent','--muted'][n],css(color(a[n],b[n],t)));
 root.style.setProperty('--line',`rgba(${fg.map(x=>Math.round(x*255)).join(',')},.17)`);root.style.setProperty('--dock',`rgba(${bg.map(x=>Math.round(x*255)).join(',')},.91)`);
}
function frameComposition(index){
 let cx=mobile()?width*.5:width*.735,cy=height*(mobile()?.285:.48),scale=mobile()?Math.min(width*.205,height*.12):Math.min(width*.118,height*.205);
 if(index===0){cx=width*(mobile()?.72:.77);cy=height*(mobile()?.43:.56);scale*=mobile()?.65:1.17;}
 if(index===6||index===7)scale*=.83;
 if(index===LAST_SCENE)scale*=.9;
 return {cx,cy,scale};
}
function render(time){
 frameId=0;if(document.hidden||!ready)return;
 const workStart=performance.now();const animating=!(paused||reduced),frameMs=useGL?15:32;
 if(animating&&time-lastPaint<frameMs){frameId=requestAnimationFrame(render);return}lastPaint=time;
 if(!animating&&!dirty)return;dirty=false;
 const dt=last?Math.min((time-last)/1000,.04):.016;last=time;if(animating)now+=dt;
 if(time>=scrollUntil){scrollTarget=-1;const i=sceneAtScroll();if(i!==activeScene)setScene(i)}
 const delta=scrollY-lastScroll;lastScroll=scrollY;scrollSpeed=lerp(scrollSpeed,range(delta/Math.max(dt,.01),-5000,5000),1-Math.exp(-dt*7));pointer.speed*=Math.exp(-dt*7);
 const elapsed=time-morphStart;morphValue=morphDuration===0?1:ease(range(elapsed/morphDuration,0,1));
 updateTheme(morphValue);
 const form=forms[activeScene],{cx,cy,scale}=frameComposition(activeScene);
 const pmx=pointer.active?range((pointer.x-cx)/(width*.38),-1,1):0,pmy=pointer.active?range((pointer.y-cy)/(height*.42),-1,1):0;
 const bases=sceneRotations[activeScene];
 const introTurn=activeScene===0&&animating?now*.12:0;
 const diagram=SITE_SCENES.has(activeScene),tilt=diagram?.08:1,baseY=diagram?0:bases[1],baseX=diagram?0:bases[0];
 const targetRy=baseY+(animating?(Math.sin(now*.25)*.20+pmx*.35)*tilt+introTurn:0),targetRx=baseX+(animating?(Math.cos(now*.18)*.07+pmy*.16)*tilt:0);
 rotationY=lerp(rotationY,targetRy,1-Math.exp(-dt*4));rotationX=lerp(rotationX,targetRx,1-Math.exp(-dt*4));
 if(!animating){rotationY=baseY;rotationX=baseX;}
 const co=Math.cos(rotationY),si=Math.sin(rotationY),cxo=Math.cos(rotationX),sxo=Math.sin(rotationX);
 pointer.power=lerp(pointer.power,pointer.down&&animating?1:0,1-Math.exp(-dt*9));
 const energy=animating?range(Math.abs(scrollSpeed)/3600,0,1):0;
 const clickAge=(time-clickTime)/1000;
 let firstX=0,firstY=0,lastX=0,lastY=0;
 const movingPoint=[0,0,0];
 for(let k=0;k<N;k++){
  const a=form[k],n=k*3,seed=seeds[k],t=formationProgress(elapsed,morphDuration,seed),arc=Math.sin(t*Math.PI);
  particlePosition(a,now,seed,diagram,animating,movingPoint);
  let x=lerp(xStart[n],movingPoint[0],t),y=lerp(xStart[n+1],movingPoint[1],t),z=lerp(xStart[n+2],movingPoint[2],t);
  if(animating){x+=Math.sin(seed*32+t*5)*arc*.34;y+=Math.cos(seed*23+t*4)*arc*.22;z+=Math.sin(seed*71)*arc*.65;}
  xCurrent[n]=x;xCurrent[n+1]=y;xCurrent[n+2]=z;
  for(let c=0;c<3;c++)cCurrent[n+c]=lerp(cStart[n+c],a.c[c],t);sCurrent[k]=lerp(sStart[k],a.size,t);
  const rx=x*co+z*si,rz=-x*si+z*co,ry=y*cxo-rz*sxo,zz=y*sxo+rz*cxo,perspective=5/(5-zz);
  const px=cx+rx*scale*perspective,py=cy-ry*scale*perspective;
  let tx=0,ty=0;
  if(animating){
   tx=Math.sin(seed*45+now)*energy*20;ty=Math.cos(seed*39)*energy*24;
   if(pointer.active&&!isMenuOpen()){const dx=px+offsetX[k]-pointer.x,dy=py+offsetY[k]-pointer.y;const f=cursorForce(dx,dy,pointer.down?180:122,pointer.power);tx+=f[0];ty+=f[1];
    if(clickAge>=0&&clickAge<.9){const d=Math.hypot(dx,dy),wave=Math.exp(-Math.pow((d-clickAge*330)/30,2))*(1-clickAge/.9)*15;tx+=dx/Math.max(d,1)*wave;ty+=dy/Math.max(d,1)*wave;}}
   [offsetX[k],velocityX[k]]=springStep(offsetX[k],velocityX[k],tx,dt);[offsetY[k],velocityY[k]]=springStep(offsetY[k],velocityY[k],ty,dt);
  }else{offsetX[k]=offsetY[k]=velocityX[k]=velocityY[k]=0;}
  const pulse=animating?.96+.08*Math.sin(now*1.3+seed*18):1;
  const sx=px+offsetX[k],sy=py+offsetY[k],size=(diagram?(mobile()?2.05:2.25):(mobile()?1.95:2.15))*perspective*sCurrent[k]*pulse;
  xyz[n]=sx/width*2-1;xyz[n+1]=1-sy/height*2;xyz[n+2]=range(-zz/8,-.9,.9);colours[n]=cCurrent[n];colours[n+1]=cCurrent[n+1];colours[n+2]=cCurrent[n+2];sizes[k]=Math.max(.9,size);
  if(k===0){firstX=sx;firstY=sy}if(k===N-1){lastX=sx;lastY=sy}
 }
 if(useGL){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);for(const [name,arr] of [['position',xyz],['color',colours],['size',sizes]]){gl.bindBuffer(gl.ARRAY_BUFFER,buffers[name]);gl.bufferSubData(gl.ARRAY_BUFFER,0,arr)}gl.uniform1f(gl.getUniformLocation(program,'u_dpr'),dpr);gl.drawArrays(gl.POINTS,0,N)}else{
  ctx.clearRect(0,0,width,height);ctx.globalAlpha=.96;
  for(let k=0;k<N;k++){const n=k*3;ctx.fillStyle=`rgb(${Math.round(colours[n]*255)},${Math.round(colours[n+1]*255)},${Math.round(colours[n+2]*255)})`;const s=sizes[k]*(diagram?.9:.76);ctx.fillRect((xyz[n]+1)*width*.5-s*.5,(1-xyz[n+1])*height*.5-s*.5,s,s);}
 }
 const typePower=activeScene===0&&animating?range(pointer.speed*.22+energy*28+pointer.power*17,0,32):0;
 $('#typeDisplacement').setAttribute('scale',String(typePower));
 root.style.setProperty('--type-strain',String(activeScene===0&&animating?pointer.power:0));
 const pct=range(scrollY/Math.max(1,document.documentElement.scrollHeight-height),0,1);$('#progressFill').style.transform=`scaleX(${pct})`;
 document.querySelectorAll('.now').forEach(b=>b.style.setProperty('--step-progress',Math.max(.2,morphValue).toFixed(3)));
 root.dataset.frameMs=(performance.now()-workStart).toFixed(1);root.dataset.ready='true';root.dataset.morph=String(Math.round(morphValue*100));root.dataset.attraction=pointer.power.toFixed(2);root.dataset.anchor=`${Math.round(cx)},${Math.round(cy)}`;if(pointer.down)root.dataset.attractionPeak=String(Math.max(Number(root.dataset.attractionPeak||0),pointer.power).toFixed(2));
 if(animating||morphValue<1)frameId=requestAnimationFrame(render);
}
function wake(){if(!frameId&&!document.hidden)frameId=requestAnimationFrame(render)}
function updateMotion(){
 if((paused||reduced)&&activeScene>=0)morphDuration=0;
 document.body.classList.toggle('paused',paused||reduced);$('#motionButton').setAttribute('aria-pressed',String(paused||reduced));$('#motionButton').textContent=paused||reduced?'▷ ACTIVER LES EFFETS':'Ⅱ RÉDUIRE LES EFFETS';last=0;dirty=true;wake();
}
function closeMenu(){if(isMenuOpen())menu.hidePopover();pointer.down=false;dirty=true;wake();}
function openMenu(x=width/2,y=height/2){
 pointer.down=false;$('#cursor').classList.remove('pressed');
 const mw=Math.min(520,width-24);menu.style.width=mw+'px';
 if(!isMenuOpen())menu.showPopover();
 const r=menu.getBoundingClientRect();menu.style.setProperty('--menu-x',range(x-r.width/2,12,width-r.width-12)+'px');menu.style.setProperty('--menu-y',range(y-r.height/2,12,height-r.height-12)+'px');
 $('#cursor').style.display='none';
}
$('#projectsButton').addEventListener('click',()=>openMenu());$('.close-menu').addEventListener('click',closeMenu);
menu.addEventListener('toggle',()=>{pointer.down=false;$('#projectsButton').setAttribute('aria-expanded',String(isMenuOpen()));dirty=true;wake();});
$('#restartButton').addEventListener('click',()=>{closeMenu();goScene(0)});
$('#motionButton').addEventListener('click',()=>{if(mq.matches)return;paused=!paused;userPause=paused;try{localStorage.setItem('redline-lab-motion',paused?'paused':'active')}catch{}updateMotion();});
mq.addEventListener('change',e=>{reduced=e.matches;if(userPause===null)paused=reduced;updateMotion()});
$('#nextFrame').addEventListener('click',()=>goScene(activeScene+1));$('#previousFrame').addEventListener('click',()=>goScene(activeScene-1));$('#nextProject').addEventListener('click',()=>goScene(nextProjectFor(activeScene)));
function sceneForHash(hash){
 const id=hash==='#parcours'?'about':hash.slice(1);
 return sections.findIndex(section=>section.id===id);
}
addEventListener('hashchange',()=>{
 const index=sceneForHash(location.hash);
 if(ready && index>=0)goScene(index);
});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const index=sceneForHash(a.getAttribute('href'));if(index<0)return;e.preventDefault();closeMenu();goScene(index)});
document.addEventListener('contextmenu',e=>{if(e.shiftKey||window.getSelection()?.toString().trim()||e.target.closest('a,input,textarea,[contenteditable],dialog,#projectMenu'))return;e.preventDefault();openMenu(e.clientX,e.clientY)});
document.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'){if(Math.abs(e.clientY-dragY)>12)pointer.down=false;return}
 const dist=pointer.active?Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y):0;pointer.speed=range(dist,0,90);pointer.px=pointer.x;pointer.py=pointer.y;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;
 const cur=$('#cursor');cur.style.left=e.clientX+'px';cur.style.top=e.clientY+'px';const overUI=!!e.target.closest('button,a,dialog,#projectMenu');cur.style.display=overUI?'none':'block';$('.cursor-hint').textContent=pointer.down?'LA MATIÈRE VOUS SUIT':'MAINTENIR POUR ATTIRER';
}, {passive:true});
document.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button,a,dialog,input,textarea,#projectMenu'))return;pointer.x=e.clientX;pointer.y=e.clientY;pointer.active=true;pointer.down=true;if(!paused&&!reduced)pointer.power=Math.max(.65,pointer.power);root.dataset.attractionPeak='0';dragY=e.clientY;clickTime=performance.now();$('#cursor').classList.add('pressed');$('.cursor-hint').textContent='LA MATIÈRE VOUS SUIT';const ripple=$('.pointer-ripple');ripple.style.left=e.clientX+'px';ripple.style.top=e.clientY+'px';ripple.classList.remove('fire');void ripple.offsetWidth;if(!paused&&!reduced)ripple.classList.add('fire');dirty=true;wake()});
const release=e=>{if(e?.pointerType==='touch')pointer.active=false;pointer.down=false;$('#cursor').classList.remove('pressed');$('.cursor-hint').textContent='MAINTENIR POUR ATTIRER';dirty=true;wake()};
document.addEventListener('pointerup',release);document.addEventListener('pointercancel',release);addEventListener('blur',()=>{pointer.active=false;release()});document.addEventListener('pointerleave',()=>{pointer.active=false;$('#cursor').style.display='none';release()});
let wheelTotal=0,wheelLast=0,wheelLocked=0;
addEventListener('wheel',e=>{
 if(isMenuOpen()||e.ctrlKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||!ready)return;
 const stamp=performance.now(),delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?height:1);
 if(stamp<wheelLocked){e.preventDefault();return}
 if(stamp-wheelLast>190||Math.sign(delta)!==Math.sign(wheelTotal))wheelTotal=0;
 wheelLast=stamp;wheelTotal+=delta;
 if(Math.abs(wheelTotal)>=50){const next=range(activeScene+Math.sign(wheelTotal),0,LAST_SCENE);wheelTotal=0;
  if(next!==activeScene){e.preventDefault();wheelLocked=stamp+430;goScene(next)}
 }
},{passive:false});
let previousScroll=scrollY;addEventListener('scroll',()=>{if(isMenuOpen())closeMenu();const delta=scrollY-previousScroll;previousScroll=scrollY;if(delta)snapDirection=Math.sign(delta);dirty=true;wake();if(performance.now()>=scrollUntil){clearTimeout(scrollTimer);scrollTimer=setTimeout(selectNearest,165)}},{passive:true});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;pointer.down=false}else{last=0;dirty=true;wake()}});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){closeMenu();return}if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();openMenu();return}
 if(isMenuOpen()||e.target.closest('input,textarea,button,a')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(['ArrowDown','ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();goScene(activeScene+1)}
 if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goScene(activeScene-1)}
 if(e.key==='Home'){e.preventDefault();goScene(0)}if(e.key==='End'){e.preventDefault();goScene(LAST_SCENE)}
});
// The real page remains scrollable; its anchors select tableaux while the camera stays fixed.
const track=document.createElement('div');track.className='scene-track';track.setAttribute('aria-hidden','true');sections.forEach((s,i)=>{const a=document.createElement('div');a.className='scene-anchor';a.dataset.scene=String(i);track.append(a)});document.querySelector('main').append(track);
try{
 await buildForms();const sourceForms=forms.splice(0);for(const section of sections){const form=sourceForms[Number(section.dataset.formation)];if(!form)throw new Error("Formation inconnue");forms.push(form);}startRenderer();ready=true;
 const linked=sceneForHash(location.hash);const index=linked>=0?linked:sceneAtScroll();goScene(index,true);updateMotion();
 root.dataset.formations=String(forms.length);root.dataset.points=String(N);root.dataset.geometryValid=String(forms.every(f=>f.length===N&&f.every(p=>[p.x,p.y,p.z,...p.c].every(Number.isFinite))));
}catch(error){
 root.dataset.error='true';document.body.classList.add('static-mode');sections.forEach(s=>{s.inert=false;s.removeAttribute('aria-hidden')});const msg=document.createElement('p');msg.className='render-error';msg.textContent='Le rendu interactif est indisponible. Les projets restent accessibles ci-dessous.';document.querySelector('main').prepend(msg);console.error(error);
}
window.redlineTest={get state(){const f=frameComposition(Math.max(0,activeScene));return {renderer:useGL?'webgl':'canvas',scene:activeScene,project:projectFor(activeScene),morph:Math.round(morphValue*100),points:N,formations:forms.length,paused,reduced,width,height,anchor:{x:Math.round(f.cx),y:Math.round(f.cy)},pointer:{active:pointer.active,down:pointer.down,power:Number(pointer.power.toFixed(2))},menu:isMenuOpen()};},validate(){return forms.every(f=>f.length===N&&f.every(p=>[p.x,p.y,p.z,...p.c].every(Number.isFinite)))}};
