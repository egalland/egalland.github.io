'use client';
import {useState} from 'react';
import {Lock,Check,FlaskConical} from 'lucide-react';
import TechnologyPanel from './TechnologyPanel';
import {GOODS,type Good} from '@/lib/economy';
import type {Specialty} from '@/lib/cooperation';
import type {FrontierView} from '@/lib/frontier';
type Props={view:FrontierView;now:number;busy:boolean;send:(a:Record<string,unknown>)=>Promise<FrontierView|null>;onFactory:()=>void};
export default function MAMPanel(p:Props){
  const [branch,setBranch]=useState<'Industrie'|Specialty['branch']>('Industrie'),me=p.view.me!,s=me.society;
  const live=me.factory.pieces.some(c=>c.kind==='mam'&&c.active&&c.hull>0),job=s.talentJob;
  return <div className="mam-panel"><div className="mam-head"><FlaskConical size={16}/><strong>Centre MAM</strong><span>{live?'Opérationnel':'À construire'}</span></div><div className="mam-tabs">{(['Industrie','Extraction','Transport','Milice'] as const).map(b=><button key={b} aria-pressed={b===branch} onClick={()=>setBranch(b)}>{b}</button>)}</div>
    {branch==='Industrie'?<TechnologyPanel {...p}/>:<><div className="fr-title"><h1>{branch}</h1></div><p className="fr-muted">Spécialisez votre économie. Une autre branche reste accessible avec un coût de ressources majoré de 50 %. Chaque analyse consomme les matériaux déposés à la base.</p>
      {job&&<div className="industry-current"><strong>{s.specialties.find(n=>n.id===job.id)?.name}</strong><span>{Math.max(0,Math.ceil((job.ready-p.now)/1000))} s</span><progress value={p.now-job.start} max={job.ready-job.start}/></div>}
      <div className="specialty-tree">{s.specialties.filter(n=>n.branch===branch).map(n=>{const owned=s.talents.includes(n.id),previous=n.tier===1||s.specialties.some(k=>k.branch===n.branch&&k.tier===n.tier-1&&s.talents.includes(k.id)),missing=Object.entries(n.cost).some(([g,q])=>(me.economy?.stock[g as Good]??0)<q);return <article key={n.id} className={owned?'owned':''}><div className="fr-row"><small>PALIER {n.tier}</small>{owned?<Check size={16}/>:!previous?<Lock size={14}/>:null}</div><h2>{n.name}</h2><p>{n.effect}</p><div className="industry-costs">{Object.entries(n.cost).map(([g,q])=><span key={g} className={(me.economy?.stock[g as Good]??0)<q?'missing':''}>{q} {GOODS[g as Good].name}<small>{me.economy?.stock[g as Good]??0} au dépôt</small></span>)}</div><button className="fr-primary" disabled={p.busy||!live||owned||!previous||missing||!!job||!!me.factory.research} onClick={()=>void p.send({type:'society',op:'specialize',skill:n.id})}>{owned?'Acquis':!previous?'Palier précédent requis':'Engager l’analyse · '+n.seconds+' s'}</button></article>;})}</div>
    </>}
  </div>;
}
