import {drawItemIcon, drawAvatar} from './sprites.js';
import {metadata} from './paris-data.js';
import {coreDestinations, districtAt, streetAt} from './paris-world.js';
import {weaponDrops} from './weapon-drops.js';
import {wantedRules, wantedThresholds, wantedTuning} from './wanted.js';
import {mountAtlas,sectorURL,historicURL} from './grand-paris.js';

const weapons = [
  {id:'fist', name:'Poings', hint:'Corps à corps'},
  {id:'pistol', name:'Pistolet', hint:'Tir de précision'},
  {id:'smg', name:'Mitraillette', hint:'Tir rapide'},
  {id:'shotgun', name:'Fusil à pompe', hint:'Courte portée'},
  {id:'yarn', name:'Pelote', hint:'Projectile de laine'}
];
const emotes = [
  {id:'👋', name:'Salut !', hint:'Saluer les joueurs'},
  {id:'❤️', name:'Cœur', hint:'Envoyer un cœur'},
  {id:'😂', name:'Fou rire', hint:'Éclater de rire'},
  {id:'👀', name:'Je te vois', hint:'Ouvrir grand les yeux'},
  {id:'😎', name:'La classe', hint:'Prendre la pose'},
  {id:'🧶', name:'Pelote !', hint:'Afficher une pelote'}
];
const shortcuts = [
  ['Se déplacer', ['ZQSD', 'WASD', '↑↓←→']],
  ['Courir', ['Maj']],
  ['Tirer', ['Clic gauche', 'Espace']],
  ['Tourner la caméra', ['Glisser clic droit']],
  ['Recentrer la caméra', ['C']],
  ['Recharger', ['R']],
  ['Entrer ou sortir d’un véhicule', ['E']],
  ['Roue d’armes', ['Tab']],
  ['Émotes', ['B']],
  ['Ouvrir le chat', ['T']],
  ['Plan de la ville', ['M']]
];
const signs = {
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  weapon:'<circle cx="12" cy="12" r="7"/><path d="M12 2v5m0 10v5M2 12h5m10 0h5"/>',
  emotes:'<path d="M3 4h18v13H10l-5 4v-4H3z"/><path d="M7 9h1m8 0h1m-9 3 2 2h4l2-2"/>',
  map:'<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2zM9 3v15m6-12v15"/>',
  gear:'<path d="m10 3-1 3-3 1-2 3 1 3-1 3 3 2 3 1 2 2 3-2 3 1 2-3-1-3 2-3-2-3-3-1-2-3z"/><circle cx="12" cy="12" r="3"/>',
  users:'<path d="M3 20v-3c0-3 2-5 6-5s6 2 6 5v3m2-7c3 0 5 2 5 5v2"/><circle cx="9" cy="7" r="4"/><path d="M16 3c5 0 6 7 1 8"/>',
  help:'<path d="M5 3h14v18H5zM9 8c0-4 7-4 7 0 0 2-3 2-3 5m0 3v1"/>',
  share:'<path d="M8 11 3 8l5-4m-5 4h9a7 7 0 0 1 7 7M5 14v6h15"/>',
  copy:'<rect x="8" y="8" width="12" height="13" rx="1"/><path d="M15 8V3H3v13h5"/>',
  speaker:'<path d="M3 9h4l5-5v16l-5-5H3zM16 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>'
};
const icon = name => '<svg class="mc-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round">'+(signs[name] || '')+'</svg>';
const key = text => '<kbd>'+text+'</kbd>';
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const button = (label, className, action) => {
  const element = node('button', className, label);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
};
function sectorPath(index, count) {
  const step = Math.PI*2/count, mid = step*index-Math.PI/2;
  const a = mid-step/2+.034, b = mid+step/2-.034;
  const point = (r,t) => (100+r*Math.cos(t)).toFixed(3)+','+(100+r*Math.sin(t)).toFixed(3);
  return 'M'+point(96,a)+' A96,96 0 0 1 '+point(96,b)+' L'+point(52,b)+' A52,52 0 0 0 '+point(52,a)+' Z';
}
function paintCanvas(canvas, paint, size) {
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  paint(ctx, size);
}
function weaponCanvas(id,size) {
  const c=node('canvas','mc-item');
  c.setAttribute('aria-hidden','true');
  paintCanvas(c,(ctx,s)=>drawItemIcon(ctx,id,0,0,s),size);
  return c;
}
function gameShareURL() {
  const url=new URL(location.pathname,location.origin);
  if(metadata.sector){
    const {lon,lat,name}=metadata.sector;
    const sector=sectorURL(url.href,lon,lat,name);
    if(sector)return sector;
  }
  const halt=new URL(location.href).searchParams.get('halte');
  return coreDestinations.some(d=>d.key===halt)?historicURL(url.href,halt):url.href;
}

