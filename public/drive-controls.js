// Capture each pedal and direction separately so two thumbs work together.
export function installDriveControls(root,change){
  const held=new Map(),buttons=[...root.querySelectorAll('[data-drive]')];
  let active=false;
  function update(){
    const values=new Set([...held.values()].map(button=>button.dataset.drive));
    for(const button of buttons)button.classList.toggle('is-pressed',values.has(button.dataset.drive));
    change(Number(values.has('right'))-Number(values.has('left')),
      values.has('brake')?-1:Number(values.has('throttle')));
  }
  function release(){if(held.size){held.clear();update();}}
  for(const button of buttons){
    button.addEventListener('pointerdown',event=>{
      if(!active||event.button!==0)return;
      event.preventDefault();held.set(event.pointerId,button);
      button.setPointerCapture?.(event.pointerId);update();
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])
      button.addEventListener(type,event=>{if(held.delete(event.pointerId))update();});
    for(const type of ['keydown','keyup'])button.addEventListener(type,event=>{
      if(!active||![' ','Enter'].includes(event.key))return;
      event.preventDefault();event.stopPropagation();
      const key=button.dataset.drive+'/'+event.key;
      if(type==='keydown')held.set(key,button);else held.delete(key);
      update();
    });
    button.addEventListener('blur',()=>{
      for(const [key,pressed] of held)if(typeof key==='string'&&pressed===button)held.delete(key);
      update();
    });
  }
  return {release,setActive(value){
    if(active===value)return;
    active=value;root.hidden=!active;if(!active)release();
  }};
}
