export class DesertAudio{
 constructor(){this.enabled=true;this.ctx=null;this.beatClock=0;this.beat=0;this.lastEffects={};}
 async unlock(){if(!this.ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;this.ctx=new Audio();this.master=this.ctx.createGain();this.master.gain.value=.52;const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=8;this.master.connect(limiter);limiter.connect(this.ctx.destination);this.noiseBuffer=this.ctx.createBuffer(1,this.ctx.sampleRate*.4,this.ctx.sampleRate);const data=this.noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);}
  await this.ctx.resume();this.setEnabled(this.enabled);return true;
 }
 setEnabled(on){this.enabled=on;if(this.ctx)this.master.gain.setTargetAtTime(on?.52:0,this.ctx.currentTime,.03);}
 tone(freq=440,type='sine',length=.1,volume=.05,delay=0,end=freq*.6){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const at=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,at);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),at+length);g.gain.setValueAtTime(.0001,at);g.gain.linearRampToValueAtTime(volume,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+length);o.connect(g);g.connect(this.master);o.start(at);o.stop(at+length+.01);}
 noise(length=.1,volume=.06,frequency=1000){if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;const n=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();n.buffer=this.noiseBuffer;f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(volume,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+length);n.connect(f);f.connect(g);g.connect(this.master);n.start();n.stop(this.ctx.currentTime+length);}
 effect(name){if(!this.ctx)return;const now=this.ctx.currentTime,interval={shoot:.065,pickup:.06,gold:.055,hit:.09,kill:.09,stone:.1}[name]||0;if(now-(this.lastEffects[name]??-10)<interval)return;this.lastEffects[name]=now;
  switch(name){
   case 'shoot':this.noise(.045,.045,2500);this.tone(600,'triangle',.035,.023,0,250);break;
   case 'hit':this.noise(.065,.05,1000);break;
   case 'kill':this.tone(160,'triangle',.11,.05,0,55);this.noise(.08,.05,1800);break;
   case 'gold':this.tone(1300,'sine',.13,.065,0,1800);this.tone(1900,'sine',.1,.032,.035,2400);break;
   case 'pickup':this.tone(950,'sine',.07,.035,0,1150);break;
   case 'hurt':this.tone(110,'sawtooth',.19,.07,0,40);this.noise(.16,.09,600);break;
   case 'dash':this.noise(.18,.055,1600);this.tone(220,'triangle',.12,.03,0,60);break;
   case 'level':case 'chosen':for(let i=0;i<4;i++)this.tone([330,440,550,660][i],'triangle',.15,.055,i*.07,700);break;
   case 'chest':for(let i=0;i<6;i++)this.tone([220,330,440,550,660,880][i],'triangle',.25,.075,i*.065,1000);this.noise(.18,.08,1400);break;
   case 'bloom':this.noise(.23,.11,800);this.tone(130,'sine',.25,.09,0,35);break;
   case 'lightning':this.noise(.12,.07,6000);this.tone(1700,'sawtooth',.06,.018,0,300);break;
   case 'ricochet':this.tone(1400,'triangle',.06,.025,0,750);break;
   case 'stone':this.noise(.06,.035,3500);break;
   case 'boss':this.tone(55,'sawtooth',.8,.1,0,35);this.tone(82,'sawtooth',.8,.06,.1,55);break;
   case 'won':for(let i=0;i<6;i++)this.tone([262,330,392,523,659,784][i],'triangle',.4,.08,i*.12,850);break;
   case 'dead':for(let i=0;i<4;i++)this.tone([220,165,110,55][i],'triangle',.3,.06,i*.17,40);break;
  }
 }
 tick(dt,game){if(!this.enabled||!this.ctx||game.status!=='playing')return;this.beatClock-=dt;if(this.beatClock>0)return;this.beatClock=60/(game.bossSpawned?138+game.worldIndex*6:110+game.worldIndex*8)/2;const step=this.beat++%16,bass=[55,55,65.4,55,49,49,65.4,73.4];if(step%2===0)this.tone(bass[Math.floor(step/2)],'triangle',.24,.05,0,bass[Math.floor(step/2)]);if(step%4===0)this.tone(85,'sine',.16,.08,0,35);if(step%4===2)this.noise(.06,.02,1200);if(step%2===1)this.noise(.035,.01,6500);if([0,3,6,10,13].includes(step)){const notes=[220,261.6,293.7,329.6,392];this.tone(notes[(step+Math.floor(this.beat/16))%5],'sine',.28,.025,0,notes[(step+Math.floor(this.beat/16))%5]);}}
}
