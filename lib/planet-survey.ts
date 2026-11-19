import { FACE_ORDER, SIDE, type Face, type Focus } from './planet';
import { paintRockTile } from './planet-orbit-detail';

type Tile = { face: Face; u: number; v: number; span: number };
type Raster = { image: HTMLCanvasElement; touched: number };
type Survey = { focus: Focus; span: number };

const TILE_PIXELS = 112;
const CACHE_LIMIT = 192;
const tiles = new Map<string, Raster>();
const subscribers = new Set<() => void>();
let nextTile: Tile | undefined;
let scheduled = false;
let building: { tile: Tile; image: HTMLCanvasElement; quadrant: number } | undefined;
let scratch: HTMLCanvasElement | undefined;
let lastDraw = 0;

function key(tile: Tile) {
  return `${tile.face}/${tile.span}/${tile.u}/${tile.v}`;
}

function atLevel(tile: Tile, span: number): Tile {
  return { face: tile.face, span, u: Math.floor(tile.u / span) * span, v: Math.floor(tile.v / span) * span };
}

function readTile(tile: Tile): HTMLCanvasElement | undefined {
  const raster = tiles.get(key(tile));
  if (raster) raster.touched = lastDraw;
  return raster?.image;
}

function grain(x: number, y: number, seed: number) {
  let bits = Math.imul(x + seed * 137, 374761393) + Math.imul(y - seed * 47, 668265263);
  bits = Math.imul(bits ^ (bits >>> 13), 1274126177);
  return ((bits ^ (bits >>> 16)) >>> 0) / 4294967296;
}

/** Fracture traces and loose rock become legible as their ground footprint
 * grows. Their world coordinates and light direction stay fixed across LODs. */
function paintOutcrops(ctx: CanvasRenderingContext2D, tile: Tile) {
  const scale = TILE_PIXELS / tile.span;
  const faceSeed = FACE_ORDER.indexOf(tile.face) * 41 + 79;
  for (const spacing of [320, 64, 16]) {
    const size = spacing * scale;
    if (size < 17 || size > 420) continue;
    const opacity = Math.min(1, (size - 17) / 30, (420 - size) / 85);
    const seed = faceSeed + spacing;
    const minX = Math.floor(tile.u / spacing) - 1, maxX = Math.ceil((tile.u + tile.span) / spacing) + 1;
    const minY = Math.floor(tile.v / spacing) - 1, maxY = Math.ceil((tile.v + tile.span) / spacing) + 1;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const kind = grain(x, y, seed);
      if (kind < .35) continue;
      const cx = ((x + .15 + grain(x, y, seed + 1) * .7) * spacing - tile.u) * scale;
      const cy = ((y + .15 + grain(x, y, seed + 2) * .7) * spacing - tile.v) * scale;
      if (cx < -size * .65 || cx > TILE_PIXELS + size * .65 || cy < -size * .65 || cy > TILE_PIXELS + size * .65) continue;
      const angle = -.73 + .17 * (faceSeed % 7) + (grain(x, y, seed + 5) - .5) * .8;
      const axisX = Math.cos(angle), axisY = Math.sin(angle);
      if (kind > .73) {
        const path = (offset: number, count: number) => {
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            const along = (i / 5 - .5) * size * .77;
            const across = (grain(x + i, y, seed + 21) - .5) * size * .075;
            const px = cx + axisX * along - axisY * across;
            const py = cy + axisY * along + axisX * across + offset;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        };
        // The pale lip is offset from the shadow of the same fissure.
        ctx.strokeStyle = '#e4cfab57';
        ctx.lineWidth = Math.max(.65, size * .012);
        path(Math.max(.8, size * .012), 5);
        ctx.strokeStyle = '#211e2b9c';
        ctx.lineWidth = Math.max(.7, size * .014);
        path(0, 6);
        continue;
      }
      const stones = 2 + Math.floor(grain(x, y, seed + 9) * 5);
      for (let i = 0; i < stones; i++) {
        const along = (grain(x, y + i, seed + 10) - .5) * size * .44;
        const across = (grain(x + i, y, seed + 11) - .5) * size * .21;
        const px = cx + axisX * along - axisY * across, py = cy + axisY * along + axisX * across;
        const radius = Math.max(.8, size * (.018 + grain(x + i, y, seed + 7) * .047));
        const wide = radius * (1.1 + grain(x, y + i, seed + 6));
        const tall = radius * .65;
        const drawFacet = (points: number[][], color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let j = 0; j < points.length; j++) {
            const [a, b] = points[j];
            const sx = px + axisX * a * wide - axisY * b * tall;
            const sy = py + axisY * a * wide + axisX * b * tall;
            if (j === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
          }
          ctx.closePath(); ctx.fill();
        };
        drawFacet([[-.9,-.2],[-.4,-.8],[.53,-.85],[1,-.12],[.79,.65],[-.5,.82]], '#312a30a0');
        drawFacet([[-.9,-.2],[-.4,-.8],[.53,-.85],[.2,.05],[-.56,.26]], '#c2af978c');
        drawFacet([[.53,-.85],[1,-.12],[.79,.35],[.2,.05]], '#9e8c7d80');
      }
    }
    ctx.restore();
  }
}

function makeRoom() {
  if (tiles.size < CACHE_LIMIT) return;
  let oldest = Infinity;
  let evict: string | undefined;
  for (const [id, entry] of tiles) {
    if (entry.touched < oldest) {
      oldest = entry.touched;
      evict = id;
    }
  }
  if (evict) tiles.delete(evict);
}

export function subscribeSurveyTiles(listener: () => void): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) { nextTile = undefined; building = undefined; }
  };
}

