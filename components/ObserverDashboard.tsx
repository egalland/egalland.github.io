'use client';

import {useCallback, useEffect, useState, type CSSProperties} from 'react';
import {
  ArrowDownWideNarrow, ArrowRight, BookOpen, ChevronDown,
  ChevronLeft, ChevronRight, CircleAlert, Coins, Compass, Crosshair, Factory, Flag,
  Globe2, Hexagon, Layers3, LockKeyhole, Network, Orbit, Radio, RefreshCw,
  ScanLine, ScrollText, Shield, Users, Warehouse, Waypoints, X
} from 'lucide-react';
import {ObserverMap} from './observer-map';
import {ObserverJournal} from './ObserverJournal';
import type {ObserverAgent, ObserverView} from '@/lib/observatory';
import {useObserver, type ObserverSpeed} from '@/hooks/use-observer';
import {FACTORY_KINDS} from '@/lib/factory-grid';
import {INDUSTRY_TREE} from '@/lib/industry';
import {ALL_GOODS, GOODS} from '@/lib/economy';
import './observer.css';

type Section = 'monde' | 'factions' | 'guildes' | 'journal';
type Metric = 'wealth' | 'power' | 'territories' | 'production' | 'research' | 'warScore';

const tabs = [
  {id:'monde', title:'Planète', icon:Globe2},
  {id:'factions', title:'Factions', icon:Flag},
  {id:'guildes', title:'Guildes', icon:Network},
  {id:'journal', title:'Journal', icon:ScrollText}
] as const;
const metricInfo:Record<Metric,{label:string;unit:string;icon:typeof Coins}> = {
  wealth:{label:'Richesse',unit:'cr',icon:Coins}, power:{label:'Puissance',unit:'pts',icon:Shield},
  territories:{label:'Territoires',unit:'sites',icon:Flag}, production:{label:'Production',unit:'obj.',icon:Factory},
  research:{label:'Recherche',unit:'acq.',icon:Waypoints}, warScore:{label:'Effort de guerre',unit:'pts',icon:Crosshair}
};
const metricKeys = Object.keys(metricInfo) as Metric[];
const faces = {top:'supérieure',bottom:'inférieure',north:'nord',south:'sud',east:'est',west:'ouest'};
const fmt = new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0});
const clock = new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',timeZone:'UTC'});
const show = (n:number) => fmt.format(n);
const time = (n:number) => clock.format(n);
function elapsed(ms:number) {
  const seconds=Math.max(0,Math.floor(ms/1000));
  const hours=Math.floor(seconds/3600);
  if (hours) return show(hours)+' h '+String(Math.floor(seconds/60)%60).padStart(2,'0')+' min';
  if (seconds>=60) return Math.floor(seconds/60)+' min '+String(seconds%60).padStart(2,'0')+' s';
  return seconds+' s';
}
const factionStyle = (color?:string) => ({'--ob-faction':color || 'var(--ob-gold)'} as CSSProperties);
const eventCategory = {command:'Ordre',progress:'Progression',blocked:'Blocage'};

function FactionMark({id, small=false}:{id:string;small?:boolean}) {
  const Icon = id === 'aurore' ? Orbit : id === 'forge' ? Layers3 : ScanLine;
  return <span className={'ob-mark'+(small?' ob-mark-small':'')} aria-hidden><Icon size={small?16:25} strokeWidth={1.7}/></span>;
}

function Empty({children}:{children:React.ReactNode}) {
  return <p className="ob-empty">{children}</p>;
}

function AgentButton({agent,view,onInspect}:{agent:ObserverAgent;view:ObserverView;onInspect:(id:string)=>void}) {
  const faction = view.factions.find(f=>f.id===agent.faction);
  return <button type="button" className="ob-agent-button" style={factionStyle(faction?.color)} onClick={()=>onInspect(agent.id)}>
    <span className="ob-dot"/><span><strong>{agent.name}</strong><small>{agent.profile}</small></span><ChevronRight size={15}/>
  </button>;
}

