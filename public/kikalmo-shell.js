import {kikalmoDimensions,zones} from './kikalmo-avatar.js';

// A distance field inflates the actual silhouette. Every face, garment, accessory and hood
// keeps its registered cutouts; the separate material mask controls local relief and joints.
const shells=new WeakMap();
export function kikalmoShell(art){
  if(shells.has(art))return shells.get(art);
  const w=art.front.width,h=art.front.height;
  const pixels=art.front.getContext('2d').getImageData(0,0,w,h).data;
  const tags=art.tag.getContext('2d').getImageData(0,0,w,h).data;
  const distance=new Float32Array(w*h),rowDepth=new Float32Array(h);
  const dims=kikalmoDimensions(art),meter=dims.height/h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x;distance[i]=pixels[i*4+3]>40&&x&&y&&x<w-1&&y<h-1?10000:0;
  }
  for(let y=1;y<h;y++)for(let x=1;x<w;x++){
    const i=y*w+x;distance[i]=Math.min(distance[i],distance[i-1]+1,distance[i-w]+1,distance[i-w-1]+1.414);
  }
  for(let y=h-2;y>=0;y--)for(let x=w-2;x>=0;x--){
    const i=y*w+x;distance[i]=Math.min(distance[i],distance[i+1]+1,distance[i+w]+1,distance[i+w+1]+1.414);
  }
  const depth=new Float32Array(w*h),material=new Uint8Array(w*h);
  const relief=[0,.02,.045,.068,.075,.115,.045,.135,.09,.03];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,k=Math.min(9,Math.round(tags[i*4]/24));material[i]=k;
    const radius=art.appearance.costume?.255:k===zones.cloth?.21:.27;
    const normalized=Math.min(1,distance[i]*meter/(radius*1.45));
    depth[i]=.014+radius*Math.sqrt(normalized*(2-normalized))+(relief[k]||0)*Math.min(1,distance[i]*.35);
    rowDepth[y]=Math.max(rowDepth[y],depth[i]);
  }
  const result={w,h,pixels,depth,rowDepth,material,dims};shells.set(art,result);return result;
}


// Extend the authored bust with matching sleeves, trousers, knit gloves and boots.
export function costumeThreads(art){
  const shell=kikalmoShell(art);
  if(shell.threads)return shell.threads;
  const {w,h,pixels}=shell;
  function swatch(y0,y1){
    const samples=[];
    for(let y=Math.floor(y0*h);y<y1*h;y+=3)for(let x=Math.floor(w*.18);x<w*.82;x+=3){
      const i=(y*w+x)*4;
      if(pixels[i+3]>185)samples.push([pixels[i],pixels[i+1],pixels[i+2]]);
    }
    const light=c=>c[0]*.3+c[1]*.6+c[2]*.1;
    samples.sort((a,b)=>light(a)-light(b));
    const c=samples[Math.floor(samples.length*.52)]||[101,77,73];
    return '#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  shell.threads={sleeve:swatch(.58,.76),trouser:swatch(.76,.90),boot:swatch(.88,.99),cuff:swatch(.68,.84)};
  return shell.threads;
}