export function createPanels({game,net,getState,selectWeapon,setName,setSound,getSound,setTouchAim,getTouchAim,notify,returnFocus}) {
  const root=document.getElementById('panels');
  let current='', dialog=null, selected=0, choose=null, setSelected=null;
  let held=false, wheelDirty=false, openedAt=0, interval=0, renderCurrent=null;
  let previousFocus=null;
  document.body.append(root);
  root.classList.add('mc-panels');
  root.hidden=true;
  const state=()=>getState?.() || {};
  const sound=()=>Boolean(getSound?.());
  const ownsWeapon=id=>(state().ownedWeapons || ['fist','pistol']).includes(id);

  function dropHint(weapon) {
    const position=game.getPosition();
    const cooldowns=net.world?.()?.pickups || {};
    const now=net.serverTime?.() ?? Date.now();
    let nearest=null, nearestDistance=Infinity;
    for(const drop of weaponDrops){
      if(drop.weapon!==weapon || cooldowns[drop.id]>now)continue;
      const distance=Math.hypot(position.x-drop.x,position.y-drop.y);
      if(distance<nearestDistance){nearestDistance=distance;nearest=drop;}
    }
    if(!nearest)return 'Consulte le plan local pour repérer le prochain dépôt disponible.';
    const street=streetAt(nearest.x,nearest.y);
    const district=districtAt(nearest.x,nearest.y);
    return [street,district].filter((text,i)=>text && (!i || text!==street)).join(' · ');
  }

  function close(focus=true) {
    if(!current) return;
    clearInterval(interval);
    current=''; choose=null; setSelected=null; renderCurrent=null; held=false; wheelDirty=false;
    root.hidden=true;
    root.replaceChildren();
    game.setPaused?.(false);
    if(focus) {
      if(returnFocus) returnFocus();
      else if(previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    }
    previousFocus=null;
  }
  function frame(kind,label,title) {
    const backdrop=node('div','mc-backdrop');
    backdrop.addEventListener('pointerdown', e=>{ if(e.target===backdrop) close(); });
    dialog=node('section','mc-dialog mc-'+kind);
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-labelledby','mc-panel-title');
    dialog.tabIndex=-1;
    const header=node('header','mc-header');
    const info=node('div','mc-heading');
    const iconWrap=node('span','mc-sign');
    iconWrap.innerHTML=icon({weapons:'weapon',emotes:'emotes',map:'map',settings:'gear',players:'users',help:'help'}[kind]);
    const words=node('div','mc-titlegroup');
    words.append(node('p','mc-eyebrow',label));
    const currentTitle=node('h2','mc-title',title);
    currentTitle.id='mc-panel-title';
    words.append(currentTitle);info.append(iconWrap,words);
    const dismiss=button('','mc-dismiss',()=>close());
    dismiss.setAttribute('aria-label','Fermer');
    dismiss.innerHTML=icon('close');
    header.append(info,dismiss);dialog.append(header);backdrop.append(dialog);root.replaceChildren(backdrop);
    return dialog;
  }
  function wheel(kind) {
    const isWeapon=kind==='weapons', items=isWeapon?weapons:emotes;
    const sheet=frame(kind,isWeapon?'Équipement':'Interactions',isWeapon?'Roue d’armes':'Émotes');
    const wheelStage=node('div','mc-wheel-stage');
    const ring=node('div','mc-wheel');
    ring.setAttribute('role','group');
    ring.setAttribute('aria-label',isWeapon?'Choix de l’arme':'Choix de l’émote');
    const ns='http://www.w3.org/2000/svg';
    const graph=document.createElementNS(ns,'svg');
    graph.setAttribute('viewBox','0 0 200 200');graph.setAttribute('aria-hidden','true');graph.classList.add('mc-wheel-sectors');
    const paths=items.map((_,i)=>{
      const p=document.createElementNS(ns,'path');p.setAttribute('d',sectorPath(i,items.length));graph.append(p);
      p.addEventListener('pointermove',()=>{if(selected!==i)setSelected(i);wheelDirty=true;});
      p.addEventListener('click',()=>{setSelected(i);choose();});
      return p;
    });
    ring.append(graph);
    const center=node('div','mc-hub');
    const hint=node('div','mc-drop-hint');
    const hintLabel=node('span','mc-drop-caption','Dépôt à pied');
    const hintPlace=node('strong');
    const hintCopy=node('div');
    hintCopy.setAttribute('aria-live','polite');
    hintCopy.append(hintLabel,hintPlace);
    hint.append(hintCopy,button('Voir le plan','mc-hint-map',()=>open('map')));
    hint.hidden=true;
    const large=node('div','mc-hub-glyph');
    const centerLabel=node('strong','mc-hub-label');
    const detail=node('small','mc-hub-detail');
    center.append(large,centerLabel,detail);ring.append(center);
    selected=isWeapon?Math.max(0,items.findIndex(it=>it.id===state().weapon)):0;
    const cells=items.map((it,i)=>{
      const t=(i/items.length)*Math.PI*2-Math.PI/2;
      const pick=button('', 'mc-choice',()=>{setSelected(i);choose();});
      pick.style.left=(50+36.8*Math.cos(t))+'%';pick.style.top=(50+36.8*Math.sin(t))+'%';
      pick.setAttribute('aria-label',it.name);
      if(isWeapon){
        const lock=node('span','mc-lock-badge');
        lock.innerHTML=icon('lock');
        pick.append(weaponCanvas(it.id,54),lock);
      }
      else pick.append(node('span','mc-emoji',it.id));
      const shortcut=node('span','mc-slot-key',String(i+1));pick.append(shortcut);
      pick.addEventListener('pointerenter',()=>{if(selected!==i)setSelected(i);wheelDirty=true;});
      pick.addEventListener('focus',()=>setSelected(i));
      ring.append(pick);
      return pick;
    });
    setSelected=(i,focus=false)=>{
      selected=(i+items.length)%items.length;
      const it=items[selected];
      const locked=isWeapon && !ownsWeapon(it.id);
      paths.forEach((path,index)=>{
        path.classList.toggle('mc-selected',index===selected);
        path.classList.toggle('mc-locked',isWeapon && !ownsWeapon(items[index].id));
      });
      cells.forEach((c,index)=>{
        const unavailable=isWeapon && !ownsWeapon(items[index].id);
        c.classList.toggle('mc-locked',unavailable);
        c.setAttribute('aria-label',items[index].name+(unavailable?' · À trouver · Voir l’indice':''));
        c.setAttribute('aria-pressed',String(index===selected));
        c.classList.toggle('mc-selected',index===selected);
        c.tabIndex=index===selected?0:-1;
      });
      if(large.dataset.value!==it.id){
        large.dataset.value=it.id;
        large.replaceChildren(isWeapon?weaponCanvas(it.id,54):node('span','mc-emoji',it.id));
      }
      center.classList.toggle('mc-locked',locked);
      centerLabel.textContent=it.name;
      detail.textContent=locked?'À trouver':it.hint;
      hint.hidden=!locked;
      if(locked){
        const location=dropHint(it.id);
        if(hintPlace.textContent!==location)hintPlace.textContent=location;
      }
      if(focus)cells[selected].focus({preventScroll:true});
    };
    choose=(dismissLocked=false)=>{
      const item=items[selected];
      if(isWeapon && !ownsWeapon(item.id)){
        if(dismissLocked)close();
        return;
      }
      close();
      if(isWeapon) selectWeapon(item.id);
      else game.emote(item.id);
    };
    setSelected(selected);
    wheelStage.append(ring,hint);
    if(isWeapon)renderCurrent=()=>setSelected(selected);
    const actions=node('div','mc-wheel-actions');
    actions.innerHTML=key('←')+key('→')+'<span>Choisir</span>'+key('Entrée')+'<span>Valider</span>';
    const tip=node('div','mc-wheel-touch',isWeapon?'Touche une arme pour l’équiper ou découvrir son emplacement.':'Touche une émote pour l’envoyer.');
    sheet.append(wheelStage,actions,tip);
  }
  function mapPanel() {
    const sheet=frame('map','Plan de ville',metadata.sector?.name||'Paris et petite couronne');
    const pad=node('div','mc-body');
    const nav=node('div','gp-mode');nav.setAttribute('role','group');nav.setAttribute('aria-label','Échelle du plan');
    const localButton=button('Plan local','',()=>switchMap('local'));
    const regionButton=button('Grand Paris','',()=>switchMap('region'));
    nav.append(localButton,regionButton);pad.append(nav);
    const detail=node('div','gp-local'),regional=node('div','gp-regional');
    const map=node('div','mc-map-box');
    const canvas=node('canvas','mc-map-canvas');canvas.width=840;canvas.height=448;
    canvas.setAttribute('aria-label','Plan local avec les joueurs, les véhicules et les armes à trouver');
    map.append(canvas);detail.append(map);
    const legends=node('div','mc-map-legends');
    [['mc-me','Vous'],['mc-other','Autres joueurs'],['mc-car','Véhicules'],['mc-drop','Arme à trouver']].forEach(([c,value])=>{
      const line=node('span','mc-map-legend');line.append(node('i',c),node('span','',value));legends.append(line);
    });
    const travel=node('div','mc-travel');
    const label=fieldLabel('Voyage rapide sur l’axe historique','mc-travel-target');
    const row=node('form','mc-travel-row');
    const target=node('select','mc-input');target.id='mc-travel-target';
    for(const destination of coreDestinations){
      const option=node('option','',destination.label);
      option.value=destination.key;target.append(option);
    }
    const go=node('button','mc-primary','S’y rendre');go.type='submit';
    row.addEventListener('submit',e=>{
      e.preventDefault();
      if(metadata.sector){net.stop();location.assign(historicURL(location.href,target.value));return;}
      if(game.travel(target.value)!==false){close();notify?.('Arrivée · '+target.selectedOptions[0].textContent);}
    });
    row.append(target,go);travel.append(label,row);
    const credit=node('p','mc-map-credit');
    const source=node('a','','IGN · BD TOPO®');source.href='https://cartes.gouv.fr/rechercher-une-donnee/dataset/IGNF_BD-TOPO';source.target='_blank';source.rel='noopener';
    credit.append(source,document.createTextNode(' · Licence Ouverte 2.0. Emprises et voirie réelles, façades réinterprétées en laine.'));
    detail.append(legends,travel,credit);pad.append(detail,regional);sheet.append(pad);
    let built=false,region=false;
    function switchMap(mode){
      region=mode==='region';detail.hidden=region;regional.hidden=!region;
      localButton.setAttribute('aria-pressed',String(!region));regionButton.setAttribute('aria-pressed',String(region));
      if(region&&!built){
        mountAtlas(regional,{position:game.getPosition?.(),visit:point=>{
          const url=sectorURL(location.href,point.lon,point.lat,point.name);
          if(url){net.stop();location.assign(url);}
        }});
        built=true;
      }
      if(!region)game.drawFullMap?.(canvas);
    }
    switchMap('local');
    renderCurrent=()=>{if(!region)game.drawFullMap?.(canvas);};
    interval=setInterval(()=>renderCurrent?.(),300);
  }
  function keyRows() {
    const list=node('dl','mc-keys');
    shortcuts.forEach(([action,keys])=>{
      list.append(node('dt','',action));
      const controls=node('dd');keys.forEach(k=>controls.append(node('kbd','',k)));list.append(controls);
    });
    return list;
  }
  function helpPanel() {
    const sheet=frame('help','Guide de jeu','Comment jouer');
    const body=node('div','mc-body mc-guide');
    const kit=node('section','mc-guide-section');
    kit.append(node('h3','','Trouver une arme'),node('p','','Tu commences avec les poings et le pistolet. Dans la roue, sélectionne un cadenas pour localiser l’arme. Approche-toi à pied du dépôt pour la ramasser.'));
    kit.append(node('p','mc-guide-aside','Après un ramassage, le dépôt redevient disponible pour tous au bout de 60 s.'));

    const alert=node('section','mc-guide-section');
    alert.append(node('h3','','Indice de recherche'),node('p','','Chaque infraction ajoute des points. La barre sous les étoiles indique ta progression vers le niveau suivant.'));
    const levels=node('ol','mc-thresholds');
    levels.setAttribute('aria-label','Points nécessaires pour chaque niveau de recherche');
    wantedThresholds.forEach((threshold,index)=>{
      const item=node('li');
      item.setAttribute('aria-label',(index+1)+' étoile'+(index?'s':'')+' à '+threshold+' points');
      item.append(node('strong','',String(index+1)+' ★'),node('small','',threshold+' pts'));
      levels.append(item);
    });
    const rules=node('details','mc-guide-details');
    rules.append(node('summary','','Barème des infractions'));
    const pointsList=node('dl','mc-points-list');
    for(const {label,points} of Object.values(wantedRules)){
      pointsList.append(node('dt','',label),node('dd','',points?'+'+points:'0'));
    }
    const {repeatWindow, repeatStep, maxRepeatBonus, calmDelay, decayRate}=wantedTuning;
    rules.append(pointsList,node('p','mc-guide-aside','La même infraction répétée en moins de '+repeatWindow+' s rapporte '+Math.round(repeatStep*100)+' % de plus par répétition, jusqu’à +'+Math.round(maxRepeatBonus*100)+' %.'));
    alert.append(levels,node('p','mc-guide-aside','Après '+calmDelay+' s sans infraction, l’alerte diminue de '+decayRate.toLocaleString('fr-FR')+' points par seconde.'),rules);

    const controls=node('details','mc-guide-details');
    controls.append(node('summary','','Commandes clavier et souris'),keyRows());
    const mobile=node('section','mc-guide-section');
    mobile.append(node('h3','','Commandes tactiles'),node('p','','Pousse le joystick à fond pour courir. Glisse sur le décor pour tourner la caméra. Au volant, pousse vers le haut pour accélérer ou vers le bas pour freiner puis reculer.'));
    mobile.append(node('p','','Maintiens le bouton de tir pour accrocher une cible devant toi. Un réticule apparaît dessus. Glisse le pouce sur ce bouton pour ajuster la visée, puis relâche pour arrêter de tirer.'));
    body.append(kit,alert,mobile,controls);sheet.append(body);
  }
  function fieldLabel(text, id) {const l=node('label','mc-field-label',text);l.htmlFor=id;return l;}
  function settingsPanel() {
    const sheet=frame('settings','Options','Paramètres');
    const body=node('div','mc-body mc-stack');
    const form=node('form','mc-stack');
    const username=node('input','mc-input');username.id='mc-name';username.name='nickname';username.autocomplete='nickname';username.maxLength=24;username.required=true;username.value=net.name || '';
    const group=node('div','mc-field');
    group.append(fieldLabel('Nom de joueur',username.id),username);
    function switchRow(title, sign, readValue, saveValue, onText, offText){
      const row=node('div','mc-option-row');
      const label=node('label','mc-option-label');
      label.htmlFor='mc-toggle-'+sign;label.innerHTML=icon(sign);label.append(node('span','',title));
      const toggle=button('','mc-switch',()=>{saveValue(!readValue());sync();});
      toggle.id=label.htmlFor;toggle.setAttribute('role','switch');toggle.setAttribute('aria-label',title);
      function sync(){
        const enabled=readValue();
        toggle.setAttribute('aria-checked',String(enabled));
        toggle.replaceChildren(node('i'),node('span','',enabled?onText:offText));
      }
      sync();row.append(label,toggle);return row;
    }
    const soundRow=switchRow('Effets sonores','speaker',sound,setSound,'Activés','Coupés');
    const aimRow=switchRow('Aide à la visée tactile','weapon',getTouchAim,setTouchAim,'Activée','Désactivée');
    const display=node('div','mc-option-row');
    const info=node('span','mc-option-label','Rendu actif');
    const graphics=state().graphics;
    display.append(info,node('span','mc-render-mode',graphics==='canvas'?'Perspective légère':graphics==='webgl'?'3D WebGL':'Initialisation'));
    const confirm=node('button','mc-primary','Enregistrer');confirm.type='submit';
    const actions=node('div','mc-form-actions');
    const controls=button('Commandes','mc-secondary',()=>open('help'));
    controls.innerHTML=icon('help')+'<span>Commandes</span>';
    actions.append(controls,confirm);form.append(group,soundRow,aimRow,display,actions);
    form.addEventListener('submit',e=>{
      e.preventDefault();const name=username.value.trim();
      if(!name){username.setCustomValidity('Entre un nom de joueur.');username.reportValidity();return;}
      setName(name);close();notify?.('Paramètres enregistrés.');
    });username.addEventListener('input',()=>username.setCustomValidity(''));
    body.append(form);sheet.append(body);
  }
  function playersPanel() {
    const sheet=frame('players','Multijoueur','Joueurs');
    const body=node('div','mc-body mc-stack');
    const banner=node('div','mc-roster-heading'),count=node('strong','mc-online-count'),connection=node('span','mc-status');
    count.setAttribute('aria-live','polite');banner.append(count,connection);
    const roster=node('ul','mc-roster');roster.setAttribute('aria-label','Joueurs dans le monde');
    const fallback=node('input','mc-input');fallback.readOnly=true;fallback.hidden=true;fallback.setAttribute('aria-label','Lien du jeu à copier');
    const feedback=node('p','mc-inline-feedback');feedback.setAttribute('role','status');
    const shareLabel=metadata.sector?'Copier le lien du quartier':'Copier le lien du jeu';
    const share=button('','mc-primary mc-share-world',async()=>{
      const link=gameShareURL();
      try {
        if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(link);
        else {
          const field=node('textarea');field.value=link;document.body.append(field);field.select();
          const copied=document.execCommand('copy');field.remove();if(!copied)throw Error('clipboard');
        }
        feedback.textContent='Lien copié.';fallback.hidden=true;
      } catch {
        fallback.value=link;fallback.hidden=false;fallback.focus();fallback.select();
        feedback.textContent='Copie ce lien pour partager le jeu.';
      }
    });
    share.innerHTML=icon('copy')+'<span>'+shareLabel+'</span>';
    const shareGroup=node('div','mc-share-block');shareGroup.append(share,fallback,feedback);
    body.append(banner,roster,shareGroup);sheet.append(body);
    let previous='';
    renderCurrent=()=>{
      const status=net.status||'connecting',online=status==='online';
      const players=online?(net.players?.()||[]):[];
      connection.classList.toggle('mc-online',online);
      connection.textContent=online?'En ligne':status==='offline'?'Hors ligne':'Connexion…';
      const total=players.length;
      const counter=online?total+' joueur'+(total===1?'':'s')+' en ligne':'Présence mondiale';
      if(count.textContent!==counter)count.textContent=counter;
      const signature=status+JSON.stringify(players.map(p=>[p.id,p.name,p.variant]));
      if(signature===previous)return;
      previous=signature;roster.replaceChildren();
      if(!players.length){
        const empty=online?'Aucun joueur connecté.':status==='offline'?'La liste sera actualisée à la reconnexion.':'Recherche des joueurs…';
        roster.append(node('li','mc-roster-empty',empty));return;
      }
      const sorted=[...players].sort((a,b)=>Number(b.id===net.id)-Number(a.id===net.id)||(a.name||'').localeCompare(b.name||'','fr'));
      for(const person of sorted) {
        const entry=node('li','mc-person'),face=node('canvas','mc-face');face.setAttribute('aria-hidden','true');
        paintCanvas(face,(ctx,s)=>drawAvatar(ctx,0,0,s,person.variant||'fox'),30);
        entry.append(face,node('span','mc-person-name',person.name||'Joueur'));
        if(person.id===net.id)entry.append(node('small','mc-self','Vous'));
        roster.append(entry);
      }
    };
    renderCurrent();interval=setInterval(()=>renderCurrent?.(),900);
  }
  function open(kind) {
    const kinds=['weapons','emotes','map','settings','players','help'];
    if(!kinds.includes(kind))return;
    if(current===kind){close();return;}
    const activeFocus=current?previousFocus:document.activeElement;
    if(current)close(false);
    previousFocus=activeFocus;current=kind;root.hidden=false;game.setPaused?.(true);
    if(kind==='weapons' || kind==='emotes')wheel(kind);
    else if(kind==='map')mapPanel();
    else if(kind==='settings')settingsPanel();
    else if(kind==='help')helpPanel();
    else playersPanel();
    dialog.focus({preventScroll:true});
  }
  function handleKey(e,phase='down') {
    const up=phase==='up' || phase==='keyup' || e.type==='keyup';
    const target=e.target;
    const editable=target?.matches?.('input,textarea,select,[contenteditable="true"]');
    const lower=e.key.toLowerCase();
    const wheelTrigger=current==='weapons'?'tab':'b';
    const consume=()=>{e.preventDefault();return true;};
    if(!current){
      if(up || editable || e.ctrlKey || e.metaKey || e.altKey || e.repeat)return false;
      if(lower==='tab' && (e.shiftKey || target?.closest?.('button,a,[role="button"]')))return false;
      const kind=({tab:'weapons',b:'emotes',m:'map',f1:'help'})[lower];
      if(!kind)return false;
      open(kind);held=kind==='weapons' || kind==='emotes';openedAt=performance.now();return consume();
    }
    if(!up && lower==='escape'){close();return consume();}
    if(up && held && lower===wheelTrigger){
      held=false;
      if(wheelDirty || performance.now()-openedAt>240)choose?.(true);
      return consume();
    }
    if(up)return true;
    const isWheel=current==='weapons' || current==='emotes';
    if(!editable && isWheel){
      const items=current==='weapons'?weapons:emotes;
      if((lower==='enter' || lower===' ') && target?.closest?.('.mc-dismiss,.mc-hint-map'))return true;
      if(lower===wheelTrigger) {
        if(!e.repeat && !held)choose?.(true);
        return consume();
      }
      if(lower==='enter' || lower===' '){choose?.();return consume();}
      if(['arrowleft','arrowup','arrowright','arrowdown'].includes(lower)){
        wheelDirty=true;setSelected(selected+(['arrowleft','arrowup'].includes(lower)?-1:1),true);return consume();
      }
      const digit=/^(?:Digit|Numpad)([1-6])$/.exec(e.code) || /^([1-6])$/.exec(e.key);
      if(digit && Number(digit[1])<=items.length){setSelected(Number(digit[1])-1);choose();return consume();}
    }
    if(!editable && current==='map' && lower==='m' && !e.repeat){close();return consume();}
    if(lower==='tab' && !isWheel){
      const list=[...dialog.querySelectorAll('button:not([disabled]),input:not([hidden]),select:not([disabled]),summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
      const first=list[0],last=list[list.length-1];
      if(e.shiftKey && (target===first || target===dialog)){last?.focus();return consume();}
      if(!e.shiftKey && target===last){first?.focus();return consume();}
    }
    return true;
  }
  return {open,close,isOpen:()=>Boolean(current),handleKey,refresh:()=>renderCurrent?.()};
}
