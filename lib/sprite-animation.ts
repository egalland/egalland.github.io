import {artUrl,artwork} from './field-assets';
export const ANIMATIONS={
  city:{sheet:'world',row:0,rows:4,fps:3},depot:{sheet:'world',row:1,rows:4,fps:4},drill:{sheet:'world',row:2,rows:4,fps:7},truck:{sheet:'world',row:3,rows:4,fps:7},
  furnace:{sheet:'factory',row:0,rows:4,fps:5},press:{sheet:'factory',row:1,rows:4,fps:5},wiremill:{sheet:'factory',row:2,rows:4,fps:6},assembler:{sheet:'factory',row:3,rows:4,fps:5},
  scout:{sheet:'actors',row:0,rows:5,fps:7},army:{sheet:'actors',row:1,rows:5,fps:7},monster:{sheet:'actors',row:2,rows:5,fps:5},lab:{sheet:'actors',row:3,rows:5,fps:5},chest:{sheet:'actors',row:4,rows:5,fps:4},
} as const;
export type AnimationId=keyof typeof ANIMATIONS;
export const atlasUrl=(id:AnimationId)=>artUrl('animated-'+ANIMATIONS[id].sheet);
export const animationFrame=(id:AnimationId,time:number,running=true,reduced=false,seed=0)=>running&&!reduced&&id!=='city'&&id!=='depot'?Math.floor(time/1000*ANIMATIONS[id].fps+seed)%4:0;
export const BUILDING_CELLS={mam:0,warehouse:1,barracks:2,repairbay:3} as const;
export function drawAnimated(ctx:CanvasRenderingContext2D,id:AnimationId,x:number,y:number,width:number,time:number,running=true,reduced=false,seed=0){
  const d=ANIMATIONS[id];
  if(id==='city'||id==='depot')running=false;
  const detail=width>95&&['drill','furnace','press','wiremill','assembler','city','depot'].includes(id)?artwork('detail-'+id):undefined;
  if(detail?.complete&&detail.naturalWidth&&width>95){
    const frame=animationFrame(id,time,running,reduced,seed),staticBuilding=id==='city'||id==='depot',sw=detail.naturalWidth/(staticBuilding?1:2),sh=detail.naturalHeight/(staticBuilding?1:2);
    const left=x-width/2,top=y-width*.88;
    if(staticBuilding){ctx.drawImage(detail,0,0,sw,sh,left,top,width,width);return true;}
    const zone=id==='drill'?[.58,.23,.20,.56]:id==='furnace'?[.39,.4,.44,.53]:id==='press'?[.36,.27,.48,.57]:id==='wiremill'?[.32,.2,.51,.5]:[.12,.3,.73,.44];
    const rx=left+width*zone[0],ry=top+width*zone[1],rw=width*zone[2],rh=width*zone[3];
    ctx.save();ctx.beginPath();ctx.rect(left,top,width,width);ctx.rect(rx,ry,rw,rh);ctx.clip('evenodd');ctx.drawImage(detail,0,0,sw,sh,left,top,width,width);ctx.restore();
    ctx.save();ctx.beginPath();ctx.rect(rx,ry,rw,rh);ctx.clip();ctx.drawImage(detail,(frame%2)*sw,Math.floor(frame/2)*sh,sw,sh,left,top,width,width);ctx.restore();return true;
  }
  const im=artwork('animated-'+d.sheet);
  if(!im)return false;
  const sw=im.naturalWidth/4,sh=im.naturalHeight/d.rows,frame=animationFrame(id,time,running,reduced,seed);
  ctx.drawImage(im,frame*sw,d.row*sh,sw,sh,x-width/2,y-width*.88,width,width);
  return true;
}

