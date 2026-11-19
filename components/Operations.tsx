'use client';

import {useState} from 'react';
import {ArrowDown, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUp, Check, Crosshair, Flag, Home, LocateFixed, Move, Plus, Radar, Shield, Swords, Undo2, Wrench} from 'lucide-react';
import {CELL, SIDE, chunkAt, parcelFocus, type Face, type Focus, type Point} from '@/lib/planet';
import {cost, FACTIONS, type View} from '@/lib/world';
import {BaseManagement,HaulerOrders} from './BaseManagement';
import {ResearchPanel} from './ResearchPanel';
import './Operations.css';

export type UnitKind = 'drill' | 'squad' | 'hauler';
type Order = Record<string, unknown>;
type Props = {
  panel: 'base' | 'troops' | 'war' | 'research'; now?:number; world: View; focus: Focus | null; selected: Point | null;
  armed: UnitKind; onArm: (unit:UnitKind)=>void; onFocus: (focus:Focus)=>void;
  selectedRelay?: string | null; onRelay?: (id:string)=>void;
  send: (action:Order)=>unknown; busy: boolean;
};

export function makeDeployAction(unit:UnitKind, block:Point|null, face:Face|null, relay?:string|null): Order {
  if (unit==='hauler') return {type:'logistics',kind:'dispatch',block};
  if (unit==='squad' && relay) return {type:'deploy', unit, relay};
  return {type:'deploy', unit, block, ...(face ? {face} : {})};
}

const same = (a:Point,b:Point) => a.x===b.x && a.y===b.y && a.z===b.z;
const pointKey = (a:Point) => [a.x,a.y,a.z].join('/');
const humanPoint = (a:Point) => [a.x,a.y,a.z].join(' · ');
const number = (n:number) => n.toLocaleString('fr-FR');
const leftTime = (ms:number) => {
  const seconds = Math.max(0, Math.ceil(ms/1000));
  return seconds<60 ? `${seconds} s` : `${Math.floor(seconds/60)} min ${String(seconds%60).padStart(2,'0')} s`;
};
const faces: Record<Face,string> = {top:'Sommet',bottom:'Nadir',north:'Nord',east:'Est',south:'Sud',west:'Ouest'};
const directions = [
  {name:'Ouest', key:'x-', x:-1, y:0, z:0, Icon:ArrowLeft}, {name:'Est', key:'x+', x:1,y:0,z:0,Icon:ArrowRight},
  {name:'Haut', key:'y+', x:0,y:1,z:0,Icon:ArrowUp}, {name:'Bas', key:'y-', x:0,y:-1,z:0,Icon:ArrowDown},
  {name:'Nord', key:'z-', x:0,y:0,z:-1,Icon:ArrowUp}, {name:'Sud', key:'z+', x:0,y:0,z:1,Icon:ArrowDown},
];
const offset = (p:Point,d:Point):Point=>({x:p.x+d.x,y:p.y+d.y,z:p.z+d.z});
const withinPlanet = (p:Point) => [p.x,p.y,p.z].every(v=> v>=0 && v<SIDE/CELL);
const tasks = {
  drill:{name:'Foreuse', subtitle:'Extraction automatique', image:'/art/crawler.webp'},
  hauler:{name:'Transporteur', subtitle:'Collecte et livraison', image:'/art/hauler.webp'},
  squad:{name:'Sentinelles', subtitle:'Capture et défense', image:'/art/sentinel.webp'},
};

function Health({health,total}:{health:number,total:number}) {
  const amount = Math.max(0,Math.min(100,Math.round(health/Math.max(total,1)*100)));
  return <div className="op-health" role="meter" aria-label="Intégrité mécanique" aria-valuemin={0} aria-valuemax={100} aria-valuenow={amount}>
    <span><i style={{width:`${amount}%`,background:amount<35?'#f18b69':undefined}}/></span><b>{amount} %</b>
  </div>;
}
function SignedOut() {
  return <section className="op-panel"><div className="op-empty"><Shield size={24}/><p>Rejoins une faction pour établir ta base et commander tes machines.</p></div></section>;
}

