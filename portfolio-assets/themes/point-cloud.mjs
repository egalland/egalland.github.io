import {addMotion} from './kinetics.mjs?v=kinetic1';

export const STRIDE=27;
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const fract=n=>n-Math.floor(n);

/** Positions stay in model space. Nothing here is a captured or projected image. */
export function createCloud(form,{limit=form.length,from=null,fromTime=0,space='world'}={}){
 const count=Math.min(limit,form.length),data=new Float32Array(count*STRIDE),groups=new Map();
 for(let i=0;i<count;i++){
  const k=Math.floor((i+.5)*form.length/count),p=form[k],previous=from?.[Math.floor((i+.5)*from.length/count)]||p,n=i*STRIDE;
  const source=[previous.x,previous.y,previous.z];
  if(from && fromTime){
   if(previous.track){
    const {a,b,speed}=previous.track,delta=fract(previous.phase+fromTime*speed)-previous.phase;
    for(let j=0;j<3;j++)source[j]+=(b[j]-a[j])*delta;
   }
   if(previous.motion)addMotion(source,previous.motion,0,fromTime);
  }
  data.set([p.x,p.y,p.z,...source,...p.c,...previous.c,p.size??1,fract(i*.61803398875),p.track?.speed||0,p.phase||0,...(p.track?p.track.b.map((v,j)=>v-p.track.a[j]):[0,0,0])],n);
  if(p.motion)data.set(p.motion,n+19);
  const color='rgb('+p.c.map(v=>Math.round(v*255)).join(',')+')';
  if(!groups.has(color))groups.set(color,[]);groups.get(color).push(i);
 }
 return {data,count,space,groups:[...groups].map(([color,indices])=>({color,indices})),projected:new Float32Array(count*4)};
}

export function sceneCamera(kind,time=0,pointer={x:0,y:0},orbit={x:0,y:0},reduced=false,scrollTilt=0){
 const turn=reduced?0:time,px=reduced?0:pointer.x||0,py=reduced?0:pointer.y||0;
 let yaw=-.12+Math.sin(turn*.48)*.23, pitch=.1+Math.sin(turn*.37)*.09;
 if(kind==='hero'){yaw=.32*turn;pitch=.16+.14*Math.sin(turn*.58);}
 if(kind==='atlas')yaw=-.25+.48*turn;
 if(kind==='maison'){yaw=-.4+Math.sin(turn*.42)*.33;pitch=.52+Math.sin(turn*.36)*.1;}
 const tilt=reduced?0:clamp(scrollTilt,-1,1);
 return {
  yaw:yaw+px*.3+(orbit.y||0)+tilt*.12,
  pitch:pitch+py*.16+(orbit.x||0)+tilt*.08
 };
}

/** The compatible renderer uses the same model/flow/camera math as the shader. */
export function projectParticle(cloud,index,view,time=0,reduced=false,out=[0,0,0,0]){
 if(reduced)time=0;
 const d=cloud.data,n=index*STRIDE,seed=d[n+13],motion=reduced?0:1,world=cloud.space==='world';
 const phase=d[n+15],flow=fract(phase+time*d[n+14])-phase;
 const blend=view.blend??1;
 let x=d[n+3]+(d[n]+d[n+16]*flow-d[n+3])*blend;
 let y=d[n+4]+(d[n+1]+d[n+17]*flow-d[n+4])*blend;
 let z=d[n+5]+(d[n+2]+d[n+18]*flow-d[n+5])*blend;
 if(motion&&world){
  out[0]=x;out[1]=y;out[2]=z;addMotion(out,d,n+19,time,blend);
  x=out[0];y=out[1];z=out[2];
  if(view.scatter){
   const scatter=view.scatter,group=clamp((seed-.22)/.55,0,1);
   const weight=scatter*group*group*(3-2*group),angle=seed*21+scatter*2.8;
   x+=weight*1.4*Math.cos(angle);y+=weight*(.18+.88*Math.sin(angle));z+=weight*1.28*Math.sin(angle*.8);
  }
 }
 const drift=world?.012:.17;
 x+=Math.sin(time*.72+seed*23)*drift*motion;
 y+=Math.cos(time*.61+seed*31)*drift*motion;
 if(world)z+=Math.sin(time*.57+seed*19)*.024*motion;
 const co=Math.cos(view.yaw||0),si=Math.sin(view.yaw||0),cx=Math.cos(view.pitch||0),sx=Math.sin(view.pitch||0);
 const ax=x*co+z*si,az=-x*si+z*co,ay=y*cx-az*sx,depth=y*sx+az*cx,perspective=world?5/Math.max(1.5,5-depth):1;
 let px=view.cx+ax*view.scale*perspective,py=view.cy-ay*view.scale*perspective;
 if(motion&&view.pointer){
  const dx=px-view.pointer.x,dy=py-view.pointer.y,distance=Math.hypot(dx,dy),force=Math.pow(Math.max(0,1-distance/125),2)*(view.attraction?-20:8);
  px+=dx/Math.max(1,distance)*force;py+=dy/Math.max(1,distance)*force;
 }
 const fault=(view.fault||0)*motion,row=Math.floor(py/13),gate=fract(Math.sin(row*127.1+seed)*43758.5453)>.78?1:0;
 px+=fault*gate*Math.sin(Math.floor(time*18)+row)*11;
 if(view.packet){px+=Math.sin(seed*57+time)*fault*18;py+=Math.cos(seed*41+time)*fault*12;}
 out[0]=px;out[1]=py;out[2]=depth;
 out[3]=(view.dotSize||2)*d[n+12]*perspective*(.97+Math.sin(time*1.3+seed*18)*.06*motion);
 return out;
}
