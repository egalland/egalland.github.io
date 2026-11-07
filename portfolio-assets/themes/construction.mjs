'use strict';
import {scatteredPose,placementPose} from './choreography.mjs?v=scroll-physics1';

// Draw, write, then carry the built unit into place with momentum and occasional mishaps.
// Original text nodes are restored after typing, so controls keep their own data.
export class ScrollConstruction {
  constructor({cursors,reduced,onReveal,completed=new WeakSet(),accept=()=>true,maxWorkers=6}) {
    this.cursors=cursors;this.reduced=reduced;this.onReveal=onReveal;this.abort=new AbortController();
    this.clock=0;this.delay=0;this.measuredAt=-1;this.units=[];this.team=[];
    this.scrollY=window.scrollY;this.scrollingUp=false;this.upwardPass=0;this.adjustmentsLeft=0;
    this.overlay=document.createElement('div');this.overlay.className='construction-team';
    this.overlay.setAttribute('aria-hidden','true');document.body.append(this.overlay);
    const elements=[...document.querySelectorAll('main .editable,main .hero-art,main .section-marker,main .hero-bottom')];
    elements.filter(el=>accept(el)&&!el.parentElement.closest('.editable')).forEach((el,index)=>{
      const category=el.matches('h1,h2,h3')?'TITRE':el.matches('.project-window,.hero-art')?'FENÊTRE':el.matches('.lab-card')?'PROJET':el.matches('p')?'TEXTE':el.matches('.actions,.project-links,.text-link')?'ACTION':'BLOC';
      const parts=el.matches('.project-window,.hero-art')?[...el.children]:[];
      parts.forEach(part=>part.classList.add('construction-detail'));el.classList.add('construction-unit');
      this.units.push({el,index,category,parts,dx:0,dy:0,angle:0,state:'waiting',stage:'create',owner:null,rect:null,textRecords:[],letters:[],written:0,adjustedPass:-1});
    });
    const roles=[['Cadres','create','#89afff'],['Texte','write','#ed9fbe'],['Placement','place','#8ad2b5'],['Structure','create','#e6bb77'],['Contenu','write','#b7a3ee'],['Alignement','place','#8acbd7']];
    roles.slice(0,maxWorkers).forEach(([name,role,color],i)=>{
      const node=document.createElement('div');node.className='construction-worker';node.dataset.role=role;
      node.style.setProperty('--worker-color',color);node.hidden=true;
      node.innerHTML=`<div class="construction-frame"><span class="construction-caption"></span><i></i><i></i><i></i><i></i></div><div class="construction-caret"></div><div class="construction-pointer"><span class="construction-grip"></span><svg viewBox="-3 -3 28 32"><path d="M0 0L5 21L10 14L19 13Z"/></svg><span class="construction-name">${name}</span></div>`;
      this.overlay.append(node);
      this.team.push({node,role,frame:node.querySelector('.construction-frame'),caption:node.querySelector('.construction-caption'),caret:node.querySelector('.construction-caret'),pointer:node.querySelector('.construction-pointer'),cursor:cursors[i+2],job:null});
    });
    // At most two exceptional incidents over the whole page, never on every block.
    const pick=items=>items[Math.floor(Math.random()*items.length)];
    const flip=pick(this.units.filter(u=>u.el.matches('.project-window,.lab-card')));
    const drop=pick(this.units.filter(u=>u.el.matches('.section-marker,.skill-line')));
    if(flip)flip.incident='flip';if(drop)drop.incident='drop';
    this.reset();
    delete document.documentElement.dataset.buildBoot;
    document.addEventListener('focusin',event=>{
      // Fragment navigation can focus an entire project card. It must still be built.
      // Only an explicit form/control interaction bypasses the choreography.
      if(!event.target.matches('input,textarea,select,button,[contenteditable]'))return;
      this.units.filter(unit=>unit.el===event.target||unit.el.contains(event.target)).forEach(unit=>this.reveal(unit,true));
    },{signal:this.abort.signal});
    for(const unit of this.units)if(completed.has(unit.el))this.reveal(unit,true);
  }
  destroy(){
    this.abort.abort();this.revealAll();this.overlay.remove();
    for(const unit of this.units){
      unit.el.classList.remove('construction-unit');
      for(const key of ['construction','drawProgress','written','textLength','incident'])delete unit.el.dataset[key];
      for(const key of ['--build-x','--build-y','--build-opacity','--build-width','--build-height','--build-angle','--build-flip'])unit.el.style.removeProperty(key);
      for(const part of unit.parts){part.classList.remove('construction-detail');part.style.removeProperty('--part-progress');}
    }
  }

