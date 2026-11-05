const mix=(a,b,t)=>a+(b-a)*t;
const wrap=t=>((t%1)+1)%1;

/** Stratified coverage avoids random holes and clusters along thin UI details. */
export function resamplePoints(points,count,random=Math.random,sharp=false){
 if(!points.length||count<1)throw new Error('A formation requires points.');
 const result=[],stride=points.length/count;
 for(let k=0;k<count;k++){
  const sample=(k+.5)*stride,index=Math.min(points.length-1,Math.floor(sample)),p=points[index],q={...p};
  if(p.track){
   const t=wrap(p.phase+(sample-index-.5)*p.track.step);q.phase=t;
   q.jx=sharp?0:p.jx||0;q.jy=sharp?0:p.jy||0;q.jz=sharp?0:(random()-.5)*.012;
   q.x=mix(p.track.a[0],p.track.b[0],t)+q.jx;q.y=mix(p.track.a[1],p.track.b[1],t)+q.jy;q.z=sharp?0:mix(p.track.a[2],p.track.b[2],t)+q.jz;
  }else{q.x=p.x+(sharp?0:(random()-.5)*.01);q.y=p.y+(sharp?0:(random()-.5)*.01);q.z=sharp?0:p.z+(random()-.5)*.014;}
  result.push(q);
 }
 // Keep transitions spatially mixed while retaining even coverage of the target.
 for(let k=result.length-1;k>0;k--){const j=Math.floor(random()*(k+1));[result[k],result[j]]=[result[j],result[k]];}
 return result;
}

/** A continuous flow on line segments plus restrained ambient motion elsewhere.
 * The caller reuses `out` in the render loop, avoiding per-frame allocations. */
export function particlePosition(p,time,seed,sharp=false,enabled=true,out=[0,0,0]){
 let x=p.x,y=p.y,z=p.z;
 if(enabled&&p.track){const t=wrap(p.phase+time*p.track.speed);x=mix(p.track.a[0],p.track.b[0],t)+(p.jx||0);y=mix(p.track.a[1],p.track.b[1],t)+(p.jy||0);z=sharp?0:mix(p.track.a[2],p.track.b[2],t)+(p.jz||0);}
 if(enabled){const phase=seed*Math.PI*2,amount=sharp?.0014:.015;x+=(Math.sin(time*.72+phase)+.32*Math.sin(time*1.13+phase*2.7))*amount;y+=(Math.cos(time*.61+phase*1.3)+.28*Math.sin(time*.94+phase*3.1))*amount;if(!sharp)z+=Math.sin(time*.57+phase*1.9)*.025;}
 out[0]=x;out[1]=y;out[2]=sharp?0:z;return out;
}
