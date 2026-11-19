/** Mineral surface relief is painted once, then sampled in planet coordinates. */
type Context = CanvasRenderingContext2D;
type Rock = 'ferrite' | 'cuivre' | 'titane' | 'prisme';
type XY = { x: number; y: number };

const PATCH = 48;
const PERIOD = 8;
const SIZE = PATCH * PERIOD;
const TAU = Math.PI * 2;
const positiveMod = (n: number, size: number) => ((n % size) + size) % size;
const saturate = (n: number) => Math.max(0, Math.min(1, n));

function random(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1597334677);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A small periodic scalar field. The same face can be sampled across chunk boundaries. */
function field(count: number, seed: number) {
  const lattice = Float32Array.from({ length: count * count }, (_, index) =>
    random(index % count, Math.floor(index / count), seed));
  return (x: number, y: number) => {
    const u = positiveMod(x * count, count);
    const v = positiveMod(y * count, count);
    const i = Math.floor(u), j = Math.floor(v);
    let fu = u - i, fv = v - j;
    fu *= fu * (3 - 2 * fu);
    fv *= fv * (3 - 2 * fv);
    const nextI = (i + 1) % count, nextJ = (j + 1) % count;
    const a = lattice[j * count + i] * (1 - fu) + lattice[j * count + nextI] * fu;
    const b = lattice[nextJ * count + i] * (1 - fu) + lattice[nextJ * count + nextI] * fu;
    return a * (1 - fv) + b * fv;
  };
}

function fractureField() {
  const cells = 9;
  const sites = Array.from({ length: cells * cells }, (_, i) => ({
    x: .15 + .7 * random(i, cells, 18),
    y: .15 + .7 * random(i, cells, 31),
    tone: random(i, cells, 23),
  }));
  return (u: number, v: number) => {
    const gx = u * cells, gy = v * cells, ix = Math.floor(gx), iy = Math.floor(gy);
    let first = Infinity, second = Infinity, tone = 0;
    for (let y = iy - 1; y <= iy + 1; y++) {
      for (let x = ix - 1; x <= ix + 1; x++) {
        const site = sites[positiveMod(y, cells) * cells + positiveMod(x, cells)];
        const dx = x + site.x - gx, dy = y + site.y - gy;
        const distance = dx * dx + dy * dy;
        if (distance < first) {
          second = first;
          first = distance;
          tone = site.tone;
        } else if (distance < second) second = distance;
      }
    }
    return { edge: (second - first) / (Math.sqrt(second) + Math.sqrt(first) + .0001), tone };
  };
}

let surface: HTMLCanvasElement | null = null;
let cliff: HTMLCanvasElement | null = null;

function bakeStone(vertical: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext('2d')!;
  const broad = field(4, 532), bedding = field(14, 833), rough = field(43, 78);
  const fracture = fractureField();
  const height = new Float32Array(SIZE * SIZE);
  const color = new Float32Array(SIZE * SIZE);
  const iron = new Float32Array(SIZE * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE, v = y / SIZE;
      const large = broad(u, v), middle = bedding(u, v), fine = rough(u, v);
      const warp = (large - .5) * 4 + (middle - .5) * .35;
      const joint = fracture(u + (middle - .5) * .028, v + (fine - .5) * .019);
      const phase = (vertical ? v * 24 + warp * .65 : u * 5 + v * 8 + warp * 1.45)
        + (joint.tone - .5) * .42;
      const band = (Math.sin(phase * TAU) + 1) * .5;
      const thin = Math.max(0, 1 - Math.abs(band - .27) * 10);
      const crack = Math.max(0, 1 - joint.edge * (vertical ? 30 : 23)) * saturate((middle + large * .5 - .37) * 1.4);
      const grit = random(x, y, 711) - .5;
      const mica = grit > .45 && fine > .38 ? 19 : grit < -.45 ? -11 : 0;
      const idx = y * SIZE + x;
      height[idx] = band * .18 + thin * .09 - crack * .36 + fine * .24 + grit * .022;
      color[idx] = (large - .5) * 23 + (middle - .5) * 13 + (band - .5) * 11
        + (joint.tone - .5) * 12 + grit * 9 + mica - crack * 20 + thin * 5;
      iron[idx] = saturate((large * .7 + middle * .3 - .37) * 2.6);
    }
  }
  const img = context.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x;
      const dx = height[y * SIZE + positiveMod(x - 1, SIZE)] - height[y * SIZE + (x + 1) % SIZE];
      const dy = height[positiveMod(y - 1, SIZE) * SIZE + x] - height[((y + 1) % SIZE) * SIZE + x];
      const light = Math.max(-22, Math.min(23, dx * 80 + dy * 61));
      const signal = color[i] + light;
      const oxide = iron[i];
      img.data[i * 4] = 101 + oxide * 25 + signal;
      img.data[i * 4 + 1] = 85 + oxide * 6 + signal * .91;
      img.data[i * 4 + 2] = 88 - oxide * 7 + signal * .81;
      img.data[i * 4 + 3] = 255;
    }
  }
  context.putImageData(img, 0, 0);
  return canvas;
}

