import {OBJECTS} from './catalog.js';
import {levelOf,objectLevel} from './model.js';

export function equipmentHeight(s,o) {
  if (o.mountHeight) return o.mountHeight;
  const room = s.rooms.find(r => r.id === o.roomId);
  return room?.h ?? (o.kind === 'beam' || o.kind === 'steelBeam'
    ? Math.max(.2,s.building.h-levelOf(s,objectLevel(s,o)).elevation)
    : levelOf(s,objectLevel(s,o)).height);
}

export function equipmentDetails(s,o,field,line) {
  const item = OBJECTS[o.kind];
  if (item.group === 'ceiling') {
    return '<div class="fields one">'+field('Hauteur de pose · 0 = auto','@mountHeight','m','.1',0,30,o.mountHeight??0)
      +field(o.kind==='pendant'?'Retombée':'Épaisseur','@equipmentHeight','m','.01',.02,3,o.equipmentHeight??item.h)
      +'</div>'+line('Hauteur de pose effective',equipmentHeight(s,o).toLocaleString('fr-FR')+' m');
  }
  if (o.kind === 'pool') {
    const depth=o.equipmentHeight??item.h;
    return '<div class="fields one">'+field('Profondeur de l’eau','@equipmentHeight','m','.05',.2,3,depth)+'</div>'
      +line('Volume d’eau estimé',(o.w*o.l*depth).toLocaleString('fr-FR',{maximumFractionDigits:1})+' m³');
  }
  return '';
}

