// The idle scene only draws in the cursor overlay. It never edits built elements.
const activities=[
 {kind:'code',lines:['Et si je simplifiais la boucle ?','Encore une accolade…','Je tente une version plus courte.']},
 {kind:'inspect',lines:['Un pixel de trop, là ?','Voyons si ce coin tient.','Je recompte les intervalles.']},
 {kind:'rest',lines:['Je me pose ici un instant.','Ça compile. Pause.','Un peu de silence entre deux ticks.']},
 {kind:'review',lines:[
  ['Tu relis ma boucle ?','Oui. Et si la liste est vide ?'],
  ['On garde cette fonction ?','Oui, elle sert deux fois.'],
  ['Tu vois le décalage ?','Je le vois. Un demi-pixel.']
 ]}
];
const snippets=['items.map(f)','if (!n) return','let i = 0'];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function createRobotLife(random=Math.random){
 let scene=null,next=0,order=[],previous='';
 const lastLine=new Map();
 const pick=list=>list[Math.floor(random()*list.length)];
 function update(now,visible,count,busy){
  if(busy||!visible.length||!count){scene=null;next=now+.8;return}
  if(scene&&(now-scene.start>=7.8||!visible.some(o=>o.i===scene.anchor))){
   scene=null;next=now+2+random()*2;
  }
  if(scene||now<next)return;
  if(!order.length){
   order=activities.slice();
   for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
   if(order[0].kind===previous)[order[0],order[1]]=[order[1],order[0]];
  }
  const activity=order.shift(),lines=activity.lines.filter(line=>line!==lastLine.get(activity.kind));
  const line=pick(lines),leader=Math.floor(random()*count);
  previous=activity.kind;lastLine.set(activity.kind,line);
  scene={kind:activity.kind,line,leader,partner:activity.kind==='review'&&count>1?(leader+1+Math.floor(random()*(count-1)))%count:-1,
   snippet:activity.kind==='code'?snippets[activity.lines.indexOf(line)]:'',anchor:pick(visible).i,start:now,side:random()<.5?-1:1};
 }
 function pose(i,now,visible,width,height){
  if(!scene||(i!==scene.leader&&i!==scene.partner))return null;
  const anchor=visible.find(o=>o.i===scene.anchor);if(!anchor)return null;
  const {kind,line,side}=scene,t=now-scene.start,partner=i===scene.partner;
  const r=anchor.r;
  let x=clamp(r.x+r.width*.5,76,width-76),y=clamp(r.top-22,110,height-65);
  let text='';
  if(kind==='review'){
   x+=partner?side*25:-side*25;
   text=partner?(t>=4.4&&t<7.6?line[1]:''):(t>=1.1&&t<4.2?line[0]:'');
  }else{
   if(kind==='inspect')x+=side*clamp((t-2.5)/3,0,1)*Math.min(r.width*.35,72);
   if(kind==='code')x+=Math.floor(clamp(t-2,0,4)*3)%5*1.5;
   if(kind==='rest')y+=2*Math.sin(t*1.1);
   if(t>1.2&&t<5.6)text=line;
  }
  return {x:clamp(x,12,width-24),y,kind,text,t,snippet:scene.snippet};
 }
 return {update,pose};
}

export function paintRobot(ctx,c,action,width){
 const {kind,text,t,snippet}=action;
 ctx.save();
 if(t>1&&t<7.4){
  ctx.strokeStyle=c.color;ctx.fillStyle=c.color;ctx.lineWidth=1;
  if(kind==='code'){
   ctx.font='10px monospace';
   const code=snippet.slice(0,Math.floor((t-1)*3.5));
   ctx.fillText(code,clamp(c.x+17,4,width-ctx.measureText(snippet).width-6),c.y+6);
  }else if(kind==='inspect'){
   ctx.beginPath();ctx.moveTo(c.x-8,c.y+3);ctx.lineTo(c.x,c.y+3);ctx.lineTo(c.x,c.y+11);ctx.stroke();
  }else if(kind==='rest'){
   ctx.globalAlpha=.4+.3*Math.sin(t*2);ctx.fillRect(c.x+15,c.y+4,4,2);
  }
 }
 if(text){
  ctx.globalAlpha=1;ctx.font='11px monospace';
  const w=ctx.measureText(text).width+14;
  const x=clamp(c.x+9,4,width-w-4),y=Math.max(75,c.y-27);
  ctx.fillStyle='#151920f5';ctx.fillRect(x,y,w,20);ctx.strokeStyle=c.color;ctx.strokeRect(x,y,w,20);
  ctx.fillStyle='#f1f2f6';ctx.fillText(text,x+7,y+14);
 }
 ctx.restore();
}
