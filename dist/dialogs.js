import {CATALOG,COLORS,FIBERS,WEIGHTS,YARN_EXAMPLES} from './catalog.js';
import {PATTERNS} from './textiles.js';
import {numberFr} from './projects.js';
import {esc,icon,button,choice,field,select,letter,dot,rangeText} from './ui.js';
import {patternCards} from './steps.js';
const actions=(submit='Enregistrer')=>'<p class="action-error" id="dialog-error" role="alert"></p><div class="dialog-actions">'+button('Annuler','close','button frame')+'<button class="button ink" type="submit">'+esc(submit)+'</button></div>';
const textInput=(label,id,value,max=60,required=false)=>'<label class="field"><span>'+esc(label)+'</span><input id="'+id+'" name="'+id+'" type="text" value="'+esc(value)+'" maxlength="'+max+'" '+(required?'required':'')+'></label>';
export function projectList(project,book){
  const list=book.list();
  return '<p class="hint">Vos ouvrages sont enregistrés dans ce navigateur. La sauvegarde du carnet permet de les transférer sur un autre appareil.</p><div class="inline-actions">'+button('Nouvel ouvrage','new','button ink','','plus')+button('Importer','import','button frame','','folder')+'</div>'+
   '<div class="section">'+list.map(p=>'<div class="book-row"><button data-act="switch" data-value="'+esc(p.id)+'" class="book-open"><img src="./thumbs/'+p.kind+'.webp" alt=""><span><b>'+esc(p.name)+'</b><small>'+esc(CATALOG[p.kind].name)+' · '+new Date(p.updatedAt).toLocaleDateString('fr-FR')+(p.id===project.id?' · Ouvert':'')+'</small></span></button>'+button('Dupliquer','duplicate','button link',p.id,'copy')+'</div>').join('')+'</div>'+
    '<div class="dialog-actions">'+button('Télécharger tout le carnet','backup','button frame','','download')+'</div>';
}
export function nameForm(p,mode){
  const creating=mode==='new'||mode==='new-pull';
  const val=creating?'':mode==='duplicate'?p.name+' (copie)':p.name;
  return '<form id="name-form" data-mode="'+mode+'" class="stack">'+textInput('Nom du projet','project-name-input',val,72,true)+
    (mode==='new'?select('Ouvrage de départ','new-kind',Object.fromEntries(Object.values(CATALOG).map(k=>[k.id,k.name])),'pull'):'')+
    actions(creating?'Créer le projet':mode==='duplicate'?'Créer la copie':'Enregistrer')+'</form>';
}
export function yarnForm(p,y,index){
  const companions={'':'Un seul brin'};
  for(const yarn of p.yarns)companions[yarn.id]=yarn.id===y.id?'Le même fil en double':yarn.name;
  if(index<0)companions[y.id]='Le même fil en double';
  const weights=Object.fromEntries(WEIGHTS.map((w,i)=>[i,i+' · '+w.name+' ('+w.short+')']));
  return '<form id="yarn-form" class="stack">'+
    (index<0?select('Partir d’un exemple modifiable','y-example',{'':'Choisir une base',...Object.fromEntries(YARN_EXAMPLES.map((v,i)=>[i,v.name]))},''):'')+
    '<div class="fields">'+textInput('Nom du coloris','y-name',y.name,40,true)+textInput('Marque ou référence','y-reference',y.reference,64)+'</div>'+
    '<div><h3>Couleur du fil</h3><div class="color-picker">'+COLORS.map(([label,color])=>'<button type="button" class="color-option'+(color.toLowerCase()===y.color.toLowerCase()?' selected':'')+'" data-act="swatch-color" data-value="'+color+'" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+dot(color)+'</button>').join('')+'</div><label class="native-color"><input type="color" name="y-color" id="y-color" value="'+esc(y.color)+'"> Choisir une couleur personnalisée</label></div>'+
    '<div class="fields">'+select('Fibre','y-fiber',FIBERS,y.fiber)+select('Grosseur de laine','y-weight',weights,y.weight)+'</div>'+
    '<div><h3>Sur l’étiquette d’une pelote</h3><div class="fields">'+field('Poids','y-grams',y.grams,.1,5000,'g')+field('Longueur de fil','y-meters',y.meters,.1,20000,'m')+'</div></div>'+
    '<details class="disclosure"'+(y.heldWith?' open':'')+'><summary>Deux brins ensemble et stock</summary><div class="stack">'+select('Tricoter ce coloris avec','y-companion',companions,y.heldWith||'')+field('Pelotes déjà disponibles','y-stock',y.stock,0,1000,'pelotes',1)+'<p class="small">Les deux brins parcourent la même longueur. Chacun est compté avec le métrage de sa pelote.</p></div></details>'+
    actions(index<0?'Ajouter cette laine':'Enregistrer la laine')+'</form>'+
    (index>0?'<div class="section">'+button('Retirer cette laine du projet','remove-yarn','button link')+'</div>':'');
}
export function patternGallery(p,group){
  const groups=['Tous',...new Set(PATTERNS.map(x=>x.group))];
  return '<div class="pills groups">'+groups.map(g=>choice(g,'motif-group',g,group===g)).join('')+'</div>'+
    patternCards(PATTERNS.filter(x=>group==='Tous'||x.group===group),p);
}
export function sampleForm(p){
  return '<form id="sample-form" class="stack"><p class="hint">Tricotez un échantillon avec le fil A, son éventuel deuxième brin, les aiguilles et le point prévus. Lavez-le comme l’ouvrage, laissez-le sécher puis pesez-le.</p>'+
    '<label class="check-label"><input type="checkbox" id="weighed" '+(p.sample.enabled?'checked':'')+'> J’ai pesé mon échantillon sec</label>'+
    '<div id="sample-inputs" class="stack" '+(p.sample.enabled?'':'hidden')+'><p class="small">Mesurez la largeur et la hauteur de toute la pièce que vous pesez.</p><div class="fields">'+field('Largeur pesée','s-width',p.sample.width,2,100,'cm')+field('Hauteur pesée','s-height',p.sample.height,2,100,'cm')+field('Poids sec','s-grams',p.sample.grams||'',.01,1000,'g','.01')+'</div></div>'+
    '<div class="fields">'+field('Marge de réserve','s-margin',p.margin,0,50,'%',1)+field('Surplus pour les fils flottants du jacquard','s-floats',p.floatAllowance,0,50,'%',1)+'</div>'+actions('Recalculer les pelotes')+'</form>';
}
export function calculation(p,b){
  return '<div class="stack"><p>'+(p.kind==='pull'&&b.fromChart?'Maille compte les mailles des cinq pièces du patron, puis utilise votre échantillon pour les convertir en surface.':'Maille estime la surface de tissu à partir de vos dimensions.')+' La surface vaut environ <strong>'+numberFr(b.area/10000,2)+' m²</strong> pour cet ouvrage'+(b.pair?', les deux pièces comprises':'')+'.</p>'+
    '<p>'+(b.measured?'Votre échantillon sec de '+numberFr(p.sample.width)+' × '+numberFr(p.sample.height)+' cm pèse '+numberFr(p.sample.grams,2)+' g. Son poids et le rapport grammes/mètre du fil A, avec son éventuel compagnon, donnent la longueur de fil par cm².':'Sans pesée, le calcul de départ pour du jersey est √(20 × mailles × rangs) / 1 000 mètres par cm², avec les mailles et rangs relevés sur 10 cm. Un coefficient indicatif de '+numberFr(b.pointFactor,2)+' tient compte du point choisi.')+'</p>'+
    '<p>Les proportions de couleurs proviennent des pièces affichées, de leur surface et de la position du motif. Le calcul ajoute '+numberFr(p.floatAllowance)+' % dans les zones de jacquard pour les fils flottants, puis '+numberFr(p.margin)+' % de réserve. Un deuxième brin reçoit toute la longueur de la zone où il est tenu avec le premier.</p>'+
    '<p>Maille divise les mètres de chaque coloris par le métrage de sa pelote, puis arrondit au-dessus. La fourchette de planification est de '+(b.measured?'−10 % à +12 % avec une pesée':'−20 % à +30 % sans pesée')+'. Les bordures, la tension et les changements de point peuvent modifier la consommation réelle.</p>'+
    '<p><strong>Valeur centrale avec votre réserve : '+rangeText(b.balls,b.balls)+'</strong>'+(p.yarns.some(y=>y.stock)?'<br>'+b.toBuy+' à acheter après déduction du stock.':'')+'</p>'+
    '<div class="section"><h3>Repères de tricot</h3><p><a href="https://www.craftyarncouncil.com/standards/yarn-weight-system" target="_blank" rel="noopener noreferrer">Catégories de fils · Craft Yarn Council</a></p><p><a href="https://brooklyntweed.com/pages/swatching-101" target="_blank" rel="noopener noreferrer">Mesurer un échantillon · Brooklyn Tweed</a></p><p><a href="https://www.garnstudio.com/lesson.php?cid=8&amp;id=14" target="_blank" rel="noopener noreferrer">Comparer les métrages et les brins · DROPS</a></p></div></div>';
}
const exportItem=(title,caption,act,symbol)=>'<button class="output-option" data-act="'+act+'">'+icon(symbol)+'<span><strong>'+title+'</strong><small>'+caption+'</small></span></button>';
export function exportOptions(whole=false){
  const print=exportItem(whole?'Imprimer le patron complet du pull':'Imprimer la fiche de l’ouvrage',whole?'Montage, rangs, diagrammes de chaque pièce et assemblage · PDF via l’impression':'Mesures, laines, pelotes et grille · PDF via l’impression','print','print');
  const charts=whole?exportItem('Télécharger les cinq grilles du pull','Dos, devant, manches et col · image PNG','pull-all-grids','grid'):'';
  return print+charts+exportItem(whole?'Télécharger le motif à répéter':'Télécharger la grille','Image PNG avec lettres, rangs et légende','png','grid')+
    exportItem('Télécharger le projet modifiable','À rouvrir dans Maille sur un autre appareil','json','folder')+
    exportItem('Télécharger le carnet complet','Tous les projets dans un fichier JSON','backup','book');
}
export function resizeForm(p){return '<form id="resize-form" class="stack"><div class="fields">'+field('Mailles','grid-width',p.cols,2,64,'m.',1)+field('Rangs','grid-height',p.rows,2,64,'rgs',1)+'</div><p class="hint">La partie commune du dessin est conservée. Le bouton Annuler permet de retrouver la grille précédente.</p>'+actions('Appliquer les dimensions')+'</form>';}
