import {CATALOG,GROUPS,HAS_COLLAR,FIBERS,WEIGHTS,STITCHES,FORMS,SIZES,limitsFor,measureLabel,defaultMeasureHint} from './catalog.js';
import {PATTERNS} from './textiles.js';
import {esc,icon,button,choice,field,select,letter,dot,yarnChips,budgetTable,rangeText} from './ui.js';
import {numberFr} from './projects.js';

export const STEPS=[['Ouvrage','shirt'],['Mesures','ruler'],['Laines','yarn'],['Motif','grid'],['Pelotes','yarn']];
export const LAYOUTS={single:'Motif isolé',band:'Bande',repeat:'Tout l’ouvrage',yoke:'Empiècement'};
const intro=(title,copy='')=>'<div class="panel-head"><h2>'+title+'</h2>'+(copy?'<p>'+copy+'</p>':'')+'</div>';
export function patternThumb(pat,p){
  const colors=[...p.yarns.map(y=>y.color),'#ad7357','#385345'];
  const key=pat.id+colors.join(',');
  if(thumbnails.has(key))return thumbnails.get(key);
  const c=document.createElement('canvas');c.width=192;c.height=104;const ctx=c.getContext('2d');
  const ch=Math.min(8,104/pat.rows),cw=ch*1.24,cols=Math.ceil(c.width/cw),rows=Math.ceil(c.height/ch);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ctx.fillStyle=colors[pat.grid[y%pat.rows][x%pat.cols]]||'#ae7356';ctx.fillRect(x*cw,y*ch,cw+.3,ch+.3);ctx.strokeStyle='#00000016';ctx.lineWidth=Math.max(.4,cw*.12);ctx.beginPath();ctx.moveTo((x+.15)*cw,y*ch);ctx.lineTo((x+.5)*cw,(y+.85)*ch);ctx.lineTo((x+.85)*cw,y*ch);ctx.stroke();}
  const url=c.toDataURL('image/png');if(thumbnails.size>120)thumbnails.clear();thumbnails.set(key,url);return url;
}
const thumbnails=new Map();
export function patternCards(patterns,p){
  return '<div class="pattern-grid">'+patterns.map(t=>'<button class="pattern-card'+(p.motif.id===t.id?' selected':'')+'" data-act="pattern" data-value="'+t.id+'" aria-pressed="'+(p.motif.id===t.id)+'"><img alt="" src="'+patternThumb(t,p)+'"><span>'+esc(t.name)+'</span></button>').join('')+'</div>';
}
export function sectionKind(p,group){
  const items=Object.values(CATALOG).filter(k=>k.group===group);
  return intro('Choisir un ouvrage')+'<div class="pills groups">'+GROUPS.map(g=>choice(g,'group',g,g===group)).join('')+'</div>'+
    '<div class="catalog-grid">'+items.map(k=>'<button class="model-card'+(k.id===p.kind?' selected':'')+'" data-act="kind" data-value="'+k.id+'" aria-pressed="'+(k.id===p.kind)+'"><img src="./thumbs/'+k.id+'.webp" alt=""><span>'+esc(k.name)+'</span>'+(k.id===p.kind?'<i>'+icon('check')+'</i>':'')+'</button>').join('')+'</div>'+
    (p.kind==='libre'?'<div class="section"><h3>Forme de la pièce</h3><div class="pills">'+Object.entries(FORMS).map(([k,v])=>choice(v,'form',k,p.form===k)).join('')+'</div></div>':'');
}
export function sectionMeasures(p){
  const args=Object.entries(p.measures).filter(([k])=>!(p.kind==='libre'&&p.form==='disque'&&k==='length'));
  const common=new Set(['width','length','chest','sleeve','circumference','foot','waist','depth']);
  const input=([k,v])=>{const [min,max]=limitsFor(p.kind,k);return field(measureLabel(k,p.kind,p.form),'m-'+k,v,min,max,'cm');};
  const more=args.filter(([k])=>!common.has(k));
  const sized=['pull','gilet','debardeur','robe','poncho','jupe'].includes(p.kind);
  return intro('Vos mesures',esc(defaultMeasureHint(p.kind)))+(sized?'<div class="section compact"><h3>Partir d’une taille</h3><div class="pills">'+SIZES.map(s=>choice(s,'size',s,p.size===s)).join('')+'</div></div>':'')+
    '<form id="measure-form" class="section" novalidate><div class="section-title"><h3>Dimensions finies</h3><span id="size-hint">'+(p.size==='custom'?'Sur mesure':'Taille '+esc(p.size))+'</span></div><div class="fields">'+args.filter(([k])=>common.has(k)).map(input).join('')+'</div>'+
    (more.length?'<details class="disclosure"><summary>Autres mesures</summary><div class="fields">'+more.map(input).join('')+'</div></details>':'')+'<p class="form-error" id="measure-error" role="alert"></p></form>'+
    (HAS_COLLAR.has(p.kind)?'<div class="section"><h3>Encolure</h3><div class="pills">'+[['round','Col rond'],['v','Col V'],['high','Col montant']].map(([k,v])=>choice(v,'collar',k,p.collar===k)).join('')+'</div></div>':'');
}
export function sectionYarn(p){
  const rows=p.yarns.map((y,i)=>{
    const companion=p.yarns.find(a=>a.id===y.heldWith);
    return '<div class="yarn-row">'+dot(y.color)+'<div><b>'+letter(i)+' · '+esc(y.name)+'</b><small>'+esc(y.reference||FIBERS[y.fiber]||y.fiber)+' · '+WEIGHTS[y.weight].name+' · '+numberFr(y.meters)+' m / '+numberFr(y.grams)+' g</small>'+(companion?'<small>Tricoté avec '+esc(companion.name)+'</small>':'')+'</div>'+button('Modifier','edit-yarn','button link',i)+'</div>';
  }).join('');
  return intro('Choisir les laines','Le fil A forme le fond. Chaque autre fil peut servir de coloris ou être tricoté avec un deuxième brin.')+
    '<div class="yarn-list">'+rows+'</div>'+button('Ajouter une laine','add-yarn','button frame wide','','plus')+
    '<div class="section">'+select('Point de tricot','stitch',STITCHES,p.stitch)+'</div>'+
    '<div class="section"><h3>Échantillon de 10 × 10 cm</h3><p class="hint" id="gauge-hint">'+(p.gauge.manual?'Mesures saisies pour votre ouvrage.':'Valeurs indicatives pour le fil A. Remplacez-les par vos mesures si vous avez tricoté un échantillon.')+'</p><div class="fields">'+field('Mailles','gauge-stitches',p.gauge.stitches,2,80,'m.')+field('Rangs','gauge-rows',p.gauge.rows,2,100,'rgs')+'</div>'+
    (p.gauge.manual?'':button('Confirmer mon échantillon mesuré','confirm-gauge','button link'))+'</div>';
}
export function sectionPattern(p,ui){
  const picked=PATTERNS.find(s=>s.id===p.motif.id);
  const layouts=Object.entries(LAYOUTS).filter(([k])=>k!=='yoke'||HAS_COLLAR.has(p.kind));
  const current={id:'actuel-'+p.grid.map(row=>row.join('.')).join('/'),grid:p.grid,cols:p.cols,rows:p.rows};
  return intro('Dessiner et placer le motif')+'<div class="motif-selected"><img src="'+patternThumb(current,p)+'" alt=""><div><small>Motif actuel</small><b>'+esc(picked?.name||'Mon motif')+'</b></div>'+button('Inspirations','patterns','button frame')+'</div>'+
    '<div class="section"><h3>Disposition sur l’ouvrage</h3><div class="pills">'+layouts.map(([k,v])=>choice(v,'layout',k,p.motif.layout===k)).join('')+'</div><div class="inline-actions">'+button('Placer sur l’ouvrage','placement','button ink','','move')+select('Taille du motif','motif-scale',{'1':'Normale','2':'Double','3':'Triple'},p.motif.scale)+'</div></div>'+
    '<div class="section"><div class="section-title"><h3>Grille du motif</h3>'+button(p.cols+' × '+p.rows,'resize','button link')+'</div><div class="yarn-chips">'+yarnChips(p)+'</div><div class="editor-tools">'+[['pencil','Crayon','pencil'],['fill','Remplir','fill'],['erase','Gomme','erase']].map(([key,label,i])=>'<button class="tool'+(ui.tool===key?' chosen':'')+'" data-act="tool" data-value="'+key+'" aria-pressed="'+(ui.tool===key)+'">'+icon(i)+label+'</button>').join('')+'</div>'+
    '<div class="chart-box"><canvas id="chart" width="880" tabindex="0" aria-label="Grille à peindre. Utilisez les flèches puis la barre d’espace pour colorer une maille."></canvas></div><div class="editor-bottom"><label><input id="mirror" type="checkbox" '+(ui.mirror?'checked':'')+'> Miroir</label><label><input id="symbols" type="checkbox" '+(ui.symbols?'checked':'')+'> Lettres</label><button data-act="undo" class="button link" '+(!ui.undo?'disabled':'')+'>Annuler</button><button data-act="redo" class="button link" '+(!ui.redo?'disabled':'')+'>Rétablir</button></div></div>';
}
export function sectionPlan(p,budget,patron=''){
  const whole=p.kind==='pull';
  return (whole?patron+'<section class="pull-budget" id="pull-budget"><h3>Vos pelotes</h3>':intro('Préparer le tricot'))+'<div class="estimate-hero"><span>'+icon('yarn')+' Pelotes à prévoir</span><strong>'+rangeText(budget.low,budget.high)+'</strong><p>'+(budget.measured?'D’après votre échantillon pesé':'Première estimation sans pesée')+' · marge de '+numberFr(p.margin)+' % incluse</p>'+(p.yarns.some(y=>y.stock)?'<p>Avec votre stock, environ '+rangeText(budget.toBuy,budget.toBuy)+' à acheter.</p>':'')+'</div>'+
    budgetTable(budget)+'<div class="inline-actions">'+button('Affiner l’estimation','sample','button frame','','ruler')+button('Voir le calcul','calculation','button link')+'</div>'+
    (whole?'</section>':'<div class="section follow-call"><div><h3>Suivre le motif</h3><p>'+(p.completed?'La répétition est terminée.':'Reprendre au rang '+p.progress+' sur '+p.rows+'.')+'</p></div>'+button('Ouvrir le suivi','follow','button ink','','needle')+'</div>')+
    '<div class="section"><label class="field"><span>Notes pour les aiguilles et l’assemblage</span><textarea id="notes" maxlength="3000" rows="3" placeholder="Ex. Aiguilles 4 mm, côtes sur 5 cm…">'+esc(p.notes)+'</textarea></label></div>'+
    (whole?'':'<p class="hint">La fiche réunit vos mesures et votre grille de couleurs. Utilisez votre patron pour les augmentations, les diminutions et l’assemblage.</p>');
}
