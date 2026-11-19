import {fiberLifetime,impactFibers} from './puppet-combat.js';
import {terrainHeight,terrainGradient,buildingGround,waterLevel,walkingPose} from './terrain-height.js';
import {terracePanels} from './street-terraces.js';
import {buildShotEffect,effectDuration} from './weapon-effects.js';
import { vehicleSpec } from './vehicle-types.js';
// Perspective software renderer for browsers without a WebGL 2 context.
// It projects the same metre-space data, props, actors and camera boom as the GPU view.
import {buildings,streets,water,green} from './paris-data.js';
import {monuments,cameraDistance,nearbyProps} from './paris-world.js';
import {drawCanvasPuppet,drawCanvasCar} from './canvas-puppets.js';
import {drawKikalmoPuppet} from './kikalmo-canvas.js';
import {pickupPatch,pickupStyle,pickupLift,pickupPhase,pickupRange,pickupMarkerWidth} from './pickup-art.js';
import {grandParisModels,skipLandmark} from './canvas-landmarks.js';

const tau=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),near=.32;
const stone=['#d6b998','#e9c5a2','#cba897','#dbc4ab','#c9a78c','#d9b99d','#e5c7b0','#d2b6a6'];
const roofs=['#716773','#72727d','#746572','#7c737c','#68697a'];
const canopies=['#487f78','#b56767','#a07b58','#537786','#839977'];
const mix=(a,b,t)=>a+(b-a)*t;
function tint(hex,f){
  const a=parseInt(hex.slice(1),16);
  const k=n=>Math.round(clamp(n*f,0,255));
  return 'rgb('+k(a>>16)+','+k((a>>8)&255)+','+k(a&255)+')';
}
function loopBounds(path){
  let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;
  for(const p of path){l=Math.min(l,p[0]);r=Math.max(r,p[0]);t=Math.min(t,p[1]);b=Math.max(b,p[1]);}
  return {x:(l+r)*.5,y:(t+b)*.5,r:Math.hypot(r-l,b-t)*.5+1,l,t,rr:r,b};
}
function cells(){
  const map=new Map(),cell=126;
  return {
    add(o){const b=o.bounds;for(let x=Math.floor(b.l/cell);x<=Math.floor(b.rr/cell);x++)for(let y=Math.floor(b.t/cell);y<=Math.floor(b.b/cell);y++){const key=x+':'+y;let s=map.get(key);if(!s){s=[];map.set(key,s);}s.push(o);}},
    around(x0,y0,r){const out=new Set();for(let x=Math.floor((x0-r)/cell);x<=Math.floor((x0+r)/cell);x++)for(let y=Math.floor((y0-r)/cell);y<=Math.floor((y0+r)/cell);y++){const s=map.get(x+':'+y);if(s)for(const o of s)out.add(o);}return [...out];}
  };
}
let spatial=null;
function getSpatial(){
  if(spatial)return spatial;
  const blocks=cells(),ways=cells();
  for(const o of buildings){
    const bounds=loopBounds(o.poly);
    if(skipLandmark(o.id)||String(o.id)==='157326'||String(o.id)==='444657'||['245184969','245198908'].includes(String(o.id)))continue;
    let area=0;for(let i=0;i<o.poly.length;i++){const a=o.poly[i],b=o.poly[(i+1)%o.poly.length];area+=a[0]*b[1]-b[0]*a[1];}
    blocks.add({o,bounds,ground:buildingGround(o.poly),wind:Math.sign(area),seed:Math.abs(Math.floor(Number(o.id)||bounds.x+bounds.y))});
  }
  for(const way of streets){if(way.level<0)continue;
    for(let i=1;i<way.path.length;i++){
      const a=way.path[i-1],b=way.path[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(len<.4)continue;
      const bounds=loopBounds([a,b]),w=Math.max(1.8,way.w||4);bounds.r+=w;bounds.l-=w;bounds.rr+=w;bounds.t-=w;bounds.b+=w;
      ways.add({a,b,nx:-dy/len,ny:dx/len,len,w,way,bounds});
    }
  }
  spatial={blocks,ways};return spatial;
}
const facadeImages=new Map();
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function facade(seed,levels,shade,glass){
  const key=[seed%8,levels,shade,glass].join('|');
  if(facadeImages.has(key))return facadeImages.get(key);
  const w=64,floorH=30,h=levels*floorH+34,c=makeCanvas(w,h),g=c.getContext('2d');
  const color=stone[seed%stone.length],lighting=shade?1.015:.84;
  g.fillStyle=tint(color,lighting);g.fillRect(0,0,w,h);
  if(glass){
    g.fillStyle=shade?'#8298a0':'#728997';g.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=16){g.fillStyle='rgba(206,225,217,.63)';g.fillRect(0,y,w,1.6);}
    for(let x=0;x<w;x+=12){g.fillStyle='#a6b9b7';g.fillRect(x,0,1.8,h);}
    g.fillStyle='rgba(226,233,212,.16)';g.beginPath();g.moveTo(20,0);g.lineTo(49,0);g.lineTo(21,h);g.lineTo(0,h);g.fill();
  }else{
    // Shallow shadows, limestone courses, double windows and black balcony ironwork.
    for(let y=4;y<h;y+=8){g.fillStyle='rgba(112,90,86,.17)';g.fillRect(0,y,w,.7);g.fillRect((Math.floor(y/8)%2)*13+12,y,1,8);}
    for(let j=0;j<levels;j++){const yy=j*floorH;
      g.fillStyle='rgba(89,69,69,.26)';g.fillRect(0,yy+1,w,2);g.fillStyle='#edd2ab';g.fillRect(0,yy+3,w,1);
      for(let col=0;col<2;col++){const x=7+32*col,y=yy+5;
        g.fillStyle='#a79083';g.fillRect(x-2,y,19,22);g.fillStyle=shade?'#fae3bf':'#d5b99f';g.fillRect(x-2,y-1,19,2);
        g.fillStyle=(seed+col+j)%5===0?'#bf976b':'#425767';g.fillRect(x,y+2,15,18);
        g.fillStyle=(seed+col+j)%5===0?'#e8c08d':'#78909a';g.fillRect(x+1,y+3,6,7);
        g.fillStyle='#bdac9d';g.fillRect(x+7,y+1,1,18);g.fillRect(x,y+10,15,1);
        g.fillStyle='#c9b3a0';g.fillRect(x-3,y+20,20,2);
        if(j===0||j===levels-2||seed%4===0){
          g.fillStyle='#5b5358';g.fillRect(x-3,y+15,20,1.5);g.fillRect(x-3,y+20,20,1.3);
          for(let bx=0;bx<5;bx++)g.fillRect(x-2+bx*4,y+15,1,5);
        }
      }
    }
    const y=levels*floorH,awning=canopies[seed%canopies.length];
    g.fillStyle=tint(color,.79);g.fillRect(0,y,w,34);
    g.fillStyle='#514a51';g.fillRect(4,y+6,56,28);
    g.fillStyle=shade?'#6f8789':'#566f78';g.fillRect(7,y+9,17,21);g.fillRect(29,y+10,8,24);g.fillRect(41,y+9,16,21);
    g.fillStyle='#daa86e';g.fillRect(9,y+19,11,6);g.fillRect(44,y+16,8,7);
    for(let bx=0;bx<8;bx++){g.fillStyle=bx%2?awning:'#e8d8b9';g.fillRect(bx*8,y+4,8,4);}
    g.fillStyle='#524754';g.fillRect(0,y+0,w,3);
    // A raised chain stitch along the awning, still visible on close façades.
    g.fillStyle='#f0cf9c';for(let bx=0;bx<w;bx+=7)g.fillRect(bx,y+1,3,.9);
  }
  facadeImages.set(key,c);return c;
}
const patternImages=new Map();
function repeatFacade(img,count) {
  if(count<=1)return img;
  let cache=patternImages.get(img);if(!cache){cache=new Map();patternImages.set(img,cache);}
  if(!cache.has(count)){
    const c=makeCanvas(img.width*count,img.height),ctx=c.getContext('2d');
    ctx.fillStyle=ctx.createPattern(img,'repeat-x');ctx.fillRect(0,0,c.width,c.height);cache.set(count,c);
  }
  return cache.get(count);
}
let arcArt;
function illustratedArc(){
  if(arcArt)return arcArt;
  const w=464,h=510,c=makeCanvas(w,h),g=c.getContext('2d'),X=w/2,R=76,spring=318;
  const grad=g.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#ead4af');grad.addColorStop(.55,'#d5b79a');grad.addColorStop(1,'#a9877f');
  const stroke=(x1,y1,x2,y2,col,th=1)=>{g.strokeStyle=col;g.lineWidth=th;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
  const circle=(x,y,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,tau);g.fill();};
  const body=new Path2D();body.rect(0,0,w,h);
  const opening=new Path2D();opening.moveTo(X-R,h+3);opening.lineTo(X-R,spring);opening.arc(X,spring,R,Math.PI,0);opening.lineTo(X+R,h+3);opening.closePath();
  body.addPath(opening);g.clip(body,'evenodd');g.fillStyle=grad;g.fillRect(0,0,w,h);
  for(let y=2;y<h;y+=10){
    stroke(0,y,w,y,'rgba(115,92,84,.33)',.65);
    for(let x=13*((y/10|0)%2);x<w;x+=35)stroke(x,y,x,y+10,'rgba(129,98,83,.33)',.65);
  }
  for(let y=3;y<h;y+=9)for(let x=5+(y%7);x<w;x+=19){stroke(x,y,x+3,y+1.7,'rgba(255,232,197,.38)',.65);stroke(x+3,y+1.7,x+5,y-.15,'rgba(164,125,96,.27)',.55);}
  const band=(y,hh,c1,c2)=>{g.fillStyle=c1;g.fillRect(0,y,w,hh);stroke(0,y,w,y,'#f2daba',1.7);stroke(0,y+hh,w,y+hh,c2,1.7);};
  band(1,7,'#e4c8a7','#957d76');band(10,3,'#c7aa94','#b0917d');
  for(let i=0;i<9;i++){
    const x=9+i*50;g.fillStyle='#b49782';g.fillRect(x,17,44,54);
    g.fillStyle='#e8cdab';g.fillRect(x+2,18,40,51);
    g.fillStyle='#ccb19a';g.fillRect(x+5,21,34,44);g.strokeStyle='#eed8b7';g.lineWidth=1;g.strokeRect(x+7,23,30,40);
    for(let j=0;j<4;j++){const jj=8+j;stroke(x+12,28+jj*2,x+32,28+jj*2,'rgba(120,105,91,.5)',.7);}
    circle(x+22,33,3.6,'#bca18a');circle(x+22,32,2.3,'#e4c9a5');
  }
  band(75,6,'#e9ceb0','#b69c88');band(83,7,'#cfb296','#8e776e');
  g.fillStyle='#998474';g.fillRect(0,92,w,5);g.fillStyle='#e4c8a5';for(let x=2;x<w;x+=9)g.fillRect(x,91,6,5);
  band(99,31,'#c2a38c','#9b8374');
  for(let i=0;i<49;i++){
    const x=i*9.7,y=118+Math.sin(i*9)*2;circle(x+2,y-9,2.4,'#e6caac');
    stroke(x+2,y-6,x+(i%2?1:4),y+2,i%2?'#a68b76':'#ead2ae',3);
    stroke(x+2,y-3,x+7,y-7,'#ddbf9e',1.8);stroke(x+1,y+1,x-2,y+7,'#d6b89d',1.8);stroke(x+2,y+1,x+7,y+7,'#a08775',1.8);
  }
  band(132,6,'#e6c9a7','#9b8472');band(141,3,'#d0b297','#baa18c');
  g.fillStyle='#c9ae93';for(let x=6;x<w;x+=14)g.fillRect(x,146,6,1.2);
  for(const sign of [-1,1]){
    const mid=X+sign*151;
    g.fillStyle='#b79a84';g.fillRect(mid-43,217,86,43);
    g.fillStyle='#e7c9a7';g.fillRect(mid-42,215,84,40);
    for(let j=0;j<9;j++){
      const x=mid-36+j*8.4,y=242-Math.sin(j*5)*3;
      circle(x,y-13,3.2,'#c5a48b');circle(x-.8,y-14,1.9,'#e6c9a5');
      stroke(x,y-10,x+1,y-2,'#b3957d',4);stroke(x,y-7,x+4,y-11,'#e3c4a2',2);
      stroke(x+1,y-1,x-3,y+8,'#c9a88d',2.8);stroke(x+1,y-1,x+5,y+8,'#b49981',2);
    }
    const px=mid-45,py=299;g.fillStyle='#ab8e79';g.fillRect(px,py,90,158);g.fillStyle='#c6ab90';g.fillRect(px+2,py+1,86,154);
    // Cluster of bas-relief figures and the allegorical figure above them.
    for(let j=0;j<8;j++){
      const sc=.7+.37*Math.sin(j*1.54),x=mid+(j-3.5)*9.5,y=425-((j*11)%18);
      circle(x,y-23*sc,4.6*sc,'#8f776b');circle(x-1,y-24*sc,4*sc,'#e5c4a2');
      stroke(x-.7,y-18*sc,x+1.5,y-1*sc,'#ad8f7b',8*sc);
      stroke(x+1,y-15*sc,x-7*sc,y-11*sc,'#dfbd9c',3.7*sc);
      stroke(x+1,y-15*sc,x+8*sc,y-21*sc,'#d5b497',3*sc);
      stroke(x,y-2*sc,x-5*sc,y+18*sc,'#a18675',4*sc);stroke(x,y-1*sc,x+6*sc,y+17*sc,'#dfbd9a',3.6*sc);
    }
    const x=mid;circle(x,329,6,'#a98b76');circle(x-1,327,5,'#e7c49b');
    g.fillStyle='#ad8b77';g.beginPath();g.moveTo(x-4,333);g.quadraticCurveTo(x-11,351,x-19,364);g.lineTo(x-2,358);g.lineTo(x+13,371);g.lineTo(x+7,334);g.fill();
    stroke(x-5,336,x-16,344,'#e5bc94',5);stroke(x-16,344,x-20,334,'#c6a28a',3);
    stroke(x+2,334,x+15,323,'#e4bd97',4.5);stroke(x+15,323,x+26,306,'#ae907c',1.6);
    for(const ss of [-1,1])for(let j=0;j<4;j++)stroke(x+ss*5,336+j*1.8,x+ss*(15+j*3),321+j*1.7,'#dabb9e',3.5);
    band(472,3,'#d5b99e','#9f8976');
    const mx=X+sign*114;circle(mx,183,12,'#ba9980');circle(mx-.6,182,10,'#ecd0a6');circle(mx,182,7.2,'#c4a486');
  }
  for(let j=0;j<=29;j++){
    const ang=Math.PI+j/29*Math.PI,cs=Math.cos(ang),sn=Math.sin(ang);
    stroke(X+R*cs,spring+R*sn,X+(R+14)*cs,spring+(R+14)*sn,j%3?'#a78a77':'#e8caaa',j%3?.8:1.4);
  }
  for(const offset of [2,7,13,17]){g.lineWidth=offset===17?2.5:1.4;g.strokeStyle=offset%2?'#e7cbac':'#a88e7b';
    g.beginPath();g.moveTo(X-R-offset,h);g.lineTo(X-R-offset,spring);g.arc(X,spring,R+offset,Math.PI,0);g.lineTo(X+R+offset,h);g.stroke();}
  band(496,7,'#d3b99c','#a08574');arcArt=c;return c;
}
const propArt=new Map();
function propImage(type,seed){
  const key=type+(seed%3);if(propArt.has(key))return propArt.get(key);
  const c=makeCanvas(104,146),g=c.getContext('2d');g.lineCap='round';g.lineJoin='round';
  const ellipse=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,tau);g.fill();};
  if(type==='tree'){
    g.strokeStyle='#75645f';g.lineWidth=8;g.beginPath();g.moveTo(51,144);g.quadraticCurveTo(45,96,53,69);g.stroke();
    g.lineWidth=4;for(const s of [-1,1]){g.beginPath();g.moveTo(50,113);g.quadraticCurveTo(53+s*12,92,50+s*25,77);g.stroke();}
    const greens=[['#567b73','#759782','#91a58a','#b5bd91'],['#678775','#839e78','#a5aa81','#c5c795'],['#496c69','#6b9282','#81a597','#a0b599']][seed%3];
    for(const [x,y,r,k] of [[33,70,27,0],[68,65,29,0],[49,37,30,0],[26,56,23,1],[62,45,30,1],[46,67,24,1],[47,31,22,2],[24,50,18,2],[70,51,17,2]])ellipse(x,y,r,r*.96,greens[k]);
    for(let j=0;j<40;j++){const x=(j*43+seed*7)%65+17,y=(j*31)%54+18;if((x-51)**2+(y-48)**2>1090)continue;g.strokeStyle=j%3?greens[1]:greens[3];g.lineWidth=1.6;g.beginPath();g.moveTo(x-2,y);g.lineTo(x,y+2.5);g.lineTo(x+2.8,y-1);g.stroke();}
  }else if(type==='lamp'){
    g.fillStyle='#414b51';g.fillRect(49,30,5,109);g.fillRect(46,130,11,12);g.fillRect(43,141,17,5);
    g.strokeStyle='#53615d';g.lineWidth=4;g.beginPath();g.moveTo(51,35);g.quadraticCurveTo(52,21,49,17);g.stroke();
    g.fillStyle='#36484e';g.beginPath();g.moveTo(39,9);g.lineTo(62,9);g.lineTo(58,28);g.lineTo(47,28);g.fill();g.fillStyle='#ffe1a5';g.fillRect(46,12,10,12);
    g.fillStyle='#455253';g.beginPath();g.moveTo(36,10);g.lineTo(51,1);g.lineTo(66,10);g.fill();
  }else if(type==='bench'){
    g.fillStyle='#485652';g.fillRect(20,88,7,54);g.fillRect(77,86,7,55);
    g.fillStyle='#967758';g.fillRect(10,45,83,13);g.fillRect(10,63,83,13);g.fillRect(8,87,88,15);
  }else if(type==='hydrant'){
    g.fillStyle='#ad5c55';g.fillRect(36,63,32,78);ellipse(52,61,18,17,'#d87968');g.fillRect(25,86,54,16);
    g.fillStyle='#925552';g.fillRect(30,137,44,8);g.fillStyle='#e3a77a';g.fillRect(38,77,28,4);
  }else{
    const bin=type==='bin';g.fillStyle=bin?'#5f8273':'#53636a';g.fillRect(bin?29:42,bin?34:29,bin?47:20,112);
    ellipse(52,bin?35:29,bin?27:11,bin?10:9,bin?'#749282':'#687b7b');
    g.fillStyle=bin?'#4a655b':'#efe4bc';g.fillRect(bin?32:42,bin?55:47,bin?40:20,bin?6:7);
  }
  propArt.set(key,c);return c;
}
function monumentModel(m){
  const faces=[],arc=m.id==='arc',side=m.side,depth=m.depth,gap=m.innerSide,cy=arc?18.7:0;
  const c=Math.cos(m.yaw),s=Math.sin(m.yaw);
  const world=([x,h,z])=>[m.x+x*c+z*s,m.y-x*s+z*c,h];
  const face=(pts,color)=>{const p=pts.map(world);faces.push({p,color,x:p.reduce((a,v)=>a+v[0],0)/p.length,y:p.reduce((a,v)=>a+v[1],0)/p.length});};
  function block(l,r,d,f,b,t,palette){
    face([[l,b,d],[r,b,d],[r,t,d],[l,t,d]],palette[0]);
    face([[l,b,f],[r,b,f],[r,t,f],[l,t,f]],palette[0]);
    face([[l,b,d],[l,b,f],[l,t,f],[l,t,d]],palette[1]);
    face([[r,b,d],[r,b,f],[r,t,f],[r,t,d]],palette[1]);
    face([[l,t,d],[r,t,d],[r,t,f],[l,t,f]],palette[2]);
  }
  const limestone=['#dfc4a2','#bca59b','#edddbb'],tinted=['#cfad94','#ae9387','#eed1ad'],trim=['#e7cdad','#c5b0a1','#f3e2c1'];
  if(arc){
    for(const lr of [[-side,-gap],[gap,side]])for(const fb of [[-depth,-4.2],[4.2,depth]])block(...lr,...fb,0,30,limestone);
    // Voussoirs on the main barrel. Each sculpted wedge is dimensioned in metres.
    for(let j=0;j<16;j++){
      const a=Math.PI*j/16,b=Math.PI*(j+1)/16,ix=gap*Math.cos(a),jx=gap*Math.cos(b),ih=cy+gap*Math.sin(a),jh=cy+gap*Math.sin(b);
      const xx=(gap+1.15)*Math.cos(a),zx=(gap+1.15)*Math.cos(b),xh=cy+(gap+1.15)*Math.sin(a),zh=cy+(gap+1.15)*Math.sin(b);
      for(const z of [-depth,depth]){
        face([[ix,ih,z],[jx,jh,z],[jx,31,z],[ix,31,z]],limestone[0]);
        face([[ix,ih,z*1.003],[jx,jh,z*1.003],[zx,zh,z*1.003],[xx,xh,z*1.003]],j%2?'#e9d1ac':'#d6b99e');
      }
      face([[ix,ih,-depth],[jx,jh,-depth],[jx,jh,depth],[ix,ih,depth]],'#9a8b83');
    }
    for(const z of [-depth,depth])for(const sign of [-1,1]){
      const mx=sign*(side+gap)*.5,zz=z*1.004;
      face([[mx-5.1,2,zz],[mx+5.1,2,zz],[mx+5.1,17.4,zz],[mx-5.1,17.4,zz]],'#c5a78f');
      for(let j=0;j<6;j++){const x=mx-3+j*1.27,h=7+((j*7)%6)*.8;
        face([[x-1.13,3.4,zz*1.003],[x+1.1,3.4,zz*1.003],[x+1.4,h-1,zz*1.003],[x+.49,h+1.39,zz*1.003],[x-.9,h,zz*1.003]],j%2?'#b69c88':'#cfb298');}
      face([[mx-4.7,19.0,zz],[mx+4.7,19,zz],[mx+4.7,23.4,zz],[mx-4.7,23.4,zz]],'#ead2ad');
      for(let j=0;j<5;j++)face([[mx-4+j*1.7,20.0,zz*1.002],[mx-3+j*1.7,20.0,zz*1.002],[mx-3.5+j*1.7,22.5,zz*1.002]],'#c7a995');
    }
    block(-side,side,-depth,depth,29.8,35.5,limestone);
    block(-side-.55,side+.55,-depth-.55,depth+.55,35.5,36.25,trim);
    block(-side,side,-depth,depth,36.25,39.8,tinted);
    for(const z of [-depth-.04,depth+.04])for(let i=0;i<24;i++){const x=-side+1+i*1.82;
      face([[x-.67,36.7,z],[x+.62,36.7,z],[x+.79,38.55,z],[x+.11,39.27,z],[x-.52,38.7,z]],i%2?'#ead2ac':'#c09d87');}
    block(-side-.83,side+.83,-depth-.83,depth+.83,39.8,41.4,trim);
    block(-side+.60,side-.60,-depth+.58,depth-.58,41.4,47.9,limestone);
    for(const z of [-depth+.36,depth-.36])for(let i=0;i<9;i++){
      const x=-side+2+i*4.9;
      face([[x,42.1,z],[x+3,42.1,z],[x+3,46.9,z],[x,46.9,z]],'#bfaa9a');
      face([[x+.25,42.45,z*1.001],[x+2.75,42.45,z*1.001],[x+2.75,46.55,z*1.001],[x+.25,46.55,z*1.001]],'#dfc6a7');
    }
    block(-side+.05,side-.05,-depth+.05,depth-.05,47.9,49.5,trim);
  }else{
    const glass=['#c6d0cb','#8da3a8','#e6e6d5'],marble=['#e8dfd3','#bdc7c8','#f2e7db'];
    for(const lr of [[-side,-gap],[gap,side]]){
      block(...lr,-depth,depth,0,m.h,marble);
      for(const z of [-depth-.06,depth+.06])for(let j=0;j<23;j++){
        const y=3+j*4.3;
        face([[lr[0]+1,y,z],[lr[1]-1,y,z],[lr[1]-1,y+1.3,z],[lr[0]+1,y+1.3,z]],glass[1]);}
    }
    block(-gap,gap,-depth,depth,m.clearance,m.h,marble);
    face([[-gap,m.clearance,-depth],[gap,m.clearance,-depth],[gap,m.clearance,depth],[-gap,m.clearance,depth]],'#91a3a5');
  }
  return {m,faces};
}
function parisLandmark(id,x,y){
  const faces=[];
  const add=(p,color)=>faces.push({p,color,x:p.reduce((s,v)=>s+v[0]/p.length,0),y:p.reduce((s,v)=>s+v[1]/p.length,0)});
  const rotate=(a,b,height)=>[x+a*.898-b*.44,y+a*.44+b*.898,height];
  if(id==='pyramid'){
    const r=17.55,top=rotate(0,0,21.6),square=[[-r,-r],[r,-r],[r,r],[-r,r]];
    for(let i=0;i<4;i++){
      const a=square[i],b=square[(i+1)%4],u=rotate(...a,0),v=rotate(...b,0);
      add([u,v,top],['#6b96a7','#87a8af','#adc4c1','#829ea7'][i]);
      for(let j=1;j<12;j++){
        const f=j/12,aa=[mix(u[0],v[0],f),mix(u[1],v[1],f),0],bb=[mix(u[0],top[0],f),mix(u[1],top[1],f),top[2]*f],cc=[mix(v[0],top[0],1-f),mix(v[1],top[1],1-f),top[2]*(1-f)];
        for(const target of [bb,cc]){const off=.07;add([aa,target,[target[0]+off,target[1],target[2]],[aa[0]+off,aa[1],aa[2]]],'#cfdbd2');}
      }
    }
  }else{
    const foot=1.53,top=.78,base=4.25,shaft=24.7;
    const corners=r=>[[-r,-r],[r,-r],[r,r],[-r,r]];
    for(let i=0;i<4;i++){
      const j=(i+1)%4,b=corners(2.8),bb=corners(2.55),lo=corners(foot),hi=corners(top);
      add([rotate(...b[i],0),rotate(...b[j],0),rotate(...bb[j],base),rotate(...bb[i],base)],['#bda991','#c4ada0','#a9968c','#d6bd9e'][i]);
      add([rotate(...lo[i],base),rotate(...lo[j],base),rotate(...hi[j],shaft),rotate(...hi[i],shaft)],['#c68f7c','#e1ae8d','#bd8e7b','#dda98a'][i]);
      add([rotate(...hi[i],shaft),rotate(...hi[j],shaft),rotate(0,0,26.4)],i%2?'#e9c571':'#d0a450');
    }
  }
  return {m:{id,x,y},faces};
}
const monumentModels=[...Object.values(monuments).map(monumentModel),parisLandmark('pyramid',6284,2114),parisLandmark('obelisk',5206,1617),...grandParisModels];

