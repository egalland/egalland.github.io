'use client';
import AnimatedSprite from './AnimatedSprite';
import {useState} from 'react';
import {ArrowRight,ArrowDownUp,Check,Compass,Crosshair,Factory,Flag,Gem,GitBranch,MapPin,Pause,Play,Plus,Shield,Skull,Swords,Truck,Users,Warehouse,Wrench} from 'lucide-react';
import type {MapObject} from './FrontierMap';
import type {FrontierView,Target} from '@/lib/frontier';
import {range,type Place} from '@/lib/frontier-geography';
import {FACTIONS,type Resource} from '@/lib/world';
import {RESEARCH_TREE,researchAvailable} from '@/lib/research';
import {GOODS,RAW_GOODS,RECIPES,type RefinedGood,type Good} from '@/lib/economy';

export type FrontierTab='terrain'|'workforce'|'contracts'|'war'|'base'|'factory'|'convoys'|'market'|'research'|'social'|'journal';
export type FrontierMode='select'|'move'|'attack'|'patrol';
type Send=(a:Record<string,unknown>)=>Promise<FrontierView|null>;
type Props={view:FrontierView;now:number;busy:boolean;send:Send;tab:FrontierTab;setTab:(t:FrontierTab)=>void;selected?:MapObject;selectionCount:number;onSelect:(ids:string[])=>void;onFocus:(p:Place)=>void;onMode:(m:FrontierMode)=>void};
type Personal=NonNullable<FrontierView['me']>;
const number=(n:number)=>Math.floor(n).toLocaleString('fr-FR');
const total=(s:Record<string,number>)=>Object.values(s).reduce((a,b)=>a+b,0);
const duration=(ms:number)=>ms<=0?'Arrivée imminente':ms<60000?Math.ceil(ms/1000)+' s':Math.ceil(ms/60000)+' min';
const phases={manual:'Déplacement libre',idle:'Au dépôt',pickup:'Vers le gisement',delivery:'Retour chargé',city:'Liaison commerciale',return:'Retour à vide',repair:'Secours en route'};
export function Sprite({index,large=false}:{index:number;large?:boolean}) {return <AnimatedSprite id={(['city','depot','drill','truck','army','monster'] as const)[index]??'depot'} large={large}/>;}
function Stat({name,value}:{name:string;value:string|number}) {return <div className="fr-stat"><span>{name}</span><strong>{value}</strong></div>;}
function Title({children,icon}:{children:React.ReactNode;icon:React.ReactNode}) {return <div className="fr-title">{icon}<h1>{children}</h1></div>;}
export function targetFor(view:FrontierView,o:MapObject|null):Target|null {
  if(!o)return null;
  if(o.kind==='camp')return {kind:'camp',id:o.id.slice(5)};
  if(o.kind==='deposit'){
    const d=view.deposits.find(d=>d.id===o.id);
    if(d?.guards)return {kind:'camp',id:d.id};
    const victim=view.rigs.find(r=>r.deposit===o.id&&r.owner!==view.me?.id&&r.hull>0);
    return victim?{kind:'rig',id:victim.id}:null;
  }
  if(o.own)return null;
  if(o.kind==='base'||o.kind==='army'||o.kind==='truck')return {kind:o.kind,id:o.id.slice(o.id.indexOf('/')+1)};
  if(o.kind==='factory')return {kind:'factory',id:o.id};
  if(o.kind==='rig')return {kind:'rig',id:o.id};
  return null;
}
export default function FrontierConsole(props:Props) {
  const {view,tab,send,now,busy}=props,me=view.me!;
  return <>
    {tab==='terrain'&&<FieldPanel {...props} me={me}/>}
    {tab==='base'&&<BasePanel onFactory={()=>props.setTab('factory')} view={view} me={me} send={send} now={now} busy={busy}/>}
    {tab==='convoys'&&<ConvoyPanel {...props} me={me}/>}
    {tab==='market'&&<MarketPanel {...props} me={me}/>}
    {tab==='research'&&<ResearchPanel me={me} send={send} busy={busy}/>}
    {tab==='social'&&<SocialPanel view={view} me={me} send={send} busy={busy}/>}
    <details className="fr-journal"><summary>Journal de l’expédition</summary>{view.events.length?view.events.slice(0,8).map(e=><p key={e.id}>{e.text}</p>):<p>Les découvertes et les arrivées de cargaisons apparaîtront ici.</p>}</details>
  </>;
}
function FieldPanel({view,me,selected,selectionCount,send,busy,now,onSelect,onFocus,onMode,setTab}:Props&{me:Personal}) {
  const rig=view.rigs.find(r=>r.id===selected?.id);
  const node=view.deposits.find(d=>d.id===selected?.id||selected?.id==='camp/'+d.id||rig?.deposit===d.id);
  return <>
    <Title icon={<Compass size={18}/>}>{selectionCount>1?'Groupe de '+selectionCount:selected?.name??'Carnet d’expédition'}</Title>
    {selected&&selected.kind!=='deposit'&&<div className="fr-selected"><Sprite index={selected.sprite??2} large/></div>}
    {node&&<>
      <div className="fr-deposit-emblem" style={{color:GOODS[node.ore].color}}><Gem size={48}/><strong>{GOODS[node.ore].name}</strong></div>
      <div className="fr-grid"><Stat name="Réserve commune" value={number(node.remaining)}/><Stat name="Foreuses en place" value={view.rigs.filter(r=>r.deposit===node.id&&r.hull>0).length+' / 3'}/></div>
      <progress aria-label="Réserve du gisement" value={node.remaining} max={node.total}/>
      <p className="fr-note-text">Environ {Math.ceil(node.remaining/(me.drillRate*1440))} jours de production avec une foreuse à cette cadence.</p>
      {node.guards>0?<div className="fr-danger"><Skull size={17}/><span>Camp gardien · {number(node.guards)} PV<br/><small>Déployez une escouade pour ouvrir l’exploitation.</small></span></div>:node.respawn>now&&<div className="fr-note"><Shield size={15}/><span>Le camp peut revenir dans {duration(node.respawn-now)}.</span></div>}
      <button className="fr-primary" disabled={busy||node.remaining<=0||me.coins<90||me.inventory.ferrite<20} onClick={()=>void send({type:'install',deposit:node.id})}><Factory size={16}/>Installer une foreuse <kbd>F</kbd></button>
      <p className="fr-cost">90 CR · 20 fer · collecte vers le dépôt</p>
      {node.guards>0&&<button className="fr-button danger" disabled={busy} onClick={()=>{onSelect(['army']);void send({type:'attack',target:{kind:'camp',id:node.id}});}}><Swords size={16}/>Attaquer le camp</button>}
      {view.rigs.filter(r=>r.deposit===node.id).map(r=><div className="fr-site-row" key={r.id}><span>{r.owner===me.id?'Votre foreuse':view.players.find(p=>p.id===r.owner)?.name??'Foreuse adverse'} <small>{number(r.hull)} PV</small></span>{r.owner!==me.id&&<button disabled={busy||r.hull<=0} onClick={()=>void send({type:'attack',target:{kind:'rig',id:r.id}})}>Attaquer</button>}</div>)}
    </>}
    {rig&&rig.owner===me.id&&<>
      <div className="fr-grid"><Stat name="Minerai au chantier" value={number(total(rig.stock??{}))}/><Stat name="Intégrité" value={number(rig.hull)+' / 180'}/></div>
      <div className="fr-button-row"><button className="fr-button" disabled={busy} onClick={()=>void send({type:'rigPause',id:rig.id})}>{rig.active?<Pause size={15}/>:<Play size={15}/>} {rig.active?'Suspendre':'Reprendre'}</button><button className="fr-button" disabled={busy} onClick={()=>void send({type:'rigRepair',id:rig.id})}><Wrench size={15}/>Réparer</button></div>
      <button className="fr-text-button" disabled={busy} onClick={()=>void send({type:'rigRecall',id:rig.id})}>Rappeler après enlèvement du stock</button>
    </>}
    {selected?.id==='base'&&<button className="fr-primary" onClick={()=>setTab('base')}><Warehouse size={16}/>Gérer la base</button>}
    {selected?.id==='scout'&&<>
      <div className="fr-grid"><Stat name="Détection" value="260 m"/><Stat name="Intégrité" value={number(me.scout.hull)+' / 90'}/></div>
      <p>Le repérage révèle les gisements et les villes à portée. Les découvertes restent dans votre atlas.</p>
      <button className="fr-primary" disabled={busy} onClick={()=>void send({type:'scout'})}>{me.scout.auto?<Pause size={16}/>:<Compass size={16}/>} {me.scout.auto?'Suspendre l’exploration':'Explorer automatiquement'}</button>
      <button className="fr-button" onClick={()=>onMode('move')}><Crosshair size={16}/>Choisir une destination <kbd>M</kbd></button>
      <button className="fr-text-button" onClick={()=>void send({type:'return',unit:'scout'})}>Rappeler à la base</button>
    </>}
    {selected?.id==='army'&&<>
      <div className="fr-grid"><Stat name="Combattants" value={me.units}/><Stat name="Intégrité" value={number(me.army.hull)+' / '+me.units*50}/><Stat name="Munitions" value={me.army.ammo+' / 120'}/><Stat name="Butin en soute" value={total(me.army.loot)}/></div>
      <p className="fr-note-text">Ordre actuel · {me.army.order==='attack'?'Assaut':me.army.order==='escort'?'Escorte':me.army.order==='patrol'?'Patrouille':me.army.order==='return'?'Retour':me.army.trip?'Déplacement':'Tenir la position'}</p>
      <button className="fr-primary" onClick={()=>onMode('attack')}><Swords size={16}/>Cibler une attaque <kbd>A</kbd></button>
      <button className="fr-button" onClick={()=>onMode('patrol')}><Flag size={16}/>Définir une patrouille <kbd>P</kbd></button>
      <button className="fr-button" aria-pressed={me.army.pvp} disabled={busy} onClick={()=>void send({type:'rules'})}>{me.army.pvp?'Joueurs hostiles et créatures':'Créatures et défense uniquement'}</button>
      <button className="fr-button" disabled={busy} onClick={()=>void send({type:'train'})}><Plus size={16}/>Recruter · {80+Math.round(me.units*me.units*3)} CR</button><p className="fr-cost">15 fer · 3 cuivre</p>
      <button className="fr-text-button" onClick={()=>void send({type:'return',unit:'army'})}>Retour, soins et ravitaillement</button>
    </>}
    {selected?.kind==='truck'&&me.trucks.filter(t=>t.id===selected.id).map(t=><div key={t.id}><div className="fr-grid"><Stat name="Ordre" value={phases[t.phase]}/><Stat name="Cargaison" value={number(total(t.cargo))+' unités'}/></div><button className="fr-primary" disabled={busy} onClick={()=>void send({type:'escort',id:t.id})}><Shield size={16}/>Affecter mon escouade à l’escorte</button><button className="fr-button" onClick={()=>setTab('convoys')}>Préparer les convois</button></div>)}
    {selected?.kind==='city'&&<>
      <div className="fr-note"><Shield size={18}/><span>Comptoir neutre<br/><small>Ville et entrepôts indestructibles. Aucun combat dans son enceinte.</small></span></div>
      <button className="fr-primary" onClick={()=>setTab('market')}>Ouvrir le comptoir <ArrowRight size={15}/></button>
    </>}
    {selected&&!selected.own&&targetFor(view,selected)&&!node&&<button className="fr-button danger" disabled={busy} onClick={()=>void send({type:'attack',target:targetFor(view,selected)})}><Swords size={16}/>Attaquer cette cible</button>}
    <div className="fr-section-heading"><h2>Gisements découverts</h2><span>{view.deposits.length}</span></div>
    <div className="fr-discoveries">{view.deposits.slice().sort((a,b)=>range(me.scout.point,a.point)-range(me.scout.point,b.point)).slice(0,18).map(d=><button key={d.id} onClick={()=>{onSelect([d.id]);onFocus(d.point);}}><i style={{background:GOODS[d.ore].color}}/><span>{GOODS[d.ore].name}<small>{number(range(me.home,d.point))} m de la base</small></span>{d.guards>0?<Skull size={14}/>:<b>{number(d.remaining)}</b>}</button>)}</div>
  </>;
}
function BasePanel({view,me,send,now,busy,onFactory}:{onFactory:()=>void;view:FrontierView;me:Personal;send:Send;now:number;busy:boolean}) {
  return <>
    <Title icon={<Warehouse size={19}/>}>Base & production</Title><div className="fr-selected"><Sprite index={1} large/></div>
    <div className="fr-grid"><Stat name="Intégrité" value={number(me.hull)+' / 500'}/><Stat name="Défenses" value={me.turrets+' / 6'}/><Stat name="Matières livrées" value={number(me.delivered)}/><Stat name="Foreuses" value={view.rigs.filter(r=>r.owner===me.id).length+' / '+Math.min(8,me.rigs+1)}/></div>
    <h2>Dépôt</h2><div className="fr-row"><span>Stock disponible</span><b>{number(total(me.inventory))} / {number(me.depotCapacity)}</b></div>
    <progress aria-label="Occupation du dépôt" value={total(me.inventory)} max={me.depotCapacity}/>
    {RAW_GOODS.map(r=><div className="fr-row" key={r}><span><i style={{background:GOODS[r].color}}/>{GOODS[r].name}</span><b>{number(me.inventory[r])}</b></div>)}
    <div className="fr-button-row"><button className="fr-button" disabled={busy} onClick={()=>void send({type:'upgrade',kind:'depot'})}><Plus size={14}/>Dépôt · {190+80*me.core} CR</button><button className="fr-button" disabled={busy} onClick={()=>void send({type:'upgrade',kind:'rig'})}><Factory size={14}/>Parc · {240+100*me.rigs} CR</button></div>
    <h2>Défendre le camp</h2><button className="fr-button" disabled={busy||me.turrets>=6} onClick={()=>void send({type:'turret'})}><Shield size={16}/>Tourelle · {90+60*me.turrets} CR</button><p className="fr-cost">30 fer · 5 cuivre</p>
    <button className="fr-button" disabled={busy} onClick={()=>void send({type:'repair'})}><Wrench size={16}/>Base et unités · 30 CR</button><p className="fr-cost">10 fer · l’éclaireur est récupéré à la base</p>
    <h2>Production industrielle</h2><p className="fr-muted">Les machines sur le terrain transforment le minerai. Ramenez leurs produits au dépôt pour construire et débloquer la suite.</p><button className="fr-primary" onClick={onFactory}>Construire mon usine <ArrowRight size={16}/></button>
    {Object.keys(RECIPES).map(key=>{const r=key as RefinedGood;return <div className="fr-row" key={r}><span>{GOODS[r].name}</span><b>{me.economy?.stock[r]??0}</b></div>;})}
    <p className="fr-note-text">Vos ordres automatiques progressent pendant 4 h d’absence. Les gisements gardent leur réserve restante.</p>
  </>;
}
function TownSelect({cities,value,onChange}:{cities:FrontierView['cities'];value:string;onChange:(s:string)=>void}) {
  return <label className="fr-field">Ville connue<select value={value} onChange={e=>onChange(e.target.value)}>{cities.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>;
}
function ShipmentFields({ore,quantity,onOre,onQuantity,max}:{ore:Resource;quantity:string;max:number;onOre:(r:Resource)=>void;onQuantity:(s:string)=>void}) {
  return <div className="fr-form-row"><label>Marchandise<select value={ore} onChange={e=>onOre(e.target.value as Resource)}>{RAW_GOODS.map(r=><option key={r} value={r}>{GOODS[r].name}</option>)}</select></label><label>Unités<input type="number" min="1" max={max} step="1" value={quantity} onChange={e=>onQuantity(e.target.value)}/></label></div>;
}
function ConvoyPanel({view,me,send,now,busy,onFocus}:Props&{me:Personal}) {
  const [city,setCity]=useState(''),[ore,setOre]=useState<Resource>('ferrite'),[quantity,setQuantity]=useState('16'),[escort,setEscort]=useState(true);
  const town=view.cities.find(t=>t.id===city)??view.cities[0],n=Number(quantity),valid=Number.isInteger(n)&&n>=1&&n<=me.payload;
  return <>
    <Title icon={<Truck size={19}/>}>Convois & escortes</Title><p>Les collecteurs relient les gisements au dépôt. Les convois commerciaux desservent les villes connues.</p>
    {me.trucks.map((t,i)=><article className="fr-truck" key={t.id}>
      <div className="fr-row"><span><Truck size={17}/>Transporteur {i+1}</span><b>{phases[t.phase]}</b></div>
      <div className="fr-cargo"><Sprite index={3}/><div><strong>{total(t.cargo)} unités</strong><span>{t.trip?'Arrivée · '+duration(t.trip.due-now):t.phase==='idle'?'Prêt pour une liaison':t.phase==='repair'?'Récupération · '+duration((t.disabledUntil??now)-now):'Quai de déchargement'}</span><small>{t.guns?'Tourelle embarquée':'Transporteur léger'} · {number(t.hull)} PV</small></div></div>
      <label className="fr-field">Affectation<select aria-label={'Affectation du transporteur '+(i+1)} value={t.role??'collect'} disabled={busy} onChange={e=>void send({type:'truckRole',id:t.id,role:e.target.value})}><option value="collect">Collecte des gisements</option><option value="trade">Fret vers les villes</option><option value="standby">Attente au dépôt</option></select></label>
      {RAW_GOODS.filter(r=>t.cargo[r]>0).map(r=><span className="fr-tag" key={r}>{t.cargo[r]} {GOODS[r].name}</span>)}
      <div className="fr-button-row"><button className="fr-button" onClick={()=>onFocus(t.point)}><MapPin size={14}/>Localiser</button><button className="fr-button" disabled={busy} onClick={()=>void send({type:'escort',id:t.id})}><Shield size={14}/>Escorter</button></div>
      {!t.guns&&<button className="fr-text-button" disabled={busy||t.phase!=='idle'} onClick={()=>void send({type:'truckArm',id:t.id})}>Tourelle embarquée · 70 CR + 10 cuivre</button>}
      {!t.guns&&<button className="fr-text-button" disabled={busy||t.phase!=='idle'||!me.economy?.stock.module} onClick={()=>void send({type:'truckArm',id:t.id,assemble:true})}>Assembler avec 1 moteur électrique</button>}
    </article>)}
    <button className="fr-primary" disabled={busy||me.trucks.length>=8||!me.factory.unlocked.includes('motorisation')||!me.factory.pieces.some(p=>p.kind==='repairbay'&&p.active&&p.hull>0)||(me.economy?.stock.module??0)<2} onClick={()=>void send({type:'truck'})}><Plus size={16}/>Transporteur · {170+60*me.trucks.length} CR</button><p className="fr-cost">Motorisation au MAM · atelier actif · 20 fer + 2 moteurs</p>
    <h2>Préparer une liaison</h2><TownSelect cities={view.cities} value={town?.id??''} onChange={setCity}/>
    <p className="fr-note-text">Pour libérer un camion, affectez-le au fret. Il termine sa collecte puis attend au dépôt.</p>
    <ShipmentFields max={me.payload} ore={ore} quantity={quantity} onOre={setOre} onQuantity={setQuantity}/>
    <label className="fr-checkbox"><input type="checkbox" checked={escort} onChange={e=>setEscort(e.target.checked)}/>Affecter l’escouade à l’escorte</label>
    <button className="fr-primary" disabled={busy||!town||!valid||me.inventory[ore]<n||!me.trucks.some(t=>t.phase==='idle')} onClick={()=>void send({type:'ship',city:town.id,ore,quantity:n,escort})}><Truck size={16}/>Expédier ce convoi</button>
    <button className="fr-button" disabled={busy||!town||!valid} onClick={()=>void send({type:'autoTrade',city:town.id,ore,quantity:n,enabled:!me.autoTrade})}>{me.autoTrade?<Pause size={15}/>:<Play size={15}/>} {me.autoTrade?'Suspendre la liaison répétée':'Répéter quand le stock le permet'}</button>
    <p className="fr-note-text">Une attaque doit être menée par une escouade à proximité. Les assauts consomment ravitaillement et munitions. Le butin doit revenir à la base.</p>
  </>;
}
function MarketPanel({view,me,send,busy,onFocus,selected}:Props&{me:Personal}) {
  const [city,setCity]=useState(selected?.kind==='city'?selected.id:''),[ore,setOre]=useState<Resource>('ferrite'),[quantity,setQuantity]=useState('16'),[price,setPrice]=useState('40'),[want,setWant]=useState<Resource|'credits'>('credits');
  const town=view.cities.find(t=>t.id===city)??view.cities[0],market=view.markets.find(m=>m.city===town?.id),n=Number(quantity),valid=Number.isInteger(n)&&n>=1&&n<=me.payload;
  return <>
    <Title icon={<ArrowDownUp size={19}/>}>Comptoirs de la planète</Title><div className="fr-selected"><Sprite index={0} large/></div>
    <TownSelect cities={view.cities} value={town?.id??''} onChange={setCity}/>
    <div className="fr-note"><Compass size={16}/><p>{view.cities.length===1?'Seul le comptoir le plus proche est connu.':'Votre atlas contient '+view.cities.length+' villes.'} Les autres se révèlent lorsque vos unités passent à moins de 300 m.</p></div>
    {town&&<div className="fr-button-row"><button className="fr-button" onClick={()=>onFocus(town.point)}><MapPin size={15}/>Localiser</button><button className="fr-button" disabled={busy} onClick={()=>void send({type:'move',unit:'scout',point:town.point})}><Compass size={15}/>Envoyer l’éclaireur</button></div>}
    <h2>Entrepôts dans cette ville</h2>{RAW_GOODS.map(r=><div className="fr-row" key={r}><span><i style={{background:GOODS[r].color}}/>{GOODS[r].name}</span><b>{number(market?.stock[r]??0)}</b></div>)}
    <ShipmentFields max={me.payload} ore={ore} quantity={quantity} onOre={setOre} onQuantity={setQuantity}/>
    <div className="fr-button-row"><button className="fr-button" disabled={busy||!town||!valid||me.inventory[ore]<n||!me.trucks.some(t=>t.phase==='idle')} onClick={()=>void send({type:'ship',city:town.id,ore,quantity:n,escort:false})}>Expédier du dépôt</button><button className="fr-button" disabled={busy||!town||!valid||(market?.stock[ore]??0)<n} onClick={()=>void send({type:'withdraw',city:town.id,ore,quantity:n})}>Rapatrier à la base</button></div>
    <button className="fr-primary" disabled={busy||!town||!valid||(market?.stock[ore]??0)<n} onClick={()=>void send({type:'townSell',city:town.id,good:ore,quantity:n})}>Vendre en ville · {valid?n*GOODS[ore].value:0} CR</button>
    <details className="fr-details"><summary>Proposer une vente ou un troc</summary><label>Je demande<select value={want} onChange={e=>setWant(e.target.value as typeof want)}><option value="credits">Crédits</option>{RAW_GOODS.filter(r=>r!==ore).map(r=><option key={r} value={r}>{GOODS[r].name}</option>)}</select></label><label>Total demandé<input value={price} type="number" min="1" max="1000000" onChange={e=>setPrice(e.target.value)}/></label><button className="fr-button" disabled={busy||!town||!valid||(market?.stock[ore]??0)<n||!Number.isSafeInteger(Number(price))||Number(price)<1} onClick={()=>void send({type:'offerPost',city:town.id,give:ore,quantity:n,want,price:Number(price)})}>Déposer l’offre au comptoir</button></details>
    <h2>Offres de ce comptoir</h2>{market?.offers.length?market.offers.map(o=><article className="fr-offer" key={o.id}><small>{o.ownerName}</small><p>{o.quantity} {GOODS[o.give].name} <ArrowRight size={13}/> {o.price} {o.want==='credits'?'CR':GOODS[o.want].name}</p><button className="fr-button" disabled={busy} onClick={()=>void send({type:o.owner===me.id?'offerCancel':'offerTake',id:o.id,city:town.id})}>{o.owner===me.id?'Retirer mon offre':'Accepter cet échange'}</button></article>):<p className="fr-note-text">Aucune offre publiée dans cette ville.</p>}
  </>;
}
function ResearchPanel({me,send,busy}:{me:Personal;send:Send;busy:boolean}) {
  return <><Title icon={<GitBranch size={19}/>}>Recherches</Title><p>{me.research.length} compétences acquises sur {RESEARCH_TREE.length}.</p>
    {(['Extraction','Logistique','Défense'] as const).map(branch=><section className="fr-branch" key={branch}><h2>{branch}</h2>
      {RESEARCH_TREE.filter(n=>n.branch===branch).map(node=>{
        const owned=me.research.includes(node.id),can=researchAvailable(me,node.id);
        return <article className={'fr-research '+(owned?'owned':'')} key={node.id}>
          <div className="fr-row"><strong>{node.name}</strong>{owned&&<Check size={16}/>}</div><p>{node.description}</p>
          {node.requires.length>0&&<small>Prérequis · {node.requires.map(id=>RESEARCH_TREE.find(n=>n.id===id)!.name).join(' + ')}</small>}
          <button className="fr-button" disabled={busy||owned||!can} onClick={()=>void send({type:'research',skill:node.id})}>{owned?'Acquise':number(node.credits)+' CR · '+Object.entries(node.materials).map(([r,n])=>n+' '+r).join(' · ')}</button>
        </article>;
      })}
    </section>)}
  </>;
}
function SocialPanel({view,me,send,busy}:{view:FrontierView;me:Personal;send:Send;busy:boolean}) {
  const [guildName,setGuildName]=useState(''),[message,setMessage]=useState(''),[channel,setChannel]=useState(false);
  const guild=view.guilds.find(g=>g.id===me.guild);
  return <>
    <Title icon={<Users size={19}/>}>Routes & rencontres</Title><h2>{guild?guild.name:'Fonder une guilde'}</h2>
    {guild?<><p>{guild.members.length} membres. Les membres d’une même guilde ne peuvent s’attaquer.</p><button className="fr-text-button" disabled={busy} onClick={()=>void send({type:'guildLeave'})}>Quitter la guilde</button></>:
      <form className="fr-inline-form" onSubmit={e=>{e.preventDefault();void send({type:'guildCreate',name:guildName});}}><input aria-label="Nom de la guilde" value={guildName} maxLength={28} onChange={e=>setGuildName(e.target.value)} placeholder="Nom de guilde"/><button disabled={busy||guildName.trim().length<2}>Créer</button></form>}
    {view.guilds.filter(g=>g.invited).map(g=><div className="fr-note" key={g.id}><span>Invitation · {g.name}</span><button onClick={()=>void send({type:'guildAccept',id:g.id})}>Rejoindre</button></div>)}
    <h2>Mineurs du monde</h2><div className="fr-players">{view.players.filter(p=>p.id!==me.id).map(p=><div key={p.id}><span><i className={p.online?'online':''}/>{p.name}<small>{FACTIONS[p.faction].name}</small></span><button disabled={busy||me.friends.includes(p.id)} onClick={()=>void send({type:me.requests.includes(p.id)?'friendAccept':'friendRequest',player:p.id})}>{me.friends.includes(p.id)?'Ami':me.requests.includes(p.id)?'Accepter':'Ajouter'}</button>{guild?.leader===me.id&&!p.guild&&<button disabled={busy} onClick={()=>void send({type:'guildInvite',player:p.id})}>Inviter</button>}</div>)}</div>
    <h2>Radio</h2><label className="fr-checkbox"><input type="checkbox" checked={channel} disabled={!guild} onChange={e=>setChannel(e.target.checked)}/>Canal de guilde</label>
    <div className="fr-chat" aria-label="Messages de la radio">{view.chat.filter(m=>channel?!!m.guild:!m.guild).map(m=><p key={m.id}><strong>{m.name}</strong><time>{new Date(m.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time><span>{m.text}</span></p>)}</div>
    <form className="fr-inline-form" onSubmit={async e=>{e.preventDefault();if(await send({type:'chat',text:message,guild:channel}))setMessage('');}}><input aria-label="Votre message" maxLength={300} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Émettre un message…"/><button aria-label="Envoyer le message" disabled={busy||!message.trim()}><ArrowRight size={18}/></button></form>
  </>;
}
