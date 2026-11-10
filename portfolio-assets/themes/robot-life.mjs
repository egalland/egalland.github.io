// The idle scene only draws in the cursor overlay. It never edits built elements.
const activities=[
 {kind:'code',ideas:['Boucle','Récursion','Variable','Prototype']},
 {kind:'inspect',ideas:['Alignement','Marge','Intervalle','Grille']},
 {kind:'rest',ideas:['Veille','Pause','Latence']},
 {kind:'review',ideas:['Relecture','Test','Logique','Syntaxe']}
];
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function createRobotLife(random=Math.random){
 let scene=null,next=0,order=[],previous='';
 const lastIdea=new Map();
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
  const activity=order.shift(),ideas=activity.ideas.filter(idea=>idea!==lastIdea.get(activity.kind));
  const idea=pick(ideas),leader=Math.floor(random()*count);
  previous=activity.kind;lastIdea.set(activity.kind,idea);
  scene={kind:activity.kind,idea,leader,partner:activity.kind==='review'&&count>1?(leader+1+Math.floor(random()*(count-1)))%count:-1,
   anchor:pick(visible).i,start:now,side:random()<.5?-1:1};
 }
 function pose(i,now,visible,width,height){
  if(!scene||(i!==scene.leader&&i!==scene.partner))return null;
  const anchor=visible.find(o=>o.i===scene.anchor);if(!anchor)return null;
  const {kind,idea,side}=scene,t=now-scene.start,partner=i===scene.partner;
  const r=anchor.r;
  let x=clamp(r.x+r.width*.5,76,width-76),y=clamp(r.top-22,110,height-65);
  const text=!partner&&t>1.2&&t<5.6?idea:'';
  if(kind==='review')x+=partner?side*25:-side*25;
  if(kind==='inspect')x+=side*clamp((t-2.5)/3,0,1)*Math.min(r.width*.35,72);
  if(kind==='code')x+=Math.floor(clamp(t-2,0,4)*3)%5*1.5;
  if(kind==='rest')y+=2*Math.sin(t*1.1);
  return {x:clamp(x,12,width-24),y,kind,text,t};
 }
 return {update,pose};
}

export function paintRobot(ctx,c,action,width){
 const {kind,text,t}=action;
 ctx.save();
 if(t>1&&t<7.4){
  ctx.strokeStyle=c.color;ctx.fillStyle=c.color;ctx.lineWidth=1;
  if(kind==='code'){
   // The typing gesture leaves short strokes beside the pointer.
   const x=clamp(c.x+17,4,width-26);
   for(let row=0;row<3;row++){
    const length=clamp((t-1-row*.7)*14,0,[17,11,14][row]);
    if(length)ctx.fillRect(x+(row===1?3:0),c.y+row*3,length,1);
   }
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
