import {getKikalmoLook,kikalmoFrame} from './kikalmo-avatar.js';
import {kikalmoShell} from './kikalmo-shell.js';

const views=new WeakMap(),tau=Math.PI*2;
function turntable(art,theta){
  let cache=views.get(art);if(!cache){cache=new Map();views.set(art,cache);}
  const angle=((Math.round(theta/tau*24)%24)+24)%24;
  if(cache.has(angle))return cache.get(angle);
  const shell=kikalmoShell(art),{w,h,depth,dims,pixels:front}=shell;
  const rear=art.rear.getContext('2d').getImageData(0,0,w,h).data;
  const sin=Math.sin(angle*tau/24),cos=Math.cos(angle*tau/24);
  const meter=dims.height/h,W=Math.ceil(Math.hypot(w,.85/meter))+4;
  const c=document.createElement('canvas');c.width=W;c.height=h;
  const g=c.getContext('2d'),out=g.createImageData(W,h),d=out.data,z=new Float32Array(W*h).fill(-Infinity);
  function segment(y,i,j,side,other){
    const aa=i*4,bb=j*4;
    const im=side===1?front:rear,im2=other===1?front:rear;
    const x1=side*depth[i]*(side===1?1:.83)/meter,x2=other*depth[j]*(other===1?1:.83)/meter;
    const a=i%w-(w-1)*.5,b=j%w-(w-1)*.5;
    const u=W*.5-a*cos+x1*sin,v=W*.5-b*cos+x2*sin;
    const near1=-x1*cos-a*sin,near2=-x2*cos-b*sin;
    const left=Math.max(0,Math.round(Math.min(u,v))),right=Math.min(W-1,Math.round(Math.max(u,v)));
    for(let dst=left;dst<=right;dst++){
      const f=Math.max(0,Math.min(1,(dst-u)/(v-u||1))),dist=near1+(near2-near1)*f,k=y*W+dst;
      if(dist<z[k])continue;z[k]=dist;
      const shade=(1-.10*Math.abs(sin))*(other!==side?.80:1),n=k*4;
      for(let ch=0;ch<3;ch++)d[n+ch]=(im[aa+ch]+(im2[bb+ch]-im[aa+ch])*f)*shade;
      d[n+3]=Math.max(im[aa+3],im2[bb+3]);
    }
  }
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=y*w+x;if(front[i*4+3]<30)continue;
      if(x===0||front[(i-1)*4+3]<30)segment(y,i,i,-1,1);
      if(x===w-1||front[(i+1)*4+3]<30){segment(y,i,i,1,-1);continue;}
      segment(y,i,i+1,-1,-1);segment(y,i,i+1,1,1);
    }
  }
  g.putImageData(out,0,0);
  const result={c,width:W*meter,height:dims.height,bottom:dims.bottom};
  cache.set(angle,result);if(cache.size>10)cache.delete(cache.keys().next().value);
  return result;
}
function limb(g,a,b,r,color){
  g.strokeStyle=color;g.lineWidth=r*2;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();
}
function bead(g,p,rx,ry,col){
  g.fillStyle=col;g.beginPath();g.ellipse(p[0],p[1],rx,ry,0,0,tau);g.fill();
}
const clothing=['#a17176','#768a6a','#745e77','#445d76','#ad7048','#917b63'];
export function drawKikalmoPuppet(g,e,x,ground,height,t,theta){
  const pose=e.pose||e,frame=kikalmoFrame(e.appearance,t);
  const art=getKikalmoLook(e.appearance,frame)?.art||getKikalmoLook(e.appearance,0)?.art;
  if(!art)return false;
  const a=art.appearance;
  const view=turntable(art,theta),m=height/1.78,cos=Math.cos(theta),sin=Math.sin(theta);
  const speed=Math.min(1.45,(Math.abs(pose.speed||0)||((pose.move||pose.moving)?2.4:0))/3);
  const phase=Number.isFinite(pose.walk)&&pose.walk?pose.walk:t*(speed>.1?8.3:2.5);
  const stride=Math.sin(phase)*speed,bounce=Math.abs(Math.cos(phase))*speed*.038,rag=e.ragdoll||pose.ragdoll,b=rag?.blend||0;
  const project=(p)=>[(p[0]*sin+p[2]*cos)*m,-p[1]*m];
  const blend=(joint,p)=>{const v=rag?.[joint];return v&&b?p.map((n,i)=>n+(v[i]-n)*b):p;};
  g.save();g.translate(x,ground);g.lineCap='round';
  function arm(s){
    const n=s<0?'left':'right',wave=s>0&&pose.emote,shot=s>0?(pose.fire||0):0;
    const p=project(blend(n+'Shoulder',[0,.87+bounce,s*.25]));
    const q=project(blend(n+'Elbow',[-stride*s*.14,.69+bounce+(wave?.27:0),s*.29]));
    const r=project(blend(n+'Hand',[-stride*s*.23+shot*.17,.52+bounce+(wave?.65:0)+shot*.1,s*(.32+(wave?.07:0))]));
    limb(g,p,q,.072*m,clothing[a.outfit]||clothing[0]);limb(g,q,r,.054*m,a.color);
    bead(g,r,.076*m,.085*m,a.color);
  }
  if(!a.costume){
    for(const s of [-1,1]){
      const n=s<0?'left':'right',leg=s*stride,hip=project(blend('hips',[0,.45+bounce,s*.14]));
      const knee=project(blend(n+'Knee',[leg*.13,.23+bounce,s*.14]));
      const foot=project(blend(n+'Foot',[leg*.22,.07+Math.max(0,-leg)*.09,s*.14]));
      limb(g,hip,knee,.071*m,'#59505c');limb(g,knee,foot,.064*m,'#554c58');bead(g,foot,.099*m,.055*m,'#4b3e45');
    }
    arm(sin>0?-1:1);
  }
  const width=view.width*m,H=view.height*m,bottom=view.bottom*m;
  if(b&&rag?.head&&rag?.hips){
    const hip=project(blend('hips',[0,.46,0])),head=project(blend('head',[0,1.28,0]));
    g.save();g.translate(...hip);g.rotate(Math.atan2(head[0]-hip[0],hip[1]-head[1]));
    g.drawImage(view.c,-width*.5,-bottom-H+.46*m,width,H);g.restore();
  }else{
    g.save();g.translate(0,-bounce*m);g.rotate(stride*.023);
    g.drawImage(view.c,-width*.5,-bottom-H,width,H);g.restore();
  }
  if(!a.costume)arm(sin>0?1:-1);
  g.restore();return true;
}
