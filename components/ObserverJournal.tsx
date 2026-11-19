'use client';

import {useEffect, useEffectEvent, useRef, useState} from 'react';
import {Activity, ArrowDownLeft, ArrowLeft, ArrowRight, ChevronDown, CircleAlert, ListFilter, MapPin, RefreshCw, Search, Terminal} from 'lucide-react';
import type {ActivityEntry} from '@/lib/activity-journal';
import type {ObserverView} from '@/lib/observatory';
import './observer-journal.css';

type Props = {view: ObserverView; initialActor?: string; onInspect: (id: string) => void};
type Query = {actor: string; generation: string; category: string; search: string};
type Page = {entries: ActivityEntry[]; next: string|null; generations?: string[]};
type RequestState = {key: string; page?: Page; error?: string};
type Actor = {id: string; name: string; generation?:string};

const categories = {
  command: {label:'Ordre', plural:'Ordres', Icon: Terminal},
  progress: {label:'Progression', plural:'Progression', Icon: Activity},
  blocked: {label:'Blocage', plural:'Blocages', Icon: CircleAlert},
} as const;
const fullDate = new Intl.DateTimeFormat('fr-FR', {dateStyle:'long', timeZone:'UTC'});
const clock = new Intl.DateTimeFormat('fr-FR', {timeStyle:'medium', timeZone:'UTC'});
const number = new Intl.NumberFormat('fr-FR', {maximumFractionDigits:1});
const balanceFields = {credits:'Crédits', iron:'Fer', copper:'Cuivre', delivered:'Livrés', mined:'Extraits', workers:'Ouvriers', buildings:'Bâtiments', research:'Recherches'};
const cleanName = (name: string) => name.replace(/^\[IA\]\s*/i, '').trim();
const record = (value: unknown): Record<string,unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string,unknown> : {};

function LogDetail({entry}: {entry:ActivityEntry}) {
  const c = entry.context;
  const before = record(c.before), after = record(c.after), delta = record(c.delta), mind = record(after.ai);
  const reason = typeof c.reason === 'string' ? c.reason : typeof mind.reason === 'string' ? mind.reason : '';
  const goal = typeof c.objective === 'string' ? c.objective : typeof mind.goal === 'string' ? mind.goal : '';
  const changes = [];
  for (const [key,label] of Object.entries(balanceFields)) {
    const first = before[key], last = after[key], stated = delta[key];
    const difference = typeof stated === 'number' ? stated : typeof first === 'number' && typeof last === 'number' ? last-first : 0;
    if (difference) changes.push([label,(difference>0?'+':'') + number.format(difference)]);
  }
  if (typeof delta.produced === 'number' && delta.produced) changes.push(['Fabriqués','+' + number.format(delta.produced)]);
  return <div className="oj-facts">
    {goal && <p><b>Objectif</b>{goal}</p>}
    {reason && <p><b>Motif</b>{reason}</p>}
    {typeof c.detail === 'string' && <p><b>Diagnostic</b>{c.detail}</p>}
    {typeof c.advice === 'string' && <p><b>Reprise possible</b>{c.advice}</p>}
    {typeof c.durationSeconds === 'number' && <p><b>Durée simulée</b>{number.format(c.durationSeconds)} s</p>}
    {changes.length>0 && <div className="oj-variation">{changes.map(([label,value])=><span key={label}>{label} <strong>{value}</strong></span>)}</div>}
    <details className="oj-raw"><summary>Données de l’événement</summary>
      <div>Action <code>{entry.action}</code> · Version <code>{entry.generation}</code></div>
      {Object.keys(c).length>0 && <pre>{JSON.stringify(c,null,2)}</pre>}
    </details>
  </div>;
}

function EventRow({entry, expanded, onToggle, onActor, onInspect, showVersion}: {
  entry:ActivityEntry; expanded:boolean; onToggle:()=>void; onActor:()=>void; onInspect?:()=>void; showVersion:boolean;
}) {
  const {label,Icon} = categories[entry.category];
  return <article className="oj-event" data-category={entry.category} data-expanded={expanded}>
    <button type="button" className="oj-summary" aria-expanded={expanded} onClick={onToggle}>
      <span className="oj-mark"><Icon size={16} strokeWidth={1.7}/></span>
      <span className="oj-message"><span className="oj-meta"><strong>{cleanName(entry.name)}</strong><span>{label}</span>
        {showVersion && <small title={entry.generation}>{entry.generation.slice(0,8)}</small>}</span>
        <span className="oj-copy">{entry.summary}</span></span>
      <time dateTime={new Date(entry.at).toISOString()}>{clock.format(entry.at)}</time>
      <ChevronDown size={16} className="oj-chevron"/>
    </button>
    {expanded && <div className="oj-body"><LogDetail entry={entry}/>
      <div className="oj-row-actions">
        <button onClick={onActor}><ListFilter size={14}/> Filtrer cette IA</button>
        {onInspect && <button onClick={onInspect}><MapPin size={14}/> Voir la colonie</button>}
      </div>
    </div>}
  </article>;
}

