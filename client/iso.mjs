import {actorPose,trackMotion} from './combat-art.mjs';
import {tile,tracts,floorAt,treasure,landmarks,scenery,classes} from './engine.mjs';
const cv=document.getElementById('game'),c=cv.getContext('2d'),images={},H=600;
let W=1000;
const depths=new Map();
const walls=[];
for(let i=0;i<24;i++)for(let j=0;j<28;j++)if(floorAt(i,j)){
 for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]])if(!floorAt(i+di,j+dj)){
 const x=(i+.5+di*.5)*tile,y=(j+.5+dj*.5)*tile;
 walls.push({x,y,di,dj,high:j>20?12:19})
 }}
const parapetCache=new Map();
// The parapet segment is baked at 2×. Its base, coping and merlons share the
// same light direction, whether the wall runs northeast or northwest.
function wallImage(w){
 const key=[w.di,w.dj,w.high].join(',');
 if(parapetCache.has(key))return parapetCache.get(key);
 const bmp=document.createElement('canvas');bmp.width=152;bmp.height=128;
 const g=bmp.getContext('2d');g.scale(2,2);g.translate(38,47);
 function stone(start,end,bottom,top,thickness,tint){
  const pt=(t,n,h)=>{
   const p=project(w.di?n:t,w.di?t:n);return{x:p.x,y:p.y-h};
  };
  const atZ=(z)=>[pt(start,-thickness,z),pt(end,-thickness,z),pt(end,thickness,z),pt(start,thickness,z)];
  const low=atZ(bottom),high=atZ(top),depth=low.map(p=>p.y);
  for(const [i,j] of [[0,1],[1,2],[2,3],[3,0]]){
   if((depth[i]+depth[j])/2<.39*(start+end)/2-.05)continue;
   const light=w.di===0?i===2:i===1;
   poly(g,[low[i],low[j],high[j],high[i]],light?tint.light:tint.dark);
  }
  poly(g,high,tint.cap);
  g.strokeStyle=tint.edge;g.lineWidth=.58;
  g.beginPath();g.moveTo(high[2].x,high[2].y);g.lineTo(high[3].x,high[3].y);g.stroke();
 }
 const wall={cap:'#68727b',light:'#48525d',dark:'#303944',edge:'#84909b'};
 const coping={cap:'#83909a',light:'#626e77',dark:'#414b58',edge:'#a8afb2'};
 stone(-32,32,0,w.high-3,3.1,wall);
 for(let i=0;i<2;i++)stone(-32+i*32+.3,i*32-.3,w.high-3,w.high+1,4.4,coping);
 for(let i=0;i<3;i++){
  const start=-30+i*21;stone(start,start+10,w.high+1,w.high+8,3.4,wall);
  stone(start-.6,start+10.6,w.high+7.5,w.high+9,3.9,coping);
 }
 parapetCache.set(key,bmp);return bmp;
}
function parapet(w,hero){
 const p=pos(w.x,w.y);if(p.x<-60||p.x>W+60||p.y<0||p.y>H+55)return;
 c.save();if(p.y>hero.y&&Math.abs(p.x-hero.x)<34&&hero.y>p.y-w.high-10)c.globalAlpha=.33;
 c.drawImage(wallImage(w),p.x-38*scale,p.y-47*scale,76*scale,64*scale);c.restore();
}

let terrain,cam,scale=1,oldTick=0;
for(const key of ['sprite-knight','sprite-ranger','sprite-mage','sprite-cultist','sprite-eye','sprite-boss','sprite-crawler','prop-gate','prop-tower','prop-brazier','prop-chapel','floor-stone','horizon']){
 const img=new Image();img.src='/'+key+'.webp';images[key]=img;if(key==='floor-stone')img.onload=()=>terrain=null}
