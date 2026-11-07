const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function scatteredPose(index,width){
 const sign=index%2?1:-1,mobile=width<=700;
 return {x:sign*(mobile?16+index%16:40+index%57),y:(index%3===0?-1:1)*(20+index%29),angle:sign*(mobile?3+index%4:6+index%8)};
}

// A wrong first placement, a counter-rotation, then a precise final alignment.
export function placementPose(source,progress){
 const keys=[
  {at:0,...source},
  {at:.32,x:-source.x*.24,y:source.y*.18-9,angle:-source.angle*.55},
  {at:.61,x:source.x*.12,y:5,angle:source.angle*.2},
  {at:.82,x:-3*Math.sign(source.x),y:-2,angle:-source.angle*.07},
  {at:1,x:0,y:0,angle:0}
 ];
 const p=clamp(progress),i=keys.findIndex(key=>key.at>=p);
 if(i<=0)return {x:source.x,y:source.y,angle:source.angle};
 const a=keys[i-1],b=keys[i],t=smooth((p-a.at)/(b.at-a.at));
 return Object.fromEntries(['x','y','angle'].map(key=>[key,a[key]+(b[key]-a[key])*t]));
}
