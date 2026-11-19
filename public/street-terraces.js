// Painted stone seating and its woven nosing. The profile is shared by both renderers and the support solver.
export const terraceProfiles=Object.freeze({
  terraceStep:{halfLength:1.6,halfWidth:.85,h:.66},
  terraceTop:{halfLength:1.6,halfWidth:1.02,h:1.58}
});
function buildPanels({halfLength:l,halfWidth:w,h}){
  const sides=[
    [[-l,-w],[-l,w],[-1,0]], [[-l,w],[l,w],[0,1]],
    [[l,w],[l,-w],[1,0]], [[l,-w],[-l,-w],[0,-1]]
  ];
  const panels=[];
  const stripe=(a,b,normal,low,high,color)=>panels.push({normal,points:[
    [a[0],low,a[1]],[b[0],low,b[1]],[b[0],high,b[1]],[a[0],high,a[1]]
  ],color});
  for(const [a,b,n] of sides){
    const light=n[1]===1||n[0]===1;
    stripe(a,b,n,0,.13,light?'#a68b7a':'#937c74');
    stripe(a,b,n,.13,h-.18,light?'#cdb59a':'#bda28e');
    stripe(a,b,n,h-.18,h-.095,light?'#73958b':'#65847e');
    stripe(a,b,n,h-.095,h,light?'#ead7b1':'#d8c1a3');
  }
  const top=(x1,z1,x2,z2,height,color)=>panels.push({normal:[0,0],points:[
    [x1,height,z1],[x1,height,z2],[x2,height,z2],[x2,height,z1]],color});
  top(-l,-w,l,w,h,'#e1cbaa');
  // Two inlaid stitch lines make the lip legible when viewed from above.
  for(const sign of [-1,1])for(let x=-1.49;x<1.47;x+=.31){
    const z=(w-.13)*sign;
    top(x,z-.018,x+.16,z+.018,h+.006,'#8f877a');
  }
  return panels;
}
export const terracePanels=Object.freeze(Object.fromEntries(Object.entries(terraceProfiles).map(([type,spec])=>[type,buildPanels(spec)])));
