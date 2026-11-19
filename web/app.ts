import { EXERCISE_CATALOG } from '../app/exercise-catalog';
import { sections, type Field, type Form, type Listing } from './forms';

type Row = Record<string,unknown>;
type State = Record<string,Row | Row[]>;
let data:State = {};
const get = <T extends HTMLElement>(id:string) => document.getElementById(id) as T;
const view = get('view'), nav = get('nav'), message = get('message');
const node = <K extends keyof HTMLElementTagNameMap>(tag:K, text?:string, cls?:string) => {
  const elem = document.createElement(tag);
  if(text !== undefined) elem.textContent=text;
  if(cls) elem.className=cls;
  return elem;
};
const today = () => {
  const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  return now.toISOString().slice(0,10);
};
const rows = (key:string):Row[] => Array.isArray(data[key]) ? data[key] as Row[] : [];
const one = (key:string):Row => !Array.isArray(data[key]) && data[key] ? data[key] as Row : {};
const rowName = (row:Row) => String(row.title||row.name||row.sessionName||row.exerciseName||row.id) + (row.variety?' · '+row.variety:'');
const tabs = ['Aperçu', ...sections.map(s=>s.name),'Anatomie'];
let selected = tabs.includes(decodeURIComponent(location.hash.slice(1))) ? decodeURIComponent(location.hash.slice(1)) : tabs[0];
let timer:ReturnType<typeof setTimeout>;
function notify(text:string){message.textContent=text;clearTimeout(timer);timer=setTimeout(()=>message.textContent='',6200);}
function choices(field:Field):[string,string][] {
  if(field.options) return field.options;
  const table=field.type?.slice(4)??'';
  if(table==='catalog'||table==='exerciseNames') return EXERCISE_CATALOG.map(e=>[table==='catalog'?e.key:e.name,e.name]);
  const list=table==='openSessions'?rows('strengthSessions').filter(r=>!r.completedAt):rows(table);
  return list.map(r=>[String(r.id),rowName(r)]);
}
async function refresh() {
  const response=await fetch('/api/bodyos');
  if(!response.ok) throw new Error('Accès fermé. Ouvrez le lien indiqué au démarrage.');
  data=await response.json();
  get('identity').textContent=String(one('profile').name)+' · Local';
  get('locked').hidden=true;get('layout').hidden=false;
  document.body.classList.toggle('compact', Boolean(one('settings').compactMode));
  render();
}
async function mutate(payload:Row) {
  const response=await fetch('/api/bodyos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const result=await response.json();
  if(!response.ok) throw new Error(String(result.error??'Enregistrement impossible.'));
  await refresh();notify('Modification enregistrée.');
}
function renderForm(spec:Form, editing?:Row) {
  const initialRow = editing ?? (spec.defaults ? one(spec.defaults) : {});
  let targets:Row={};try{targets=JSON.parse(String(initialRow.customBodyTargets||'{}'));}catch{}
  const wrap=node('details'), form=node('form');
  wrap.append(node('summary',spec.label),form);
  for(const field of spec.fields) {
    const label=node('label',field.label), initial=field.key.startsWith('target_')?targets[field.key.slice(7)]:initialRow[field.key];
    let control:HTMLInputElement|HTMLSelectElement;
    if(field.options||field.type?.startsWith('ref:')){
      const select=node('select'); control=select;
      const opts=choices(field);
      if(!field.required||!opts.length){select.add(new Option(opts.length?'—':'Ajoutez d’abord un élément',''));}
      for(const [value,title] of opts)select.add(new Option(title,value));
    }else{
      const input=node('input');control=input;input.type=field.type??'text';
      if(input.type==='number'){input.step='any';if(field.min!==undefined)input.min=String(field.min);}
      if(input.type==='date' && field.required)input.value=today();
      if(input.type==='checkbox')input.checked=Boolean(initial);
    }
    if(initial!==undefined && initial!==null && field.type!=='checkbox')control.value=String(initial);
    control.name=field.key;control.required=Boolean(field.required);label.append(control);form.append(label);
  }
  if(spec.action==='save-log'){
    const input=form.elements.namedItem('logDate') as HTMLInputElement;
    function fillLog(){
      const old=rows('logs').find(r=>r.logDate===input.value);
      for(const field of spec.fields.filter(f=>f.key!=='logDate')){
        const control=form.elements.namedItem(field.key) as HTMLInputElement;
        control.value=old?.[field.key]==null?'':String(old[field.key]);
      }
    }
    input.addEventListener('change',fillLog);fillLog();
  }
  const submit=node('button','Enregistrer','primary');submit.type='submit';form.append(submit);
  form.addEventListener('submit',async ev=>{
    ev.preventDefault(); const payload:Row={action:spec.action};
    for(const field of spec.fields){
      const entry=form.elements.namedItem(field.key) as HTMLInputElement|HTMLSelectElement;
      payload[field.key]=field.type==='checkbox'?(entry as HTMLInputElement).checked:entry.value;
    }
    if(editing)payload.id=editing.id;
    if(spec.action==='save-morphology'){
      const targetEntries=Object.entries(payload).filter(([key,v])=>key.startsWith('target_') && v!=='');
      payload.customBodyTargets=Object.fromEntries(targetEntries.map(([key,v])=>[key.slice(7),Number(v)]));
    }
    if(spec.action==='add-harvest-batch')payload.entries=[{produceId:payload.produceId,weightKg:payload.weightKg,unitCount:payload.unitCount,destination:payload.destination,note:payload.note}];
    submit.disabled=true;
    try{await mutate(payload);}catch(error){notify(String((error as Error).message));submit.disabled=false;}
  });
  return wrap;
}
function value(row:Row,key:string):string{
  const v=row[key];if(v===null||v===undefined||v==='') return '—';
  if(key==='taskId'||key==='produceId'){const item=rows(key==='taskId'?'tasks':'produce').find(r=>r.id===v);if(item)return rowName(item);}
  if(typeof v==='boolean')return v?'Oui':'Non';
  return String(v).replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}).*$/,'$1 $2');
}
const editorKinds:Record<string,[string,string]>={
  supplements:['add-supplement','update-supplement'],
  harvests:['add-harvest-batch','update-harvest'],
  programExercises:['add-program-exercise','update-program-exercise']
};
function editRow(table:string,row:Row){
  const [source,action]=editorKinds[table];
  const base=sections.flatMap(section=>section.forms).find(form=>form.action===source)!;
  const fields=base.fields.filter(f=>action!=='update-supplement'||f.key!=='name');
  if(action==='update-harvest')fields.push({key:'pricePerKg',label:'Prix/kg (€)',type:'number'}, {key:'priceMode',label:'Tarif',options:[['catalog','Prix du catalogue'],['manual','Prix saisi']]});
  const editor=renderForm({...base,action,fields,label:'Modifier · '+rowName(row)},row);
  editor.open=true;editor.id='editor';document.getElementById('editor')?.remove();
  view.querySelector('.forms')?.prepend(editor);editor.scrollIntoView({block:'start'});
}
function listing(spec:Listing){
  const box=node('div',undefined,'tablewrap'), items=rows(spec.key);
  if(!items.length){box.append(node('p','Aucune entrée.','empty'));return box;}
  const table=node('table'),head=table.createTHead().insertRow();
  for(const [,title] of spec.columns)head.append(node('th',title));if(spec.remove||editorKinds[spec.key])head.append(node('th','Action'));
  for(const row of items){
    const tr=table.insertRow();for(const [k] of spec.columns)tr.insertCell().textContent=value(row,k);
    const actions=(spec.remove||editorKinds[spec.key])?tr.insertCell():null;
    if(editorKinds[spec.key]){const edit=node('button','Modifier','remove');edit.addEventListener('click',()=>editRow(spec.key,row));actions!.append(edit);}
    if(spec.remove){
      const remove=node('button','Supprimer','remove');remove.type='button';
      remove.addEventListener('click',async()=>{if(!confirm('Supprimer cette entrée de la base locale ?'))return;try{await mutate({action:spec.remove,id:row.id});}catch(e){notify((e as Error).message);}});
      actions!.append(remove);
    }
  }
  box.append(table);return box;
}
function summary(){
  const tiles=node('div',undefined,'tiles'), harvestKg=rows('harvests').reduce((sum,r)=>sum+Number(r.weightKg||0),0);
  const latest=rows('logs')[0];
  for(const [title,n] of [['Jours renseignés',rows('logs').length],['Séances terminées',rows('strengthSessions').filter(r=>r.completedAt).length],['Habitudes',rows('tasks').length],['Récolte totale (kg)',harvestKg.toLocaleString('fr-FR')]]){
    const tile=node('div',undefined,'tile');tile.append(node('strong',String(n)),node('span',String(title)));tiles.append(tile);
  }
  view.append(tiles,node('h2','Dernière journée'),latest?listing({key:'logs',label:'Journal',columns:[['logDate','Date'],['weightKg','Poids (kg)'],['sleepHours','Sommeil (h)'],['steps','Pas']]}):node('p','Votre première saisie apparaîtra ici.','small'));
}
function render(){
  nav.replaceChildren();view.replaceChildren(node('h1',selected));
  for(const name of tabs){
    const item=node('button',name);item.type='button';item.setAttribute('aria-current',selected===name?'page':'false');
    item.addEventListener('click',()=>{selected=name;history.replaceState(null,'','#'+encodeURIComponent(name));render();});nav.append(item);
  }
  if(selected==='Aperçu')return summary();
  if(selected==='Anatomie'){
    const frame=node('iframe');frame.src='/bodyos-anatomy/viewer.html';frame.title='Atlas musculaire 3D';view.append(frame);
    const label=node('p','Sélectionnez un muscle sur le modèle.','small');label.id='muscle';view.append(label);return;
  }
  const section=sections.find(s=>s.name===selected)!;
  const forms=node('div',undefined,'forms');section.forms.forEach(f=>forms.append(renderForm(f)));view.append(forms);
  for(const list of section.lists)view.append(node('h2',list.label),listing(list));
}
window.addEventListener('message',event=>{
  if(event.origin!==location.origin || event.source!==view.querySelector('iframe')?.contentWindow || event.data?.type!=='bodyos-muscle-click')return;
  const display=get('muscle');if(display)display.textContent=[event.data.structureName,event.data.side].filter(Boolean).join(' · ');
});
async function boot(){
  if(location.hash.startsWith('#code=')){
    const code=decodeURIComponent(location.hash.slice(6));history.replaceState(null,'',location.pathname);
    const unlocked=await fetch('/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});
    if(!unlocked.ok)throw new Error('Code de session invalide ou expiré.');
  }
  await refresh();
}
boot().catch(e=>notify((e as Error).message));
