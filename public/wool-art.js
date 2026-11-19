// Dye colours recur across the set, the cast, and the street furniture.
export const yarnPalette=Object.freeze({
  ink:'#322b40', plum:'#584459', cream:'#f6e4ba', linen:'#d9bd95', ochre:'#d5a052',
  coral:'#c46e61', petrol:'#35575d', teal:'#608f88', sage:'#91aa89', slate:'#536779'
});

const swatches=new Map(),contextPatterns=new WeakMap();
function knitSwatch(step,seed,light,dark){
  const key=[step,seed,light,dark].join('/');
  if(swatches.has(key))return swatches.get(key);
  const tile=document.createElement('canvas');
  tile.width=step*4;tile.height=step*4;
  const c=tile.getContext('2d');
  c.scale(step,step);c.lineCap='round';
  // The two legs have different highlights, as with a loop pulled through the row below.
  for(let row=-1;row<=4;row++)for(let col=-1;col<=4;col++){
    const ri=(row+4)%4,ci=(col+4)%4;
    const offset=Math.sin(ri*73+ci*19+seed)*.055;
    const x=col+(ri%2)*.12+offset,y=row+offset*.38;
    c.strokeStyle=dark;c.lineWidth=.21;c.globalAlpha=.83;
    c.beginPath();c.moveTo(x+.16,y+.13);c.quadraticCurveTo(x+.13,y+.50,x+.47,y+.85);
    c.quadraticCurveTo(x+.80,y+.53,x+.80,y+.22);c.stroke();
    c.strokeStyle=light;c.lineWidth=.13;c.globalAlpha=.92;
    c.beginPath();c.moveTo(x+.16,y+.12);c.quadraticCurveTo(x+.18,y+.42,x+.44,y+.68);c.stroke();
    c.globalAlpha=.60;c.lineWidth=.085;
    c.beginPath();c.moveTo(x+.53,y+.69);c.quadraticCurveTo(x+.70,y+.54,x+.78,y+.28);c.stroke();
  }
  if(swatches.size>=64)swatches.delete(swatches.keys().next().value);
  swatches.set(key,tile);return tile;
}
export function paintKnit(ctx,x,y,width,height,{step=9,opacity=.28,seed=0,light='#fff0d1',dark='#493846'}={}){
  if(!(width>0&&height>0&&opacity>0))return;
  const tile=knitSwatch(Math.max(2,Math.min(64,Math.round(step))),Math.round(seed)%32,light,dark);
  let patterns=contextPatterns.get(ctx);
  if(!patterns){patterns=new WeakMap();contextPatterns.set(ctx,patterns);}
  let pattern=patterns.get(tile);
  if(!pattern){pattern=ctx.createPattern(tile,'repeat');if(!pattern)return;patterns.set(tile,pattern);}
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=Math.min(1,opacity);ctx.fillStyle=pattern;
  ctx.fillRect(0,0,width,height);ctx.restore();
}
