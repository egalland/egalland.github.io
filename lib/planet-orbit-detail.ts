import { FACE_ORDER, SIDE, type Face } from './planet';

type Color = readonly [number, number, number];
type Sample = { height: number; fold: number; province: number; incision: number; crater: number; grain: number };
type Basin = { u: number; v: number; radius: number; stretch: number };
const clamp01 = (n:number) => Math.min(1, Math.max(0,n));
const fade = (n:number) => n*n*(3-2*n);
const mix = (a:number,b:number,t:number) => a+(b-a)*t;
const fract = (n:number) => n-Math.floor(n);
const basinCache = new Map<Face,Basin[]>();
const palettes:Record<Face,[Color,Color,Color]> = {
  top:[[45,61,72],[163,103,71],[218,187,144]],
  south:[[41,59,66],[157,88,65],[211,172,128]],
  east:[[51,56,70],[144,89,74],[207,165,126]],
  west:[[48,70,73],[125,100,75],[197,188,149]],
  north:[[59,66,79],[117,92,88],[193,179,153]],
  bottom:[[55,55,67],[134,84,63],[194,160,119]],
};

function hash(x:number,y:number,seed:number) {
  let h=Math.imul(x+seed*211,374761393)+Math.imul(y-seed*73,668265263);
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967296;
}
function field(x:number,y:number,seed:number) {
  const u=Math.floor(x),v=Math.floor(y),a=fade(x-u),b=fade(y-v);
  return mix(mix(hash(u,v,seed),hash(u+1,v,seed),a),mix(hash(u,v+1,seed),hash(u+1,v+1,seed),a),b);
}
function basins(face:Face,seed:number) {
  let items=basinCache.get(face);
  if(!items){
    items=Array.from({length:5},(_,i)=>({
      u:.11+hash(i,4,seed)*.78, v:.11+hash(i,9,seed)*.78,
      radius:(i===0?.098:.027)+hash(i,15,seed)*(i===0?.054:.030),
      stretch:.87+hash(i,20,seed)*.28,
    }));
    basinCache.set(face,items);
  }
  return items;
}
const newSample = ():Sample=>({height:0,fold:0,province:0,incision:0,crater:0,grain:0});

// The atlas shows landforms only. This field has no access to underground ore,
// excavated chunks, machinery or player locations.
function describe(sample:Sample,seed:number,u:number,v:number,step:number,craters:Basin[]) {
  const x=u/SIDE,y=v/SIDE;
  const province=field(x*4.1+5.4,y*4.1-2.8,seed);
  const fold=field(x*8.8+province*.93,y*7.4-province*.65,seed+3);
  const plates=field(x*4.4+y*1.7+fold*.78,y*5.7-x*.6+province*.55,seed+15);
  const shelf=field(x*21+y*3,y*18-x*4,seed+29);
  const screeMix=clamp01(1-step/240),scarMix=clamp01(1-step/100);
  const scree=screeMix?mix(.5,field(x*59+fold*1.4,y*53+shelf*.8,seed+33),screeMix):.5;
  const scar=scarMix?mix(.5,field(x*135+province,y*142-fold,seed+17),scarMix):.5;
  const incision=Math.abs(plates-.49+(shelf-.5)*.11+(scree-.5)*.035);
  const gorge=1-fade(clamp01(incision/.079));
  const escarpment=1-fade(clamp01(Math.abs(scree-.48)/.27));
  let height=.22+province*.37+fold*.24+shelf*.115-gorge*.215
    +escarpment*(.025+.037*shelf)+(scar-.5)*.023;
  let crater=0;
  for(const basin of craters){
    const dx=(x-basin.u)/basin.radius,dy=(y-basin.v)/basin.radius*basin.stretch;
    if(Math.abs(dx)>1.36||Math.abs(dy)>1.36)continue;
    const radius=Math.sqrt(dx*dx+dy*dy)+(shelf-.5)*.13;
    if(radius>1.35)continue;
    const bowl=Math.max(0,1-radius*radius),lip=Math.max(0,1-Math.abs(radius-.95)/.19);
    height+=lip*lip*.13-bowl*bowl*.19;
    crater+=lip*.8-bowl*.6;
  }
  // Wider views only sample frequencies their pixel footprint can resolve.
  const shortMix=clamp01(1-step/78),fineMix=clamp01(1-step/9);
  const local=shortMix?field(u/91+fold*3,v/113-province*2,seed+7):.5;
  const grain=fineMix?field(u/12.1,v/16.3,seed+43):.5;
  height+=(local-.5)*.018*shortMix+(grain-.5)*.0028*fineMix;
  sample.height=mix(height,Math.floor(height*43)/43,.16);
  sample.fold=x*.37-y*.67+province*.24+fold*.13+height*.21+(scree-.5)*.010;
  sample.province=province*.70+fold*.30;
  sample.incision=incision;
  sample.crater=crater;
  sample.grain=local*.64+grain*.36;
}

