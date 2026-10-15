/** Small synthesized character reactions; uses the game's sound toggle. */
export const EMOTE_OPTIONS=['👏','😂','🤔','🔥','🎉','❤️','👍','👎','🦆','🐶'] as const;
export function messageTime(at?:number){return at===undefined?'--:--:--':new Date(at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});}
export function playEmoteSound(ac:AudioContext,emoji:string){
 const start=ac.currentTime;
 function note(hz:number,to:number,delay:number,duration:number,type:OscillatorType='sine',volume=.04){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(hz,start+delay);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),start+delay+duration);g.gain.setValueAtTime(.001,start+delay);g.gain.linearRampToValueAtTime(volume,start+delay+.008);g.gain.exponentialRampToValueAtTime(.001,start+delay+duration);o.connect(g);g.connect(ac.destination);o.start(start+delay);o.stop(start+delay+duration+.01);o.onended=()=>{o.disconnect();g.disconnect();};}
 function noise(delay:number,duration:number,frequency:number){const buffer=ac.createBuffer(1,Math.ceil(ac.sampleRate*duration),ac.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=ac.createBufferSource(),filter=ac.createBiquadFilter(),g=ac.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;g.gain.setValueAtTime(.07,start+delay);g.gain.exponentialRampToValueAtTime(.001,start+delay+duration);source.connect(filter);filter.connect(g);g.connect(ac.destination);source.start(start+delay);source.stop(start+delay+duration);source.onended=()=>{source.disconnect();filter.disconnect();g.disconnect();};}
 switch(emoji){
 case '👏':for(let i=0;i<3;i++)noise(i*.13,.09,1800);break;
 case '😂':for(let i=0;i<4;i++)note(650-i*55,350-i*25,i*.12,.09,'triangle');break;
 case '🤔':note(220,320,0,.45,'triangle');break;
 case '🔥':for(let i=0;i<5;i++)noise(i*.07,.06,800+i*650);break;
 case '🎉':[523,659,784,1047].forEach((f,i)=>note(f,f,i*.08,.18,'square',.018));break;
 case '❤️':note(95,55,0,.14,'sine',.09);note(115,65,.19,.18,'sine',.08);break;
 case '👍':note(440,660,0,.16,'sine');note(660,880,.14,.18,'sine');break;
 case '👎':note(400,230,0,.2,'triangle');note(230,110,.17,.24,'triangle');break;
 case '🦆':for(let i=0;i<2;i++){note(430,250,i*.22,.16,'sawtooth',.025);noise(i*.22,.09,1100);}break;
 case '🐶':for(let i=0;i<2;i++){note(180,65,i*.25,.13,'sawtooth',.045);noise(i*.25,.12,450);}break;
 }
}