// These two precomputed textures are fetched alongside the atlas. The procedural
// source also covers an unavailable texture or a first frame before decoding.
function preloadStone(name: 'surface' | 'cliff') {
  if (typeof Image === 'undefined' || typeof document === 'undefined') return null;
  const image = new Image();
  image.decoding = 'async';
  image.src = '/art/stone-' + name + '.webp';
  return image;
}
const bakedSurface = preloadStone('surface');
const bakedCliff = preloadStone('cliff');

function canvasFor(vertical: boolean): CanvasImageSource {
  const image = vertical ? bakedCliff : bakedSurface;
  if (image?.complete && image.naturalWidth === SIZE) return image;
  if (vertical) return cliff ??= bakeStone(true);
  return surface ??= bakeStone(false);
}

function line(ctx: Context, points: XY[], color: string, width: number) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function polygon(ctx: Context, points: XY[], color: string) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const flecks: Record<Exclude<Rock, 'ferrite'>, string[]> = {
  cuivre: ['#713c29', '#b46840', '#e7a66c', '#f6c88d'],
  titane: ['#443d56', '#76748e', '#aaa8c2', '#d4d7e2'],
  prisme: ['#315457', '#438b89', '#8ad2b9', '#c1f5d4'],
};
const decalCache = new Map<string, HTMLCanvasElement>();