function FactionRanking({view,onInspect}:{view:ObserverView;onInspect:(id:string)=>void}) {
  const [metric,setMetric]=useState<Metric>('wealth');
  const [open,setOpen]=useState<string|null>(null);
  const ordered = [...view.factions].sort((a,b)=>b[metric]-a[metric] || a.name.localeCompare(b.name,'fr'));
  const top = ordered[0]?.[metric] ?? 0;
  return <section className="ob-wide-panel">
    <div className="ob-section-heading"><div><h2>Classement des factions</h2><p>Les résultats additionnent les colonies de chaque faction.</p></div>
      <label className="ob-inline-select"><ArrowDownWideNarrow size={17}/><span className="ob-sr">Classer par</span>
        <select value={metric} onChange={e=>setMetric(e.target.value as Metric)}>{metricKeys.map(k=><option key={k} value={k}>{metricInfo[k].label}</option>)}</select>
      </label>
    </div>
    <p className="ob-definition"><strong>{metricInfo[metric].label}</strong> · {view.metricDefinitions[metric]}</p>
    <div className="ob-ranking">{ordered.map((f,index)=>{
      const members=view.agents.filter(a=>a.faction===f.id);
      const rank=index===0 ? 1 : 1+ordered.filter(v=>v[metric]>f[metric]).length;
      return <article key={f.id} className="ob-rank" style={factionStyle(f.color)}>
        <div className="ob-rank-main"><span className="ob-rank-num">{String(rank).padStart(2,'0')}</span><FactionMark id={f.id}/>
          <div className="ob-rank-name"><h3>{f.name}</h3><span>{show(f.members)} colonies</span></div>
          <div className="ob-rank-value"><b>{show(f[metric])}</b> <span>{metricInfo[metric].unit}</span></div>
        </div>
        <div className="ob-bar"><i style={{width:top? (100*f[metric]/top)+'%' : 0}}/></div>
        <div className="ob-metric-strip">{metricKeys.filter(k=>k!==metric).map(k=><span key={k}><small>{metricInfo[k].label}</small><strong>{show(f[k])} <em>{metricInfo[k].unit}</em></strong></span>)}</div>
        <button className="ob-detail-toggle" aria-expanded={open===f.id} onClick={()=>setOpen(open===f.id?null:f.id)}>Colonies de la faction <ChevronDown size={15}/></button>
        {open===f.id&&<div className="ob-members">{members.map(a=><AgentButton key={a.id} agent={a} view={view} onInspect={onInspect}/>)}</div>}
      </article>;
    })}</div>
  </section>;
}

function Guilds({view,onInspect}:{view:ObserverView;onInspect:(id:string)=>void}) {
  const free=view.agents.filter(a=>!a.guild);
  return <div className="ob-wide-panel">
    <div className="ob-section-heading"><div><h2>Guildes et indépendants</h2><p>Chaque colonie peut fonder une guilde, y adhérer ou poursuivre son expansion seule.</p></div><Network size={26}/></div>
    <div className="ob-guild-grid">
      {view.guilds.map(g=>{
        const members=view.agents.filter(a=>g.members.includes(a.id));
        const founder=view.agents.find(a=>a.id===g.founder);
        const leader=view.agents.find(a=>a.id===g.leader);
        return <article className="ob-guild" key={g.id}><div className="ob-guild-title"><Network size={24}/><div><h3>{g.name}</h3><p>{founder?'Fondée par '+founder.name:'Guilde de colonies'}{leader && leader.id!==founder?.id?' · Dirigée par '+leader.name:''}</p></div></div>
          <div className="ob-guild-stats"><span><b>{show(g.wealth)}</b> cr de richesse</span><span><b>{show(g.power)}</b> pts de puissance</span><span><b>{show(g.territories)}</b> sites</span></div>
          <h4>Membres <span>{members.length}</span></h4>
          {members.length?members.map(a=><AgentButton key={a.id} agent={a} view={view} onInspect={onInspect}/>):<Empty>Aucun membre actuel.</Empty>}
        </article>;
      })}
      <article className="ob-guild ob-independent"><div className="ob-guild-title"><Compass size={24}/><div><h3>Indépendants</h3><p>Colonies sans guilde</p></div></div>
        <h4>Colonies <span>{free.length}</span></h4>
        {free.length?free.map(a=><AgentButton key={a.id} agent={a} view={view} onInspect={onInspect}/>):<Empty>Toutes les colonies ont rejoint une guilde.</Empty>}
      </article>
    </div>
    {!view.guilds.length&&<Empty>Aucune guilde fondée pour le moment. Les décisions d’adhésion apparaîtront dans le journal.</Empty>}
  </div>;
}

