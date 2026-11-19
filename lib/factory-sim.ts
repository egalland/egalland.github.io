import {OUTPOST_RADIUS} from './colonies';
import {BIN,OUTPUT,CHAMBER,EXTERNAL,FLOW_WINDOW,currentFlow,flowNode,movement,storeBeat,type CargoMove} from './factory-flow';
import {ALL_GOODS, RAW_GOODS, RECIPES, GOODS, ensureEconomy, type Good, type RawGood, type RefinedGood} from './economy';
import {canBuild,canRecipe,settleIndustry,recipeSeconds,knowsIndustry,startIndustry,INDUSTRY_TREE,industrySpeed,beltCapacity} from './industry';
import {depotLimit} from './frontier-capacity';
import {FACE_ORDER} from './planet';
import {range, type Place} from './frontier-geography';
import {
  FACTORY_KINDS, FACTORY_LIMIT, cellKey, cellPlace, contains, emptyGoods, footprint,
  foundation, goodsCount, machine, defaultRecipe,inputPorts, piecePlace, port, validCell, factoryStatus,
  type BuildMark, type Cell, type FactoryKind, type FactoryPiece, type FactoryState, type GoodsStock,
} from './factory-grid';
import type {World, Miner, Resource} from './world';
import type {Rig} from './frontier';