/** The endpoints of an exposed vein meet on the shared edge of ore-bearing neighbors. */
function deposit(rock: Exclude<Rock, 'ferrite'>, mask: number, variant: number) {
  const key = rock + mask + '-' + variant;
  const cached = decalCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  const size = 72;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const palette = flecks[rock];
  const rnd = (i: number, j: number) => random(i, j, variant * 11 + mask + 29);
  const center = { x: .35 + rnd(0, 3) * .3, y: .33 + rnd(0, 5) * .34 };
  const ends: XY[] = [];
  const borders = [{ x: .5, y: 0 }, { x: 1, y: .5 }, { x: .5, y: 1 }, { x: 0, y: .5 }];
  for (let i = 0; i < 4; i++) if (mask & (1 << i)) ends.push(borders[i]);
  if (ends.length < 2) ends.push({ x: .12 + rnd(1, 0) * .22, y: .13 + rnd(1, 1) * .18 });
  if (ends.length < 2) ends.push({ x: .66 + rnd(2, 0) * .2, y: .55 + rnd(2, 1) * .26 });
  ctx.scale(size, size);
  ctx.lineJoin = 'bevel';
  for (let b = 0; b < ends.length; b++) {
    const end = ends[b], dx = end.x - center.x, dy = end.y - center.y;
    const bend = (rnd(3, b) - .5) * .28;
    const path = [center,
      { x: center.x + dx * .33 - dy * bend, y: center.y + dy * .33 + dx * bend },
      { x: center.x + dx * .60 + dy * bend * .6, y: center.y + dy * .60 - dx * bend * .6 },
      end];
    line(ctx, path, '#382b3488', .17);
    line(ctx, path, palette[0], .13);
    line(ctx, path, palette[1], .087);
    line(ctx, path.slice(1, 3), palette[2], .029);
    for (let j = 0; j < 4; j++) {
      const t = (j + rnd(j, b)) / 4;
      const x = center.x + dx * t + (rnd(j + 10, b) - .5) * .20;
      const y = center.y + dy * t + (rnd(j + 20, b) - .5) * .18;
      const radius = .045 + rnd(j + 30, b) * (rock === 'prisme' ? .09 : .10);
      const shape = [
        { x: x - radius, y: y + radius * .18 }, { x: x - radius * .4, y: y - radius * .65 },
        { x: x + radius * .72, y: y - radius * .40 }, { x: x + radius, y: y + radius * .14 },
        { x: x + radius * .19, y: y + radius * .7 },
      ];
      polygon(ctx, shape, palette[1]);
      polygon(ctx, [shape[0], shape[1], shape[2], { x, y: y + radius * .1 }], palette[2]);
      polygon(ctx, [shape[3], shape[4], { x, y: y + radius * .1 }], palette[0]);
      line(ctx, [shape[1], shape[2]], palette[3], .012);
    }
  }
  if (rock === 'prisme') {
    // A prismatic pocket has several upright faceted crystal blades.
    for (let i = 0; i < 4; i++) {
      const x = center.x + (rnd(5, i) - .5) * .35;
      const y = center.y + (rnd(6, i) - .5) * .22;
      const length = .12 + rnd(7, i) * .16, width = .026 + rnd(8, i) * .032;
      const tip = { x: x + width * .8, y: y - length };
      polygon(ctx, [{ x: x - width, y }, tip, { x: x + width, y: y - width * .6 }, { x, y: y + width }], palette[2]);
      polygon(ctx, [tip, { x: x + width, y: y - width * .6 }, { x, y: y + width }], palette[1]);
      line(ctx, [{ x: x - width * .5, y: y - length * .36 }, tip], palette[3], .013);
    }
  }
  if (decalCache.size >= 128) decalCache.delete(decalCache.keys().next().value!);
  decalCache.set(key, canvas);
  return canvas;
}

function beginPlane(ctx: Context, origin: XY, endU: XY, endV: XY) {
  ctx.save();
  ctx.transform(endU.x - origin.x, endU.y - origin.y, endV.x - origin.x, endV.y - origin.y, origin.x, origin.y);
}

const patchCache = new Map<string, HTMLCanvasElement>();
const stonePatches = new Map<string, HTMLCanvasElement>();

function stone(ctx: Context, vertical: boolean, u: number, v: number) {
  const x = positiveMod(u, PERIOD), y = positiveMod(v, PERIOD);
  const key = (vertical ? 'wall/' : 'rock/') + x + '/' + y;
  let patch = stonePatches.get(key);
  if (!patch) {
    patch = document.createElement('canvas');
    patch.width = PATCH; patch.height = PATCH;
    patch.getContext('2d')!.drawImage(canvasFor(vertical), x*PATCH, y*PATCH, PATCH, PATCH, 0, 0, PATCH, PATCH);
    stonePatches.set(key, patch);
  }
  ctx.drawImage(patch, 0, 0, 1, 1);
}

