'use client';
import {useEffect,useRef} from 'react';
import {countdownFraction,type CountdownClock} from '../../lib/countdown';
export default function CountdownBar({clock,remaining}:{clock:CountdownClock|null;remaining:number}){
 const fill=useRef<HTMLElement>(null);
 useEffect(()=>{if(!clock)return;let frame=0;let stopped=false;const paint=()=>{if(stopped)return;const fraction=countdownFraction(clock,performance.now());if(fill.current)fill.current.style.transform=`scaleX(${fraction})`;if(fraction>0)frame=requestAnimationFrame(paint);};paint();const resume=()=>{cancelAnimationFrame(frame);paint();};document.addEventListener('visibilitychange',resume);return()=>{stopped=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',resume);};},[clock?.key,clock?.endsAt,clock?.durationMs]);
 return <div className="progress-track" role="progressbar" aria-label="Temps restant dans cette phase" aria-valuemin={0} aria-valuemax={(clock?.durationMs||0)/1000} aria-valuenow={Math.ceil(remaining)} aria-valuetext={`${Math.ceil(remaining)} secondes restantes`}><i key={clock?.key} ref={fill} aria-hidden="true"/></div>;
}
