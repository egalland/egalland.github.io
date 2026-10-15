'use client';
import {useId,useSyncExternalStore} from 'react';
import {cleanAvatar,type Avatar as AvatarData} from '../../lib/profile';
import {atlasPosition,feltColor,puppetFrames} from '../../lib/puppet';

const listeners=new Set<()=>void>();let timer:ReturnType<typeof setInterval>|undefined;let time=0;let motion:MediaQueryList|undefined;
const zero=()=>0;const read=()=>time;const noSubscribe=()=>()=>{};
function updateClock(){if(timer){clearInterval(timer);timer=undefined;}if(listeners.size&&!document.hidden&&!motion?.matches){time=performance.now();timer=setInterval(()=>{time=performance.now();listeners.forEach(f=>f());},100);}else if(motion?.matches){time=0;listeners.forEach(f=>f());}}
function subscribe(listener:()=>void){listeners.add(listener);if(listeners.size===1){motion=window.matchMedia('(prefers-reduced-motion: reduce)');document.addEventListener('visibilitychange',updateClock);motion.addEventListener('change',updateClock);updateClock();}return()=>{listeners.delete(listener);if(!listeners.size){if(timer)clearInterval(timer);timer=undefined;document.removeEventListener('visibilitychange',updateClock);motion?.removeEventListener('change',updateClock);}};}
export default function Avatar({value,className='',label,animated=true,emotion}:{value?:AvatarData;className?:string;label?:string;animated?:boolean;emotion?:string}){
 const a=cleanAvatar(value),id=useId();const tick=useSyncExternalStore(animated?subscribe:noSubscribe,animated?read:zero,zero);const seed=Array.from(id).reduce((sum,c)=>sum+c.charCodeAt(0),a.shape*11+a.hair*7);const frame=animated&&tick?puppetFrames(tick,seed,!!emotion):{body:0,eyes:0,mouth:0};const color=feltColor(a.color);
 const layer=(name:string,col:number,row:number,columns:number,rows:number,tint=false)=><span key={name} className={'puppet-layer puppet-'+name} aria-hidden="true" style={{backgroundImage:`url(/puppets/${name==='hair'||name==='accessory'||name==='outfit'?'parts':name}.webp)`,...atlasPosition(col,row,columns,rows),...(tint?{filter:color}:{})}}/>;
 return <span className={'cartoon-avatar felt-avatar '+className} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} data-puppet="felt" data-frames={`${frame.body},${frame.eyes},${frame.mouth}`}>
 {layer('body',frame.body,a.shape,3,6,true)}{layer('outfit',a.outfit,2,7,3)}{layer('eyes',frame.eyes,a.eyes,4,6,true)}{layer('mouth',frame.mouth,a.mouth,4,6,true)}{a.hair>0&&layer('hair',a.hair,0,7,3)}{a.accessory>0&&layer('accessory',a.accessory,1,7,3)}
 </span>;
}
