import {motionSeed,posedLimb,sampleLocomotion} from './locomotion-pose.js';
import { drawStreetVehicle, isStreetVehicle } from './street-vehicles.js';
import { vehicleSpec } from './vehicle-types.js';
// Painterly silhouettes for the software-rendered chase camera. All distances in
// these drawings are local to the puppet, so silhouettes stay stable at any zoom.
const outline='#382b35', gold='#edbb61', ivory='#ffdfab';
const paths=new Map();
const textiles=new WeakMap();
function shape(ctx,description,fill,stroke=outline,width=1.55,woven=false){
  let p=paths.get(description);if(!p){p=new Path2D(description);paths.set(description,p);}
  if(fill){ctx.fillStyle=fill;ctx.fill(p);}
  if(woven){const pattern=cloth(ctx);if(pattern){ctx.fillStyle=pattern;ctx.fill(p);}}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}
}
function cloth(c){
  if(textiles.has(c))return textiles.get(c);
  const tile=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(9,7):
    (typeof document!=='undefined'?document.createElement('canvas'):null);
  if(!tile){textiles.set(c,null);return null;}
  tile.width=9;tile.height=7;const pen=tile.getContext('2d');
  pen.lineWidth=.9;pen.lineCap='round';pen.strokeStyle='rgba(255,242,203,.24)';
  pen.beginPath();pen.moveTo(.4,1);pen.quadraticCurveTo(1,4.2,2.8,4.8);
  pen.moveTo(4.5,1);pen.quadraticCurveTo(4,3.6,3,4.8);
  pen.moveTo(6.2,4.6);pen.lineTo(7.4,7);pen.stroke();
  pen.strokeStyle='rgba(49,31,47,.17)';pen.beginPath();pen.moveTo(4,1.5);pen.lineTo(3,4.9);
  pen.moveTo(8.7,4.9);pen.lineTo(7.9,6.8);pen.stroke();
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
const civilians=[
  ['bunny','#d8b7b0','#f4d9c3','#947599'],['bear','#a16e58','#edc29b','#699295'],
  ['cat','#8a8897','#e6d9c7','#a8788e'],['fox','#d68547','#ffe1ad','#4b8e98'],
  ['bear','#ba8368','#f3d1ac','#739876'],['cat','#ab958b','#f7ddbb','#b07765']
];
const uniforms={police:['#476487','#b8bccc'],medic:['#e6d9bd','#4b9b92'],firefighter:['#ad5550','#e8c069'],swat:['#4c5261','#85929b']};
function ear(c,s,kind,furry,front,roll) {
  c.save();c.translate(s*13,-75);c.rotate(s*(.14+roll*.03));c.scale(s,1);
  if(kind==='bunny'){
    shape(c,'M-4 5 Q-8 -12 -7 -26 Q-3 -34 1 -29 Q10 -15 7 3 Z',furry,outline,1.5,true);
    if(front<.35)shape(c,'M-3 -1 Q-5 -14 -3 -22 Q3 -21 4 -3 Z','#d59793',null);
  } else if(kind==='bear'){
    bead(c,2,-2,8,9,furry);if(front<.4)bead(c,2,-2,4.8,5,'#ad897f',null);
  } else {
    shape(c,'M-7 6 Q-4 -8 5 -23 Q11 -21 11 4 Z',furry,outline,1.7,true);
    shape(c,'M2 -17 L5 -23 Q8 -24 9 -17 L9 -13 Z','#644545',null);
    if(front<.55)shape(c,'M-1 -1 L5 -15 Q8 -12 7 -2 Z','#efd4ac',null);
  }
  c.restore();
}
function hat(c,type){
  if(type==='medic'){
    shape(c,'M-18 -73 Q-15 -89 0 -89 Q17 -88 20 -72 Q7 -77 -18 -73 Z','#ebdfc8',outline,1.6,true);
    shape(c,'M-2 -86 H2 V-82 H6 V-78 H2 V-74 H-2 V-78 H-6 V-82 H-2 Z','#4f9d93',null);
  } else if(type==='firefighter'||type==='swat'){
    shape(c,'M-20 -73 Q-20 -90 -3 -92 Q15 -92 20 -76 L24 -73 Q14 -69 -21 -70 L-25 -72 Z',type==='swat'?'#565b69':'#d4a24f',outline,1.8,true);
    stitch(c,[[-16,-76],[0,-78],[17,-76]],2.2,type==='swat'?'#7c8893':'#f6d282');
  } else if(type==='police'){
    shape(c,'M-21 -77 L-17 -84 Q0 -94 17 -84 L21 -77 L13 -72 L-18 -73 Z','#47627c',outline,1.6,true);
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
  const t=Number(time)||0,id=hash(o.id??o.seed),type=o.type||'pedestrian',hero=['fox','player'].includes(type)||o.local||o.player;
  const [animal,fur,cream,shirt]=hero?['fox','#d9823c',ivory,'#348e8d']:civilians[id%civilians.length];
  const dress=uniforms[type]?.[0]||shirt,trim=uniforms[type]?.[1]||(hero?gold:'#d9c389');
  const pose=o.pose||o,rear=Math.cos(viewAngle||0),profile=Math.sin(viewAngle||0);
  const gait=sampleLocomotion(pose,t,motionSeed(o.id??o.seed));
  const {phase,run}=gait,stride=gait.step*gait.pace,lift=gait.bob*50;
  const sx=height/(animal==='bunny'?106:100);
  const firing=Number(pose.fire)||0,react=Math.min(1,Math.abs(Number(pose.impact)||0));
  function faceAndHat(){
  ear(c,-1,animal,fur,rear,stride);ear(c,1,animal,fur,rear,-stride);
  shape(c,animal==='fox'||animal==='cat'?foxHead:roundHead,fur,outline,1.8,true);
  if(rear>.3){
    shape(c,'M-18 -60 Q-21 -52 -24 -50 L-19 -49 L-21 -45 L-15 -47 L-11 -43 Q-14 -48 -11 -52 Z',cream,null,0,true);
    shape(c,'M18 -60 Q21 -52 24 -50 L19 -49 L21 -45 L15 -47 L11 -43 Q14 -48 11 -52 Z',cream,null,0,true);
    stitch(c,[[-6,-71],[-2,-66],[1,-71]],1.2,'#ab643b');stitch(c,[[1,-69],[4,-65],[7,-70]],1.1,'#ab643b');
  }
  if(rear<.62){
    const facing=rear<0?1:Math.max(.15,1-rear),offset=profile*12,eyeWidth=1-Math.abs(profile)*.42;
    c.save();c.translate(offset,0);c.scale(eyeWidth,1);
    for(const s of [-1,1]){
      if(Math.abs(profile)>.73&&s*profile<0)continue;
      bead(c,s*7.4,-58,4.5,6.3,'#fff0c9',outline,.8);
      bead(c,s*7.5+profile*1.2,-57.3,2.2,4.1,outline,null);
      bead(c,s*7.6+profile*1.2-.3,-59.4,.75,1,'#fffbde',null);
    }
    bead(c,0,-49,11*facing+3,6,cream,null);bead(c,0,-52,3.8,2.7,outline,null);
    shape(c,'M0 -50 Q0 -45 4 -46',null,outline,1);c.restore();
  }
  if(uniforms[type])hat(c,type);
  }
  c.save();c.translate(x,groundY);c.scale(sx,sx);c.lineJoin='round';c.lineCap='round';
  if(pose.ragdoll?.head){
    const rag=pose.ragdoll,k=100/1.78,blend=rag.blend??1;
    const pt=(name,rest)=>{
      const [a,h,z]=rag[name],depth=a*rear+z*profile;
      const u=(-a*profile+z*rear)*k,v=(-h-depth*.16)*k;
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
    stitch(c,[[toe-4,endY+2],[toe+3.6,endY+2]],1.2,'#9c8068');
  };
  const frontFoot=rear>.58?0:gait.footSide;
  if(frontFoot!==-1)leg(-1);if(frontFoot!==1)leg(1);
  c.save();c.translate(0,-lift-22);c.rotate(gait.lean*profile+gait.roll*rear);
  const stretch=gait.squash-react*.075;
  c.scale(1-stretch*.5,1+stretch);c.translate(0,22);
  const tailSide=profile>.2?-1:1;
  if(animal==='fox' && rear<.20)drawTail(c,fur,phase,rear,tailSide);
  const chest=()=>shape(c,'M-12 -44 Q-15 -37 -15 -26 Q-14 -20 -9 -18 Q1 -15 12 -20 Q17 -27 12 -40 Q9 -45 1 -46 Z',dress,outline,1.8,true);
  function arm(s){
    const l=s<0?gait.left:gait.right,free=1-gait.effort;
    const wave=s>0&&pose.emote?free:0,fire=s>0?firing*free:0;
    const raised=l.arm+wave*(2.38+.14*Math.sin(t*12))+fire*1.12;
    const reach=gait.effort*Math.max(0,Math.sin(raised*.5));
    const length=1+(l.armStretch||0);
    const [a,b,h]=posedLimb([s*12*Math.sin(gait.twist),39,s*12*Math.cos(gait.twist)],raised,l.elbow,(7.6+2.7*reach)*length,(7+2.4*reach)*length,s,3.6+10*l.splay+wave*2).map(screen);
    hose(c,a,b,h,4.5,dress);
    bead(c,h[0],h[1]+1,4.8,4.6,'#f2d9b7',outline,1.2);
    bead(c,h[0]-s*3,h[1]-1.1,2.0,2.5,'#f2d9b7',null);
  }
  const nearArm=profile>0?1:-1;
  const coveredArm=rear>.58?gait.handSide:0;
  if(coveredArm)arm(coveredArm);
  chest();
  if(gait.effort<.1&&coveredArm!==-nearArm)arm(-nearArm);
  if(hero){
    c.save();c.translate(0,Math.sin(phase-.4)*.9*gait.pace+.2*gait.breath);c.rotate(stride*.029);
    shape(c,'M-9 -44 Q-20 -39 -19 -25 L-22 -20 Q-18 -19 -15 -21 Q-7 -17 2 -18 Q12 -18 17 -21 L22 -20 Q19 -25 17 -35 Q14 -43 7 -45 Z','#367e80',outline,1.45,true);
    shape(c,'M-17 -24 Q-6 -20 0 -21 Q10 -20 17 -24',null,gold,1.7);
    if(rear>.05)shape(c,'M0 -39 L4 -34 L0 -29 L-4 -34 Z',null,'#e6c16a',1.2);
    c.restore();
  }
  if(animal==='fox'&&rear>=.20)drawTail(c,fur,phase,rear,tailSide);
  if(gait.effort<.1&&coveredArm!==nearArm)arm(nearArm);
  c.save();c.translate(profile*.8,-60+Math.sin(phase+.15)*gait.pace*.7);c.rotate(stride*(.023+.016*run)-gait.lean*profile*.33);c.translate(0,60);
  faceAndHat();
  c.restore();if(gait.effort>=.1){if(coveredArm!==-nearArm)arm(-nearArm);if(coveredArm!==nearArm)arm(nearArm);}
  c.restore();if(frontFoot)leg(frontFoot);c.restore();
}
const carColors=['#b86b70','#429d9b','#deac59','#887eae','#b08163','#7798aa'];
const carFleet={police:'#527598',firetruck:'#ab4e48',ambulance:'#e6d6b6',swat:'#4b5260',taxi:'#b15c65',bus:'#408d82'};
function colorGrade(value,n){const hex=String(value).replace('#','');if(!/^[0-9a-f]{6}$/i.test(hex))return '#a38b89';const rgb=parseInt(hex,16);return 'rgb('+[16,8,0].map(v=>Math.max(0,Math.min(255,Math.round(((rgb>>v)&255)*n)))).join(',')+')';}
function poly(c,pts,fill,stroke=outline,width=.035,woven=false){
  c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
export function drawCanvasCar(c,o,x,groundY,height,time=0,viewAngle=0){
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
  const face=(points,fill,edge=outline,lw=.025)=>poly(c,points.map(p=>project(...p)),fill,edge,lw);
  const line=(a,b,w,col)=>stitch(c,[project(...a),project(...b)],w,col);
  const marker=(a,y,z,rx,ry,color)=>{const p=project(a,y,z);bead(c,p[0],p[1],rx,ry,color,outline,.013);};
  c.save();c.translate(x,groundY);c.scale(factor,factor);c.lineJoin='round';c.lineCap='round';
  function wheel(a,z){
    const p=project(a,.33,z);const width=.13+.25*Math.abs(sn),ang=drive?t*(4+Math.abs(speed)*.4):.6;
    bead(c,p[0],p[1],width,.36,'#363342',outline,.025);
    bead(c,p[0],p[1],width*.69,.24,'#d8c9b2',outline,.014);
    bead(c,p[0],p[1],width*.43,.15,'#807e89',null);
    stitch(c,[[p[0]-Math.cos(ang)*width*.30,p[1]-Math.sin(ang)*.11],[p[0]+Math.cos(ang)*width*.30,p[1]+Math.sin(ang)*.11]],.04,'#cbb29a');
  }
  for(const a of [-length*.65,length*.65])wheel(a,-zSign*width*.88);
  const low=.39+bob,high=(bus?1.23:van?1.2:sport?.73:.96)+bob,lo=-length,hi=length,w=width;
  const bodyRing=[[lo+.18,-w],[hi-.23,-w],[hi,-w*.74],[hi,w*.74],[hi-.23,w],[lo+.18,w],[lo,w*.74],[lo,-w*.74]];
  for(let i=0;i<8;i++){
    const a=bodyRing[i],b=bodyRing[(i+1)%8],depth=((a[0]+b[0])*.5*cs-(a[1]+b[1])*.5*sn);
    if(depth>=.09)continue;
    face([[a[0],low,a[1]*.94],[b[0],low,b[1]*.94],[b[0],high-.045,b[1]],[a[0],high-.045,a[1]]],i%2?shade:paint);
  }
  face(bodyRing.map(([a,z])=>[a,high-.045,z]),light);
  for(const a of [-length*.65,length*.65])wheel(a,zSign*w*.90);
  line([-.78,low+.19,zSign*w],[1.0,low+.19,zSign*w],.035,'#dac7ad');
  const rear=bus?-length+.08:van?-length+.12:compact?-1.43:sport?-1.5:-length*.63;
  const front=bus?length-.08:van?.87:compact?.86:.98;
  const backTop=bus?rear+.05:van?rear+.06:compact?-1.02:-.68,frontTop=bus?front-.05:van?.18:compact?.23:sport?.14:.40;
  const maxH=spec.height-(type==='taxi'||type==='police'||van||bus?.17:.04)+bob,wa=w*(bus?.98:.77),roof=wa*(bus?.98:.87);
  const pBack=nearEnd<0,side=zSign;
  face([[rear,high-.08,side*wa],[front,high-.08,side*wa],[frontTop,maxH,side*roof],[backTop,maxH,side*roof]],paint);
  if(bus){
    for(let i=0;i<7;i++){
      const left=rear+.22+i*1.12,right=left+.99,door=side>0&&(i===3||i===6);
      face([[left,door?.52:1.42,side*wa],[right,door?.52:1.42,side*wa],[right,maxH-.27,side*roof],[left,maxH-.27,side*roof]],door?'#699ba4':'#a7c9c3');
      line([left+.50,door?.52:2.03,side*wa],[left+.50,maxH-.28,side*roof],.038,'#5b7272');
    }
    line([rear+.2,1.15,side*w],[front-.24,1.15,side*w],.19,'#eddfc4');
  }else if(van){
    face([[rear+.15,1.32,side*(wa+.009)],[rear+.72,1.32,side*(wa+.009)],[rear+.72,1.70,side*roof],[rear+.15,1.70,side*roof]],'#638991');
    face([[-.24,1.31,side*(wa+.009)],[.49,1.31,side*(wa+.009)],[.15,1.72,side*roof],[-.24,1.72,side*roof]],'#72a2ab');
  }else{
    for(const [tb,tf,bb,bf] of [[backTop+.03,-.12,rear+.18,-.12],[-.035,frontTop-.02,-.035,front-.17]])
      face([[bb,high+.10,side*(wa+.01)],[bf,high+.10,side*(wa+.01)],[tf,maxH-.10,side*(roof+.02)],[tb,maxH-.10,side*(roof+.02)]],'#78a2aa');
  }
  const far=pBack?rear:front,top=pBack?backTop:frontTop;
  face([[far,high-.04,-wa],[far,high-.04,wa],[top,maxH,roof],[top,maxH,-roof]],paint);
  face([[far+(pBack?.09:-.08),high+.12,-wa*.79],[far+(pBack?.09:-.08),high+.12,wa*.79],[top+(pBack?.0:.01),maxH-.08,roof*.88],[top+(pBack?.0:.01),maxH-.08,-roof*.88]],pBack?'#608791':'#8fb0b2');
  face([[backTop,maxH,-roof],[frontTop,maxH,-roof],[frontTop,maxH,roof],[backTop,maxH,roof]],type==='police'||(!van&&id%3===0)?'#e0cab0':light);
  const end=pBack?lo:hi;
  for(const s of [-1,1])marker(end*.97,high-.18,s*w*.62,.115,.10,pBack?'#f28770':'#f6e1a7');
  line([end,.47,-w*.68],[end,.47,w*.68],.082,'#d9c5a9');
  face([[end,.50,-.19],[end,.50,.19],[end,.62,.19],[end,.62,-.19]],'#e5d7b3',outline,.011);
  for(let i=-1;i<3;i++)line([end,.535,i*.065],[end,.58,i*.065],.016,'#665965');
  // Alternating purls run along the coloured door panels, visibly catching the light.
  const thread=colorGrade(paint,1.20);
  for(let row=0;row<2;row++){
    const start=bus?-length+.38:-length*.61,finish=bus?length-.34:length*.57;
    for(let a=start+.09*row;a<finish;a+=.19){
      const yy=low+.24+row*.087,s=side*w*.996;
      line([a,yy,s],[a+.046,yy-.031,s],.013,thread);
      line([a+.046,yy-.031,s],[a+.09,yy,s],.015,thread);
    }
  }
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
