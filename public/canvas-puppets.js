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
  const vel=Number(pose.speed)||0,moving=Math.abs(vel)>.15||!!pose.moving,run=pose.sprinting||Math.abs(vel)>5.5;
  const phase=Number.isFinite(pose.walk)&&pose.walk!==0?pose.walk:t*(run?11.8:7.7)+id%17;
  const stride=moving?Math.sin(phase):0,lift=moving?Math.abs(Math.cos(phase))*(run?2.6:1.65):Math.sin(t*2+id%9)*.42;
  const sx=Math.max(.1,height/(animal==='bunny'?106:100));
  const firing=Number(pose.fire)||0,react=Math.min(1,Math.abs(Number(pose.impact)||0));
  c.save();c.translate(x,groundY);c.scale(sx,sx);c.lineJoin='round';c.lineCap='round';
  if(pose.stunned){c.rotate(-.85);c.scale(1.12,.78);}
  const foreshorten=1-Math.abs(profile)*.34;
  const leg=s=>{
    const z=stride*s,fore=moving?profile*z*(run?10:6):0,depth=rear*z;
    const hx=s*7.5*foreshorten,toe= hx+fore+s*1.2,endY=-4-Math.max(0,depth)*(run?6:4);
    hose(c,[hx,-22-lift],[hx+fore*.35+s,-12-lift*.7],[toe,endY-2],5.8,'#4c4856');
    bead(c,toe+profile*2,endY,6.4,3.2,'#4b4546',outline,1.3,profile*.08);
    stitch(c,[[toe-4,endY+2],[toe+3.6,endY+2]],1.2,'#9c8068');
  };
  leg(-1);leg(1);
  c.save();c.translate(0,-lift);c.scale(1+react*.085,1-react*.075+Math.max(0,Math.abs(stride)-.5)*.035);
  const tailSide=profile>.2?-1:1;
  if(animal==='fox' && rear<.20)drawTail(c,fur,phase,rear,tailSide);
  shape(c,'M-12 -44 Q-15 -37 -15 -26 Q-14 -20 -9 -18 Q1 -15 12 -20 Q17 -27 12 -40 Q9 -45 1 -46 Z',dress,outline,1.8,true);
  function arm(s){
    const swing=-stride*s, ax=s*12*foreshorten, dx=s*(4+Math.abs(swing))+profile*swing*(run?10:7);
    const salute=s===1&&Boolean(pose.emote),dy=salute?-51:(-24+rear*swing*5-(s===1?firing*6:0));
    hose(c,[ax,-38],[ax+s*(salute?10:5),-33+swing*2],[ax+dx,dy],4.5,dress);
    bead(c,ax+dx,dy+1,4.8,4.6,'#f2d9b7',outline,1.2);
    bead(c,ax+dx-s*3,dy-1.1,2.0,2.5,'#f2d9b7',null);
  }
  arm(-1);arm(1);
  if(hero){
    c.save();c.translate(0,Math.sin(phase-.4)*(moving?.9:.2));c.rotate(stride*.029);
    shape(c,'M-9 -44 Q-20 -39 -19 -25 L-22 -20 Q-18 -19 -15 -21 Q-7 -17 2 -18 Q12 -18 17 -21 L22 -20 Q19 -25 17 -35 Q14 -43 7 -45 Z','#367e80',outline,1.45,true);
    shape(c,'M-17 -24 Q-6 -20 0 -21 Q10 -20 17 -24',null,gold,1.7);
    if(rear>.05)shape(c,'M0 -39 L4 -34 L0 -29 L-4 -34 Z',null,'#e6c16a',1.2);
    c.restore();
  }
  if(animal==='fox'&&rear>=.20)drawTail(c,fur,phase,rear,tailSide);
  c.save();c.translate(profile*.8,Math.sin(phase+.15)*(moving?.7:.22));c.rotate(stride*(run?.039:.023));
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
  c.restore();c.restore();c.restore();
}
const carColors=['#b86b70','#429d9b','#deac59','#887eae','#b08163','#7798aa'];
const carFleet={police:'#527598',firetruck:'#ab4e48',ambulance:'#e6d6b6',swat:'#4b5260',taxi:'#e3ba5f'};
function colorGrade(value,n){const hex=String(value).replace('#','');if(!/^[0-9a-f]{6}$/i.test(hex))return '#a38b89';const rgb=parseInt(hex,16);return 'rgb('+[16,8,0].map(v=>Math.max(0,Math.min(255,Math.round(((rgb>>v)&255)*n)))).join(',')+')';}
function poly(c,pts,fill,stroke=outline,width=.035,woven=false){
  c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=fill;c.fill();
  if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
export function drawCanvasCar(c,o,x,groundY,height,time=0,viewAngle=0){
  if(!o||height<1)return;
  const pose=o.pose||o,t=Number(time)||0,id=hash(o.id??o.seed);
  const type=o.type||'car',service=carFleet[type],van=['ambulance','swat','firetruck'].includes(type);
  const src=typeof o.color==='string'&&/^#[0-9a-f]{6}$/i.test(o.color)?o.color:null;
  const paint=service||src||carColors[id%carColors.length],light=colorGrade(paint,1.16),shade=colorGrade(paint,.81);
  const q=viewAngle||0,cs=Math.cos(q),sn=Math.sin(q),zSign=sn>0?1:-1,nearEnd=cs>=0?-1:1;
  const speed=Number(pose.speed)||0,drive=pose.moving||Math.abs(speed)>.4;
  const factor=height/(van?2.17:1.82),length=van?2.43:2.04,width=van?1.035:.93;
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
  const low=.39+bob,high=van?1.2+bob:.96+bob,lo=-length,hi=length,w=width;
  const bodyRing=[[lo+.18,-w],[hi-.23,-w],[hi,-w*.74],[hi,w*.74],[hi-.23,w],[lo+.18,w],[lo,w*.74],[lo,-w*.74]];
  for(let i=0;i<8;i++){
    const a=bodyRing[i],b=bodyRing[(i+1)%8],depth=((a[0]+b[0])*.5*cs-(a[1]+b[1])*.5*sn);
    if(depth>=.09)continue;
    face([[a[0],low,a[1]*.94],[b[0],low,b[1]*.94],[b[0],high-.045,b[1]],[a[0],high-.045,a[1]]],i%2?shade:paint);
  }
  face(bodyRing.map(([a,z])=>[a,high-.045,z]),light);
  for(const a of [-length*.65,length*.65])wheel(a,zSign*w*.90);
  line([-.78,low+.19,zSign*w],[1.0,low+.19,zSign*w],.035,'#dac7ad');
  const rear=van?-length+.12:-1.25,front=van?.87:.98,backTop=van?rear+.06:-.68,frontTop=van?.18:.40,maxH=(van?1.89:1.63)+bob,wa=w*.77,roof=wa*.87;
  const pBack=nearEnd<0,side=zSign;
  face([[rear,high-.08,side*wa],[front,high-.08,side*wa],[frontTop,maxH,side*roof],[backTop,maxH,side*roof]],paint);
  if(van){
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
  for(let i=0;i<6;i++) {
    const a=-1.03+i*.33,yy=high-.10,s=side*w*.994;
    line([a,yy,s],[a+.045,yy-.035,s],.010,'#d7b79a');
    line([a+.045,yy-.035,s],[a+.09,yy,s],.010,'#d7b79a');
  }
  if(van||type==='police'){
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
  if(type==='taxi')face([[-.25,maxH,-.3],[-.25,maxH,.3],[-.20,maxH+.17,.3],[-.20,maxH+.17,-.3]],'#ffda80');
  c.restore();
}
