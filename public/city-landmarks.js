// Origins and rotations fitted to IGN BD TOPO roof/ground outlines in public/paris-data coordinates.
export const parisLandmarks=[
  {key:'eiffel',x:3257.7,z:2420.6,yaw:.802,ids:['162158','162159','162160','162699']},
  {key:'notredame',x:7317.25,z:3007.75,yaw:1.119,ids:['305564422','305564421','245184816','245184819','245184817','245184818']},
  {key:'sacre',x:6807.6,z:-739.5,yaw:.068,ids:['253248827','253248831','253248847']}
];
const TAU=Math.PI*2;
const iron='#886858',highlight='#ac8670',darkIron='#634f50',amber='#d4a477';
const chalk='#e8d8b9',pale='#f4e6cd',edge='#c3aa99',slate='#71808a';
const whiteStone='#f4ead8',shadowStone='#d3c9b7',roofStone='#deded1';

function eiffel(b){
  // Height, centreline half-width and truss half-width of the four spreading piers.
  const sections=[[.9,50,8.65],[12,44.8,7.5],[27,38.5,6.3],[42,33,5.32],[57,29.3,4.8],[73.5,24.9,4.07],[92,20.1,3.46],[115,15.6,2.68]];
  for(const sx of [-1,1])for(const sz of [-1,1]){
    b.box(sx*50,0,sz*50,23.5,1.44,23.5,'#b79d89');
    b.box(sx*50,1.44,sz*50,19.2,1.04,19.2,'#c4a78e');
    const pt=([y,r,w],i)=>[sx*r+[-1,1,1,-1][i]*w,y,sz*r+[-1,-1,1,1][i]*w];
    for(let j=0;j<sections.length-1;j++){
      const from=sections[j],to=sections[j+1],g=Math.max(.42,from[2]*.13);
      for(let i=0;i<4;i++){
        const n=(i+1)%4,a=pt(from,i),c=pt(from,n),d=pt(to,i),e=pt(to,n);
        b.tube(a,d,g,g*.88,i<2?iron:darkIron,5);
        b.tube(a,c,g*.57,g*.57,iron,4);
        b.tube(a,e,g*.36,g*.33,highlight,4);b.tube(c,d,g*.34,g*.3,iron,4);
      }
    }
  }
  function perimeter(y,r,width,shade){
    const points=[[-r,y,-r],[r,y,-r],[r,y,r],[-r,y,r]];
    for(let i=0;i<4;i++)b.tube(points[i],points[(i+1)%4],width,width,shade,5);
  }
  function deck(y,r,open){
    const width=r-open;
    b.box(0,y,-r+width/2,2*r,1.45,width,darkIron);b.box(0,y,r-width/2,2*r,1.45,width,darkIron);
    for(const s of [-1,1])b.box(s*(r-width/2),y,0,width,1.45,2*open,iron);
    [0,1,2.55].forEach((rise,i)=>perimeter(y+rise,r,.36+i*.04,i%2?amber:highlight));
    for(let i=-r+1;i<r;i+=3.4)for(const s of [-1,1]){
      b.tube([i,y+.5,s*r],[i,y+2.55,s*r],.13,.12,iron,4);
      b.tube([s*r,y+.5,i],[s*r,y+2.55,i],.13,.12,iron,4);
    }
  }
  deck(55.6,35.1,14.3);deck(113.4,19.15,7);
  for(const level of [[58,30],[116,17]])for(const s of [-1,1]){
    b.box(0,level[0],s*(level[1]-.8),level[1]*1.3,2.6,2.8,'#9c7868');
    b.box(0,level[0]+2.6,s*(level[1]-.8),level[1]*1.34,.43,3.5,highlight);
  }
  // The four decorative arches span between the splayed base feet, leaving the esplanade open.
  for(let rotate=0;rotate<2;rotate++)for(const s of [-1,1]){
    const p=(f,h,j)=>{const x=f*48,z=s*(34.3+Math.abs(f)*12),y=h+j;return rotate?[z,y,x]:[x,y,z];};
    let last=null;
    for(let i=0;i<=18;i++){
      const f=i/9-1,h=11+37.9*Math.sqrt(Math.max(0,1-f*f));
      const v=p(f,h,0);
      if(last)b.tube(last,v,1.01,1.01,iron,6);
      if(i%2===0&&i>0&&i<18)b.tube(v,p(f,55,0),.37,.43,highlight,5);
      last=v;
    }
  }
  const upper=[[115,14.7],[137,11.25],[163,8.3],[191,6.05],[223,4.15],[254,3.40],[275.5,3.1]];
  for(let j=0;j<upper.length-1;j++){
    const [y,r]=upper[j],[top,s]=upper[j+1],points=(h,w)=>[[-w,h,-w],[w,h,-w],[w,h,w],[-w,h,w]];
    const low=points(y,r),high=points(top,s),g=.54+ r*.028;
    for(let i=0;i<4;i++){
      const n=(i+1)%4;
      b.tube(low[i],high[i],g,g*.91,iron,5);
      b.tube(low[i],high[n],g*.43,g*.38,highlight,4);
      b.tube(low[n],high[i],g*.41,g*.37,darkIron,4);
    }
    perimeter(y,r,.43,iron);
  }
  b.tube([0,118,0],[0,274,0],1.95,1.16,'#a88976',8);
  deck(274.4,7.8,2.1);
  b.tube([0,277,0],[0,280.4,0],4.45,3.8,iron,12);
  b.tube([0,280.4,0],[0,291.2,0],3,.84,highlight,8);
  b.tube([0,291,0],[0,314,0],.85,.48,'#969092',8);
  b.tube([0,313.7,0],[0,330,0],.49,.12,'#c7baba',7);
  for(const y of [292.5,299,306,312,317])b.tube([0,y,0],[0,y+.7,0],1.1,1.08,amber,7);
}
function pitchedRoof(b,x,z,halfW,halfD,at,rise,col){
  const left=[x-halfW,at,z-halfD],right=[x+halfW,at,z-halfD],backL=[x-halfW,at,z+halfD],backR=[x+halfW,at,z+halfD],
    frontTop=[x,at+rise,z-halfD],backTop=[x,at+rise,z+halfD];
  b.face('roof',left,backL,backTop,frontTop,col,[[0,0],[halfD/3,0],[halfD/3,3],[0,3]]);
  b.face('roof',frontTop,backTop,backR,right,col,[[0,3],[halfD/3,3],[halfD/3,0],[0,0]]);
  b.tri('felt',left,right,frontTop,chalk);b.tri('felt',backL,backTop,backR,chalk);
}
function pointed(b,x,y,z,w,h,base='felt',col='#555e69',side=1){
  const low=y+h*.69,l=x-w*.5,r=x+w*.5;
  b.face(base,[l,y,z],[r,y,z],[r,low,z],[l,low,z],col);
  b.tri(base,[l,low,z],[r,low,z],[x,y+h,z],col);
  for(const s of [-1,1]){
    b.tube([x+s*w*.54,y-.02,z+side*.09],[x+s*w*.54,low,z+side*.09],.14,.14,pale,5);
    b.tube([x+s*w*.54,low,z+side*.09],[x,y+h+.24,z+side*.09],.14,.12,pale,5);
  }
}
function rose(b,x,y,z,r,axis='front'){
  const map=(u,v,d=0)=>axis==='front'?[x+u,y+v,z-d]:[x+d,y+v,z+u];
  const center=map(0,0,.1);
  const palette=['#7d93a6','#946f82','#97a2a4','#b59996'];
  for(let i=0;i<20;i++){
    const a=i*TAU/20,c=(i+1)*TAU/20,p=map(Math.cos(a)*r,Math.sin(a)*r,.1),q=map(Math.cos(c)*r,Math.sin(c)*r,.1);
    b.tri('plain',p,q,center,palette[i%4]);b.tube(p,q,.29,.29,chalk,5);
    if(i%2===0)b.tube(center,p,.095,.14,'#c9b4a2',4);
  }
}
function cross(b,x,y,z,h,col){
  b.tube([x,y,z],[x,y+h,z],.105,.082,col,5);
  b.tube([x-h*.25,y+h*.66,z],[x+h*.25,y+h*.66,z],.11,.08,col,5);
}
function notreDame(b){
  const front=-70,fac=43.5,zDepth=16.5;
  b.box(0,0,-7.2,35.8,14.1,111,chalk);
  b.box(0,14,-6.5,20.6,21.2,108.4,chalk);pitchedRoof(b,0,-6.5,11.4,54.2,35.1,9.0,slate);
  b.box(0,0,0,48.2,28.7,14.2,'#ddccb0');b.box(0,28.6,0,35.5,5.9,14.2,chalk);
  b.tube([0,.1,43],[0,15,43],17.1,17.1,chalk,14);
  b.tube([0,14.8,41],[0,34.5,41],10.4,10.2,chalk,14);
  b.tube([0,34.5,41],[0,43.8,41],11.4,.25,slate,14);
  for(const sx of [-1,1]){
    for(let sz=-45;sz<=37;sz+=10.1){
      const a=sx*19,c=sx*11;
      b.box(a,0,sz,1.85,15.3,2.0,edge);
      b.tube([a,14.5,sz],[sx*15.0,20.5,sz],.64,.59,chalk,5);
      b.tube([sx*15,20.5,sz],[c,22.8,sz],.59,.52,pale,5);
      b.tube([a,15.3,sz],[c,27.3,sz],.64,.46,edge,5);
      b.tube([a,15.3,sz],[a,19.3,sz],.8,.075,chalk,4);
      b.box(sx*10.39,23.8,sz+.33,.2,6.7,4.55,'#697c83','plain');
    }
    rose(b,sx*24.18,20.5,0,5.3,'side');
  }
  b.box(0,0,front+zDepth/2,fac,42.2,zDepth,chalk);
  for(const y of [15.5,18.65,29.5,40.6,42.25])b.box(0,y,front+zDepth/2,fac+.7,.7,zDepth+.74,y===40.6?edge:pale);
  for(const sx of [-1,1]){
    const x=sx*14.6,z=front+8.65;
    b.box(x,41.7,z,14.25,26.08,14.9,chalk);
    for(const dir of [-1,1])for(const off of [-3.4,3.4]){
      pointed(b,x+off,46.6,z+dir*7.5,4.9,16,'felt','#535b60',dir);
      b.box(x+off,46.5,z+dir*7.65,.35,12.7,.39,edge);
    }
    b.box(x,66.7,z,15.05,.8,15.6,edge);b.box(x,67.5,z,15.4,1.1,15.95,pale);
    for(const u of [-1,1])for(const v of [-1,1])b.box(x+u*6.8,66.5,z+v*6.99,.88,2.55,.9,pale);
  }
  for(const x of [-14.0,0,14.0]){
    pointed(b,x,0,front-.08,10.8,15,'felt','#b8a08e',-1);
    pointed(b,x,0,front-.21,8.4,12.9,'felt','#826d68',-1);
    pointed(b,x,.04,front-.36,6.9,10.7,'felt','#5b5056',-1);
    b.box(x,.1,front-.40,.48,8.8,.40,pale);
  }
  for(let x=-20;x<21;x+=1.72){
    b.tube([x,16.8,front-.5],[x,17.82,front-.5],.35,.3,edge,6);
    b.ball(x,18.02,front-.5,.31,.37,.25,pale,6,3);
  }
  rose(b,0,26.2,front-.12,4.85);
  for(let x=-20;x<21;x+=2.1)pointed(b,x,32.1,front-.17,1.44,6.5,'felt','#8c8782',-1);
  for(const x of [-21.7,-7.25,7.25,21.7])b.box(x,0,front-.16,1.49,42.2,1.05,pale);
  b.tube([0,39,0],[0,52,0],4.3,2.3,slate,8);
  b.tube([0,50.8,0],[0,61.3,0],2.55,2,slate,8);
  for(let i=0;i<8;i++){
    const a=i*TAU/8,r=2.54;
    b.tube([r*Math.cos(a),52,r*Math.sin(a)],[r*.75*Math.cos(a),62.4,r*.75*Math.sin(a)],.16,.14,'#a1aaa4',5);
  }
  b.tube([0,60.4,0],[0,92.8,0],2.48,.12,'#829193',8);cross(b,0,92.6,0,3.4,'#a58b6c');
}
function lathe(b,x,z,levels,col,n=18){
  for(let j=0;j<levels.length-1;j++){
    const [y,r]=levels[j],[upper,s]=levels[j+1];
    for(let i=0;i<n;i++){
      const a=i*TAU/n,d=(i+1)*TAU/n,pt=(a,h,k)=>[x+k*Math.cos(a),h,z+k*Math.sin(a)];
      b.face('felt',pt(a,y,r),pt(d,y,r),pt(d,upper,s),pt(a,upper,s),col,
        [[i/n*5,y/5],[(i+1)/n*5,y/5],[(i+1)/n*5,upper/5],[i/n*5,upper/5]]);
    }
  }
}
function cupola(b,x,z,base,r,height,major=false){
  const rings=[[0,r],[height*.08,r*1.035],[height*.29,r*.96],[height*.58,r*.78],[height*.83,r*.47],[height,r*.145]].map(([dy,rad])=>[base+dy,rad]);
  lathe(b,x,z,rings,major?'#f0e8d6':roofStone,major?24:16);
  for(let i=0;i<(major?12:8);i++){
    const a=i*TAU/(major?12:8);
    for(let j=0;j<rings.length-1;j++){
      const p=([y,rad])=>[x+rad*1.012*Math.cos(a),y,z+rad*1.012*Math.sin(a)];
      b.tube(p(rings[j]),p(rings[j+1]),major?.11:.08,major?.11:.08,'#cfc7b7',4);
    }
  }
  const h=base+height;
  b.tube([x,h,z],[x,h+height*.11,z],r*.17,r*.16,shadowStone,10);
  b.ball(x,h+height*.12,z,r*.195,height*.047,r*.195,whiteStone,10,4);
  cross(b,x,h+height*.15,z,major?2.9:1.8,'#a89269');
}
function sacreCoeur(b){
  b.box(0,.01,-9,37.5,18.9,69.2,whiteStone);
  b.box(0,0,-.6,48.7,22.4,33.8,whiteStone);
  for(const s of [-1,1])b.tube([s*17.4,0,-36],[s*17.4,19.1,-36],6.2,6.2,shadowStone,12);
  b.tube([0,0,-41],[0,23,-41],13.1,13.1,whiteStone,18);
  b.tube([0,20.7,0],[0,44,0],13.2,11.6,whiteStone,20);
  b.tube([0,39,0],[0,40.2,0],13,13.1,shadowStone,20);
  for(let i=0;i<16;i++){
    const a=i*TAU/16,x=Math.cos(a)*12.3,z=Math.sin(a)*12.3;
    b.tube([x,30,z],[x*.98,38,z*.98],.59,.59,shadowStone,7);
    b.ball(x*.989,38,z*.989,.72,1,.72,whiteStone,7,3);
  }
  cupola(b,0,0,43.5,12.5,31,true);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const x=sx*15.2,z=sz*14.3;
    b.tube([x,18.8,z],[x,32.1,z],6.4,5.2,whiteStone,14);
    cupola(b,x,z,32,5.75,11.9);
  }
  const bell=-59.6;
  b.box(0,0,bell,14.0,52.0,12.5,whiteStone);
  b.box(0,48.3,bell,15.5,1.1,14.2,shadowStone);
  b.box(0,52,bell,12.4,13.1,10.7,whiteStone);
  for(const sx of [-1,1])for(const sz of [-1,1]){
    b.box(sx*4.98,51.4,bell+sz*4.4,1.31,13.2,1.36,whiteStone);
    const z=bell+sz*5.48;
    b.box(sx*2.5,52.9,z,2.5,8.8,.15,'#858780');
    b.ball(sx*2.5,61.7,z,1.25,1.45,.16,'#858780',8,4);
  }
  cupola(b,0,bell,64.1,7.1,14.2);
  b.box(0,0,24.3,30.8,15.4,10.6,whiteStone);
  b.tri('felt',[-15.4,15.3,29.62],[15.4,15.3,29.62],[0,23.9,29.62],whiteStone);
  for(const x of [-8.7,0,8.7]){
    b.box(x,.1,29.67,5.0,5.8,.25,'#9b9286');b.ball(x,5.85,29.7,2.49,3.2,.17,'#9b9286',12,5);
    b.box(x,.16,29.82,3.94,5.5,.12,'#645e5b');b.ball(x,5.68,29.85,1.96,2.55,.10,'#645e5b',10,4);
  }
  b.box(0,11.8,29.7,31.6,.72,.81,shadowStone);
  for(const s of [-1,1])for(let j=0;j<3;j++){
    b.box(s*(14.8-j*.2),j*4.4,29.6,1.16,4.4,1.08,whiteStone);
  }
}
export function famousLandmark(key,Batch){
  const b=new Batch();
  ({eiffel,notredame: notreDame,sacre: sacreCoeur})[key](b);
  return b;
}
