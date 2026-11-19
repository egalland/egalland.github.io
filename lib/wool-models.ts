import {paintWoolSurface} from './wool-material';
import type {Place,Trip} from './frontier-geography';
import {cameraSkew} from './frontier-camera';

type V=[number,number,number];
type Face={v:V[];color:string;seam?:boolean};
type Screen={x:number;y:number};
type Project=(p:Place)=>Screen;
export type WoolModel={kind:string;point:Place;heading?:number;running?:boolean;quantity?:number;cargoColor?:string;active?:boolean;size?:number;phase?:number};
export const travelHeading=(trip?:Trip|null,fallback=0)=>trip&&trip.from.face===trip.to.face?Math.atan2(trip.to.v-trip.from.v,trip.to.u-trip.from.u):fallback;
const shade=(hex:string,n:number)=>{const a=hex.replace('#','');return '#'+[0,2,4].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(a.slice(i,i+2),16)*n))).toString(16).padStart(2,'0')).join('');};

/** World-space polygon models. All faces and animated parts are projected with
 * the terrain camera, so a full orbit never rotates a flat billboard. */
export function drawWoolModel(ctx:CanvasRenderingContext2D,model:WoolModel,project:Project,zoom:number,now:number,reduced=false){
  const faces:Face[]=[],angle=model.heading??0,co=Math.cos(angle),si=Math.sin(angle),base=project(model.point);
  const px=project({...model.point,u:model.point.u+1}),py=project({...model.point,v:model.point.v+1});
  const skew=cameraSkew(zoom),rise=Math.sqrt(1-skew*skew)*zoom;
  const world=(p:V):V=>[p[0]*co-p[1]*si,p[0]*si+p[1]*co,p[2]];
  const screen=(p:V)=>{const [x,y,z]=world(p);return {x:base.x+x*(px.x-base.x)+y*(py.x-base.x),y:base.y+x*(px.y-base.y)+y*(py.y-base.y)-z*rise};};
  const depth=(p:V)=>{const [x,y,z]=world(p);return (x*(px.y-base.y)+y*(py.y-base.y))/skew+z*zoom*Math.sqrt(1-skew*skew);};
  const polygon=(v:V[],color:string,seam=false)=>faces.push({v,color,seam});
  const box=(x:number,y:number,z:number,w:number,d:number,h:number,color:string,seam=true)=>{
    if(Math.min(w,d,h)>2.5){
      const radius=Math.min(w,d,h)*.15,bevel=Math.min(h*.16,.7),ring=(inset:number,zr:number):V[]=>[
        [-w/2+radius,-d/2+inset], [w/2-radius,-d/2+inset], [w/2-inset,-d/2+radius], [w/2-inset,d/2-radius],
        [w/2-radius,d/2-inset],[-w/2+radius,d/2-inset],[-w/2+inset,d/2-radius],[-w/2+inset,-d/2+radius],
      ].map(([a,b])=>[x+a,y+b,zr]);
      const low=ring(0,z+bevel),high=ring(0,z+h-bevel),cap=ring(bevel,z+h);
      for(let i=0;i<8;i++){const j=(i+1)%8;polygon([low[i],low[j],high[j],high[i]],shade(color,.8+.13*Math.sin(i*Math.PI/4+1)),seam);polygon([high[i],high[j],cap[j],cap[i]],shade(color,1.06),false);}
      // Four textured quads cover the rounded cap, preserving a soft textile roof.
      const mid:V=[x,y,z+h];for(let i=0;i<8;i+=2)polygon([mid,cap[i],cap[(i+1)%8],cap[(i+2)%8]],shade(color,1.1),seam);
      return;
    }
    const a:V[]=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z],[x-w/2,y-d/2,z+h],[x+w/2,y-d/2,z+h],[x+w/2,y+d/2,z+h],[x-w/2,y+d/2,z+h]];
    for(const [ids,light] of [[[0,1,5,4],.7],[[1,2,6,5],.86],[[2,3,7,6],.92],[[3,0,4,7],.76],[[4,5,6,7],1.12]] as [number[],number][])polygon(ids.map(i=>a[i]),shade(color,light),seam);
  };
  const puff=(x:number,y:number,z:number,rx:number,ry:number,rz:number,color:string)=>{
    const rows=5,segments=10;
    const vertex=(i:number,j:number):V=>{const phi=-Math.PI/2+i/rows*Math.PI,a=j/segments*Math.PI*2;return [x+Math.cos(phi)*Math.cos(a)*rx,y+Math.cos(phi)*Math.sin(a)*ry,z+Math.sin(phi)*rz];};
    for(let i=0;i<rows;i++)for(let j=0;j<segments;j++)polygon([vertex(i,j),vertex(i,j+1),vertex(i+1,j+1),vertex(i+1,j)],shade(color,.83+.22*(i/rows)+.05*Math.cos(j)),true);
  };
  const beam=(a:V,b:V,width:number,color:string)=>{
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],l=Math.hypot(dx,dy),length=Math.hypot(dx,dy,dz)||1;
    const side:V=l>0?[-dy/l*width/2,dx/l*width/2,0]:[width/2,0,0];
    const up:V=[-dz/length*side[1],dz/length*side[0],(dx*side[1]-dy*side[0])/length],v:V[]=[];
    for(const p of [a,b])for(const [s,t] of [[-1,-1],[1,-1],[1,1],[-1,1]])v.push([p[0]+side[0]*s+up[0]*t,p[1]+side[1]*s+up[1]*t,p[2]+side[2]*s+up[2]*t]);
    for(const ids of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]])polygon(ids.map(i=>v[i]),color,true);
  };
  const drum=(x:number,y:number,z:number,r:number,height:number,color:string,axis:'z'|'y'='z',spin=0)=>{
    const ring=(a:number,h:number):V=>axis==='z'?[x+Math.cos(a)*r,y+Math.sin(a)*r,z+h]:[x+Math.cos(a)*r,y+h,z+Math.sin(a)*r];
    const n=10;for(let i=0;i<n;i++){const a=i/n*Math.PI*2+spin,b=(i+1)/n*Math.PI*2+spin;polygon([ring(a,0),ring(b,0),ring(b,height),ring(a,height)],shade(color,.72+.3*(Math.cos(a)*.5+.5)),true);}
    polygon(Array.from({length:n},(_,i)=>ring(i/n*Math.PI*2+spin,height)),shade(color,1.12),true);
    if(axis==='y')polygon(Array.from({length:n},(_,i)=>ring(-i/n*Math.PI*2+spin,0)),shade(color,.8),true);
  };
  const t=model.running&&!reduced?now/1000:0,s=Math.sin(t*7),kind=model.kind;
  const teal='#5d8e87',steel='#8b9990',dark='#384649',ochre='#c9a16d',copper='#cf8c59';
  if(['worker','scout','army'].includes(kind)){
    const count=kind==='army'?Math.min(6,model.quantity??3):1;
    for(let i=0;i<count;i++){
      const ox=count>1?(i%3-1)*5.5:0,oy=count>1?Math.floor(i/3)*5.5:0,walk=model.running?Math.sin(t*7+i):0;
      const leg=(side:number)=>{const hip:V=[ox,oy+side*1.05,3.2],knee:V=[ox+walk*side*.9,oy+side,1.7],foot:V=[ox+walk*side*1.7,oy+side,0.5];beam(hip,knee,1.15,dark);beam(knee,foot,1.1,dark);box(foot[0]+.3,foot[1],.1,2,1.2,.65,'#493c35');};leg(-1);leg(1);
      puff(ox,oy,4.5,1.8,1.95,2.1,kind==='army'?'#8c7766':teal);puff(ox-1.3,oy,4.7,1.1,1.8,1.9,ochre);
      puff(ox+.1,oy,7.25,1.7,1.7,1.45,'#cda47c');puff(ox-.3,oy,7.9,1.95,1.9,1.1,kind==='army'?steel:ochre);
      puff(ox+1.65,oy-.8,7.5,.55,.63,.6,dark);puff(ox+1.65,oy+.8,7.5,.55,.63,.6,dark);puff(ox+2.02,oy-.8,7.5,.2,.36,.35,'#a4d2bf');puff(ox+2.02,oy+.8,7.5,.2,.36,.35,'#a4d2bf');
      box(ox+1.1,oy,7.55,2.2,3.2,.25,kind==='army'?steel:ochre);
      for(const side of [-1,1]){
        const hands:V=model.cargoColor?[ox+2.4,oy+side*1.25,4.5+walk*.12]:[ox-walk*side*.9,oy+side*1.9,3.4];
        beam([ox,oy+side*1.8,5.8],hands,.95,kind==='army'?'#817963':teal);
      }
      if(kind==='army')beam([ox+.5,oy-2,4],[ox+4,oy-2,4],.65,dark);
      if(model.cargoColor)box(ox+2.4,oy,4.15,2.7,3.4,.35,ochre);
    }
  }else if(kind==='truck'){
    box(0,0,1.5,12,6,1.5,dark);box(-2,0,3,7,6,3,teal);box(4,0,3,4,6,4,ochre);box(5.5,0,5,1.1,4.7,1.6,'#83b8b1',false);
    const wheel=model.running&&!reduced?(model.phase??t*26.5):0;
    for(const x of [-4,3.7])for(const y of [-3.5,2.5]){drum(x,y,2,1.7,1,'#3c4240','y',wheel);drum(x,y-.02,2,.7,1.04,steel,'y',wheel);}
    for(const y of [-2,2])box(6.1,y,3.2,.3,.9,.65,'#e9d2a0',false);
  }else if(['belt','splitter','loader','unloader'].includes(kind)){
    box(0,0,.2,7.8,7.8,.8,dark);box(0,0,1,7.6,5.5,.45,'#655e4f');
    for(const y of [-3.3,3.3])box(0,y,1,7.8,.65,1.1,ochre);
    for(let i=0;i<7;i++){const x=((i*1.15+(model.running?t*3:0))%8)-4;box(x,0,1.45,.28,5.4,.2,steel,false);}
    if(kind==='loader'||kind==='unloader'){
      for(const y of [-2.8,2.8])box(-2,y,1.8,1.1,1.1,3,teal);
      beam([-2,-2.8,4.5],[1.5+s*.6,-1.5,4.5+s*.5],.65,copper);box(2+s*.6,0,2.3,1,2,1,steel);
    }
    if(kind==='splitter'){box(0,0,1.6,3,4.5,1.2,teal);}
  }else if(kind==='chest'){
    box(0,0,.3,6,6,4,ochre);for(const x of [-2,2])box(x,0,4.3,.6,6.1,.4,dark);box(3.05,0,2.2,.3,1,.8,steel);
  }else if(kind==='deposit'){
    for(let i=0;i<18;i++){const a=i*2.399,r=3+Math.sqrt(i)*5;puff(Math.cos(a)*r,Math.sin(a)*r,1.4+(i%3)*.4,2+(i%3),1.8+(i%2),1.8+(i%3)*.45,model.cargoColor??steel);}
  }else{
    const size=model.size??(kind==='base'?40:kind==='rig'?24:24),q=size/24;
    box(0,0,.1,size*.98,size*.98,1.3,ochre);
    if(kind==='furnace'){
      box(-2,0,1.4,15,16,8,teal);drum(-3,0,9,6,3,steel);drum(-3,0,12,4,3,dark);box(-8,5,8,3,3,12,steel);drum(-8,5,20,2,1.2,ochre);
      box(6,0,2,3,9,5,dark);box(7.6,0,2.4,.3,7,3.5,model.running?shade('#efab52',1+s*.08):'#675340',false);
      for(let i=0;i<4;i++)box(6.5,-3+i*2,2.4,.4,.4,3.5,steel,false);
    }else if(kind==='press'){
      box(0,0,1.5,18,17,2.2,teal);for(const y of [-6,6])for(const x of [-6,6])box(x,y,3.5,2,2,12,steel);
      box(0,0,15,17,16,3,teal);box(0,0,6+(model.running?(1+s)*2:2),12,12,2.5,ochre);drum(0,0,10,2.5,5,steel);
    }else if(kind==='wiremill'){
      box(0,0,1.5,19,17,4,teal);drum(-4,-5,8,4,10,copper,'y',t*4);drum(5,-4,8,3,8,copper,'y',-t*5);for(const x of [-4,5])for(const y of [-5,5])box(x,y,4,1.5,1.5,6,steel);
    }else if(kind==='assembler'){
      box(0,0,1.5,19,18,4,teal);drum(0,0,5.5,5,1.3,dark);box(0,0,6.8,5,5,.5,copper);
      const b:V=[2+Math.cos(t*2)*3,-3+Math.sin(t*2)*2,10+Math.sin(t*2)*2];drum(-7,-6,5.5,2.5,3,ochre);beam([-7,-6,8],[-5,-4,15],2,ochre);beam([-5,-4,15],b,1.6,steel);beam(b,[b[0]+2,b[1],7],1,copper);
    }else if(kind==='rig'){
      box(0,0,1.5,19,18,3,teal);for(const x of [-7,7])for(const y of [-6,6])beam([x,y,4],[x*.5,y*.5,19],1.2,steel);box(0,0,18.5,11,10,2,ochre);drum(0,0,3+(model.running?s*1.5:0),2,14,copper,'z',t*5);
      for(let i=0;i<6;i++)box(Math.cos(i+t*5)*2,Math.sin(i+t*5)*2,4+i*1.7,2.3,1.2,.7,steel);
    }else if(kind==='lab'||kind==='mam'){
      box(0,0,1.5,18,17,7,teal);box(-4,-1,8.5,7,11,4,ochre);for(let i=0;i<3;i++)drum(3,-4+i*4,8.5,1.5,3.5,kind==='lab'?'#94c4ad':copper);
      box(9.1,0,4,.3,9,2,'#a4d2bd',false);beam([-7,6,8],[-7,6,17],.5,steel);box(-5.5,6,14,3,.3,2,ochre);
    }else if(kind==='warehouse'||kind==='base'||kind==='barracks'||kind==='repairbay'){
      box(0,0,1.4,19*q,18*q,8*q,teal);box(0,0,9.4*q,21*q,20*q,2*q,ochre);
      box(9.55*q,0,1.5,1*q,9*q,6*q,dark);for(const y of [-6,6])box(9.6*q,y*q,5*q,.25*q,2*q,2*q,'#abc8ad',false);
      for(let i=0;i<5;i++)box((-8+i*4)*q,0,11.4*q,.45*q,20*q,.4*q,copper);
      if(kind==='base'){
        beam([-7*q,7*q,11*q],[-7*q,7*q,19*q],.5*q,steel);box(-4*q,7*q,16*q,6*q,.35*q,3*q,ochre);
        drum(-5*q,-5*q,11.8*q,3.8*q,7*q,ochre);drum(-5*q,-5*q,18.8*q,4*q,.6*q,dark);drum(-5*q,-5*q,19.4*q,2*q,.5*q,copper);
        box(5*q,-5*q,11.8*q,3*q,3*q,3.5*q,steel);for(let i=0;i<3;i++)box(5*q,(-6+i)*q,14.3*q,3.2*q,.2*q,.35*q,dark);
        for(const y of [-5,0,5])box(-9.7*q,y*q,4*q,.7*q,3*q,2.3*q,'#aac0a8');
        for(let i=0;i<3;i++){box((12+i%2*3)*q,(5+i*1.8)*q,1.5*q,3*q,3*q,3*q,ochre);box((12+i%2*3)*q,(5+i*1.8)*q,4.5*q,.4*q,3.1*q,.2*q,dark);}
        for(const y of [-5,5]){beam([10*q,y*q,8*q],[11*q,y*q,8*q],.4*q,dark);puff(11*q,y*q,7.7*q,.7*q,.7*q,.9*q,'#e4c789');}
        for(let i=0;i<5;i++)box((10+i*.9)*q,0,(1.8-i*.25)*q,1.2*q,9*q,.5*q,ochre);
      }
      if(kind==='repairbay'){box(0,0,12,3,7,1.2,'#d2c8a2');box(0,0,12.2,7,3,1.2,'#d2c8a2');}
    }else{box(0,0,1.5,18,17,9,teal);box(0,0,10.5,20,19,2,ochre);}
  }
  ctx.save();ctx.lineJoin='round';
  faces.sort((a,b)=>a.v.reduce((s,p)=>s+depth(p),0)/a.v.length-b.v.reduce((s,p)=>s+depth(p),0)/b.v.length);
  for(const face of faces){const points=face.v.map(screen);ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=model.active===false?shade(face.color,.55):face.color;ctx.fill();paintWoolSurface(ctx,points,face.v,model.active===false?shade(face.color,.55):face.color,zoom);ctx.strokeStyle='#ead9b632';ctx.lineWidth=Math.max(.45,Math.min(1.7,zoom*.17));ctx.stroke();
    // Sparse stitched fibers stay attached to the surface, never to the screen.
    if(face.seam&&zoom>3.3&&points.length===4){
      const [a,b,d,c]=points,edge=(i:number,j:number)=>Math.hypot(...face.v[i].map((n,k)=>n-face.v[j][k]));
      const columns=Math.min(7,Math.floor(edge(0,1)/1.7)),rows=Math.min(7,Math.floor(edge(0,3)/1.7));
      const uv=(u:number,v:number)=>({x:a.x*(1-u)*(1-v)+b.x*u*(1-v)+c.x*(1-u)*v+d.x*u*v,y:a.y*(1-u)*(1-v)+b.y*u*(1-v)+c.y*(1-u)*v+d.y*u*v});
      ctx.strokeStyle='#f3dfba6b';ctx.lineWidth=Math.min(1.4,zoom*.15);
      for(const v of [.08,.92])for(let col=0;col<columns;col++){
        const u=(col+.5)/columns,du=.18/columns,dv=.045,p=uv(u-du,v-dv),q=uv(u+du,v+dv);
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
      }
    }
  }
  ctx.restore();
}