// Render world-aligned samples with a one-pixel apron for directional gradients.
// Neighboring cached tiles use identical coordinates at every LOD.
export function paintRockTile(ctx:CanvasRenderingContext2D,face:Face,u0:number,v0:number,span:number,pixels:number) {
  paintRockRows(ctx,face,u0,v0,span,pixels,0,pixels);
}
export function paintRockRows(ctx:CanvasRenderingContext2D,face:Face,u0:number,v0:number,span:number,pixels:number,firstRow:number,rows:number) {
  const seed=FACE_ORDER.indexOf(face)*67+37,craters=basins(face,seed);
  const step=span/pixels,stride=pixels+2,length=stride*(rows+2);
  const heights=new Float32Array(length),folds=new Float32Array(length),provinces=new Float32Array(length);
  const incisions=new Float32Array(length),rim=new Float32Array(length),grain=new Float32Array(length);
  const sample=newSample();
  for(let j=0;j<rows+2;j++)for(let i=0;i<stride;i++){
    const idx=j*stride+i;
    describe(sample,seed,u0+(i-.5)*step,v0+(firstRow+j-.5)*step,step,craters);
    heights[idx]=sample.height;folds[idx]=sample.fold;provinces[idx]=sample.province;
    incisions[idx]=sample.incision;rim[idx]=sample.crater;grain[idx]=sample.grain;
  }
  const image=ctx.createImageData(pixels,rows),rgba=image.data;
  const [basalt,sandstone,quartz]=palettes[face];
  const micro=clamp01(1-step/16);
  for(let y=0;y<rows;y++)for(let x=0;x<pixels;x++){
    const idx=(y+1)*stride+x+1,at=(y*pixels+x)*4,h=heights[idx],fold=folds[idx];
    const dx=(heights[idx+1]-heights[idx-1])*(SIDE/step*.043);
    const dy=(heights[idx+stride]-heights[idx-stride])*(SIDE/step*.043);
    const slope=Math.min(1.15,Math.max(-1.2,dx*.72+dy*.9));
    const geologicalBed=fract(fold*16);
    const ironBand=fade(clamp01(1-Math.abs(geologicalBed-.48)/.15));
    const brightBand=fade(clamp01(1-Math.abs(geologicalBed-.82)/.065));
    const g=incisions[idx],depth=1-fade(clamp01(g/.067));
    const weather=clamp01((provinces[idx]-.27)*1.94+ironBand*.17+rim[idx]*.11);
    const lime=clamp01(brightBand*(.24+.25*provinces[idx])+.26*clamp01(rim[idx])+.23*clamp01((h-.62)*5));
    const terrace=fract(h*24),edgeWidth=Math.min(.105,step*.0012+.025);
    const lip=terrace<edgeWidth?(1-terrace/edgeWidth)*7:0;
    const grit=hash(Math.floor((u0+(x+.5)*step)/step),Math.floor((v0+(firstRow+y+.5)*step)/step),seed+61)-.5;
    const light=slope*42+(h-.48)*67-depth*18+rim[idx]*8+lip+grit*(12+micro*8)+(grain[idx]-.5)*12*micro;
    for(let c=0;c<3;c++){
      const bed=mix(basalt[c],sandstone[c],weather);
      rgba[at+c]=mix(bed,quartz[c],lime)+light;
    }
    rgba[at+3]=255;
  }
  ctx.putImageData(image,0,firstRow);
}

export type OrbitalRelief = { segments:number; heights:Float32Array };
const reliefCache=new Map<Face,OrbitalRelief>();
export function orbitalRelief(face:Face) {
  const cached=reliefCache.get(face);
  if(cached)return cached;
  const segments=8,height=new Float32Array((segments+1)**2);
  const seed=FACE_ORDER.indexOf(face)*67+37,sample=newSample(),craters=basins(face,seed);
  for(let j=1;j<segments;j++)for(let i=1;i<segments;i++){
    const u=i/segments,v=j/segments;
    describe(sample,seed,u*SIDE,v*SIDE,SIDE/384,craters);
    // A bevel at the periphery keeps all six faces stitched together.
    const edge=fade(clamp01(Math.min(u,v,1-u,1-v)*9));
    height[j*(segments+1)+i]=(sample.height-.49)*.185*edge;
  }
  const relief={segments,heights:height};reliefCache.set(face,relief);return relief;
}

export function reliefHeight(relief:OrbitalRelief,u:number,v:number) {
  const n=relief.segments,iu=Math.min(n-1,Math.floor(clamp01(u)*n)),iv=Math.min(n-1,Math.floor(clamp01(v)*n));
  const x=clamp01(u)*n-iu,y=clamp01(v)*n-iv,index=iv*(n+1)+iu,z=relief.heights;
  const a=z[index],b=z[index+1],c=z[index+n+1],d=z[index+n+2];
  return x+y<=1 ? a+(b-a)*x+(c-a)*y : d+(c-d)*(1-x)+(b-d)*(1-y);
}
