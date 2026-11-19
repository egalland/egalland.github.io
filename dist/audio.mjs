import {TUNES} from './questions.mjs';
let context, voices=[],finishTimer;
export const supported=()=>!!(globalThis.AudioContext||globalThis.webkitAudioContext);
export async function unlock() {
 if(!supported()) throw new Error('Ce navigateur ne permet pas de jouer les mélodies. Essaie un navigateur récent.');
 context??=new (globalThis.AudioContext||globalThis.webkitAudioContext)();
 if(context.state!=='running') await context.resume();
 if(context.state!=='running') throw new Error('Le son est bloqué. Autorise la lecture audio puis réessaie.');
}
export function stop() {clearTimeout(finishTimer);for(const v of voices)try{v.stop();}catch{}voices=[];}
function frequency(note) {
 const [,n,acc,oct]=note.match(/^([A-G])([#b]?)(\d)$/);
 const semitone={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[n]+(acc==='#'?1:acc==='b'?-1:0);
 return 440*2**(((Number(oct)+1)*12+semitone-69)/12);
}
export function playMelody(id,onEnd=()=>{}) {
 stop();const tune=TUNES[id];if(!tune||!context||context.state!=='running')throw new Error('La mélodie n’a pas pu démarrer. Réessaie.');
 let t=context.currentTime+.03;const beat=60/tune.bpm;
 for(const [note,beats] of tune.notes) {
  const duration=beat*beats;
  const osc=context.createOscillator(),gain=context.createGain();
  osc.type='triangle';osc.frequency.value=frequency(note);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.16,t+.015);gain.gain.exponentialRampToValueAtTime(.001,t+duration*.88);
  osc.connect(gain);gain.connect(context.destination);osc.start(t);osc.stop(t+duration);voices.push(osc);t+=duration;
 }
 finishTimer=setTimeout(()=>{voices=[];onEnd();},(t-context.currentTime)*1000);
 return t-context.currentTime;
}
export function cue(good) {
 if(!context||context.state!=='running')return;
 const t=context.currentTime;
 for(const [i,f] of (good?[523.25,659.25,783.99]:[246.94,220]).entries()) {
  const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=f;
  g.gain.setValueAtTime(.045,t+i*.09);g.gain.exponentialRampToValueAtTime(.0001,t+i*.09+.18);o.connect(g);g.connect(context.destination);o.start(t+i*.09);o.stop(t+i*.09+.2);
 }
}