export function factoryState(p:Miner,now:number):FactoryState {
  const f=p.expedition!.factory??={version:2,pieces:[],clock:now,unlocked:[],research:null,produced:{}};
  ensureEconomy(p);
  if(f.version!==2){
    f.unlocked=[];f.research=null;f.produced={};
    if(f.pieces.some(c=>c.kind==='assembler'))f.unlocked=['mecanique','cablage','electronique','motorisation'];
    for(const c of f.pieces){
      if(c.job){if(c.job.recipe==='module')p.coins+=28;const inputs=c.job.recipe==='acier'?{ferrite:8}:c.job.recipe==='lingot'?{cuivre:6}:{acier:2,lingot:1,ferrite:2};for(const [g,n] of Object.entries(inputs))c.items[g as Good]=(c.items[g as Good]??0)+n;c.job=null;}
      c.items={...emptyGoods(),...c.items};c.output={...emptyGoods(),...c.output};
      if(!RECIPES[c.recipe])c.recipe=defaultRecipe(c.kind);
    }
    f.version=2;f.notice='La chaîne industrielle utilise désormais uniquement le fer et le cuivre. Vos stocks, constructions et avancées sont conservés.';
  }
  return f;
}
const raw=(g:Good):g is RawGood=>RAW_GOODS.includes(g as RawGood);
function inventory(p:Miner,g:Good) {
  return raw(g)?p.inventory[g]:p.economy?.refined[g]??0;
}
function addInventory(p:Miner,g:Good,n:number) {
  if(raw(g))p.inventory[g]+=n;
  else {
    ensureEconomy(p).refined[g]+=n;
  }
}
const room=(p:Miner,g:Good)=>raw(g)?Math.max(0,depotLimit(p)-RAW_GOODS.reduce((n,r)=>n+p.inventory[r],0)):Number.MAX_SAFE_INTEGER;
function indexFor(pieces:FactoryPiece[]) {
  const index=new Map<string,FactoryPiece>();
  for(const p of pieces)for(const cell of footprint(p,FACTORY_KINDS[p.kind].size))index.set(cellKey(cell),p);
  return index;
}
function source(w:World,p:Miner,piece:FactoryPiece):'depot'|Rig|FactoryPiece|null {
  const back=port(piece,true,true);
  if(contains(back,foundation(p.expedition!.home,5),5))return 'depot';
  return w.frontier!.rigs.find(r=>r.owner===p.id&&contains(back,r.grid??foundation(r.point,3),3))??p.expedition!.factory!.pieces.find(c=>(c.kind==='chest'||c.kind==='warehouse')&&contains(back,c,FACTORY_KINDS[c.kind].size))??null;
}
export type FactoryDiagnostic={piece:string;code:string;severity:'info'|'warning';title:string;detail:string;advice:string;good?:Good;available?:number;reserve?:number};
export function factoryDiagnostics(w:World,p:Miner,now:number):FactoryDiagnostic[] {
  const f=p.expedition!.factory!,index=indexFor(f.pieces),diagnostics:FactoryDiagnostic[]=[];
  for(const piece of f.pieces){
    const add=(code:string,severity:FactoryDiagnostic['severity'],title:string,detail:string,advice:string,extra:Partial<FactoryDiagnostic>={})=>diagnostics.push({piece:piece.id,code,severity,title,detail,advice,...extra});
    if(piece.hull<=0){add('damaged','warning','Installation endommagée','Le mécanisme est arrêté.','Réparez cette installation.');continue;}
    if(!piece.active){add('paused','info','Pause manuelle','Le mécanisme attend votre ordre.','Reprenez la production quand vous le souhaitez.');continue;}
    if(piece.kind==='loader'){
      if(piece.batch===0&&goodsCount(piece.items)===0){add('batch-complete','info','Lot terminé','La quantité prévue a été prélevée.','Choisissez un autre lot ou le prélèvement continu.');continue;}
      if(goodsCount(piece.items)===0){
        const stock=source(w,p,piece),g=piece.filter;
        if(!stock){add('source-missing','warning','Chargeur sans source','Son dos ne touche plus un stock compatible.','Tournez-le vers votre dépôt, un coffre ou une foreuse.');continue;}
        const reserve=stock==='depot'&&raw(g)?f.reserve?.[g]??(g==='ferrite'?20:5):0;
        const available=stock==='depot'?inventory(p,g):'kind' in stock?stock.items[g]:raw(g)?stock.stock[g]:0;
        if(available<=reserve){
          const protectedStock=available>0&&reserve>0;
          add(protectedStock?'reserve-protected':'source-empty','warning',protectedStock?'Réserve de chantier protégée':'Source vide',available+' '+GOODS[g].name+' disponibles'+(reserve?' · '+reserve+' conservés au dépôt':''),protectedStock?'Ajustez la réserve ou rapportez davantage de minerai.':'Rapportez cette matière à la source du chargeur.',{good:g,available,reserve});continue;
        }
      }
    }
    if(machine(piece)&&!piece.job){
      if(goodsCount(piece.output)+RECIPES[piece.recipe].output>16){add('output-full','warning','Sortie pleine','Le tampon de sortie empêche la prochaine fabrication.','Reliez la sortie jaune au dépôt ou à un coffre.');continue;}
      const missing=Object.entries(RECIPES[piece.recipe].inputs).filter(([g,n])=>piece.items[g as Good]<n);
      if(missing.length){
        const automatic=f.pieces.some(q=>q.kind==='loader'&&q.active&&q.hull>0&&q.batch!==0&&missing.some(([g])=>g===q.filter));
        add('input-missing',automatic?'warning':'info',automatic?'En attente de matière':'À alimenter',missing.map(([g,n])=>(n-piece.items[g as Good])+' '+GOODS[g as Good].name).join(' + '),'Vérifiez le filtre du chargeur, son lot et le trajet vers une entrée bleue.');continue;
      }
    }
    const output=outputFor(piece);
    if(!goodsCount(output)||now-(piece.lastTransfer??piece.placed)<8000)continue;
    if(piece.kind==='unloader'){
      if(!contains(port(piece),foundation(p.expedition!.home,5),5))add('depot-missing','warning','Retour mal orienté','La flèche ne touche plus le dépôt.','Tournez le retour vers la base.');
      else if(RAW_GOODS.some(g=>piece.items[g]>0&&room(p,g)===0))add('depot-full','warning','Dépôt plein','Le minerai reste dans le retour au dépôt.','Libérez du stock ou construisez un entrepôt.');
      continue;
    }
    if(['chest','warehouse','mam','barracks','repairbay'].includes(piece.kind))continue;
    const front=port(piece),target=index.get(cellKey(front));
    if(piece.kind==='splitter')continue;
    if(!target)add('output-disconnected','warning','Sortie sans liaison','Les objets restent sur cette installation.','Posez un convoyeur dans le sens de la flèche.');
    else if(!target.active||target.hull<=0)add('downstream-stopped','warning','Installation suivante arrêtée',FACTORY_KINDS[target.kind].name+' attend sur la case suivante.','Reprenez ou réparez cette installation.');
    else if(target.kind==='belt'&&(piece.dir+2)%4===target.dir)add('belt-reversed','warning','Tapis en sens inverse','Les deux flèches se font face.','Tournez le tapis suivant dans le sens du trajet.');
    else if(machine(target)&&!inputPorts(target).some(c=>cellKey(c)===cellKey(front)))add('input-misaligned','warning','Entrée non raccordée','Le tapis ne rejoint pas une entrée de la machine.','Reliez le tapis à l’un des trois ports bleus.');
    else if(machine(target)&&ALL_GOODS.some(g=>output[g]>0&&!RECIPES[target.recipe].inputs[g]))add('wrong-ingredient','warning','Matière incompatible','La machine suivante ne consomme pas cette matière.','Vérifiez la recette ou le filtre du chargeur.');
  }
  return diagnostics;
}
function accepts(p:FactoryPiece,good:Good,entry:Cell,capacity=1) {
  if(!p.active||p.hull<=0)return false;
  if(machine(p)){
    if(!inputPorts(p).some(c=>cellKey(c)===cellKey(entry)))return false;
    const wanted=RECIPES[p.recipe].inputs[good]??0;
    return wanted>0&&p.items[good]<wanted*2;
  }
  if(['loader','mam','barracks','repairbay'].includes(p.kind))return false;
  return goodsCount(p.items)<(p.kind==='belt'?capacity:p.kind==='chest'?128:p.kind==='warehouse'?512:8);
}
function outputFor(p:FactoryPiece){return machine(p)?p.output:p.items;}
function runSecond(w:World,p:Miner,pieces:FactoryPiece[],index:Map<string,FactoryPiece>,at:number,trace:boolean) {
  const f=p.expedition!.factory!,capacity=beltCapacity(f);
  const moves:CargoMove[]|undefined=trace?[]:undefined;
  settleIndustry(f,at);
  for(const piece of pieces){
    if(!piece.hull||!piece.active||piece.placed>at)continue;
    if(machine(piece)){
      if(piece.job&&piece.job.ready<=at){
        const job=RECIPES[piece.job.recipe];
        piece.output[piece.job.recipe]+=job.output;f.produced[piece.job.recipe]=(f.produced[piece.job.recipe]??0)+job.output;
        movement(moves,flowNode(piece,CHAMBER),flowNode(piece,OUTPUT),piece.job.recipe,job.output);
        piece.job=null;
      }
      const recipe=RECIPES[piece.recipe];
      if(!piece.job&&goodsCount(piece.output)+recipe.output<=16&&
        Object.entries(recipe.inputs).every(([g,n])=>piece.items[g as Good]>=n)){
        for(const [g,n] of Object.entries(recipe.inputs)){
          piece.items[g as Good]-=n;
          movement(moves,flowNode(piece),flowNode(piece,CHAMBER),g as Good,n);
        }
        piece.job={recipe:piece.recipe,started:at,ready:at+recipeSeconds(f,recipe.seconds,piece.kind)*1000};
      }
    }else if(piece.kind==='loader'&&goodsCount(piece.items)<2&&piece.batch!==0){
      const stock=source(w,p,piece),g=piece.filter;
      let origin:number|undefined;
      if(stock==='depot'&&inventory(p,g)>(raw(g)?(f.reserve?.[g]??(g==='ferrite'?20:5)):0)){
        addInventory(p,g,-1);origin=flowNode(port(piece,true,true),EXTERNAL);
      }else if(stock&&stock!=='depot'){
        const items='kind' in stock?stock.items:raw(g)?stock.stock:null;
        if(items&&(items[g as keyof typeof items]??0)>0){
          (items as Partial<Record<Good,number>>)[g]!--;
          origin='kind' in stock?flowNode(stock):flowNode(port(piece,true,true),EXTERNAL);
        }
      }
      if(origin!==undefined){
        piece.items[g]++;if(piece.batch!==undefined)piece.batch--;
        movement(moves,origin,flowNode(piece),g,1);
      }
    }else if(piece.kind==='unloader'&&contains(port(piece),foundation(p.expedition!.home,5),5)){
      for(const g of ALL_GOODS){
        const n=Math.min(piece.items[g],room(p,g));
        if(n){piece.items[g]-=n;addInventory(p,g,n);movement(moves,flowNode(piece),flowNode(port(piece),EXTERNAL),g,n);}
      }
    }
  }
  // Decide against one snapshot, then move. An item travels one tile per second,
  // including after reload and during offline catch-up.
  const planned:{from:FactoryPiece;to:FactoryPiece;good:Good}[]=[],occupied=new Set<string>();
  const start=pieces.length?Math.floor(at/1000)%pieces.length:0;
  for(let i=0;i<pieces.length;i++){
    const piece=pieces[(i+start)%pieces.length];
    if(!piece.active||!piece.hull||piece.kind==='unloader'||piece.placed>at)continue;
    const output=outputFor(piece);
    const goods=piece.kind==='loader'?[piece.filter]:ALL_GOODS;
    const good=goods.find(g=>output[g]>0);
    if(!good)continue;
    const dirs=piece.kind==='splitter'?[piece.dir,((piece.dir+1)%4),((piece.dir+3)%4)]:[piece.dir];
    const routes=dirs.map((_,n)=>dirs[(n+(piece.cursor??0))%dirs.length]);
    for(const dir of routes){
      const front=port({...piece,dir:dir as BuildMark['dir']}),target=index.get(cellKey(front));
      if(!target||target===piece||occupied.has(target.id)||!accepts(target,good,front,capacity))continue;
      if(target.kind==='belt'&&(dir+2)%4===target.dir)continue;
      occupied.add(target.id);planned.push({from:piece,to:target,good});piece.cursor=((piece.cursor??0)+1)%dirs.length;break;
    }
  }
  for(const move of planned){
    outputFor(move.from)[move.good]--;move.to.items[move.good]++;move.from.lastTransfer=at;move.to.lastTransfer=at;
    movement(moves,flowNode(move.from,machine(move.from)?OUTPUT:BIN),flowNode(move.to),move.good,1);
  }
  if(moves)storeBeat(f,at,moves);
}
export function advanceFactory(w:World,p:Miner,now:number,captureSince=now-FLOW_WINDOW) {
  const f=factoryState(p,now);
  if(!f.pieces.length){settleIndustry(f,now);f.clock=now;return;}
  const end=Math.floor(Math.min(now,p.lastSeen+4*3600000)/1000)*1000;
  const start=Math.max(Math.floor(f.clock/1000)*1000,end-4*3600000);
  if(end<=start){settleIndustry(f,now);f.clock=Math.max(f.clock,Math.floor(now/1000)*1000);return;}
  const index=indexFor(f.pieces);
  for(let t=start+1000;t<=end;t+=1000)runSecond(w,p,f.pieces,index,t,t>=Math.max(captureSince,end-FLOW_WINDOW));
  settleIndustry(f,now);f.clock=Math.floor(now/1000)*1000;
}
function mark(value:unknown):BuildMark {
  if(!value||typeof value!=='object')throw Error('Case d’usine invalide.');
  const v=value as BuildMark;
  if(!FACE_ORDER.includes(v.face)||!validCell(v)||!Number.isInteger(v.dir)||v.dir<0||v.dir>3)throw Error('Case d’usine hors de la grille.');
  return {face:v.face,x:v.x,y:v.y,dir:v.dir};
}
function mayBuild(w:World,p:Miner,at:Place) {
  return range(p.expedition!.home,at)<500||w.colonization?.outposts.some(s=>s.owner===p.id&&range(s.point,at)<OUTPOST_RADIUS)||w.frontier!.rigs.some(r=>r.owner===p.id&&range(r.point,at)<160);
}
function reserved(w:World,cell:Cell) {
  return w.players.some(q=>contains(cell,foundation(q.expedition!.home,5),5))||
    w.frontier!.rigs.some(r=>contains(cell,r.grid??foundation(r.point,3),3));
}
function recover(p:Miner,pieces:FactoryPiece[],includeCost:boolean) {
  const recovered=emptyGoods();
  let coins=0;
  for(const piece of pieces){
    for(const g of ALL_GOODS)recovered[g]+=piece.items[g]+piece.output[g];
    if(piece.job)for(const [g,n] of Object.entries(RECIPES[piece.job.recipe].inputs))recovered[g as Good]+=n;
    if(includeCost&&!piece.gift){const cost=FACTORY_KINDS[piece.kind];coins+=cost.credits;recovered.ferrite+=cost.ferrite;recovered.cuivre+=cost.cuivre;}
  }
  const count=RAW_GOODS.reduce((n,g)=>n+recovered[g],0);
  if(count>room(p,'ferrite'))throw Error('Libérez de la place au dépôt pour récupérer ces matériaux.');
  for(const g of ALL_GOODS)addInventory(p,g,recovered[g]);
  p.coins+=coins;
}
export function actFactory(w:World,p:Miner,a:Record<string,unknown>,now:number,inTown:(at:Place)=>boolean) {
  const f=factoryState(p,now);
  if(a.op==='reserve'){const fer=a.ferrite,cuivre=a.cuivre;if(typeof fer!=='number'||typeof cuivre!=='number'||!Number.isSafeInteger(fer)||!Number.isSafeInteger(cuivre)||fer<0||cuivre<0||fer>1000000||cuivre>1000000)throw Error('Réserve de minerai invalide.');f.reserve={ferrite:fer,cuivre};return 'Réserve de chantier mise à jour.';}
  if(a.op==='blueprint')throw Error('Choisissez une machine et posez chaque bâtiment sur la grille.');
  if(a.op==='research')return startIndustry(p,f,a.skill,now);
  if(a.op==='place'){
    if(typeof a.kind!=='string'||!Object.hasOwn(FACTORY_KINDS,a.kind))throw Error('Construction inconnue.');
    const kind=a.kind as FactoryKind;
    if(kind==='warehouse'&&f.pieces.filter(c=>c.kind==='warehouse').length>=4)throw Error('Quatre entrepôts suffisent au stockage maximal du camp.');
    if(!canBuild(f,kind))throw Error('Débloquez cette machine dans l’arbre industriel.');
    if(!Array.isArray(a.cells)||!a.cells.length||a.cells.length>96)throw Error('Un tracé contient de 1 à 96 cases.');
    if(kind!=='belt'&&a.cells.length!==1)throw Error('Posez les bâtiments un par un.');
    const marks=[...new Map(a.cells.map(value=>{const m=mark(value);return [cellKey(m),m] as const;})).values()];
    const others=w.players.flatMap(q=>q.expedition?.factory?.pieces??[]);
    const index=indexFor(others),updates:{piece:FactoryPiece;dir:BuildMark['dir']}[]=[];
    const additions:FactoryPiece[]=[];
    for(const m of marks){
      const existing=index.get(cellKey(m));
      if(existing&&kind==='belt'&&existing.kind==='belt'&&f.pieces.includes(existing)){
        updates.push({piece:existing,dir:m.dir});continue;
      }
      const size=FACTORY_KINDS[kind].size,point=cellPlace(m,size),area=footprint(m,size);
      if(area.some(c=>!validCell(c)))throw Error('Ce bâtiment dépasse la face de la planète.');
      if(!mayBuild(w,p,point))throw Error('Construisez près de votre base, d’une de vos foreuses ou d’un avant-poste.');
      if(inTown(point))throw Error('Les villes neutres restent dédiées au commerce.');
      if(area.some(c=>index.has(cellKey(c))||reserved(w,c)))throw Error('Cette emprise est déjà occupée.');
      const piece:FactoryPiece={...m,id:crypto.randomUUID(),kind,items:emptyGoods(),output:emptyGoods(),hull:FACTORY_KINDS[kind].hull,
        active:true,recipe:defaultRecipe(kind),filter:'ferrite',job:null,placed:now};
      if(kind==='loader'&&!source(w,p,piece))throw Error('Le dos du chargeur doit toucher votre dépôt ou une foreuse. Tournez-le avec R.');
      if(kind==='unloader'&&!contains(port(piece),foundation(p.expedition!.home,5),5))throw Error('La flèche de retour doit pointer vers le dépôt.');
      additions.push(piece);
      for(const cell of area)index.set(cellKey(cell),piece);
    }
    if(f.pieces.length+additions.length>FACTORY_LIMIT)throw Error('Cette usine atteint sa capacité de 640 constructions.');
    const price=FACTORY_KINDS[kind],count=additions.length;
    if(p.coins<count*price.credits||p.inventory.ferrite<count*price.ferrite||p.inventory.cuivre<count*price.cuivre)throw Error('Le dépôt manque de matériaux pour ce tracé.');
    p.coins-=count*price.credits;p.inventory.ferrite-=count*price.ferrite;p.inventory.cuivre-=count*price.cuivre;
    for(const update of updates){if(update.piece.dir!==update.dir)update.piece.flowReset=now;update.piece.dir=update.dir;}
    f.pieces.push(...additions);
    return count+' '+(count>1?'constructions posées.':'construction posée.');
  }
  if(a.op==='remove'){
    if(!Array.isArray(a.cells)||!a.cells.length||a.cells.length>96)throw Error('Choisissez les cases à retirer.');
    const cells=a.cells.map(mark);
    const all=indexFor(w.players.flatMap(q=>q.expedition?.factory?.pieces??[]));
    const touched=[...new Set(cells.map(c=>all.get(cellKey(c))).filter((p):p is FactoryPiece=>!!p))];
    if(touched.some(piece=>!f.pieces.includes(piece)))throw Error('Vous pouvez démonter uniquement vos constructions.');
    recover(p,touched,true);f.pieces=f.pieces.filter(piece=>!touched.includes(piece));
    return 'Matériaux et contenu récupérés au dépôt.';
  }
  const piece=f.pieces.find(piece=>piece.id===a.id);
  if(!piece)throw Error('Cette construction ne vous appartient pas.');
  if(a.op==='drain'){
    if(piece.job)throw Error('Laissez la fabrication se terminer avant de vider le tampon.');
    recover(p,[piece],false);piece.items=emptyGoods();piece.output=emptyGoods();piece.flowReset=now;
    if(piece.kind==='loader')piece.batch=0;
    return 'Matières du tampon récupérées au dépôt.';
  }
  if(a.op==='continuous'){
    if(piece.kind!=='loader')throw Error('Choisissez un chargeur pour alimenter en continu.');
    piece.batch=undefined;return 'Prélèvement continu activé. La réserve de chantier reste protégée.';
  }
  if(a.op==='rotate'){piece.flowReset=now;piece.dir=((piece.dir+1)%4) as BuildMark['dir'];return 'Construction tournée.';}
  if(a.op==='pause'){piece.flowReset=now;if(piece.active)piece.pausedAt=now;else{if(piece.job&&piece.pausedAt){const delay=now-piece.pausedAt;piece.job.ready+=delay;if(piece.job.started!==undefined)piece.job.started+=delay;}piece.pausedAt=undefined;}piece.active=!piece.active;return piece.active?'Production reprise.':'Production suspendue.';}
  if(a.op==='repair'){
    if(piece.hull>=FACTORY_KINDS[piece.kind].hull)throw Error('Cette construction est déjà en bon état.');
    if(p.coins<20||p.inventory.ferrite<5)throw Error('La réparation demande 20 CR et 5 ferrite.');
    p.coins-=20;p.inventory.ferrite-=5;piece.hull=FACTORY_KINDS[piece.kind].hull;return 'Construction réparée.';
  }
  if(a.op==='supply'){if(piece.kind!=='loader'||!ALL_GOODS.includes(a.good as Good)||!Number.isSafeInteger(a.quantity)||Number(a.quantity)<0||Number(a.quantity)>256)throw Error('Lot de chargeur invalide (0 à 256).');if(goodsCount(piece.items))throw Error('Attendez que le tampon du chargeur soit vide.');piece.filter=a.good as Good;piece.batch=Number(a.quantity);return 'Prélèvement limité à '+piece.batch+' unités.';}
  if(a.op==='filter'){
    if(piece.kind!=='loader'||!ALL_GOODS.includes(a.good as Good))throw Error('Filtre de chargeur invalide.');
    recover(p,[piece],false);piece.items=emptyGoods();piece.output=emptyGoods();
    piece.flowReset=now;piece.filter=a.good as Good;piece.batch=undefined;return 'Filtre du chargeur modifié.';
  }
  if(a.op==='recipe'){
    const recipe=a.recipe as RefinedGood;
    if(!Object.hasOwn(RECIPES,recipe)||!machine(piece)||RECIPES[recipe].machine!==piece.kind||!canRecipe(f,recipe))throw Error('Recette incompatible avec cette machine.');
    if(piece.job)throw Error('Laissez la fabrication se terminer avant de changer de recette.');
    recover(p,[piece],false);piece.items=emptyGoods();piece.output=emptyGoods();piece.flowReset=now;piece.recipe=recipe;
    return 'Recette configurée. Les matières précédentes reviennent au dépôt.';
  }
  throw Error('Ordre d’usine inconnu.');
}
export function factoryView(p:Miner,now:number,w?:World) {
  const f=factoryState(p,now);
  return {...f,diagnostics:w?factoryDiagnostics(w,p,Math.min(now,w.frontier!.time)):[],flow:currentFlow(f),speed:industrySpeed(f),beltCapacity:beltCapacity(f),pieces:f.pieces.map(piece=>({...piece,status:factoryStatus(piece)}))};
}
