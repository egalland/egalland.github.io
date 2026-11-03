import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const js = readFileSync(new URL('../site/main.js', import.meta.url), 'utf8');
const key = 'biscuit-du-jour:v1';

function createInstance(sharedStorage = new Map(), options = {}) {
  const elements = new Map();
  let document;
  class FakeElement {
    constructor(id='') {
      this.id=id; this.textContent=''; this.innerHTML=''; this.value=''; this.checked=false;
      this.disabled=false; this.hidden=false; this.children=[]; this.listeners=new Map(); this.attrs=new Map();
      this.classList={_names:new Set(),add(n){this._names.add(n)},remove(n){this._names.delete(n)}};
      this.style={}; this.offsetWidth=100; this.files=null;
    }
    addEventListener(name,fn){this.listeners.set(name,fn)}
    dispatch(name){this.listeners.get(name)?.({type:name,target:this,preventDefault(){}})}
    click(){this.dispatch('click')}
    setAttribute(k,v){this.attrs.set(k,v)}
    append(...nodes){this.children.push(...nodes)}
    replaceChildren(...nodes){this.children=[...nodes]}
    focus(){document.activeElement=this}
    showModal(){this.open=true}
    close(){this.open=false;this.dispatch('close')}
    reset(){elements.get('noteText').value='';elements.get('noteRecipient').value=''}
    remove(){}
  }
  document={
    body:new FakeElement('body'),
    activeElement:null,
    getElementById(id){if(!elements.has(id))elements.set(id,new FakeElement(id));return elements.get(id)},
    createElement(tag){return new FakeElement(tag)}
  };
  const storage={
    getItem(k){if(options.readError)throw new Error('read blocked');return sharedStorage.has(k)?sharedStorage.get(k):null},
    setItem(k,v){if(options.writeError)throw new Error('write blocked');sharedStorage.set(k,String(v))}
  };
  const window={localStorage:storage, crypto:webcrypto,confirm:()=>true,setTimeout:()=>1,clearTimeout:()=>{},addEventListener:()=>{}};
  const URLStub={createObjectURL:()=> 'blob:fake',revokeObjectURL:()=>{}};
  const navigator={clipboard:{writeText:async()=>{}}};
  const globals={document,window,navigator,URL:URLStub,Blob,crypto:webcrypto,console,Intl,Math,Date,Uint32Array,Set,JSON,Error};
  const context=vm.createContext(globals);
  vm.runInContext(js,context);
  const get=id=>document.getElementById(id);
  return {get,sharedStorage,context,click:id=>get(id).click(),dispatch:(id,event)=>get(id).dispatch(event)};
}

test('Parcours principal : 12 billets uniques, épuisement, nouvelle tournée et recharge',()=>{
  const storage=new Map();let app=createInstance(storage);
  assert.equal(app.get('availableCount').innerHTML,'12 <small>/ 12</small>');
  const drawn=[];
  for(let i=0;i<12;i++){
    app.click('drawButton');
    drawn.push(app.get('fortuneText').textContent);
    assert.equal(app.get('ticketReveal').hidden,false);
  }
  assert.equal(new Set(drawn).size,12,'aucune répétition par défaut');
  assert.equal(app.get('drawButton').disabled,true);
  assert.equal(JSON.parse(storage.get(key)).totalDraws,12);
  app=createInstance(storage); // simulation d'actualisation : nouvel environnement, même localStorage
  assert.equal(app.get('fortuneText').textContent,drawn.at(-1),'dernier billet rechargé');
  assert.equal(app.get('drawButton').disabled,true,'état épuisé rechargé');
  app.click('resetDraws');
  assert.equal(app.get('drawButton').disabled,false);
  app=createInstance(storage);
  assert.equal(app.get('drawButton').disabled,false,'réinitialisation persistante');
  app.get('repeatToggle').checked=true;
  app.dispatch('repeatToggle','change');
  app=createInstance(storage);
  assert.equal(app.get('repeatToggle').checked,true,'préférence répétition conservée');
});

test('Validation, ajout, édition, suppression et rechargement des messages',()=>{
  const storage=new Map();let app=createInstance(storage);
  app.dispatch('noteForm','submit');
  assert.match(app.get('formError').textContent,/3 caractères/);
  app.get('noteText').value='La chance a chaussé ses petits souliers.';
  app.get('noteRecipient').value='Camille';
  app.dispatch('noteForm','submit');
  assert.equal(app.get('headerCount').textContent,'13');
  assert.match(app.get('toast').textContent,/sauvegardé/);
  app=createInstance(storage);
  assert.equal(app.get('headerCount').textContent,'13','ajout persisté après reload');
  let first=app.get('collectionList').children[0];
  first.children[1].children[0].click();
  assert.equal(app.get('noteText').value,'La chance a chaussé ses petits souliers.');
  app.get('noteText').value='Le grand jour est pour demain.';
  app.dispatch('noteForm','submit');
  app=createInstance(storage);
  assert.equal(JSON.parse(storage.get(key)).notes[0].text,'Le grand jour est pour demain.');
  first=app.get('collectionList').children[0];
  first.children[1].children[1].click();
  app=createInstance(storage);
  assert.equal(app.get('headerCount').textContent,'12','suppression persistante');
});

test('Cas erreur : stockage illisible non écrasé, restauration explicite',()=>{
  const storage=new Map([[key,'{fichier-casse']]);let app=createInstance(storage);
  assert.equal(app.get('storageAlert').hidden,false);
  assert.match(app.get('storageAlertText').textContent,/Sauvegarde illisible/);
  app.get('noteText').value='Un message qui doit rester temporaire.';
  app.dispatch('noteForm','submit');
  assert.match(app.get('toast').textContent,/NON confirmée/);
  assert.equal(storage.get(key),'{fichier-casse','ne pas remplacer silencieusement la donnée cassée');
  app.click('restoreDemo');
  assert.equal(app.get('storageAlert').hidden,true);
  app=createInstance(storage);
  assert.equal(app.get('headerCount').textContent,'12');
  assert.equal(app.get('storageAlert').hidden,true,'restauration relue après actualisation');
});

test('Cas erreur : écriture localStorage bloquée non présentée comme un succès',()=>{
  const storage=new Map();const app=createInstance(storage,{writeError:true});
  app.click('drawButton');
  assert.match(app.get('toast').textContent,/NON confirmée/);
  assert.equal(app.get('storageAlert').hidden,false);
  assert.equal(storage.has(key),false);
});

test('Import JSON valide, état vide et rejet du JSON invalide',async()=>{
  const storage=new Map(); let app=createInstance(storage);
  const content={format:'biscuit-du-jour',version:1,notes:[{id:'test-1',text:'La vie est belle.',recipient:'Lou',source:'perso',createdAt:'2026-11-03T00:00:00.000Z'}]};
  app.get('importNotes').files=[{size:100,text:async()=>JSON.stringify(content)}];
  app.dispatch('importNotes','change');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(app.get('headerCount').textContent,'1');
  app=createInstance(storage);
  assert.equal(app.get('headerCount').textContent,'1','import relu après rechargement');
  const first=app.get('collectionList').children[0];
  first.children[1].children[1].click();
  assert.equal(app.get('drawButton').disabled,true,'aucun tirage possible si boîte vide');
  assert.equal(app.get('collectionEmpty').hidden,false,'état vide visible');
  app.get('importNotes').files=[{size:11,text:async()=>'{invalide'}];
  app.dispatch('importNotes','change');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(app.get('toast').textContent,/Import refusé/);
  assert.equal(JSON.parse(storage.get(key)).notes.length,0,'import invalide sans effet');
});