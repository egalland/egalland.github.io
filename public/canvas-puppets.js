import {chassisStage} from './vehicle-damage.js';
import {yarnPalette,paintKnit} from './wool-art.js';
import {puppetAppearance} from './puppet-dyes.js';
import {motionSeed,posedLimb,sampleLocomotion} from './locomotion-pose.js';
import { drawStreetVehicle, isStreetVehicle } from './street-vehicles.js';
import { vehicleSpec } from './vehicle-types.js';
import {bodyFabric as carColors,serviceFabric as carFleet,fleetFabric as trim} from './vehicle-fabric.js';
// Painterly silhouettes for the software-rendered chase camera. All distances in
// these drawings are local to the puppet, so silhouettes stay stable at any zoom.
const outline=yarnPalette.ink, gold='#e9ba69', ivory='#fbe3b5';
const paths=new Map();
const textiles=new WeakMap();
function shape(ctx,description,fill,stroke=outline,width=1.55,woven=false){
  let p=paths.get(description);if(!p){p=new Path2D(description);paths.set(description,p);}
  if(fill){ctx.fillStyle=fill;ctx.fill(p);}
  if(woven){const pattern=cloth(ctx);if(pattern){ctx.fillStyle=pattern;ctx.fill(p);}}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}
}
function cloth(c){
  if(!c.createPattern)return null;
  if(textiles.has(c))return textiles.get(c);
  const tile=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(24,24):
    (typeof document!=='undefined'?document.createElement('canvas'):null);
  if(!tile){textiles.set(c,null);return null;}
  tile.width=tile.height=24;
  paintKnit(tile.getContext('2d'),0,0,24,24,{step:4,opacity:.52,seed:12});
  const result=c.createPattern(tile,'repeat');textiles.set(c,result);return result;
}
function bead(c,x,y,rx,ry,fill,edge=outline,width=1.3,angle=0){
  c.beginPath();c.ellipse(x,y,Math.max(.12,rx),Math.max(.12,ry),angle,0,Math.PI*2);
  c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function hose(c,a,b,d,width,color){
  c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...b,...d);c.lineCap='round';c.lineWidth=width+2.3;c.strokeStyle=outline;c.stroke();c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function stitch(c,points,width,color){
  c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
}
function hash(value){let n=0;for(const c of String(value??''))n=(n*31+c.charCodeAt(0))>>>0;return n;}
const patches=new Map();
// Paint fixed felt panels once at close-up resolution. The puppet carries the
// lighting, knitted loops and piping through every bone transform.
function panel(c,description,dye,bounds){
  if(!c.drawImage||typeof document==='undefined'){
    shape(c,description,dye,outline,1.65,true);return;
  }
  const key=description+dye;
  let image=patches.get(key);
  if(!image){
    const [x,y,w,h]=bounds,scale=3;
    image=document.createElement('canvas');image.width=Math.ceil(w*scale);image.height=Math.ceil(h*scale);
    const g=image.getContext('2d');
    g.scale(scale,scale);g.translate(-x,-y);g.lineJoin=g.lineCap='round';
    let path=paths.get(description);if(!path){path=new Path2D(description);paths.set(description,path);}
    g.save();g.clip(path);
    g.fillStyle=dye;g.fillRect(x,y,w,h);
    const down=g.createLinearGradient(x+w*.2,y,x+w*.84,y+h);
    down.addColorStop(0,'rgba(255,243,209,.55)');down.addColorStop(.33,'rgba(255,241,207,.13)');
    down.addColorStop(.58,'rgba(69,43,59,.035)');down.addColorStop(1,'rgba(65,44,62,.46)');
    g.fillStyle=down;g.fillRect(x,y,w,h);
    const light=g.createRadialGradient(x+w*.28,y+h*.23,0,x+w*.36,y+h*.38,w*.61);
    light.addColorStop(0,'rgba(255,239,202,.3)');light.addColorStop(.75,'rgba(255,239,202,0)');light.addColorStop(1,'rgba(56,42,56,.13)');
    g.fillStyle=light;g.fillRect(x,y,w,h);
    paintKnit(g,x,y,w,h,{step:3.8,opacity:.47,seed:43});
    g.strokeStyle='rgba(65,41,53,.22)';g.lineWidth=4;g.stroke(path);
    // The pale cord catches the same upper-left light around each padded panel.
    g.save();g.translate(.65,1.05);g.strokeStyle='rgba(254,236,199,.44)';g.lineWidth=1.12;g.stroke(path);g.restore();
    g.restore();g.strokeStyle=outline;g.lineWidth=1.55;g.stroke(path);
    patches.set(key,image);
  }
  c.drawImage(image,...bounds);
}
function ear(c,s,kind,furry,front,roll) {
  c.save();c.translate(s*13,-75);c.rotate(s*(.14+roll*.03));c.scale(s,1);
  if(kind==='rabbit'){
    panel(c,'M-4 5 Q-8 -12 -7 -26 Q-3 -34 1 -29 Q10 -15 7 3 Z',furry,[-10,-34,21,42]);
    if(front<.35)shape(c,'M-3 -1 Q-5 -14 -3 -22 Q3 -21 4 -3 Z','#d59793',null);
  } else if(kind==='bear'){
    bead(c,2,-2,8,9,furry);if(front<.4)bead(c,2,-2,4.8,5,'#ad897f',null);
  } else {
    panel(c,'M-7 6 Q-4 -8 5 -23 Q11 -21 11 4 Z',furry,[-9,-26,23,35]);
    shape(c,'M2 -17 L5 -23 Q8 -24 9 -17 L9 -13 Z','#644545',null);
    if(front<.55)shape(c,'M-1 -1 L5 -15 Q8 -12 7 -2 Z','#efd4ac',null);
  }
  c.restore();
}
function hat(c,type,rear,profile){
  if(type==='medic'){
    panel(c,'M-18 -73 Q-15 -89 0 -89 Q17 -88 20 -72 Q7 -77 -18 -73 Z','#ebdfc8',[-21,-91,44,22]);
    shape(c,'M-17 -77 Q-1 -81 17 -77 L19 -73 Q1 -76 -18 -73 Z','#4d807c',outline,.7,true);
    shape(c,'M-2 -86 H2 V-82 H6 V-78 H2 V-74 H-2 V-78 H-6 V-82 H-2 Z','#4f9d93',null);
  } else if(type==='firefighter'||type==='swat'){
    panel(c,'M-20 -73 Q-20 -90 -3 -92 Q15 -92 20 -76 L24 -73 Q14 -69 -21 -70 L-25 -72 Z',type==='swat'?'#565b69':'#d4a24f',[-27,-95,54,29]);
    stitch(c,[[-16,-76],[0,-78],[17,-76]],2.2,type==='swat'?'#7c8893':'#f6d282');
    if(type==='swat'){
      if(rear<.16){
        c.save();c.translate(profile*6,0);
        shape(c,'M-17 -70 Q-13 -75 0 -74 Q13 -75 17 -70 L14 -60 Q10 -57 4 -61 L0 -63 L-4 -61 Q-11 -57 -15 -61 Z','#6e8792',outline,1.35,true);
        stitch(c,[[-11,-69],[-3,-71],[5,-71]],1.1,'#d4d7c5');c.restore();
      }else stitch(c,[[-14,-72],[-7,-71],[8,-71],[15,-72]],1.4,'#606b76');
    }
  } else if(type==='police'){
    panel(c,'M-21 -77 L-17 -84 Q0 -94 17 -84 L21 -77 L13 -72 L-18 -73 Z','#456278',[-24,-93,48,25]);
    shape(c,'M-20 -75 Q0 -79 19 -76 L23 -72 Q11 -69 -17 -72 Z',outline,null);
    bead(c,3,-81,3,3.5,gold,null);
  }
}
const foxHead='M-26 -63 Q-25 -78 -9 -81 Q9 -86 22 -74 Q28 -67 24 -56 L30 -52 L22 -50 L25 -45 L16 -46 Q5 -37 -7 -40 Q-20 -42 -24 -50 L-30 -50 L-26 -56 L-30 -55 Z';
const roundHead='M-24 -61 Q-23 -76 -9 -81 Q8 -84 19 -75 Q26 -66 23 -53 Q21 -40 5 -39 Q-11 -38 -21 -46 Q-26 -53 -24 -61 Z';
function drawTail(c,coat,phase,rear,side){
  c.save();c.translate(rear<-.25?-11:0,-16);c.rotate(.13*Math.sin(phase-.65));c.scale(side,1);
  shape(c,'M-3 1 C-17 6 -24 3 -27 -3 C-31 -9 -31 -15 -38 -17 Q-42 -21 -42 -25 Q-35 -25 -29 -24 L-32 -31 Q-16 -28 -13 -16 C-11 -10 -5 -10 0 -12 C8 -6 6 -2 -3 1 Z',coat,outline,2,true);
  shape(c,'M-28 -19 Q-33 -18 -38 -17 Q-42 -21 -42 -25 Q-35 -25 -29 -24 L-32 -31 Q-23 -30 -19 -25 L-22 -20 L-24 -23 Z',ivory,null,0,true);
  stitch(c,[[-23,-14],[-20,-13],[-22,-17]],.8,'#d98d56');c.restore();
}
export function drawCanvasPuppet(c,o,x,groundY,height,time=0,viewAngle=0){
  if(!o||!Number.isFinite(height)||height<1)return;
  const t=Number(time)||0,role=o.local||o.player?'fox':o.type||'pedestrian';
  const {type,animal,pelt,coat:dress,trim,service}=puppetAppearance(role,o.color,o.id!=null?String(o.id):o.seed??0);
  const hero=type==='fox';
  const {fur,cream}=pelt;
  const pose=o.pose||o,rear=Math.cos(viewAngle||0),profile=Math.sin(viewAngle||0);
  const gait=sampleLocomotion(pose,t,motionSeed(o.id??o.seed));
  const {phase,run}=gait,stride=gait.step*gait.pace,lift=gait.bob*50;
  const sx=height/(animal==='rabbit'?106:100);
  const firing=Number(pose.fire)||0,react=Math.min(1,Math.abs(Number(pose.impact)||0));
  function faceAndHat(){
  ear(c,-1,animal,fur,rear,stride);ear(c,1,animal,fur,rear,-stride);
  panel(c,animal==='fox'||animal==='cat'?foxHead:roundHead,fur,[-32,-85,64,49]);
  if(rear>.3){
    const tufted=animal==='fox'||animal==='cat';
    if(tufted){
      shape(c,'M-21 -57 Q-21 -52 -24 -50 L-19 -49 L-21 -46 L-15 -47 L-12 -44 Q-14 -49 -12 -51 Z',cream,null,0,true);
      shape(c,'M21 -57 Q21 -52 24 -50 L19 -49 L21 -46 L15 -47 L12 -44 Q14 -49 12 -51 Z',cream,null,0,true);
    }
    shape(c,'M-7 -78 Q-9 -70 -6 -63 Q-4 -58 -4 -54',null,pelt.shade,.7);
    for(let i=0;i<4;i++){const yy=-75+5.2*i,xx=i<2?-7.7:-7.2+(i-2)*1.8;
      stitch(c,[[xx-1.6,yy+.2],[xx+1.3,yy+1.35]],.85,cream);}

  }
  if(rear<.62){
    const facing=rear<0?1:Math.max(.15,1-rear),offset=profile*12,eyeWidth=1-Math.abs(profile)*.42;
    c.save();c.translate(offset,0);c.scale(eyeWidth,1);
    for(const s of [-1,1]){
      if(Math.abs(profile)>.73&&s*profile<0)continue;
      if(animal==='raccoon')bead(c,s*7.8,-58.5,7.2,7,pelt.shade,null,0,s*.15);
      const ex=s*7.4;
      stitch(c,[[ex-3,-66],[ex,-67],[ex+2.2,-66.6]],1.35,pelt.shade);
      bead(c,ex,-58,4.5,6.3,'#fff0c9',outline,.8);
      bead(c,s*7.5+profile*1.2,-57.3,2.2,4.1,outline,null);
      bead(c,s*7.6+profile*1.2-.3,-59.4,.75,1,'#fffbde',null);
    }
    bead(c,0,-48.5,11*facing+3,6.2,cream,null);
    bead(c,0,-52,3.8,2.7,outline,null);stitch(c,[[-1.5,-53],[-.4,-53.4],[.5,-53.3]],.65,'#ead1ac');
    for(const s of [-1,1])for(let k=0;k<2;k++){
      const px=s*(4.4+k*2.35);stitch(c,[[px-.55,-47.7-k*.6],[px+.5,-47.2-k*.6]],.7,pelt.shade);}
    shape(c,'M0 -50 Q0 -45 4 -46',null,outline,1);c.restore();
  }
  if(service)hat(c,type,rear,profile);
  }
  c.save();c.translate(x,groundY);c.scale(sx,sx);c.lineJoin='round';c.lineCap='round';
  if(pose.ragdoll?.head){
    const rag=pose.ragdoll,k=100/1.78,blend=rag.blend??1;
    const pt=(name,rest)=>{
      const [a,h,z]=rag[name],depth=a*rear-z*profile;
      const u=(a*profile+z*rear)*k,v=(-h-depth*.16)*k;
      return [rest[0]+blend*(u-rest[0]),rest[1]+blend*(v-rest[1])];
    };
    const hips=pt('hips',[0,-22]),chest=pt('chest',[0,-39]),head=pt('head',[0,-61]);
    const nearSide=profile>0?'left':'right',order=nearSide==='left'?['right','left']:['left','right'];
    for(const side of order){
      const sign=side==='left'?-1:1,a=pt(side+'Hip',[sign*7,-22]),knee=pt(side+'Knee',[sign*7,-13]),foot=pt(side+'Foot',[sign*8,-5]);
      stitch(c,[a,knee,foot],8.2,outline);stitch(c,[a,knee,foot],5.9,'#4c4856');
      bead(c,foot[0],foot[1],6.2,3.6,'#604a49');
    }
    const sleeve=side=>{
      const sign=side==='left'?-1:1,a=pt(side+'Shoulder',[sign*12,-38]),elbow=pt(side+'Elbow',[sign*16,-32]),hand=pt(side+'Hand',[sign*16,-24]);
      stitch(c,[a,elbow,hand],7.7,outline);stitch(c,[a,elbow,hand],5.4,dress);
      bead(c,...hand,4.7,4.0,'#f1d7b4');
    };
    sleeve(order[0]);
    const roll=Math.atan2(chest[0]-hips[0],hips[1]-chest[1]);
    c.save();c.translate(hips[0],hips[1]);c.rotate(roll);c.scale(1,Math.max(.55,Math.hypot(chest[0]-hips[0],chest[1]-hips[1])/17));
    shape(c,'M-9 4 Q-17 0 -14 -11 Q-13 -23 0 -24 Q13 -23 15 -11 Q17 2 7 4 Z',dress,outline,1.6,true);
    if(hero){
      shape(c,'M-11 -18 Q0 -27 11 -18 L17 0 Q3 -5 -1 -2 L-17 1 Z','#367e80',outline,1.35,true);
      stitch(c,[[-14,-2],[-1,-5],[13,-2]],1.6,gold);
    }
    if(animal==='fox'){c.translate(-4,14);c.scale(.70,.70);drawTail(c,fur,0,rear,1);}
    c.restore();
    sleeve(order[1]);
    c.save();c.translate(head[0],head[1]);c.rotate(Math.atan2(head[0]-chest[0],chest[1]-head[1]));c.scale(1-.16*blend,1-.12*blend);c.translate(0,61);
    faceAndHat();c.restore();c.restore();return;
  }
  if(pose.stunned){c.rotate(-.85);c.scale(1.12,.78);}
  const foreshorten=1-Math.abs(profile)*.34;
  const screen=([forward,up,side])=>[side*foreshorten+forward*profile,-up-rear*forward*.22];
  const leg=s=>{
    const l=s<0?gait.left:gait.right;
    const length=1+(l.legStretch||0);
    const [hip,knee,foot]=posedLimb([0,22+lift,s*7.5],l.thigh,l.shin,8*length,9.5*length,s,1.2).map(screen);
    hose(c,hip,knee,foot,5.8,'#4c4856');
    const [toe,endY]=foot;
    bead(c,toe+profile*2,endY,6.4,3.2,'#4b4546',outline,1.3,profile*.08);
    stitch(c,[[toe-4,endY+2],[toe+3.6,endY+2]],1.2,'#ac896d');
    stitch(c,[[toe-2,endY-1.8],[toe+.8,endY-.9]],.75,'#bea185');
  };
  const frontFoot=rear>.58?0:gait.footSide;
  if(frontFoot!==-1)leg(-1);if(frontFoot!==1)leg(1);
  c.save();c.translate(0,-lift-22);c.rotate(gait.lean*profile+gait.roll*rear);
  const stretch=gait.squash-react*.075;
  c.scale(1-stretch*.5,1+stretch);c.translate(0,22);
  const tailSide=profile>.2?-1:1;
  if(animal==='fox' && rear<.20)drawTail(c,fur,phase,rear,tailSide);
  const chest=()=>{
    panel(c,'M-12 -44 Q-15 -37 -15 -26 Q-14 -20 -9 -18 Q1 -15 12 -20 Q17 -27 12 -40 Q9 -45 1 -46 Z',dress,[-18,-48,37,34]);
    shape(c,'M-12 -39 Q0 -35 12 -39',null,trim,1.65);
    if(type==='medic'&&rear<=.2){
      shape(c,'M-10 -41 L-6 -42 L10 -23 L7 -21 Z',trim,outline,.7,true);
      shape(c,'M3 -31 Q8 -33 13 -31 L12 -24 Q9 -22 4 -24 Z','#b0aaa0',outline,.8);
      stitch(c,[[8,-30],[8,-25]],1.2,trim);stitch(c,[[5.8,-27.5],[10.2,-27.5]],1.2,trim);
    }else if(type==='medic'&&rear>.2){ // The medic carries a stitched first-aid satchel.
      shape(c,'M-9 -34 Q-10 -38 -4 -38 H6 Q10 -37 10 -33 L9 -23 Q2 -20 -8 -24 Z','#dbc8a7',outline,1.2,true);
      stitch(c,[[-.2,-34],[-.2,-26]],2.2,trim);
      stitch(c,[[-4,-30],[3.5,-30]],2.2,trim);
    }else if(type==='firefighter'){
      shape(c,'M-13 -26 Q0 -21 13 -26',null,trim,2.6);
    }else if(rear<.2){
      stitch(c,[[profile*3,-35],[profile*3,-22]],.9,'#78636b');
      for(const yy of [-32,-26]){bead(c,profile*3,yy,1.35,1.35,trim,outline,.45);}
    }else if(!hero){
      shape(c,'M-12 -31 Q0 -25 13 -31',null,'rgba(56,45,60,.53)',1.05);
    }
  };
  function arm(s){
    const l=s<0?gait.left:gait.right,free=1-gait.effort;
    const wave=s>0&&pose.emote?free:0,fire=s>0?firing*free:0;
    const raised=l.arm+wave*(2.38+.14*Math.sin(t*12))+fire*1.12;
    const reach=gait.effort*Math.max(0,Math.sin(raised*.5));
    const length=1+(l.armStretch||0);
    const [a,b,h]=posedLimb([s*12*Math.sin(gait.twist),39,s*12*Math.cos(gait.twist)],raised,l.elbow,(7.6+2.7*reach)*length,(7+2.4*reach)*length,s,3.6+10*l.splay+wave*2).map(screen);
    hose(c,a,b,h,4.5,dress);
    bead(c,h[0],h[1]-1.1,4.7,2.6,trim,outline,1);
    bead(c,h[0],h[1]+1,4.8,4.6,ivory,outline,1.2);
    stitch(c,[[h[0]+s*.5,h[1]+.3],[h[0]+s*.7,h[1]+2.5]],.65,'#a88674');
    stitch(c,[[h[0]+s*2,h[1]+.1],[h[0]+s*2.3,h[1]+2]],.65,'#a88674');
    bead(c,h[0]-s*3,h[1]-1.1,2.0,2.5,'#f2d9b7',null);
  }
  const nearArm=profile>0?1:-1;
  const coveredArm=rear>.58?gait.handSide:0;
  if(coveredArm)arm(coveredArm);
  chest();
  if(gait.effort<.1&&coveredArm!==-nearArm)arm(-nearArm);
  if(hero){
    c.save();c.translate(0,Math.sin(phase-.4)*.9*gait.pace+.2*gait.breath);c.rotate(stride*.029);
    panel(c,'M-9 -44 Q-20 -39 -19 -25 L-22 -20 Q-18 -19 -15 -21 Q-7 -17 2 -18 Q12 -18 17 -21 L22 -20 Q19 -25 17 -35 Q14 -43 7 -45 Z',dress,[-24,-47,49,32]);
    shape(c,'M-17 -24 Q-6 -20 0 -21 Q10 -20 17 -24',null,gold,1.7);
    if(rear>.05){
      shape(c,'M-4 -38 Q0 -39 4 -38 L3 -36 L2.6 -31 L4 -29 Q0 -28 -4 -29 L-2.6 -31 L-3 -36 Z',trim,outline,.7);
      for(let j=0;j<3;j++)stitch(c,[[-2.3,-35.8+j*1.6],[2.3,-34.4+j*1.6]],.65,'#835e55');
    }
    c.restore();
  }
  if(animal==='fox'&&rear>=.20)drawTail(c,fur,phase,rear,tailSide);
  if(gait.effort<.1&&coveredArm!==nearArm)arm(nearArm);
  c.save();c.translate(profile*.8,-60+Math.sin(phase+.15)*gait.pace*.7);c.rotate(stride*(.023+.016*run)-gait.lean*profile*.33);c.translate(0,60);
  faceAndHat();
  c.restore();if(gait.effort>=.1){if(coveredArm!==-nearArm)arm(-nearArm);if(coveredArm!==nearArm)arm(nearArm);}
  c.restore();if(frontFoot)leg(frontFoot);c.restore();
}
function colorGrade(value,n){const hex=String(value).replace('#','');if(!/^[0-9a-f]{6}$/i.test(hex))return '#a38b89';const rgb=parseInt(hex,16);return 'rgb('+[16,8,0].map(v=>Math.max(0,Math.min(255,Math.round(((rgb>>v)&255)*n)))).join(',')+')';}
function carFace(c,pts,fill,stroke,width,woven,curve=.055){
  // Rounded cutouts keep a seam between coloured panels. The pattern is
  // painted in vehicle metres, so a distant car never shows screen-sized yarn.
  c.beginPath();
  for(let i=0;i<pts.length;i++){
    const v=pts[i],prev=pts[(i+pts.length-1)%pts.length],next=pts[(i+1)%pts.length];
    const a=Math.hypot(prev[0]-v[0],prev[1]-v[1]),b=Math.hypot(next[0]-v[0],next[1]-v[1]);
    const r=Math.min(curve,a*.28,b*.28),t=r/(a||1),u=r/(b||1);
    const x=v[0]+(prev[0]-v[0])*t,y=v[1]+(prev[1]-v[1])*t;
    if(i)c.lineTo(x,y);else c.moveTo(x,y);
    c.quadraticCurveTo(v[0],v[1],v[0]+(next[0]-v[0])*u,v[1]+(next[1]-v[1])*u);
  }
  c.closePath();c.fillStyle=fill;c.fill();
  if(woven){
    c.save();c.scale(.014,.014);c.globalAlpha*=.77;c.fillStyle=woven;c.fill();c.restore();
  }
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}

export function drawCanvasCar(c,o,x,groundY,height,time=0,viewAngle=0){
  drawCarBody(c,o,x,groundY,height,time,viewAngle);
  const stage=chassisStage(o?.chassisHp);
  if(!stage||height<8)return;
  const spec=vehicleSpec(o.type),scale=height/spec.height,side=Math.sign(Math.cos(viewAngle))||1;
  const nose=Math.sin(viewAngle)*-.53*spec.halfLength*scale;
  c.save();c.translate(x,groundY);c.lineCap='round';
  for(let i=0;i<stage+1;i++){
    const dx=side*(.14+i*.095)*height;
    const y=-(.43-i*.045)*height;
    stitch(c,[[nose+dx,y],[nose+dx+height*.065,y-height*.05]],Math.max(1,height*.017),'#4e3944');
  }
  if(stage>=2)for(let i=0;i<(stage===3?4:2);i++){
    const age=(time*.94+i/(stage===3?4:2))%1;
    const radius=(.08+.28*age)*scale;
    c.globalAlpha=.45*(1-age*.78);c.fillStyle='#82747e';c.beginPath();
    c.ellipse(nose+age*scale*.42,-height*.65-age*1.45*scale,radius,radius*.82,0,0,Math.PI*2);c.fill();
  }
  c.restore();
}
function drawCarBody(c,o,x,groundY,height,time=0,viewAngle=0){
  if(!o||height<1)return;
  if(isStreetVehicle(o.type))return drawStreetVehicle(c,o,x,groundY,height,time,viewAngle,cloth);
  const pose=o.pose||o,t=Number(time)||0,id=hash(o.id??o.seed);
  const type=o.type||'car',service=carFleet[type],van=['van','ambulance','swat','firetruck'].includes(type),bus=type==='bus',sport=type==='sport',compact=type==='compact';
  const src=typeof o.color==='string'&&/^#[0-9a-f]{6}$/i.test(o.color)?o.color:null;
  const paint=service||src||carColors[id%carColors.length],light=colorGrade(paint,1.16),shade=colorGrade(paint,.81);
  const q=viewAngle||0,cs=Math.cos(q),sn=-Math.sin(q),zSign=sn>0?1:-1,nearEnd=cs>=0?-1:1;
  const speed=Number(pose.speed)||0,drive=pose.moving||Math.abs(speed)>.4;
  const spec=vehicleSpec(type),factor=height/spec.height,length=spec.halfLength,width=spec.halfWidth;
  const bob=drive?.012*Math.sin(t*12+id%7):0,lean=Math.max(-.08,Math.min(.08,(Number(pose.steer??pose.turn)||0)*.04));
  const project=(a,y,z)=>{const depth=a*cs-z*sn,s=1/(1+depth*.035);return [(a*sn+z*cs)*s,(-y-depth*.19+lean*z)*s];};
  const weave=height>=39&&typeof c.createPattern==='function'?cloth(c):null;
  const detailed=height>=29;
  const face=(points,fill,edge=trim.ink,lw=.018,woven=weave,round=.055)=>carFace(c,points.map(p=>project(...p)),fill,edge,lw,woven,round);
  function glass(a,b,d,e,front=false){
    const points=[a,b,d,e];
    face(points,front?trim.frontPane:trim.pane,trim.ink,.035);
    if(!detailed)return;
    const uv=(u,v)=>a.map((coord,i)=>(coord*(1-u)+b[i]*u)*(1-v)+(e[i]*(1-u)+d[i]*u)*v);
    face([uv(.07,.12),uv(.22,.12),uv(.47,.91),uv(.33,.91)],trim.gleam,null,0,null,.007);
    face([uv(.25,.13),uv(.29,.13),uv(.54,.91),uv(.50,.91)],'#b4ccbb',null,0,null,.006);
    line(uv(.08,.05),uv(.90,.05),.014,trim.binding);
  }
  const line=(a,b,w,col)=>stitch(c,[project(...a),project(...b)],w,col);
  const beadAt=(p,rx,ry,color,edge,lw=.012,tilt=0)=>{
    c.beginPath();c.ellipse(p[0],p[1],Math.max(.002,rx),Math.max(.002,ry),tilt,0,Math.PI*2);
    c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=lw;c.stroke();}
  };
  const marker=(a,y,z,rx,ry,color)=>beadAt(project(a,y,z),rx,ry,color,trim.ink);
  const diagonalThread=(a,b,n,color)=>{
    if(!detailed)return;
    const at=t=>a.map((v,i)=>v+(b[i]-v)*t);
    c.beginPath();for(let i=0;i<n;i++){
      const p=project(...at((i+.11)/n)),q=project(...at((i+.61)/n));
      c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);
    }
    c.strokeStyle=color;c.lineWidth=.022;c.stroke();
  };
  c.save();c.translate(x,groundY);c.scale(factor,factor);c.lineJoin='round';c.lineCap='round';
  function wheel(a,z){
    const p=project(a,.33,z);const width=.13+.25*Math.abs(sn),ang=drive?t*(4+Math.abs(speed)*.4):.6;
    beadAt(p,width,.36,trim.tyre,trim.ink,.038);
    beadAt([p[0],p[1]-.012],width*.78,.278,trim.binding,trim.welt,.022);
    beadAt(p,width*.58,.199,trim.welt,trim.ink,.018);
    beadAt(p,width*.37,.133,trim.brass,trim.thread,.012);
    for(const sign of [-1,1])beadAt([p[0]+sign*Math.cos(ang)*width*.15,p[1]+sign*Math.sin(ang)*.067],.017,.021,trim.ink);
    if(detailed){
      c.beginPath();
      for(let i=0;i<8;i++){
        const a=ang+i*Math.PI*.25,theta=a+.24;
        c.moveTo(p[0]+Math.cos(a)*width*.89,p[1]+Math.sin(a)*.32);
        c.lineTo(p[0]+Math.cos(theta)*width*.91,p[1]+Math.sin(theta)*.323);
      }
      c.strokeStyle=trim.welt;c.lineWidth=.025;c.stroke();
    }
  }
  for(const a of [-length*.65,length*.65])wheel(a,-zSign*width*.88);
  const low=.35+bob,high=(bus?1.23:van?1.2:sport?.73:.96)+bob,lo=-length,hi=length,w=width;
  const stations=[[-1,.67,.13,.13],[-.92,.92,.01,.04],[-.72,1,0,0],[-.18,1,0,.012],[.45,.98,0,.012],[.78,.95,.017,.029],[.92,.86,.041,.072],[1,.65,.10,.14]];
  const rail=(level,side)=>stations.map(([f,width,bottom,drop])=>{
    const a=length*f,end=side*w*width;
    if(level===0)return [a,low+bottom,end*.87];
    if(level===1)return [a,low+.145+bottom*.38,end];
    if(level===2)return [a,high-drop-.105,end*1.03];
    return [a,high-drop,end*.90];
  });
  const sill=rail(0,zSign),waist=rail(1,zSign),shoulder=rail(2,zSign),deck=rail(3,zSign),away=rail(3,-zSign);
  const strip=(a,b,fill)=>face([...a,...b.slice().reverse()],fill,null);
  face([...deck,...away.slice().reverse()],light,trim.ink,.025);
  strip(sill,waist,shade);strip(waist,shoulder,paint);strip(shoulder,deck,light);
  const capIndex=nearEnd<0?0:stations.length-1,opposite=rail(2,-zSign),otherWaist=rail(1,-zSign),otherSill=rail(0,-zSign);
  face([sill[capIndex],otherSill[capIndex],otherWaist[capIndex],opposite[capIndex],away[capIndex],deck[capIndex],shoulder[capIndex],waist[capIndex]],paint,trim.ink,.022);
  const axles=[-length*.65,length*.65];
  for(const a of axles){
    wheel(a,zSign*w*.95);
    const fender=[[-.47,.38],[-.43,.62],[-.27,.78],[.04,.83],[.37,.74],[.50,.58],[.48,.44],[.31,.55],[.14,.63],[-.10,.65],[-.29,.57]];
    face(fender.map(([x,h])=>[a+x,h+bob,zSign*w*.99]),paint,trim.ink,.018);
    if(detailed)diagonalThread([a-.21,.74+bob,zSign*w],[a+.23,.73+bob,zSign*w],4,trim.binding);
  }
  const rear=bus?-length+.08:van?-length+.12:compact?-1.43:sport?-1.5:-length*.63;
  const front=bus?length-.08:van?.87:compact?.86:.98;
  const backTop=bus?rear+.05:van?rear+.06:compact?-1.02:-.68,frontTop=bus?front-.05:van?.18:compact?.23:sport?.14:.40;
  const maxH=spec.height-(type==='taxi'||type==='police'||van||bus?.17:.04)+bob,wa=w*(bus?.98:.77),roof=wa*(bus?.98:.87);
  const pBack=nearEnd<0,side=zSign;
  face([[rear,high-.08,side*wa],[front,high-.08,side*wa],[frontTop,maxH,side*roof],[backTop,maxH,side*roof]],paint);
  if(bus){
    for(let i=0;i<7;i++){
      const left=rear+.22+i*1.12,right=left+.99,door=side>0&&(i===3||i===6);
      glass([left,door?.52:1.42,side*wa],[right,door?.52:1.42,side*wa],[right,maxH-.27,side*roof],[left,maxH-.27,side*roof],!door);
      line([left+.50,door?.52:2.03,side*wa],[left+.50,maxH-.28,side*roof],.038,'#5b7272');
    }
    line([rear+.2,1.15,side*w],[front-.24,1.15,side*w],.19,'#eddfc4');
  }else if(van){
    glass([rear+.15,1.32,side*(wa+.009)],[rear+.72,1.32,side*(wa+.009)],[rear+.72,1.70,side*roof],[rear+.15,1.70,side*roof]);
    glass([-.24,1.31,side*(wa+.009)],[.49,1.31,side*(wa+.009)],[.15,1.72,side*roof],[-.24,1.72,side*roof],true);
  }else{
    for(const [tb,tf,bb,bf] of [[backTop+.03,-.12,rear+.18,-.12],[-.035,frontTop-.02,-.035,front-.17]])
      glass([bb,high+.10,side*(wa+.01)],[bf,high+.10,side*(wa+.01)],[tf,maxH-.10,side*(roof+.02)],[tb,maxH-.10,side*(roof+.02)],bb>-.1);
  }
  const far=pBack?rear:front,top=pBack?backTop:frontTop;
  face([[far,high-.04,-wa],[far,high-.04,wa],[top,maxH,roof],[top,maxH,-roof]],paint);
  glass([far+(pBack?.09:-.08),high+.12,-wa*.79],[far+(pBack?.09:-.08),high+.12,wa*.79],[top,maxH-.08,roof*.88],[top,maxH-.08,-roof*.88],!pBack);
  face([[backTop,maxH,-roof],[frontTop,maxH,-roof],[frontTop,maxH,roof],[backTop,maxH,roof]],type==='police'||(!van&&id%3===0)?'#e0cab0':light);
  const end=pBack?lo:hi;
  if(van&&pBack){
    // Real canvas rear doors: inset glass, a centre fold, and a service patch.
    const back=rear-.015,y0=high+.08,y1=maxH-.15;
    face([[back,y0,-wa*.92],[back,y0,wa*.92],[back,y1,roof*.93],[back,y1,-roof*.93]],paint,trim.ink,.021);
    for(const s of [-1,1]){
      const z=s*wa*.47;
      glass([back,y0+.23,z-.19],[back,y0+.23,z+.19],[backTop,y1-.03,z+.17],[backTop,y1-.03,z-.17]);
    }
    line([back,high-.015,0],[backTop,maxH-.07,0],.024,trim.welt);
    if(type==='ambulance'){
      face([[back,y0+.05,-.32],[back,y0+.05,-.05],[back,y0+.23,-.05],[back,y0+.23,-.32]],'#548579',null);
      line([back,y0+.14,-.265],[back,y0+.14,-.10],.032,trim.thread);
      line([back,y0+.073,-.18],[back,y0+.206,-.18],.032,trim.thread);
    }
  }
  const lensX=end*.986;
  for(const s of [-1,1]){
    marker(lensX,high-.205,s*w*.57,.137,.112,pBack?trim.welt:trim.brass);
    const pin=project(lensX,high-.205,s*w*.57),r=.097*(1-.36*Math.abs(sn));
    beadAt(pin,r,.077,pBack?trim.stop:trim.lamp,trim.ink,.012);
    if(detailed){
      for(const d of [-1,1])beadAt([pin[0]+d*r*.32,pin[1]-.003],r*.118,.012,trim.welt);
      stitch(c,[[pin[0]-r*.24,pin[1]-.024],[pin[0]+r*.25,pin[1]-.032]],.013,trim.thread);
    }
  }
  diagonalThread([end,high-.17,-w*.38],[end,high-.17,w*.38],7,trim.binding);
  line([end,high-.22,-w*.22],[end,high-.22,w*.22],.042,pBack?trim.binding:trim.ink);

  line([end,.47,-w*.68],[end,.47,w*.68],.082,'#d9c5a9');
  face([[end,.50,-.19],[end,.50,.19],[end,.62,.19],[end,.62,-.19]],'#e5d7b3',outline,.011);
  for(let i=-1;i<3;i++)line([end,.535,i*.065],[end,.58,i*.065],.016,'#665965');
  const sideZ=side*w*1.015;
  if(!bus&&!van){
    // The door is a padded applique with a pale hem catching the light.
    const a=-length*.33,b=length*.35;
    face([[a-.36,high-.15,sideZ],[b+.39,high-.16,sideZ],[b+.18,high-.23,sideZ],[a+.05,high-.27,sideZ]],trim.binding,null,.0,null);
    face([[a,high-.11,sideZ],[b,high-.11,sideZ],[b-.15,low+.13,sideZ],[a+.06,low+.13,sideZ]],paint,shade,.036);
    diagonalThread([a+.05,high-.15,sideZ],[b-.06,high-.15,sideZ],8,trim.binding);
    line([a+.13,high-.19,sideZ],[a+.31,high-.19,sideZ],.038,trim.thread);
  }else diagonalThread([-length*.84,high-.12,sideZ],[length*.79,high-.12,sideZ],bus?22:14,trim.thread);
  if(['firetruck','ambulance','swat','police'].includes(type)){
    for(const s of [-1,1])marker(-.08,maxH+.085,s*.30,.12,.085,Math.sin(t*10+s*2)>0?'#83e2ec':'#5c89aa');
    line([-.98,high-.12,side*w], [.53,high-.12,side*w],.096,type==='firetruck'?'#e6b451':type==='ambulance'?'#489987':'#d0c5b5');
    if(type==='ambulance'){
      line([-1.18,1.49,side*wa],[-1.18,1.71,side*wa],.064,ivory);
      line([-1.3,1.60,side*wa],[-1.07,1.60,side*wa],.064,ivory);
    }
    if(type==='firetruck'){
      for(const s of [-1,1])line([rear+.05,maxH+.09,s*.29],[.16,maxH+.09,s*.29],.048,'#e3caab');
      for(let i=0;i<5;i++)line([rear+.25+i*.40,maxH+.09,-.29],[rear+.25+i*.40,maxH+.09,.29],.032,'#e3caab');
    }
  }
  if(bus){
    face([[end,2.30,-.84],[end,2.30,.84],[end,2.60,.84],[end,2.60,-.84]],'#33444b');
    const sign=project(end,2.44,0);c.save();c.fillStyle='#ffce77';c.font='bold .20px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('73  ÉTOILE',...sign);c.restore();
    face([[-1.6,maxH,-.52],[-.3,maxH,-.52],[-.3,maxH+.15,.52],[-1.6,maxH+.15,.52]],'#9eb9ac');
  }else if(sport){
    for(const s of [-1,1])line([-1.51,.71,s*.53],[-1.51,.94,s*.53],.065,'#48404b');
    face([[-1.75,.95,-.88],[-1.42,.98,-.88],[-1.42,.98,.88],[-1.75,.95,.88]],paint);
    for(const s of [-1,1])line([1.02,.73,s*.17],[1.89,.63,s*.17],.056,'#f2dfb4');
  }else if(compact){
    for(const s of [-1,1])line([backTop,maxH+.015,s*.35],[frontTop,maxH+.015,s*.35],.026,'#d9cdb9');
  }else if(type==='van'){
    face([[rear+.18,1.30,side*wa],[-.48,1.30,side*wa],[-.48,1.82,side*roof],[rear+.18,1.82,side*roof]],'#e7d6ac');
    for(let i=0;i<3;i++)line([rear+.30+i*.30,1.42,side*wa],[rear+.53+i*.30,1.67,side*wa],.04,'#a08460');
  }
  if(type==='taxi')face([[-.25,maxH,-.3],[-.25,maxH,.3],[-.20,maxH+.17,.3],[-.20,maxH+.17,-.3]],'#ffda80');
  c.restore();
}
