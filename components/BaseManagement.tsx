'use client';

import {useState, type CSSProperties} from 'react';
import {ArrowRight, Boxes, Check, Crosshair, Flag, House, LocateFixed, MapPin, Pause, Pickaxe, Play, Plus, Route, Truck, Warehouse} from 'lucide-react';
import {GOODS, RAW_GOODS, type RawGood} from '@/lib/economy';
import {chunkAt, FACE_ORDER, pointOnFace, type Focus, type Point} from '@/lib/planet';
import type {View} from '@/lib/world';

type Player = NonNullable<View['me']>;
type Logistics = Player['logistics'];
type Convoy = Logistics['convoys'][number];
type Order = (action:Record<string,unknown>)=>unknown;
type Props = {me:Player; now:number; busy:boolean; send:Order; onFocus:(focus:Focus)=>void};
const format = new Intl.NumberFormat('fr-FR');
const number = (n:number)=>format.format(n);
const quantity = (stock:Record<RawGood,number>)=>RAW_GOODS.reduce((sum,good)=>sum+stock[good],0);
const position = (p:Point)=>`${p.x} · ${p.y} · ${p.z}`;
function sameParcel(a:Point,b:Point) {
  const ca=chunkAt(a),cb=chunkAt(b);
  return ca.x===cb.x&&ca.y===cb.y&&ca.z===cb.z;
}
const phaseNames = {idle:'Au dépôt',outbound:'Vers le chantier',returning:'Retour au dépôt',unloading:'Déchargement'};
function closestView(p:Point) {
  return FACE_ORDER.map(face=>pointOnFace(face,p)).reduce((best,f)=>f.depth<best.depth?f:best);
}
function duration(ms:number) {
  const s=Math.max(0,Math.ceil(ms/1000));
  return s>=60?`${Math.floor(s/60)} min ${String(s%60).padStart(2,'0')} s`:`${s} s`;
}
function contents(stock:Record<RawGood,number>) {
  return RAW_GOODS.filter(g=>stock[g]>0).map(g=>`${number(stock[g])} ${GOODS[g].name.toLocaleLowerCase('fr')}`).join(' · ');
}
function OreMark({good}:{good:RawGood}) {
  return <i className="mg-ore" data-good={good} aria-hidden="true" style={{'--ore':GOODS[good].color} as CSSProperties}/>;
}
function CostButton({name,price,coins,limit,onClick,busy}:{name:string;price:number;coins:number;limit:boolean;onClick:()=>void;busy:boolean}) {
  return <div className="mg-purchase"><button type="button" className="op-btn" disabled={busy||limit||coins<price} onClick={onClick}><Plus size={14}/><span>{name}</span><b>{limit?'Maximum':`${number(price)} CR`}</b></button>
    {!limit&&coins<price&&<small>Il manque {number(price-coins)} CR.</small>}</div>;
}
function Depot({me,busy,send}:Props) {
  const log=me.logistics;
  const occupied=log.used+log.reserved;
  const full=occupied>=log.capacity;
  return <>
    <div className="mg-depot-top"><Warehouse size={22}/><div><h3>Dépôt de minerais</h3><small>Niveau {log.depotLevel}</small></div><strong title="Places occupées sur la capacité totale">{number(occupied)}<span> / {number(log.capacity)}</span></strong></div>
    <div className={'mg-meter'+(full?' full':'')} role="meter" aria-label="Occupation du dépôt" aria-valuemin={0} aria-valuemax={log.capacity} aria-valuenow={Math.min(log.capacity,occupied)}><i style={{width:`${Math.min(100,100*occupied/log.capacity)}%`}}/></div>
    {log.reserved>0&&<p className="mg-meta">{number(log.reserved)} unités réservées pour les offres au comptoir.</p>}
    {full&&<p className="mg-warning">Dépôt plein. Vends ou transforme une partie du stock pour permettre aux navettes de décharger.</p>}
    <div className="mg-stock"><div className="mg-stock-row mg-stock-head"><span>Minerai</span><span>Au dépôt</span><span>En transit</span></div>{RAW_GOODS.map(good=><div className="mg-stock-row" key={good}><span><OreMark good={good}/>{GOODS[good].name}</span><b>{number(me.inventory[good])}</b><span>{number(log.convoys.reduce((sum,c)=>sum+c.cargo[good],0))}</span></div>)}</div>
    <CostButton name="Agrandir le dépôt" price={log.depotCost} coins={me.coins} limit={log.depotLevel>=log.depotLimit} busy={busy} onClick={()=>send({type:'logistics',kind:'depot'})}/>
  </>;
}
function ConvoyCard({convoy,now,payload,onFocus}:{convoy:Convoy;now:number;payload:number;onFocus:Props['onFocus']}) {
  const {phase,point,started,due,cargo,id,detour}=convoy;
  const progress=due>started?Math.min(1,Math.max(0,(now-started)/(due-started))):0;
  const fraction=phase==='outbound'?progress:phase==='returning'?1-progress:0;
  const loaded=quantity(cargo);
  return <article className="mg-convoy" data-phase={phase}>
    <div className="mg-convoy-head"><b>Transporteur {String(id).padStart(2,'0')}</b><span>{phaseNames[phase]}</span></div>
    <div className="mg-track" aria-hidden="true"><Warehouse size={16}/><div><i style={{left:`${fraction*100}%`}}><Truck size={15}/></i></div><Pickaxe size={16}/></div>
    <div className="mg-convoy-foot"><span>Soute <b>{number(loaded)} / {number(payload)}</b></span>{(phase==='outbound'||phase==='returning')&&<span>Arrivée dans <b>{duration(due-now)}</b></span>}{phase==='unloading'&&<span>Au quai</span>}</div>
    {phase==='outbound'&&detour&&<p className="mg-detour"><Route size={14}/><span><strong>Détour · {detour.relay}</strong><small>La Ruche occupe le relais. Trajet prolongé de {duration(detour.delayMs)}.</small></span></p>}
    {loaded>0&&<p className="mg-meta">{contents(cargo)}</p>}
    {point&&<button type="button" className="op-base-link" onClick={()=>onFocus(closestView(point))}><LocateFixed size={13}/> Localiser le chantier</button>}
  </article>;
}
function Fleet({me,now,busy,send,onFocus}:Props) {
  const log=me.logistics;
  return <><div className="mg-fleet-banner"><img src="/art/hauler.webp" alt=""/><div><h3>Flotte de transport</h3><b>{log.fleet} / {log.fleetLimit}</b></div></div>
    <p className="op-note">{log.paused?'Départs suspendus. Les navettes en route terminent leur trajet.':'Les navettes font automatiquement la liaison entre tes chantiers et la base.'}</p>
    <button type="button" className="op-btn mg-toggle" aria-pressed={log.paused} disabled={busy} onClick={()=>send({type:'logistics',kind:'pause'})}>{log.paused?<Play size={14}/>:<Pause size={14}/>} {log.paused?'Reprendre les départs':'Suspendre les départs'}</button>
    <div className="mg-convoys">{log.convoys.map(c=><ConvoyCard key={c.id} convoy={c} now={now} payload={log.payload} onFocus={onFocus}/>)}</div>
    <CostButton name="Construire une navette" price={log.fleetCost} coins={me.coins} limit={log.fleet>=log.fleetLimit} busy={busy} onClick={()=>send({type:'logistics',kind:'fleet'})}/>
    <div className="op-rule"/><div className="mg-section-head"><h3>Points d’enlèvement</h3><b>{log.sites.length}</b></div>
    {log.priority&&<div className="mg-priority"><Flag size={13}/><span>Parcelle prioritaire<br/><b>{position(log.priority)}</b></span></div>}
    {log.sites.length===0&&<p className="op-note">Le minerai extrait apparaît ici en attendant son enlèvement.</p>}
    <div className="mg-pickups">{log.sites.map(site=>{const priority=!!log.priority&&sameParcel(site.point,log.priority);return <div className="mg-site" key={position(site.point)}>
      <div><button type="button" onClick={()=>onFocus(closestView(site.point))} title="Localiser le chantier"><MapPin size={14}/>{position(site.point)}</button><b>{number(site.quantity)} u.</b></div>
      <p>{contents(site.stock)}</p><button className="mg-link-btn" type="button" disabled={busy||priority} aria-pressed={priority} onClick={()=>send({type:'logistics',kind:'dispatch',block:site.point})}>{priority?<Check size={12}/>:<Flag size={12}/>} {priority?'Parcelle prioritaire':'Prioriser cet enlèvement'}</button>
    </div>})}</div>
  </>;
}
export function BaseManagement(props:Props&{territory:React.ReactNode}) {
  const {me,onFocus,territory}=props;
  const [tab,setTab]=useState<'depot'|'fleet'|'territory'>('depot');
  const log=me.logistics;
  return <section className="op-panel mg-panel" aria-label="Gestion de la base">
    <div className="mg-base-nav" role="group" aria-label="Vue de la base">{([{id:'depot',label:'Dépôt',icon:Warehouse},{id:'fleet',label:'Navettes',icon:Truck},{id:'territory',label:'Territoire',icon:Flag}] as const).map(({id,label,icon:Icon})=><button type="button" key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}><Icon size={15}/>{label}</button>)}</div>
    {tab==='territory'?territory:<>
      <div className="mg-flow" aria-label="Circuit de récolte">{[{label:'Au chantier',amount:log.waiting,Icon:Pickaxe},{label:'En transit',amount:log.inTransit,Icon:Truck},{label:'Au dépôt',amount:quantity(me.inventory),Icon:Boxes}].map(({label,amount,Icon},i)=><div key={label}><Icon size={17}/><strong>{number(amount)}</strong><span>{label}</span>{i<2&&<ArrowRight size={11} className="mg-flow-next"/>}</div>)}</div>
      {tab==='depot'?<Depot {...props}/>:<Fleet {...props}/>}
      <button type="button" className="op-base-link" onClick={()=>onFocus(me.homeFocus)}><Crosshair size={13}/> Recentrer sur ma base</button>
    </>}
  </section>;
}
export function HaulerOrders({me,busy,send,selected,onFocus}:{me:Player;busy:boolean;send:Order;selected:Point|null;onFocus:Props['onFocus']}) {
  const log=me.logistics;
  return <><div className="mg-section-head"><h3>Transporteurs</h3><b>{log.fleet} en flotte</b></div>
    <div className="op-line"><span>Soute par navette</span><b>{log.payload} unités</b></div>
    <div className="op-line"><span>En attente sur le terrain</span><b>{number(log.waiting)} unités</b></div>
    <p className="op-note">Choisis un chantier prioritaire pour les trajets automatiques. Suis les navettes dans Base › Navettes.</p>
    <button type="button" className="op-btn primary" disabled={busy||!selected} onClick={()=>selected&&send({type:'logistics',kind:'dispatch',block:selected})}><Truck size={16}/> Prioriser la case sélectionnée</button>
    {log.priority&&<button type="button" className="op-base-link" onClick={()=>onFocus(closestView(log.priority!))}><LocateFixed size={14}/> Voir la parcelle prioritaire</button>}
    <button type="button" className="op-base-link mg-return" onClick={()=>onFocus(me.homeFocus)}><House size={14}/> Rejoindre la base</button>
  </>;
}
