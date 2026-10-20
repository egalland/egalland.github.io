import {LEVELS,DIRS,makeMaze,initial,step,target,solve,isWon,fresh,decode} from './engine.js';
                                       
const $=(id       )=>document.getElementById(id) ;
const KEY='labyrinthe-mouvant-v1';
let state=fresh(),notice='Votre premier pas vous attend.',error=false,saveError=false,hintTo            =null;
try{const raw=localStorage.getItem(KEY);if(raw){state=decode(raw);notice='Votre partie a repris là où vous l’aviez laissée.';}}catch{notice='Sauvegarde illisible ou inaccessible. Une nouvelle partie est prête.';error=true;}
let maze=makeMaze(state.level);
const frame=()=>state.history[state.history.length-1];
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveError=false;}catch{saveError=true;}$('save-status').textContent=saveError?'Sauvegarde indisponible · partie non conservée':'Sauvegarde locale · sur cet appareil';}
function message(text       ,isError=false){notice=text;error=isError;}
const xy=(pos       )=>({x:(pos%maze.size+.5)*500/maze.size,y:(Math.floor(pos/maze.size)+.5)*500/maze.size});
function renderBoard(){
 const f=frame(),s=500/maze.size;let svg='<rect width="500" height="500" fill="#edeedf"/>';
 const trail=new Set(state.history.map(x=>x.pos));
 for(let p=0;p<maze.size**2;p++){const {x,y}=xy(p);svg+=`<rect x="${x-s/2+3}" y="${y-s/2+3}" width="${s-6}" height="${s-6}" rx="4" fill="${(p%maze.size+Math.floor(p/maze.size))%2?'#e8eadd':'#eff0e3'}"/>`;if(trail.has(p)&&p!==f.pos)svg+=`<circle cx="${x}" cy="${y}" r="2.5" fill="#bac8ad"/>`;}
 const e=xy(maze.end);svg+=`<rect x="${e.x-s*.31}" y="${e.y-s*.31}" width="${s*.62}" height="${s*.62}" rx="${s*.12}" fill="${f.mask===7?'#bdcfa5':'#d2d8bf'}"/><text x="${e.x}" y="${e.y+s*.16}" text-anchor="middle" font-size="${s*.44}" fill="#37523b">↗</text>`;
 maze.shards.forEach((p,i)=>{if(!(f.mask&(1<<i))){const {x,y}=xy(p);svg+=`<path d="M ${x} ${y-s*.19} L ${x+s*.14} ${y} L ${x} ${y+s*.19} L ${x-s*.14} ${y} Z" fill="#c59459" stroke="#a7733f" stroke-width="1.4"/><path d="M ${x} ${y-s*.13} L ${x} ${y+s*.13}" stroke="#f0dbac" stroke-width="1.5"/>`;}});
 for(let a=0;a<maze.size**2;a++)for(const b of [a%maze.size<maze.size-1?a+1:-1,a+maze.size<maze.size**2?a+maze.size:-1]){
  if(b<0)continue;const edge=maze.edges.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));if(edge?.gate===-1)continue;
  const {x,y}=xy(a),vertical=b===a+1;
  const x1=vertical?x+s/2:x-s/2,y1=vertical?y-s/2:y+s/2,x2=vertical?x+s/2:x+s/2,y2=vertical?y+s/2:y+s/2;
  if(!edge)svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#213f39" stroke-width="6" stroke-linecap="round"/>`;
  else{const open=edge.gate===f.phase,color=edge.gate===0?'#b86a42':'#8068ac';svg+=`<line class="gate-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${open?2:6}" ${open?'stroke-dasharray="3 7" opacity=".6"':''}/>`;}
 }
 if(hintTo!==null){const {x,y}=xy(hintTo);svg+=`<circle class="hint-ring" cx="${x}" cy="${y}" r="${s*.3}" fill="none" stroke="#b86a42" stroke-width="2.5" stroke-dasharray="4 4"/>`;}
 const {x,y}=xy(f.pos);svg+=`<circle cx="${x}" cy="${y+2}" r="${s*.23}" fill="#203b3520"/><circle id="player" cx="${x}" cy="${y}" r="${s*.22}" fill="#b86a42" stroke="#fff8e5" stroke-width="3"/><circle cx="${x-s*.045}" cy="${y-s*.045}" r="${s*.06}" fill="#dfa47e"/>`;
 for(let d=0;d<4;d++){const to=target(maze,f.pos,d);if(to>=0){const c=xy(to);svg+=`<rect data-cell="${to}" x="${c.x-s/2+3}" y="${c.y-s/2+3}" width="${s-6}" height="${s-6}" fill="transparent" style="cursor:pointer"/>`;}}
 $('board').innerHTML=svg;$('board').setAttribute('aria-label',`Labyrinthe ${state.level+1}. Ligne ${Math.floor(f.pos/maze.size)+1}, colonne ${f.pos%maze.size+1}. Phase ${f.phase?'B':'A'}. ${f.mask.toString(2).replaceAll('0','').length} fragments. Utilisez les flèches pour avancer.`);
}
function render(){
 const f=frame(),moves=state.history.length-1,won=isWon(maze,f),count=f.mask.toString(2).replaceAll('0','').length;
 $('level-number').textContent=`LABYRINTHE ${String(state.level+1).padStart(2,'0')} / 05`;
 $('level-name').textContent=LEVELS[state.level].name;$('difficulty').textContent=`${maze.size} × ${maze.size}`;
 $('moves').textContent=String(moves).padStart(2,'0');$('shards').innerHTML=`${count} <i>/ 3</i>`;
 $('fragment-dots').innerHTML=[0,1,2].map(i=>`<span class="${f.mask&(1<<i)?'collected':''}"></span>`).join('');$('fragment-dots').setAttribute('aria-label',`${count} fragments sur 3`);
 $('phase-number').textContent=`PHASE ${f.phase?'B':'A'}`;$('phase-title').innerHTML=`Les portes ${f.phase?'lilas':'cuivrées'}<br>sont ouvertes.`;
 $('copper-state').textContent=f.phase?'fermé':'ouvert';$('lilac-state').textContent=f.phase?'ouvert':'fermé';
 document.querySelector('.copper') .classList.toggle('open',f.phase===0);document.querySelector('.lilac') .classList.toggle('open',f.phase===1);
 $('status').textContent=notice;$('status').classList.toggle('error',error);
 ($('undo')                     ).disabled=state.history.length===1;
 ($('hint')                     ).disabled=won;
 document.querySelectorAll                   ('[data-dir]').forEach(b=>b.disabled=won);
 $('win').hidden=!won;
 if(won){$('win-text').textContent=`3 fragments réunis en ${moves} déplacements. ${state.hints?`${state.hints} indice(s) consulté(s).`:'Sans indice. Bien joué !'}`;$('next').textContent=state.level===4?'Revenir au premier labyrinthe →':'Labyrinthe suivant →';}
 $('completed').textContent=`${state.best.filter(x=>x!==null).length} / 5`;
 $('levels').innerHTML=LEVELS.map((l,i)=>`<button data-level="${i}" class="${i===state.level?'active ':''}${state.best[i]!==null?'done':''}" aria-label="Niveau ${i+1} : ${l.name}${state.best[i]!==null?', terminé':''}" ${i===state.level?'aria-current="step"':''}>${state.best[i]!==null?'✓':String(i+1).padStart(2,'0')}</button>`).join('');
 $('best').textContent=state.best[state.level]===null?'Aucun record pour le moment.':`Votre meilleur parcours : ${state.best[state.level]} déplacements.`;
 renderBoard();
}
function move(to       ){
 if(isWon(maze,frame()))return;
 const old=frame(),next=step(maze,old,to);
 if(!next){message('Passage bloqué. Les portes et votre compteur restent inchangés.',true);render();return;}
 if(state.history.length>=20000){message('Limite de 19 999 pas atteinte. Recommencez ce niveau pour continuer.',true);render();return;}
 state.history.push(next);hintTo=null;$('hint-detail').hidden=true;
 if(isWon(maze,next)){const n=state.history.length-1;state.best[state.level]=Math.min(state.best[state.level]??Infinity,n);message('Les trois fragments sont réunis. Sortie trouvée !');}
 else if(next.mask!==old.mask)message(next.mask===7?'Trois fragments ! Rejoignez maintenant la sortie ↗.':'Un fragment retrouvé. Continuez votre exploration.');
 else if(next.pos===maze.end)message('La sortie attend : trouvez encore les fragments manquants.');
 else if(!solve(maze,next))message('Cette bifurcation est une impasse. Annulez votre dernier pas.',true);
 else message(`Un pas de plus. Phase ${next.phase?'B':'A'} : les portes ${next.phase?'lilas':'cuivrées'} sont ouvertes.`);
 save();render();
}
function switchLevel(level       ){state.level=level;state.history=[initial()];state.hints=0;maze=makeMaze(level);hintTo=null;$('hint-detail').hidden=true;message('Un nouveau labyrinthe. À vous de trouver le chemin.');save();render();}
function restart(){const d=$('restart-dialog')                     ;d.showModal();}
$('confirm-restart').addEventListener('click',()=>{($('restart-dialog')                     ).close();switchLevel(state.level);});
$('cancel-restart').addEventListener('click',()=>($('restart-dialog')                     ).close());
document.querySelectorAll                   ('[data-dir]').forEach(b=>b.addEventListener('click',()=>move(target(maze,frame().pos,Number(b.dataset.dir)))));
$('board').addEventListener('click',e=>{const cell=(e.target           ).closest('[data-cell]');if(cell)move(Number(cell.getAttribute('data-cell')));});
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.altKey||e.ctrlKey||e.metaKey)return;const i=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].indexOf(e.key);if(i>=0){e.preventDefault();if(!e.repeat)move(target(maze,frame().pos,i));}});
$('undo').addEventListener('click',()=>{if(state.history.length<2)return;state.history.pop();hintTo=null;$('hint-detail').hidden=true;message('Dernier pas annulé. Les portes ont retrouvé leur état précédent.');save();render();});
$('restart').addEventListener('click',restart);$('replay').addEventListener('click',()=>switchLevel(state.level));$('next').addEventListener('click',()=>switchLevel((state.level+1)%5));
$('levels').addEventListener('click',e=>{const b=(e.target           ).closest('[data-level]');if(b){const level=Number(b.getAttribute('data-level'));if(level!==state.level){pendingLevel=level;if(state.history.length>1&&!isWon(maze,frame()))($('level-dialog')                     ).showModal();else switchLevel(level);}}});
let pendingLevel=0;
$('confirm-level').addEventListener('click',()=>{($('level-dialog')                     ).close();switchLevel(pendingLevel);});
$('cancel-level').addEventListener('click',()=>($('level-dialog')                     ).close());
$('hint').addEventListener('click',()=>{
 const f=frame(),path=solve(maze,f);if(!path){message('Aucun chemin possible depuis cette position. Annulez un ou plusieurs pas.',true);render();return;}
 if(!path.length)return;hintTo=path[0];state.hints++;
 const options=DIRS.map((d,i)=>{const to=target(maze,f.pos,i),n=step(maze,f,to);if(!n)return null;const p=solve(maze,n);return p?{dir:d.name,arrow:d.arrow,cost:1+p.length}:null;}).filter(Boolean)                                           ;
 const ties=options.filter(o=>o.cost===path.length);const direction=DIRS.find((d,i)=>target(maze,f.pos,i)===hintTo) ;
 $('hint-detail').innerHTML=`<b>Prochain pas : ${direction.arrow} ${direction.name}.</b><br>Critère : déplacements restants (poids 100 %). Coût = 1 pour le prochain pas + minimum restant, portes futures et fragments inclus.<br>${options.map(o=>`${o.arrow} ${o.dir} : 1 + ${o.cost-1} = ${o.cost} pas`).join('<br>')}<br>${ties.length>1?`Égalité : ${ties.map(o=>o.dir).join(' et ')} mènent au même minimum. Ordre de départage fixe : haut, droite, bas, gauche.`:'Le chemin indiqué minimise le nombre de pas.'}`;
 $('hint-detail').hidden=false;message(`L’indice entoure la prochaine case. Minimum restant : ${path.length} pas.`);save();render();
});
const help=$('help-dialog')                     ;$('help').addEventListener('click',()=>help.showModal());$('close-help').addEventListener('click',()=>help.close());$('start').addEventListener('click',()=>help.close());
render();save();
