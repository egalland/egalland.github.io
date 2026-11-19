'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowDownUp,Compass,Crosshair,Flag,Factory,GitBranch,Home,MessageCircle,Pause,Radio,Shield,Swords,Truck,Users,Handshake,X} from 'lucide-react';
import AnimatedSprite from './AnimatedSprite';
import JournalPanel from './JournalPanel';
import PlaytestPanel from './PlaytestPanel';
import MAMPanel from './MAMPanel';
import CooperationPanel from './CooperationPanel';
import FactoryPanel from './FactoryPanel';
import {type FactoryTool,type Direction,type BuildMark} from '@/lib/factory-grid';
import FrontierMap,{mapObjects,type MapObject} from './FrontierMap';
import FieldArrival from './FieldArrival';
import FrontierConsole,{Sprite,type FrontierTab,type FrontierMode,targetFor} from './FrontierConsole';
import {useFrontier} from '@/lib/use-frontier';
import type {Place} from '@/lib/frontier-geography';
import {FACTIONS,type Faction} from '@/lib/world';
import {GOODS,RAW_GOODS} from '@/lib/economy';
import '@/app/frontier.css';

const tabs=[{id:'terrain',name:'Expédition',Icon:Compass},{id:'base',name:'Base',Icon:Home},{id:'factory',name:'Usine',Icon:Factory},{id:'workforce',name:'Collecte',Icon:Users},{id:'convoys',name:'Convois',Icon:Truck},{id:'market',name:'Troc',Icon:ArrowDownUp},{id:'contracts',name:'Services',Icon:Handshake},{id:'war',name:'Faction',Icon:Flag},{id:'research',name:'MAM',Icon:GitBranch},{id:'social',name:'Réseau',Icon:MessageCircle},{id:'journal',name:'Journal',Icon:Radio}] as const;
export default function FrontierApp() {
  const game=useFrontier(),{view,busy,send,now}=game,me=view?.me;
  const [lobby,setLobby]=useState(true);
  const [tab,setTab]=useState<FrontierTab>('terrain'),[selection,setSelection]=useState<string[]>([]);
  const [mode,setMode]=useState<FrontierMode>('select'),[focus,setFocus]=useState<Place|null>(null);
  const [build,setBuild]=useState<FactoryTool|null>(null),[rotation,setRotation]=useState<Direction>(1);
  const rotate=()=>setRotation(d=>((d+1)%4) as Direction);
  function tool(t:FactoryTool|null){setBuild(t);setMode('select');setMobileRail(false);}
  const buildQueue=useRef(Promise.resolve());
  function construct(cells:BuildMark[]){const kind=build;if(kind)buildQueue.current=buildQueue.current.then(async()=>{await send({type:'factory',op:kind==='erase'?'remove':'place',kind,cells});});}
  const [name,setName]=useState(''),[faction,setFaction]=useState<Faction>('aurore'),[guide,setGuide]=useState(false),[mobileRail,setMobileRail]=useState(false);
  const groups=useRef<Record<string,string[]>>({}),initial=useRef(false),assignGroup=useRef(0),firstView=useRef(false);
  const objects=mapObjects(view,now),selected=objects.find(o=>o.id===selection[0]);
  const node=view?.deposits.find(d=>d.id===selected?.id||selected?.id==='camp/'+d.id||view.rigs.find(r=>r.id===selected?.id)?.deposit===d.id);
  const previousGeneration=useRef<string|null>(null);
  useEffect(()=>{
    if(!view||view.generation===previousGeneration.current)return;
    if(previousGeneration.current){initial.current=false;firstView.current=false;groups.current={};setSelection([]);setBuild(null);setMode('select');setLobby(true);}
    previousGeneration.current=view.generation;
  },[view?.generation]);
  useEffect(()=>{if(me&&!initial.current){initial.current=true;setFocus(me.home);setSelection(me.society.workers.map(w=>w.id));}},[me]);
  useEffect(()=>{if(view&&!firstView.current){firstView.current=true;if(!view.me&&view.playtest?.scene)setFocus({...view.playtest.scene.home});}},[view]);
  function look(at:Place){setFocus({...at});setMobileRail(false);}
  function choose(ids:string[]){setSelection(ids);setMode('select');if(ids.length){setTab(me?.society.workers.some(w=>ids.includes(w.id))?'workforce':me?.factory.pieces.find(p=>p.id===ids[0])?.kind==='mam'?'research':me?.factory.pieces.some(p=>p.id===ids[0])?'factory':'terrain');if(window.matchMedia('(max-width:800px)').matches)setMobileRail(true);}}
  function chooseMode(next:FrontierMode){setMode(next);setMobileRail(false);}
  function order(at:Place,object:MapObject|null,right:boolean){
    if(!me||!view){game.setNotice('Installez une base pour donner des ordres.');return;}
    if(mode==='move'){
      const ids=selection.filter(id=>id==='scout'||id==='army'||me.society.workers.some(w=>w.id===id)||me.trucks.some(t=>t.id===id));
      if(!ids.length){game.setNotice('Sélectionnez vos unités avant de donner un ordre.');return;}
      void send({type:'rts',op:'move',ids,point:at});setMode('select');return;
    }
    const crew=me.society.workers.filter(w=>selection.includes(w.id));
    if(crew.length&&right&&object?.kind==='city'){void send({type:'society',op:'trade',ids:crew.map(w=>w.id),city:object.id,ore:'cuivre'});setMode('select');return;}
    if(crew.length&&right&&(object?.kind==='deposit'||object?.kind==='rig'||object?.kind==='base'&&object.own)){
      if(object.kind==='base')void send({type:'society',op:'recall',ids:crew.map(w=>w.id)});
      else void send({type:'society',op:'assign',ids:crew.map(w=>w.id),...object.kind==='deposit'?{deposit:object.id}:{rig:object.id}});
      setMode('select');return;
    }
    const actor=selection.includes('army')?'army':selection.includes('scout')?'scout':null,target=targetFor(view,object);
    if(mode==='attack'||(right&&actor==='army'&&target)){
      if(!target){game.setNotice('Visez un camp, une installation ou un convoi adverse repéré.');return;}
      void send({type:'attack',target});setSelection(['army']);setMode('select');return;
    }
    if((right||mode==='patrol')&&selection.length){
      const ids=selection.filter(id=>id==='scout'||id==='army'||me.society.workers.some(w=>w.id===id)||me.trucks.some(t=>t.id===id));
      if(!ids.length){game.setNotice('Sélectionnez vos unités avant de donner un ordre.');return;}
      void send(mode==='patrol'&&actor?{type:'patrol',unit:actor,point:at}:{type:'rts',op:'move',ids,point:at});setMode('select');return;
    }
    if(object){choose([object.id]);setMobileRail(true);}
    else game.setNotice('Cliquez ou encadrez vos unités, puis donnez un ordre au clic droit.');
  }
  function stopSelected(){const ids=selection.filter(id=>id==='scout'||id==='army'||me?.society.workers.some(w=>w.id===id)||me?.trucks.some(t=>t.id===id));if(ids.length)void send({type:'rts',op:'hold',ids});setMode('select');}
  useEffect(()=>{
    function key(e:KeyboardEvent){
      const el=e.target as HTMLElement;
      if(guide){if(e.key==='Escape')setGuide(false);return;}
      if(el.matches('input,textarea,select,[contenteditable=true]')||e.altKey||e.metaKey)return;
      const k=/^Digit[1-4]$/.test(e.code)?e.code.slice(-1):e.key.toLowerCase();
      if(k==='g'){e.preventDefault();assignGroup.current=Date.now()+2500;game.setNotice('Choisissez 1, 2, 3 ou 4 pour mémoriser cette sélection.');return;}
      if(['1','2','3','4'].includes(k)&&assignGroup.current>Date.now()){
        e.preventDefault();assignGroup.current=0;groups.current[k]=selection.filter(id=>id==='army'||id==='scout'||!!me?.society.workers.some(w=>w.id===id)||!!me?.trucks.some(t=>t.id===id));game.setNotice('Groupe '+k+' mémorisé.');return;
      }
      if(e.ctrlKey&&['1','2','3','4'].includes(k)){e.preventDefault();groups.current[k]=selection.filter(id=>id==='army'||id==='scout'||!!me?.society.workers.some(w=>w.id===id)||!!me?.trucks.some(t=>t.id===id));game.setNotice('Groupe '+k+' mémorisé.');return;}
      if(e.ctrlKey)return;
      if(['1','2','3','4'].includes(k)){
        e.preventDefault();
        const id=k==='1'?'scout':k==='2'?'army':k==='3'?view?.rigs.find(r=>r.owner===me?.id)?.id:me?.trucks[0]?.id;
        choose(groups.current[k]?.length?groups.current[k]:id?[id]:[]);return;
      }
      if(e.code==='Digit5'){e.preventDefault();choose(me?.society.workers.map(w=>w.id)??[]);return;}
      if(k==='r'&&build){e.preventDefault();rotate();return;}
      if(k==='v'){e.preventDefault();setTab('factory');setMobileRail(true);if(me)look(me.home);return;}
      if(k==='t'){e.preventDefault();tool('belt');setTab('factory');return;}
      if(k==='a'||k==='m'||k==='p'){e.preventDefault();if(k==='a'){setSelection(['army']);setMode('attack');}else setMode(k==='p'?'patrol':'move');return;}
      if(k==='s'){e.preventDefault();stopSelected();setMode('select');return;}
      if(k==='h'||k==='b'){e.preventDefault();if(me)look(me.home);if(k==='b'){setTab('base');setMobileRail(true);}return;}
      if(k==='c'){e.preventDefault();const city=view?.cities[0];if(city)look(city.point);setTab('market');return;}
      if(k==='f'&&node){e.preventDefault();void send({type:'install',deposit:node.id});return;}
      if(k==='escape'){setBuild(null);setMode('select');setGuide(false);setMobileRail(false);}
      if(k==='?'){e.preventDefault();setGuide(true);}
    }
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[selection,me,node,view,send,guide,build]);
  async function join(e:React.FormEvent){
    e.preventDefault();
    const result=await game.join(name.trim(),faction);
    if(result?.me){look(result.me.home);setSelection(result.me.society.workers.map(w=>w.id));setTab('workforce');setMobileRail(false);}
  }
  return <main className="frontier">
    <header className="fr-header">
      <button className="fr-wordmark" onClick={()=>{setTab('terrain');if(me)look(me.home);}}><img src="/favicon.svg" alt=""/>STRATE <small>FER & CUIVRE</small></button>
      <div className="fr-resources">{me&&<>{RAW_GOODS.map(r=><span key={r} aria-label={GOODS[r].name+' au dépôt : '+Math.floor(me.inventory[r])} title={GOODS[r].name+' au dépôt'}><i style={{background:GOODS[r].color}}/><small className="fr-resource-name">{r==='ferrite'?'Fer':'Cuivre'}</small>{Math.floor(me.inventory[r]).toLocaleString('fr-FR')}</span>)}<b>{Math.floor(me.coins).toLocaleString('fr-FR')} <small>CR</small></b></>}</div>
      <span className={'fr-connection '+(game.connected?'online':'')}><i/>{game.connected?'En ligne':'Connexion…'}</span>
      <button className="fr-help-button" onClick={()=>setGuide(true)} aria-label="Afficher les raccourcis clavier">?</button>
    </header>
    <div className="fr-layout">
      <nav className="fr-nav" aria-label="Gestion de l’expédition">{tabs.map(({id,name,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>{setTab(id);setMobileRail(true);}} title={name}><Icon size={20}/><span>{name}</span></button>)}</nav>
      <section className="fr-world" aria-label="Terrain partagé">
        <FrontierMap view={view} selected={selection} mode={mode} focus={focus} onSelect={choose} onOrder={order} onFocus={look} onContextCommand={(action,at,object)=>{if(!me)return;const crew=me.society.workers.filter(w=>selection.includes(w.id)).map(w=>w.id),ids=selection.filter(id=>id==='scout'||id==='army'||crew.includes(id)||me.trucks.some(t=>t.id===id));setMode('select');if(action==='move'||action==='recall'){if(ids.length)void send({type:'rts',op:'move',ids,point:at});}else if(action==='stop')stopSelected();else if(action==='attack'){const target=targetFor(view!,object);if(target)void send({type:'attack',target});}else if(crew.length&&object){void send(object.kind==='city'?{type:'society',op:'trade',ids:crew,city:object.id,ore:'cuivre'}:{type:'society',op:'assign',ids:crew,...object.kind==='rig'?{rig:object.id}:{deposit:object.id}});}else game.setNotice('Sélectionnez vos ouvriers pour récolter.');}} build={build} rotation={rotation} onBuild={construct} onCancelBuild={()=>setBuild(null)} onRotateBuild={rotate}/>
        <FieldArrival key={view?.generation??'connection'} face={me?.home.face??view?.playtest?.scene?.home.face??'top'} worldReady={!!view} hasCamp={!!me} lobby={lobby} fault={game.fault}
          begin={()=>{setLobby(false);setMobileRail(true);requestAnimationFrame(()=>document.getElementById('captain-name')?.focus());}}
          observe={()=>{setLobby(false);setMobileRail(false);if(view?.playtest?.scene)look(view.playtest.scene.home);}}
          retry={()=>{void game.refresh();}}/>
        {!me&&view&&!lobby&&<button className="field-return" onClick={()=>{setTab('terrain');setMobileRail(true);requestAnimationFrame(()=>document.getElementById('captain-name')?.focus());}}>Installer mon camp <ArrowRight size={14}/></button>}
        {me&&<div className="fr-commandbar">
          <div className="fr-units"><button aria-pressed={me.society.workers.some(w=>selection.includes(w.id))} onClick={()=>choose(me.society.workers.map(w=>w.id))}><Users size={22}/><span>Ouvriers</span><kbd>5</kbd></button>{[{id:'scout',label:'Éclaireur',key:'1',sprite:4},{id:'army',label:'Escouade',key:'2',sprite:4},{id:view?.rigs.find(r=>r.owner===me.id)?.id,label:'Foreuse',key:'3',sprite:2},{id:me.trucks[0]?.id,label:'Transport',key:'4',sprite:3}].map(u=><button key={u.key} disabled={!u.id} aria-pressed={!!u.id&&selection.includes(u.id)} onClick={()=>{if(u.id)choose([u.id]);}}><AnimatedSprite id={u.key==='1'?'scout':u.key==='2'?'army':u.key==='3'?'drill':'truck'}/><span>{u.label}</span><kbd>{u.key}</kbd></button>)}</div>
          <div className="fr-orders"><small className="rts-count">{selection.length} sélection{selection.length>1?'s':''}</small>{[{mode:'move',name:'Déplacer',key:'M',Icon:Crosshair},{mode:'attack',name:'Attaquer',key:'A',Icon:Swords},{mode:'patrol',name:'Patrouiller',key:'P',Icon:Flag}].map(o=><button key={o.mode} aria-pressed={mode===o.mode} onClick={()=>{if(o.mode==='attack')setSelection(['army']);setMode(o.mode as FrontierMode);}}><o.Icon size={17}/><span>{o.name}</span><kbd>{o.key}</kbd></button>)}<button onClick={()=>{stopSelected();}}><Pause size={17}/><span>Arrêt</span><kbd>S</kbd></button></div>
          <button className="fr-mobile-open" onClick={()=>setMobileRail(true)} aria-label="Ouvrir la console"><Radio size={19}/></button>
        </div>}
      </section>
      <aside className={'fr-console '+(mobileRail?'open':'')} aria-label="Console de commandement">
        <div className="fr-console-head"><span><Radio size={14}/>{me?.name??'Nouvelle expédition'}</span><button onClick={()=>setMobileRail(false)} aria-label="Replier la console"><X size={18}/></button></div>
        <div className="fr-scroll" key={tab==='terrain'?tab+'/'+selection.join('/'):tab}>
          {view&&me?tab==='journal'?<JournalPanel read={game.readJournal} players={view.players}/>:tab==='factory'?<FactoryPanel view={view} selected={selected?.id} tool={build} dir={rotation} busy={busy} now={now} onTool={tool} onRotate={rotate} onFocus={look} onSelect={id=>choose([id])} send={send} onResearch={()=>{tool(null);setTab('research');setMobileRail(true);}}/>:tab==='research'?<MAMPanel view={view} now={now} busy={busy} send={send} onFactory={()=>setTab('factory')}/>:tab==='workforce'||tab==='contracts'||tab==='war'?<CooperationPanel selection={selection} view={view} now={now} busy={busy} send={send} tab={tab} onFocus={look} onSelect={choose}/>:<FrontierConsole view={view} now={now} busy={busy} send={send} tab={tab} setTab={setTab} selected={selected} selectionCount={selection.length} onSelect={choose} onFocus={look} onMode={chooseMode}/>:
          <div className="fr-join"><Sprite index={1} large/><p className="fr-eyebrow">UNE PLANÈTE PARTAGÉE</p><h1>Établir votre camp.</h1><p>Nouveau monde · six ouvriers à pied au départ. Posez vous-même votre MAM, vos machines et vos tapis. Bâtissez vos circuits, spécialisez votre camp et échangez des services.</p><form onSubmit={join}><label htmlFor="captain-name">Votre indicatif</label><input id="captain-name" maxLength={18} required value={name} onChange={e=>setName(e.target.value)} placeholder="Nom du commandant" autoComplete="nickname"/><div className="fr-factions">{(Object.keys(FACTIONS) as Faction[]).map(f=><button key={f} type="button" aria-pressed={f===faction} onClick={()=>setFaction(f)} style={{borderColor:faction===f?FACTIONS[f].color:undefined}}>{FACTIONS[f].name}</button>)}</div><button className="fr-primary" disabled={busy||!game.connected||!name.trim()}>Installer ma base <ArrowRight size={17}/></button></form><div className="fr-note"><Shield size={16}/><p>Les alentours de départ sont calmes sur 500 m. Vos défenses et votre escorte protègent les installations contre les joueurs.</p></div></div>}
          {view?.playtest&&<PlaytestPanel report={view.playtest} now={now} onFocus={look} onObserve={id=>{const actor=view.playtest!.agents.find(a=>a.id===id);void game.observeAI(id);if(actor)look(actor.home);}}/>}
        </div>
      </aside>
    </div>
    {(game.fault||game.notice)&&<div className={'fr-toast '+(game.fault?'danger':'')} role={game.fault?'alert':'status'}><span>{game.fault||game.notice}</span><button aria-label="Fermer" onClick={()=>{game.setFault('');game.setNotice('');}}><X size={16}/></button></div>}
    {guide&&<div className="fr-modal-wrap" onClick={()=>setGuide(false)}><section role="dialog" aria-modal="true" aria-label="Raccourcis et ordres" className="fr-modal" onClick={e=>e.stopPropagation()}><div className="fr-row"><h1>Commandes de l’expédition</h1><button aria-label="Fermer les raccourcis" onClick={()=>setGuide(false)}><X size={20}/></button></div><p>Sélectionnez une unité, puis faites un clic droit sur sa destination. Clic droit sur le sol : déplacement immédiat. Sur une cible, ou avec Alt : menu contextuel. M puis clic donne toujours un déplacement libre.</p><dl>{[['1 · 2 · 3 · 4','Éclaireur, escouade, foreuse, transporteur'],['M','Déplacement ciblé'],['A','Attaque ciblée, y compris sur un gisement'],['P','Patrouille autour du lieu choisi'],['S','Arrêter les unités sélectionnées'],['H · B','Recentrer sur la base · ouvrir la gestion'],['C','Ville connue et comptoir'],['5','Sélectionner les six collecteurs et affecter au clic droit'],['V · T · R','Usine · tracer un convoyeur · tourner'],['F','Foreuse sur le gisement sélectionné'],['Glisser à gauche · Maj','Sélection rectangulaire · ajouter au groupe'],['Glisser à droite · flèches','Déplacer la caméra'],['Q · E · clic molette','Rotation par quarts de tour'],['Espace','Recentrer la sélection'],['Alt + clic droit','Menu des ordres'],['Double clic','Sélectionner les unités du même type'],['G puis 1…4','Mémoriser un groupe et rappeler avec sa touche'],['Échap','Annuler le ciblage ou fermer un panneau']].map(([key,text])=><div key={key}><dt><kbd>{key}</kbd></dt><dd>{text}</dd></div>)}</dl><p>Le rayon calme protège des créatures. Les villes sont les zones de paix garanties. Construisez vos défenses et affectez vos escortes.</p></section></div>}
  </main>;
}
