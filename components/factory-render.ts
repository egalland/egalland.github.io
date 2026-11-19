import {FACTORY_KINDS,FACTORY_TILE,cellKey,cellPlace,footprint,foundation,piecePlace,port,machine,inputPorts,factoryStatus,type FactoryPiece,type Cell,type BuildMark,type FactoryTool} from '@/lib/factory-grid';
import {GOODS,RECIPES} from '@/lib/economy';
import {drawAnimated,drawBuilding,BUILDING_CELLS,type AnimationId} from '@/lib/sprite-animation';
import {drawWoolModel} from '@/lib/wool-models';
import {range,type Place} from '@/lib/frontier-geography';
import type {FrontierView} from '@/lib/frontier';
type Point={x:number;y:number};
type Project=(p:Place)=>Point;
export type FactoryVisual=Pick<FactoryPiece,'id'|'kind'|'face'|'x'|'y'|'dir'|'hull'>&Partial<FactoryPiece>&{busy?:boolean;diagnostic?:{title:string;severity:string}};
function path(ctx:CanvasRenderingContext2D,c:Cell,size:number,project:Project,fill:string,stroke:string){
  const points=[[0,0],[size,0],[size,size],[0,size]].map(([x,y])=>project({face:c.face,u:(c.x+x)*FACTORY_TILE,v:(c.y+y)*FACTORY_TILE,depth:0}));
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();
}
export function drawFactoryGrid(ctx:CanvasRenderingContext2D,view:FrontierView,face:Place['face'],project:Project,zoom:number,center:Place,span:number,active=false){
  if(zoom<1.5)return;
  const size=Math.min(180,Math.ceil(span/FACTORY_TILE));
  const x=Math.floor(center.u/FACTORY_TILE),y=Math.floor(center.v/FACTORY_TILE);
  ctx.save();
  for(let i=x-size;i<=x+size;i++){
    const a=project({face,u:i*FACTORY_TILE,v:(y-size)*FACTORY_TILE,depth:0}),b=project({face,u:i*FACTORY_TILE,v:(y+size)*FACTORY_TILE,depth:0});
    ctx.strokeStyle=active?(i%5===0?'#eee5c66b':'#eee5c62b'):i%5===0?'#eee5c61c':'#eee5c600';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  for(let j=y-size;j<=y+size;j++){
    const a=project({face,u:(x-size)*FACTORY_TILE,v:j*FACTORY_TILE,depth:0}),b=project({face,u:(x+size)*FACTORY_TILE,v:j*FACTORY_TILE,depth:0});
    ctx.strokeStyle=active?(j%5===0?'#eee5c66b':'#eee5c62b'):j%5===0?'#eee5c61c':'#eee5c600';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  if(view.me?.home.face===face)path(ctx,foundation(view.me.home,5),5,project,'#456a5a20','#a5d8b777');
  ctx.restore();
}
export function drawFactoryPiece(ctx:CanvasRenderingContext2D,p:FactoryVisual,project:Project,zoom:number,selected:boolean,now:number,reduced=false,illustrated=false,movingCargo=false,processing?:boolean){
  const size=FACTORY_KINDS[p.kind].size,at=project(piecePlace(p)),w=size*FACTORY_TILE*zoom*1.25;
  path(ctx,p,size,project,p.hull?'#182e365e':'#3c242b77',selected?'#b4f1d2':'#dac28b66');
  const front=project(cellPlace(port(p))),back=project(cellPlace(port(p,true,true)));
  const running=p.active!==false&&p.hull>0&&(machine(p)?(processing??(p.job?p.job.ready>=now:!!p.busy)):['belt','loader','unloader','splitter'].includes(p.kind)?movingCargo:(p.lastTransfer??0)>now-1500);
  if(illustrated&&(machine(p)||p.kind==='chest')){
    if(!drawAnimated(ctx,p.kind as AnimationId,at.x,at.y,w,now,running,reduced))drawWoolModel(ctx,{kind:p.kind,point:piecePlace(p),running},project,zoom,now,reduced);
  }
  else if(illustrated&&p.kind in BUILDING_CELLS)drawBuilding(ctx,p.kind as keyof typeof BUILDING_CELLS,at.x,at.y,w);
  else drawWoolModel(ctx,{kind:p.kind,point:piecePlace(p),heading:[-Math.PI/2,0,Math.PI/2,Math.PI][p.dir],running,active:p.hull>0&&p.active!==false,phase:reduced ? .5 : Math.max(0,Math.min(1,(now-(p.lastTransfer??now-500))/1000))},project,zoom,now,reduced);
  if(['belt','loader','unloader','splitter'].includes(p.kind)){
    const start=project(piecePlace(p)),end=front,a=Math.atan2(end.y-start.y,end.x-start.x),r=Math.max(2,zoom);
    ctx.strokeStyle='#f4d688';ctx.lineWidth=Math.max(.7,zoom*.2);ctx.beginPath();ctx.moveTo(end.x-Math.cos(a-.6)*r,end.y-Math.sin(a-.6)*r);ctx.lineTo(end.x,end.y);ctx.lineTo(end.x-Math.cos(a+.6)*r,end.y-Math.sin(a+.6)*r);ctx.stroke();
  }
  if(machine(p)||p.kind==='chest'){
    for(const input of inputPorts(p)){const q=project(cellPlace(input));ctx.fillStyle='#89e6de';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(2,zoom*.65),0,Math.PI*2);ctx.fill();}
    ctx.strokeStyle='#f3cc71';ctx.beginPath();ctx.moveTo(at.x+(front.x-at.x)*.8,at.y+(front.y-at.y)*.8);ctx.lineTo(front.x,front.y);ctx.stroke();
  }
  if(selected||zoom>4&&size>1){ctx.font='10px ui-monospace';ctx.textAlign='center';ctx.fillStyle='#142930e8';const label=FACTORY_KINDS[p.kind].name,tw=ctx.measureText(label).width;ctx.fillRect(at.x-tw/2-4,at.y+8,tw+8,16);ctx.fillStyle='#f7e8c8';ctx.fillText(label,at.x,at.y+20);}
  if(selected&&machine(p)&&p.items&&p.output&&p.recipe){
    const state=factoryStatus(p as FactoryPiece),missing=p.active&&!p.job&&p.hull>0?Object.entries(RECIPES[p.recipe].inputs).find(([g,n])=>p.items![g as keyof typeof p.items]<n):undefined;
    const label=state==='Entrée à alimenter'&&missing?'Manque · '+GOODS[missing[0] as keyof typeof GOODS].name:state;
    ctx.font='600 10px ui-monospace';ctx.textAlign='center';
    const tw=ctx.measureText(label).width;ctx.fillStyle='#202a28ee';ctx.fillRect(at.x-tw/2-6,at.y+25,tw+12,15);
    ctx.fillStyle=p.job?'#bfe5c3':'#f3ca85';ctx.fillText(label,at.x,at.y+36);
  }
  if(p.diagnostic?.severity==='warning'&&zoom>=1.5){const y=at.y-w*.55;ctx.fillStyle='#f3bd7e';ctx.beginPath();ctx.arc(at.x,y,5,0,2*Math.PI);ctx.fill();ctx.fillStyle='#24352f';ctx.font='bold 9px ui-monospace';ctx.textAlign='center';ctx.fillText('!',at.x,y+3);}
  if(selected&&p.diagnostic&&!machine(p)){const label=p.diagnostic.title;ctx.font='600 10px ui-monospace';ctx.textAlign='center';const tw=ctx.measureText(label).width;ctx.fillStyle='#202a28ee';ctx.fillRect(at.x-tw/2-5,at.y+26,tw+10,15);ctx.fillStyle='#f3ca85';ctx.fillText(label,at.x,at.y+37);}
  if(p.job){ctx.fillStyle='#efbe68';ctx.fillRect(at.x-w*.35,at.y+4,w*.7*Math.max(0,Math.min(1,1-(p.job.ready-now)/(RECIPES[p.job.recipe].seconds*1000))),2);}
}
export function drawBuildGhost(ctx:CanvasRenderingContext2D,tool:FactoryTool,marks:BuildMark[],view:FrontierView,project:Project,zoom:number){
  const me=view.me;if(!me)return;
  const occupied=new Set([...me.factory.pieces,...view.factories].flatMap(p=>footprint(p,FACTORY_KINDS[p.kind].size).map(cellKey)));
  const reserved=[foundation(me.home,5),...view.neighbors.map(p=>foundation(p.point,5))].flatMap(p=>footprint(p,5)).concat(view.rigs.flatMap(p=>footprint(p.grid??foundation(p.point,3),3)));
  reserved.forEach(c=>occupied.add(cellKey(c)));
  for(const m of marks){
    const size=tool==='erase'?1:FACTORY_KINDS[tool].size,area=footprint(m,size),within=range(me.home,cellPlace(m))<500||view.rigs.some(r=>r.owner===me.id&&range(r.point,cellPlace(m))<160);
    const existing=me.factory.pieces.find(p=>p.kind==='belt'&&cellKey(p)===cellKey(m));
    const valid=tool==='erase'||within&&area.every(c=>!occupied.has(cellKey(c))||!!existing&&tool==='belt');
    path(ctx,m,size,project,valid?'#91ebbf55':'#f08e7d55',valid?'#b3f6d3':'#ffb0a1');
    if(tool!=='erase'){
      const a=project(cellPlace(m,size)),b=project(cellPlace(port({...m,kind:tool})));
      ctx.strokeStyle=valid?'#efffda':'#ffc4b5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
  }
}
export function traceCells(from:BuildMark,to:BuildMark):BuildMark[]{
  const result:BuildMark[]=[{...from}],p={...from};
  while((p.x!==to.x||p.y!==to.y)&&result.length<96){
    if(p.x!==to.x){p.dir=p.x<to.x?1:3;result[result.length-1].dir=p.dir;p.x+=p.x<to.x?1:-1;}
    else {p.dir=p.y<to.y?2:0;result[result.length-1].dir=p.dir;p.y+=p.y<to.y?1:-1;}
    result.push({...p});
  }
  return result;
}
