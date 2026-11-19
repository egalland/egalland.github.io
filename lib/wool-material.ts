// The material is an original, generated needle-felt macro texture. Tinted tiles
// are cached, then mapped onto face coordinates; orbiting never slides the fibers.
import {artwork} from './field-assets';
const tiles=new Map<string,HTMLCanvasElement>();
export function paintWoolSurface(ctx:CanvasRenderingContext2D,points:{x:number;y:number}[],vertices:number[][],color:string,zoom:number){
  if(zoom<2.4||points.length!==4)return;
  const felt=artwork('wool-felt-material');if(!felt)return;
  const [a,b,,d]=points,area=Math.abs((b.x-a.x)*(d.y-a.y)-(b.y-a.y)*(d.x-a.x));if(area<45)return;
  const length=(i:number,j:number)=>Math.hypot(...vertices[i].map((v,k)=>v-vertices[j][k]));
  const width=length(0,1),height=length(0,3);if(width<.1||height<.1)return;
  let tile=tiles.get(color);
  if(!tile){tile=document.createElement('canvas');tile.width=256;tile.height=256;const g=tile.getContext('2d')!;g.filter='grayscale(1) contrast(1.4)';g.drawImage(felt,0,0,256,256);g.filter='none';g.globalCompositeOperation='multiply';g.fillStyle=color;g.fillRect(0,0,256,256);tiles.set(color,tile);}
  ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.clip();
  // Sixteen texels per metre gives a tactile pile at close zoom without gigantic yarn.
  ctx.transform((b.x-a.x)/(width*16),(b.y-a.y)/(width*16),(d.x-a.x)/(height*16),(d.y-a.y)/(height*16),a.x,a.y);
  const pattern=ctx.createPattern(tile,'repeat');if(pattern){ctx.fillStyle=pattern;ctx.fillRect(0,0,width*16,height*16);}ctx.restore();
}
