const KNITTED = ['back', 'front', 'sleeve-left', 'sleeve-right', 'collar'];
export const PIECE_IDS = [...KNITTED, 'join-raglans', 'assembly'];
export const emptyPullDesign = () => ({base:{}, edits:{}});
export const emptyPullWork = () => ({piece:'back', done:{}, signature:''});

export function readPullState(p, source) {
  const design = source.pullDesign || {};
  const work = source.pullWork || {};
  p.pullDesign = emptyPullDesign();
  p.pullWork = emptyPullWork();
  let count = 0;
  const validColor = n => Number.isInteger(n) && n >= 0 && n < p.yarns.length;
  for (const id of KNITTED) {
    const base = design.base?.[id];
    if (validColor(base) && base > 0) p.pullDesign.base[id] = base;
    const edits = design.edits?.[id];
    if (!edits) continue;
    if (typeof edits !== 'object' || Array.isArray(edits)) throw Error('Les couleurs du patron sont illisibles.');
    const entries = Object.entries(edits);
    count += entries.length;
    if (count > 250000) throw Error('Le fichier contient trop de retouches individuelles.');
    const clean = {};
    for (const [key,color] of entries) {
      if (!/^\d{1,4}:-?\d{1,4}$/.test(key) || !validColor(color)) throw Error('Une retouche de couleur du pull est invalide.');
      clean[key] = color;
    }
    if (entries.length) p.pullDesign.edits[id] = clean;
  }
  for (const id of PIECE_IDS) {
    const n = work.done?.[id];
    if (Number.isInteger(n) && n > 0 && n <= 15000) p.pullWork.done[id] = n;
  }
  if (PIECE_IDS.includes(work.piece)) p.pullWork.piece = work.piece;
  if (typeof work.signature === 'string') p.pullWork.signature = work.signature.slice(0,1000);
}

export function remapPullColors(p, removed) {
  if (!p.pullDesign) return;
  const remap = v => v === removed ? 0 : v > removed ? v-1 : v;
  for (const id of Object.keys(p.pullDesign.base)) p.pullDesign.base[id] = remap(p.pullDesign.base[id]);
  for (const cells of Object.values(p.pullDesign.edits)) {
    for (const key of Object.keys(cells)) cells[key] = remap(cells[key]);
  }
}

export function editKey(piece, row, col) {
  return row + ':' + (col - Math.floor(piece.width / 2));
}

export function paintPullCell(p, piece, row, col, ink) {
  if (!piece.rows[row]?.spans.some(([left,right]) => col >= left && col <= right)) return false;
  const key = editKey(piece,row,col);
  const edits = p.pullDesign.edits[piece.id];
  if (ink === null) {
    if (!edits || !(key in edits)) return false;
    delete edits[key];
    return true;
  }
  if (edits?.[key] === ink) return false;
  (p.pullDesign.edits[piece.id] ||= {})[key] = ink;
  return true;
}

