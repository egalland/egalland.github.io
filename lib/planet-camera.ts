import { REGION_SIZE, SIDE, type Focus } from './planet';
import type { Orbit } from './planet-render';

export type Pixel = {x: number; y: number};
export type Ground = {u: number; v: number};
export type Viewport = {w: number; h: number};
export type LocalCamera = Orbit & {centerU: number; centerV: number};
export const DRAG_THRESHOLD = 5;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const withinFace = (n: number) => clamp(n, 0, SIDE - 1);
export const dragStarted = (a: Pixel, b: Pixel) => Math.hypot(b.x - a.x, b.y - a.y) >= DRAG_THRESHOLD;

// Inverse of the terrain renderer's ground-plane projection.
export function groundDelta(pixel: Pixel, view: Viewport, camera: Orbit): Ground {
  const unit = Math.min(view.w / (REGION_SIZE * 1.10), view.h / (REGION_SIZE * .89)) * camera.zoom;
  if (unit <= 0) return {u: 0, v: 0};
  const x = pixel.x / unit;
  const y = pixel.y / (unit * Math.sin(camera.pitch));
  const cos = Math.cos(camera.yaw), sin = Math.sin(camera.yaw);
  return {u: x * cos + y * sin, v: -x * sin + y * cos};
}

export function dragGround(camera: LocalCamera, delta: Pixel, view: Viewport): LocalCamera {
  const ground = groundDelta(delta, view, camera);
  return {...camera, centerU: withinFace(camera.centerU - ground.u), centerV: withinFace(camera.centerV - ground.v)};
}

export function zoomGround(camera: LocalCamera, zoom: number, pointer: Pixel, view: Viewport): LocalCamera {
  const relative = {x: pointer.x - view.w / 2, y: pointer.y - view.h * .48};
  const before = groundDelta(relative, view, camera);
  const after = groundDelta(relative, view, {...camera, zoom});
  return {...camera, zoom, centerU: withinFace(camera.centerU + before.u - after.u), centerV: withinFace(camera.centerV + before.v - after.v)};
}

export const focusKey = (focus: Focus | null) => focus ? [focus.face, focus.depth ?? 0, focus.u, focus.v].join('/') : '';
export const planeKey = (focus: Focus | null) => focus ? focus.face + '/' + (focus.depth ?? 0) : '';
export const regionOrigin = (center: number) => clamp(Math.round(center) - (REGION_SIZE >> 1), 0, SIDE - REGION_SIZE);
export const windowKey = (focus: Focus) => [planeKey(focus), regionOrigin(focus.u), regionOrigin(focus.v)].join('/');

export function visibleWindows(focus: Focus, camera: LocalCamera, view: Viewport): Focus[] {
  if (view.w < 1 || view.h < 1) return [];
  const corners = [
    {x: -view.w / 2, y: -view.h * .48}, {x: view.w / 2, y: -view.h * .48},
    {x: -view.w / 2, y: view.h * .52}, {x: view.w / 2, y: view.h * .52},
  ].map(p => groundDelta(p, view, camera));
  // Exposed floors can be projected up to six levels below the surface.
  // Include their footprint near the far edge at shallow viewing angles.
  if ((focus.depth ?? 0) === 0) {
    const shift = -6 * Math.cos(camera.pitch) / Math.sin(camera.pitch);
    corners.push(...corners.map(c => ({u: c.u + shift * Math.sin(camera.yaw), v: c.v + shift * Math.cos(camera.yaw)})));
  }
  const pad = 2;
  const loU = withinFace(Math.floor(camera.centerU + Math.min(...corners.map(c => c.u))) - pad);
  const hiU = withinFace(Math.ceil(camera.centerU + Math.max(...corners.map(c => c.u))) + pad);
  const loV = withinFace(Math.floor(camera.centerV + Math.min(...corners.map(c => c.v))) - pad);
  const hiV = withinFace(Math.ceil(camera.centerV + Math.max(...corners.map(c => c.v))) + pad);
  const windows: Focus[] = [];
  const midpoint = (cell: number) => Math.min(cell * REGION_SIZE, SIDE - REGION_SIZE) + (REGION_SIZE >> 1);
  for (let j = Math.floor(loV / REGION_SIZE); j <= Math.floor(hiV / REGION_SIZE); j++) {
    for (let i = Math.floor(loU / REGION_SIZE); i <= Math.floor(hiU / REGION_SIZE); i++) {
      windows.push({face: focus.face, u: midpoint(i), v: midpoint(j), depth: focus.depth ?? 0});
    }
  }
  const distance = (f: Focus) => Math.hypot(f.u - camera.centerU, f.v - camera.centerV);
  return windows.sort((a, b) => distance(a) - distance(b)).slice(0, 25);
}
