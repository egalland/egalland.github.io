// Each line produces both a continuous construction stroke and point samples.
// No unrelated pictures are overlaid: both sides share these exact coordinates.
const TAU=Math.PI*2;
const ink='#225f58',warm='#cd573c',blue='#537a9c',purple='#9577b3';
export function createShape(kind){
 const paths=[],surfaces=[];
 const path=(vertices,color=ink,weight=1,group=0)=>{paths.push({vertices,color,weight,group});};
 const line=(a,b,c=ink,w=1,g=0)=>path([a,b],c,w,g);
 const rect=(x,y,w,h,z=0,c=ink,g=0)=>path([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z]],c,1,g);
 const curve=(fn,c=ink,w=1,g=0,n=110)=>path(Array.from({length:n+1},(_,i)=>fn(i/n)),c,w,g);
 const surface=(vertices,color)=>surfaces.push({vertices,color});
 const sphere=(x,y,z,r,c=warm,g=0)=>{
  for(let j=1;j<13;j++){const lat=j/13*Math.PI;curve(t=>[x+r*Math.sin(lat)*Math.cos(t*TAU),y+r*Math.cos(lat),z+r*Math.sin(lat)*Math.sin(t*TAU)],c,.7,g,90);}
  for(let j=0;j<12;j++){const a=j/12*Math.PI;curve(t=>[x+r*Math.cos(t*TAU)*Math.cos(a),y+r*Math.sin(t*TAU),z+r*Math.cos(t*TAU)*Math.sin(a)],c,.7,g,90);}
 };
 const card=(x,y,z,w,h,c=ink,g=0)=>{
  rect(x,y,w,h,z,c,g);line([x,y+h*.78,z],[x+w,y+h*.78,z],c,.7,g);
  for(let i=0;i<3;i++)line([x+w*.12,y+h*(.55-i*.15),z],[x+w*(.77-i*.1),y+h*(.55-i*.15),z],c,.7,g);
  surface([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],c);
 };
 if(kind==='hero'){
  sphere(0,0,0,1.05,'#e14a32');
  for(let j=0;j<3;j++)curve(t=>{const a=t*TAU,r=1.56+j*.16;return [Math.cos(a)*r,Math.sin(a)*r*(.27+j*.16),Math.sin(a)*r*.72+(j-1)*.19];},j===1?warm:ink,.9);
  card(-2.1,.66,.05,.72,.53,blue,1);card(1.15,-1.16,.15,.9,.65,warm,2);
  line([-1.5,.9,.05],[-.8,.52,.5],blue,.8,1);line([1.15,-.85,.15],[.77,-.48,.6],warm,.8,2);
 }else if(kind==='market'){
  card(-1.8,-1.13,0,3.6,2.26);line([-1.2,-1.13,0],[-1.2,.63,0],ink);
  for(let i=0;i<5;i++)line([-1.65,.38-i*.23,.03],[-1.34,.38-i*.23,.03],blue);
  for(let i=0;i<3;i++)rect(-1.01+i*.9,.03,.74,.43,.06,i===2?warm:ink);
  for(let i=0;i<6;i++){const h=[.25,.48,.36,.73,.6,.94][i]*.7;rect(-.94+i*.41,-.92,.22,h,.1,blue);}
  path([[-1,-.7,.18],[-.55,-.5,.18],[-.12,-.57,.18],[.3,-.25,.18],[.7,-.32,.18],[1.32,-.02,.18]],warm,2);
  card(1.04,.84,-.45,.85,.6,blue,1);card(-2.04,-1.44,.45,.84,.59,warm,2);
 }else if(kind==='kikalmo'){
  sphere(0,.16,0,.85,purple);sphere(-.68,.72,0,.31,purple);sphere(.68,.72,0,.31,purple);
  for(const side of [-1,1]){
   curve(t=>[side*.32+Math.cos(t*TAU)*.2,.39+Math.sin(t*TAU)*.23,.8],ink,1.6);
   curve(t=>[side*.3+Math.cos(t*TAU)*.075,.41+Math.sin(t*TAU)*.09,.96],warm,2);
  }
  curve(t=>[(t-.5)*.69,-.13-Math.sin(t*Math.PI)*.19,.84],warm,2.5);
  for(let i=0;i<3;i++)rect(-.86+i*.61,-1.28,.5,.49,.1,i===1?warm:purple);
  path([[-.75,-1.18,.14],[-.75,-.9,.14],[-.62,-1.07,.14],[-.5,-.9,.14],[-.5,-1.18,.14]],purple,1.5);
  path([[.38,-.91,.14],[.69,-.91,.14],[.535,-.91,.14],[.535,-1.18,.14]],purple,1.5);
  card(1.12,.12,-.1,.8,.62,warm,1);card(-1.9,-.73,.1,.77,.61,blue,2);
 }else if(kind==='maison'){
  const walls=[[[-1.55,-.85,-.95],[1.55,-.85,-.95]],[[1.55,-.85,-.95],[1.55,-.85,1.02]],[[-1.55,-.85,-.95],[-1.55,-.85,1.02]],[[-1.55,-.85,1.02],[1.55,-.85,1.02]],[[-.2,-.85,-.95],[-.2,-.85,.35]],[[-1.55,-.85,.35],[.5,-.85,.35]]];
  for(const [a,b] of walls){const c=[b[0],.65,b[2]],d=[a[0],.65,a[2]];path([a,b,c,d,a],ink);surface([a,b,c,d],blue);}
  for(let x=-1.5;x<1.56;x+=.26)line([x,-.85,-.95],[x,-.85,1.02],blue,.5);
  for(let z=-.95;z<1.03;z+=.26)line([-1.55,-.85,z],[1.55,-.85,z],blue,.5);
  path([[-1.3,-.79,-.7],[-.45,-.79,-.7],[-.45,-.79,.58],[1.27,-.79,.58],[1.27,.59,.58]],warm,2.2);
  card(1.05,.8,-.2,.76,.53,warm,1);
 }else if(kind==='body'){
  for(let j=0;j<3;j++)for(const d of [-.045,.045])curve(t=>{const a=t*TAU*(.76+j*.06),r=1.28-j*.32+d;return [Math.cos(a)*r,Math.sin(a)*r,j*.15];},[ink,blue,warm][j],1.3);
  path([[-1.62,-1.2,.2],[-.99,-1.2,.2],[-.77,-.96,.2],[-.54,-1.36,.2],[-.21,-.94,.2],[.05,-1.16,.2],[1.55,-1.16,.2]],warm,1.4);
  card(1.05,.57,-.2,.88,.66,blue,1);
 }else if(kind==='book'){
  for(const side of [-1,1]){
   const page=(u,y,z=0)=>[side*(.035+u*1.55),y,.2+Math.sin(u*Math.PI)*.4-z];
   for(let k=0;k<6;k++)for(const y of [-1,1])curve(t=>page(t,y,k*.025),warm,.65);
   for(let row=0;row<10;row++)curve(t=>page(.13+t*(row%4===3?.5:.74),.77-row*.16),ink,.7);
   line(page(1,-1),page(1,1),warm,1.4);
  }line([0,-1.05,.2],[0,1.05,.2],blue,1.3);
 }else if(kind==='redim'){
  for(const [w,h,z,c] of [[3.4,2.1,-.16,blue],[2.15,1.35,.17,ink]]){
   rect(-w/2,-h/2,w,h,z,c);for(const x of [-w/2,w/2])for(const y of [-h/2,h/2])rect(x-.06,y-.06,.12,.12,z,c);
  }
  path([[-.88,-.48,.2],[-.26,.37,.2],[.21,-.12,.2],[.55,.15,.2],[.88,-.48,.2]],ink,1.4);
  curve(t=>[.57+Math.cos(t*TAU)*.13,.42+Math.sin(t*TAU)*.13,.2],warm);
 }else if(kind==='atlas')sphere(0,0,0,1.35,ink);
 else if(kind==='timer'){
  for(let j=0;j<3;j++){
   const x=(j-1)*1.23,y=j===1?.3:-.25,c=[warm,ink,blue][j];
   curve(t=>[x+Math.cos(t*TAU)*.56,y+Math.sin(t*TAU)*.56,0],c,1.6);
   for(let k=0;k<12;k++){const a=k/12*TAU;line([x+Math.cos(a)*.43,y+Math.sin(a)*.43,.04],[x+Math.cos(a)*.49,y+Math.sin(a)*.49,.04],c);}
   path([[x-.15,y,.06],[x,y,.06],[x+Math.sin(j)*.3,y+Math.cos(j)*.3,.06]],c,2);rect(x-.4,y-.87,.8,.17,0,c);
  }
 }else if(kind==='biscuit'){
  for(let j=0;j<15;j++){const lat=(j+1)/16*Math.PI;curve(t=>[Math.cos(t*TAU)*Math.sin(lat)*1.4,Math.cos(lat)*.95,Math.sin(t*TAU)*Math.sin(lat)*.42],warm,.8);}
  curve(t=>[(t-.5)*2.7,-.05-Math.sin(t*Math.PI)*.08,.44],ink,1.5);
  card(.45,-.22,.5,1.28,.4,blue);
 }else{
  rect(-1.74,-1.12,3.48,2.24,0);line([-1.74,.8,0],[1.74,.8,0],warm);
  for(let k=0;k<31;k++)rect(-1.57+k%7*.45,.36-Math.floor(k/7)*.32,.33,.21,.06,k%5?ink:warm);
 }
 return {paths,surfaces};
}

export function sampleShape(shape,spacing=.035){
 const points=[];
 shape.paths.forEach((path,index)=>{
  for(let i=1;i<path.vertices.length;i++){
   const a=path.vertices[i-1],b=path.vertices[i],d=Math.hypot(...a.map((v,k)=>v-b[k])),n=Math.max(1,Math.ceil(d/spacing));
   for(let j=0;j<n;j++){const t=j/n;points.push({p:a.map((v,k)=>v+(b[k]-v)*t),color:path.color,group:path.group,phase:points.length*.61803398875%1,path:index});}
  }
 });return points;
}