export function paintSurface(ctx: Context, corners: XY[], u: number, v: number, depth: number,
  resource: string | null, exposedMask: number, unit: number, shadows: number[]) {
  const key = [
    positiveMod(u + depth * 3, PERIOD), positiveMod(v - depth * 2, PERIOD), resource,
    exposedMask, resource === 'ferrite' ? 0 : Math.floor(random(u,v,depth+23)*4), Math.min(6,depth),
    shadows.map(n => Math.min(4,n)).join(''), depth>0 && unit>18 ? 1 : 0,
  ].join('/');
  let patch = patchCache.get(key);
  if (!patch) {
    patch = document.createElement('canvas');
    patch.width = PATCH;
    patch.height = PATCH;
    const local = patch.getContext('2d')!;
    local.scale(PATCH, PATCH);
    paintPatch(local, u, v, depth, resource, exposedMask, unit, shadows);
    if (patchCache.size >= 384) patchCache.delete(patchCache.keys().next().value!);
    patchCache.set(key, patch);
  }
  beginPlane(ctx, corners[0], corners[1], corners[3]);
  ctx.drawImage(patch, 0, 0, 1, 1);
  ctx.restore();
}

function paintPatch(ctx: Context, u: number, v: number, depth: number,
  resource: string | null, exposedMask: number, unit: number, shadows: number[]) {

  stone(ctx, false, u + depth * 3, v - depth * 2);
  if (resource === 'cuivre' || resource === 'titane' || resource === 'prisme') {
    const variant = Math.floor(random(u, v, depth + 23) * 4);
    ctx.drawImage(deposit(resource, exposedMask, variant), 0, 0, 1, 1);
  }
  if (depth > 0) {
    // Fresh faces collect drill scoring and dust on their far lip.
    ctx.fillStyle = 'rgba(27,23,32,' + Math.min(.24, depth * .04) + ')';
    ctx.fillRect(0, 0, 1, 1);
    if (unit > 18) {
      const xSeed = positiveMod(u + depth * 3, PERIOD), ySeed = positiveMod(v - depth * 2, PERIOD);
      const x = .16 + .24 * random(xSeed, ySeed, 29), y = .36 + .21 * random(ySeed, Math.min(6,depth), 43);
      for (let j = 0; j < 4; j++) {
        const offset = j * .055;
        line(ctx, [{ x: x + offset, y: y + .19 }, { x: x + .21 + offset, y: y - .16 }], '#30272e78', .018);
        line(ctx, [{ x: x + offset + .016, y: y + .18 }, { x: x + .19 + offset, y: y - .13 }], '#dac0a34d', .010);
      }
    }
  }
  for (let side = 0; side < 4; side++) {
    if (!shadows[side]) continue;
    const span = Math.min(.48, .20 + shadows[side] * .09);
    const segments = [[0,0,0,span],[1,0,1-span,0],[0,1,0,1-span],[0,0,span,0]];
    const [x1,y1,x2,y2] = segments[side];
    const shade = ctx.createLinearGradient(x1,y1,x2,y2);
    shade.addColorStop(0, '#15131d9e');
    shade.addColorStop(1, '#15131d00');
    ctx.fillStyle = shade;
    if (side % 2 === 0) ctx.fillRect(0, side === 2 ? 1-span : 0, 1, span);
    else ctx.fillRect(side === 1 ? 1-span : 0, 0, span, 1);
  }
}


export function paintCliff(ctx: Context, wall: XY[], u: number, depth: number,
  levels: number, alongU: boolean, cameraLight: number) {
  beginPlane(ctx, wall[0], wall[1], wall[3]);
  const count = Math.max(1, Math.ceil(levels));
  for (let level = 0; level < count; level++) {
    ctx.save();
    ctx.translate(0, level / count);
    ctx.scale(1, 1 / count);
    stone(ctx, true, u + (alongU ? 0 : 3), depth + level);
    ctx.restore();
  }
  const dark = ctx.createLinearGradient(0,0,0,1);
  dark.addColorStop(0, 'rgba(24,19,28,' + (.13 + .17*cameraLight) + ')');
  dark.addColorStop(1, 'rgba(15,14,24,' + (.36 + .15*cameraLight) + ')');
  ctx.fillStyle = dark;
  ctx.fillRect(0,0,1,1);
  ctx.restore();
}
