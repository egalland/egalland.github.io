import test from 'node:test';
import assert from 'node:assert/strict';
import {THEMES,engineNames,normalizeTheme,createThemeManager,glitchEnvelope} from '../portfolio-assets/theme-manager.mjs';
test('Glitch réunit les moteurs et inclura les futurs thèmes compatibles sans doublon',()=>{
 assert.deepEqual(engineNames('points'),['points']);assert.deepEqual(engineNames('glitch'),['points','curseurs']);assert.equal(normalizeTheme('invalid'),'curseurs');
 assert.deepEqual(engineNames('glitch',{...THEMES,extra:{mixable:true,engines:['points','extra']}}),['points','curseurs','extra']);
});
test('une sélection rapide annule le lancement différé du moteur précédent',async()=>{
 let finish;const calls=[],reports=[];
 const m=createThemeManager({apply(){},report:e=>reports.push(e),load:name=>name==='points'?new Promise(resolve=>{finish=resolve;}):Promise.resolve({start:()=>{calls.push('start:curseurs');return{stop:()=>calls.push('stop:curseurs')};}})});
 const stale=m.select('points');await m.select('curseurs');finish({start:()=>{calls.push('start:points');return{stop(){}};}});
 assert.equal(await stale,false);assert.equal(m.current,'curseurs');assert.ok(!calls.includes('start:points'));assert.deepEqual(reports.filter(r=>r.status==='ready').map(r=>r.theme),['curseurs']);m.stop();assert.equal(calls.filter(c=>c==='stop:curseurs').length,1);
});
test('chaque moteur est arrêté une seule fois et reçoit la préférence de mouvement réduit',async()=>{
 const events=[];const m=createThemeManager({apply(){},load:async name=>({start:o=>{events.push(['start',name,o.reduced,o.mode]);return{stop:()=>events.push(['stop',name])};}})});
 await m.select('glitch',{reduced:true});await m.select('points',{reduced:false});m.stop();m.stop();
 assert.deepEqual(events,[['start','points',true,'glitch'],['start','curseurs',true,'glitch'],['stop','curseurs'],['stop','points'],['start','points',false,'points'],['stop','points']]);
});
test('une erreur de démarrage nettoie le mélange et conserve le contenu lisible',async()=>{
 let stopped=0;const appearances=[],reports=[];const m=createThemeManager({apply:t=>appearances.push(t),report:e=>reports.push(e),load:async name=>({start:()=>{if(name==='curseurs')throw Error('failure');return{stop:()=>stopped++};}})});
 assert.equal(await m.select('glitch'),false);assert.equal(stopped,1);assert.equal(m.current,null);assert.deepEqual(appearances,['glitch','curseurs']);assert.equal(reports.at(-1).status,'error');
});
test('les distorsions Glitch sont locales, bornées et espacées',()=>{
 let bursts=0;for(let t=0;t<74;t+=.01){const g=glitchEnvelope(t,.3);assert.ok(g.mix>=.31&&g.mix<=.65);assert.ok(g.burst>=0&&g.burst<=1);assert.ok(Math.abs(g.x)<=2.4);assert.ok(Math.abs(g.y)<=1.4);if(g.burst>0)bursts++;}assert.ok(bursts<400);
});
