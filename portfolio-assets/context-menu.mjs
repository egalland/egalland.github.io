export const QUICK_DESTINATIONS=['market-plus','kikalmo','maison','bodyos','atelier','about'];
export function preservesNativeMenu(target,{shiftKey=false,selection=''}={}){
 return shiftKey||Boolean(selection.trim())||Boolean(target?.closest?.('a,input,textarea,select,[contenteditable],dialog'));
}

/** Shared by the three views: one orbital project menu, as on the original page. */
export function createPortfolioMenu({getState,onTheme,onPause,onGlitch}){
 const abort=new AbortController(),on=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
 const menu=document.createElement('dialog');menu.id='portfolio-menu';menu.className='portfolio-orbital-menu';menu.setAttribute('aria-labelledby','portfolio-menu-title');
 menu.innerHTML='<div class="orbital-header"><span>À PARCOURIR</span><button type="button" class="close-menu" aria-label="Fermer le menu">✕</button></div><nav class="orbital-map" aria-label="Projets et parcours"><div class="orbit-line orbit-line-one" aria-hidden="true"></div><div class="orbit-line orbit-line-two" aria-hidden="true"></div><div class="menu-center"><i aria-hidden="true"></i><h2 id="portfolio-menu-title">Projets &<br>parcours.</h2></div></nav><div class="menu-themes" role="group" aria-label="Choisir une vue"></div><div class="menu-utilities"><a href="#home">↺ Revoir l’ouverture</a><button type="button" class="menu-motion"></button></div><button type="button" class="menu-glitch">Provoquer un glitch</button><p class="menu-key">Clic droit · Maj + F10 · Échap pour fermer</p>';
 const positions=[[50,8],[82,29],[82,69],[50,91],[18,69],[18,29]],map=menu.querySelector('.orbital-map');
 QUICK_DESTINATIONS.forEach((id,i)=>{
  const target=document.getElementById(id);if(!target)return;
  const link=document.createElement('a');link.className='orbital-item';link.href='#'+id;link.style.setProperty('--orbit-x',positions[i][0]+'%');link.style.setProperty('--orbit-y',positions[i][1]+'%');
  const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=id==='atelier'?'L’atelier':id==='about'?'Parcours':target.querySelector('h3').textContent;link.append(number,label);map.append(link);
 });
 const themes=menu.querySelector('.menu-themes'),themeButtons=[];
 for(const [key,label] of [['points','Points'],['curseurs','Curseurs'],['glitch','Glitch']]){
  const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.menuTheme=key;themes.append(button);themeButtons.push(button);
  on(button,'click',()=>{onTheme(key);refresh();});
 }
 const motion=menu.querySelector('.menu-motion'),fault=menu.querySelector('.menu-glitch');
 const explorer=document.createElement('button');explorer.type='button';explorer.className='quickmenu-trigger';explorer.textContent='Explorer';explorer.setAttribute('aria-haspopup','dialog');explorer.setAttribute('aria-controls',menu.id);
 document.querySelector('.nav nav').append(explorer);document.body.append(menu);
 function refresh(){
  const state=getState();themeButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.menuTheme===state.theme)));
  motion.textContent=state.reduced?'Mouvements réduits (système)':state.paused?'▷ Activer les animations':'Ⅱ Réduire les effets';motion.setAttribute('aria-pressed',String(state.paused));motion.disabled=state.reduced;
  motion.title=state.reduced?'Les mouvements sont réduits par votre système.':'';
  fault.hidden=state.theme!=='glitch';fault.disabled=state.paused;
 }
 function close(){if(menu.open)menu.close();}
 function open(x=innerWidth/2,y=innerHeight/2){
  if(document.querySelector('dialog[open]'))return;refresh();
  document.querySelector('.nav').classList.remove('mobile-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
  menu.style.left='12px';menu.style.top='12px';menu.showModal();
  const r=menu.getBoundingClientRect();menu.style.left=Math.max(12,Math.min(innerWidth-r.width-12,x-r.width/2))+'px';menu.style.top=Math.max(12,Math.min(innerHeight-r.height-12,y-r.height/2))+'px';
 }
 on(explorer,'click',()=>open());on(menu.querySelector('.close-menu'),'click',close);
 on(motion,'click',()=>{onPause();refresh();});
 on(fault,'click',()=>{close();onGlitch();});
 on(menu,'click',e=>{
  const link=e.target.closest('a[href^="#"]');
  if(link){e.preventDefault();const target=document.getElementById(link.hash.slice(1));close();target?.scrollIntoView({block:'start',behavior:getState().paused?'instant':'smooth'});const url=new URL(location.href);url.hash=link.hash;history.replaceState(null,'',url);return;}
  if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}
 });
 on(document,'contextmenu',e=>{if(preservesNativeMenu(e.target,{shiftKey:e.shiftKey,selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open(e.clientX,e.clientY);});
 on(document,'keydown',e=>{if(e.key!=='ContextMenu'&&!(e.key==='F10'&&e.shiftKey))return;if(preservesNativeMenu(e.target,{selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open();});
 on(window,'pagehide',close);refresh();
 return {refresh,close,destroy(){abort.abort();close();menu.remove();explorer.remove();}};
}
