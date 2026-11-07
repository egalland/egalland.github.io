const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};

export function scatteredPose(_index,width,random=Math.random){
 const mobile=width<=700,range=(a,b)=>a+(b-a)*random();
 // Sample each property independently, once per construction, never per frame.
 return {x:range(-1,1)*(mobile?28:90),y:range(-32,42),angle:range(-1,1)*(mobile?6:13),bend:range(-1,1),timing:range(.32,.65),duration:range(.7,1.4),draw:random()};
}
export function placementPose(source,progress){
 const bend=source.bend??0,timing=source.timing??.5;
 const keys=[{at:0,...source},{at:timing,x:source.x*.12+bend*9,y:source.y*.1-bend*8,angle:-source.angle*(.08+Math.abs(bend)*.24)},{at:1,x:0,y:0,angle:0}];
 const p=clamp(progress),i=keys.findIndex(key=>key.at>=p);
 if(i<=0)return {x:source.x,y:source.y,angle:source.angle};
 const a=keys[i-1],b=keys[i],t=smooth((p-a.at)/(b.at-a.at));
 return Object.fromEntries(['x','y','angle'].map(key=>[key,a[key]+(b[key]-a[key])*t]));
}