function BasePanel({world, focus, selected, onFocus, send, busy}:Props) {
  const me=world.me!;
  const {home,parcels}=me.base;
  const [anchorKey,setAnchorKey]=useState('');
  const [direction,setDirection]=useState('');
  const selectedChunk = selected ? chunkAt(selected) : null;
  const anchor = parcels.find(parcel=>pointKey(parcel)===anchorKey) ?? (selectedChunk && parcels.find(parcel=>same(parcel,selectedChunk))) ?? home;
  const available = (p:Point)=>withinPlanet(p) && !parcels.some(owned=>same(owned,p));
  const choices=directions.map(d=>({...d, parcel:offset(anchor,d)}));
  const choice = choices.find(item=>item.key===direction && available(item.parcel)) ?? choices.find(item=>selectedChunk && same(item.parcel,selectedChunk) && available(item.parcel)) ?? choices.find(item=>available(item.parcel));
  const ownedCount = parcels.length;
  const affordable = me.coins>=me.extensionPrice;
  return <section className="op-panel" aria-label="Territoire">
    <div className="op-home-banner"><img src="/art/quarry.webp" alt=""/><div><Shield size={16}/><b>Noyau protégé</b></div></div>
    <dl className="op-stats"><div><dt>Territoire</dt><dd>{number(ownedCount)} <small>{ownedCount===1?'parcelle':'parcelles'}</small></dd></div><div><dt>Solde</dt><dd>{number(me.coins)} <small>CR</small></dd></div></dl>
    <button type="button" className="op-btn" onClick={()=>onFocus(me.homeFocus)}><LocateFixed size={16}/> Recentrer sur ma base</button>
    <div className="op-rule"/><h3>Étendre le territoire</h3>
    <p className="op-note">Toi seul peux y creuser, même sous le noyau. Chaque extension de {CELL} blocs de côté doit toucher ton territoire. Son prix augmente après chaque achat.</p>
    <label className="op-label" htmlFor="op-anchor">Parcelle de départ</label>
    <select id="op-anchor" className="op-select" value={pointKey(anchor)} onChange={e=>{setAnchorKey(e.target.value);setDirection('')}}>
      {parcels.map((parcel,i)=><option key={pointKey(parcel)} value={pointKey(parcel)}>{same(parcel,home)?'Noyau':`Extension ${i}`} · {humanPoint(parcel)}</option>)}
    </select>
    <div className="op-label">Parcelle voisine</div>
    <div className="op-choices" role="group" aria-label="Direction d’extension">{choices.map(({key,Icon,name,parcel})=><button type="button" key={key} disabled={!available(parcel)} className={choice?.key===key?'selected':''} aria-pressed={choice?.key===key} title={!withinPlanet(parcel)?'Hors de la planète':!available(parcel)?'Déjà acquise':humanPoint(parcel)} onClick={()=>setDirection(key)}><Icon size={13}/>{name}</button>)}</div>
    {choice ? <><div className="op-location"><span>{humanPoint(choice.parcel)}</span><button type="button" onClick={()=>onFocus(parcelFocus(choice.parcel,focus?.face))} aria-label="Localiser la parcelle voisine"><Crosshair size={15}/> Localiser</button></div>
      <button type="button" className="op-btn primary" disabled={busy || !affordable} onClick={()=>send({type:'expand',parcel:choice.parcel})}><Plus size={16}/> Acheter · {number(me.extensionPrice)} CR</button>
      {!affordable && <p className="op-note">Il te manque {number(me.extensionPrice-me.coins)} CR.</p>}</> : <p className="op-note">Choisis une parcelle en bordure pour agrandir ton territoire.</p>}
  </section>;
}

