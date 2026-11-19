// Store positions as fractions of the space in which each widget can travel.
const labels={district:'Quartier',vitals:'Profil et vie',radar:'Mini-carte',inventory:'Équipement',chat:'Chat',speed:'Compteur véhicule',stick:'Joystick',jump:'Saut et escalade',fire:'Tir',ride:'Véhicule',recenter:'Caméra',heal:'Soins'};
const touchOnly=new Set(['stick','jump','fire','ride','recenter','heal']);
const limit=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const profileKey='maillecity.hud.v1.';
const element=(tag,cls,text)=>{
  const el=document.createElement(tag); if(cls)el.className=cls;if(text)el.textContent=text;return el;
};
function command(text,name,fn){
  const b=element('button',name,text);b.type='button';b.addEventListener('click',fn);return b;
}
export function installHudEditor({scene,onEdit,onFinish}) {
  const widgets=new Map([...scene.querySelectorAll('[data-hud]')].map(el=>[el.dataset.hud,el]));
  const mobile=matchMedia('(pointer:coarse),(max-width:670px)');
  const landscape=matchMedia('(orientation:landscape)');
  const key=()=>profileKey+(mobile.matches?'tactile':'bureau')+'.'+(landscape.matches?'paysage':'portrait');
  let storageKey='',layout={},editing=false,selection='vitals',gesture=null,queued=0;
  const handles=new Map(),priorInert=new Map(),surface=element('div','he-surface'),dock=element('section','he-dock');
  surface.hidden=dock.hidden=true;
  scene.append(surface);scene.after(dock);
  dock.setAttribute('aria-label','Édition de l’affichage');
  const heading=element('div','he-heading');
  heading.append(element('strong','','Disposition du jeu'),element('small','','Glisse un élément pour le déplacer.'));
  const picker=element('select','he-picker');picker.setAttribute('aria-label','Élément à modifier');
  const size=element('input','he-size');size.type='range';size.min='65';size.max='165';size.step='5';size.setAttribute('aria-label','Taille de l’élément');
  const value=element('output','he-value');
  const sizing=element('label','he-sizing');sizing.append(element('span','','Taille'),size,value);
  const show=element('input');show.type='checkbox';
  const visibility=element('label','he-show');visibility.append(show,document.createTextNode('Afficher'));
  const reset=command('Réinitialiser','he-reset',()=>{
    layout={};save();arrange();select(selection);status.textContent='Disposition d’origine restaurée.';
  });
  reset.title='Restaurer la disposition de cet écran';
  const done=command('Terminer','he-done',()=>close());
  const status=element('span','he-sr');status.setAttribute('role','status');
  dock.append(heading,picker,sizing,visibility,reset,done,status);
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(layout));}catch{}}
  function load(){
    storageKey=key();layout={};
    try{const raw=JSON.parse(localStorage.getItem(storageKey)||'{}');
      for(const id of widgets.keys()){
        const entry=raw?.[id];if(!entry || typeof entry!=='object')continue;
        const clean={hidden:entry.hidden===true};
        if(Number.isFinite(entry.x)&&Number.isFinite(entry.y)){
          clean.x=limit(entry.x,0,1);clean.y=limit(entry.y,0,1);
          clean.scale=limit(Number.isFinite(entry.scale)?entry.scale:1,.65,1.65);
        }
        layout[id]=clean;
      }
    }catch{}
  }
  const enabled=id=>mobile.matches||!touchOnly.has(id);
  function arrange(){
    queued=0;
    if(key()!==storageKey){load();if(editing)fillPicker();}
    const bounds=scene.getBoundingClientRect();
    for(const [id,widget] of widgets){
      const entry=layout[id]||{},placed=Number.isFinite(entry.x)&&enabled(id);
      widget.classList.toggle('he-hidden',Boolean(entry.hidden));
      widget.classList.toggle('he-placed',placed);
      if(placed){
        const scale=Math.min(entry.scale||1,bounds.width/Math.max(1,widget.offsetWidth),bounds.height/Math.max(1,widget.offsetHeight));
        widget.style.setProperty('--he-s',String(scale));
        widget.style.setProperty('--he-x',Math.round(entry.x*Math.max(0,bounds.width-widget.offsetWidth*scale))+'px');
        widget.style.setProperty('--he-y',Math.round(entry.y*Math.max(0,bounds.height-widget.offsetHeight*scale))+'px');
      }
      if(!editing)continue;
      const handle=handles.get(id);handle.hidden=!enabled(id);
      if(handle.hidden)continue;
      const rect=widget.getBoundingClientRect();
      handle.style.left=(rect.left-bounds.left)+'px';handle.style.top=(rect.top-bounds.top)+'px';
      handle.style.width=rect.width+'px';handle.style.height=rect.height+'px';
      handle.classList.toggle('he-muted',Boolean(entry.hidden));
    }
  }
  function schedule(){if(!queued)queued=requestAnimationFrame(arrange);}
  function select(id){
    selection=id;picker.value=id;
    const entry=layout[id]||{};size.value=String(Math.round((entry.scale||1)*100));
    value.value=size.value+' %';value.textContent=value.value;show.checked=!entry.hidden;
    for(const [key,h] of handles){h.classList.toggle('he-selected',key===id);h.tabIndex=key===id?0:-1;h.setAttribute('aria-pressed',String(key===id));}
  }
  function setGeometry(id,left,top,scale){
    const widget=widgets.get(id),w=scene.clientWidth,h=scene.clientHeight;
    scale=limit(scale,.65,1.65);
    const drawn=Math.min(scale,w/Math.max(widget.offsetWidth,1),h/Math.max(widget.offsetHeight,1));
    layout[id]={...layout[id],scale,x:limit(left/Math.max(1,w-widget.offsetWidth*drawn),0,1),y:limit(top/Math.max(1,h-widget.offsetHeight*drawn),0,1)};
    arrange();
  }
  function rectWithinScene(id){
    const box=widgets.get(id).getBoundingClientRect(),area=scene.getBoundingClientRect();
    return {x:box.left-area.left,y:box.top-area.top};
  }
  for(const [id,widget] of widgets){
    const h=element('button','he-handle');h.type='button';h.setAttribute('aria-label','Déplacer '+labels[id]);h.dataset.handle=id;
    h.append(element('span','',labels[id]));surface.append(h);handles.set(id,h);
    h.addEventListener('pointerdown',e=>{
      if(gesture||e.button!==0)return;e.preventDefault();select(id);
      const local=rectWithinScene(id);
      gesture={id,pointer:e.pointerId,x:e.clientX,y:e.clientY,local};
      h.setPointerCapture(e.pointerId);
    });
    h.addEventListener('pointermove',e=>{
      if(gesture?.id!==id||gesture.pointer!==e.pointerId)return;
      setGeometry(id,gesture.local.x+e.clientX-gesture.x,gesture.local.y+e.clientY-gesture.y,layout[id]?.scale||1);
    });
    function release(e){if(gesture?.id===id&&gesture.pointer===e.pointerId){gesture=null;save();}}
    h.addEventListener('pointerup',release);h.addEventListener('pointercancel',release);h.addEventListener('lostpointercapture',release);
    h.addEventListener('keydown',e=>{
      const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.key];
      if(!delta)return;e.preventDefault();const local=rectWithinScene(id),step=e.shiftKey?12:3;
      setGeometry(id,local.x+delta[0]*step,local.y+delta[1]*step,layout[id]?.scale||1);save();
    });
    h.addEventListener('focus',()=>select(id));
  }
  function fillPicker(){
    picker.replaceChildren();
    for(const id of widgets.keys())if(enabled(id)){
      const option=element('option','',labels[id]);option.value=id;picker.append(option);
    }
    select(enabled(selection)?selection:'vitals');
  }
  size.addEventListener('input',()=>{const local=rectWithinScene(selection);setGeometry(selection,local.x,local.y,Number(size.value)/100);select(selection);save();});
  show.addEventListener('change',()=>{layout[selection]={...layout[selection],hidden:!show.checked};save();arrange();});
  picker.addEventListener('change',()=>select(picker.value));
  function open(){
    if(editing){close();return;}
    onEdit();editing=true;
    const controls=[...widgets.values(),...document.querySelectorAll('.topbar button:not(#editHud),#city,#sectorEdge')];
    for(const control of controls){priorInert.set(control,control.inert);control.inert=true;}
    document.getElementById('editHud')?.setAttribute('aria-pressed','true');
    document.body.classList.add('he-editing');surface.hidden=dock.hidden=false;
    fillPicker();arrange();picker.focus({preventScroll:true});
  }
  function close(){
    if(!editing)return;gesture=null;save();editing=false;document.body.classList.remove('he-editing');surface.hidden=dock.hidden=true;
    for(const [control,inert] of priorInert)control.inert=inert;
    priorInert.clear();document.getElementById('editHud')?.setAttribute('aria-pressed','false');
    arrange();onFinish();
  }
  function intercept(e){
    if(!editing)return false;
    if(e.key==='Escape'){e.preventDefault();if(e.type==='keydown')close();e.stopImmediatePropagation();return true;}
    // Native controls and keyboard nudging keep their normal DOM events. The game remains paused.
    return true;
  }
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;
  observer?.observe(scene);for(const el of widgets.values())observer?.observe(el);
  window.addEventListener('resize',schedule);mobile.addEventListener?.('change',schedule);landscape.addEventListener?.('change',schedule);
  // Native browser page zoom and virtual keyboards leave the saved profile intact.
  load();arrange();
  return {open,close,intercept,get active(){return editing;}};
}