function ColonyBrief({agent,view,select,onReport}:{agent:ObserverAgent;view:ObserverView;select:(id:string)=>void;onReport:()=>void}) {
  const faction=view.factions.find(f=>f.id===agent.faction);
  const guild=view.guilds.find(g=>g.id===agent.guild);
  const index=view.agents.findIndex(a=>a.id===agent.id);
  const move=(by:number)=>select(view.agents[(index+by+view.agents.length)%view.agents.length].id);
  return <aside className="ob-colony" style={factionStyle(faction?.color)}>
    <div className="ob-panel-bar"><span><Crosshair size={16}/> Colonie suivie</span>
      <div className="ob-arrows"><button title="Colonie précédente" aria-label="Colonie précédente" onClick={()=>move(-1)}><ChevronLeft size={17}/></button>
        <button title="Colonie suivante" aria-label="Colonie suivante" onClick={()=>move(1)}><ChevronRight size={17}/></button></div></div>
    <div className="ob-colony-art">
      <span className="ob-art-coordinate">Face {faces[agent.home.face]} · {agent.home.u} / {agent.home.v}</span>
      <div className="ob-art-tags"><span className="ob-faction-tag"><span className="ob-dot"/>{faction?.name}</span></div>
    </div>
    <div className="ob-colony-body">
      <div className="ob-colony-identity"><label className="ob-colony-select"><span className="ob-sr">Choisir une colonie</span>
        <select value={agent.id} onChange={e=>select(e.target.value)}>{view.agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><ChevronDown size={17}/></label>
        <small>{agent.doctrine || agent.profile} <span>·</span> {guild?.name??'Indépendante'}</small></div>
      <div className={'ob-intent'+(agent.blocked?' ob-is-blocked':'')}><div className="ob-caption">{agent.blocked?<CircleAlert size={14}/>:<Waypoints size={14}/>} {agent.blocked?'Blocage signalé':'Objectif en cours'}</div>
        <strong>{agent.blocked || agent.intent}</strong>{agent.reason&&<p>{agent.reason}</p>}</div>
      <div className="ob-resources"><span><Coins size={14}/> Crédits <b>{show(agent.credits)}</b></span><span><i className="ob-ore iron"/> Fer <b>{show(agent.iron)}</b></span><span><i className="ob-ore copper"/> Cuivre <b>{show(agent.copper)}</b></span></div>
      <button className="ob-secondary ob-report-button" onClick={onReport}><BookOpen size={16}/> Rapport de colonie <ArrowRight size={15}/></button>
    </div>
  </aside>;
}

const roles:Record<string,string>={scout:'Éclaireur',army:'Escouade',worker:'Porteur',truck:'Transporteur'};
const orders:Record<string,string>={auto:'Reconnaissance',hold:'En position',move:'Déplacement',idle:'Disponible',attack:'Attaque',return:'Retour',patrol:'Patrouille',escort:'Escorte',manual:'Déplacement',pickup:'Collecte',delivery:'Livraison',city:'Commerce',mine:'Extraction',haul:'Transport',build:'Construction',unload:'Déchargement',repair:'Réparation',trade:'Commerce',standby:'En réserve'};
const contracts={open:'Proposé',active:'En cours',done:'Rempli',cancelled:'Annulé',failed:'Échoué'};

function ColonyReport({agent,view,onJournal,onClose}:{agent:ObserverAgent;view:ObserverView;onJournal:()=>void;onClose:()=>void}) {
  const focus=view.focus.me?.id===agent.id?view.focus.me:null;
  const members=agent.mobiles;
  const posts=view.outposts.filter(p=>p.owner===agent.id);
  const trips=view.expeditions.filter(p=>p.owner===agent.id);
  const services=view.services.filter(s=>s.client===agent.id||s.provider===agent.id);
  const person=(id:string|null)=>view.agents.find(a=>a.id===id)?.name ?? 'À pourvoir';
  const research=focus?.factory.research;
  const researchName = (id:string)=>INDUSTRY_TREE.find(n=>n.id===id)?.name??id;
  return <section className="ob-wide-panel ob-report">
    <div className="ob-section-heading"><div><div className="ob-caption"><BookOpen size={14}/> Rapport de colonie</div><h2>{agent.name}</h2><p>{agent.profile}{agent.doctrine?' · '+agent.doctrine:''} · Face {faces[agent.home.face]} · {agent.home.u} / {agent.home.v}</p></div>
      <button className="ob-secondary" onClick={onClose}><X size={16}/> Fermer</button></div>
    <div className="ob-report-intent"><Waypoints size={20}/><div><strong>{agent.intent}</strong><p>{agent.reason}</p>{agent.blocked&&<p className="ob-warning">{agent.blocked}</p>}</div></div>
    <div className="ob-report-grid">
      <article><h3><Warehouse size={17}/> Dépôt et collecte</h3>
        <dl>{([['Trésorerie',show(agent.credits)+' cr'],['Richesse totale',show(agent.wealth)+' cr'],['Fer en stock',show(agent.iron)],['Cuivre en stock',show(agent.copper)],['Minerais récoltés',show(agent.mined)],['Unités livrées',show(agent.delivered)]]).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {focus?.economy&&<ul>{ALL_GOODS.filter(g=>g!=='ferrite'&&g!=='cuivre'&&focus.economy!.stock[g]>0).map(g=><li key={g}>{GOODS[g].name}<span>{show(focus.economy!.stock[g])}</span></li>)}</ul>}
      </article>
      <article><h3><Flag size={17}/> Implantations</h3><p>{show(agent.territories)} sites · {show(trips.length)} missions en route</p>
        <ul><li>Camp de base <span>{agent.home.u} / {agent.home.v}</span></li>{posts.map(p=><li key={p.id}>{p.name}<span>Face {faces[p.point.face]} · {p.point.u} / {p.point.v}</span></li>)}
        {trips.map(t=><li key={t.id}>Expédition <span>Arrivée {time(t.trip.due)} UTC</span></li>)}</ul>
      </article>
      <article><h3><Factory size={17}/> Usine et recherche</h3><p>{show(agent.produced)} objets fabriqués · {show(agent.research)} acquis</p>
        <ul>{agent.pieces.map(p=><li key={p.id}>{FACTORY_KINDS[p.kind].name}<span>{p.active?'En service':'À l’arrêt'}</span></li>)}</ul>
        {focus&&<p>{show(view.rigs.filter(r=>r.owner===agent.id).length)} foreuses déployées · {show(view.focus.deposits.length)} gisements découverts</p>}
        {research&&<p>Recherche en cours · {researchName(research.id)} · fin à {time(research.ready)} UTC</p>}
        {focus?.factory.unlocked.length ? <p>Technologies · {focus.factory.unlocked.map(researchName).join(', ')}</p>:null}
      </article>
      <article><h3><Users size={17}/> Unités et fret</h3><p>{show(agent.workers)} porteurs · {show(agent.units)} soldats · {show(agent.power)} pts de puissance</p>
        <ul>{members.map((m,index)=><li key={m.id}><span className="ob-unit-name">{roles[m.kind]} {m.kind==='worker'||m.kind==='truck'?members.slice(0,index+1).filter(v=>v.kind===m.kind).length:''}</span><span>{orders[m.order]??m.order}{m.cargo?' · '+show(m.cargo)+' en fret':''}</span></li>)}</ul>
      </article>
      <article><h3><Network size={17}/> Contrats de service</h3>{services.length?<ul>{services.map(s=><li key={s.id}>{s.kind==='haul'?'Transport':'Escorte'} · {contracts[s.status]}<span>{person(s.provider)} · {show(s.reward)} cr</span></li>)}</ul>:<p>Aucun contrat enregistré pour cette colonie.</p>}</article>
      <article><h3><ScrollText size={17}/> Décisions</h3><p>{show(agent.actions)} actions IA · {show(agent.errors)} erreurs signalées</p><button className="ob-secondary" onClick={onJournal}>Lire son journal <ArrowRight size={15}/></button></article>
    </div>
  </section>;
}

function OverviewFeed({view,onJournal,onFactions}:{view:ObserverView;onJournal:()=>void;onFactions:()=>void}) {
  const ranked=[...view.factions].sort((a,b)=>b.wealth-a.wealth||a.name.localeCompare(b.name,'fr'));
  return <div className="ob-under-grid">
    <section className="ob-surface"><div className="ob-panel-bar"><span><Radio size={16}/> Transmissions récentes</span><button className="ob-link" onClick={onJournal}>Journal <ArrowRight size={14}/></button></div>
      {view.latest.length?<ul className="ob-transmissions">{view.latest.slice(0,4).map(e=><li key={e.id}>
        <i className={'ob-event-pin '+e.category}/><time dateTime={new Date(e.at).toISOString()}>{time(e.at)}</time>
        <div><strong>{e.name}</strong><p>{e.summary}</p></div><small>{eventCategory[e.category]}</small></li>)}</ul>:<Empty>Les premières décisions apparaîtront ici dès leur enregistrement.</Empty>}
    </section>
    <section className="ob-surface"><div className="ob-panel-bar"><span><Flag size={16}/> Richesse des factions</span><button className="ob-link" onClick={onFactions}>Comparer <ArrowRight size={14}/></button></div>
      <div className="ob-rank-preview">{ranked.map(f=><div key={f.id} style={factionStyle(f.color)}><FactionMark id={f.id} small/><strong>{f.name}</strong><b>{show(f.wealth)} <small>cr</small></b>
        <div className="ob-bar"><i style={{width:(ranked[0]?.wealth?f.wealth/ranked[0].wealth*100:0)+'%'}}/></div></div>)}</div>
    </section>
  </div>;
}

const sectionTitle:Record<Section,string>={monde:'Observatoire planétaire',factions:'Forces en présence',guildes:'Guildes et alliances',journal:'Journal de simulation'};

export function ObserverDashboard() {
  const {view,fault,denied,busy,speedPending,watch,setSpeed,retry}=useObserver();
  const [section,setSection]=useState<Section>('monde');
  const [selectedId,setSelected]=useState<string|null>(null);
  const [auto,setAuto]=useState(true);
  const [report,setReport]=useState(false);
  const [journalActor,setJournalActor]=useState('');
  const current=view?.agents.find(a=>a.id===selectedId)??view?.agents[0]??null;
  const select=useCallback((id:string)=>{setSelected(id);watch(id);},[watch]);
  const go=(next:Section)=>{
    setSection(next);
    setReport(false);
    setJournalActor('');
    window.scrollTo({top:0});
  };
  const inspect=(id:string)=>{setAuto(false);select(id);go('monde');};
  const inspectJournal=(id:string)=>{go('journal');setJournalActor(id);};
  useEffect(()=>{
    if (report && section==='monde') document.getElementById('ob-full-report')?.scrollIntoView({block:'start'});
  },[report,section]);
  const factionSites=view?.factions.reduce((sum,f)=>sum+f.territories,0)??0;
  return <div className="ob-shell">
    <header className="ob-topbar"><div className="ob-top-inner">
      <button className="ob-brand" onClick={()=>go('monde')} aria-label="STRATE, accueil de l’observatoire"><span className="ob-brand-emblem" aria-hidden/><b>STRATE</b></button>
      <nav className="ob-nav" aria-label="Vues de l’observatoire">{tabs.map(({id,title,icon:Icon})=>
        <button key={id} aria-current={section===id?'page':undefined} className={section===id?'selected':''} onClick={()=>go(id)}><Icon size={17}/>{title}</button>)}</nav>
      <div className="ob-private"><LockKeyhole size={14}/> Observateur privé</div>
    </div></header>
    <main className="ob-main">
      <div className="ob-intro">
        <div><div className="ob-intro-line"><span className={'ob-live '+(fault?'fault':'')}>{fault?<CircleAlert size={12}/>:<i/>}{fault?'Hors ligne':view?'En direct':'Connexion'}</span><span>Simulation de colonisation</span></div>
          <h1>{sectionTitle[section]}</h1></div>
        {view&&<div className="ob-clock"><div><span>Horloge simulée</span><b>{time(view.time)} <em>UTC</em></b></div>
          <label className="ob-speed"><span className="ob-sr">Vitesse de simulation</span>
            <select value={view.speed} disabled={speedPending} onChange={e=>setSpeed(Number(e.target.value) as ObserverSpeed)}>{[1,4,12].map(v=><option key={v} value={v}>×{v}</option>)}</select></label>
        </div>}
      </div>

      {fault&&<div className="ob-alert" role="alert"><CircleAlert size={18}/><span>{fault}{view?' Le dernier relevé reste affiché.':''}</span>
        {denied&&<a className="ob-secondary" href="/signin-with-chatgpt?return_to=%2F">Se connecter</a>}
        {!denied&&<button className="ob-secondary" disabled={busy} onClick={retry}><RefreshCw size={15}/> Réessayer</button>}</div>}
      {!view&&!fault&&<div className="ob-loading" role="status"><Orbit size={34}/><span>Connexion à la planète…</span></div>}

      {view&&section==='monde'&&<>
        <div className="ob-world-head">
          <div className="ob-world-title"><span className="ob-key"><Globe2 size={19}/></span><div><h2>Atlas planétaire</h2><span>Six faces · {show(view.planetSize)} blocs par côté</span></div></div>
          <div className="ob-world-stats"><span><Users size={15}/><b>{show(view.agents.length)}</b> colonies IA</span><span><Flag size={15}/><b>{show(factionSites)}</b> sites</span><span><Network size={15}/><b>{show(view.guilds.length)}</b> guildes</span></div>
        </div>
        <div className="ob-world-grid"><div className="obs-map-frame"><ObserverMap world={view} selectedId={current?.id??null} onSelect={select} auto={auto} onAutoChange={setAuto}/></div>
          {current?<ColonyBrief agent={current} view={view} select={id=>{setAuto(false);select(id);}} onReport={()=>{setAuto(false);setReport(true);}}/>:<Empty>Aucune colonie établie dans cette génération.</Empty>}
        </div>
        {report&&current&&<div id="ob-full-report"><ColonyReport agent={current} view={view} onJournal={()=>inspectJournal(current.id)} onClose={()=>setReport(false)}/></div>}
        <OverviewFeed view={view} onJournal={()=>go('journal')} onFactions={()=>go('factions')}/>
      </>}
      {view&&section==='factions'&&<FactionRanking view={view} onInspect={inspect}/>}
      {view&&section==='guildes'&&<Guilds view={view} onInspect={inspect}/>}
      {view&&section==='journal'&&<ObserverJournal key={journalActor} view={view} initialActor={journalActor} onInspect={inspect}/>}
      {view&&<footer className="ob-footer"><span><Hexagon size={12}/> Monde {view.generation.slice(0,8)}</span>
        <span>{elapsed(view.activity.simulatedMs)} simulées{view.activity.skippedMs>0?' · '+elapsed(view.activity.skippedMs)+' hors simulation':''}</span>
        <span>{view.simulationBehind>=10000?'Rattrapage en cours · '+show(view.simulationBehind/1000)+' s à traiter':'Dernier relevé · '+time(view.now)+' UTC'}</span></footer>}
    </main>
  </div>;
}
