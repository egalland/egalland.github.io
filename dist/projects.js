import { CATALOG, HAS_COLLAR, sizeMeasures, validateMeasures, STITCHES, WEIGHTS, FORMS } from './catalog.js';
import { PATTERNS } from './textiles.js';
import { validateState as readLegacy } from './knit.js';
import { emptyPullDesign, emptyPullWork, readPullState, remapPullColors } from './pull-state.js';

export const numberFr = (n, digits=1) => Number(n).toLocaleString('fr-FR',{maximumFractionDigits:digits});
export const copy = value => JSON.parse(JSON.stringify(value));
export const uniqueId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+Math.random().toString(36).slice(2);
const cleanString=(v,fallback,max=72)=>typeof v==='string'&&v.trim()?v.trim().slice(0,max):fallback;
const inRange=(value,min,max,fallback)=>Number.isFinite(value)&&value>=min&&value<=max?value:fallback;
const isoDate=()=>new Date().toISOString();
export const knittingDirection=(kind,form)=>['echarpe','chale','couverture','lavette','gilet','brassiere','coussin'].includes(kind)||(kind==='libre'&&['rectangle','triangle'].includes(form))?'flat':'round';
export function makeYarn(index=0){
  const names=['Écru','Pin','Argile'];
  return {id:uniqueId(),name:names[index]||'Nouveau fil',reference:'',fiber:'merinos',weight:3,
    color:['#e5dbc5','#385345','#ae7356'][index]||'#839b9b',grams:50,meters:125,heldWith:null,stock:0};
}
export function createProject(kind='pull',name){
  const template=PATTERNS.find(p=>p.id==='nordic')||PATTERNS[0];
  return {schema:'maille-project',version:3,id:uniqueId(),revision:0,updatedAt:isoDate(),
    name:name||('Mon ouvrage · '+CATALOG[kind].name),kind,form:'rectangle',size:kind==='pull'?'M':'custom',
    measures:{...CATALOG[kind].measures},collar:'round',stitch:'stockinette',
    yarns:[0,1,2].map(makeYarn),selected:1,gauge:{stitches:22,rows:30,manual:false},
    sample:{enabled:false,width:12,height:12,grams:0},margin:10,floatAllowance:12,
    motif:{id:template.id,layout:HAS_COLLAR.has(kind)?'yoke':'repeat',u:.5,v:.72,scale:1,surface:'body'},
    cols:template.cols,rows:template.rows,grid:template.grid.map(r=>[...r]),
    progress:1,completed:false,direction:knittingDirection(kind,'rectangle'),step:0,notes:'',
    pullDesign:emptyPullDesign(),pullWork:emptyPullWork()};
}
export function changeKind(p,kind){
  if(!CATALOG[kind]||kind===p.kind)return;
  p.kind=kind;p.size='custom';p.measures={...CATALOG[kind].measures};p.direction=knittingDirection(kind,p.form);
  p.motif.surface='body';
  if(p.motif.layout==='yoke'&&!HAS_COLLAR.has(kind))p.motif.layout='band';
}
export function applyPattern(p,source){
  const count=1+Math.max(...source.grid.flat());
  while(p.yarns.length<count)p.yarns.push(makeYarn(p.yarns.length));
  p.cols=source.cols;p.rows=source.rows;p.grid=source.grid.map(r=>[...r]);p.motif.id=source.id;p.progress=1;p.completed=false;
}
export function yarnForTexture(p,index){
  const yarn=p.yarns[index]||p.yarns[0];
  return {...yarn,companion:p.yarns.find(y=>y.id===yarn.heldWith)||null};
}
export function sampleSignature(p){
  const base=p.yarns[0],second=p.yarns.find(y=>y.id===base.heldWith);
  const specimen=y=>y?[y.id,y.grams/y.meters,y.weight,y.fiber,y.reference]:null;
  return JSON.stringify([p.stitch,p.gauge.stitches,p.gauge.rows,specimen(base),specimen(second)]);
}
export function removeYarn(p,index){
  if(!Number.isInteger(index)||index<=0||index>=p.yarns.length)return;
  const [removed]=p.yarns.splice(index,1);
  const newIndex=color=>color===index?0:color>index?color-1:color;
  for(const y of p.yarns)if(y.heldWith===removed.id)y.heldWith=null;
  remapPullColors(p,index);
  p.grid=p.grid.map(row=>row.map(newIndex));p.selected=newIndex(p.selected);
  p.motif.id='custom';
}
export function migrateLegacy(raw){
  const old=readLegacy(raw),p=createProject('pull',old.name);
  p.size=old.size;p.collar=old.collar;p.measures=sizeMeasures('pull',old.size);
  if(old.fit==='oversize'){p.measures.chest+=12;p.measures.hem+=12;p.size='custom';}
  p.cols=old.cols;p.rows=old.rows;p.grid=old.grid.map(row=>[...row]);p.selected=old.selected;
  p.yarns=old.palette.map((color,i)=>({...makeYarn(i),name:color.name,color:color.hex}));
  p.gauge={stitches:old.gaugeStitches,rows:old.gaugeRows,manual:true};
  p.motif.id=old.preset;p.motif.layout=({yoke:'yoke',all:'repeat',band:'band'})[old.placement];
  p.progress=old.progress;p.completed=old.completed;p.direction=old.direction;
  return p;
}
export function parseProject(input){
  if(input?.schema==='maille-project'&&input.version===1)return migrateLegacy(input);
  if(input?.schema!=='maille-project'||![2,3].includes(input.version)||!Object.hasOwn(CATALOG,input.kind))throw Error('Choisissez un projet Maille au format JSON.');
  const p=createProject(input.kind,cleanString(input.name,'Mon ouvrage'));
  p.id=cleanString(input.id,p.id,90);
  if(!/^[a-zA-Z0-9_-]+$/.test(p.id))p.id=uniqueId();
  p.revision=Math.floor(inRange(input.revision,0,1e12,0));
  if(typeof input.updatedAt==='string'&&Number.isFinite(Date.parse(input.updatedAt)))p.updatedAt=input.updatedAt;
  p.size=['XS','S','M','L','XL','XXL'].includes(input.size)?input.size:'custom';
  p.form=FORMS[input.form]?input.form:'rectangle';p.collar=['round','high','v'].includes(input.collar)?input.collar:'round';
  p.stitch=STITCHES[input.stitch]?input.stitch:'stockinette';
  for(const key of Object.keys(p.measures))p.measures[key]=input.measures?.[key]??p.measures[key];
  const error=validateMeasures(p.kind,p.measures);if(error)throw Error(error);
  if(!Array.isArray(input.yarns)||input.yarns.length<1||input.yarns.length>12)throw Error('Le projet doit contenir entre 1 et 12 fils.');
  const ids=new Set();
  p.yarns=input.yarns.map((y,index)=>{
    if(!y||!/^#[a-f0-9]{6}$/i.test(y.color)||!Number.isFinite(y.grams)||y.grams<=0||y.grams>5000||!Number.isFinite(y.meters)||y.meters<=0||y.meters>20000)throw Error('Vérifiez la couleur, le poids et le métrage de chaque pelote.');
    const id=cleanString(y.id,'fil-'+index,90);if(ids.has(id))throw Error('Deux fils du fichier ont le même identifiant.');ids.add(id);
    return {id,name:cleanString(y.name,'Fil '+(index+1),40),reference:cleanString(y.reference,'',64),
      fiber:cleanString(y.fiber,'laine',32),weight:Math.floor(inRange(y.weight,0,7,3)),color:y.color,
      grams:y.grams,meters:y.meters,stock:Math.floor(inRange(y.stock,0,1000,0)),heldWith:y.heldWith||null};
  });
  for(const y of p.yarns)if(!ids.has(y.heldWith))y.heldWith=null;
  const cols=input.cols,rows=input.rows;
  if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<2||rows<2||cols>64||rows>64||!Array.isArray(input.grid)||input.grid.length!==rows||input.grid.some(row=>!Array.isArray(row)||row.length!==cols||row.some(v=>!Number.isInteger(v)||v<0||v>=p.yarns.length)))throw Error('La grille de ce projet est incomplète.');
  p.cols=cols;p.rows=rows;p.grid=input.grid.map(row=>[...row]);
  p.selected=Math.floor(inRange(input.selected,0,p.yarns.length-1,0));
  const motif=input.motif||{};p.motif={id:cleanString(motif.id,'custom',64),
    layout:['repeat','single','band','yoke'].includes(motif.layout)?motif.layout:'repeat',
    surface:cleanString(motif.surface,'body',80),u:inRange(motif.u,0,1,.5),v:inRange(motif.v,0,1,.7),scale:[1,2,3].includes(motif.scale)?motif.scale:1};
  p.gauge={stitches:inRange(input.gauge?.stitches,2,80,22),rows:inRange(input.gauge?.rows,2,100,30),manual:input.gauge?.manual===true};
  p.sample={width:inRange(input.sample?.width,2,100,12),height:inRange(input.sample?.height,2,100,12),grams:inRange(input.sample?.grams,0,1000,0),enabled:input.sample?.enabled===true&&input.sample?.grams>0};
  p.margin=inRange(input.margin,0,50,10);p.floatAllowance=inRange(input.floatAllowance,0,50,12);
  p.progress=Math.floor(inRange(input.progress,1,rows,1));p.completed=input.completed===true&&p.progress===rows;
  p.direction=input.direction==='flat'?'flat':'round';p.step=Math.floor(inRange(input.step,0,4,0));
  p.notes=cleanString(input.notes,'',3000);
  readPullState(p,input);
  return p;
}
const KEY='maille:v2:project:', ACTIVE='maille:v2:current', MIGRATED='maille:v2:migrated';
export class ProjectBook{
  constructor(storage){this.storage=storage;this.memory=new Map();this.failed=false;this.recoverable=[];}
  list(){
    const all=new Map(this.memory);this.recoverable=[];
    try{
      for(let i=0;i<this.storage.length;i++){
        const key=this.storage.key(i);if(!key?.startsWith(KEY))continue;
        try{const p=parseProject(JSON.parse(this.storage.getItem(key)));const mem=all.get(p.id);if(!mem||mem.revision<p.revision)all.set(p.id,p);}
        catch{this.recoverable.push(key);}
      }
    }catch{this.failed=true;}
    return [...all.values()].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt));
  }
  startup(){
    const list=this.list();let active;
    try{active=this.storage.getItem(ACTIVE);}catch{this.failed=true;}
    if(list.length)return copy(list.find(p=>p.id===active)||list[0]);
    try{
      const legacy=this.storage.getItem('maille-atelier-v1');
      if(legacy&&!this.storage.getItem(MIGRATED)){
        const migrated=migrateLegacy(JSON.parse(legacy));
        const saved=this.save(migrated);if(saved.ok)this.storage.setItem(MIGRATED,'1');
        return migrated;
      }
    }catch{this.legacyUnreadable=true;}
    const p=createProject('pull','Pull des sous-bois');this.save(p);return p;
  }
  load(id){const p=this.list().find(x=>x.id===id);if(!p)throw Error('Ce projet est introuvable.');try{this.storage.setItem(ACTIVE,p.id);}catch{this.failed=true;}return copy(p);}
  save(p){
    let conflict=false;
    try{
      const old=this.storage.getItem(KEY+p.id);
      if(old&&JSON.parse(old).revision>p.revision){p.id=uniqueId();p.name=(p.name+' (copie)').slice(0,72);p.revision=0;conflict=true;}
      p.updatedAt=isoDate();p.revision++;this.storage.setItem(KEY+p.id,JSON.stringify(p));this.storage.setItem(ACTIVE,p.id);
      this.failed=false;this.memory.set(p.id,copy(p));return {ok:true,conflict};
    }catch{this.failed=true;p.updatedAt=isoDate();this.memory.set(p.id,copy(p));return {ok:false,conflict};}
  }
  duplicate(p,name){const next=copy(p);next.id=uniqueId();next.revision=0;next.name=cleanString(name,p.name+' (copie)');this.save(next);return next;}
  exportAll(){return {schema:'maille-carnet',version:1,projects:this.list(),exportedAt:isoDate()};}
}
