export const PART_RECTS=[[57,29,236,280],[363,61,215,219],[677,61,214,219],[975,124,236,177],[36,365,278,241],[314,378,274,218],[707,340,161,273],[1000,338,185,272],[92,645,180,271],[353,659,221,237],[627,700,301,187],[960,638,270,302],[39,952,275,254],[314,948,294,259],[695,985,183,187],[980,940,227,293]];
import {ASSET_RECTS,BODY_JOINTS} from './asset-rects.mjs?v=4';
const WALK_FRAMES=[0,1,2,1,3,4,4,5,0,1,2,1,3,4,4,5];
export function cactusPose(game,t,reduced=false){
 const p=game.player,c=game.character(),row=c.row,branch=game.branchCount(),health=game.count('health'),walking=game.status==='playing'&&p.moving;
 const phase=(p.hopPhase||0)%1,hop=reduced?0:Math.floor(phase*16),attacking=(p.attackTime||0)>0;
 const frame=attacking?(p.attackTime>.2?6:7):walking&&!reduced?WALK_FRAMES[hop]:0;
 const index=row*8+frame,rect=ASSET_RECTS['player-motion'][index],idle=ASSET_RECTS['player-motion'][row*8];
 const baseW=[32,43,44,30][row]+branch*3+health,baseH=[55,49,52,57][row]+branch*4+health;
 const bodyW=baseW*Math.max(.9,Math.min(1.22,rect[2]/idle[2])),bodyH=baseH*Math.max(.8,Math.min(1.12,rect[3]/idle[3]));
 const scale=1+Math.min(.18,branch*.025+health*.01),bob=reduced?0:walking?-Math.sin(phase*Math.PI)*9:Math.sin(t*2)*.8;
 const attackKick=attacking?(frame===6?-.1:.13):0,lean=reduced?0:attacking?(frame===6?-.04:.04):walking?Math.sin(phase*Math.PI*2)*.025:0;
 const parts=[],add=(atlas,index,x,y,w,h,angle=0,ax=.5,ay=.5)=>parts.push({atlas,index,x,y,w,h,angle,ax,ay});
 const armor=game.item('armor')+game.item('shell')+game.item('anchor'),crystal=game.item('prism')+game.item('quartz')+game.item('ice'),spines=game.item('barbs')+game.item('thorns');
 const armFamily=spines?6:crystal?4:armor?2:0,armCount=1+branch;
 if(game.item('feather')||game.item('wings'))add('modular',8,baseW*.57,-bodyH*.55,16,30,-.4);
 if(game.item('mushroom'))add('variants',15,-baseW*.3,-bodyH*.64,16,18,-.12);
 for(let i=0;i<armCount;i++){
  const side=i%2?1:-1,rank=Math.floor(i/2),joint=BODY_JOINTS[index],anchorX=(joint[side<0?0:1]-.5)*bodyW,anchorY=-bodyH*(1-joint[2])-rank*7;
  add('variants',armFamily+(side>0?1:0),anchorX,anchorY,22+branch*1.8,29+branch*1.8,side*(attackKick-rank*.14+(walking?Math.sin(phase*Math.PI*2)*.025:0)),side<0?.8:.2,.8);
 }
 add('players',index,0,-bodyH/2,bodyW,bodyH);
 // Small accessories attach to named body slots. The armor is a masked skin material, never a floating plate.
 const beltY=-bodyH*.19;
 if(game.item('pouch')||game.item('lucky'))add('modular',5,bodyW*.32,beltY,13,15,.04);
 if(game.item('sap')||game.item('crown'))add('modular',9,-bodyW*.34,beltY,12,15,-.04);
 if(game.item('prism')||game.item('lens')||game.item('moon'))add('modular',6,-bodyW*.17,-bodyH*.32,9,13);
 if(game.item('storm')||game.item('battery'))add('modular',7,bodyW*.17,-bodyH*.32,10,13);
 if(game.item('sun')||game.item('lantern'))add('modular',11,0,-bodyH+8,bodyW*.72,17);
 if(game.item('petals')||game.count('flower')||game.item('blossom')||game.item('clover'))add('modular',10,0,-bodyH+1,bodyW*.75,15);
 if(game.item('ice'))add('variants',14,-bodyW*.25,-bodyH+4,16,16,-.1);
 if(game.item('chili'))add('variants',13,bodyW*.34,-bodyH*.52,10,18,.1);
 if(game.item('venom'))add('variants',15,-bodyW*.35,-bodyH*.4,9,11);
 if(game.count('roots')||game.item('anchor'))add('modular',15,-bodyW*.2,-3,16,15,.2);
 // Relics stay pinned inside the torso, and coexist in a compact set of body slots.
 const relics=Object.entries(game.items).filter(([id,n])=>n&&['heart','bubble','boomerang','bomb','mirror','comet','bell','fang','vine','hourglass','bud','boots','drill','bee','cube','meteor','satellite','spore','serpent','geyser','scarab','rage','dice','teleport'].includes(id));
 const ids=['heart','bubble','boomerang','bomb','mirror','comet','bell','fang','vine','hourglass','bud','boots','drill','bee','cube','meteor','satellite','spore','serpent','geyser','scarab','rage','dice','teleport'];
 relics.forEach(([id,n],i)=>{const cols=Math.min(3,relics.length),rows=Math.ceil(relics.length/cols),size=Math.min(10,bodyW*.2,bodyH*.32/rows);add('relics',ids.indexOf(id),((i%cols)-(cols-1)/2)*(size+1),-bodyH*.28+Math.floor(i/cols)*(size+1),size,size);});
 const spellArts={meteor:15,bubble:1,boomerang:2,geyser:19,vine:8,comet:5,nova:20,ward:11};Object.entries(spellArts).filter(([id])=>game.count(id)).forEach(([id,art],i)=>add('relics',art,(i%2?1:-1)*bodyW*.18,-bodyH*.55-Math.floor(i/2)*4,7,7));
 return {parts,scale,bob,lean,bodyH,bodyW,armCount,frame,armor,crystal,spines,body:{index,w:bodyW,h:bodyH}};
}
