'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {JournalQuery,readActivity} from './activity-journal';
import type {Faction} from './world';
import type {FrontierView as SharedView} from './frontier';
import type {playtestView} from './playtester';
export type FrontierView=SharedView&{playtest?:ReturnType<typeof playtestView>};

export function useFrontier() {
  const [view,setView]=useState<FrontierView|null>(null),[busy,setBusy]=useState(false),[fault,setFault]=useState(''),[notice,setNotice]=useState('');
  const [now,setNow]=useState(0),[connected,setConnected]=useState(false);
  const watchAI=useRef<string|null>(null);
  const token=useRef(''),revision=useRef(-1),offset=useRef(0),active=useRef(true),queue=useRef(Promise.resolve()),generation=useRef(''),locked=useRef(false),polling=useRef(false);
  const lastNetworkFault=useRef('');
  const request=useCallback(async(payload:Record<string,unknown>)=>{
    const response=await fetch('/api/frontier',{method:'POST',signal:AbortSignal.timeout(18000),headers:{'Content-Type':'application/json'},body:JSON.stringify({watchAI:watchAI.current,...payload,token:token.current})});
    const result=await response.json().catch(()=>null) as {view?:FrontierView;error?:string;token?:string;version:number;message?:string}|null;
    if(!response.ok||!result?.view)throw Error(result?.error??'Connexion au monde interrompue.');
    if(!active.current)return null;
    if(result.token){token.current=result.token;try{localStorage.setItem('strate-idle-token-v2',result.token);}catch{/* Account identity also persists. */}}
    if(result.view.generation&&result.view.generation!==generation.current){generation.current=result.view.generation;revision.current=-1;}
    if(result.version>=revision.current){revision.current=result.version;offset.current=result.view.now-Date.now();setView(result.view);setNow(result.view.now);}
    setConnected(true);
    if(lastNetworkFault.current){const old=lastNetworkFault.current;lastNetworkFault.current='';setFault(current=>current===old?'':current);}
    if(result.message)setNotice(result.message);
    return result.view as FrontierView;
  },[]);
  useEffect(()=>{
    active.current=true;
    try{token.current=localStorage.getItem('strate-idle-token-v2')??'';}catch{/* Private browsing can restrict storage. */}
    const poll=async()=>{
      if(polling.current||locked.current)return;
      polling.current=true;
      try{await request({op:'view'});}catch(error){if(active.current){setConnected(false);
        const cause=error as Error,message=cause.name==='TimeoutError'?'La liaison avec Strigius prend trop de temps.':cause.name==='TypeError'?'Connexion au monde interrompue.':cause.message;
        lastNetworkFault.current=message;setFault(message);}}finally{polling.current=false;}
    };
    void poll();
    const timer=setInterval(()=>{if(document.visibilityState==='visible')void poll();},2400);
    const clock=setInterval(()=>setNow(Date.now()+offset.current),250);
    const resume=()=>{if(document.visibilityState==='visible')void poll();};
    document.addEventListener('visibilitychange',resume);
    return()=>{active.current=false;clearInterval(timer);clearInterval(clock);document.removeEventListener('visibilitychange',resume);};
  },[request]);
  const issue=useCallback((payload:Record<string,unknown>)=>{
    const run=async()=>{
      if(!active.current)return null;
      locked.current=true;setBusy(true);setFault('');
      try{return await request(payload);}catch(error){setFault((error as Error).message);return null;}
      finally{locked.current=false;setBusy(false);}
    };
    const next=queue.current.then(run,run);queue.current=next.then(()=>undefined);return next;
  },[request]);
  const send=useCallback((action:Record<string,unknown>)=>issue({op:'action',action:{...action,requestId:Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>n.toString(16).padStart(8,'0')).join('')}}),[issue]);
  const join=useCallback((name:string,faction:Faction)=>issue({op:'join',name,faction}),[issue]);
  useEffect(()=>{if(!notice&&!fault)return;const t=setTimeout(()=>{setNotice('');setFault('');},6500);return()=>clearTimeout(t);},[notice,fault]);
  const readJournal=useCallback(async(query:JournalQuery)=>{const response=await fetch('/api/frontier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'journal',token:token.current,query})});const result=await response.json() as Awaited<ReturnType<typeof readActivity>>&{error?:string};if(!response.ok)throw Error(result.error??'Journal indisponible.');return result as Awaited<ReturnType<typeof readActivity>>;},[]);
  const observeAI=useCallback((id:string)=>{watchAI.current=id;return issue({op:'view'});},[issue]);
  return {view,now,busy,connected,send,join,refresh:()=>issue({op:'view'}),fault,notice,setNotice,setFault,readJournal,observeAI};
}
