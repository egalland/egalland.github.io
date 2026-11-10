// Open structures require depth behind the silhouette: two reel flanges,
// meridians around a globe, and page edges fanning around a book spine.
function modelBuilder(){
 const v=[],tri=[];
 function vertex(p,n){const l=Math.hypot(...n)||1;const i=v.length/6;v.push(...p,...n.map(x=>x/l));return i}
 function quad(a,b,c,d){tri.push(a,b,c,a,c,d)}
 function tube(path,r,steps,sides=10){
  const first=v.length/6;
  for(let i=0;i<=steps;i++){
   const t=i/steps,p=path(t),a=path(Math.max(0,t-.001)),b=path(Math.min(1,t+.001));
   const n=b.map((q,j)=>q-a[j]),len=Math.hypot(...n)||1;
   for(let j=0;j<3;j++)n[j]/=len;
   const ref=Math.abs(n[1])<.86?[0,1,0]:[1,0,0];
   const cross=(u,w)=>[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
   const side=cross(n,ref),sl=Math.hypot(...side);for(let j=0;j<3;j++)side[j]/=sl;
   const up=cross(n,side);
   for(let j=0;j<=sides;j++){
    const th=2*Math.PI*j/sides,normal=side.map((s,k)=>s*Math.cos(th)+up[k]*Math.sin(th));
    vertex(p.map((val,k)=>val+r*normal[k]),normal);
    if(i&&j){const k=first+i*(sides+1)+j;quad(k-sides-2,k-1,k,k-sides-1)}
   }
  }
 }
 function append(mesh,z,depth){
  const offset=v.length/6;
  for(let i=0;i<mesh.v.length;i+=6){const a=mesh.v;vertex([a[i],a[i+1],z+a[i+2]*depth],[a[i+3],a[i+4],a[i+5]/depth])}
  for(const i of mesh.tri)tri.push(i+offset);
 }
 function finish(eye){return {w:234,h:189,eye,v:new Float32Array(v),tri:new Uint16Array(tri)}}
 return {vertex,quad,tube,append,finish};
}
const tau=Math.PI*2;
export function atlasGlobe(){
 const m=modelBuilder(),r=56;
 function tilt(x,y,z){const a=-.29;return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z]}
 for(let j=0;j<4;j++){
  const a=j*Math.PI/4+.24;
  m.tube(t=>tilt(r*Math.cos(t*tau)*Math.cos(a),r*Math.sin(t*tau),r*Math.cos(t*tau)*Math.sin(a)),3.5,64);
 }
 for(const a of [-.58,0,.58])m.tube(t=>tilt(r*Math.cos(a)*Math.cos(t*tau),r*Math.sin(a),r*Math.cos(a)*Math.sin(t*tau)),3.1,64);
 m.tube(t=>{const x=79*Math.cos(t*tau),z=79*Math.sin(t*tau);return tilt(x,z*.26,z*.966)},3.1,84);
 return m.finish(tilt(0,-r,0));
}
export function filmReel(plate){
 const m=modelBuilder();m.append(plate,11,.46);m.append(plate,-11,.46);
 for(const r of [10,42]){
  const start=[];for(let i=0;i<=72;i++){
   const x=Math.cos(tau*i/72),y=Math.sin(tau*i/72);
   start.push([m.vertex([r*x,r*y,-11],[x,y,0]),m.vertex([r*x,r*y,11],[x,y,0])]);
   if(i)m.quad(start[i-1][0],start[i-1][1],start[i][1],start[i][0]);
  }
 }
 return m.finish([plate.eye[0],plate.eye[1],12]);
}
export function openBook(){
 const m=modelBuilder();
 function page(s,side,u,v){
  const bend=Math.sin(u*Math.PI);
  return [side*(u*65),v*42-u*11-bend*6,u*(s*6-5)+bend*(12+s*1.5)];
 }
 for(const side of [-1,1]){
  for(const s of [-2,-1,0,1,2]){
   // The page edges frame the open book and leave its centre legible.
   for(const v of [-1,1])m.tube(t=>page(s,side,t,v),s===2?2.8:1.4,22);
   m.tube(t=>page(s,side,1,2*t-1),s===2?2.8:1.4,8);
  }
 }
 m.tube(t=>[0,-42+84*t,1],3.8,12);
 return m.finish([0,-42,1]);
}