export type UtilityId='belt'|'loader'|'unloader'|'splitter'|'iron'|'copper'|'turret';
const UTILITY:UtilityId[]=['belt','loader','unloader','splitter','iron','copper','turret'];
let utility:HTMLCanvasElement|null=null;
// Rasterize distinct moving-part poses once. Runtime rendering samples an atlas
// cell, exactly like the illustrated wool sheets, without transforming a still.
function utilityAtlas(){
  if(utility)return utility;
  const c=document.createElement('canvas');c.width=512;c.height=128*UTILITY.length;const g=c.getContext('2d')!;
  for(let row=0;row<UTILITY.length;row++)for(let frame=0;frame<4;frame++){
    g.save();g.translate(frame*128,row*128);const id=UTILITY[row];
    if(id==='iron'||id==='copper'){
      const metal=id==='iron'?'#82959a':'#c48457',light=id==='iron'?'#dbe2d5':'#f4c08c';
      for(let n=0;n<18;n++){
        const x=64+Math.cos(n*2.399)*(12+n*2),y=65+Math.sin(n*2.399)*(7+n),r=5+n%5;
        g.fillStyle='#443e3655';g.beginPath();g.ellipse(x+1,y+5,r+2,r*.6,0,0,Math.PI*2);g.fill();
        g.fillStyle=n%3?metal:light;g.beginPath();g.moveTo(x-r,y);g.lineTo(x-r*.3,y-r);g.lineTo(x+r*.8,y-r*.4);g.lineTo(x+r,y+r*.4);g.lineTo(x-r*.3,y+r*.6);g.closePath();g.fill();
        if(n%4===frame){g.strokeStyle=light;g.lineWidth=1.2;g.beginPath();g.moveTo(x-2,y-r-2);g.lineTo(x+2,y-r+2);g.moveTo(x,y-r-4);g.lineTo(x,y-r+4);g.stroke();}
      }
    }else if(id==='turret'){
      g.fillStyle='#535f53';g.beginPath();g.ellipse(64,87,35,17,0,0,Math.PI*2);g.fill();g.fillStyle='#c8aa71';g.fillRect(45,45,38,38);g.fillStyle='#4c6964';g.fillRect(40,38,48,21);g.fillStyle='#dfb975';g.fillRect(77,43,27-frame%2*4,9);g.fillStyle=frame===2?'#e9dc8c':'#8ba77e';g.fillRect(48,43,7,7);
    }else{
      g.fillStyle='#283c3a';g.beginPath();g.moveTo(14,59);g.lineTo(62,31);g.lineTo(114,60);g.lineTo(66,90);g.closePath();g.fill();g.strokeStyle='#acaa7a';g.lineWidth=4;g.stroke();
      for(let n=0;n<5;n++){const t=(n+frame/4)/5,x=29+t*65,y=55+t*8;g.strokeStyle=n%2?'#887c58':'#c7ba86';g.lineWidth=6;g.beginPath();g.moveTo(x,y);g.lineTo(x-16,y+14);g.stroke();}
      if(id!=='belt'){
        const shift=[0,5,12,5][frame];g.fillStyle=id==='unloader'?'#b99358':'#579a91';g.fillRect(42,37,38,13);g.fillStyle='#dac690';g.fillRect(55,24,9,27+shift);g.fillStyle='#e6d4a0';g.fillRect(47,45+shift,25,7);
        if(id==='splitter'){g.strokeStyle='#e8c36d';g.lineWidth=4;g.beginPath();g.moveTo(65,60);g.lineTo(frame%2?83:44,frame%2?73:75);g.stroke();}
      }
      // Persistent grain and stitches make the small pieces read as felt.
      for(let n=0;n<24;n++){g.fillStyle=n%2?'#d5cfaa35':'#1a302b35';g.fillRect(26+n*13%76,46+n*7%28,1,2);}
    }
    g.restore();
  }
  return utility=c;
}
export function drawUtility(ctx:CanvasRenderingContext2D,id:UtilityId,x:number,y:number,width:number,time:number,running=true,reduced=false){
  const frame=running&&!reduced?Math.floor(time/160)%4:0;
  ctx.drawImage(utilityAtlas(),frame*128,UTILITY.indexOf(id)*128,128,128,x-width/2,y-width*.68,width,width);
}

export function drawBuilding(ctx:CanvasRenderingContext2D,id:keyof typeof BUILDING_CELLS,x:number,y:number,width:number){
  const image=artwork('detail-buildings');if(!image?.complete||!image.naturalWidth){drawAnimated(ctx,id==='mam'?'lab':'depot',x,y,width,0,false);return;}
  const i=BUILDING_CELLS[id],sw=image.naturalWidth/2,sh=image.naturalHeight/2;
  ctx.drawImage(image,(i%2)*sw,Math.floor(i/2)*sh,sw,sh,x-width/2,y-width*.88,width,width);
}

export const directionColumn=(heading:number,yaw=0)=>((Math.round((heading+yaw)/(Math.PI/4))%8)+8)%8;
export function drawDirectional(ctx:CanvasRenderingContext2D,kind:'worker'|'truck'|'guard'|'carrier',x:number,y:number,width:number,heading:number,time:number,running:boolean,reduced=false,yaw=0){
  const image=artwork(kind==='guard'?'guard-directions':kind==='carrier'?'carrier-directions':'wool-'+kind+'-directions');
  if(!image)return false;
  const direction=directionColumn(heading,yaw);
  if(kind==='guard'){
    const pose=running&&!reduced?Math.floor(time/185)%2:0;
    const row=Math.floor(direction/4)+pose*2,sw=image.naturalWidth/4,sh=image.naturalHeight/4;
    ctx.drawImage(image,(direction%4)*sw,row*sh,sw,sh,x-width/2,y-width*.9,width,width);
  }else{
    const row=running&&!reduced?Math.floor(time/1000*7)%4:1,sw=image.naturalWidth/8,sh=image.naturalHeight/4;
    ctx.drawImage(image,direction*sw,row*sh,sw,sh,x-width/2,y-width*.9,width,width);
  }
  return true;
}

export function drawOrePatch(ctx:CanvasRenderingContext2D,ore:string,x:number,y:number,width:number){if(width<18)return false;const orePatches=artwork('wool-ore-deposits');if(!orePatches)return false;const sw=orePatches.naturalWidth/2;ctx.drawImage(orePatches,ore==='cuivre'?sw:0,0,sw,orePatches.naturalHeight,x-width/2,y-width*.74,width,width);return true;}