export function createCanvasView(canvas,spawn,onNotice){
  let surface=canvas,g=canvas.getContext('2d',{alpha:false});
  if(!g){
    surface=document.createElement('canvas');
    surface.setAttribute('aria-hidden','true');
    surface.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    canvas.after(surface);g=surface.getContext('2d',{alpha:false});
  }
  if(!g){onNotice?.('Le navigateur ne fournit pas de surface de dessin.');return {available:false,mode:'canvas',render(){},aim(){return null;},projectTarget(){return null;},effect(){},dispose(){surface!==canvas&&surface.remove();}};}
  const spatial=getSpatial(),parks=green.map(a=>({a,bounds:loopBounds(a.poly)})),waters=water.map(a=>({a,level:waterLevel(a),bounds:loopBounds(a.poly)}));
  let projectionBase=null;const terraceFaces=[];
  let w=0,h=0,f=0,camX=spawn.x,camY=spawn.y,camH=2.3,fx=1,fy=0,sin=0,cos=1,horizon=.42,sideLimit=1;
  let arm=5.25,followX=spawn.x,followY=spawn.y,cacheX=Infinity,cacheY=Infinity,nearBuildings=[],nearWays=[],props=[],lastProps=-10;
  let running=true,drawn=false,clock=0,last=-10;const effects=[],queue=[],occlusion=[];
  let foregroundLayer=null;
  let background=null,backX=Infinity,backY=Infinity,backYaw=0,backPitch=0,backArm=0,backHeight=0,backVersion=null,backPropCount=0;
  function xyz(x,y,height){
    const ground=projectionBase??terrainHeight(x,y);
    const dx=x-camX,dy=y-camY,forward=dx*fx+dy*fy,v=ground+height-camH;
    return {s:-dx*fy+dy*fx,v:v*cos-forward*sin,d:forward*cos+v*sin};
  }
  function project(v){return {x:w*.5+f*v.s/v.d,y:h*.5-f*v.v/v.d,d:v.d};}
  function at(x,y,z){const p=xyz(x,y,z);return p.d>=near?project(p):null;}
  function uprightBody(e){
    if(!e||e.isCar||e.stunned||e.ragdoll)return null;
    const lift=e.lift||0,low=at(e.x,e.y,.48+lift),high=at(e.x,e.y,1.49+lift);
    if(!low||!high)return null;
    const width=.38*f/((low.d+high.d)*.5);
    return {x:(low.x+high.x)*.5,r:width,top:high.y,bottom:low.y,depth:depth(e.x,e.y)};
  }
  function pedestrianOpacity(e,playerBody){
    if(!playerBody||e.self||e.isCar)return 1;
    const difference=playerBody.depth-depth(e.x,e.y);
    if(difference<=.1)return 1;
    const body=uprightBody(e);if(!body)return 1;
    const left=Math.max(playerBody.x-playerBody.r,body.x-body.r),right=Math.min(playerBody.x+playerBody.r,body.x+body.r);
    const width=Math.max(0,right-left)/(2*playerBody.r);
    const height=Math.max(0,Math.min(body.bottom,playerBody.bottom)-Math.max(body.top,playerBody.top))/(playerBody.bottom-playerBody.top);
    return 1-.70*clamp(width*height*2.8,0,1)*clamp((difference-.1)/.5,0,1);
  }
  function uprightSprite(e,base,top,height,time,angle,opacity){
    // Horizontal scale comes from camera depth. Shear maps the head and feet to their own
    // projected world centres when looking down on a pedestrian near the edge of the screen.
    const metresPerPixel=1.78/height,scaleX=metresPerPixel*f/((top.d+base.d)*.5);
    let ctx=g;
    if(opacity<.999){
      if(!foregroundLayer)foregroundLayer=makeCanvas(w,h);
      if(foregroundLayer.width!==w||foregroundLayer.height!==h){foregroundLayer.width=w;foregroundLayer.height=h;}
      ctx=foregroundLayer.getContext('2d');ctx.clearRect(0,0,w,h);
    }
    ctx.save();ctx.translate(base.x,base.y);ctx.transform(scaleX,0,(base.x-top.x)/height,1,0,0);
    if(!e.appearance||!drawKikalmoPuppet(ctx,e,0,0,height,time,angle))drawCanvasPuppet(ctx,e,0,0,height,time,angle);
    ctx.restore();
    if(ctx!==g){
      // Fade the completed sprite once. Applying alpha per limb lets the hidden back arms and lining show through.
      g.save();g.globalAlpha=opacity;g.drawImage(foregroundLayer,0,0);g.restore();
    }
  }
  function projectPoly(points){
    const input=points.map(o=>xyz(o[0],o[1],o[2])),clipped=[];
    let a=input[input.length-1];
    for(const b of input){
      if((a.d>=near)!==(b.d>=near)){const t=(near-a.d)/(b.d-a.d);clipped.push({s:mix(a.s,b.s,t),v:mix(a.v,b.v,t),d:near});}
      if(b.d>=near)clipped.push(b);a=b;
    }
    if(clipped.length<3)return null;const pp=clipped.map(project);
    if(pp.every(q=>q.x<-.8)||pp.every(q=>q.x>w+1)||pp.every(q=>q.y<-.8)||pp.every(q=>q.y>h+1))return null;
    return pp;
  }
  function fillPath(points,color,stroke=null){
    if(!points?.length)return;
    g.beginPath();g.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)g.lineTo(points[i].x,points[i].y);
    g.closePath();g.fillStyle=color;g.fill();
    if(stroke){g.strokeStyle=stroke;g.lineWidth=.7;g.stroke();}
  }
  function poly3(points,color,stroke){fillPath(projectPoly(points),color,stroke);}
  function depth(x,y){return (x-camX)*fx+(y-camY)*fy;}
  function seen(b,r=650){
    const dx=b.x-camX,dy=b.y-camY,d=dx*fx+dy*fy;
    return d>=-b.r&&d<r+b.r&&Math.abs(-dx*fy+dy*fx)<=Math.max(0,d)*sideLimit+b.r*2.0;
  }
  function roadRibbon(seg,extra,color,offset=0,a=seg.a,b=seg.b){
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(len>18){
      const parts=Math.ceil(len/18);let p=a;
      for(let j=1;j<=parts;j++){const q=[mix(a[0],b[0],j/parts),mix(a[1],b[1],j/parts)];roadRibbon(seg,extra,color,offset,p,q);p=q;}
      return;
    }
    const rad=Math.max(.035,seg.w*.5+extra),l=offset-rad,r=offset+rad,{nx,ny}=seg;
    poly3([[a[0]+nx*l,a[1]+ny*l,0],[b[0]+nx*l,b[1]+ny*l,0],[b[0]+nx*r,b[1]+ny*r,0],[a[0]+nx*r,a[1]+ny*r,0]],color);
  }
  function ellipseGround(x,y,r,z,color){
    const points=[];for(let i=0;i<72;i++){const a=i/72*tau;points.push([x+Math.cos(a)*r,y+Math.sin(a)*r,z]);}
    poly3(points,color);
  }
  function sky(yaw,time){
    const a=clamp(horizon/h,0,1),grad=g.createLinearGradient(0,0,0,Math.max(h*.75,1));
    grad.addColorStop(0,'#8493b4');grad.addColorStop(.44,'#e1b6bf');grad.addColorStop(.79,'#f9cead');grad.addColorStop(1,'#f2c3a1');g.fillStyle=grad;g.fillRect(0,0,w,h);
    // Clouds are a continuous panoramic band so they pan with the world.
    const cloudSpan=w*3.7;for(let i=0;i<45;i++){
      const u=((i*.618034+.17-yaw/tau)%1+1)%1,x=(u-.5)*cloudSpan+w*.5;
      const sz=22+(i*17%54),y=horizon-h*(.05+.19*((i*127%71)/71));
      if(x<-sz*2||x>w+sz)continue;
      g.fillStyle=i%2?'rgba(255,222,195,.4)':'rgba(240,208,209,.45)';
      g.beginPath();g.ellipse(x,y,sz,sz*.09,0,0,tau);g.ellipse(x+sz*.18,y-sz*.08,sz*.34,sz*.115,0,0,tau);g.ellipse(x-sz*.22,y-sz*.055,sz*.26,sz*.09,0,0,tau);g.fill();
    }
    const ground=g.createLinearGradient(0,horizon,0,h);ground.addColorStop(0,'#c6ae96');ground.addColorStop(.15,'#b7a49a');ground.addColorStop(1,'#a9948d');g.fillStyle=ground;g.fillRect(0,horizon,w,h-horizon);
  }
  function texturedFace(pic,world){
    // Clip UVs in camera space. This keeps the stone courses continuous when a wall crosses the camera.
    let poly=world.map(p=>({...xyz(p[0],p[1],p[2]),u:p[3],vv:p[4]}));
    for(const plane of [p=>p.d-near,p=>p.s+p.d*w/(2*f),p=>p.d*w/(2*f)-p.s,p=>p.v+p.d*h/(2*f),p=>p.d*h/(2*f)-p.v]){
      if(!poly.length)return;
      const out=[];let a=poly[poly.length-1],da=plane(a);
      for(const b of poly){
        const db=plane(b);
        if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({s:mix(a.s,b.s,t),v:mix(a.v,b.v,t),d:mix(a.d,b.d,t),u:mix(a.u,b.u,t),vv:mix(a.vv,b.vv,t)});}
        if(db>=0)out.push(b);a=b;da=db;
      }
      poly=out;
    }
    if(poly.length<3)return;
    const scr=poly.map(q=>({...project(q),u:q.u,v:q.vv}));
    const a=scr[0];
    for(let j=1;j<scr.length-1;j++){
      const b=scr[j],c=scr[j+1],bu=b.u-a.u,bv=b.v-a.v,cu=c.u-a.u,cv=c.v-a.v;
      const det=bu*cv-bv*cu;if(Math.abs(det)<.001)continue;
      const x1=b.x-a.x,x2=c.x-a.x,y1=b.y-a.y,y2=c.y-a.y;
      const A=(x1*cv-x2*bv)/det,B=(y1*cv-y2*bv)/det,C=(x2*bu-x1*cu)/det,D=(y2*bu-y1*cu)/det;
      const mx=(a.x+b.x+c.x)/3,my=(a.y+b.y+c.y)/3;
      g.save();g.beginPath();for(const [i,pt] of [a,b,c].entries()){const vx=pt.x-mx,vy=pt.y-my,len=Math.hypot(vx,vy)||1;g[i?'lineTo':'moveTo'](pt.x+.35*vx/len,pt.y+.35*vy/len);}g.closePath();g.clip();
      g.transform(A,B,C,D,a.x-A*a.u-C*a.v,a.y-B*a.u-D*a.v);
      g.drawImage(pic,0,0);g.restore();
    }
  }
  function arcFront(m){
    const ct=Math.cos(m.yaw),st=Math.sin(m.yaw),signZ=Math.sign((camX-m.x)*st+(camY-m.y)*ct)||-1;
    const zz=signZ*(m.depth+.14),surf=(x,z,h)=>[m.x+x*ct+z*st,m.y-x*st+z*ct,h];
    const pic=illustratedArc(),d=depth(m.x+zz*st,m.y+zz*ct);
    const quads=[];
    for(let j=0;j<12;j++){
      const a=-m.side+m.side*2*j/12,b=-m.side+m.side*2*(j+1)/12;
      const q=[surf(a,zz,49.1),surf(b,zz,49.1),surf(b,zz,0),surf(a,zz,0)].map(pt=>at(...pt));if(q.some(p=>!p))continue;
      quads.push({q,j});
    }
    if(!quads.length)return;
    queue.push({base:projectionBase,z:d-Math.abs(m.side*(ct*fx-st*fy))-1.3,draw:()=>{
      for(const {q,j} of quads){
        const a=q[0],b=q[1],c=q[2],d=q[3];
        g.save();g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.closePath();g.clip();
        const strip=pic.width/12;
        g.transform((b.x-a.x)/strip,(b.y-a.y)/strip,(d.x-a.x)/pic.height,((d.y-a.y)+(c.y-b.y))/(2*pic.height),a.x,a.y);
        g.drawImage(pic,j*strip,0,strip,pic.height,0,0,strip+.03,pic.height);g.restore();
      }
    }});
    const flag=surf(11,-.2,49.5),pole=surf(11,-.2,53.8),pp0=at(...flag),pp1=at(...pole);
    if(pp0&&pp1)queue.push({base:projectionBase,z:d-5,draw:()=>{
      g.strokeStyle='#786e71';g.lineWidth=Math.max(.65,f/pp1.d*.11);g.beginPath();g.moveTo(pp0.x,pp0.y);g.lineTo(pp1.x,pp1.y);g.stroke();
      const scale=f/pp1.d;for(let j=0;j<3;j++){const offset=j*1.08,dy=Math.sin(j*1.4+clock*1.4)*.21;
        g.fillStyle=['#4d668c','#f5e8ca','#c5565a'][j];g.fillRect(pp1.x+scale*offset,pp1.y+scale*dy,scale*1.12,scale*1.65);}
    }});
  }
  function groundRelief(){
    const distances=[.2,4,10,20,35,56,83,120,170,240,330,440,600,820,1150],strips=12;
    let previous=null;
    for(let k=distances.length-1;k>=0;k--){
      const d=distances[k],row=[];
      for(let i=0;i<=strips;i++){
        const offset=(2*i/strips-1)*(d*sideLimit+3);
        const x=camX+fx*d-fy*offset,y=camY+fy*d+fx*offset;
        row.push([x,y,-.18]);
      }
      if(previous)for(let i=0;i<strips;i++){
        const a=row[i],b=row[i+1],c=previous[i+1],e=previous[i];
        const grade=(terrainHeight(c[0],c[1])-terrainHeight(b[0],b[1]))/(distances[k+1]-d);
        const haze=clamp(d/900,0,1),light=clamp(grade*.52,-.08,.09);
        poly3([a,b,c,e],tint('#b7a49a',.96+haze*.09+light));
      }
      previous=row;
    }
  }
  function groundTexture(){
    // Small marks are projected in fixed world space. They stay attached to the pavement as the camera orbits.
    const range=26,spacing=.52,gridX=Math.floor(camX/spacing),gridY=Math.floor(camY/spacing);
    for(let tone=0;tone<2;tone++){
      g.beginPath();
      for(let row=-range;row<=range;row++)for(let col=-range;col<=range;col++){
        const ix=gridX+col,iy=gridY+row,hash=((Math.imul(ix,2221)^Math.imul(iy,3571))>>>0);
        if((hash%8)!==tone)continue;
        const x=(ix+.18*(iy&1))*spacing,y=iy*spacing,pt=at(x,y,.01);
        if(!pt||pt.d<.48||pt.x<-5||pt.x>w+5||pt.y<horizon||pt.y>h+7)continue;
        const sx=clamp(f/pt.d*.042,.45,5.5),sy=clamp(sx*.30,.29,1.8);
        g.moveTo(pt.x-sx,pt.y-sy);g.lineTo(pt.x,pt.y+sy);g.lineTo(pt.x+sx,pt.y-sy);
      }
      g.lineWidth=.9;g.strokeStyle=tone?'rgba(255,228,201,.19)':'rgba(76,63,77,.17)';g.stroke();
    }
  }
  function hiddenByFacade(pp){
    // Scan-convert a conservative depth mask in screen columns. Farther façades behind a closer street wall never need texturing.
    const step=9,minX=Math.max(0,Math.min(...pp.map(q=>q.x))),maxX=Math.min(w,Math.max(...pp.map(q=>q.x)));
    const lo=Math.max(0,Math.floor(minX/step)),hi=Math.ceil(maxX/step),isWide=maxX-minX>step*1.3;
    let visible=false;
    for(let col=lo;col<=hi;col++){
      const x=clamp((col+.5)*step,minX+.01,maxX-.01);let top=Infinity,bottom=-Infinity;
      for(let i=0;i<pp.length;i++){
        const a=pp[i],b=pp[(i+1)%pp.length],dx=b.x-a.x;
        if(Math.abs(dx)<.001||x<Math.min(a.x,b.x)||x>Math.max(a.x,b.x))continue;
        const y=a.y+(b.y-a.y)*(x-a.x)/dx;top=Math.min(top,y);bottom=Math.max(bottom,y);
      }
      if(bottom<=top)continue;
      const mask=occlusion[col];
      if(!mask||top<mask.top-1.4||bottom>mask.bottom+1.4)visible=true;
      if(!isWide||col*step<minX||(col+1)*step>maxX)continue;
      if(!mask)occlusion[col]={top:top+2,bottom:bottom-2};
      else if(top<=mask.bottom&&bottom>=mask.top){mask.top=Math.min(mask.top,top+2);mask.bottom=Math.max(mask.bottom,bottom-2);}
    }
    return !visible;
  }
  function building(item){
    const {o,wind,seed,bounds}=item,poly=o.poly,H=Math.max(2.2,o.h||13),glass=H>43;
    const eave=glass?H-.7:H>7.5?H-Math.min(3.25,H*.15):H-.65;
    const distance=Math.hypot(bounds.x-camX,bounds.y-camY);
    const top=poly.map(q=>[q[0]+(bounds.x-q[0])*.032,q[1]+(bounds.y-q[1])*.032,H]);
    for(let j=0;j<poly.length;j++){
      const a=poly[j],b=poly[(j+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
      if(length<.35)continue;
      const normalX=wind*dy/length,normalY=-wind*dx/length;
      if(normalX*(camX-a[0])+normalY*(camY-a[1])<0)continue;
      const d=depth((a[0]+b[0])*.5,(a[1]+b[1])*.5),shade=normalX*-.45+normalY*-.6>-.09?1:0;
      const pts=[[a[0],a[1],Math.min(0,terrainHeight(a[0],a[1])-item.ground)-.12],[b[0],b[1],Math.min(0,terrainHeight(b[0],b[1])-item.ground)-.12],[b[0],b[1],eave],[a[0],a[1],eave]];
      const pp=projectPoly(pts);if(!pp||hiddenByFacade(pp))continue;
      queue.push({z:d,base:item.ground,draw:()=>{
        fillPath(pp,glass?shade?'#91a3a8':'#798f9c':tint(stone[seed%8],shade?1.00:.85));
        const topA=top[j],topB=top[(j+1)%top.length];
        poly3([[a[0],a[1],eave],[b[0],b[1],eave],topB,topA],glass?'#acb8b5':roofs[seed%roofs.length]);
        if(d>620||length<1.8)return;
        const bays=clamp(Math.round(length/6.6),1,40),count=d>85?Math.min(3,Math.ceil(bays/4)):Math.min(16,bays),floors=clamp(Math.round((eave-3)/3.2),1,10),pic=repeatFacade(facade(seed,floors,shade,glass),clamp(Math.round(bays/count),1,10));
        for(let k=0;k<count;k++){
          let aa=k/count,bb=(k+1)/count;
          if(d<34){
            const x1=a[0]+dx*aa,z1=a[1]+dy*aa,x2=a[0]+dx*bb,z2=a[1]+dy*bb;
            const rows=clamp(Math.ceil(eave/4),2,9);
            for(let r=0;r<rows;r++){
              const t=r/rows,u=(r+1)/rows,y0=eave*(1-t),y1=eave*(1-u);
              texturedFace(pic,[[x1,z1,y0,0,pic.height*t],[x2,z2,y0,pic.width,pic.height*t],[x2,z2,y1,pic.width,pic.height*u],[x1,z1,y1,0,pic.height*u]]);
            }
            continue;
          }
          // Crop the strip to the camera near plane before projection when brushing a shopfront.
          const da=Math.min(xyz(a[0]+dx*aa,a[1]+dy*aa,eave).d,xyz(a[0]+dx*aa,a[1]+dy*aa,0).d);
          const db=Math.min(xyz(a[0]+dx*bb,a[1]+dy*bb,eave).d,xyz(a[0]+dx*bb,a[1]+dy*bb,0).d);
          if(da<=near+.02&&db<=near+.02)continue;
          if(da<=near+.02)aa=mix(aa,bb,(near+.04-da)/(db-da));
          else if(db<=near+.02)bb=mix(aa,bb,(near+.04-da)/(db-da));
          const ax=a[0]+dx*aa,ay=a[1]+dy*aa,bx=a[0]+dx*bb,by=a[1]+dy*bb;
          const p1=at(ax,ay,eave),p2=at(bx,by,eave),p3=at(bx,by,0),p4=at(ax,ay,0);
          if(!p1||!p2||!p3||!p4)continue;
          if([p1,p2,p3,p4].every(pt=>pt.x<0)||[p1,p2,p3,p4].every(pt=>pt.x>w))continue;
          const width=p2.x-p1.x;if(Math.abs(width)<.7)continue;
          const stripHeight=Math.max(0,p4.y-p1.y);
          g.save();
          if(d<45||Math.abs((p3.y-p2.y)-stripHeight)>2.5){g.beginPath();g.moveTo(p1.x,p1.y);g.lineTo(p2.x,p2.y);g.lineTo(p3.x,p3.y);g.lineTo(p4.x,p4.y);g.closePath();g.clip();}
          g.transform(width/pic.width,(p2.y-p1.y)/pic.width,(p4.x-p1.x)/pic.height,(stripHeight+(p3.y-p2.y))*.5/pic.height,p1.x,p1.y);
          g.drawImage(pic,0,0);g.restore();
        }
      }});
    }
    const rooftop=projectPoly(top);if(rooftop&&H+item.ground<camH)queue.push({z:depth(bounds.x,bounds.y),draw:()=>fillPath(rooftop,roofs[seed%roofs.length])});
  }
  function showProp(o){
    if(terracePanels[o.type]){
      projectionBase=terrainHeight(o.x,o.y);
      const c=Math.cos(o.angle),s=Math.sin(o.angle),cx=camX-o.x,cy=camY-o.y;
      for(const {normal:[nx,ny],points,color} of terracePanels[o.type]){
        if((nx||ny)&&nx*(c*cx+s*cy)+ny*(-s*cx+c*cy)<(nx?o.halfLength:o.halfWidth))continue;
        const vertices=points.map(([along,h,across])=>[o.x+c*along-s*across,o.y+s*along+c*across,h]);
        const plane=projectPoly(vertices);if(!plane)continue;
        const depths=vertices.map(([x,y])=>depth(x,y));
        const z=nx||ny?(Math.min(...depths)+Math.max(...depths))/2:depth(o.x,o.y)+o.r+.2;
        queue.push({z,draw:()=>fillPath(plane,color)});
        terraceFaces.push({plane,color,top:projectionBase+o.h,z,left:Math.min(...plane.map(v=>v.x)),right:Math.max(...plane.map(v=>v.x)),bottom:Math.max(...plane.map(v=>v.y)),upper:Math.min(...plane.map(v=>v.y))});
      }
      projectionBase=null;return;
    }
    const base=at(o.x,o.y,0),height=o.type==='tree'?Math.max(4.7,o.h):o.h||1;
    if(!base||base.d>295)return;const top=at(o.x,o.y,height);if(!top)return;
    const ph=base.y-top.y;if(ph<2||base.x<-ph||base.x>w+ph)return;
    const s=Math.abs(Math.floor(o.x*7+o.y*3)),pic=propImage(o.type,s);
    queue.push({z:base.d,draw:()=>{
      const width=(o.type==='bench'?1.8:height*.745)*f/base.d;
      g.drawImage(pic,base.x-width/2,base.y-ph,width,ph);
    }});
  }
  const pickupVisibility=new Map();
  function coverBehindTerrace(e,base,top,height) {
    if(!terraceFaces.length)return;
    const foot=terrainHeight(e.x,e.y)+(e.lift||0),width=height*(e.isCar?1.8:.67),left=base.x-width,right=base.x+width,cut=base.d-.08;
    for(const face of terraceFaces){
      if(foot>=face.top-.05||right<face.left||left>face.right||top.y>face.bottom||base.y+2<face.upper)continue;
      const clipped=[];let a=face.plane.at(-1);
      for(const b of face.plane){
        if((a.d<cut)!==(b.d<cut)){
          // Perspective-correct interpolation of inverse depth on a projected edge.
          const t=(1/cut-1/a.d)/(1/b.d-1/a.d);
          clipped.push({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t)});
        }
        if(b.d<cut)clipped.push(b);a=b;
      }
      if(clipped.length<3)continue;
      g.save();g.beginPath();g.rect(left,top.y-2,2*width,height+5);g.clip();fillPath(clipped,face.color);g.restore();
    }
  }
  function pickupClear(id,x,y,height,reach,time,destroyed){
    const cached=pickupVisibility.get(id),revision=destroyed?.size||0;
    if(cached&&revision===cached.revision&&time-cached.time<.21&&Math.hypot(camX-cached.x,camY-cached.y)<.35&&Math.abs(camH-cached.h)<.12)return cached.clear;
    const clear=reach<=1.65||cameraDistance(camX,camY,camH-terrainHeight(camX,camY),Math.atan2(y-camY,x-camX),reach,height,destroyed)>=reach-.75;
    if(pickupVisibility.size>128)pickupVisibility.clear();
    pickupVisibility.set(id,{x:camX,y:camY,h:camH,clear,time,revision});
    return clear;
  }
  function queuePickup(p,time,destroyed){
    const style=pickupStyle(p.weapon);
    if(!style||!Number.isFinite(p.x+p.y)||!seen({x:p.x,y:p.y,r:1.25},pickupRange))return;
    const reach=Math.hypot(p.x-camX,p.y-camY);if(reach>pickupRange||reach<.43)return;
    const phase=pickupPhase(p.id),height=pickupLift(time,phase);
    const base=at(p.x,p.y,.11),icon=at(p.x,p.y,height),body=at(p.x,p.y,.23),cap=at(p.x,p.y,.45);
    if(!base||!icon||!body||!cap)return;
    if(!pickupClear(p.id,p.x,p.y,height,reach,time,destroyed))return;
    const unit=f/base.d,art=pickupPatch(p.weapon),iconWidth=pickupMarkerWidth*f/icon.d;
    if(icon.x+iconWidth*.55<0||icon.x-iconWidth*.55>w||base.y<0||icon.y-iconWidth*.42>h)return;
    queue.push({z:depth(p.x,p.y),draw:()=>{
      const pulse=1+.065*Math.sin(time*2.36+phase),radius=.735*unit*pulse;
      const ellipse=(x,y,rx,ry,col)=>{g.beginPath();g.ellipse(x,y,Math.max(.45,rx),Math.max(.32,ry),0,0,tau);g.fillStyle=col;g.fill();};
      const perspective=clamp((camH-terrainHeight(p.x,p.y))/reach,.045,.81);
      ellipse(base.x,base.y,radius+unit*.08,radius*perspective+unit*.055,'rgba(55,40,57,.40)');
      g.beginPath();g.ellipse(base.x,base.y,radius,Math.max(.65,radius*perspective),0,0,tau);g.lineWidth=Math.max(.85,unit*.047);g.strokeStyle=style.accent;g.stroke();
      const rx=.52*unit,ry=Math.max(.65,rx*perspective);
      ellipse(base.x,base.y,rx,ry,'#99765f');
      g.fillStyle=style.thread;g.fillRect(body.x-unit*.434,cap.y,unit*.868,Math.max(1,base.y-cap.y));
      for(let i=1;i<=3;i++){const yy=cap.y+(base.y-cap.y)*i/4;ellipse(body.x,yy,unit*.43,Math.max(.65,ry*.33),i===2?style.accent:style.thread);}
      ellipse(cap.x,cap.y,rx,ry,'#b99a78');
      ellipse(cap.x,cap.y-.05*unit,rx*.84,ry*.78,'#dfbd93');
      g.drawImage(art,icon.x-iconWidth*.5,icon.y-iconWidth*.4,iconWidth,iconWidth*.8);
    }});
  }
  function effect(kind,x,y,angle=0,len=0,colors=[],lift=0){if(effects.length>60)effects.shift();effects.push({kind,x,y,angle,len,lift,born:clock,fibers:kind==='meleeImpact'?impactFibers(angle,len):null});}
  function render(state,dt,time){
    if(!running)return;clock=time;
    if(time-last<1/32&&!state.snap&&drawn)return;const frameDt=Math.min(.1,time-last);last=time;drawn=true;
    const width=canvas.clientWidth||window.innerWidth,height=canvas.clientHeight||window.innerHeight;
    if(!width||!height)return;
    const scale=Math.min(1,Math.min(960/width,735/height));
    if(surface.width!==Math.round(width*scale)||surface.height!==Math.round(height*scale)){
      surface.width=Math.round(width*scale);surface.height=Math.round(height*scale);
    }
    w=surface.width;h=surface.height;f=.5*h/Math.tan((w<h?68:58)*Math.PI/360);
    const {p,yaw,pitch=0,car,destroyed}=state,snap=state.snap||!Number.isFinite(followX)||Math.hypot(followX-p.x,followY-p.y)>25;
    const blend=snap?1:1-Math.exp(-(car?11:19)*frameDt);
    followX+=(p.x-followX)*blend;followY+=(p.y-followY)*blend;
    const model=car?vehicleSpec(car.type):null;
    fx=Math.cos(yaw);fy=Math.sin(yaw);const goal=car?8.15+Math.max(0,model.halfLength-2)*1.24+Math.min(2.25,Math.abs(state.speed||0)*.065):5.25;
    const lift=car?0:p.lift||0,focus=lift+(car?Math.max(1.35,model.height*.77):1.17),wantedH=lift+(car?Math.max(2.92,model.height+1.05):2.18)+pitch*2.8;
    const ground=terrainHeight(followX,followY),backGround=terrainHeight(followX-fx*goal,followY-fy*goal),look=car?6.3:4.15;
    const dist=clamp(cameraDistance(followX,followY,focus,yaw+Math.PI,goal,wantedH,destroyed),.3,goal);
    arm=snap?dist:Math.min(dist,arm+(dist-arm)*(1-Math.exp(-6*frameDt)));
    camX=followX-fx*arm;camY=followY-fy*arm;camH=ground+focus+(backGround-ground+wantedH-focus)*arm/goal+.12;
    const tilt=Math.atan2(terrainHeight(followX+fx*look,followY+fy*look)+focus+pitch*.95-camH,arm+look);
    sin=Math.sin(tilt);cos=Math.cos(tilt);horizon=h*.5+f*Math.tan(tilt);sideLimit=w/(2*f)+.1;
    if(Math.hypot(cacheX-p.x,cacheY-p.y)>35){
      cacheX=p.x;cacheY=p.y;nearBuildings=spatial.blocks.around(p.x,p.y,560);nearWays=spatial.ways.around(p.x,p.y,490);
    }
    if(snap||time-lastProps>.42){props=nearbyProps(p.x,p.y,370);lastProps=time;}
    const oldG=g,version=(destroyed?.size||0),refresh=!background||background.width!==w||background.height!==h||snap||
      Math.hypot(camX-backX,camY-backY)>.035||Math.abs(camH-backHeight)>.02||Math.abs(yaw-backYaw)>.0015||Math.abs(tilt-backPitch)>.0015||version!==backVersion||props.length!==backPropCount;
    queue.length=0;
    if(refresh){
    if(!background)background=makeCanvas(w,h);
    if(background.width!==w||background.height!==h){background.width=w;background.height=h;}
    g=background.getContext('2d',{alpha:false});backX=camX;backY=camY;backHeight=camH;backYaw=yaw;backPitch=tilt;backVersion=version;backPropCount=props.length;
    sky(yaw,time);groundRelief();
    for(const {a,bounds} of parks)if(seen(bounds,470))poly3(a.poly.map(q=>[q[0],q[1],0]),'#a4aa8c');
    for(const {a,bounds,level} of waters)if(a.poly.length>=3&&seen(bounds,1000)){
      projectionBase=level;poly3(a.poly.map(q=>[q[0],q[1],0]),'#679b9e');projectionBase=null;
    }
    const visibleWays=nearWays.filter(s=>seen(s.bounds,230));
    const arc=monuments.arc;
    if(Math.hypot(arc.x-p.x,arc.y-p.y)<450)ellipseGround(arc.x,arc.y,115,0,'#7a717c');
    for(const s of visibleWays)roadRibbon(s,1.35,'#beaea2');
    for(const s of visibleWays)roadRibbon(s,0,s.w>7?'#706c77':'#827d81');
    for(const s of visibleWays){
      if(s.w<5.0||s.len<6||!seen(s.bounds,135))continue;
      for(let d=2;d+1<s.len;d+=9){
        const f0=d/s.len,f1=Math.min(1,(d+2.5)/s.len),dx=s.b[0]-s.a[0],dy=s.b[1]-s.a[1];
        roadRibbon(s,-s.w*.5+.076,'#dbc9ac',0,[s.a[0]+dx*f0,s.a[1]+dy*f0],[s.a[0]+dx*f1,s.a[1]+dy*f1]);}
    }
    if(Math.hypot(arc.x-p.x,arc.y-p.y)<450)ellipseGround(arc.x,arc.y,35.2,.025,'#c4b5a6');
    occlusion.length=0;
    const facadeSet=nearBuildings.filter(item=>seen(item.bounds,440)).sort((a,b)=>depth(a.bounds.x,a.bounds.y)-depth(b.bounds.x,b.bounds.y));
    for(const item of facadeSet){projectionBase=item.ground;building(item);}
    projectionBase=null;
    groundTexture();
    for(const obj of monumentModels){
      const reach=obj.m.range||2300,md=depth(obj.m.x,obj.m.y);
      if(Math.hypot(obj.m.x-camX,obj.m.y-camY)>reach||!seen({x:obj.m.x,y:obj.m.y,r:110},reach))continue;
      projectionBase=terrainHeight(obj.m.x,obj.m.y);
      for(const face of obj.faces){
        if(face.line){
          const pp=at(...face.p[0]),qq=at(...face.p[1]);if(!pp||!qq||
            Math.max(pp.x,qq.x)<0||Math.min(pp.x,qq.x)>w||Math.max(pp.y,qq.y)<0||Math.min(pp.y,qq.y)>h)continue;
          const lineWidth=f*face.line/Math.max(2,(pp.d+qq.d)*.5);if(lineWidth<.37)continue;
          queue.push({z:depth(face.x,face.y),draw:()=>{g.strokeStyle=face.color;g.lineWidth=Math.min(45,Math.max(.65,lineWidth));g.beginPath();g.moveTo(pp.x,pp.y);g.lineTo(qq.x,qq.y);g.stroke();}});
          continue;
        }
        const pp=projectPoly(face.p);if(pp)queue.push({z:depth(face.x,face.y),draw:()=>fillPath(pp,face.color)});}
      if(obj.m.id==='arc')arcFront(obj.m);
      projectionBase=null;
    }
    terraceFaces.length=0;
    for(const o of props)if(!destroyed?.has(o.id))showProp(o);
    terraceFaces.sort((a,b)=>b.z-a.z);
    queue.sort((a,b)=>b.z-a.z);for(const q of queue){projectionBase=q.base??null;q.draw();}
    projectionBase=null;
    g=oldG;
    }
    g.drawImage(background,0,0);queue.length=0;
    for(const pickup of state.pickups||[])queuePickup(pickup,time,destroyed);
    const playerBody=uprightBody(state.entities.find(e=>e.self));
    for(const e of state.entities){
      const lift=e.lift||0,base=at(e.x,e.y,lift),high=e.isCar?vehicleSpec(e.type).height:1.78,top=at(e.x,e.y,lift+high);
      if(!base||!top||base.d>(e.isCar?160:96)||base.d<.61)continue;
      const ph=base.y-top.y;if(ph<2||base.x<-ph*2||base.x>w+ph*2)continue;
      // Collinear urban façades can hide traffic even though the shared simulation still runs behind them.
      if(!e.self&&base.d>4){const d=Math.hypot(e.x-camX,e.y-camY);if(cameraDistance(camX,camY,camH-terrainHeight(camX,camY),Math.atan2(e.y-camY,e.x-camX),d,lift+high*.78,destroyed)<d-1.5)continue;}
      queue.push({z:depth(e.x,e.y)-.09,draw:()=>{
        const wid=ph*(e.isCar?.77:.27);
        const floor=e.supportHeight||0,shadow=at(e.x,e.y,floor),shadowScale=1/(1+Math.max(0,lift-floor)*.08);
        if(shadow){g.fillStyle='rgba(62,49,64,.25)';g.beginPath();g.ellipse(shadow.x,shadow.y-1,Math.max(1,wid*shadowScale),Math.max(1,wid*.2*shadowScale),0,0,tau);g.fill();}
        const theta=Math.atan2(e.y-camY,e.x-camX)-(e.angle||0);
        if(e.isCar){
          const slope=terrainGradient(e.x,e.y);
          g.save();g.translate(base.x,base.y);g.rotate(-Math.atan(-fy*slope.x+fx*slope.y));drawCanvasCar(g,e,0,0,ph,time,theta);g.restore();
        }
        else{
          const pose=walkingPose(e);
          uprightSprite(pose,base,top,ph,time,theta,pedestrianOpacity(e,playerBody));
        }
        coverBehindTerrace(e,base,top,ph);
        if(e.bubble||e.peer&&base.d<45){
          const label=String(e.bubble||e.name||'').slice(0,26);g.font=(e.bubble?'19px':'600 11px')+' sans-serif';
          const ww=g.measureText(label).width+12,yy=top.y-(e.isCar?10:6);
          g.fillStyle='#3c3448';g.fillRect(top.x-ww/2,yy-18,ww,18);g.fillStyle='#ffe7ce';g.textAlign='center';g.fillText(label,top.x,yy-5);g.textAlign='start';
        }
      }});
    }
    queue.sort((a,b)=>b.z-a.z);for(const o of queue)o.draw();
    for(let i=effects.length-1;i>=0;i--){const e=effects[i],age=time-e.born;
      const duration=e.fibers?fiberLifetime:e.kind==='burst'?.55:effectDuration(e.kind);
      if(age>duration){effects.splice(i,1);continue;}
      if(e.fibers){
        const height=terrainHeight(e.x,e.y)+e.lift;
        g.save();g.globalAlpha=Math.min(1,(duration-age)*10);g.lineCap='round';g.lineJoin='round';
        for(const strand of e.fibers){
          const [vx,vy,vz]=strand.velocity;
          const projected=strand.points.map(([dx,dy,dz])=>{
            const x=e.x+dx+vx*age,z=e.y+dz+vz*age;
            return at(x,z,height-terrainHeight(x,z)+dy+vy*age-3.5*age*age);
          });
          if(!projected.every(Boolean))continue;
          g.lineWidth=clamp(.033*f/projected[0].d,.8,6);g.strokeStyle=strand.color;
          g.beginPath();g.moveTo(projected[0].x,projected[0].y);
          g.quadraticCurveTo(projected[1].x,projected[1].y,projected[2].x,projected[2].y);g.stroke();
        }
        g.restore();
      }else if(e.kind==='burst'){
        const pp=at(e.x,e.y,.93+e.lift);if(!pp)continue;
        for(let j=0;j<8;j++){const v=j*2.39+age;g.fillStyle=j%2?'#f0c891':'#94b5a6';g.fillRect(pp.x+Math.cos(v)*age*80,pp.y+Math.sin(v)*age*80,3,3);}
      }else{
        for(const stroke of buildShotEffect(e.kind,e.x,e.y,e.angle,e.len,age/duration)){
          g.beginPath();g.strokeStyle=stroke.color;g.lineWidth=stroke.width;let pen=false;
          for(const vertex of stroke.points){const pt=at(vertex.x,vertex.y,vertex.z+e.lift+terrainHeight(e.x,e.y)-terrainHeight(vertex.x,vertex.y));if(!pt){pen=false;continue;}if(pen)g.lineTo(pt.x,pt.y);else g.moveTo(pt.x,pt.y);pen=true;}
          g.stroke();
        }
      }
    }
  }
  function projectTarget(x,y,elevation=1){
    if(!running||!drawn||!w||!h||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(elevation))return null;
    const pixel=at(x,y,elevation);
    if(!pixel||pixel.d>6300||pixel.x<0||pixel.x>w||pixel.y<0||pixel.y>h)return null;
    return {x:pixel.x/w,y:pixel.y/h,depth:pixel.d};
  }
  function aim(clientX,clientY,p){
    const b=canvas.getBoundingClientRect();if(!w||!b.width||!b.height)return null;
    const s=((clientX-b.left)/b.width*w-w*.5)/f,v=(h*.5-(clientY-b.top)/b.height*h)/f;
    const height=v*cos+sin,forward=cos-v*sin,dx=fx*forward-fy*s,dy=fy*forward+fx*s;
    const d=(terrainHeight(p.x,p.y)+(p.lift||0)+.87-camH)/height;
    return d>0&&d<180?Math.atan2(camY+dy*d-p.y,camX+dx*d-p.x):Math.atan2(dy,dx);
  }
  return {available:true,mode:'canvas',render,aim,projectTarget,effect,dispose(){running=false;effects.length=0;if(surface!==canvas)surface.remove();}};
}