function TroopsPanel({world,selected,focus,armed,onArm,send,busy,onFocus}:Props) {
  const me=world.me!;
  const drill=me.drill;
  const relay=world.relays.find(r=>r.id===me.target);
  const isDrill = armed==='drill';
  const health = isDrill ? drill.health : me.hp;
  const maxHealth = isDrill ? 100 : me.units*30;
  const repairCoins=isDrill?60:80, repairOre=isDrill?40:20;
  const repairEnabled = health<maxHealth && me.coins>=repairCoins && me.inventory.ferrite>=repairOre;
  const drillStatus=({ready:'Au hangar',deployed:'En extraction',damaged:'À réparer',exhausted:'Filon épuisé'})[drill.status];
  const fighterStatus=me.hp<=0 ? 'En réparation' : !relay ? 'Au hangar' : Math.hypot(me.x-relay.x,me.y-relay.y)<.3 ? `En poste · ${relay.name}` : `En route · ${relay.name}`;
  const deployed = isDrill ? !!drill.at : !!relay;
  const selectedRelay=selected ? world.relays.find(r=>r.point && same(r.point,selected)) : null;
  return <section className="op-panel" aria-label="Machines">
    <div className="op-palette" role="group" aria-label="Machine à déployer">
      {(Object.keys(tasks) as UnitKind[]).map(unit=>{const active=armed===unit;const data=tasks[unit];return <button key={unit} type="button" className={'op-unit-card '+(active?'selected':'')} aria-pressed={active} draggable onClick={()=>onArm(unit)} onDragStart={e=>{onArm(unit);e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',unit)}}>
        <img src={data.image} alt="" draggable={false}/><span className="op-unit-title"><b>{data.name}</b><small>{data.subtitle}</small></span><span className="op-unit-check">{active ? <Check size={13}/> : <Move size={12}/>}</span>
      </button>})}
    </div>
    <p className="op-note">Clic droit sur la carte ou glisse une machine vers sa cible. Sur écran tactile, touche la carte de la machine, puis le bloc où la déployer.</p>
    <div className="op-rule"/>{armed==='hauler'?<HaulerOrders me={me} busy={busy} send={send} selected={selected} onFocus={onFocus}/>:<><div className="op-subline"><h3>{tasks[armed].name}</h3><span className="op-tag">{isDrill?`${me.rigs} foreuse${me.rigs>1?'s':''}`:`${me.units} unités`}</span></div>
    <div className="op-line"><span>État</span><b>{isDrill?drillStatus:fighterStatus}</b></div>
    <Health health={health} total={maxHealth}/>
    {isDrill && drill.at && <div className="op-line"><span>Position</span><b>{humanPoint(drill.at)}</b></div>}
    <div className="op-order-box"><span className="op-label">Cible sélectionnée</span><strong>{selected?humanPoint(selected):'Aucune case sélectionnée'}</strong>
      <p className="op-note">{isDrill?'Choisis un bloc exposé sur lequel poser la foreuse.':'Vise un relais public ou une case à moins de 32 blocs. Tu peux aussi donner l’ordre depuis le Front.'}</p>
      <button type="button" className="op-btn primary" disabled={busy || !selected || !focus || health<=0} onClick={()=>send(makeDeployAction(armed,selected,focus?.face??null,selectedRelay?.id))}><Crosshair size={16}/> Déployer ici</button>
    </div>
    <div className="op-btn-row"><button type="button" className="op-btn" disabled={busy || !deployed} onClick={()=>send({type:'recall',unit:armed})}><Undo2 size={13}/> Rappeler</button><button type="button" className="op-btn" disabled={busy || !repairEnabled} onClick={()=>send({type:'repair',unit:armed})}><Wrench size={13}/> Réparer</button></div>
    <p className="op-note">Réparation complète · {repairCoins} CR et {repairOre} ferrite.</p>
    <div className="op-rule"/><h3>Améliorations</h3>
    {((isDrill ? [['pick','Pioche'],['rig','Foreuse supplémentaire'],['power','Moteur'],['core','Noyau']] : [['army','Sentinelle supplémentaire']]) as [string,string][]).map(([kind,label])=>{
      const price=cost(me,kind);const need=kind==='army' ? {ferrite:50,cuivre:10} : kind==='power'?{cuivre:40*(me.power+1)}:kind==='core'?{prisme:3*(me.core+1)}:{};
      const maxed=kind==='pick'?me.pick>=10:kind==='rig'?me.rigs>=12:kind==='power'?me.power>=12:kind==='core'?me.core>=10:me.units>=30;
      const items=Object.entries(need) as [keyof typeof me.inventory,number][];
      return <button type="button" className="op-upgrade" key={kind} disabled={busy||maxed||me.coins<price||items.some(([item,n])=>me.inventory[item]<n)} onClick={()=>send({type:'upgrade',kind})}><div><b>{label}</b><span>{maxed?'Niveau maximal':`${number(price)} CR${items.map(([r,n])=>` · ${n} ${r}`).join('')}`}</span></div><Plus size={15}/></button>;
    })}
    <button type="button" className="op-base-link" onClick={()=>onFocus(me.homeFocus)}><Home size={14}/> Rejoindre la base</button></>}
  </section>;
}

function WarPanel({world,selectedRelay,onRelay,onFocus,onArm,send,busy}:Props) {
  const me=world.me!;
  const [localRelay,setLocalRelay]=useState('');
  const selected=world.relays.find(r=>r.id===(selectedRelay||localRelay||me.target)) ?? world.relays[0];
  if (!selected) return <section className="op-panel"><p>Aucun relais disponible.</p></section>;
  const enemy=world.enemies.find(e=>e.target===selected.id);
  const guards=world.players.filter(p=>p.hp>0&&p.target===selected.id&&Math.hypot(p.x-selected.x,p.y-selected.y)<.3);
  const truce=selected.allianceUntil>world.serverTime;
  return <section className="op-panel" aria-label="Front des factions">
    <div className="op-war-head"><Radar size={22}/><div><b>La Ruche</b><span>Prochaine incursion dans {leftTime(world.nextWave-world.serverTime)}</span></div></div>
    <div className="op-rule"/><h3>Relais stratégiques</h3>
    <div className="op-relays" role="group" aria-label="Choisir un relais">{world.relays.map(r=>{const active=selected.id===r.id;const hostile=world.enemies.some(e=>e.target===r.id);return <button key={r.id} type="button" aria-pressed={active} className={active?'selected':''} onClick={()=>{setLocalRelay(r.id);onRelay?.(r.id)}}>{hostile?<Swords size={15}/>:<Flag size={15}/>}<span><b>{r.name}</b><small style={{color:r.owner?FACTIONS[r.owner].color:undefined}}>{hostile?'Incursion':r.owner?FACTIONS[r.owner].name:'Neutre'}</small></span></button>})}</div>
    <div className="op-order-box"><div className="op-subline"><h3>{selected.name}</h3><span className="op-tag">{faces[selected.site.face]}</span></div>
      <div className="op-line"><span>Défenseurs en poste</span><b>{guards.length}</b></div>
      {enemy && <div className="op-enemy"><b>La Ruche · {Math.ceil(enemy.hp)} PV</b><Health health={enemy.hp} total={enemy.maxHp}/></div>}
      {enemy && Math.hypot(enemy.x-selected.x,enemy.y-selected.y)<.3 && <p className="op-note">Une escouade de ta faction en poste ici évite le détour aux navettes qui partent vers les chantiers à 64 blocs ou moins du relais.</p>}
      {truce && <p className="op-note">Trêve · {leftTime(selected.allianceUntil-world.serverTime)} restantes.</p>}
      {!truce && selected.capturing && <p className="op-note">Capture par {FACTIONS[selected.capturing].name} · {Math.floor(selected.progress)} %</p>}
      <p className="op-note">Par minute, les défenseurs éligibles se partagent 36 CR et un bonus d’extraction de 6 blocs. Déploie ta foreuse pour extraire ta part. Contre la Ruche, les factions peuvent défendre ensemble.</p>
      <div className="op-btn-row"><button type="button" className="op-btn" onClick={()=>onFocus(selected.site)}><LocateFixed size={14}/> Localiser</button><button type="button" className="op-btn primary" disabled={busy||me.hp<=0||me.target===selected.id} onClick={()=>{onArm('squad');send(makeDeployAction('squad',null,null,selected.id))}}><ArrowDownToLine size={14}/> {me.target===selected.id?'Ordre actif':'Envoyer'}</button></div>
    </div>
    {me.harvestBonus>0 && <div className="op-line"><span>Bonus de ta foreuse</span><b>+{number(me.harvestBonus)} blocs/min</b></div>}
    <div className="op-line"><span>Ta faction</span><b style={{color:FACTIONS[me.faction].color}}>{FACTIONS[me.faction].name}</b></div>
    <div className="op-line"><span>Relais contrôlés</span><b>{world.relays.filter(r=>r.owner===me.faction).length} / {world.relays.length}</b></div>
    {me.target && <button type="button" className="op-base-link" disabled={busy} onClick={()=>send({type:'recall',unit:'squad'})}><Undo2 size={14}/> Rappeler les sentinelles</button>}
  </section>;
}

export default function Operations(props:Props) {
  if (!props.world.me) return <SignedOut/>;
  if (props.panel==='research') return <ResearchPanel me={props.world.me} busy={props.busy} send={props.send}/>;
  if (props.panel==='base') return <BaseManagement me={props.world.me} now={props.now??props.world.serverTime} busy={props.busy} send={props.send} onFocus={props.onFocus} territory={<BasePanel {...props}/>}/>;
  if (props.panel==='war') return <WarPanel {...props}/>;
  return <TroopsPanel {...props}/>;
}
