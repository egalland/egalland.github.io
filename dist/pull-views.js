import {STITCHES} from './catalog.js';
import {esc,icon,button,select,choice,dot,letter,yarnChips} from './ui.js';
import {pullSheet,colorRuns,stageAt,stepsCount,doneFor,progressFor,countStitches,readsFromRight} from './pull-guide.js';
import {drawPieceChart} from './piece-chart.js';

const stepsLabel = piece => piece.mode==='round' ? 'tours' : 'rangs';
function yarnLabel(p,index) {
  const yarn=p.yarns[index], companion=p.yarns.find(y=>y.id===yarn.heldWith);
  return yarn.name+(companion ? companion.id===yarn.id?' en double':' avec '+companion.name : '');
}
const sentence = text => '<p>'+esc(text)+'</p>';
function alertPlan(guide) {
  const message=guide?.construction.error || 'Vérifiez les dimensions et les valeurs de votre échantillon.';
  return '<div class="patron-alert" role="status"><b>Mesures à ajuster</b>'+sentence(message)+button('Revoir les mesures','step','button frame',1)+button('Vérifier l’échantillon','step','button link',2)+'</div>';
}
export function usable(guide) { return !!guide?.pieces.length && !guide.construction.error; }

function pieceDescription(piece) {
  if (piece.mode==='finish') return (piece.tasks?.length||1)+' étapes';
  const first=piece.setupCount??countStitches(piece.rows[0]);
  return first+' m. au départ · '+piece.rows.length+' '+stepsLabel(piece);
}

export function overview(p,guide) {
  if (!usable(guide)) return alertPlan(guide);
  const totals=progressFor(p,guide), focus=guide.byId.get(p.pullWork.piece)||guide.pieces[0];
  const position=stageAt(focus,doneFor(p,focus));
  const description=totals.done ? focus.name+' · '+position.title : 'Du montage des mailles aux dernières coutures.';
  const notes=[guide.construction.notes,...(guide.construction.warnings||[])].filter(Boolean).map(sentence).join('');
  return '<div class="panel-head"><h2>Tricoter le pull</h2><p>'+esc(guide.construction.construction)+'</p></div>'+
    '<div class="patron-start"><div><h3>'+esc(totals.done ? totals.done===totals.total?'Pull terminé':'Votre avancement' : 'Patron complet')+'</h3>'+sentence(description)+'</div>'+
    button(totals.done ? 'Ouvrir le suivi':'Commencer le pull','pull-follow','button ink',focus.id,'needle')+'</div>'+
    '<div class="track" aria-label="Avancement du pull"><i style="width:'+totals.percent+'%"></i></div>'+
    '<div class="patron-pieces">'+guide.pieces.map(piece=>{
      const n=doneFor(p,piece),complete=n===stepsCount(piece);
      const sub=complete?'Terminé':n?'En cours · '+stageAt(piece,n).title:pieceDescription(piece);
      return '<button class="patron-piece" data-act="pull-follow" data-value="'+piece.id+'"><span class="piece-symbol">'+icon(complete?'check':piece.mode==='finish'?'needle':piece.id==='collar'?'yarn':'grid')+'</span><span><b>'+esc(piece.name)+'</b><small>'+esc(sub)+'</small></span><span aria-hidden="true">›</span></button>';
    }).join('')+'</div>'+
    '<div class="patron-print">'+button('Imprimer le patron complet','print','button frame','','print')+'</div>'+
    (notes?'<details class="disclosure"><summary>Avant de monter les mailles</summary>'+notes+'</details>':'');
}

export function designTabs(which) {
  return '<div class="pills patron-tabs" aria-label="Surface à dessiner">'+choice('Pull entier','pull-scope','pull',which==='pull')+
    choice('Motif à répéter','pull-scope','motif',which==='motif')+'</div>';
}

export function designPanel(p,guide,ui) {
  if (!usable(guide)) return alertPlan(guide);
  const pieces=guide.pieces.filter(part=>part.rows.length);
  const piece=guide.byId.get(ui.piece)||pieces[0];
  const yarnNames=Object.fromEntries(p.yarns.map((y,i)=>[String(i),letter(i)+' · '+y.name]));
  return '<div class="section-title"><h3>Grille de la pièce entière</h3></div>'+
    select('Pièce du pull','pull-design-piece',Object.fromEntries(pieces.map(x=>[x.id,x.name])),piece.id)+
    '<div class="piece-chart-head"><span>'+piece.width+' colonnes · '+piece.rows.length+' '+stepsLabel(piece)+'</span><div>'+
      '<button type="button" class="circle" data-act="pull-zoom" data-value="-1" aria-label="Réduire la grille">−</button><button type="button" class="circle" data-act="pull-zoom" data-value="1" aria-label="Agrandir la grille">+</button>'+'</div></div>'+
    '<div id="piece-viewport" class="piece-viewport '+(ui.tool==='pan'?'can-pan':'can-paint')+'"><canvas id="piece-chart" tabindex="0" aria-label="Diagramme complet de '+esc(piece.name)+'. Flèches pour choisir une maille. Espace pour la colorer."></canvas></div>'+
    '<div class="chart-tools">'+[['pan','Parcourir'],['pen','Colorier'],['erase','Effacer la retouche']].map(([k,s])=>choice(s,'pull-tool',k,ui.tool===k)).join('')+'</div>'+
    '<p class="hint" id="piece-position" role="status">Choisissez un fil, puis touchez les mailles à colorier. Parcourir permet de faire défiler la grille agrandie.</p>'+
    '<div class="yarn-chips">'+yarnChips(p,'pull-ink')+'</div>'+
    '<div class="editor-bottom"><label><input type="checkbox" id="piece-symbols" '+(ui.symbols?'checked':'')+'> Lettres des fils</label>'+
    '<button class="button link" data-act="undo" '+(!ui.undo?'disabled':'')+'>Annuler</button><button class="button link" data-act="redo" '+(!ui.redo?'disabled':'')+'>Rétablir</button></div>'+
    '<div class="section compact">'+select('Couleur de fond de cette pièce','pull-base',yarnNames,p.pullDesign.base[piece.id]||0)+'</div>'+
    '<div class="inline-actions">'+button('Télécharger cette grille','pull-png','button frame',piece.id,'download')+
    button('Voir le motif sur le pull','placement','button link','','move')+'</div>';
}

