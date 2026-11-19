// Visual pacing never changes business time, money, stock or production outcomes.
const cloneJobs=(s,ids,phase)=>ids.map(id=>s.orders.find(o=>o.id===id)).filter(Boolean).map(o=>({id:o.id,number:o.number,name:o.name,product:o.product,color:o.color,dimensions:o.dimensions?[...o.dimensions]:null,status:phase}));
export function machineSnapshot(s,m){const ids=m.plate?.length?[...m.plate]:m.job?[m.job]:[],lead=s.orders.find(o=>o.id===ids[0]),phase=m.broken?'broken':lead?.status==='printing'?'printing':lead?.status==='loading'?'loading':'idle';return {id:m.id,key:phase+'|'+ids.join(','),phase,jobs:cloneJobs(s,ids,phase),layout:(m.plateLayout||[]).map(p=>({...p})),fill:m.plateFill||0,progress:m.total&&phase==='printing'?Math.max(0,Math.min(1,1-m.remaining/m.total)):0,total:m.total||0,remaining:m.remaining||0,paused:m.paused||false};}
export class WorkshopPresentation{
 constructor(){this.records=new Map();this.worker=null;this.pendingWorker=null;this.workerSince=0;this.lastNow=0;this.compressed=false;}
 reset(s,now=0){this.records.clear();this.worker=null;this.pendingWorker=null;this.workerSince=now;this.lastNow=now;this.compressed=false;this.capture(s,now);for(const r of this.records.values()){r.current=r.latest;r.progress=r.latest.progress;r.started=now;r.queue=[];}}
 capture(s,now=this.lastNow){this.lastNow=now;const alive=new Set();for(const m of s.objects.filter(o=>o.runHours!==undefined)){alive.add(m.id);const shot=machineSnapshot(s,m);let r=this.records.get(m.id);if(!r){r={current:shot,latest:shot,queue:[],progress:shot.progress,started:now,last:now};this.records.set(m.id,r);continue;}
  if(shot.key===r.latest.key){r.latest=shot;if(r.current.key===shot.key)r.current={...shot};else if(r.queue.length&&r.queue.at(-1).key===shot.key)r.queue[r.queue.length-1]=shot;continue;}
  if(shot.phase==='broken'){r.queue=[];r.current=shot;r.progress=0;r.started=now;r.latest=shot;continue;}
  if(r.latest.phase==='printing'&&shot.phase==='idle'){const finished={...r.latest,phase:'finish',key:'finish|'+r.latest.key,progress:1,remaining:0,jobs:r.latest.jobs.map(o=>({...o,status:'finish'}))};r.queue.push(finished);}
  r.queue.push(shot);r.latest=shot;if(r.queue.length>4){r.queue=r.queue.slice(-3);this.compressed=true;}
 }for(const id of this.records.keys())if(!alive.has(id))this.records.delete(id);
 this.pendingWorker=s.worker?{...s.worker}:null;
 }
 sample(id,now,{mode='fluid',paused=false}={}){this.lastNow=now;const r=this.records.get(id);if(!r)return null;if(mode==='instant'){r.current=r.latest;r.queue=[];r.progress=r.latest.progress;return {...r.latest,progress:r.progress};}
 const dt=Math.max(0,Math.min(.2,(now-r.last)/1000));r.last=now;const min=mode==='eco'?{loading:160,printing:350,finish:180,idle:0}:{loading:280,printing:650,finish:300,idle:0};
 const ended=r.current.key!==r.latest.key,goal=r.current.phase==='printing'&&ended?1:r.current.progress;r.progress+=(goal-r.progress)*(1-Math.exp(-dt*12));if(Math.abs(goal-r.progress)<.002)r.progress=goal;
 if(r.queue.length&&(!paused||r.current.phase!=='printing'||ended)&&now-r.started>=(min[r.current.phase]||0)&&(r.current.phase!=='printing'||r.progress>.98)){
  r.current=r.queue.shift();r.started=now;r.progress=r.current.phase==='printing'?Math.min(r.current.progress,.03):r.current.progress;
 }
 return {...r.current,progress:r.progress,total:r.current.total,remaining:r.current.total*(1-r.progress)};
 }
 sampleWorker(now,{instant=false}={}){const key=w=>w?[w.kind,w.machineId||'',w.productId||'',w.orderId||''].join(':'):'idle';if(instant||!this.worker||key(this.worker)===key(this.pendingWorker)||now-this.workerSince>1100){if(key(this.worker)!==key(this.pendingWorker))this.workerSince=now;this.worker=this.pendingWorker;}return this.worker;}
}