export function ObserverJournal({view,initialActor='',onInspect}:Props) {
  const [actor,setActor] = useState(initialActor);
  const [pickedActor,setPickedActor] = useState<Actor|null>(null);
  const [category,setCategory] = useState('');
  const [generation,setGeneration] = useState('current');
  const [text,setText] = useState('');
  const [search,setSearch] = useState('');
  const [history,setHistory] = useState<string[]>([]);
  const [expanded,setExpanded] = useState('');
  const [revision,setRevision] = useState(0);
  const [autoRefresh,setAutoRefresh] = useState(true);
  const [response,setResponse] = useState<RequestState|null>(null);
  const [generations,setGenerations] = useState<string[]>([]);
  const cache = useRef(new Map<string,Page>());
  const cursor = history.at(-1) ?? '';
  const query:Query = {actor,category,generation,search};
  const serialized = JSON.stringify({...query,cursor});
  const key = view.generation + '/' + serialized;
  const current = response?.key===key ? response : undefined;
  const page = current?.page;
  const canInspect = new Set(view.agents.map(a=>a.id));
  const roster = new Map<string,Actor>();
  if (generation==='current' || generation==='archive') {
    for (const a of view.agents) roster.set(a.id,{id:a.id,name:a.name,generation:view.generation});
  }
  if (page && generation!=='current') {
    for (const entry of page.entries) roster.set(entry.actor,{id:entry.actor,name:entry.name,generation:entry.generation});
  }
  if (pickedActor) roster.set(pickedActor.id,pickedActor);
  const isFiltered = !!actor || !!category || !!text || generation!=='current';

  useEffect(()=>{
    const timer = window.setTimeout(()=>{
      const next = text.trim();
      if (next!==search) {setSearch(next);setHistory([]);setExpanded('');}
    },240);
    return ()=>window.clearTimeout(timer);
  },[text,search]);

  const followable = !cursor && !expanded && (generation==='current' || generation==='archive');
  const shouldFollow = useEffectEvent(()=>autoRefresh && followable);
  useEffect(()=>{
    const controller = new AbortController();
    let busy = false;
    const load = async(live = false)=>{
      if (busy || controller.signal.aborted) return;
      busy = true;
      try {
        const previous = cache.current.get(key);
        if (previous && !live) setResponse({key,page:previous});
        const result = await fetch('/api/frontier',{
          method:'POST',credentials:'same-origin',cache:'no-store',
          headers:{'Content-Type':'application/json'},signal:controller.signal,
          body:JSON.stringify({op:'journal',query:JSON.parse(serialized)}),
        });
        const json = await result.json().catch(()=>({})) as Page & {error?:string};
        if (!result.ok) throw new Error(json.error || 'Le journal est momentanément indisponible.');
        if (!Array.isArray(json.entries)) throw new Error('Le serveur a renvoyé une page de journal illisible.');
        if (controller.signal.aborted || (live && !shouldFollow())) return;
        if (cache.current.size>=5 && !cache.current.has(key)) cache.current.delete(cache.current.keys().next().value!);
        cache.current.set(key,json);
        setResponse({key,page:json});
        if (json.generations) setGenerations(json.generations);
      } catch (e) {
        if (!controller.signal.aborted) setResponse({key,page:cache.current.get(key),error:e instanceof Error?e.message:'Échec de lecture du journal.'});
      } finally {busy = false;}
    };
    const onVisible = ()=>{if (!document.hidden && shouldFollow()) void load(true);};
    const first = window.setTimeout(()=>{void load();},0);
    const timer = window.setInterval(onVisible,15000);
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{
      controller.abort();window.clearTimeout(first);window.clearInterval(timer);
      document.removeEventListener('visibilitychange',onVisible);
    };
  },[key,serialized,revision]);

  const firstPage = ()=>{setHistory([]);setExpanded('');};
  const filterActor = (a:Actor)=>{setPickedActor(a);setActor(a.id);firstPage();};
  const reset = ()=>{
    setActor('');setPickedActor(null);setCategory('');setGeneration('current');setText('');setSearch('');firstPage();
  };
  const filterGeneration = (value:string)=>{setGeneration(value);setActor('');setPickedActor(null);firstPage();};
  const currentGen = view.generation;
  const archived = generations.filter(g=>g!==currentGen);
  return <section className="oj" aria-label="Journal des IA">
    <div className="oj-filterbox">
      <div className="oj-filters">
        <label className="oj-search"><span>Recherche</span><span className="oj-input">
          <Search size={15}/><input type="search" maxLength={80} value={text} placeholder="IA, action ou événement…" onChange={e=>setText(e.target.value)}/>
        </span></label>
        <label><span>Colonie</span><select value={actor} onChange={e=>{setActor(e.target.value);setPickedActor(roster.get(e.target.value)??null);firstPage();}}>
          <option value="">Toutes les IA</option>{Array.from(roster.values(),a=><option key={a.id} value={a.id}>{cleanName(a.name)}{generation==='archive' && a.generation && a.generation!==view.generation?' · '+a.generation.slice(0,8):''}</option>)}
        </select></label>
        <label><span>Version</span><select value={generation} onChange={e=>filterGeneration(e.target.value)}>
          <option value="current">Monde actuel</option><option value="archive">Toutes les versions</option>
          {archived.map(g=><option key={g} value={g}>{g}</option>)}
        </select></label>
      </div>
      <div className="oj-flow"><div className="oj-category" role="group" aria-label="Catégorie">
        <button aria-pressed={!category} onClick={()=>{setCategory('');firstPage();}}>Tout</button>
        {Object.entries(categories).map(([id,{plural,Icon}])=><button key={id} aria-pressed={category===id} onClick={()=>{setCategory(id);firstPage();}}><Icon size={13}/>{plural}</button>)}
      </div>{isFiltered && <button className="oj-clear" onClick={reset}>Effacer les filtres</button>}</div>
    </div>
    <div className="oj-ledger">
      <div className="oj-head"><div className="oj-heading"><h2>Événements</h2><span>Heure simulée · UTC</span></div>
        <div className="oj-tools">
          {followable ? <label className="oj-auto"><input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)}/> Suivi en direct</label> :
            <span className="oj-auto">{expanded?'Lecture du détail':cursor?'Historique':'Archive'}</span>}
          <button className="oj-reload" aria-label="Actualiser les événements" title="Actualiser les événements" onClick={()=>setRevision(n=>n+1)}><RefreshCw size={15}/></button>
        </div>
      </div>
      {current?.error && <div role="alert" className="oj-error"><CircleAlert size={16}/>{current.error}<button onClick={()=>setRevision(n=>n+1)}>Réessayer</button></div>}
      {!current && <p className="oj-placeholder" role="status">Lecture des événements…</p>}
      {page && !page.entries.length && <p className="oj-placeholder">Aucun événement enregistré{isFiltered?' avec ces filtres':''}.</p>}
      {page?.entries.map((entry,i)=>{
        const date = fullDate.format(entry.at);
        const firstOfDay = i===0 || fullDate.format(page.entries[i-1].at)!==date;
        return <div key={entry.id}>{firstOfDay && <div className="oj-day">{date}</div>}
          <EventRow entry={entry} expanded={expanded===entry.id} onToggle={()=>setExpanded(expanded===entry.id?'':entry.id)}
            onActor={()=>filterActor({id:entry.actor,name:entry.name,generation:entry.generation})}
            onInspect={entry.generation===currentGen && canInspect.has(entry.actor)?()=>onInspect(entry.actor):undefined}
            showVersion={generation==='archive'}/>
        </div>;
      })}
      <div className="oj-pages"><div className="oj-count"><ArrowDownLeft size={14}/><span>Page {history.length+1}
        {page && ' · '+number.format(page.entries.length)+' événement'+(page.entries.length>1?'s':'')}</span></div>
        <div className="oj-pagers">
          <button disabled={!history.length} onClick={()=>{setHistory(h=>h.slice(0,-1));setExpanded('');}}><ArrowLeft size={14}/> Plus récents</button>
          <button disabled={!page?.next} onClick={()=>{if(page?.next){setHistory(h=>h.at(-1)===page.next?h:[...h,page.next!]);setExpanded('');}}}>Plus anciens <ArrowRight size={14}/></button>
        </div>
      </div>
    </div>
  </section>;
}
