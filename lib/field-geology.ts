import type {Face} from './planet';

const facePhase:Record<Face,number>={top:0,bottom:2.7,north:5.2,south:8.5,east:10.8,west:13.2};
export const fieldNames=['Dunes de sable','Crêtes de schiste','Plaine saline','Steppe de lichen'] as const;
export const fieldColors=[[164,133,96],[113,100,90],[183,163,129],[136,137,103]] as const;
const smooth=(n:number)=>{n=Math.min(1,Math.max(0,n));return n*n*(3-2*n);};

// The face map and the fine terrain both sample these same continuous fields.
export function groundMix(face:Face,u:number,v:number):number[] {
  const s=facePhase[face];
  const a=u+80*Math.sin(v/190+s), b=v+95*Math.cos(u/275-s);
  const spine=Math.sin(a/315+b/440+s)*.54+Math.cos(b/182-s)*.29+Math.sin(a/109-b/157)*.17;
  const moisture=Math.sin(b/305-a/550+s)*.62+Math.cos(a/223+s)*.38;
  const saltiness=Math.cos(b/285+a/392-s)*.71+Math.sin(a/176+s)*.29;
  const shale=smooth((spine-.02)/.8);
  const lichen=(1-shale)*smooth((moisture-.05)/.68);
  const salt=(1-shale-lichen)*smooth((saltiness-.10)/.73);
  return [1-shale-lichen-salt,shale,salt,lichen];
}
export function groundType(face:Face,u:number,v:number) {
  const mix=groundMix(face,u,v);
  return mix.indexOf(Math.max(...mix));
}
export function fieldRandom(face:Face,x:number,y:number,salt:number) {
  let bits=Math.imul(x+37,374761393)^Math.imul(y+83,668265263)^Math.imul(Math.round(facePhase[face]*10)+salt,1274126177);
  bits=Math.imul(bits^(bits>>>13),1274126177);
  return ((bits^(bits>>>16))>>>0)/4294967296;
}

export type Landform={u:number;v:number;size:number;kind:number;turn:number;flip:number};
const landformCell=136;
export function landformsIn(face:Face,size:number,minU:number,minV:number,maxU:number,maxV:number):Landform[]{
  const forms:Landform[]=[],margin=86;
  const last=Math.ceil(size/landformCell)-1;
  for(let x=Math.max(0,Math.floor((minU-margin)/landformCell));x<=Math.min(last,Math.floor((maxU+margin)/landformCell));x++){
    for(let y=Math.max(0,Math.floor((minV-margin)/landformCell));y<=Math.min(last,Math.floor((maxV+margin)/landformCell));y++){
      if(fieldRandom(face,x,y,65)<.27)continue;
      const u=(x+.19+fieldRandom(face,x,y,47)*.62)*landformCell,v=(y+.19+fieldRandom(face,x,y,51)*.62)*landformCell;
      if(u>size||v>size)continue;
      const kind=groundType(face,u,v);
      forms.push({u,v,kind,size:52+fieldRandom(face,x,y,58)*66,turn:Math.floor(fieldRandom(face,x,y,63)*4),flip:fieldRandom(face,x,y,68)>.5?-1:1});
    }
  }
  return forms;
}
