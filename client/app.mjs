import {renderEditor} from "./editor.mjs";
import {render,resetView,worldAt,screenAt} from './iso.mjs';
import {makeTargeting} from './aim.mjs';
import {startRaid,advance,training,validLayout,stepTime,classes,tile,floorAt} from './engine.mjs';
const $=id=>document.getElementById(id),show=(id,on)=>$(id).hidden=!on;
let session=localStorage.getItem('abyss-house')||'',house,layout,raid,state,steps=[],mode='hall',tab='hunt',draftKey,keys=new Set(),action=0,acc=0,last=0,frame,finalizing=false;
let hero=localStorage.getItem('abyss-champion')||'knight';
if(!Object.hasOwn(classes,hero))hero='knight';
function chooseHero(key){hero=key;localStorage.setItem('abyss-champion',key);
 document.querySelectorAll('[data-hero]').forEach(el=>el.setAttribute('aria-pressed',el.dataset.hero===key));
 if(house)$('gear').textContent=classes[hero].weapon+' · '+(classes[hero].damage+house.gear*3)+' dégâts par attaque.'}
for(const group of document.querySelectorAll('.champions'))for(const [key,info] of Object.entries(classes)){
 const b=document.createElement('button');b.type='button';b.dataset.hero=key;b.setAttribute('aria-pressed',key===hero);
 b.innerHTML='<span class="stage" aria-hidden="true"><img alt="" src="/sprite-'+key+'.webp"></span><span class="champion-copy"><em>'+info.weapon+'</em><b>'+info.name+'</b><small>'+info.detail+'</small></span>';
 b.onclick=()=>chooseHero(key);group.append(b)}
let noticeTimer;function notice(msg){$('status').textContent=msg;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('status').textContent='',6500)}
async function api(path,body){const res=await fetch('/api/'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session},body:body?JSON.stringify(body):undefined});const data=await res.json();if(!res.ok){if(res.status===401){localStorage.removeItem('abyss-house');session='';show('landing',true);show('hall',false)}throw Error(data.error)}return data}
const safe=fn=>async function(...args){try{await fn.apply(this,args)}catch(e){notice(e.message)}};
function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=safe(fn);return b}
function panel(parent,title,text,control){const card=document.createElement('div'),box=document.createElement('div'),b=document.createElement('b'),p=document.createElement('p');card.className='targets';b.textContent=title;p.textContent=text;box.append(b,p);card.append(box);if(control)card.append(control);parent.append(card)}
function selectTab(id){tab=id;for(const n of ['hunt','defense','log'])show(n,n===id);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id))}
function updateHall(){show('landing',false);show('play',false);show('hall',true);$('houseName').textContent=house.name;$('wealth').textContent=house.coins+' pièces d’or · Arme de rang '+(house.gear+1);$('gear').textContent=classes[hero].weapon+' · '+(classes[hero].damage+3*house.gear)+' dégâts par attaque.';$('upgrade').textContent=house.gear===5?'Rang maximal':'Renforcer · '+(house.gear+1)*30+' or';$('upgrade').disabled=house.gear>=5||house.coins<(house.gear+1)*30;
 const targets=$('targets');targets.replaceChildren();if(!house.houses.length)panel(targets,'Aucune maison rivale publiée','La carte se remplit lorsque d’autres joueurs éprouvent et publient leur forteresse.',button('Actualiser',refresh));
 for(const h of house.houses)panel(targets,h.name,'Forteresse de joueur · Garnison '+h.power+'/12',button('Lancer le raid',()=>launch('raid',h.id,h.name)));
 panel(targets,'L’avant-poste de Dagon','Entraînement · Garnison fixe · 12 pièces à la victoire',button('S’entraîner',()=>launch('training',null,'Avant-poste de Dagon')));
 draftKey='abyss-plan-'+house.id;if(!layout){try{layout=JSON.parse(localStorage.getItem(draftKey))}catch{}if(!Array.isArray(layout)||layout.length!==15)layout=house.layout||[...training]}
 renderEditor($('editor'),layout,l=>{layout=l.slice();localStorage.setItem(draftKey,JSON.stringify(layout));publishedState()});publishedState();
 const log=$('history');log.replaceChildren();if(!house.journal.length)panel(log,'Aucune incursion consignée','Vos essais, pillages et défenses apparaîtront ici.');
 for(const j of house.journal){const defense=j.did===house.id;const won=j.result==='won';panel(log,defense?(won?'Trésor atteint':'Défense réussie')+' · '+j.attacker:({raid:'Raid · '+j.defender,training:'Entraînement',test:'Épreuve de la forteresse'}[j.kind]),new Date(j.started).toLocaleString('fr-FR')+' · '+(won?'Trésor atteint':'Raid repoussé')+(j.reward?' · '+j.reward+' or au pillard':''))}
 selectTab(tab)}