const project=(x,y)=>({x:(x-y)*.78,y:(x+y)*.39});
const hash=(x,y)=>{const n=Math.sin(x*23.1+y*77.6)*43153.127;return n-Math.floor(n)};
function poly(ctx,points,fill,stroke){ctx.beginPath();for(let i=0;i<points.length;i++){const p=points[i];if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y)}ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function foundation(g,v,w,bridge,seed,lit){
 // Work in the plane of the wall. The open arch is clipped out of the
 // foundation, so the valley can be seen between the supporting piers.
 const span=50,h=bridge?150:98,mid=span*.5;
 g.save();g.transform((w.x-v.x)/span,(w.y-v.y)/span,0,1,v.x,v.y);
 g.beginPath();g.moveTo(0,0);g.lineTo(span,0);g.lineTo(span,h);
 if(bridge){
  g.lineTo(42,h);g.lineTo(42,77);g.quadraticCurveTo(42,64,mid,55);
  g.quadraticCurveTo(8,64,8,77);g.lineTo(8,h);
 }
 g.lineTo(0,h);g.closePath();g.clip();
 const face=g.createLinearGradient(0,0,0,h);
 face.addColorStop(0,lit?'#414b57':'#2e3743');face.addColorStop(.25,lit?'#52616b':'#3c4956');
 face.addColorStop(1,lit?'#263645':'#212e3b');g.fillStyle=face;g.fillRect(0,0,span,h);
 for(let row=0;row<Math.ceil(h/12);row++){
  const dy=row*12,offset=(row%2)*13;
  for(let x=-offset;x<span;x+=25){
   const tone=hash(seed+x,row);
   g.fillStyle='rgba(173,186,197,'+(.024+tone*.09)+')';g.fillRect(x+.7,dy+1.4,23.9,10.5);
   g.fillStyle='rgba(11,17,26,.32)';g.fillRect(x,dy,25,1.1);g.fillRect(x,dy,1,12);
   g.fillStyle='rgba(168,186,202,.16)';g.fillRect(x+1,dy+1.2,23,.6);
  }
 }
 if(bridge){
  // Alternating wedge stones around the pointed arch.
  for(let idx=0;idx<12;idx++){
   const arcPt=(k,rise)=>{const u=k/12,d=Math.abs(u-.5)*2;
    return{x:mid+(u-.5)*(rise?41:34),y:55+22*d*d-(rise?6:0)}};
   const k=idx;poly(g,[arcPt(k,0),arcPt(k+1,0),arcPt(k+1,1),arcPt(k,1)],
    idx%2?(lit?'#606a72':'#45525e'):(lit?'#67737a':'#52606b'),'#36414b');
  }
 }
 g.fillStyle='rgba(10,17,23,.4)';g.fillRect(0,4,span,4);g.fillStyle=lit?'#94a0a5':'#6a7881';g.fillRect(0,0,span,2);
 g.restore();
}
function floorLayer(){
 const a=document.createElement('canvas');a.width=2920;a.height=1610;const g=a.getContext('2d');g.translate(1470,0);
 for(let sum=0;sum<52;sum++)for(let i=0;i<24;i++){const j=sum-i,z=floorAt(i,j);if(!z)continue;
 const p=project(i*tile,j*tile),q=project((i+1)*tile,j*tile),r=project((i+1)*tile,(j+1)*tile),s=project(i*tile,(j+1)*tile);
 for(const [other,v,w] of [[floorAt(i+1,j),q,r],[floorAt(i,j+1),s,r]]){
  if(!other)foundation(g,v,w,j>=20,i*93+j,v===s);
 }
 const h=hash(i,j),base=Math.round(45+h*15);poly(g,[p,q,r,s],'rgb('+base+','+(base+3)+','+(base+5)+')','#272c30');
 const tex=images['floor-stone'];if(tex.naturalWidth){g.drawImage(tex,s.x,p.y,q.x-s.x,r.y-p.y)}
 else {for(let row=0;row<4;row++)for(let k=0;k<3;k++){const u=i+(k+.13+(row%2)*.15)/3,v=j+(row+.15)/4;let pts=[[0,0],[.235,0],[.235,.17],[0,.17]].map(([x,y])=>project((u+x)*tile,(v+y)*tile));poly(g,pts,'rgba(165,161,147,'+(.045+.08*hash(i*5+row,j+k))+')')}}
 // Broad bands of skylight catch the water trapped between cobbles.
 const moon=Math.max(0,Math.cos((i*.48+j*.71)*.57));
 poly(g,[p,q,r,s],'rgba(127,160,190,'+(.035+moon*.06)+')');
 if(h>.53){
  g.save();g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.lineTo(r.x,r.y);g.lineTo(s.x,s.y);g.closePath();g.clip();
  for(let n=0;n<4;n++){
   const f=hash(i*17+n,j),k=hash(i,j+n*13);
   g.fillStyle='rgba(190,212,230,'+(.06+moon*.14)+')';
   g.fillRect(s.x+(q.x-s.x)*f,p.y+(r.y-p.y)*k,2+9*k,.6);
  }
  g.restore();
 }
 }
 // Baked for the static scenery. Source-atop keeps all lighting attached to masonry.
 g.save();g.globalCompositeOperation='source-atop';
 for(const o of scenery){
  const p=project(o.x,o.y);
  if(o.type==='brazier'){
   pool(g,p.x,p.y,57,28,'rgba(241,157,77,.32)');
   pool(g,p.x-2,p.y+5,13,6,'rgba(255,189,106,.22)');
  }else{
   pool(g,p.x+o.w*.25,p.y+o.w*.10,o.w*.68,o.w*.20,'rgba(12,20,29,.49)');
   pool(g,p.x,p.y,o.w*.40,o.w*.11,'rgba(6,13,23,.55)');
  }
 }
 g.restore();
 terrain=a;
}
export function resetView(){cam=null;depths.clear()}
function pos(x,y){const p=project(x,y);return{x:W/2+(p.x-cam.x)*scale,y:H*.61+(p.y-cam.y)*scale}}
export function worldAt(nx,ny){const px=nx*W,py=ny*H;const lx=(px-W/2)/scale+cam.x,ly=(py-H*.61)/scale+cam.y;return{x:(lx/.78+ly/.39)/2,y:(ly/.39-lx/.78)/2}}
export function screenAt(x,y){return pos(x,y)}
function glow(x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
function pool(ctx,x,y,rx,ry,color){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
 const fade=ctx.createRadialGradient(0,0,0,0,0,1);fade.addColorStop(0,color);fade.addColorStop(1,'transparent');
 ctx.fillStyle=fade;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function shadow(x,y,w,h){
 pool(c,x+w*.44,y+h*.53,w*1.5,h*1.6,'rgba(8,15,24,.49)');
 pool(c,x,y,w,h,'rgba(4,8,15,.67)');
}
function background(t){
 c.fillStyle='#273645';c.fillRect(0,0,W,H);
 const bg=images.horizon;
 if(bg.naturalWidth){
  const ratio=Math.max(W/bg.naturalWidth,H/bg.naturalHeight)*1.16;
  const w=bg.naturalWidth*ratio,h=bg.naturalHeight*ratio;
  // Overscan on both axes keeps panoramic scenery full-bleed in portrait as well.
  const dx=Math.tanh(cam.x/1400)*(w-W)*.42,dy=Math.tanh((cam.y-650)/900)*(h-H)*.40;
  c.drawImage(bg,(W-w)/2-dx,(H-h)/2-dy,w,h);
 }
 const fog=c.createLinearGradient(0,0,0,H);fog.addColorStop(0,'#17263525');fog.addColorStop(.52,'#24384b10');
 fog.addColorStop(1,'#46596855');c.fillStyle=fog;c.fillRect(0,0,W,H);
 for(let i=0;i<4;i++){
  const xx=((i*337+t*.08-cam.x*.13)%(W+520)+W+520)%(W+520)-260;
  pool(c,xx,130+hash(i,2)*415-cam.y*.022,225,30+i*7,'rgba(172,190,207,.075)');
 }
}
function lightRing(x,y,r,col){c.strokeStyle=col;c.lineWidth=1.6;c.beginPath();c.ellipse(x,y,r,r*.50,0,0,7);c.stroke()}
function marker(obj,i,s){
 const p=pos(obj.x,obj.y),done=i<2&&!!(s.seals&(1<<i)),active=i===2?s.seals===3&&!s.guards.length:!done;
 const color=i===0?'#e5a963':i===1?'#9cd8d3':'#ebce86';lightRing(p.x,p.y,24*scale,active?color:'#726f66');
 if(done)return;const h=active?10+3*Math.sin(s.tick*.065):5;
 glow(p.x,p.y-h,35,active?color+'48':'#665c4033');
 c.fillStyle=active?color:'#887e68';c.font='bold 24px Georgia';c.textAlign='center';c.fillText(i===2?'♜':'✧',p.x,p.y-h);if(Math.hypot(s.x-obj.x,s.y-obj.y)<150){c.font='13px Georgia';c.fillText(i===2&&!active?'Reliquaire scellé':obj.name||'Reliquaire',p.x,p.y-45)}}
const motionCache=new WeakMap(),sheets={};
const unitTypes=['knight','ranger','mage','crawler','cultist','eye','boss'];
function loadAnimationSheets(){
 for(const type of unitTypes){
  const sheet=new Image();sheet.src='/atlas-'+type+'.webp';sheets[type]=sheet;
 }
}
function reticle(p,size,tick){
 const r=size*.27;
 c.save();c.translate(p.x,p.y);c.scale(1,.48);c.strokeStyle='#f1d79e';c.lineWidth=2;
 for(let i=0;i<4;i++){const a=i*Math.PI/2+tick*.012;
  c.beginPath();c.arc(0,0,r,a,a+.74);c.stroke();
 }
 c.restore();
}
function attackFx(o,s,type,pose){
 if(!pose.attacks)return;
 const from=pos(o.x,o.y),direction=o.attackAngle;
 if(type==='knight'){
   if(pose.age<pose.release)return;
   const t=(pose.age-pose.release)/Math.max(1,pose.period-pose.release);
   if(t>.72)return;
   const end=direction-1.1+2.65*Math.min(1,t*2),start=end-1.0*(1-t);
   const curve=(a,r)=>pos(o.x+r*Math.cos(a),o.y+r*Math.sin(a));
   c.save();c.translate(0,-16*scale);c.beginPath();
   for(let k=0;k<=12;k++){const u=k/12,p=curve(start+(end-start)*u,91+10*u);if(!k)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}
   for(let k=12;k>=0;k--){const u=k/12,p=curve(start+(end-start)*u,91+10*u-12*u*u);c.lineTo(p.x,p.y)}
   c.closePath();c.fillStyle='rgba(244,224,175,'+(.8*(1-t))+')';c.fill();c.restore();
 }else if(type==='mage'||type==='eye'||type==='cultist'||type==='boss'){
   const pre=pose.age<pose.release?pose.age/pose.release:Math.max(0,1-(pose.age-pose.release)/5);
   if(pre<=0)return;const p=pos(o.x+22*Math.cos(direction),o.y+22*Math.sin(direction));
   const color=type==='mage'?'#bcbdff':'#ee906f';glow(p.x,p.y-31,6+13*pre,color+'88');
   c.save();c.strokeStyle=color;c.lineWidth=1.1;c.translate(p.x,p.y-31);c.rotate(s.tick*.16);
   c.strokeRect(-4*pre,-4*pre,8*pre,8*pre);c.restore();
 }else if(type==='ranger'&&pose.age>=pose.release&&pose.age-pose.release<3){
   const p=pos(o.x+25*Math.cos(direction),o.y+25*Math.sin(direction));
   c.strokeStyle='#d9c599aa';c.lineWidth=1;c.beginPath();c.moveTo(from.x,from.y-24);c.lineTo(p.x,p.y-24);c.stroke();
 }
}
function actor(o,s,hero,target){
 const type=hero?s.hero:o.type,p=pos(o.x,o.y),size=(hero?94:type==='boss'?121:type==='eye'?68:73)*scale;
 if(p.x<-size||p.x>W+size||p.y<-size||p.y>H+size)return;
 const motion=trackMotion(motionCache,o,s.tick),pose=actorPose(o,type,s.tick,motion,project);
 if(hero&&motion.dash&&s.tick-motion.dash.tick<8){
   const d=motion.dash,a=pos(d.fromX,d.fromY),b=pos(d.toX,d.toY);
   c.save();c.lineCap='round';c.strokeStyle='rgba(203,186,147,'+(.50*(1-(s.tick-d.tick)/8))+')';
   for(let i=0;i<3;i++){c.lineWidth=2+i;c.beginPath();c.moveTo(a.x+(b.x-a.x)*i*.14,a.y+(b.y-a.y)*i*.14-8-i*6);c.lineTo(b.x,b.y-9-i*6);c.stroke()}c.restore();
 }
 c.save();c.globalAlpha=pose.alpha;
 shadow(p.x,p.y,size*.22,size*.08);
 if(hero)lightRing(p.x,p.y,size*.21,'#d6b87d');
 if(o===target)reticle(p,size,s.tick);
 if(!hero&&pose.attacks&&pose.age<pose.release){const glowPhase=pose.age/pose.release;lightRing(p.x,p.y,size*(.19+.06*glowPhase),'rgba(246,142,105,'+(.25+.55*glowPhase)+')')}
 const sheet=sheets[type],img=images['sprite-'+type];c.save();
 c.translate(p.x+pose.offsetX*scale,p.y+pose.offsetY*scale);
 c.rotate(pose.lean);c.scale(pose.facing/pose.stretch,pose.stretch);
 if(pose.impact>.30)c.filter='brightness('+ (1+pose.impact*.55)+')';
 const useSheet=sheet?.naturalWidth&&(hero||pose.frame!==0);
 if(useSheet){
  const columns=hero?3:4,cell=sheet.naturalWidth/columns;
  const i=hero?pose.frame:[0,0,1,2,3,3][pose.frame];
  const row=Math.floor(i/columns),col=i%columns;
  c.drawImage(sheet,col*cell,row*cell,cell,cell,-size*.5,-size*(hero?.95:214/224),size,size);
 }else if(img?.naturalWidth)c.drawImage(img,-size*.5,-size*.95,size,size);
 else window.drawActor(c,hero?'hero':type,0,-10,18,s.tick/30);
 c.restore();
 if(o.hit>=0&&s.tick-o.hit<6){
  const t=(s.tick-o.hit+1)/7;
  c.save();c.lineWidth=1.5;c.strokeStyle='rgba(244,195,143,'+(1-t)+')';
  for(let i=0;i<6;i++){
   const a=i*Math.PI/3+o.hit*.64,r=size*(.06+t*.21);
   c.beginPath();c.moveTo(p.x+Math.cos(a)*r,p.y-size*.40+Math.sin(a)*r*.68);
   c.lineTo(p.x+Math.cos(a)*(r+4),p.y-size*.40+Math.sin(a)*(r+4)*.68);c.stroke();
  }
  c.restore();
 }
 if(!(o.deathAt>=0))attackFx(o,s,type,pose);
 if(!hero&&!(o.deathAt>=0)&&o.hp<o.max){c.fillStyle='#271c21';c.fillRect(p.x-15,p.y-size*.84,30,3);c.fillStyle='#c08a6e';c.fillRect(p.x-15,p.y-size*.84,30*o.hp/o.max,3)}
 c.restore()
}
function decor(o,hero,s){
 const p=pos(o.x,o.y),img=images['prop-'+o.type];if(!img.naturalWidth)return;
 const w=o.w*scale,h=w*img.naturalHeight/img.naturalWidth,top=p.y-h;
 if(p.x+w<0||p.x-w>W||p.y<0||top>H)return;
 const overlap=p.y>=hero.y-1&&Math.abs(hero.x-p.x)<w*.48+14&&hero.y-27>top&&hero.y-60<p.y;
 const prior=depths.get(o)??1,target=overlap?.26:1;const alpha=prior+(target-prior)*.25;depths.set(o,alpha);
 c.save();c.globalAlpha=alpha;c.drawImage(img,p.x-w/2,top,w,h);
 if(o.type==='brazier'){
  const flicker=Math.sin(s.tick*.18+o.x)*2+Math.sin(s.tick*.41+o.y);
  glow(p.x,p.y-h*.76,24+flicker,'#ffa5559c');
  glow(p.x,p.y-h*.75,8+flicker*.55,'#ffe8aacf');
 }
 c.restore()}
function map(s){
 const k=2.9,x=W-102,y=22;c.save();c.fillStyle='#10171dec';c.strokeStyle='#988060';c.fillRect(x-8,y-8,89,101);c.strokeRect(x-8,y-8,89,101);
 for(const z of tracts){c.fillStyle='#696962';c.fillRect(x+z[1]*k,y+z[2]*k,(z[3]-z[1])*k,(z[4]-z[2])*k)}
 for(const [i,o] of [...landmarks,treasure].entries()){if(i<2&&(s.seals&(1<<i)))continue;c.fillStyle=i===0?'#efb274':i===1?'#96e1e0':'#e9cf91';c.fillRect(x+o.x/tile*k-2,y+o.y/tile*k-2,4,4)}
 c.fillStyle='#bd7165';s.guards.forEach(o=>c.fillRect(x+o.x/tile*k-1,y+o.y/tile*k-1,2.5,2.5));c.fillStyle='#fff';c.beginPath();c.arc(x+s.x/tile*k,y+s.y/tile*k,2.8,0,7);c.fill();c.restore()}
export function render(s,target=null){
 if(!sheets.knight)loadAnimationSheets();
 const r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.8),bw=Math.max(600,Math.round(r.width*d)),bh=Math.max(1,Math.round(r.height*d));
 if(cv.width!==bw||cv.height!==bh){cv.width=bw;cv.height=bh}W=H*r.width/r.height;c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.setTransform(bw/W,0,0,bh/H,0,0);scale=r.width<550?1.18:1.03;
 const pp=project(s.x,s.y);if(!cam||s.tick<oldTick)cam=pp;else{cam.x+=(pp.x-cam.x)*.22;cam.y+=(pp.y-cam.y)*.22}oldTick=s.tick;
 background(s.tick);if(!terrain)floorLayer();const start=pos(0,0);c.drawImage(terrain,start.x-1470*scale,start.y,terrain.width*scale,terrain.height*scale);
 for(const tr of s.traps){const p=pos(tr.x,tr.y),hot=(s.tick+tr.phase)%120>86;lightRing(p.x,p.y,34,hot?'#ef8569':'#a48372');if(hot)glow(p.x,p.y,37,'#db67417a')}
 [...landmarks,treasure].forEach((o,i)=>marker(o,i,s));
 const hero=pos(s.x,s.y),list=[...walls.map(o=>({o,d:o.x+o.y,k:3})),...scenery.map(o=>({o,d:o.x+o.y,k:0})),...[...s.guards,...(s.deaths||[])].map(o=>({o,d:o.x+o.y,k:1})),{o:s,d:s.x+s.y,k:2}].sort((a,b)=>a.d-b.d);
 for(const v of list)if(v.k===3)parapet(v.o,hero);else if(v.k===0)decor(v.o,hero,s);else actor(v.o,s,v.k===2,target);
 for(const b of s.shots){const p=pos(b.x,b.y),q=pos(b.x-b.vx*1.8,b.y-b.vy*1.8),col=b.type==='mage'?'#b4beff':b.type==='enemy'?'#ea977e':'#ead6a8';c.strokeStyle=col;c.lineWidth=b.type==='mage'?5:2;c.beginPath();c.moveTo(q.x,q.y-22);c.lineTo(p.x,p.y-22);c.stroke();if(b.type!=='ranger')glow(p.x,p.y-22,11,col+'90')}
 for(const b of s.bursts){const p=pos(b.x,b.y);lightRing(p.x,p.y,b.r*(s.tick-b.tick+1)/13,'#b2ccc9')}
 c.save();c.strokeStyle='#c7ced820';c.lineWidth=1;for(let i=0;i<55;i++){const x=((hash(i,8)*W+s.tick*.5-cam.x*.19)%W+W)%W,y=((hash(i,9)*H+s.tick*3.2-cam.y*.13)%H+H)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y+8);c.stroke()}c.restore();
 const outer=Math.hypot(W,H)*.54;const vign=c.createRadialGradient(W*.5,H*.5,Math.min(W,H)*.29,W*.5,H*.5,outer);
 vign.addColorStop(0,'#060b1500');vign.addColorStop(1,'#07111b88');c.fillStyle=vign;c.fillRect(0,0,W,H);map(s)
}