function pillsForRuns(p,runs) {
  return runs.map(run=>'<span>'+dot(p.yarns[run.color].color)+'<b>'+run.n+'</b> '+letter(run.color)+'</span>').join('');
}
function workingColors(p,piece,sheet,index) {
  const reading=colorRuns(sheet,index);
  return '<h3>Couleurs dans l’ordre de tricot</h3>'+reading.groups.map((runs,i)=>
    (reading.groups.length>1?'<b class="side-label">'+(i?'Deuxième côté':'Premier côté')+'</b>':'')+
    '<div class="row-runs">'+pillsForRuns(p,runs)+'</div>').join('')+
    '<p class="small">'+p.yarns.map((y,i)=>letter(i)+' · '+esc(yarnLabel(p,i))).join(' &nbsp; ')+'</p>';
}

export function readPanel(p,guide,piece,index) {
  const done=doneFor(p,piece), total=stepsCount(piece), stage=stageAt(piece,index), pieceIndex=guide.pieces.indexOf(piece);
  const ratio=Math.round(done*100/total);
  const selector=select('Partie du pull','reader-piece',Object.fromEntries(guide.pieces.map(x=>[x.id,x.name])),piece.id);
  const changed=p.pullWork.signature && p.pullWork.signature!==guide.signature && Object.values(p.pullWork.done).some(n=>n>0);
  const modified=changed?'<div class="patron-alert"><b>Le patron a été recalculé.</b><p>Vérifiez où reprendre avec les nouvelles mesures. Vos repères précédents sont conservés.</p>'+button('Garder ces repères','pull-ack','button frame')+'</div>':'';
  const actionLabel=stage.type==='setup'?(piece.id==='collar'?'Mailles relevées':'Mailles montées'):stage.type==='finish'?'Pièce terminée':stage.type==='task'?'Étape faite':piece.mode==='round'?'Tour terminé':'Rang terminé';
  const stepButton=stage.type==='end' ?
      (pieceIndex<guide.pieces.length-1 ? button('Passer à '+guide.pieces[pieceIndex+1].name.toLocaleLowerCase('fr-FR'),'pull-follow','button ink',guide.pieces[pieceIndex+1].id,'next'):button('Retour au patron','pull-exit','button ink','','check')) :
      button(index<done?'Étape suivante':index>done?'Valider jusqu’ici':actionLabel,'pull-advance','button ink','','check');
  const readOnly=index!==done;
  let lower='';
  if(stage.type==='row'){
    const sheet=pullSheet(p,guide,piece), count=countStitches(stage.row),rtl=readsFromRight(piece,stage.r);
    const direction=piece.mode==='round'?'En rond · de droite à gauche ←':rtl?'Endroit · de droite à gauche ←':'Envers · de gauche à droite →';
    lower='<div class="reader-count"><b>'+count+' mailles après ce '+(piece.mode==='round'?'tour':'rang')+'</b><span>'+esc(direction)+'</span></div>'+
      workingColors(p,piece,sheet,stage.r);
  }
  let nav='<div class="reader-buttons">'+
    (index>0?button('Précédent','pull-prev','button frame','','back'):'')+stepButton+'</div>';
  if(readOnly)nav+='<div class="reader-browse">'+button('Retour à ma progression','pull-resume','button link')+
    (index<done?button('Reprendre à cette étape','pull-rewind','button link'):'')+'</div>';
  const goto=piece.rows.length?'<form id="pull-jump" class="reader-jump"><label for="pull-row">Consulter un '+(piece.mode==='round'?'tour':'rang')+'</label><input id="pull-row" type="number" inputmode="numeric" min="1" max="'+piece.rows.length+'" step="1" required value="'+Math.max(1,Math.min(index,piece.rows.length))+'"><button class="button frame">Afficher</button></form>':'';
  const allFinished=progressFor(p,guide);
  const ending=allFinished.done===allFinished.total?'Toutes les pièces et toutes les finitions du pull sont cochées.':
    'Toutes les étapes de cette partie sont cochées.';
  const info=stage.type==='end'?ending:stage.text;
  return selector+modified+'<div class="reader-progress"><span>'+ratio+' % de cette partie</span><div class="track"><i style="width:'+ratio+'%"></i></div></div>'+
    '<div class="stage-card"><span>'+esc(piece.name)+'</span><h3>'+esc(stage.title)+'</h3>'+(stage.type==='task'&&index===0?sentence(piece.setup):'')+sentence(info||'')+
    (stage.type==='task'&&index+1===total?sentence(piece.finish):'')+
    (stage.type==='setup'?'<p><b>Fil de fond</b> · '+esc(yarnLabel(p,p.pullDesign.base[piece.id]||0))+'</p>':'')+'</div>'+lower+nav+
    (piece.rows.length?'<details class="disclosure reader-chart"><summary>Diagramme de la pièce entière</summary><canvas id="reader-chart" aria-label="Diagramme de '+esc(piece.name)+'"></canvas></details>':'')+
    goto;
}