function publishedState(){$('published').textContent=!house.layout?'Forteresse privée':JSON.stringify(layout)===JSON.stringify(house.layout)?'Ce plan est publié':'Modifications en brouillon'}
async function refresh(){house=await api('hall');updateHall()}
$('join').onsubmit=safe(async e=>{e.preventDefault();const b=$('join').querySelector('button');b.disabled=true;try{const s=await api('join',{name:$('name').value});session=s.token;localStorage.setItem('abyss-house',session);await refresh()}finally{b.disabled=false}});
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=safe(async()=>{selectTab(b.dataset.view);await refresh()}));$('test').onclick=safe(()=>launch('test',null,'Épreuve de votre forteresse'));$('upgrade').onclick=safe(async()=>{await api('upgrade',{});await refresh()});
if(session)safe(refresh)();
const canvas=$('game');
function draw(){render(state, activeTarget);const z=floorAt(Math.floor(state.x/tile),Math.floor(state.y/tile));
 $('room').textContent=z?.[0]||raid.name;$('vitality').value=state.hp;$('vitality').max=state.maxHp;$('stats').textContent=state.hp+' / '+state.maxHp+' PV';const seconds=Math.ceil((10800-state.tick)/30);$('clock').textContent=Math.floor(seconds/60)+' min '+String(seconds%60).padStart(2,'0')+' s';
 $('objective').textContent='Sceaux '+((state.seals&1)+(state.seals>>1))+'/2 · '+(state.guards.length?state.guards.length+' gardien(s)':'Garnison vaincue')+(state.seals===3&&!state.guards.length?' · Rejoindre le reliquaire au nord':'');
 $('blast').textContent=state.tick<state.spellAt?'Onde '+Math.ceil((state.spellAt-state.tick)/30)+' s':'Onde';$('roll').textContent=state.tick<state.dashAt?'Esquive '+Math.ceil((state.dashAt-state.tick)/30)+' s':'Esquive'}
let pointer=null, pendingManual=null, manualUntil=0, cursor=null, firingPointer=null;
let acquire=makeTargeting(), activeTarget=null;
let automatic=localStorage.getItem('abyss-auto-aim')!=='off';
const autoButton=$('autoAim');
function syncAutoButton(){
 if(!autoButton)return;
 autoButton.textContent=automatic?'Attaque auto · activée':'Attaque auto · désactivée';
 autoButton.setAttribute('aria-pressed',String(automatic));
}
syncAutoButton();
if(autoButton)autoButton.onclick=()=>{
 automatic=!automatic;localStorage.setItem('abyss-auto-aim',automatic?'on':'off');
 activeTarget=null;syncAutoButton();
};
let launching=false;
async function launch(kind,target,name){if(launching)return;if(kind==='test'&&!validLayout(layout))throw Error('Posez au moins une défense dans la forteresse.');launching=true;try{raid=await api('start',{kind,target,layout,hero,version:4});raid.name=name;state=startRaid(raid.layout,raid.gear,raid.hero,raid.version);steps=[];action=0;resetView();acquire=makeTargeting();activeTarget=null;finalizing=false;$('insignia').src='/sprite-'+raid.hero+'.webp';$('fire').textContent=classes[hero].weapon;show('hall',false);show('play',true);$('play').scrollIntoView({block:'start'});render(state,null);resume()}finally{launching=false}}
function clearInput(){keys.clear();pointer=null;pendingManual=null;cursor=null;firingPointer=null;activeTarget=null;action=0}
function resume(){clearInput();mode='run';show('modal',false);last=performance.now();acc=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(loop)}
function dialog(title,body,buttons){mode='modal';clearInput();const m=$('modal');m.replaceChildren();const h=document.createElement('h2'),p=document.createElement('p'),r=document.createElement('div');h.textContent=title;p.textContent=body;m.append(h,p,r);buttons.forEach(([label,fn])=>r.append(button(label,fn)));show('modal',true)}
async function leave(){await refresh();mode='hall'}
async function finish(abandon=false){if(finalizing)return;finalizing=true;dialog('Le registre des marées','Consignation du raid…',[]);
 try{const result=await api('finish',{id:raid.id,moves:steps,abandon});const won=result.result==='won';const options=[['Retour à la maison',leave]];if(won&&raid.kind==='test')options.unshift(['Publier ma forteresse',async()=>{await api('publish',{id:raid.id});tab='defense';await leave();notice('Forteresse ouverte aux raids.')}]);dialog(won?'Le trésor est à vous.':'L’assaut est repoussé.',won?(raid.kind==='test'?'Votre plan est franchissable. Vous pouvez l’ouvrir aux autres maisons.':result.reward+' pièces d’or rapportées à votre maison.'):'Votre forteresse vous attend à Innsmouth.',options)}
 catch(e){dialog('Envoi interrompu',e.message,[['Réessayer',()=>finish(abandon)]])}finally{finalizing=false}}
