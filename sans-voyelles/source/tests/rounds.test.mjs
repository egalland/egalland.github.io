import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const js=ts.transpileModule(readFileSync('lib/game.ts','utf8').replace("import questionBank from './question-bank.json';",'const questionBank='+readFileSync('lib/question-bank.json','utf8')+';'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {fresh,begin,advance,view,roundHint,communicate,submit,QUESTIONS,EMOTES}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const player=(id,now)=>({id,name:id,score:0,seen:now,solved:false,gain:0,tries:0});
const now=100000;let s=fresh();s.players=[player('alice',now),player('bob',now)];begin(s,'cinema',now);s=advance(s,now+5000);assert.equal(s.deadline,now+25000);
assert.equal(view(s,'alice',now+14999).question.clue,undefined);
assert.ok(view(s,'alice',now+15000).question.clue);
assert.equal(view(s,'alice',now+15000).question.answer,undefined);
const answer=QUESTIONS[s.deck[0]].answer;
assert.equal(submit(s,'alice',answer,now+15000),'correct');assert.equal(s.players[0].gain,550);
assert.equal(roundHint({answer:'Cœur',aliases:['coeur'],hint:'Le cœur est un organe',theme:'x',wiki:'x'}),'La première voyelle est « O ».');
for(let i=0;i<10;i++)assert.equal(communicate(s,'alice','message '+i,now+15000),'sent');
const before=s.messages.length;
for(const emoji of EMOTES)assert.equal(communicate(s,'bob',emoji,now+15000,true),'sent');
assert.equal(s.messages.length,before);assert.equal(s.players[1].reaction.text,'🐶');
assert.equal(view(s,'alice',now+19500).players[1].reaction,undefined);
// Winner is recorded on the final reveal, retained across restart and removed on departure.
s.phase='reveal';s.round=10;s.deadline=now+20000;s.players.forEach(p=>p.seen=now+20000);s=advance(s,now+20000);assert.equal(s.phase,'podium');assert.equal(s.deadline,now+80000);assert.equal(s.champion,'alice');assert.equal(view(s,'alice',now+20000).champion,'me');
s.players.forEach(p=>p.seen=now+79999);assert.equal(advance(s,now+79999).phase,'podium');
begin(s,'cinema',now+80000);assert.equal(s.champion,'alice');assert.equal(s.players[0].score,0);
s.players=s.players.filter(p=>p.id!=='alice');assert.equal(advance(s,now+80001).champion,undefined);
s.players=[];assert.equal(advance(s,now+80002).champion,undefined);
// Compatibility: pre-update emoji messages never return as chat history.
s=fresh();s.players=[player('old',now)];s.messages=[{id:'legacy',name:'old',player:'old',text:'👏',kind:'emote',game:'old',round:1,private:false}];assert.deepEqual(view(s,'old',now).messages,[]);
console.log('Passed: 20-second round, server-gated clue at 10 seconds, scaled score, answer-safe clue, unlimited messages/reactions, no emote history, expiry, one-minute podium, persistent champion and departure cleanup.');
