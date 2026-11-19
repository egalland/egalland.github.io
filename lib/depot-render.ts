type Point = {x:number; y:number};
type Model = {
  point:(u:number,v:number,z:number)=>Point;
  box:(u:number,v:number,width:number,length:number,bottom:number,height:number,top:string,left:string,right:string)=>void;
};

export function drawDepot(ctx:CanvasRenderingContext2D, model:Model, size:number, accent:string) {
  const footprint=1.7;
  const point=(u:number,v:number,z:number)=>model.point(u*footprint,v*footprint,z*1.4);
  const box=(u:number,v:number,w:number,l:number,b:number,h:number,top:string,left:string,right:string)=>
    model.box(u*footprint,v*footprint,w*footprint,l*footprint,b*1.4,h*1.4,top,left,right);
  // Dock with approach markings, twin silos and a radio mast visible at the local scale.
  box(-.51,-.49,1.02,.98,0,.10,'#b99d7f','#635549','#534952');
  box(-.45,-.44,.65,.71,.10,.34,'#8b8b86','#5a6064','#424653');
  box(-.49,-.47,.71,.77,.44,.08,'#b2b0a3','#74777a','#555964');
  for (const u of [-.37,.01]) {
    box(u,-.36,.15,.47,.52,.20,'#b7ac98','#877c71','#66636a');
    box(u-.015,-.38,.18,.50,.72,.035,'#d7b581','#ae8b65','#766b65');
  }
  box(-.40,.31,.63,.14,.10,.24,'#93846f','#5b524e','#4d4850');
  box(-.33,.448,.34,.018,.13,.13,'#89918a','#333841','#333841');
  box(.23,-.42,.21,.32,.10,.42,'#c4a687','#655954','#574b50');
  if(size<13)return;
  for (let i=0;i<3;i++) box(.27,.02+i*.11,.20,.045,.10,.012,accent,accent,accent);
  const a=point(.33,-.28,.52), b=point(.33,-.28,1.02);
  ctx.strokeStyle='#c4ac8e';ctx.lineWidth=Math.max(1,size*.024);
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  ctx.fillStyle=accent;ctx.beginPath();ctx.arc(b.x,b.y,Math.max(1.3,size*.045),0,Math.PI*2);ctx.fill();
}

export function drawFieldCrate(model:Model) {
  const {box}=model;
  box(.04,-.21,.38,.34,0,.07,'#7c7269','#49424a','#423c45');
  box(.06,-.20,.34,.30,.07,.22,'#ce9b63','#986d45','#755044');
  for(const u of [.11,.29])box(u,-.20,.04,.30,.285,.018,'#e7c999','#a89582','#998570');
}
