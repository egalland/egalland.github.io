import {esc,fmt,euro} from './assets.js';
import {hasNetwork} from './technical.js';
import {openingLevel,openingSegment,objectLevel,objectRect} from './model.js';
import {segmentOnRect,unionArea} from './geometry.js';

export const ACOUSTIC_FIELDS=[
 ['floor','Absorption du sol',.04,.001,1,.01,''],
 ['walls','Absorption des murs',.06,.001,1,.01,''],
 ['ceiling','Absorption du plafond',.12,.001,1,.01,''],
 ['ceilingAfter','Absorption du plafond traité',.55,.001,1,.01,''],
 ['target','Réverbération visée',.6,.1,5,.05,'s'],
 ['wallR','Affaiblissement des murs',40,0,80,1,'dB'],
 ['openingR','Affaiblissement des portes et fenêtres',25,0,80,1,'dB']
];

export function normalizeAcoustic(raw){
 return Object.fromEntries(ACOUSTIC_FIELDS.map(([key,,fallback,min,max])=>{
  const value=raw?.[key];
  return [key,value!=null&&value!==''&&Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback];
 }));
}

export function roomComfort(s,room){
 const L=s.light,A=s.acoustic||normalizeAcoustic(),floor=room.area,walls=2*(room.w+room.l)*room.h,volume=floor*room.h;
 const source=room.lux*floor/L.factor;
 const recommended=Math.ceil(source/L.lumens-1e-9);
 const inRoom=(x,y)=>x>=room.x&&x<room.x+room.w&&y>=room.y&&y<room.y+room.l;
 const points=s.technical.points.filter(p=>p.levelId===room.levelId&&p.kind==='light'&&hasNetwork(p,'electric')&&inRoom(p.x,p.y));
 const drawn=s.objects.filter(o=>{
  if(!['spot','pendant'].includes(o.kind)||objectLevel(s,o)!==room.levelId)return false;
  if(o.roomId)return o.roomId===room.id;
  const rect=objectRect(s,o);
  return inRoom(rect.x+rect.w/2,rect.y+rect.l/2);
 });
 const linked=new Set(drawn.map(o=>o.id));
 const lighting=drawn.length+points.filter(p=>!linked.has(p.source)).length;
 const plannedLux=floor?lighting*L.lumens*L.factor/floor:0;
 const verticalWalls=s.openings.reduce((groups,o)=>{
  if(openingLevel(s,o)!==room.levelId)return groups;
  const seg=openingSegment(s,o),length=segmentOnRect(seg,room),height=Math.min(room.h,o.sill+o.h)-o.sill;
  if(length<=0||height<=0)return groups;
  const horizontal=seg.y1===seg.y2,side=horizontal?'h'+seg.y1:'v'+seg.x1;
  const collection=groups.get(side)||[];
  collection.push({x:Math.max(horizontal?seg.x1:seg.y1,horizontal?room.x:room.y),y:o.sill,w:length,l:height});
  groups.set(side,collection);
  return groups;
 },new Map());
 const openings=Math.min(walls,[...verticalWalls.values()].reduce((sum,patches)=>sum+unionArea(patches),0));
 const absorption=floor*A.floor+walls*A.walls+floor*A.ceiling,after=absorption+floor*(A.ceilingAfter-A.ceiling);
 const rt=(area)=>area>0?.161*volume/area:0;
 const transmission=((walls-openings)*10**(-A.wallR/10)+openings*10**(-A.openingR/10))/walls;
 return {source,recommended,lighting,plannedLux,volume,absorption,rt:rt(absorption),after:rt(after),extra:Math.max(0,.161*volume/A.target-absorption),soundReduction:-10*Math.log10(transmission),openings};
}

const readout=(pairs)=>'<div class="comfort-readout">'+pairs.map(([name,value])=>'<div><span>'+name+'</span><strong>'+value+'</strong></div>').join('')+'</div>';
const m2=v=>fmt(v,1)+' m²';
const quantity=(v,u,d=0)=>fmt(v,d)+' '+u;

