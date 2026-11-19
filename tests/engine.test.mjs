import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BANK,ROOMS} from '../dist/questions.mjs';
import {buildDeck,pointsFor,isCorrect,textMatches} from '../dist/engine.mjs';
test('Kikalmo speed points respect the 25 second deadline',()=>{
 for(const [ms,score] of [[0,1000],[1000,964],[12500,550],[24999,100],[25000,0],[30000,0],[-1,0]]) assert.equal(pointsFor(ms),score);
 let previous=1000;for(let ms=0;ms<=25000;ms+=20){const n=pointsFor(ms);assert.ok(n<=previous);previous=n;}
});
test('every room draws ten distinct facts and preserves its category and format',()=>{
 for(const room of ROOMS) for(let i=0;i<30;i++){
  const deck=buildDeck(BANK,room);assert.equal(deck.length,10);assert.equal(new Set(deck.map(q=>q.family)).size,10);
  if(room.category!=='general')assert.ok(deck.every(q=>q.category===room.category));
  if(room.format==='qcm')assert.ok(deck.every(q=>q.type==='qcm'));
  if(room.format==='rebus')assert.ok(deck.every(q=>q.type==='rebus'));
  for(const q of deck){if(q.options)assert.ok(q.options.includes(q.answer));if(q.order)assert.deepEqual([...q.order].sort(),[...q.items].sort());}
 }
});
test('the mixed general includes written, QCM, rebus, audio and structured questions',()=>{
 const deck=buildDeck(BANK,ROOMS[0]);for(const type of ['rebus','qcm','emoji','audio','write','intruder','order','match'])assert.ok(deck.some(q=>q.type===type));
});
test('QCM has four unique options and only the keyed option is correct',()=>{
 for(const q of BANK.filter(q=>q.type==='qcm')){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);for(const o of q.options)assert.equal(isCorrect(q,o),o===q.answer);}
});
test('written answers normalize accents, punctuation, ligatures and specified aliases',()=>{
 assert.ok(textMatches('  LE COEUR !!',{answer:'Le cœur'}));
 assert.ok(textMatches('roi lion',{answer:'Le Roi Lion',aliases:['Roi Lion']}));
 assert.ok(textMatches('Spielbrg',{answer:'Spielberg'}));
 assert.equal(textMatches('',{answer:'Jupiter'}),false);
 assert.equal(textMatches('Mars',{answer:'Venus'}),false);
});
test('association and chronology require all entries; numeric tolerance is inclusive',()=>{
 const order={type:'order',items:['A','B','C']};assert.ok(isCorrect(order,['A','B','C']));assert.equal(isCorrect(order,['A','C','B']),false);assert.equal(isCorrect(order,['A']),false);
 const match={type:'match',pairs:[['A','x'],['B','y']]};assert.ok(isCorrect(match,['x','y']));assert.equal(isCorrect(match,['x','x']),false);
 const estimate={type:'estimate',number:206,tolerance:5};assert.ok(isCorrect(estimate,'201'));assert.ok(isCorrect(estimate,'211'));assert.equal(isCorrect(estimate,''),false);assert.equal(isCorrect(estimate,'212'),false);assert.equal(isCorrect(estimate,'inconnu'),false);
});
