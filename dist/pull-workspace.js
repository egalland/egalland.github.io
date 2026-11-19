import {pullGuide,pullSheet,doneFor,stepsCount} from './pull-guide.js';
import {overview,designPanel,designTabs,readPanel,usable} from './pull-views.js';
import {drawPieceChart} from './piece-chart.js';
import {paintPullCell} from './pull-state.js';
import {esc,letter} from './ui.js';

const $=s=>document.querySelector(s);
const clamp=(n,l,h)=>Math.max(l,Math.min(h,n));

export function createPullWorkspace(api) {
  let currentId,metrics,paint=null,drawFrame=0,readerIndex=0,readerId='back',chartOpen=false;
  const ui={scope:'pull',piece:'front',tool:'pan',zoom:1,symbols:false,cursor:null};
  function project() {
    const p=api.project();
    if(currentId!==p.id) {
      currentId=p.id;Object.assign(ui,{scope:'pull',piece:'front',tool:'pan',zoom:1,symbols:false,cursor:null});
      paint=null;chartOpen=false;
    }
    return p;
  }
  function activeGuide() { return pullGuide(project()); }
  function selectedPiece(guide) { return guide?.byId.get(ui.piece); }
  function design(motifPanel,undo,redo) {
    const p=project(), guide=pullGuide(p);
    const tabs=designTabs(ui.scope);
    if(ui.scope==='motif')return tabs+motifPanel();
    return '<div class="panel-head"><h2>Dessiner le pull</h2></div>'+tabs+designPanel(p,guide,{...ui,undo,redo});
  }

  function drawEditor() {
    const c=$('#piece-chart');
    if(!c) return;
    const p=project(),g=pullGuide(p),piece=selectedPiece(g);
    if(!usable(g)||!piece) return;
    const view=$('#piece-viewport'),sheet=pullSheet(p,g,piece);
    metrics=drawPieceChart(c,piece,{yarns:p.yarns,cellColor:sheet.color,ratio:p.gauge.stitches/p.gauge.rows,
      cursor:ui.cursor,symbols:ui.symbols,zoom:ui.zoom,maxWidth:view.clientWidth||480,
      fitHeight:Math.floor(parseFloat(getComputedStyle(view).maxHeight))-3});
    c.style.width=metrics.displayWidth+'px';c.style.height=metrics.displayHeight+'px';
    for (const zoomButton of document.querySelectorAll('[data-act="pull-zoom"]')) {
      zoomButton.disabled=zoomButton.dataset.value==='-1' ? ui.zoom===1 : ui.zoom===12;
    }
    const location=$('#piece-position');
    if(location&&ui.cursor) {
      const {r,c:col}=ui.cursor;
      const color=sheet.color(r,col);
      location.textContent=piece.name+' · rang '+(r+1)+' · colonne '+(piece.width-col)+' · '+letter(color)+' '+p.yarns[color].name+'.';
    }
  }
  function redrawSoon() {
    if(drawFrame)return;
    drawFrame=requestAnimationFrame(()=>{drawFrame=0;drawEditor();});
  }
  window.addEventListener('resize',redrawSoon);
  function cellAt(e,canvas,piece) {
    if(!metrics)return null;
    const b=canvas.getBoundingClientRect();
    const col=Math.floor(((e.clientX-b.left)*canvas.width/b.width-metrics.x0)/metrics.cw);
    const row=piece.rows.length-1-Math.floor(((e.clientY-b.top)*canvas.height/b.height-metrics.y0)/metrics.ch);
    return {r:row,c:col};
  }
  function drawStroke(a,b,piece) {
    if(!b)return;
    const p=project(), ink=ui.tool==='erase'?null:p.selected;
    const distance=Math.max(Math.abs(b.r-a.r),Math.abs(b.c-a.c),1);
    let changed=false;
    for(let i=1;i<=distance;i++){
      const r=Math.round(a.r+(b.r-a.r)*i/distance),c=Math.round(a.c+(b.c-a.c)*i/distance);
      if(!piece.rows[r]?.spans.some(([l,h])=>c>=l&&c<=h))continue;
      ui.cursor={r,c};
      if(paintPullCell(p,piece,r,c,ink))changed=true;
    }
    if(changed){api.save();redrawSoon();}
  }
  function pointerDown(e) {
    if(e.target.id!=='piece-chart'||ui.tool==='pan'||e.button!==0||paint)return;
    const piece=selectedPiece(activeGuide()),cell=cellAt(e,e.target,piece);
    if(!cell||!piece.rows[cell.r]?.spans.some(([l,h])=>cell.c>=l&&cell.c<=h))return;
    e.preventDefault();api.remember();e.target.focus({preventScroll:true});e.target.setPointerCapture(e.pointerId);
    paint={id:e.pointerId,last:cell,piece};drawStroke(cell,cell,piece);
  }
  function pointerMove(e) {
    if(!paint||e.pointerId!==paint.id||e.target.id!=='piece-chart')return;
    const cell=cellAt(e,e.target,paint.piece);
    if(!cell||cell.c===paint.last.c&&cell.r===paint.last.r)return;
    drawStroke(paint.last,cell,paint.piece);paint.last=cell;
  }
  function pointerEnd(e) {
    if(!paint||e.pointerId!==paint.id)return;
    paint=null;api.visual();drawEditor();
    const undo=$('[data-act="undo"]');if(undo)undo.disabled=false;
  }
  $('#settings').addEventListener('pointerdown',pointerDown);
  $('#settings').addEventListener('pointermove',pointerMove);
  for(const name of ['pointerup','pointercancel','lostpointercapture'])$('#settings').addEventListener(name,pointerEnd);

  $('#settings').addEventListener('keydown',e=>{
    if(e.target.id!=='piece-chart'||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key))return;
    e.preventDefault();const piece=selectedPiece(activeGuide());
    const start=ui.cursor||{r:0,c:Math.floor((piece.rows[0].spans[0][0]+piece.rows[0].spans[0][1])/2)};
    if(e.key==='Enter'||e.key===' '){
      api.remember();drawStroke(start,start,piece);api.visual();const b=$('[data-act="undo"]');if(b)b.disabled=false;return;
    }
    const row=clamp(start.r+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0),0,piece.rows.length-1);
    const c=clamp(start.c+(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0),0,piece.width-1);
    const spans=piece.rows[row].spans;
    if(!spans.length)return;
    const candidates=spans.map(([l,h])=>clamp(c,l,h));
    const nearest=candidates.sort((a,b)=>Math.abs(a-c)-Math.abs(b-c))[0];
    const next=nearest===start.c&&c!==start.c?(e.key==='ArrowRight'?spans.find(([l])=>l>c)?.[0]:[...spans].reverse().find(([,h])=>h<c)?.[1]):null;
    ui.cursor={r:row,c:next??nearest};drawEditor();
  });

  function renderReader() {
    const p=project(),g=pullGuide(p),piece=g.byId.get(readerId);
    const dialog=$('#follow');
    if(!piece)return;
    readerIndex=clamp(readerIndex,0,stepsCount(piece));
    $('#follow-title').textContent='Tricoter le pull';
    $('#follow-content').innerHTML=readPanel(p,g,piece,readerIndex);
    const more=$('.reader-chart');if(more){
      more.open=chartOpen;
      const paintChart=()=>{
        if(!more.open)return;
        drawPieceChart($('#reader-chart'),piece,{yarns:p.yarns,cellColor:pullSheet(p,g,piece).color,
          row:readerIndex>=1&&readerIndex<=piece.rows.length?readerIndex:0,symbols:false,ratio:p.gauge.stitches/p.gauge.rows,maxWidth:800});
      };
      more.addEventListener('toggle',()=>{chartOpen=more.open;paintChart();});
      if(chartOpen)paintChart();
    }
    if(!dialog.open)dialog.showModal();
  }
  function follow(id) {
    const p=project(),g=pullGuide(p);
    if(!usable(g))return;
    const piece=g.byId.get(id)||g.byId.get(p.pullWork.piece)||g.pieces[0];
    if(p.pullWork.piece!==piece.id){p.pullWork.piece=piece.id;api.save();}
    readerId=piece.id;readerIndex=doneFor(p,piece);renderReader();$('#follow').scrollTop=0;
  }
  function setDone(n) {
    const p=project(),g=pullGuide(p),piece=g.byId.get(readerId);
    const next=clamp(n,0,stepsCount(piece));
    p.pullWork.done[piece.id]=next;p.pullWork.piece=piece.id;p.pullWork.signature=g.signature;
    readerIndex=next;api.save();renderReader();
  }
  function change(el) {
    if(el.id==='reader-piece'){follow(el.value);return true;}
    if(el.id==='pull-design-piece'){ui.piece=el.value;ui.cursor=null;ui.zoom=1;api.panel();return true;}
    if(el.id==='piece-symbols'){ui.symbols=el.checked;drawEditor();return true;}
    if(el.id==='pull-base'){api.change(()=>{project().pullDesign.base[ui.piece]=Number(el.value);});return true;}
    return false;
  }
  function jump(form) {
    if(form.id!=='pull-jump')return false;
    if(!form.reportValidity())return true;
    const g=activeGuide(),piece=g.byId.get(readerId);
    readerIndex=clamp($('#pull-row').valueAsNumber,1,piece.rows.length);renderReader();$('#follow').scrollTop=0;return true;
  }

  function chartExport(id) {
    const p=project(),g=pullGuide(p);
    if(!usable(g))return;
    const parts=id==='all'?g.pieces.filter(pc=>pc.rows.length):[g.byId.get(id)].filter(Boolean);
    if(!parts.length)return;
    const multi=parts.length>1, width=multi?890:1320, columns=multi?2:1;
    const cards=parts.map(piece=>{
      const canvas=document.createElement('canvas');
      drawPieceChart(canvas,piece,{yarns:p.yarns,cellColor:pullSheet(p,g,piece).color,
        symbols:!multi,ratio:p.gauge.stitches/p.gauge.rows,maxWidth:width});
      const scale=Math.min((width-36)/canvas.width,1350/canvas.height);
      return {canvas,piece,w:canvas.width*scale,h:canvas.height*scale};
    });
    const heights=[];
    cards.forEach((card,i)=>{const row=Math.floor(i/columns);heights[row]=Math.max(heights[row]||0,card.h+73);});
    const image=document.createElement('canvas'),legendRows=Math.ceil(p.yarns.length/(multi?4:3));
    image.width=columns*width;image.height=Math.ceil(128+heights.reduce((s,v)=>s+v,0)+legendRows*39+35);
    const ctx=image.getContext('2d');ctx.fillStyle='#fffdf5';ctx.fillRect(0,0,image.width,image.height);
    ctx.fillStyle='#294136';ctx.font='40px Georgia';ctx.fillText(p.name,28,55,image.width-56);
    ctx.font='21px Arial';ctx.fillText('Patron du pull · '+p.gauge.stitches+' mailles et '+p.gauge.rows+' rangs sur 10 cm',29,91);
    cards.forEach(({canvas,piece,w,h},i)=>{
      const row=Math.floor(i/columns),x=(i%columns)*width+18,y=120+heights.slice(0,row).reduce((s,v)=>s+v,0);
      ctx.font='29px Georgia';ctx.fillText(piece.name,x+7,y+28,width-44);
      ctx.drawImage(canvas,x+(width-36-w)/2,y+43,w,h);
    });
    const per=multi?4:3;
    p.yarns.forEach((y,i)=>{
      const x=26+(i%per)*image.width/per,top=image.height-(legendRows-Math.floor(i/per))*39-8;
      ctx.fillStyle=y.color;ctx.fillRect(x,top,23,23);ctx.fillStyle='#294136';ctx.font='20px Arial';
      ctx.fillText(letter(i)+' · '+y.name,x+32,top+19,image.width/per-64);
    });
    api.png(image,api.name()+(multi?'-pull-entier':'-'+id)+'.png');
  }

  function action(act,val) {
    if(!act.startsWith('pull-'))return false;
    switch(act) {
      case 'pull-open': api.go(4);break;
      case 'pull-follow': follow(val);break;
      case 'pull-advance': {
        const p=project(),g=activeGuide(),piece=g.byId.get(readerId);
        if(readerIndex<doneFor(p,piece)){readerIndex++;renderReader();}else setDone(readerIndex+1);
        break;
      }
      case 'pull-prev': readerIndex=Math.max(0,readerIndex-1);renderReader();break;
      case 'pull-resume': follow(readerId);break;
      case 'pull-rewind': setDone(readerIndex);break;
      case 'pull-ack': project().pullWork.signature=activeGuide().signature;api.save();renderReader();break;
      case 'pull-exit': $('#follow').close();api.go(4);break;
      case 'pull-scope': ui.scope=val;api.panel();break;
      case 'pull-tool': ui.tool=val;api.panel();break;
      case 'pull-ink': project().selected=Number(val);ui.tool='pen';api.save();api.panel();break;
      case 'pull-zoom': {
        const zooms=[1,2,4,6,9,12];ui.zoom=zooms[clamp(zooms.indexOf(ui.zoom)+Number(val),0,zooms.length-1)];drawEditor();break;
      }
      case 'pull-png': chartExport(val);break;
      case 'pull-all-grids': chartExport('all');break;
      default:return false;
    }
    return true;
  }
  return {design,drawEditor,follow,action,change,jump,
    overview:()=>overview(project(),activeGuide())};
}

