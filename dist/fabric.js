import {patternSampler} from './motif-sampling.js';
export {patternSampler} from './motif-sampling.js';
import {createStitchTile} from './textiles.js';
import {yarnForTexture} from './projects.js';
const atlasCache=new Map();
function yarnAtlas(yarn,style){
  const key=JSON.stringify([yarn.color,yarn.weight,yarn.fiber,yarn.companion?.color,yarn.companion?.fiber,yarn.companion?.weight,style]);
  if(atlasCache.has(key))return atlasCache.get(key);
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const ctx=canvas.getContext('2d');
  for(let y=0;y<2;y++)for(let x=0;x<2;x++)ctx.drawImage(createStitchTile(yarn,style,32,x+y*2),x*32,y*32,32,32);
  if(atlasCache.size>150)atlasCache.delete(atlasCache.keys().next().value);
  atlasCache.set(key,canvas);return canvas;
}
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
export function makeFabric(p,knit,maxSide=1200,pull=null){
  const style=knit.style&&knit.style!=='stockinette'?knit.style:p.stitch;
  const {read,columns,rows}=pull?{read:pull.texture,columns:pull.piece.width,rows:pull.piece.rows.length}:patternSampler(p,knit);
  const nx=Math.min(384,columns),ny=Math.min(448,rows);
  const canvas=document.createElement('canvas');
  canvas.width=clamp(nx*12,48,maxSide);canvas.height=clamp(ny*12,48,maxSide);
  const ctx=canvas.getContext('2d'),cw=canvas.width/nx,ch=canvas.height/ny;
  const stitchPatterns=new Map();
  function swatches(name){
    if(!stitchPatterns.has(name))stitchPatterns.set(name,p.yarns.map((_,i)=>
      ctx.createPattern(yarnAtlas(yarnForTexture(p,i),name),'repeat')));
    return stitchPatterns.get(name);
  }
  // Work in tile units so this also runs in non-DOM canvas implementations.
  ctx.scale(cw/32,ch/32);
  const cells=new Uint8Array(nx*ny);
  for(let y=0;y<ny;y++){
    let start=0,last=-1;
    const row=Math.min(rows-1,Math.floor((1-(y+.5)/ny)*rows));
    const bases=swatches(pull?pull.piece.rows[row].stitch:style);
    for(let x=0;x<=nx;x++){
      const cell=x===nx?{color:-1,patterned:false}:read((x+.5)/nx,1-(y+.5)/ny);
      if(x<nx)cells[y*nx+x]=cell.color+(cell.patterned?128:0);
      if(cell.color!==last){if(last>=0){ctx.fillStyle=bases[last];ctx.fillRect(start*32,y*32,(x-start)*32+.05,32+.05);}start=x;last=cell.color;}
    }
  }
  return {canvas,cells,nx,ny};
}
export function paintSwatch(canvas,p){
  const ctx=canvas.getContext('2d'),w=canvas.width/p.cols,h=canvas.height/p.rows;
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){
    const tile=createStitchTile(yarnForTexture(p,p.grid[r][c]),p.stitch,32,(c&1)+2*(r&1));
    ctx.drawImage(tile,c*w,r*h,w+.2,h+.2);
  }
}
