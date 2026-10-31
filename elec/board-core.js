export const usedModules = row => row.reduce((n, d) => n + d.modules, 0);

export function insertionIndex(row, modulePosition) {
  let slot = 0;
  for (let i = 0; i < row.length; i++) {
    if (modulePosition < slot + row[i].modules / 2) return i;
    slot += row[i].modules;
  }
  return row.length;
}

export function moveDevice(rows, id, targetRow, modulePosition) {
  if (!Number.isInteger(targetRow) || targetRow < 0 || targetRow > 3 || !Number.isFinite(modulePosition)) return {error:'Dépose l’appareil sur une des quatre rangées.'};
  const from = rows.findIndex(row => row.some(d => d.id === id));
  if (from < 0) return {error:'Appareil introuvable.'};
  const device = rows[from].find(d => d.id === id);
  const next = rows.map(row => row.filter(d => d.id !== id));
  if (usedModules(next[targetRow]) + device.modules > 13) return {error:'Pas assez de modules libres sur cette rangée.'};
  const index = insertionIndex(next[targetRow], modulePosition);
  next[targetRow].splice(index, 0, device);
  const unchanged = next.every((row,r)=>row.length===rows[r].length && row.every((d,i)=>d.id===rows[r][i].id));
  return {rows:next,index,from,unchanged};
}

export function combGroups(row) {
  const groups = [];
  let group = null;
  for (const d of row) {
    if (d.cat === 'id') { group = {id:d,devices:[]}; groups.push(group); }
    else if (d.cat === 'breaker' && !['3P','4P'].includes(d.poles) && group) group.devices.push(d);
    else group = null;
  }
  return groups.filter(g=>g.devices.length);
}
