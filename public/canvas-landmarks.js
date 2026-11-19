// Lightweight silhouettes for the software chase view. Local shapes use [x, height, z].
const TAU=Math.PI*2;
const anchors={
  eiffel:{id:'eiffel',x:3257.7,y:2420.6,yaw:.802,range:1600},
  dame:{id:'dame',x:7317.25,y:3007.75,yaw:1.119,range:850},
  coeur:{id:'coeur',x:6807.6,y:-739.5,yaw:.068,range:850}
};
const skipped=new Set(['162158','162159','162160','162699','305564422','305564421','245184816','245184819','245184817','245184818','253248827','253248831','253248847']);
export function skipLandmark(id){return skipped.has(String(id));}
const lit=['#dfc4ad','#c3a99d','#ecd8bc'],shadow=['#b99c91','#a38a83','#d2b6a5'];
function builder(anchor){
  const {x,y,yaw}=anchor,c=Math.cos(yaw),s=Math.sin(yaw),faces=[];
  const toWorld=p=>[x+p[0]*c+p[2]*s,y-p[0]*s+p[2]*c,p[1]];
  function face(verts,color){
    const p=verts.map(toWorld),len=p.length;
    faces.push({p,color,x:p.reduce((a,v)=>a+v[0]/len,0),y:p.reduce((a,v)=>a+v[1]/len,0)});
  }
  function line(a,b,width,color){
    const p=[toWorld(a),toWorld(b)];faces.push({line:width,p,color,x:(p[0][0]+p[1][0])*.5,y:(p[0][1]+p[1][1])*.5});
  }
  function box(x,z,r,d,b,t,pal=lit){
    const l=x-r,rr=x+r,fr=z-d,ba=z+d;
    face([[l,b,fr],[rr,b,fr],[rr,t,fr],[l,t,fr]],pal[0]);
    face([[l,b,ba],[rr,b,ba],[rr,t,ba],[l,t,ba]],pal[1]);
    face([[l,b,fr],[l,b,ba],[l,t,ba],[l,t,fr]],pal[0]);
    face([[rr,b,fr],[rr,b,ba],[rr,t,ba],[rr,t,fr]],pal[1]);
    face([[l,t,fr],[rr,t,fr],[rr,t,ba],[l,t,ba]],pal[2]);
  }
  function rings(x,z,profile,n,pal){
    const row=([h,rx,rz])=>Array.from({length:n},(_,i)=>{const a=TAU*i/n;return [x+Math.cos(a)*rx,h,z+Math.sin(a)*(rz??rx)];});
    for(let j=1;j<profile.length;j++){
      const a=row(profile[j-1]),b=row(profile[j]);
      for(let i=0;i<n;i++){const k=(i+1)%n;const light=(Math.sin((i+.5)/n*TAU)+Math.cos((i+.5)/n*TAU))*.35+.5;
        face([a[i],a[k],b[k],b[i]],pal[Math.min(pal.length-1,Math.floor(light*pal.length))]||pal[0]);}
    }
  }
  function gothicWindow(x,z,w,base,h,col,side=false){
    const p=[[-w,base],[-w,base+h*.56],[-w*.62,base+h*.81],[0,base+h],[w*.62,base+h*.81],[w,base+h*.56],[w,base]];
    const at=([u,v])=>side?[x,v,z+u]:[x+u,v,z];face(p.map(at),col);
    line(at([0,base+.6]),at([0,base+h*.87]),.24,'#c5b4a3');
  }
  return {m:anchor,faces,face,line,box,rings,gothicWindow};
}
function eiffel(){
  const b=builder(anchors.eiffel),oil=['#8c6958','#a1816a','#6e5960','#ae8a6d'];
  const levels=[[0,46.0,17.7],[14,40.2,15.4],[31,32.8,12.8],[57,23.2,9.7],[83,16.4,7.5],[115,11.2,6.0],[145,7.4,4.15],[181,5.2,2.8],[226,3.8,2.15],[271,2.7,1.3]];
  for(const sx of [-1,1])for(const sz of [-1,1]){
    for(let j=1;j<levels.length;j++){
      const [ha,ra,wa]=levels[j-1],[hb,rb,wb]=levels[j];
      const pr=(h,r,w,i)=>[sx*r+([-1,1,1,-1][i])*w*.5,h,sz*r+([-1,-1,1,1][i])*w*.5];
      for(let k=0;k<4;k++){
        const i=(k+1)%4,a=pr(ha,ra,wa,k),z=pr(hb,rb,wb,k),aa=pr(ha,ra,wa,i),zz=pr(hb,rb,wb,i);
        b.line(a,z,Math.max(.48,wa*.13),oil[(k+(sx>0?1:0))%4]);
        b.line(a,zz,Math.max(.28,wa*.057),oil[1]);b.line(aa,z,Math.max(.25,wa*.045),oil[2]);
        b.line(z,zz,Math.max(.45,wa*.08),oil[0]);
      }
    }
    b.box(sx*46,sz*46,10,10,0,1.9,['#cbb598','#b9a393','#ddc5a3']);
  }
  for(const [h,r,d] of [[55.3,35.4,4.1],[114.2,21.5,3.5],[273,7.8,4.7]]){
    b.box(0,0,r,r,h,h+d,oil);b.box(0,0,r+.5,r+.5,h+d-.4,h+d+.1,['#ae8b70','#897165','#c7a67c']);
  }
  for(const s of [-1,1])for(const along of [0,1]){
    const control=[];for(let j=0;j<=16;j++){
      const x=-36+j*4.5,h=10+38*Math.sqrt(Math.max(0,1-(x/36)**2)),r=43-h*.35;
      control.push(along?[s*r,h,x]:[x,h,s*r]);
    }
    for(let i=1;i<control.length;i++)b.line(control[i-1],control[i],1.0,'#927563');
  }
  b.rings(0,0,[[278,8],[281,6.5],[285,5.4],[288,3.1],[299,2.6],[304,.95]],12,oil);
  b.line([0,299,0],[0,327,0],1.0,'#8b7166');b.line([0,314,0],[0,330,0],.45,'#a6998d');
  return b;
}
function notreDame(){
  const b=builder(anchors.dame),roof=['#66848a','#53727a','#8fa29b'];
  // The western twin towers frame the nave, apse and crossing spire.
  b.box(0,-8,18,54.5,0,29.5);b.box(0,0,25.7,7.1,0,33.3);
  b.face([[-17,29,-56],[17,29,-56],[0,43.5,-56]],shadow[0]);
  for(const direction of [-1,1]){b.face([[0,43.5,-56],[direction*18,29,-56],[direction*18,29,39],[0,43.5,39]],direction<0?roof[1]:roof[0]);}
  b.rings(0,38,[[0,17.9],[25,17.9],[29,16],[40.2,2]],12,[lit[0],shadow[1],roof[0],roof[1]]);
  for(const sign of [-1,1]){
    const x=sign*12.35,z=-62;
    b.box(x,z,7.7,10.8,0,46,lit);b.box(x,z,7.9,11,44,46.1,shadow);
    b.box(x,z,7.25,10.15,46.1,67.2,lit);b.box(x,z,7.8,10.5,66.2,68.2,shadow);
    b.box(x,z,7.4,10.2,68,69.0,lit);
    for(const col of [-1,1]){
      for(const faceZ of [z-10.27,z+10.27])b.gothicWindow(x+col*3.35,faceZ,2.55,47.4,17.1,'#756d70');
      b.gothicWindow(x+sign*7.37,z+col*3.25,2.35,47.6,17,'#6f6c6c',true);
    }
    for(let i=0;i<7;i++){
      const zz=-42+i*12,xx=sign*18;b.gothicWindow(xx+.08*sign,zz,2.6,16.9,10.5,'#7d8b97',true);
      b.box(sign*21.3,zz,.65,1.05,0,18.2,shadow);
      b.line([sign*16.2,25.8,zz],[sign*21.3,17.4,zz],1.0,'#d7c3a6');
    }
  }
  b.box(0,-61.5,19.85,11,0,43.4,lit);b.box(0,-62.1,19.99,11,19.6,21.2,shadow);
  for(const x of [-12,0,12])for(const z of [-72.65]){
    b.gothicWindow(x,z,4.7,1,15.3,'#a89686');b.gothicWindow(x,z-.03,3.9,1,13.8,'#6e655f');
  }
  const z=-72.69;for(let i=0;i<24;i++){
    const a=i/24*TAU,aa=(i+1)/24*TAU;
    b.face([[0,32,z],[Math.cos(a)*6.35,32+Math.sin(a)*6.35,z],[Math.cos(aa)*6.35,32+Math.sin(aa)*6.35,z]],i%3?'#877f91':'#9b8997');
    b.line([0,32,z-.1],[Math.cos(a)*6.1,32+Math.sin(a)*6.1,z-.1],.24,'#d4c2ac');
  }
  for(let i=0;i<17;i++)b.gothicWindow(-18+i*2.24,-72.8,.62,21.5,3.9,'#998b81');
  b.rings(0,0,[[37,5.2],[45,5],[52,3.9],[56,3.5],[90,.35],[95,.09]],8,[roof[0],roof[1],roof[2]]);
  b.line([0,90,0],[0,96,0],.24,'#8a7263');return b;
}
function sacreCoeur(){
  const b=builder(anchors.coeur),white=['#c1b6b3','#d7c9bd','#e3d4c0','#f1e2ce'],bright=['#dbccbe','#c4b9b4','#f0dfc9'];
  b.box(0,0,23,32,0,20,bright);
  for(const s of [-1,1]){b.box(s*19,2,7,18,0,23,bright);b.box(s*14,28,6.4,4.2,0,21,bright);}
  function dome(x,z,r,base,cap){
    const profile=[[base,r*.95],[base+.09*cap,r],[base+.18*cap,r*.92],[base+.32*cap,r*.88],[base+.41*cap,r],[base+.47*cap,r*.97],[base+.63*cap,r*.81],[base+.76*cap,r*.57],[base+.82*cap,r*.31],[base+.88*cap,r*.16],[base+.93*cap,r*.18],[base+cap,r*.01]];
    b.rings(x,z,profile,18,white);
    for(let i=0;i<14;i++){
      const a=i*TAU/14,s=Math.sin(a),c=Math.cos(a),z0=z+s*r*.93,x0=x+c*r*.93,dy=.16*cap;
      b.line([x0,base+.16*cap,z0],[x0,base+.16*cap+dy,z0],Math.max(.42,r*.062),'#9e9ca1');
      if(i%2===0)b.line([x+c*r*.94,base+.47*cap,z+s*r*.94],[x+c*r*.31,base+.82*cap,z+s*r*.31],Math.max(.28,r*.035),'#e2d7ca');
    }
    b.line([x,base+cap,z],[x,base+cap+1.4,z],.19,'#857f80');
  }
  dome(0,0,13.6,23,59);
  for(const s of [-1,1]){dome(s*17,13,7.1,18,28);dome(s*17,-17,6.9,19,26);}
  b.box(0,-59.8,5.7,5.7,0,52,bright);dome(0,-59.8,6.3,49,32);
  for(let i=-1;i<=1;i++){
    const x=i*8.8;b.box(x,32.5,4.5,3.8,0,12.9,bright);
    b.gothicWindow(x,36.4,3.55,.3,10.4,'#857c7d');
    dome(x,31,3.9,12.9,5.3);
  }
  for(let j=0;j<7;j++)b.box(0,40+j*1.2,18.4+j*.35,.75,0,2.4-j*.31,['#d8c7b4','#c1b4ae','#eadbc8']);
  return b;
}
export const grandParisModels=[eiffel(),notreDame(),sacreCoeur()];
