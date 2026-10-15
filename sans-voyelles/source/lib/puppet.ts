/** Atlas coordinates are discrete, individually drawn images, never transformed poses. */
export function puppetFrames(time:number,seed:number,reacting=false){
 const frame=Math.floor(time/100);const cycle=((frame+seed)%70+70)%70;
 const eyes=cycle===50||cycle===53?1:cycle===51||cycle===52?2:cycle>=29&&cycle<=35?3:0;
 const mouth=reacting?[0,1,2,3][frame%4]:cycle>=10&&cycle<16?[0,1,2,3,1,0][cycle-10]:0;
 return {body:cycle>=20&&cycle<40?1:cycle>=40&&cycle<60?2:0,eyes,mouth};
}
export function atlasPosition(col:number,row:number,columns:number,rows:number){return {backgroundSize:`${columns*100}% ${rows*100}%`,backgroundPosition:`${columns>1?col/(columns-1)*100:0}% ${rows>1?row/(rows-1)*100:0}%`};}
export function feltColor(color:string){const filters:Record<string,string>={'#d8fc70':'hue-rotate(50deg) saturate(.7) brightness(1.12)','#c8b9ff':'hue-rotate(210deg) saturate(.5) brightness(1.2)','#ffae92':'hue-rotate(-20deg) saturate(.6) brightness(1.18)','#8fe1dd':'hue-rotate(130deg) saturate(.6) brightness(1.12)','#f8d779':'saturate(.85) brightness(1.04)','#ff8eb2':'hue-rotate(290deg) saturate(.65) brightness(1.12)','#80baff':'hue-rotate(165deg) saturate(.7) brightness(1.05)','#f2ede0':'saturate(.16) brightness(1.32)','#bfa1ff':'hue-rotate(215deg) saturate(.75) brightness(1.08)','#b5dd9b':'hue-rotate(65deg) saturate(.45) brightness(1.08)'};return filters[color]||'none';}