export function comfortScreen(s,C,tab,roomId){
 const room=C.roomRows.find(r=>r.id===roomId);
 const info=room?roomComfort(s,room):null;
 const tabs='<div class="tech-tabs">'+[['light','Éclairage'],['thermal','Isolation'],['sound','Acoustique']].map(([k,label])=>'<button class="btn '+(k===tab?'primary':'')+'" data-comfort-tab="'+k+'" aria-pressed="'+(k===tab)+'">'+label+'</button>').join('')+'</div>';
 const picker=tab==='thermal'?'':(room?'<label class="field"><span>Pièce étudiée</span><select id="comfort-room">'+C.roomRows.map(r=>'<option value="'+esc(r.id)+'" '+(r.id===room.id?'selected':'')+'>'+esc(r.name+' · '+(s.levels.find(l=>l.id===r.levelId)?.name||''))+'</option>').join('')+'</select></label>':'<p>Ajoute une pièce pour calculer son bilan.</p>');
 let body='';
 if(tab==='light'){
  if(info)body=readout([['Flux à installer',quantity(info.source,'lm')],['Luminaires estimés',fmt(info.recommended)],['Éclairement simulé du plan',quantity(info.plannedLux,'lx')],['Objectif de la pièce',quantity(room.lux,'lx')]])
   +'<p>'+info.lighting+' luminaire(s) dessiné(s) ou point(s) prévus · '+quantity(s.light.lumens,'lm')+' par luminaire · facteur utile '+fmt(s.light.factor,2)+'. Le calcul donne un éclairement moyen.</p>';
  body+='<h3>Ensemble du projet</h3>'+readout([['Luminaires à prévoir',fmt(C.homeFixtures+C.shopFixtures)],['Puissance d’éclairage',quantity(C.watts,'W')],['Consommation annuelle',quantity(C.kwh,'kWh')],['Coût annuel',euro(C.energy)]]);
 }
 if(tab==='thermal'){
  body='<h3>'+ (s.thermal.scope==='all'?'Bâtiment entier':'Pièces habitables')+'</h3>'+readout([['Déperditions estimées',quantity(C.heat/1000,'kW',2)],['Budget de l’isolant',euro(C.materials)]])
   +'<div class="comfort-table"><table><thead><tr><th>Paroi</th><th>Surface</th><th>R <small>m²·K/W</small></th><th>U <small>W/(m²·K)</small></th></tr></thead><tbody>'+[['Murs',C.walls],['Plafond',C.roof],['Sol',C.floor]].map(([label,value],i)=>'<tr><th scope="row">'+label+'</th><td>'+m2(value)+'</td><td>'+fmt(C.Rs[i],2)+'</td><td>'+fmt(1/(C.Rs[i]+[.17,.14,.17][i]),2)+'</td></tr>').join('')+'</tbody></table></div><p>Simulation à '+quantity(s.thermal.inside,'°C')+' à l’intérieur et '+quantity(s.thermal.outside,'°C')+' à l’extérieur. U inclut les résistances superficielles retenues par le calcul.</p>';
 }
 if(tab==='sound'&&info){
  body=readout([['Réverbération actuelle',quantity(info.rt,'s',2)],['Avec plafond traité',quantity(info.after,'s',2)],['Absorption à ajouter pour la cible',quantity(info.extra,'m² équiv.',1)],['Affaiblissement estimé des parois verticales',quantity(info.soundReduction,'dB',1)]])
   +'<p>Réverbération selon Sabine, avec '+quantity(info.volume,'m³',1)+' de volume. L’affaiblissement combine murs et ouvertures, avec '+m2(info.openings)+' d’ouvertures. Il suppose des parois fermées et ne modélise ni les fuites ni les transmissions indirectes.</p>'
   +'<form id="acoustic-form"><div class="fields">'+ACOUSTIC_FIELDS.map(([k,label,,min,max,,unit])=>'<label class="field"><span>'+label+(unit?' ('+unit+')':' (α)')+'</span><input name="'+k+'" type="number" value="'+s.acoustic[k]+'" min="'+min+'" max="'+max+'" step="any" required></label>').join('')+'</div><button class="btn primary full" type="submit">Recalculer</button></form><p class="tech-note">Les valeurs d’absorption et d’affaiblissement sont des hypothèses à remplacer par celles de tes matériaux ou des mesures.</p>';
 }
 return tabs+picker+body+(tab!=='sound'?'<button class="btn full" data-comfort-settings="'+tab+'">Modifier les hypothèses de '+(tab==='light'?'l’éclairage':'l’isolation')+'</button>':'');
}