  pose(unit,dx,dy,opacity=1,angle=0,flip=0) {
    unit.dx=dx;unit.dy=dy;unit.angle=angle;unit.flip=flip;
    unit.el.style.setProperty('--build-flip',flip.toFixed(3)+'deg');
    unit.el.style.setProperty('--build-angle',angle.toFixed(3)+'deg');
    unit.el.style.setProperty('--build-x',dx.toFixed(2)+'px');unit.el.style.setProperty('--build-y',dy.toFixed(2)+'px');
    unit.el.style.setProperty('--build-opacity',String(opacity));
  }
  geometry(unit,x=1,y=1) {
    unit.el.style.setProperty('--build-width',String(x));unit.el.style.setProperty('--build-height',String(y));
    unit.el.dataset.drawProgress=String(Math.round(Math.min(x,y)*100));
  }
  details(unit,progress=1) {
    unit.parts.forEach((part,i)=>part.style.setProperty('--part-progress',String(Math.max(0,Math.min(1,(progress-i*.12)/.65)))));
  }
  prepareText(unit) {
    if(unit.textRecords.length)return;
    const walker=document.createTreeWalker(unit.el,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()){
      const text=walker.currentNode;
      if(text.textContent.trim()&&!text.parentElement.closest('svg,script,style,input,textarea,.sr-only,.construction-run,[data-construction-static]'))nodes.push(text);
    }
    for(const text of nodes){
      const run=document.createElement('span');run.className='construction-run';
      const readable=document.createElement('span');readable.className='sr-only';readable.textContent=text.textContent;run.append(readable);
      const characters=Array.from(text.textContent);
      for(const character of characters){const span=document.createElement('span');span.className='construction-letter';span.setAttribute('aria-hidden','true');span.textContent=character;run.append(span);unit.letters.push(span)}
      text.replaceWith(run);unit.textRecords.push({text,run});
    }
    unit.written=0;unit.el.dataset.written='0';unit.el.dataset.textLength=String(unit.letters.length);
  }
  typeText(unit,amount) {
    const next=Math.max(0,Math.min(unit.letters.length,amount));
    if(next>unit.written)for(let i=unit.written;i<next;i++)unit.letters[i].classList.add('is-written');
    else for(let i=next;i<unit.written;i++)unit.letters[i].classList.remove('is-written');
    unit.written=next;unit.el.dataset.written=String(next);
  }
  restoreText(unit) {
    for(const record of unit.textRecords)if(record.run.isConnected)record.run.replaceWith(record.text);
    unit.textRecords=[];unit.letters=[];unit.written=0;
    delete unit.el.dataset.written;delete unit.el.dataset.textLength;
  }
  reveal(unit,accessible=false) {
    for(const worker of this.team)if(worker.job?.unit===unit){worker.job=null;worker.node.hidden=true;worker.cursor.trail=[]}
    this.restoreText(unit);unit.suspended=null;unit.owner=null;unit.stage='done';unit.state='done';unit.el.dataset.construction='done';
    this.geometry(unit);this.details(unit);this.pose(unit,0,0);
    if(accessible)this.onReveal(unit.el);
  }
  reset(delay=0) {
    this.delay=delay;this.measuredAt=-1;
    this.scrollY=window.scrollY;this.scrollVelocity=0;this.animationRate=1;this.scrollingUp=false;this.adjustmentsLeft=0;this.overlay.dataset.direction='down';
    for(const worker of this.team){worker.job=null;worker.node.hidden=true;worker.cursor.trail=[]}
    for(const unit of this.units){
      this.restoreText(unit);unit.owner=null;unit.stage=this.reduced?'done':'create';unit.state=this.reduced?'done':'waiting';unit.adjustedPass=-1;unit.suspended=null;
      unit.el.dataset.incident=unit.incident||'normal';unit.el.dataset.construction=unit.state;this.geometry(unit,this.reduced?1:0,this.reduced?1:0);this.details(unit,this.reduced?1:0);this.pose(unit,0,0,this.reduced?1:0);
    }
  }
  revealAll(){for(const unit of this.units)this.reveal(unit,true)}
  refreshLayout(){
    // Re-measure without finishing interrupted construction or revealing hidden text.
    this.measuredAt=-1;this.scrollY=window.scrollY;
  }
  suspend(worker){
    if(!worker.job)return;
    const unit=worker.job.unit,job=worker.job;
    unit.suspended=job.resuming?{...job,phase:job.resumePhase,elapsed:job.resumeElapsed,resuming:false}:job;unit.owner=null;
    worker.job=null;worker.node.hidden=true;worker.cursor.trail=[];
  }
  ready(el){const unit=this.units.find(unit=>unit.el===el);return !unit||unit.state==='done'}
  owns(index){return index>=2&&!!this.team[index-2]?.job}
  hideCursors(){for(const worker of this.team)worker.node.hidden=true}
  layoutRect(unit){
    // Recover the layout box from the rotated bounding box around its centre.
    const r=unit.el.getBoundingClientRect(),scale=Number(unit.el.style.getPropertyValue('--window-scale')||1);
    const width=unit.el.offsetWidth*scale,height=unit.el.offsetHeight*scale;
    const left=r.left+r.width/2-width/2-unit.dx,top=r.top+r.height/2-height/2-unit.dy;
    return {left,top,width,height,right:left+width,bottom:top+height};
  }
  measure({width,height}) {
    const nav=width<=700?65:74;
    for(const unit of this.units){
      const r=this.layoutRect(unit);unit.rect=r;
      unit.eligible=unit.state!=='done'&&!unit.owner&&r.bottom>nav&&r.top<height*.96;

    }
  }
  choose(worker,limit) {
    const candidates=this.units.filter(unit=>unit.eligible&&!unit.owner&&unit.state!=='done');
    candidates.sort((a,b)=>a.rect.top-b.rect.top||a.index-b.index);
    const writingBacklog=candidates.filter(unit=>unit.stage==='write');
    if(writingBacklog.length>=3&&worker.role==='create')return writingBacklog[0];
    return candidates.find(unit=>unit.stage===worker.role)||candidates.find(unit=>unit.stage!=='create')||candidates[0];
  }
  chooseAdjustment(){return null;}
  assign(worker,unit,{width}) {
    if(unit.suspended){
      const previous=unit.suspended;unit.suspended=null;
      worker.job={...previous,resuming:true,resumePhase:previous.phase,resumeElapsed:previous.elapsed,phase:'approach',elapsed:0,from:{x:worker.cursor.x,y:worker.cursor.y}};
      unit.owner=worker;worker.node.hidden=false;return;
    }
    const task=unit.stage;
    if(task==='adjust'){unit.adjustedPass=this.upwardPass;this.adjustmentsLeft--}
    if(task==='create'){
      this.prepareText(unit);
      const pose=scatteredPose(unit.index,width);
      pose.kind=unit.incident||'normal';pose.flip=0;pose.angle=pose.kind==='flip'?180:0;
      const spread=.25+.75*Math.min(1,(this.scrollVelocity||0)/2400);
      pose.x*=spread;pose.y*=spread;
      unit.scatter=pose;unit.el.dataset.incident=pose.kind;
      this.pose(unit,pose.x,pose.y,0,pose.angle,pose.flip);this.geometry(unit,0,0);this.details(unit,0);
    }
    if(task==='place'&&unit.scatter){
      // A nearby panel occupies the working lane: the carried block veers around it.
      const near=this.units.find(other=>other!==unit&&other.state!=='waiting'&&other.rect&&unit.rect&&Math.abs(other.rect.top-unit.rect.top)<Math.max(other.rect.height,unit.rect.height)+32);
      unit.scatter.obstacle=near&&Math.random()<.32*Math.min(1,(this.scrollVelocity||0)/2400)?(unit.scatter.x>=0?1:-1):0;
    }
    const writingDuration=Math.min(2.1,Math.max(.55,unit.letters.length/(unit.category==='TITRE'?29:105)));
    worker.job={unit,task,phase:'approach',elapsed:0,approachDuration:.28+Math.random()*.4,from:{x:worker.cursor.x,y:worker.cursor.y},source:{...unit.scatter,x:unit.dx,y:unit.dy,angle:unit.angle,flip:unit.flip||0},duration:task==='adjust'?.36:task==='write'?writingDuration:task==='create'?(unit.scatter?.duration||.8):(unit.incident?2.4:1.25+(unit.scatter?.duration||1)*.3)};
    unit.owner=worker;unit.state='approach';unit.el.dataset.construction='approach';worker.node.hidden=false;
  }
  finish(worker) {
    const {unit,task}=worker.job;
    if(task==='create'){
      this.geometry(unit);this.details(unit,0);unit.stage=unit.letters.length?'write':'place';unit.state='created';
    }else if(task==='write'){
      this.typeText(unit,unit.letters.length);this.restoreText(unit);this.details(unit);unit.stage='place';unit.state='written';
    }else{
      this.pose(unit,0,0);this.details(unit);unit.stage='done';unit.state='done';
    }
    unit.el.dataset.construction=unit.state;unit.owner=null;unit.eligible=true;
    worker.job=null;worker.node.hidden=true;worker.cursor.trail=[];
  }
  caretRect(unit) {
    const index=Math.max(0,unit.written-1),letter=unit.letters[index];
    if(!letter)return null;
    const r=letter.getBoundingClientRect();
    return {left:unit.written?r.right:r.left,top:r.top,height:Math.max(10,r.height)};
  }
  update(dt,{width,height,count,showOutlines,enabled}) {
    if(this.reduced||!enabled)return;
    const realDt=Math.max(0,Math.min(dt,.05));
    const delta=window.scrollY-this.scrollY;
    // Smooth real scroll velocity; advance the existing timeline, never skip its phases.
    const velocity=Math.min(6000,Math.abs(delta)/Math.max(realDt,1/120));
    this.scrollVelocity??=0;
    this.scrollVelocity+=(velocity-this.scrollVelocity)*(1-Math.exp(-realDt/(velocity>this.scrollVelocity ? .07 : .24)));
    this.animationRate=1+5*Math.min(1,this.scrollVelocity/2400);
    dt=realDt*this.animationRate;
    if(delta<-2){
      if(!this.scrollingUp)this.upwardPass++;
      this.scrollingUp=true;this.overlay.dataset.direction='up';
    }else if(delta>2){this.scrollingUp=false;this.overlay.dataset.direction='down'}
    this.scrollY=window.scrollY;
    this.clock+=dt;this.delay=Math.max(0,this.delay-dt);if(this.delay)return;
    if(this.clock-this.measuredAt>.075){this.measure({width,height});this.measuredAt=this.clock}
    const limit=Math.min(width<=700?3:6,Math.max(1,count-2));
    const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
    for(let i=0;i<this.team.length;i++){
      const worker=this.team[i];
      if(i>=limit){if(worker.job)this.suspend(worker);continue}
      if(!worker.job){const unit=this.choose(worker,limit);if(unit)this.assign(worker,unit,{width})}
      if(!worker.job)continue;
      const job=worker.job,unit=job.unit,r=this.layoutRect(unit);
      if(r.bottom<65||r.top>height+50){this.suspend(worker);continue}
      const intensity=Math.min(1,this.scrollVelocity/2400);
      job.inertia??=intensity;
      job.inertia+=(intensity-job.inertia)*(1-Math.exp(-realDt/(intensity>job.inertia ? .07 : .65)));
      job.elapsed+=dt;
      if(job.phase==='approach'&&job.elapsed>=job.approachDuration){job.phase=job.resuming?job.resumePhase:job.task;job.elapsed=job.resuming?job.resumeElapsed:0;job.resuming=false;}
      else if(job.phase===job.task&&job.elapsed>=job.duration){
        job.phase='settle';job.elapsed=0;
        if(job.task==='create'){this.geometry(unit);this.details(unit,0);}
        if(job.task==='write')this.typeText(unit,unit.letters.length);
        if(job.task==='place'||job.task==='adjust')this.pose(unit,0,0);
      }else if(job.phase==='settle'&&job.elapsed>=.14){this.finish(worker);continue;}
      let drawX=1,drawY=1;
      if(job.task==='create'){
        const p=job.phase==='approach'?(job.resuming?(job.resumePhase==='settle'?1:ease(job.resumeElapsed/job.duration)):0):job.phase==='settle'?1:ease(job.elapsed/job.duration);
        const sideways=job.source.draw>.5;
        drawX=sideways?Math.min(1,p*1.8):Math.pow(p,.8);
        drawY=sideways?Math.pow(p,1.5):Math.min(1,p*1.5);
        this.geometry(unit,drawX,drawY);this.details(unit,0);
        this.pose(unit,job.source.x,job.source.y,p>0?1:0,job.source.angle,job.source.flip);
      }
      if(job.task==='write'&&job.phase==='write'){
        // Discrete characters with short pauses give the caret an actual writing rhythm.
        const p=Math.min(1,job.elapsed/job.duration),paced=Math.max(0,Math.min(1,p-.022*Math.sin(p*Math.PI*6)));
        this.typeText(unit,Math.floor(unit.letters.length*paced));this.details(unit,paced);
      }
      if(job.task==='place'&&job.phase==='place'){
        const pose=placementPose(job.source,job.elapsed/job.duration,job.inertia);
        this.pose(unit,pose.x,pose.y,1,pose.angle,pose.flip);
      }
      if(job.task==='adjust'&&job.phase==='adjust'){
        const p=Math.min(1,job.elapsed/job.duration),nudge=Math.sin(p*Math.PI);
        this.pose(unit,(unit.index%2?1:-1)*nudge*1.8,nudge*.6,1,(unit.index%2?1:-1)*nudge*.45);
      }
      const actual=unit.el.getBoundingClientRect(),box=this.layoutRect(unit);
      const angle=unit.angle*Math.PI/180,cx=box.left+unit.dx+box.width/2,cy=box.top+unit.dy+box.height/2;
      const onBlock=(x,y)=>{
        const localX=x-box.width/2,localY=y-box.height/2,yaw=(unit.flip||0)*Math.PI/180;
        const perspective=1000/(1000+localX*Math.sin(yaw)),px=localX*Math.cos(yaw)*perspective,py=localY*perspective;
        return {x:cx+px*Math.cos(angle)-py*Math.sin(angle),y:cy+px*Math.sin(angle)+py*Math.cos(angle)};
      };
      let point=onBlock(14,10);
      if(job.task==='create')point=onBlock(box.width*drawX,box.height*drawY);
      if(job.task==='place')point=onBlock(box.width,0);
      const caret=job.task==='write'?this.caretRect(unit):null;
      if(caret)point={x:caret.left+6,y:caret.top+caret.height*.72};
      const c=worker.cursor;
      if(job.phase==='approach'){
        const p=ease(job.elapsed/job.approachDuration);c.x=job.from.x+(point.x-job.from.x)*p;c.y=job.from.y+(point.y-job.from.y)*p;
      }else{c.x=point.x;c.y=point.y}
      worker.pointer.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
      const f=worker.frame;f.style.left=box.left+unit.dx+'px';f.style.top=box.top+unit.dy+'px';f.style.width=box.width*drawX+'px';f.style.height=box.height*drawY+'px';f.style.transformOrigin=(box.width/2)+'px '+(box.height/2)+'px';f.style.rotate=unit.angle+'deg';f.style.transform='perspective(1000px) rotateY('+(unit.flip||0)+'deg)';f.hidden=job.phase==='approach';
      worker.caret.hidden=!(caret&&job.phase==='write');
      if(caret){worker.caret.style.left=caret.left+'px';worker.caret.style.top=caret.top+'px';worker.caret.style.height=caret.height+'px'}
      const verb=job.task==='place'&&unit.incident==='drop'?'RATTRAPER':job.task==='place'&&unit.incident==='flip'?'RETOURNER':job.task==='place'&&job.source.obstacle?'DÉGAGER':job.task==='adjust'?'AJUSTER':job.task==='create'?'CRÉER':job.task==='write'?'ÉCRIRE':Math.abs(unit.angle)>1?'REDRESSER':'ALIGNER';
      worker.caption.textContent=verb+' / '+unit.category+(job.task==='write'?' · '+unit.written+'/'+unit.letters.length:job.task==='place'?' · '+Math.abs(unit.angle).toFixed(1)+'°':'');
      worker.node.dataset.phase=job.phase;worker.node.dataset.task=job.task;worker.node.classList.toggle('hide-selection',!showOutlines);
      unit.state=job.phase;unit.el.dataset.construction=job.phase;
    }
  }
}
