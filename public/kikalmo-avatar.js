// The portrait, the game mesh and the software view share Kikalmo's registered layers.
import { normalizeAppearance } from './kikalmo-schema.js';

const artSize=224, pagesCache=new Map(), sourceCache=new Map(), looks=new Map();
const objectKeys=new WeakMap();
const hasMotion=new Set([90,91,92,93,162,163,164,233,234]);
let original,atlases;
const data=()=>original ||= import('./kikalmo-art.js');
const atlas=()=>atlases ||= import('./kikalmo-atlas.js');

export function appearanceKey(value){
  if(!value||typeof value!=='object')return '';
  if(objectKeys.has(value))return objectKeys.get(value);
  const a=normalizeAppearance(value),key=a?JSON.stringify(a):'';
  objectKeys.set(value,key);return key;
}
function canvas(w,h=w){
  const el=document.createElement('canvas');el.width=w;el.height=h;return el;
}
function image(src){
  return new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('Ressource Kikalmo illisible'));img.src=src;
  });
}
function memo(cache,key,load,limit){
  if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
  const request=load().catch(e=>{if(cache.get(key)===request)cache.delete(key);throw e;});
  cache.set(key,request);if(cache.size>limit)cache.delete(cache.keys().next().value);
  return request;
}
function sheet(path){
  path=path.split('?')[0];
  return memo(sourceCache,path,async()=>{
    const {pages,sources}=await atlas(),cell=sources[path];
    if(!cell)throw Error('Texture Kikalmo absente : '+path);
    const [page,x,y,w,h]=cell;
    const bitmap=await memo(pagesCache,page,()=>image(new URL(pages[page],import.meta.url).href),8);
    const part=canvas(w,h);part.getContext('2d').drawImage(bitmap,x,y,w,h,0,0,w,h);
    return part.toDataURL('image/png');
  },48);
}
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const dashed=key=>key.replace(/[A-Z]/g,ch=>'-'+ch.toLowerCase());
const hyphenProps=new Set(['strokeWidth','strokeLinecap','strokeLinejoin','fillOpacity','strokeOpacity','stopColor','stopOpacity','clipPath','fillRule','clipRule','colorInterpolationFilters','pointerEvents','maskUnitsCSS']);
function walk(node,fn){
  if(!node||typeof node!=='object')return;
  if(Array.isArray(node)){for(const ch of node)walk(ch,fn);return;}
  fn(node);for(const ch of node.children)walk(ch,fn);
}
export const zones={cloth:1,skin:2,hair:3,headwear:4,facewear:5,feature:6,nose:7,adornment:8,costume:9};
function semantic(props,a){
  const c=props.className||'',id=props['data-cosmetic'],base=props['data-default-accessory'];
  if(id&&id===a.headwear)return zones.headwear;
  if(id&&id===a.facewear)return zones.facewear;
  if(id&&id===a.adornment)return zones.adornment;
  if(base)return base===6?zones.cloth:base===3?zones.headwear:zones.facewear;
  if(props['data-costume'])return zones.costume;
  for(const [name,zone] of [['puppet-hair','hair'],['puppet-eyes','feature'],['puppet-mouth','feature'],['puppet-nose','nose'],['puppet-body','skin'],['puppet-fabric','skin'],['puppet-neck','cloth'],['puppet-outfit','cloth']]){
    if(c.split(' ').includes(name))return zones[zone];
  }
  return 0;
}
function serialize(n,images,back,a,mask=false){
  if(n==null||typeof n==='boolean')return '';
  if(Array.isArray(n))return n.map(ch=>serialize(ch,images,back,a,mask)).join('');
  if(typeof n!=='object')return typeof n==='string'?escape(n):'';
  const {props,type}=n;
  if(back&&(props.className==='puppet-facial-features'||props['data-cosmetic']===a.facewear&&a.facewear||
    props.className==='puppet-hood-lining'))return '';
  let args='';
  for(let [key,v] of Object.entries(props)){
    if(v==null||v===false||key==='children'||key==='ref'||key==='key'||key.startsWith('data-')||key.startsWith('aria-')||key==='role')continue;
    if(key==='className')continue;
    if(key==='href'&&type==='image')v=images.get(v);
    if(key==='style')v=Object.entries(v).filter(e=>e[1]!=null).map(e=>dashed(e[0])+':'+e[1]).join(';');
    if(hyphenProps.has(key))key=dashed(key);
    args+=' '+key+'="'+escape(v)+'"';
  }
  const children=n.children.map(ch=>serialize(ch,images,back,a,mask&&type!=='defs')).join('');
  const defs=mask&&type==='svg'&&props['data-puppet']?'<defs>'+Object.values(zones).map(z=>'<filter id="zone'+z+'" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 '+z*24/255+' 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/></filter>').join('')+'</defs>':'';
  const node='<'+type+args+'>'+defs+children+'</'+type+'>',zone=mask&&semantic(props,a);
  return zone?'<g filter="url(#zone'+zone+')">'+node+'</g>':node;
}
async function raster(tree,images,back,appearance,mask=false){
  const markup=serialize(tree,images,back,appearance,mask);
  const source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);
  const frame=await image(source),out=canvas(artSize);
  out.getContext('2d').drawImage(frame,0,0,artSize,artSize);
  return out;
}
// Trim transparent stage padding, preserving relative framing across front/back and animation frames.
function coverage(surface){
  const {width:w,height:h}=surface,d=surface.getContext('2d').getImageData(0,0,w,h).data;
  let x=w,y=h,r=0,b=0;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)if(d[(j*w+i)*4+3]>24){
    x=Math.min(x,i);y=Math.min(y,j);r=Math.max(r,i);b=Math.max(b,j);
  }
  if(r<x)throw Error('Silhouette Kikalmo vide');
  x=Math.max(0,x-1);y=Math.max(0,y-1);r=Math.min(w-1,r+1);b=Math.min(h-1,b+1);
  return {x,y,w:r-x+1,h:b-y+1};
}
function crop(src,b){
  const c=canvas(b.w,b.h);c.getContext('2d').drawImage(src,b.x,b.y,b.w,b.h,0,0,b.w,b.h);return c;
}
// The source supplies front artwork. For the unseen back of closed hoods, borrow dyed fibres
// from the sides, following the original outline, so the front mask or face does not repeat.
function hoodBack(surface,tag,appearance){
  const g=surface.getContext('2d'),w=surface.width,h=surface.height;
  const im=g.getImageData(0,0,w,h),d=im.data,ref=new Uint8ClampedArray(d);
  const map=tag.getContext('2d').getImageData(0,0,w,h).data;
  const zone=(x,y)=>Math.round(map[(y*w+x)*4]/24);
  let l=w,r=-1,t=h,b=-1;
  for(let y=0;y<h*.76;y++)for(let x=0;x<w;x++){
    const z=zone(x,y);
    if((z===zones.skin||z===zones.feature||z===zones.nose||z===zones.facewear)&&map[(y*w+x)*4+3]>165){
      l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
    }
  }
  if(r<l){if(!appearance.facewear)return;l=w*.32;r=w*.68;t=h*.21;b=h*.53;}
  const cx=(l+r)/2,cy=(t+b)/2,rx=Math.max(4,(r-l)*.63),ry=Math.max(4,(b-t)*.65);
  const tile=Math.max(4,Math.min(13,Math.round(rx*.50))),donors=[];
  for(const side of [-1,1]){
    let best=-Infinity,bx=0,by=0;
    for(let y=1;y<h-tile;y+=3)for(let x=1;x<w-tile;x+=3){
      let opaque=0;
      for(let j=0;j<tile;j+=2)for(let i=0;i<tile;i+=2){
        if(zone(x+i,y+j)===zones.costume&&ref[((y+j)*w+x+i)*4+3]>235)opaque++;
      }
      const merit=opaque/(Math.ceil(tile/2)**2)*4-Math.hypot((x+tile/2-cx-side*rx*1.18)/w,(y+tile/2-cy)/h);
      if(merit>best){best=merit;bx=x;by=y;}
    }
    donors.push([bx,by]);
  }
  function mirror(n){const index=Math.abs(n)%(2*tile-2);return index<tile?index:2*tile-2-index;}
  for(let y=Math.max(0,Math.floor(cy-ry));y<Math.min(h,cy+ry);y++)for(let x=Math.max(0,Math.floor(cx-rx));x<Math.min(w,cx+rx);x++){
    const u=(x-cx)/rx,v=(y-cy)/ry,dist=Math.sqrt(u*u+v*v),k=(y*w+x)*4;
    if(dist>=1||ref[k+3]<55)continue;
    const blend=Math.min(1,(1-dist)*7),mix=.5+.5*u,light=(1.07-.15*dist*dist-.06*v);
    const samples=donors.map(([sx,sy])=>((sy+mirror(y+Math.floor(x/tile)))*w+sx+mirror(x))*4);
    for(let c=0;c<3;c++)d[k+c]=ref[k+c]*(1-blend)+(ref[samples[0]+c]*(1-mix)+ref[samples[1]+c]*mix)*light*blend;
  }
  g.putImageData(im,0,0);
}
async function compose(a,pose,portraitOnly=false){
  const {buildKikalmoArt}=await data(),tree=buildKikalmoArt(a,pose),images=new Map();
  walk(tree,n=>{if(n.type==='image')images.set(n.props.href,null);});
  await Promise.all([...images.keys()].map(async path=>images.set(path,await sheet(path))));
  const front=await raster(tree,images,false,a);
  if(portraitOnly)return front;
  const [rear,tag]=await Promise.all([raster(tree,images,true,a),raster(tree,images,false,a,true)]),b=coverage(front);
  const f=crop(front,b),r=crop(rear,b),material=crop(tag,b);if(a.costume)hoodBack(r,material,a);
  return {front:f,rear:r,tag:material,bounds:b,appearance:a};
}
export async function drawKikalmoPortrait(dest,value){
  const a=normalizeAppearance(value);if(!a)return false;
  const frame=await compose(a,0,true),g=dest.getContext('2d');
  g.clearRect(0,0,dest.width,dest.height);const size=Math.min(dest.width,dest.height);
  g.drawImage(frame,(dest.width-size)/2,(dest.height-size)/2,size,size);return true;
}
export function getKikalmoLook(value,pose=0){
  const key=appearanceKey(value);if(!key)return null;
  const id=key+'/'+pose;
  let entry=looks.get(id);
  if(!entry){
    const a=JSON.parse(key);
    entry={art:null,promise:null,error:null};looks.set(id,entry);
    entry.promise=compose(a,pose).then(v=>(entry.art=v,v)).catch(e=>{
      entry.error=e; console.warn('Portrait Kikalmo indisponible',e);
      setTimeout(()=>{if(looks.get(id)===entry)looks.delete(id);},12000);
      return null;
    });
    if(looks.size>72)looks.delete(looks.keys().next().value);
  }
  return entry;
}
export function kikalmoFrame(value,time){
  if(!hasMotion.has(value?.costume))return 0;
  return Math.floor((Number(time)||0)/.52)%8;
}
export function kikalmoDimensions(art){
  const h=art.appearance.costume?1.47:1.29;
  return {height:h,width:h*art.front.width/art.front.height,bottom:art.appearance.costume?.39:.40};
}
