'use strict';

// A staged workshop: one cursor draws, another types, another positions the result.
// Original text nodes are restored after typing, so controls keep their own data.
class ScrollConstruction {
  constructor({cursors,reduced,onReveal}) {
    this.cursors=cursors;this.reduced=reduced;this.onReveal=onReveal;
    this.clock=0;this.delay=0;this.measuredAt=-1;this.units=[];this.team=[];
    this.scrollY=window.scrollY;this.scrollingUp=false;this.upwardPass=0;this.adjustmentsLeft=0;
    this.overlay=document.createElement('div');this.overlay.className='construction-team';
    this.overlay.setAttribute('aria-hidden','true');document.body.append(this.overlay);
    const elements=[...document.querySelectorAll('main .editable,main .hero-art,main .section-marker,main .hero-bottom')];
    elements.filter(el=>!el.parentElement.closest('.editable')).forEach((el,index)=>{
      const category=el.matches('h1,h2,h3')?'TITRE':el.matches('.project-window,.hero-art')?'FENÊTRE':el.matches('.lab-card')?'PROJET':el.matches('p')?'TEXTE':el.matches('.actions,.project-links,.text-link')?'ACTION':'BLOC';
      const parts=el.matches('.project-window,.hero-art')?[...el.children]:[];
      parts.forEach(part=>part.classList.add('construction-detail'));el.classList.add('construction-unit');
      this.units.push({el,index,category,parts,dx:0,dy:0,state:'waiting',stage:'create',owner:null,rect:null,textRecords:[],letters:[],written:0,adjustedPass:-1});
    });
    const roles=[['Cadres','create','#89afff'],['Texte','write','#ed9fbe'],['Placement','place','#8ad2b5'],['Structure','create','#e6bb77'],['Contenu','write','#b7a3ee'],['Alignement','place','#8acbd7']];
    roles.forEach(([name,role,color],i)=>{
      const node=document.createElement('div');node.className='construction-worker';node.dataset.role=role;
      node.style.setProperty('--worker-color',color);node.hidden=true;
      node.innerHTML=`<div class="construction-frame"><span class="construction-caption"></span><i></i><i></i><i></i><i></i></div><div class="construction-caret"></div><div class="construction-pointer"><span class="construction-grip"></span><svg viewBox="-3 -3 28 32"><path d="M0 0L5 21L10 14L19 13Z"/></svg><span class="construction-name">${name}</span></div>`;
      this.overlay.append(node);
      this.team.push({node,role,frame:node.querySelector('.construction-frame'),caption:node.querySelector('.construction-caption'),caret:node.querySelector('.construction-caret'),pointer:node.querySelector('.construction-pointer'),cursor:cursors[i+2],job:null});
    });
    this.reset();
    document.addEventListener('focusin',event=>this.units.filter(unit=>unit.el===event.target||unit.el.contains(event.target)).forEach(unit=>this.reveal(unit,true)));
  }
  pose(unit,dx,dy,opacity=1) {
    unit.dx=dx;unit.dy=dy;
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
      if(text.textContent.trim()&&!text.parentElement.closest('svg,script,style,input,textarea,.sr-only,.construction-run'))nodes.push(text);
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
    this.restoreText(unit);unit.owner=null;unit.stage='done';unit.state='done';unit.el.dataset.construction='done';
    this.geometry(unit);this.details(unit);this.pose(unit,0,0);
    if(accessible)this.onReveal(unit.el);
  }
  reset(delay=0) {
    this.delay=delay;this.measuredAt=-1;
    this.scrollY=window.scrollY;this.scrollingUp=false;this.adjustmentsLeft=0;this.overlay.dataset.direction='down';
    for(const worker of this.team){worker.job=null;worker.node.hidden=true;worker.cursor.trail=[]}
    for(const unit of this.units){
      this.restoreText(unit);unit.owner=null;unit.stage=this.reduced?'done':'create';unit.state=this.reduced?'done':'waiting';unit.adjustedPass=-1;
      unit.el.dataset.construction=unit.state;this.geometry(unit);this.details(unit,this.reduced?1:0);this.pose(unit,0,0,this.reduced?1:0);
    }
  }
  revealAll(){for(const unit of this.units)this.reveal(unit,true)}
  refreshLayout(){
    // Browser chrome and the mobile keyboard can resize the viewport during scrolling.
    // Preserve finished work, and settle an interrupted gesture instead of replaying it.
    for(const unit of this.units)if(unit.state!=='waiting'&&unit.state!=='done')this.reveal(unit,true);
    this.measuredAt=-1;this.scrollY=window.scrollY;
  }
  ready(el){const unit=this.units.find(unit=>unit.el===el);return !unit||unit.state==='done'}
  owns(index){return index>=2&&!!this.team[index-2]?.job}
  hideCursors(){for(const worker of this.team)worker.node.hidden=true}
  layoutRect(unit){const r=unit.el.getBoundingClientRect();return {left:r.left-unit.dx,top:r.top-unit.dy,width:r.width,height:r.height,right:r.right-unit.dx,bottom:r.bottom-unit.dy}}
  measure({width,height}) {
    const nav=width<=700?65:74;
    for(const unit of this.units){
      const r=this.layoutRect(unit);unit.rect=r;
      // Leaving the viewport never invalidates completed construction.
      if(this.scrollingUp&&unit.state!=='done'&&unit.owner?.job?.task!=='adjust'&&r.bottom>nav&&r.top<height)this.reveal(unit,true);
      if(!unit.owner&&unit.state!=='done'&&r.top<nav+12&&r.bottom>0)this.reveal(unit);
      unit.eligible=unit.state!=='done'&&!unit.owner&&r.top>=nav+12&&r.top<height*.96;
    }
  }
  choose(worker,limit) {
    const candidates=this.units.filter(unit=>unit.eligible&&!unit.owner&&unit.state!=='done');
    candidates.sort((a,b)=>a.rect.top-b.rect.top||a.index-b.index);
    const writingBacklog=candidates.filter(unit=>unit.stage==='write');
    if(writingBacklog.length>=3&&worker.role==='create')return writingBacklog[0];
    return candidates.find(unit=>unit.stage===worker.role)||candidates.find(unit=>unit.stage!=='create')||candidates[0];
  }
  chooseAdjustment(worker,limit,{height}){
    if(this.adjustmentsLeft<=0||(worker.role!=='place'&&limit>=3)||this.team.some(other=>other.job?.task==='adjust'))return null;
    return this.units.filter(unit=>unit.state==='done'&&!unit.owner&&unit.adjustedPass!==this.upwardPass&&unit.el.matches('.project-window,.lab-card,.hero-art')&&Number(unit.el.style.getPropertyValue('--window-scale')||1)>=.999&&unit.rect?.top>100&&unit.rect.bottom<height-75&&!unit.el.contains(document.activeElement)).sort((a,b)=>Math.abs(a.rect.top+a.rect.height/2-height/2)-Math.abs(b.rect.top+b.rect.height/2-height/2))[0];
  }
  assign(worker,unit,{width}) {
    const task=this.scrollingUp?'adjust':unit.stage;
    if(task==='adjust'){unit.adjustedPass=this.upwardPass;this.adjustmentsLeft--}
    if(task==='create'){
      this.prepareText(unit);
      // Blocks are born close to their destination, in slightly disordered positions.
      // Some are created in place; the rest are repositioned after their text is written.
      const sign=(unit.index%2?1:-1),mobile=width<=700;
      const dx=unit.index%4===0?0:sign*(mobile?18+unit.index%13:36+unit.index%41);
      const dy=unit.index%3===0?-15:18+unit.index%17;
      this.pose(unit,dx,dy);this.geometry(unit,.015,.015);this.details(unit,0);
    }
    const writingDuration=Math.min(2.1,Math.max(.55,unit.letters.length/(unit.category==='TITRE'?29:105)));
    worker.job={unit,task,phase:'approach',elapsed:0,from:{x:worker.cursor.x,y:worker.cursor.y},source:{x:unit.dx,y:unit.dy},duration:task==='adjust'?.36:task==='write'?writingDuration:task==='create'?.48+(unit.index%3)*.12:.56};
    unit.owner=worker;unit.state='approach';unit.el.dataset.construction='approach';worker.node.hidden=false;
  }
  finish(worker) {
    const {unit,task}=worker.job;
    if(task==='create'){
      this.geometry(unit);this.details(unit);unit.stage=unit.letters.length?'write':'place';unit.state='created';
    }else if(task==='write'){
      this.typeText(unit,unit.letters.length);this.restoreText(unit);unit.stage='place';unit.state='written';
    }else{
      this.pose(unit,0,0);unit.stage='done';unit.state='done';
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
    const delta=window.scrollY-this.scrollY;
    if(delta<-2){
      if(!this.scrollingUp){this.upwardPass++;this.adjustmentsLeft=2;for(const worker of this.team)if(worker.job)this.reveal(worker.job.unit,true)}
      this.scrollingUp=true;this.overlay.dataset.direction='up';
    }else if(delta>2){this.scrollingUp=false;this.overlay.dataset.direction='down'}
    this.scrollY=window.scrollY;
    this.clock+=dt;this.delay=Math.max(0,this.delay-dt);if(this.delay)return;
    if(this.clock-this.measuredAt>.075){this.measure({width,height});this.measuredAt=this.clock}
    const limit=Math.min(width<=700?3:6,Math.max(1,count-2));
    const ease=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t)};
    for(let i=0;i<this.team.length;i++){
      const worker=this.team[i];
      if(i>=limit){if(worker.job)this.finish(worker);continue}
      if(!worker.job){const unit=this.scrollingUp?this.chooseAdjustment(worker,limit,{height}):this.choose(worker,limit);if(unit)this.assign(worker,unit,{width})}
      if(!worker.job)continue;
      const job=worker.job,unit=job.unit,r=this.layoutRect(unit);
      if(r.bottom<65||r.top>height+50){this.reveal(unit);continue}
      job.elapsed+=dt;
      if(job.phase==='approach'&&job.elapsed>=.2){job.phase=job.task;job.elapsed=0}
      else if(job.phase===job.task&&job.elapsed>=job.duration){job.phase='settle';job.elapsed=0;
        if(job.task==='create'){this.geometry(unit);this.details(unit)}
        if(job.task==='write')this.typeText(unit,unit.letters.length);
        if(job.task==='place'||job.task==='adjust')this.pose(unit,0,0);
      }else if(job.phase==='settle'&&job.elapsed>=.14){this.finish(worker);continue}
      let drawX=1,drawY=1;
      if(job.task==='create'){
        const p=job.phase==='approach'?0:job.phase==='settle'?1:ease(job.elapsed/job.duration);
        drawX=.015+.985*p;drawY=.015+.985*Math.pow(p,.85);
        this.geometry(unit,drawX,drawY);this.details(unit,Math.max(0,(p-.45)/.55));
      }
      if(job.task==='write'&&job.phase==='write'){
        // Discrete characters with short pauses give the caret an actual writing rhythm.
        const p=Math.min(1,job.elapsed/job.duration),paced=Math.max(0,Math.min(1,p-.022*Math.sin(p*Math.PI*6)));
        this.typeText(unit,Math.floor(unit.letters.length*paced));
      }
      if(job.task==='place'&&job.phase==='place'){
        const p=ease(job.elapsed/job.duration),nudge=Math.sin(p*Math.PI)*(unit.index%2?1:-1)*5;
        this.pose(unit,job.source.x*(1-p)+nudge,job.source.y*(1-p));
      }
      if(job.task==='adjust'&&job.phase==='adjust'){
        const p=Math.min(1,job.elapsed/job.duration),nudge=Math.sin(p*Math.PI);
        this.pose(unit,(unit.index%2?1:-1)*nudge*1.8,nudge*.6);
      }
      const actual=unit.el.getBoundingClientRect();
      let point={x:actual.left+14,y:actual.top+10};
      if(job.task==='create')point={x:actual.left+actual.width*drawX,y:actual.top+actual.height*drawY};
      const caret=job.task==='write'?this.caretRect(unit):null;
      if(caret)point={x:caret.left+6,y:caret.top+caret.height*.72};
      const c=worker.cursor;
      if(job.phase==='approach'){
        const p=ease(job.elapsed/.2);c.x=job.from.x+(point.x-job.from.x)*p;c.y=job.from.y+(point.y-job.from.y)*p;
      }else{c.x=point.x;c.y=point.y}
      worker.pointer.style.transform=`translate3d(${c.x}px,${c.y}px,0)`;
      const f=worker.frame;f.style.left=actual.left+'px';f.style.top=actual.top+'px';f.style.width=actual.width*drawX+'px';f.style.height=actual.height*drawY+'px';
      worker.caret.hidden=!(caret&&job.phase==='write');
      if(caret){worker.caret.style.left=caret.left+'px';worker.caret.style.top=caret.top+'px';worker.caret.style.height=caret.height+'px'}
      const verb=job.task==='adjust'?'AJUSTER':job.task==='create'?'CRÉER':job.task==='write'?'ÉCRIRE':'DÉPLACER';
      worker.caption.textContent=verb+' / '+unit.category+(job.task==='write'?' · '+unit.written+'/'+unit.letters.length:'');
      worker.node.dataset.phase=job.phase;worker.node.dataset.task=job.task;worker.node.classList.toggle('hide-selection',!showOutlines);
      unit.state=job.phase;unit.el.dataset.construction=job.phase;
    }
  }
}
