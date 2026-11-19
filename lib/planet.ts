/** A generated solid cube. Only excavated voxels need persistent storage. */
export const SIDE = 4_096;
export const CELL = 32;
export const REGION_SIZE = 17;
export const FACE_ORDER = ['top', 'bottom', 'north', 'south', 'east', 'west'] as const;
export type Face = (typeof FACE_ORDER)[number];
export type Point = { x: number; y: number; z: number };
export type Focus = { face: Face; u: number; v: number; depth?: number };
export type Ore = 'ferrite' | 'cuivre' | 'titane' | 'prisme';

const EDGE = SIDE - 1;
const LAST_CHUNK = SIDE / CELL - 1;
const NEIGHBORS: Point[] = [
  { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
];
export const defaultFocus: Focus = { face: 'top', u: SIDE / 2, v: SIDE / 2, depth: 0 };

export type ChunkEdits = { removed: Record<number, number>; count: number };
export type Base = { home: Point; parcels: Point[] };
export type PlanetState = {
  seed: number;
  bases: Record<string, Base>;
  chunks: Record<string, ChunkEdits>;
};
export function createPlanet(seed = 1872): PlanetState {
  return { seed, bases: {}, chunks: {} };
}

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y && a.z === b.z;
const offset = (p: Point, d: Point): Point => ({ x: p.x + d.x, y: p.y + d.y, z: p.z + d.z });
const inRange = (n: unknown, max: number): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max;
function validXYZ(value: unknown, max: number): value is Point {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Point>;
  return inRange(p.x, max) && inRange(p.y, max) && inRange(p.z, max);
}
export const validPoint = (p: unknown): p is Point => validXYZ(p, EDGE);
export const validChunk = (p: unknown): p is Point => validXYZ(p, LAST_CHUNK);
export function normalizeFocus(value: unknown): Focus | null {
  if (!value || typeof value !== 'object') return null;
  const f = value as Partial<Focus>;
  if (!FACE_ORDER.includes(f.face as Face) || !inRange(f.u, EDGE) || !inRange(f.v, EDGE)
      || (f.depth !== undefined && !inRange(f.depth, EDGE))) return null;
  return { face: f.face!, u: f.u, v: f.v, depth: f.depth ?? 0 };
}

export function facePoint(face: Face, u: number, v: number, depth = 0): Point {
  switch (face) {
    case 'top': return { x: u, y: EDGE - depth, z: v };
    case 'bottom': return { x: u, y: depth, z: EDGE - v };
    case 'north': return { x: EDGE - u, y: EDGE - v, z: depth };
    case 'south': return { x: u, y: EDGE - v, z: EDGE - depth };
    case 'east': return { x: EDGE - depth, y: EDGE - v, z: EDGE - u };
    case 'west': return { x: depth, y: EDGE - v, z: u };
  }
}
export function pointOnFace(face: Face, p: Point): Focus & { depth: number } {
  switch (face) {
    case 'top': return { face, u: p.x, v: p.z, depth: EDGE - p.y };
    case 'bottom': return { face, u: p.x, v: EDGE - p.z, depth: p.y };
    case 'north': return { face, u: EDGE - p.x, v: EDGE - p.y, depth: p.z };
    case 'south': return { face, u: p.x, v: EDGE - p.y, depth: EDGE - p.z };
    case 'east': return { face, u: EDGE - p.z, v: EDGE - p.y, depth: EDGE - p.x };
    case 'west': return { face, u: p.z, v: EDGE - p.y, depth: p.x };
  }
}

export const chunkAt = (p: Point): Point => ({ x: p.x >> 5, y: p.y >> 5, z: p.z >> 5 });
export const chunkKey = (p: Point) => `${p.x},${p.y},${p.z}`;
function chunkRange(a: Point, b: Point): string[] {
  const keys: string[] = [];
  for (let x = Math.max(0, Math.min(a.x, b.x)); x <= Math.min(LAST_CHUNK, Math.max(a.x, b.x)); x++) {
    for (let y = Math.max(0, Math.min(a.y, b.y)); y <= Math.min(LAST_CHUNK, Math.max(a.y, b.y)); y++) {
      for (let z = Math.max(0, Math.min(a.z, b.z)); z <= Math.min(LAST_CHUNK, Math.max(a.z, b.z)); z++) {
        keys.push(chunkKey({ x, y, z }));
      }
    }
  }
  return keys;
}
export function keysAround(p: Point, radiusChunks = 1): string[] {
  const c = chunkAt(p);
  return chunkRange({x:c.x-radiusChunks,y:c.y-radiusChunks,z:c.z-radiusChunks},
    {x:c.x+radiusChunks,y:c.y+radiusChunks,z:c.z+radiusChunks});
}
const dirty = new WeakMap<PlanetState, Set<string>>();
export const dirtyChunks = (s: PlanetState): string[] => Array.from(dirty.get(s) ?? []);

const localIndex = (p: Point) => (p.x & 31) + (p.y & 31) * CELL + (p.z & 31) * CELL * CELL;
export function isRemoved(s: PlanetState, p: Point): boolean {
  const chunk = s.chunks[chunkKey(chunkAt(p))];
  if (!chunk) return false;
  const i = localIndex(p);
  return Boolean((chunk.removed[i >>> 5] ?? 0) & (1 << (i & 31)));
}
/** A cell becomes visible only at the planetary skin or next to excavated air. */
export function isExposed(s: PlanetState, p: Point): boolean {
  if (!validPoint(p)) return false;
  return NEIGHBORS.some(d => {
    const q = offset(p, d);
    return !validPoint(q) || isRemoved(s, q);
  });
}
function excavate(s: PlanetState, p: Point) {
  const key = chunkKey(chunkAt(p));
  const c = s.chunks[key] ??= { removed: {}, count: 0 };
  const i = localIndex(p), word = i >>> 5;
  c.removed[word] = ((c.removed[word] ?? 0) | (1 << (i & 31))) >>> 0;
  c.count++;
  if (!dirty.has(s)) dirty.set(s, new Set());
  dirty.get(s)!.add(key);
}

function noise(seed: number, x: number, y: number, z: number) {
  let h = seed ^ Math.imul(x + 13, 73856093) ^ Math.imul(y + 19, 19349663) ^ Math.imul(z + 31, 83492791);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 0x1_0000_0000;
}
function stoneNoise(seed: number, p: Point, scale: number) {
  const x = Math.floor(p.x / scale), y = Math.floor(p.y / scale), z = Math.floor(p.z / scale);
  const t = (v: number) => { const f = (v % scale) / scale; return f * f * (3 - 2 * f); };
  const a = t(p.x), b = t(p.y), c = t(p.z);
  const mix = (v: number, w: number, k: number) => v + (w - v) * k;
  function slice(k: number) {
    return mix(mix(noise(seed,x,y,k),noise(seed,x+1,y,k),a),
      mix(noise(seed,x,y+1,k),noise(seed,x+1,y+1,k),a),b);
  }
  return mix(slice(z), slice(z + 1), c);
}

// Optical survey maps only the planet's exterior. These exposed crystal fields
// have their own geology; their positions say nothing about buried ore or bases.
const PRISM_DISTRICT = 256;
const PRISM_MARGIN = 18;
export type PrismOutcrop = { face:Face; u:number; v:number; depth:0; angle:number; length:number; width:number };

function prismField(face:Face, x:number, y:number):PrismOutcrop {
  const faceIndex = FACE_ORDER.indexOf(face);
  const sample = (channel:number) => noise(0x44ad5, x, y, faceIndex * 8 + channel);
  const spread = PRISM_DISTRICT - 2 * PRISM_MARGIN;
  return {
    face, depth:0,
    u:x * PRISM_DISTRICT + PRISM_MARGIN + Math.floor(spread * sample(0)),
    v:y * PRISM_DISTRICT + PRISM_MARGIN + Math.floor(spread * sample(1)),
    angle:sample(2) * Math.PI, length:2.6 + 1.9 * sample(3), width:.82 + .64 * sample(4),
  };
}

/** Geological signatures visible on the regional survey, including worked sites. */
export function prismOutcropsIn(face:Face, uMin:number, vMin:number, uMax:number, vMax:number):PrismOutcrop[] {
  const fields:PrismOutcrop[] = [];
  const x0=Math.max(0,Math.floor(uMin/PRISM_DISTRICT)), x1=Math.min(SIDE/PRISM_DISTRICT-1,Math.floor(uMax/PRISM_DISTRICT));
  const y0=Math.max(0,Math.floor(vMin/PRISM_DISTRICT)), y1=Math.min(SIDE/PRISM_DISTRICT-1,Math.floor(vMax/PRISM_DISTRICT));
  for (let y=y0;y<=y1;y++) for (let x=x0;x<=x1;x++) {
    const field = prismField(face,x,y);
    if (field.u>=uMin && field.u<=uMax && field.v>=vMin && field.v<=vMax) fields.push(field);
  }
  return fields;
}

export function nearestPrismOutcrop(focus:Focus, skipCurrent=false):Focus {
  // The district containing this point always has a field inside this radius.
  const radius = skipCurrent ? 2*PRISM_DISTRICT : Math.ceil(Math.SQRT2 * PRISM_DISTRICT);
  const fields = prismOutcropsIn(focus.face,focus.u-radius,focus.v-radius,focus.u+radius,focus.v+radius)
    .filter(f=>!skipCurrent || Math.hypot(f.u-focus.u,f.v-focus.v)>8);
  const best = fields.reduce((a,b) => Math.hypot(a.u-focus.u,a.v-focus.v) <= Math.hypot(b.u-focus.u,b.v-focus.v) ? a : b);
  return {face:best.face,u:best.u,v:best.v,depth:0};
}

function prismAtSurface(point:Point):boolean {
  const face:Face = point.y===EDGE?'top':point.y===0?'bottom':point.z===0?'north':
    point.z===EDGE?'south':point.x===EDGE?'east':'west';
  const {u,v} = pointOnFace(face,point);
  const field = prismField(face,Math.floor(u/PRISM_DISTRICT),Math.floor(v/PRISM_DISTRICT));
  const du=u-field.u, dv=v-field.v;
  if (Math.abs(du)>5 || Math.abs(dv)>5) return false;
  const along = du*Math.cos(field.angle)+dv*Math.sin(field.angle);
  const across = dv*Math.cos(field.angle)-du*Math.sin(field.angle);
  return (along/field.length)**2 + (across/field.width)**2 <= 1;
}
/** Sampled only for exposed solids in player responses. The same XYZ has the same ore from all six faces. */
export function oreAt(s: Pick<PlanetState, 'seed'>, p: Point): Ore {
  const depth = Math.min(p.x,p.y,p.z,EDGE-p.x,EDGE-p.y,EDGE-p.z);
  if (depth===0 && prismAtSurface(p)) return 'prisme';
  const grain = stoneNoise(s.seed, p, 5);
  const seam = stoneNoise(s.seed ^ 9437, p, 19);
  if (grain > .86 && seam > .74 && depth >= 5) return 'prisme';
  if (grain > .76 && seam > .59 - Math.min(depth, 100) * .0008) return 'titane';
  if (seam * .52 + grain * .48 > .67 - Math.min(depth, 100) * .00045) return 'cuivre';
  return 'ferrite';
}

export function relayFocus(index: number): Focus {
  const idx = Math.max(0, Math.min(5, Math.floor(index)));
  const u = [0.37, 0.57, 0.42, 0.63, 0.31, 0.67][idx];
  const v = [0.57, 0.32, 0.68, 0.41, 0.46, 0.64][idx];
  return {face:FACE_ORDER[idx],u:Math.floor(u*SIDE),v:Math.floor(v*SIDE),depth:0};
}
const reserved = new Set(FACE_ORDER.map((_, i) => {
  const f = relayFocus(i);
  return chunkKey(chunkAt(facePoint(f.face,f.u,f.v)));
}));

const owners = new WeakMap<PlanetState, Map<string,string>>();
function ownership(s: PlanetState) {
  let index = owners.get(s);
  if (!index) {
    index = new Map();
    for (const [id,base] of Object.entries(s.bases)) {
      for (const parcel of base.parcels) index.set(chunkKey(parcel),id);
    }
    owners.set(s,index);
  }
  return index;
}
export const territoryOwner = (s: PlanetState, chunk: Point): string | null => ownership(s).get(chunkKey(chunk)) ?? null;

// Each market serves nine separate landing areas. Keeping the offsets in chunks
// leaves room for factories and makes neighboring trade routes meet in town.
const districtWidth = SIDE / 2;
const landingOffsets = [[24,0],[18,15],[4,24],[-12,21],[-23,8],[-23,-8],[-12,-21],[4,-24],[18,-15]];
export const marketDistricts = FACE_ORDER.flatMap((face, faceIndex) =>
  Array.from({length:4}, (_, index) => {
    const column = index % 2, row = Math.floor(index / 2);
    const u = (column + .5) * districtWidth, v = (row + .5) * districtWidth;
    const shift = (axis:number) => (Math.floor(noise(1872,column,row,faceIndex * 2 + axis) * 5) - 2) * CELL;
    const market = {face, u:u + shift(0), v:v + shift(1), depth:0 as const};
    const sites = landingOffsets.map(([du,dv]) => chunkAt(facePoint(face,u + du * CELL,v + dv * CELL)));
    return {face,column,row,market,sites};
  })
);
function landingSite(s:PlanetState, hash:number):Point | undefined {
  const homes = Object.values(s.bases).map(base => parcelFocus(base.home));
  const positions = homes.map(h => facePoint(h.face,h.u,h.v));
  const nearest = (point:Point) => positions.length ? Math.min(...positions.map(p =>
    (point.x-p.x)**2 + (point.y-p.y)**2 + (point.z-p.z)**2)) : 0;
  const districts = marketDistricts.map((district, index) => {
    const {face,column,row,market,sites} = district;
    return {
      sites:sites.filter(p => !territoryOwner(s,p) && !reserved.has(chunkKey(p))),
      camps:homes.filter(h => h.face===face && Math.floor(h.u/districtWidth)===column && Math.floor(h.v/districtWidth)===row).length,
      distance:nearest(facePoint(face,market.u,market.v)), tie:noise(hash,index,0,0)
    };
  }).filter(d => d.sites.length);
  // Fill an inhabited district first. When it fills, expand into a nearby one.
  districts.sort((a,b) => b.camps-a.camps || a.distance-b.distance || a.tie-b.tie);
  const sites = districts[0]?.sites ?? [];
  const landing = sites.map((site,index) => {
    const h = parcelFocus(site);
    return {site,distance:nearest(facePoint(h.face,h.u,h.v)),tie:noise(hash,index,1,0)};
  }).sort((a,b) => a.distance-b.distance || a.tie-b.tie)[0]?.site;
  if (landing) return {...landing};
  // A heavily expanded world can have claimed all designated landing parcels.
  for (let attempt = 0; attempt < 4096; attempt++) {
    const face = FACE_ORDER[Math.floor(noise(hash,attempt,0,1)*6)];
    const u = Math.floor((6 + noise(hash,attempt,1,4)*(LAST_CHUNK-11))*CELL);
    const v = Math.floor((6 + noise(hash,attempt,2,8)*(LAST_CHUNK-11))*CELL);
    const candidate = chunkAt(facePoint(face,u,v));
    const h = parcelFocus(candidate);
    if (!territoryOwner(s,candidate) && !reserved.has(chunkKey(candidate)) && nearest(facePoint(h.face,h.u,h.v))>=500**2) return candidate;
  }
}
export function ensureBase(s: PlanetState, id: string, placementEntropy = id): Base {
  if (Object.hasOwn(s.bases,id)) return s.bases[id];
  let hash = s.seed;
  for (const ch of placementEntropy) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  const home = landingSite(s,hash);
  if (!home) throw Error('Aucun emplacement libre pour cette base.');
  const base = s.bases[id] = {home,parcels:[home]};
  ownership(s).set(chunkKey(home),id);
  return base;
}
export function parcelFocus(cp: Point, preferredFace?: Face): Focus & {depth: number} {
  const center = {x:cp.x*CELL+16,y:cp.y*CELL+16,z:cp.z*CELL+16};
  const faces = preferredFace ? [preferredFace,...FACE_ORDER.filter(f=>f!==preferredFace)] : FACE_ORDER;
  let f = pointOnFace(faces[0],center);
  for (const face of faces.slice(1)) {
    const next = pointOnFace(face,center);
    if (Math.floor(next.depth/CELL)<Math.floor(f.depth/CELL)) f = next;
  }
  // At the skin, show the outside of the chunk rather than its buried center.
  return { ...f, depth: f.depth < CELL ? 0 : f.depth };
}
export function homePoint(s: PlanetState,id: string): Point {
  const f = parcelFocus(ensureBase(s,id).home);
  return facePoint(f.face,f.u,f.v,f.depth);
}
export function homeFocus(s: PlanetState,id: string): Focus {
  return parcelFocus(ensureBase(s,id).home);
}
export function extendPrice(base: Base): number {
  return Math.ceil(320 * Math.pow(base.parcels.length, 1.6));
}
export function expandTerritory(s: PlanetState,p: {id:string;coins:number},chunk: unknown) {
  if (!validChunk(chunk)) throw Error('Parcelle hors de la planète.');
  const base = ensureBase(s,p.id);
  if (reserved.has(chunkKey(chunk))) throw Error('Un relais public occupe cette parcelle.');
  const attached = NEIGHBORS.some(d => territoryOwner(s,offset(chunk,d))===p.id);
  if (!attached) throw Error('La parcelle doit partager une face avec votre territoire.');
  if (territoryOwner(s,chunk)) throw Error('Cette parcelle est déjà occupée.');
  const cost = extendPrice(base);
  if (p.coins < cost) throw Error('Crédits insuffisants pour cette extension.');
  p.coins -= cost;
  base.parcels.push({...chunk});
  ownership(s).set(chunkKey(chunk),p.id);
  return {message:'Parcelle rattachée à la base.',cost};
}
function protection(s: PlanetState,id: string,p: Point): string | null {
  const owner = territoryOwner(s,chunkAt(p));
  return owner && owner!==id ? 'Cette parcelle est réservée à son propriétaire.' : null;
}
export const canExcavate = (s: PlanetState,id: string,p: Point) =>
  validPoint(p) && !isRemoved(s,p) && isExposed(s,p) && !protection(s,id,p);

type MiningJob = {point: Point; ready: number};
export type PlanetMiner = {
  id: string; coins:number; pick:number; inventory:Record<Ore,number>; mined:number; lastMine:number;
  mining?: MiningJob|null;
};
export const pickRecovery = (pickLevel=1, spring=false) =>
  Math.max(90, Math.ceil(320 * (spring ? .75 : 1) / (1 + Math.max(0,pickLevel-1)*.16)));
export const mineDuration = (ore: Ore, pickLevel = 1, factor = 1) => Math.ceil(
  ({ferrite:0,cuivre:1300,titane:3400,prisme:7500}[ore]) * factor / (1+Math.max(0,pickLevel-1)*.30)
);
export type MineResult = {message: string; mined:number; ore?:Ore};
const oreName: Record<Ore,string> = {ferrite:'Ferrite',cuivre:'Cuivre',titane:'Titane',prisme:'Prisme'};
function award(s: PlanetState,p: PlanetMiner,q: Point,ore: Ore,now: number,receive?:MiningOptions['receive']): MineResult {
  if (receive && !receive(q,ore)) return {message:'Le point d’enlèvement est plein. Libérez le fret avant de creuser.',mined:0};
  excavate(s,q);
  p.mining = null;
  if (!receive) p.inventory[ore]++;
  p.mined++;
  p.lastMine = now;
  return {message:oreName[ore]+(receive?' · +1 au point d’enlèvement.':' · +1 en soute.'), mined:1, ore};
}
export function finishMine(s: PlanetState,p: PlanetMiner,now: number,receive?:MiningOptions['receive']): MineResult | null {
  const job = p.mining;
  if (!job || now < job.ready) return null;
  if (!canExcavate(s,p.id,job.point)) {
    p.mining = null;
    return {message:'Extraction interrompue. Le bloc n’est plus disponible.',mined:0};
  }
  return award(s,p,job.point,oreAt(s,job.point),now,receive);
}
type MiningOptions = {
  cooldownMs?: number;
  durationFactor?: number;
  receive?: (point:Point, ore:Ore) => boolean;
};
export function manualMine(s: PlanetState,p: PlanetMiner,point: unknown,now: number,options:MiningOptions={}): MineResult {
  if (!validPoint(point)) throw Error('Bloc hors de la planète.');
  const finished = finishMine(s,p,now,options.receive);
  if (finished) return finished;
  if (p.mining) {
    const seconds = Math.ceil((p.mining.ready-now)/1000);
    return {message:'Extraction en cours · '+seconds+' s.',mined:0};
  }
  if (!isExposed(s,point)) throw Error('Creusez d’abord un passage jusqu’à ce bloc.');
  if (isRemoved(s,point)) throw Error('Ce bloc a déjà été extrait.');
  const blocked = protection(s,p.id,point);
  if (blocked) throw Error(blocked);
  if (p.lastMine && now-p.lastMine<(options.cooldownMs ?? pickRecovery(p.pick))) throw Error('La pioche se recharge.');
  const ore = oreAt(s,point), duration = mineDuration(ore,p.pick,options.durationFactor);
  if (!duration) return award(s,p,point,ore,now,options.receive);
  p.mining = {point:{...point},ready:now+duration};
  p.lastMine = now;
  return {message:oreName[ore]+' · extraction en '+Math.ceil(duration/1000)+' s.',mined:0};
}

export function machineMine(s: PlanetState,id: string,p: Point): {ore:Ore;point:Point}|null {
  if (!canExcavate(s,id,p)) return null;
  const ore = oreAt(s,p);
  excavate(s,p);
  return {ore,point:{...p}};
}
/** Follow a real borehole; never skip over an intact or protected cell. */
export function nextMachineTarget(s: PlanetState,id: string,origin: Point,face: Face): Point|null {
  if (!validPoint(origin) || !FACE_ORDER.includes(face)) return null;
  const f = pointOnFace(face,origin);
  for (let d = f.depth; d <= Math.min(EDGE,f.depth + CELL); d++) {
    const p = facePoint(face,f.u,f.v,d);
    if (isRemoved(s,p)) continue;
    return canExcavate(s,id,p) ? p : null;
  }
  return null;
}
export type Tile = {
  u:number; v:number; depth:number; point:Point; ore:Ore|null;
  status:'solid'|'air'|'unknown'; territory:'home'|'owned'|'foreign'|null;
};
export type RegionView = {
  face:Face; u:number; v:number; depth:number; originU:number; originV:number; size:number; tiles:Tile[];
};
const regionOrigin = (n:number) => Math.max(0,Math.min(SIDE-REGION_SIZE,n-(REGION_SIZE>>1)));
/** Include the neighbors needed to decide which underground blocks have been exposed. */
export function regionKeys(focus: Focus): string[] {
  const u = regionOrigin(focus.u), v = regionOrigin(focus.v), depth = focus.depth??0;
  const near = facePoint(focus.face,u-1,v-1,depth-1);
  const far = facePoint(focus.face,u+REGION_SIZE,v+REGION_SIZE,depth + (depth===0?CELL:0)+1);
  return chunkRange(chunkAt(near),chunkAt(far));
}
export function regionView(s: PlanetState,focus: Focus,viewerId?:string): RegionView {
  const depth = focus.depth??0, originU=regionOrigin(focus.u), originV=regionOrigin(focus.v);
  const tiles:Tile[]=[];
  for (let v=originV;v<originV+REGION_SIZE;v++) for (let u=originU;u<originU+REGION_SIZE;u++) {
    let d=depth, point=facePoint(focus.face,u,v,d);
    if (depth===0) {
      while (d<CELL && isRemoved(s,point)) {
        point=facePoint(focus.face,u,v,++d);
      }
    }
    const empty=isRemoved(s,point);
    const status:Tile['status']=empty?'air':isExposed(s,point)?'solid':'unknown';
    const ore=status==='solid'?oreAt(s,point):null;
    const cp=chunkAt(point), owner=territoryOwner(s,cp);
    let territory:Tile['territory']=null;
    if (owner===viewerId && owner) territory=same(s.bases[owner].home,cp)?'home':'owned';
    else if (owner && status!=='unknown') territory='foreign';
    tiles.push({u,v,point,depth:d,status,ore,territory});
  }
  return {face:focus.face,u:focus.u,v:focus.v,depth,originU,originV,size:REGION_SIZE,tiles};
}
