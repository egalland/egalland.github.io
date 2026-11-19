'use client';
import {useState} from 'react';
import {Check,Lock,GitBranch,Clock,ArrowRight} from 'lucide-react';
import {INDUSTRY_TREE,industryBlocked,knowsIndustry,researchTime,type IndustryId} from '@/lib/industry';
import {GOODS,type Good} from '@/lib/economy';
import {RESEARCH_TREE,researchAvailable} from '@/lib/research';
import type {FrontierView} from '@/lib/frontier';
import AnimatedSprite from './AnimatedSprite';
type Props={view:FrontierView;now:number;busy:boolean;send:(a:Record<string,unknown>)=>Promise<FrontierView|null>;onFactory:()=>void};
const positions={} as Record<IndustryId,{x:number;y:number}>;
let treeHeight=0;
for(const tier of [...new Set(INDUSTRY_TREE.map(n=>n.tier))].sort((a,b)=>a-b)){
  const nodes=INDUSTRY_TREE.filter(n=>n.tier===tier);
  nodes.forEach((n,i)=>positions[n.id]={x:i%2*150,y:treeHeight+Math.floor(i/2)*108});
  treeHeight+=Math.ceil(nodes.length/2)*108+22;
}
export default function TechnologyPanel({view,now,busy,send,onFactory}:Props){
  const me=view.me!,f=me.factory,live=f.pieces.some(p=>p.kind==='mam'&&p.active&&p.hull>0);
  const [selection,setSelection]=useState<IndustryId>(INDUSTRY_TREE.find(n=>!knowsIndustry(f,n.id))?.id??'mecanique');
  const node=INDUSTRY_TREE.find(n=>n.id===selection)!,blocked=!live?'Construisez et activez votre centre MAM':industryBlocked(me,f,node),job=f.research,active=job?.id===node.id,done=knowsIndustry(f,node.id);
  return <>
    <div className="fr-title"><GitBranch size={20}/><h1>Arbre industriel</h1></div>
    <p className="fr-muted">22 technologies, neuf paliers. Extraction, industrie, stockage et véhicules : toutes les branches restent accessibles. Chaque palier utilise les composants fabriqués par votre usine et ramenés au dépôt.</p>
    <div className="industry-summary"><AnimatedSprite id="lab" running={!!job}/><div><strong>{f.unlocked.length} / {INDUSTRY_TREE.length}</strong><small>technologies débloquées</small></div></div>
    {job&&<div className="industry-current" role="status"><strong>{INDUSTRY_TREE.find(n=>n.id===job.id)?.name}</strong><span><Clock size={13}/>{researchTime(Math.max(0,(job.ready-now)/1000))}</span><progress max={job.ready-job.start} value={Math.max(0,now-job.start)}/></div>}
    <div className="industry-tree" style={{height:treeHeight}} aria-label="Dépendances des technologies">
      <svg viewBox={`0 0 300 ${treeHeight}`} aria-hidden>{INDUSTRY_TREE.flatMap(n=>n.requires.map(parent=>{const a=positions[parent],b=positions[n.id];return <path key={parent+'/'+n.id} d={`M ${a.x+65} ${a.y+70} V ${b.y-16} H ${b.x+65} V ${b.y}`} className={knowsIndustry(f,parent)?'lit':''}/>;}))}</svg>
      {INDUSTRY_TREE.map(n=>{const pos=positions[n.id],owned=knowsIndustry(f,n.id),running=job?.id===n.id,ready=!industryBlocked(me,f,n);return <button key={n.id} style={{left:pos.x/3+'%',top:pos.y}} className={(owned?'owned ':ready?'available ':'locked ')+(selection===n.id?'selected ':'')+(running?'researching':'')} onClick={()=>setSelection(n.id)} aria-pressed={selection===n.id}><small>PALIER {n.tier+1} {owned?<Check size={12}/>:running?<Clock size={12}/>:!ready?<Lock size={11}/>:null}</small><strong>{n.name}</strong><span>{owned?'Acquis':running?'En recherche':n.unlocks[0]}</span></button>;})}
    </div>
    <section className="industry-detail"><h2>{node.name}</h2><p>{node.description}</p><div className="industry-unlocks">{node.unlocks.map(t=><span key={t}><Check size={12}/>{t}</span>)}</div>
      {node.requires.length>0&&<div className="industry-dependencies">{node.requires.map(id=><button key={id} onClick={()=>setSelection(id)}>{knowsIndustry(f,id)?'✓':'↳'} {INDUSTRY_TREE.find(n=>n.id===id)!.name}</button>)}</div>}
      <div className="industry-costs"><span className={me.coins<node.credits?'missing':''}>{node.credits} CR</span>{Object.entries(node.cost).map(([g,n])=><span key={g} className={(me.economy?.stock[g as Good]??0)<n?'missing':''}><i style={{background:GOODS[g as Good].color}}/>{n} {GOODS[g as Good].name}<small>{me.economy?.stock[g as Good]??0} au dépôt</small></span>)}</div>
      <button className="fr-primary" disabled={busy||!!blocked} onClick={()=>void send({type:'factory',op:'research',skill:node.id})}>{done?<><Check size={15}/>Technologie acquise</>:active?'Recherche en cours':<>Débloquer · {researchTime(node.seconds)} <ArrowRight size={15}/></>}</button>
      {!done&&!active&&blocked&&<p className="fr-muted" role="status">{blocked}</p>}
      <button className="fr-text-button" onClick={onFactory}>Revenir aux machines et recettes</button>
    </section>
    <details className="factory-guide"><summary>Améliorations de l’expédition</summary>{RESEARCH_TREE.map(n=><article className="fr-research" key={n.id}><strong>{n.name}</strong><p>{n.description}</p><button className="fr-button" disabled={busy||!researchAvailable(me,n.id)} onClick={()=>void send({type:'research',skill:n.id})}>{me.research.includes(n.id)?'Acquise':n.credits+' CR · '+Object.entries(n.materials).map(([g,n])=>n+' '+GOODS[g as Good].name).join(' · ')}</button></article>)}</details>
  </>;
}