// A frame chooses the single most useful missing tile. There is no long queue
// of stale work to drain after the user drags or switches to another face.
function schedule(tile: Tile | undefined) {
  nextTile = tile;
  if (!tile || scheduled || typeof window === 'undefined') return;
  scheduled = true;
  const fill = () => {
    scheduled = false;
    const wanted = nextTile;
    nextTile = undefined;
    if (!wanted || tiles.has(key(wanted))) return;
    if (!building || key(building.tile) !== key(wanted)) {
      const image = document.createElement('canvas');
      image.width = image.height = TILE_PIXELS;
      building = { tile: wanted, image, quadrant: 0 };
    }
    const context = building.image.getContext('2d', { alpha: false });
    if (!context) return;
    const halfPixels = TILE_PIXELS / 2, halfSpan = wanted.span / 2;
    if (!scratch) {
      scratch = document.createElement('canvas');
      scratch.width = scratch.height = halfPixels;
    }
    const part = scratch.getContext('2d', { alpha: false });
    if (!part) return;
    // At most 6,272 colour samples per frame. Splitting a tile does not alter
    // its world sampling step or the gradient apron at its boundaries.
    const end = building.quadrant + 2;
    while (building.quadrant < end) {
      const quadrant = building.quadrant++;
      const col = quadrant % 2, row = Math.floor(quadrant / 2);
      paintRockTile(part, wanted.face, wanted.u + col * halfSpan, wanted.v + row * halfSpan, halfSpan, halfPixels);
      context.drawImage(scratch, col * halfPixels, row * halfPixels);
    }
    if (building.quadrant < 4) {
      schedule(wanted);
      return;
    }
    paintOutcrops(context, wanted);
    makeRoom();
    tiles.set(key(wanted), { image: building.image, touched: lastDraw });
    building = undefined;
    for (const listener of subscribers) listener();
  };
  window.requestAnimationFrame(() => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fill, { timeout: 140 });
    } else {
      window.setTimeout(fill, 0);
    }
  });
}

/** Draw the visible part of a face, in map coordinates that do not depend on the last camera position. */
export function drawSurveySurface(ctx: CanvasRenderingContext2D, w: number, h: number, view: Survey, overview: HTMLCanvasElement) {
  if (!w || !h) return;
  lastDraw++;
  const scale = Math.min(w, h) / view.span;
  const ox = w / 2 - view.focus.u * scale;
  const oy = h / 2 - view.focus.v * scale;
  const minU = Math.max(0, -ox / scale);
  const maxU = Math.min(SIDE, (w - ox) / scale);
  const minV = Math.max(0, -oy / scale);
  const maxV = Math.min(SIDE, (h - oy) / scale);
  if (minU >= maxU || minV >= maxV) return;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  const texels = overview.width / SIDE;
  ctx.drawImage(overview, minU * texels, minV * texels, (maxU - minU) * texels, (maxV - minV) * texels,
    ox + minU * scale, oy + minV * scale, (maxU - minU) * scale, (maxV - minV) * scale);

  // A tile covers approximately 130–255 CSS pixels at this scale. Zooming
  // reveals the next level of the same world-aligned geology.
  let span = Math.min(SIDE, Math.max(1, 2 ** Math.ceil(Math.log2(128 / scale))));
  // Keep the active detail level resident even on panoramic and high-DPI displays.
  const visibleTiles = () => (1 + Math.ceil((maxU - minU) / span)) * (1 + Math.ceil((maxV - minV) / span));
  while (visibleTiles() > CACHE_LIMIT / 2 && span < SIDE) span *= 2;
  const fallbackSpan = Math.min(SIDE, 4 * span);
  const ratio = Math.max(1, ctx.getTransform().a);
  const align = (n: number) => Math.round(n * ratio) / ratio;
  const drawTile = (image: HTMLCanvasElement, tile: Tile, source: Tile) => {
    const x = align(ox + tile.u * scale), y = align(oy + tile.v * scale);
    const width = align(ox + (tile.u + tile.span) * scale) - x;
    const height = align(oy + (tile.v + tile.span) * scale) - y;
    const factor = image.width / source.span;
    ctx.drawImage(image, (tile.u - source.u) * factor, (tile.v - source.v) * factor,
      tile.span * factor, tile.span * factor, x, y, width, height);
  };

  let nearest: Tile | undefined;
  let best = Infinity;
  for (let v = Math.floor(minV / span) * span; v < maxV; v += span) {
    for (let u = Math.floor(minU / span) * span; u < maxU; u += span) {
      const tile = { face: view.focus.face, span, u, v };
      const exact = readTile(tile);
      if (exact) {
        drawTile(exact, tile, tile);
        continue;
      }
      let hasParent = false;
      for (let step = span * 2; step <= SIDE; step *= 2) {
        const parent = atLevel(tile, step);
        const image = readTile(parent);
        if (image) {
          drawTile(image, tile, parent);
          hasParent = true;
          break;
        }
      }
      // On zoom-out the previous high-resolution tiles are still useful
      // until this level is available.
      for (const dv of [0, span / 2]) for (const du of [0, span / 2]) {
        const child = { face: tile.face, span: span / 2, u: u + du, v: v + dv };
        const image = readTile(child);
        if (image) drawTile(image, child, child);
      }
      const coarse = !hasParent && fallbackSpan > span && TILE_PIXELS / fallbackSpan > texels * 1.25;
      const wanted = coarse ? atLevel(tile, fallbackSpan) : tile;
      const du = (wanted.u + wanted.span / 2 - view.focus.u) * scale;
      const dv = (wanted.v + wanted.span / 2 - view.focus.v) * scale;
      const distance = du * du + dv * dv + (coarse ? 0 : w * w + h * h);
      if (distance < best) {
        best = distance;
        nearest = wanted;
      }
    }
  }
  ctx.restore();
  schedule(nearest);
}