function pause(){if(mode==='run')dialog('Raid suspendu','',[['Reprendre',resume],['Battre en retraite',()=>finish(true)]])}
$('pause').onclick=pause;window.addEventListener('blur',pause);
function screenPoint(e){
 const r=canvas.getBoundingClientRect();
 return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height];
}
canvas.onpointerdown=e=>{
 if(mode!=='run'||e.button!==0||pointer)return;
 const screen=screenPoint(e);
 pointer={id:e.pointerId,origin:[e.clientX,e.clientY],screen,drag:false,manualTicks:0};
 cursor=null;canvas.setPointerCapture(e.pointerId);
};
canvas.onpointermove=e=>{
 const screen=screenPoint(e);
 if(!pointer){if(mode==='run'&&e.pointerType==='mouse')cursor=screen;return}
 if(pointer.id!==e.pointerId)return;
 pointer.screen=screen;
 if(Math.hypot(e.clientX-pointer.origin[0],e.clientY-pointer.origin[1])>6)pointer.drag=true;
};
canvas.onpointerleave=()=>{cursor=null};
canvas.onpointerup=e=>{
 if(pointer?.id!==e.pointerId)return;
 if(!pointer.drag&&pointer.manualTicks<3){
   pendingManual=worldAt(...screenPoint(e));
   manualUntil=state.tick+classes[state.hero].delay;
 }
 pointer=null;cursor=null;
};
function cancelCanvas(e){if(pointer?.id===e.pointerId)pointer=null;cursor=null}
canvas.onpointercancel=canvas.onlostpointercapture=cancelCanvas;
const fireButton=$('fire');
fireButton.onpointerdown=e=>{
 if(mode!=='run'||firingPointer!==null)return;
 firingPointer=e.pointerId;fireButton.setPointerCapture(e.pointerId);action|=16;
};
function releaseFire(e){if(firingPointer===e.pointerId)firingPointer=null}
fireButton.onpointerup=fireButton.onpointercancel=fireButton.onlostpointercapture=releaseFire;
fireButton.onclick=e=>{if(mode==='run'&&e.detail===0)action|=16};
$('blast').onclick=()=>{if(mode==='run')action|=64};
$('roll').onclick=()=>{if(mode==='run')action|=32};
window.addEventListener('keydown',e=>{
 if(mode!=='run')return;
 const k=e.key.toLowerCase();
 if(k.startsWith('arrow')||k===' '||k==='f')e.preventDefault();
 keys.add(k);
 if(k==='escape')pause();
 if(!e.repeat){if(k===' ')action|=32;if(k==='e')action|=64;if(k==='f')action|=16}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function input(){
 let word=action;action=0;
 const has=(...ks)=>ks.some(k=>keys.has(k));
 const right=Number(has('d','arrowright'))-Number(has('q','a','arrowleft'));
 const down=Number(has('s','arrowdown'))-Number(has('z','w','arrowup'));
 let dx=right+down,dy=down-right;
 if(pointer?.drag&&!right&&!down){
   const dest=worldAt(...pointer.screen);
   const gap=v=>Math.abs(v)>6?Math.sign(v):0;
   dx=gap(dest.x-state.x);dy=gap(dest.y-state.y);
 }
 if(dx>0)word|=1;if(dx<0)word|=2;if(dy>0)word|=4;if(dy<0)word|=8;
 const edge=worldAt(1,1), viewport=screenAt(edge.x,edge.y);
 const moveLength=Math.hypot(dx,dy)||1, stride=classes[state.hero].speed;
 const motion={x:dx/moveLength*stride,y:dy/moveLength*stride};
 const selected=acquire(state,guard=>{
   const p=screenAt(guard.x,guard.y);
   return p.x>=0&&p.x<=viewport.x&&p.y>=0&&p.y<=viewport.y;
 },motion);
 const request=!!(word&16)||firingPointer!==null||keys.has('f');
 if(state.tick>manualUntil)pendingManual=null;
 let manual=pendingManual;
 // Keep a quick tap queued through the current weapon recovery.
 if(manual&&state.tick+1>=state.shotAt)pendingManual=null;
 // A click is always a directed attack. A drag only steers movement.
 if(pointer&&!pointer.drag){
   if(++pointer.manualTicks>=3)manual=worldAt(...pointer.screen);
 }
 if(!manual&&request&&!automatic&&cursor)manual=worldAt(...cursor);
 const waitingForGesture=pointer&&!pointer.drag&&!manual;
 const assisted=!manual&&!waitingForGesture&&(automatic||request)&&selected;
 activeTarget=assisted?selected.guard:null;
 const dest=manual||assisted?.point;
 const angle=dest?Math.atan2(dest.y-state.y,dest.x-state.x):
   dx||dy?Math.atan2(dy,dx):state.heading;
 if(manual||assisted||request)word|=16;
 return word|(((Math.round(angle*128/Math.PI)+256)%256)<<7);
}
function loop(now){if(mode!=='run')return;acc+=Math.min(.12,(now-last)/1000);last=now;while(acc>=stepTime&&!state.result){const word=input();steps.push(word);advance(state,word);acc-=stepTime}draw();if(state.result){finish();return}frame=requestAnimationFrame(loop)}
