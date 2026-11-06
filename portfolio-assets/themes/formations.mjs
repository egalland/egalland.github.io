import {resamplePoints} from '../../points/point-motion.mjs';
import {orbit,wave} from './kinetics.mjs?v=kinetic1';
const cache=new Map();
export function prepare(count=3600){
 if(!cache.has(count))cache.set(count,build(count));
 return cache.get(count);
}
async function build(N){
 const points=[],forms=[];let seed=6251;
 const random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
 const lerp=(a,b,t)=>a+(b-a)*t,rgb=h=>h.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255);
 await document.fonts.load('700 100px Redline');
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
function ellipsoid(x,y,z,rx,ry,rz,c,count=900){
 for(let i=0;i<count;i++){const h=1-2*(i+.5)/count,r=Math.sqrt(1-h*h),a=i*2.399963229728653;points.push(point(x+Math.cos(a)*r*rx,y+h*ry,z+Math.sin(a)*r*rz,c,.9));}
}
function finish(){forms.push(resamplePoints(points.splice(0),N,random));}
function poseSince(start,pose){for(let i=start;i<points.length;i++)pose(points[i]);}
async function buildForms(){
 await document.fonts.ready;
 // Slanted bands make the rolling wave visible even with the camera at rest.
 for(let i=0;i<2400;i++){
  const y=1-2*(i+.5)/2400,r=Math.sqrt(1-y*y),lon=i*2.39996323;
  const x=Math.cos(lon)*r,z=Math.sin(lon)*r,phase=2*lon+5*y,band=Math.sin(phase);
  const color=band>.82?'#ffad76':band>.45?'#eb5c38':band<-.66?'#973225':'#ce412d';
  const radius=.82+.045*band,p=point(x*radius,y*radius,z*radius,color,band>.7?1.48:1.12);
  wave(p,[.085*x,.085*y,.085*z],1.65,phase);
  points.push(p);
 }
 // Tilted orbits with gaps and tapered comets. The head and tail follow the
 // same 3D rail at different angular speeds on each plane.
 const orbits=[
  {radius:1.61,heading:-.25,tilt:1.15,speed:.91,start:.32,rail:'#436963',comet:'#087d73'},
  {radius:1.38,heading:.76,tilt:1.02,speed:-1.23,start:2.3,rail:'#a75c43',comet:'#d54023'},
  {radius:1.52,heading:-.96,tilt:1.22,speed:.73,start:4.8,rail:'#526064',comet:'#a8681c'}
 ];
 for(const {radius,heading,tilt,speed,start,rail,comet} of orbits){
  const u=[Math.cos(heading),Math.sin(heading),0];
  const v=[-u[1]*Math.cos(tilt),u[0]*Math.cos(tilt),Math.sin(tilt)];
  const axis=[u[1]*v[2],-u[0]*v[2],Math.cos(tilt)];
  function orbitDot(angle,r,offset,color,size){
   const a=r*Math.cos(angle),b=r*Math.sin(angle);
   const p=point(a*u[0]+b*v[0]+offset*axis[0],a*u[1]+b*v[1]+offset*axis[1],b*v[2]+offset*axis[2],color,size);
   orbit(p,[0,0,0],axis,speed);points.push(p);
  }
  for(let i=0;i<540;i++){
   if(i%108>99)continue;
   orbitDot(i/540*Math.PI*2,radius,0,rail,i%18===0?1.35:.88);
  }
  for(let i=0;i<245;i++){
   const along=(i+.5)/245,head=1-along,spread=.008+.037*head;
   orbitDot(start-Math.sign(speed)*along*1.05,radius+(random()-.5)*spread,(random()-.5)*spread,comet,.76+head*head*2.55);
  }
 }
 finish();
 // The word and puppet are actual XYZ geometry, not point-filtered pictures.
 textCloud('KIKALMO',0,.24,160,'#416977','Redline',2);
 for(const z of [-.35,.32])rect(-1.9,-.62,3.8,1.28,z,'#8d6eaa',500);
 for(const x of [-1.9,1.9])for(const y of [-.62,.66])line([x,y,-.35],[x,y,.32],75,'#8d6eaa');
 textCloud('M _ T',0,-1.06,100,'#8b5c84','Redline',1.4);finish();
 ellipsoid(0,-.85,0,.66,.48,.37,'#354b49',1400);
 ellipsoid(0,-.65,.32,.2,.26,.08,'#d4b98c',480);
 ellipsoid(0,.27,0,.62,.72,.5,'#168aab',2100);
 for(const side of [-1,1]){
  ellipsoid(side*.65,.24,0,.18,.26,.15,'#217e99',450);
  ellipsoid(side*.24,.47,.43,.18,.21,.1,'#e8e5d8',520);
  ellipsoid(side*.24,.46,.53,.075,.11,.045,'#234849',260);
  line([side*.11,.76,.39],[side*.38,.72,.4],110,'#64382b',.025);
  line([side*.09,-.48,.42],[side*.3,-.6,.36],120,'#c25739',.02);
 }
 ellipsoid(0,.16,.57,.14,.11,.13,'#cb6140',480);
 for(let j=0;j<7;j++)ellipsoid((j-3)*.15,.9+Math.sin(j*.8)*.09,.13,.2,.17,.29,'#894127',280);
 for(let i=0;i<200;i++){const a=i/199*Math.PI;points.push(point(Math.cos(a)*.24,-.05-Math.sin(a)*.12,.47,'#204f5d',1));}
 finish();
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
 for(const [x,y,w,h,z,c] of modules){
  const start=points.length;
  rect(x,y,w,h,z,c,420);rect(x+.12,y+.12,w-.24,h-.24,z-.1,c,230);line([x+.1,y+.68,z],[x+w-.1,y+.68,z],60,c);
  poseSince(start,p=>wave(p,[x*.025,y*.025,.23],1.25,x+y));
 }
 for(let k=0;k<modules.length;k++){
  const m=modules[k],n=modules[(k+1)%modules.length],start=points.length;
  line([m[0]+m[2]/2,m[1]+m[3]/2,m[4]],[n[0]+n[2]/2,n[1]+n[3]/2,n[4]],120,'#7b8e86');
  // Interpolate the end displacements so connectors stay attached as panels rise.
  poseSince(start,p=>{
   const t=p.phase,ma=m[0]+m[1],na=n[0]+n[1];
   const offsets=[0,1].map(j=>[m[j]*.025,n[j]*.025]);offsets.push([.23,.23]);
   p.motion=[...offsets.map(([a,b])=>lerp(a*Math.cos(ma),b*Math.cos(na),t)),1.25,
    ...offsets.map(([a,b])=>lerp(a*Math.sin(ma),b*Math.sin(na),t)),0];
   delete p.track;
  });
 }
 finish();
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
 const trendStart=points.length;
 for(let k=1;k<trend.length;k++)line([...trend[k-1],.08],[...trend[k],.08],90,chartInk,.012);
 for(const [x,y] of trend)for(let k=0;k<32;k++){const t=k/32*Math.PI*2;points.push(point(x+Math.cos(t)*.035,y+Math.sin(t)*.035,.09,chartInk,1.12));}
 poseSince(trendStart,p=>{wave(p,[0,(p.y+.73)*.34,0],1.7,1.5-p.x*.9);delete p.track;});
 rect(.93,-.84,.97,.82,.03,ink,230);
 for(let row=0;row<5;row++)line([1.05,-.17-row*.125,.05],[1.72-(row%2)*.18,-.17-row*.125,.05],65,row===0?warmInk:mutedInk);
 line([-1.14,-1.02,.02],[1.89,-1.02,.02],230,ink);
 for(let col=0;col<5;col++)line([-1.12+col*.62,-1.13,.03],[-.72+col*.62,-1.13,.03],40,mutedInk);
 finish();
 // A genuine volumetric plan, with walls lifted from the ground plane.
 const walls=[[[-1.8,-1,-1],[1.6,-1,-1]],[[-1.8,-1,-1],[-1.8,-1,1.2]],[[1.6,-1,-1],[1.6,-1,1.2]],[[-1.8,-1,1.2],[1.6,-1,1.2]],[[-.3,-1,-1],[-.3,-1,.2]],[[-1.8,-1,.2],[.3,-1,.2]],[[.3,-1,.2],[.3,-1,1.2]]];
 for(const [a,b] of walls){line(a,b,130,'#d54b29');line([a[0],.6,a[2]],[b[0],.6,b[2]],100,'#2c4847');line(a,[a[0],.6,a[2]],80,'#2c4847');line(b,[b[0],.6,b[2]],80,'#2c4847');for(let j=0;j<320;j++){let t=random(),h=random();points.push(point(lerp(a[0],b[0],t),lerp(-1,.6,h),lerp(a[2],b[2],t),random()>.8?'#c9ad89':'#6c7a72',.6));}}
 // The footprint stays grounded while the point-built walls lift and settle.
 poseSince(0,p=>{
  if(p.y<=-.99)return;
  wave(p,[0,(p.y+1)*.24,0],.98,Math.PI/2);
  if(p.track?.a[1]!==p.track?.b[1])delete p.track;
 });
 for(let x=-1.8;x<=1.61;x+=.24)line([x,-1,-1],[x,-1,1.2],50,'#9c9f91');finish();
 rect(-1.5,-1.15,2.8,2.45,0,'#294a49',480);for(let row=0;row<3;row++){line([-1.35,.98-row*.72,.04],[1.15,.98-row*.72,.04],140,'#7e9185');for(let col=0;col<7;col++){rect(-1.25+col*.34,.52-row*.72,.25,.42,.15,col<2?'#d54b29':'#456a66',80);line([-1.13+col*.34,.6-row*.72,.2],[-1.13+col*.34,.76-row*.72,.2],25,'#bd8b44');}}
 for(let j=0;j<6;j++){const x=-1.13+j*.34;line([x,-1,.05],[x,-1.5-j*.08,.1],75,j%2?'#cd6c47':'#437b7b');line([x,-1.5-j*.08,.1],[2.0,-1.5-j*.08,-.3],85,j%2?'#cd6c47':'#437b7b');}finish();
 for(let ring=0;ring<3;ring++){
  const R=1.5-ring*.37,center=[0,0,ring*.1],speed=[.44,-.63,.84][ring];
  for(let i=0;i<1800;i++){
   const t=random()*Math.PI*2*(.73+ring*.07),q=random()*Math.PI*2,rad=R+.065*Math.cos(q);
   const p=point(rad*Math.cos(t),rad*Math.sin(t),.065*Math.sin(q)+center[2],['#a3ec9d','#8dbed3','#dfa0a8'][ring],1.05);
   orbit(p,center,[0,0,1],speed);points.push(p);
  }
 }
 finish();
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
 line([0,-1.1,.17],[0,1.1,.17],340,'#283c4b',.006);
 const pageStart=points.length;
 for(const side of [-1,1])for(let i=0;i<190;i++)points.push(point(...bookPoint(1,i/189,side*1.04),'#ad703f',1.2));
 for(let row=0;row<10;row++)for(let i=0;i<84;i++){
  points.push(point(...bookPoint(1,.10+i/100,.80-row*.17),'#637a6a',.9));
 }
 line([1.655,-1.04,.16],[1.655,1.04,.16],190,'#ad703f');
 poseSince(pageStart,p=>orbit(p,[0,0,.16],[0,-1,0],.95,Math.PI*.98));
 finish();
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
 // Four en route: three independent dials with hands and name fields.
 for(let dial=0;dial<3;dial++){const x=(dial-1)*1.28,y=dial===1?.27:-.25,z=(dial-1)*.18,c=['#8e532c','#c06b39','#5e786b'][dial];
  for(let ring=0;ring<2;ring++)for(let i=0;i<700;i++){const a=i/700*Math.PI*2,r=.54-ring*.04;points.push(point(x+Math.cos(a)*r,y+Math.sin(a)*r,z,c,.95));}
  for(let tick=0;tick<12;tick++){const a=tick/12*Math.PI*2;line([x+Math.cos(a)*.43,y+Math.sin(a)*.43,z],[x+Math.cos(a)*.48,y+Math.sin(a)*.48,z],25,c);}
  const center=[x,y,z+.02],longHand=points.length;
  line(center,[x+.36*Math.sin(dial+1),y+.36*Math.cos(dial+1),z+.02],150,'#283c4b');
  poseSince(longHand,p=>orbit(p,center,[0,0,1],-(.92+dial*.4)));
  const shortHand=points.length;
  line(center,[x-.18,y+.09,z+.02],90,c);
  poseSince(shortHand,p=>orbit(p,center,[0,0,1],-(.15+dial*.08)));
  rect(x-.43,y-.85,.86,.2,z,c,200);
 }finish();
 // A biscuit, its fold and a short paper fortune: no bitmap layer.
 for(let i=0;i<6200;i++){const a=random()*Math.PI*2,r=Math.sqrt(random()),x=Math.cos(a)*r*1.5,y=Math.sin(a)*r*.95,z=Math.sqrt(1-r*r)*.38;points.push(point(x,y,z,i%13===0?'#704c33':i%3?'#a76b39':'#bc8c50',.85));}
 line([-1.4,-.05,.22],[1.35,-.05,.22],480,'#61422d');rect(.4,-.24,1.43,.42,.35,'#8e7356',500);for(let i=0;i<3;i++)line([.58,-.12+i*.09,.36],[1.58,-.12+i*.09,.36],100,'#655f52');finish();
 // Inktober: thirty-one cells arranged like a calendar.
 rect(-1.9,-1.33,3.8,2.62,0,'#283c4b',600);line([-1.9,.98,0],[1.9,.98,0],200,'#8e532c');
 for(let day=0;day<31;day++){const col=day%7,row=Math.floor(day/7),x=-1.72+col*.51,y=.52-row*.4;rect(x,y,.4,.29,.03,day%5===0?'#a46636':'#61796f',100);textCloud(String(day+1),x+.2,y+.15,75,'#283c4b','Redline',.48);}finish();
 // A continuous thread through the four milestones of the shared timeline.
 const milestones=[[-1.5,.72,0],[-.55,.25,.15],[.47,.7,.3],[1.48,-.1,.1]];
 for(let i=0;i<milestones.length;i++){const [x,y,z]=milestones[i];for(let k=0;k<700;k++){const a=k/700*Math.PI*2;points.push(point(x+Math.cos(a)*.2,y+Math.sin(a)*.2,z,'#dd4633',1));}line([x,y-.24,z],[x,-1.15,z],180,'#657365');if(i)line(milestones[i-1],milestones[i],400,'#283c4b');}finish();
}

 await buildForms();return forms;
}
