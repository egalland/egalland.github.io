export const QUICK_DESTINATIONS=['market-plus','kikalmo','maison','bodyos','pills','atelier','inktober','about'];
export function preservesNativeMenu(target,{shiftKey=false,selection=''}={}){
 return shiftKey||Boolean(selection.trim())||Boolean(target?.closest?.('a,input,textarea,select,[contenteditable],dialog,#portfolio-menu'));
}

/** A compact pointer context menu, anchored to the click without a modal backdrop. */
export function createPortfolioMenu({getState,onTheme,onPause}){
 const abort=new AbortController(),on=(el,type,fn)=>el.addEventListener(type,fn,{signal:abort.signal});
 const menu=document.createElement('div');menu.id='portfolio-menu';menu.setAttribute('popover','auto');menu.setAttribute('aria-label','Outils de navigation');
 menu.innerHTML='<div class="pointer-menu-heading"><svg viewBox="0 0 28 32" aria-hidden="true"><path d="M2 2L7 27L13 19L23 18Z"/></svg><span>Naviguer dans le portfolio</span><button type="button" class="close-menu" aria-label="Fermer la navigation">×</button></div><nav class="pointer-menu-list" aria-label="Projets et pratiques"><a class="pointer-home" href="#home"><span>Accueil</span><small>↑</small></a></nav><div class="pointer-menu-footer"><button type="button" data-open-points>Points ↗</button><button type="button" data-open-chrome>Chrome ↗</button><button type="button" class="menu-motion"></button></div>';
 const map=menu.querySelector('.pointer-menu-list');
 QUICK_DESTINATIONS.forEach((id,i)=>{
  const target=document.getElementById(id);if(!target)return;
  const link=document.createElement('a');link.className='pointer-menu-item';link.href='#'+id;link.dataset.destination=id;
  const number=document.createElement('small');number.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=id==='atelier'?'L’atelier':id==='inktober'?'Inktober':id==='about'?'Pratiques':target.querySelector('h3').textContent;
  link.append(number,label);const arrow=document.createElement('i');arrow.textContent='↵';arrow.setAttribute('aria-hidden','true');link.append(arrow);map.append(link);
 });
 const motion=menu.querySelector('.menu-motion'),explorer=document.createElement('button');
 explorer.type='button';explorer.className='quickmenu-trigger';explorer.textContent='↖ Explorer';explorer.setAttribute('aria-controls',menu.id);explorer.setAttribute('aria-expanded','false');
 document.querySelector('.nav nav').append(explorer);document.body.append(menu);
 function refresh(){
  const state=getState();motion.textContent=state.reduced?'Mouvements réduits':state.paused?'▷ Animer':'Ⅱ Pause';motion.disabled=state.reduced;motion.setAttribute('aria-pressed',String(state.paused));
  menu.dataset.paused=String(state.paused);
  const current=QUICK_DESTINATIONS.filter(id=>document.getElementById(id)?.getBoundingClientRect().top<=innerHeight*.4).at(-1);
  for(const link of map.querySelectorAll('[data-destination]')){if(link.dataset.destination===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
 }
 const isOpen=()=>menu.matches(':popover-open');
 function close(){if(isOpen())menu.hidePopover();}
 function open(x=innerWidth/2,y=innerHeight/2){
  if(document.querySelector('dialog[open]'))return;
  refresh();document.querySelector('.nav').classList.remove('mobile-open');document.querySelector('#menu').setAttribute('aria-expanded','false');
  if(!isOpen())menu.showPopover();
  const r=menu.getBoundingClientRect();menu.style.left=Math.max(12,Math.min(innerWidth-r.width-12,x+10))+'px';menu.style.top=Math.max(12,Math.min(innerHeight-r.height-12,y+8))+'px';
 }
 on(explorer,'click',()=>{const r=explorer.getBoundingClientRect();isOpen()?close():open(r.left,r.bottom);});on(menu.querySelector('.close-menu'),'click',close);
 on(menu,'toggle',()=>explorer.setAttribute('aria-expanded',String(isOpen())));
 on(menu.querySelector('[data-open-points]'),'click',()=>{close();onTheme('points');});
 on(menu.querySelector('[data-open-chrome]'),'click',()=>{close();onTheme('chrome');});
 on(motion,'click',()=>{onPause();refresh();});
 on(menu,'click',e=>{
  const link=e.target.closest('a');if(!link)return;
  e.preventDefault();const hash=link.getAttribute('href'),target=document.getElementById(hash.slice(1));close();
  if(target){target.tabIndex=-1;target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:getState().paused?'instant':'smooth'});}
  const url=new URL(location.href);url.hash=hash;history.replaceState(null,'',url);
 });
 on(menu,'keydown',e=>{
  if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
  const links=[...map.querySelectorAll('a')],index=links.indexOf(document.activeElement);
  const next=e.key==='Home'?0:e.key==='End'?links.length-1:(index+(e.key==='ArrowDown'?1:-1)+links.length)%links.length;
  e.preventDefault();links[next].focus();
 });
 on(document,'contextmenu',e=>{if(preservesNativeMenu(e.target,{shiftKey:e.shiftKey,selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open(e.clientX,e.clientY);});
 on(document,'keydown',e=>{if(e.key!=='ContextMenu'&&!(e.key==='F10'&&e.shiftKey))return;if(preservesNativeMenu(e.target,{selection:window.getSelection()?.toString()||''}))return;e.preventDefault();open();menu.querySelector('a').focus();});
 on(window,'resize',()=>{if(isOpen())open();});on(window,'scroll',close);on(window,'pagehide',close);refresh();
 return {refresh,close,destroy(){abort.abort();close();menu.remove();explorer.remove();}};
}