function groupRows(rows,allowPairs=true) {
  const groups=[];let i=0;
  while(i<rows.length){
    const a=rows[i],b=rows[i+1];let end=i+1;
    while(end<rows.length&&rows[end]===a)end++;
    if(allowPairs&&end===i+1&&b!==undefined&&rows[i+2]===a&&rows[i+3]===b) {
      end=i+2;while(end<rows.length&&rows[end]===((end-i)%2?b:a))end++;
      groups.push({start:i+1,end,text:a+' Puis au rang suivant : '+b+' Alterner ces deux consignes.'});
    } else groups.push({start:i+1,end,text:a});
    i=end;
  }
  return groups;
}
function printRows(items,unit) {
  return items.map(({start,end,text})=>'<tr><th>'+unit+' '+(start===end?start:start+'–'+end)+'</th><td>'+esc(text)+'</td></tr>').join('');
}
function colorText(sheet,r,piece,base) {
  const groups=colorRuns(sheet,r).groups;
  if(groups.every(runs=>runs.every(x=>x.color===base)))return '';
  return groups.map(runs=>runs.map(x=>x.n+' '+letter(x.color)).join(', ')).join(' / nouveau fil pour le deuxième côté / ');
}

export function printablePull(p,guide) {
  if (!usable(guide)) return '<h2>Patron à ajuster</h2>'+sentence(guide.construction.error);
  const legend=p.yarns.map((y,i)=>letter(i)+' = '+esc(yarnLabel(p,i))).join(' · ');
  let html='<h2>Construction du pull</h2>'+sentence(guide.construction.construction)+sentence(guide.construction.notes)+
    '<p>'+legend+'</p>'+(guide.construction.warnings||[]).map(sentence).join('');
  for (const piece of guide.pieces) {
    html+='<section class="print-piece"><h2>'+esc(piece.name)+'</h2>';
    if(piece.mode==='finish'){
      html+=(piece.setup?sentence(piece.setup):'')+'<ol>'+(piece.tasks||[piece.finish]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+(piece.tasks&&piece.finish?sentence(piece.finish):'')+'</section>';
      continue;
    }
    const sheet=pullSheet(p,guide,piece), unit=piece.mode==='round'?'Tour':'Rg';
    const chart=document.createElement('canvas');
    drawPieceChart(chart,piece,{yarns:p.yarns,cellColor:sheet.color,ratio:p.gauge.stitches/p.gauge.rows,maxWidth:1060});
    html+=sentence(pieceDescription(piece))+'<p><b>Départ.</b> '+esc(piece.setup)+'</p>'+
      '<img class="print-piece-chart" alt="Diagramme de '+esc(piece.name)+'" src="'+chart.toDataURL('image/png')+'">'+
      '<p>'+legend+'</p><h3>Réalisation</h3><table><tbody>'+printRows(groupRows(piece.rows.map(r=>r.action)),unit)+'</tbody></table>'+
      '<p><b>Fin de la pièce.</b> '+esc(piece.finish)+'</p>';
    const base=p.pullDesign.base[piece.id]||0;
    const colors=groupRows(piece.rows.map((r,i)=>colorText(sheet,i,piece,base)),false).filter(r=>r.text);
    html+='<h3>Fils à tricoter</h3><p>Fond '+letter(base)+' · '+esc(yarnLabel(p,base))+'. '+
      (piece.mode==='round'?'Tous les tours se lisent de droite à gauche.':piece.firstSide==='wrong'?'Les rangs impairs se lisent de gauche à droite, les rangs pairs de droite à gauche.':'Les rangs impairs se lisent de droite à gauche, les rangs pairs de gauche à droite.')+
      ' Les suites ci-dessous sont données dans le sens de travail. Un nombre indique combien de mailles tricoter avec le fil qui le suit. Les rangs sans changement de couleur se tricotent avec le fond.</p>'+
      (colors.length?'<table><tbody>'+printRows(colors,unit)+'</tbody></table>':'')+'</section>';
  }
  return html;
}

