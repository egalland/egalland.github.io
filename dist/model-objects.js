import * as THREE from './vendor/three.module.js';

export const OBJECT_KINDS = Object.freeze([
  'bonnet', 'echarpe', 'snood', 'chale', 'chaussettes', 'mitaines', 'moufles',
  'bandeau', 'couverture', 'coussin', 'sac', 'lavette', 'chaussons', 'libre'
]);

const TAU = 2 * Math.PI;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, t) => THREE.MathUtils.smoothstep(t, a, b);
const wrapAngle = u => (u - 0.5) * TAU;

function dimension(project, key, fallback) {
  const value = Number(project.measures?.[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function knit(part, surface, widthCm, heightCm, style = 'stockinette') {
  return { part, surface, widthCm: Math.max(0.4, widthCm), heightCm: Math.max(0.4, heightCm), style };
}

// u across stitches, v from the bottom towards the top. Normals are welded
// across duplicated UV seam vertices on tubes, while their UVs stay separate.
function grid(columns, rows, sample, { reverse = false, closed = false, uv = (u, v) => [u, v] } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const stride = columns + 1;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= columns; i++) {
      const u = i / columns;
      const v = j / rows;
      const p = sample(u, v);
      positions.push(p.x, p.y, p.z);
      uvs.push(...uv(u, v));
      if (i === columns || j === rows) continue;
      const a = j * stride + i;
      const b = a + 1;
      const d = a + stride;
      const c = d + 1;
      if (reverse) indices.push(a, d, b, b, d, c);
      else indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  if (closed) {
    const normals = geometry.attributes.normal;
    for (let j = 0; j <= rows; j++) {
      const first = j * stride;
      const last = first + columns;
      const n = new THREE.Vector3().fromBufferAttribute(normals, first)
        .add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
      normals.setXYZ(first, n.x, n.y, n.z);
      normals.setXYZ(last, n.x, n.y, n.z);
    }
  }
  return geometry;
}

function fabric(group, geometry, data) {
  const material = new THREE.MeshStandardMaterial({ color: 0xe6dbbf, roughness: 0.95, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = data.surface;
  mesh.userData.knit = data;
  group.add(mesh);
  return mesh;
}

// Smooth interpolation through measurements at each lengthwise station.
function stations(points, t) {
  const f = clamp(t, 0, 1) * (points.length - 1);
  const i = Math.min(points.length - 2, Math.floor(f));
  const w = f - i;
  const a = points[Math.max(0, i - 1)];
  const b = points[i];
  const c = points[i + 1];
  const d = points[Math.min(points.length - 1, i + 2)];
  return b.map((value, k) => {
    const velocity0 = 0.5 * (c[k] - a[k]);
    const velocity1 = 0.5 * (d[k] - value);
    return value + velocity0 * w + (3 * (c[k] - value) - 2 * velocity0 - velocity1) * w * w
      + (2 * (value - c[k]) + velocity0 + velocity1) * w * w * w;
  });
}

// A continuous rounded lip includes the inside of the folded fabric. Its
// outer tangent follows neighbouring stitches, including at sloping openings.
function roll(group, point, widthCm, radius, id, low, style = 'rib') {
  const segments = low ? 28 : 72;
  const sides = low ? 7 : 10;
  const geometry = grid(segments, sides, (u, v) => {
    const center = point(u);
    const next = point((u + 0.0005) % 1);
    const tangent = next.sub(center).normalize();
    const reference = Math.abs(tangent.y) > 0.88 ? V(0, 0, 1) : V(0, 1, 0);
    const normal = tangent.clone().cross(reference).normalize();
    const up = normal.clone().cross(tangent).normalize();
    const angle = v * TAU;
    return center.addScaledVector(normal, radius * Math.cos(angle)).addScaledVector(up, radius * Math.sin(angle));
  }, { closed: true });
  fabric(group, geometry, knit('trim', id, widthCm, TAU * radius, style));
}

// Knit openings are hollow. An inward-facing lining gives the fold a real
// edge and a visible interior even when the renderer removes back faces.
function lining(group, opening, inward, depth, widthCm, id, low) {
  const segments = low ? 18 : 40;
  const center = V(0, 0, 0);
  for (let i = 0; i < segments; i++) center.add(opening(i / segments));
  center.divideScalar(segments);
  const reverse = inward.y < 0;
  const interior = (u, v) => center.clone().lerp(opening(u), mix(0.87, 0.982, v))
    .addScaledVector(inward, depth * (1 - v));
  const sides = grid(segments, low ? 2 : 5, interior, { closed: true, reverse });
  const floorCenter = center.clone().addScaledVector(inward, depth * 1.03);
  const floor = grid(segments, 1, (u, v) => floorCenter.clone().lerp(interior(u, 0), v),
    { closed: true, reverse });
  fabric(group, joinedGeometries([sides, floor]), {...knit('trim', id, widthCm, depth, 'garter'),inside:true});
}

function flatCloth(group, sample, width, length, low, options = {}) {
  const { id = 'body', style = 'stockinette', borders = false, reverseSide = true } = options;
  const along = low ? 20 : 40;
  const across = low ? 20 : 38;
  const thickness = clamp(Math.min(width, length) * 0.006, 0.07, 0.36);
  function panel(nx, ny, point, data) {
    fabric(group, grid(nx, ny, point), data);
    if (!reverseSide) return;
    fabric(group, grid(nx, ny, (u, v) => {
      const p = point(u, v);
      p.z -= thickness;
      return p;
    }, {reverse:true}), {...data, inside:true, style:'garter'});
  }
  if (!borders) {
    panel(across, along, sample, knit('body', id, width, length, style));
  } else {
    const wu = clamp(2 / width, 0.025, 0.095);
    const hv = clamp(2 / length, 0.025, 0.095);
    const pieces = [
      [wu, 1 - wu, hv, 1 - hv, id, style, across, along],
      [0, 1, 0, hv, id + '-lower-edge', 'garter', across, 2],
      [0, 1, 1 - hv, 1, id + '-upper-edge', 'garter', across, 2],
      [0, wu, hv, 1 - hv, id + '-left-edge', 'garter', 2, along],
      [1 - wu, 1, hv, 1 - hv, id + '-right-edge', 'garter', 2, along]
    ];
    for (const [left, right, bottom, top, name, stitch, nx, ny] of pieces) {
      const get = (u, v) => sample(mix(left, right, u), mix(bottom, top, v));
      panel(nx, ny, get, knit(name === id ? 'body' : 'trim', name, width * (right - left), length * (top - bottom), stitch));
    }
  }
}

function beanie(project, low) {
  const group = new THREE.Group();
  const circumference = dimension(project, 'circumference', 54);
  const length = dimension(project, 'length', 22);
  const brim = clamp(dimension(project, 'brim', 5), length * 0.10, length * 0.53);
  const radius = circumference / TAU;
  const segments = low ? 52 : 88;
  const base = brim * 0.91;
  function crown(u, v) {
    const theta = wrapAngle(u);
    const dome = clamp((v - 0.14) / 0.86, 0, 1);
    const taper = Math.sqrt(Math.max(0.000004, 1 - dome * dome));
    const channels = 1 - 0.052 * Math.pow(Math.max(0, Math.cos(7 * theta + v * 0.8)), 6) * smooth(0.25, 0.9, v);
    const fullness = (1 + 0.06 * Math.sin(v * Math.PI * 1.28)) * channels;
    const r = radius * taper * fullness;
    return V(Math.sin(theta) * r * 1.045 + radius * 0.10 * v * v,
      base + (length - base) * v + brim * 0.06 * Math.sin(2 * theta - 0.5) * (1 - v),
      Math.cos(theta) * r * 0.95 - radius * 0.15 * v * v);
  }
  const crownRise = t => Math.sin(t * Math.PI / 2);
  fabric(group, grid(segments, low ? 18 : 35, (u, v) => crown(u, crownRise(v)),
    { closed: true, uv: (u, v) => [u, crownRise(v)] }),
    knit('body', 'body', circumference, length - base));
  function band(u, v) {
    const theta = wrapAngle(u);
    const roundOver = 0.025 * Math.sin(Math.PI * v);
    const r = radius * (1.023 + roundOver + 0.006 * Math.cos(50 * theta));
    return V(Math.sin(theta) * r * 1.045, brim * v + brim * 0.06 * Math.sin(2 * theta - 0.5), Math.cos(theta) * r * 0.95);
  }
  fabric(group, grid(segments, low ? 5 : 9, band, { closed: true }), knit('rib', 'brim', circumference, brim, 'rib'));
  roll(group, u => band(u, 1), circumference, clamp(brim * 0.045, 0.12, 0.4), 'brim-fold', low);
  roll(group, u => band(u, 0), circumference, clamp(brim * 0.055, 0.14, 0.4), 'brim-base', low);
  lining(group, u => band(u, 0), V(0, 1, 0), Math.min(length * 0.60, 1.6 * brim), circumference, 'interieur', low);
  return group;
}

function ringCloth(project, low, kind) {
  const group = new THREE.Group();
  const isBand = kind === 'bandeau';
  const isFree = kind === 'tube';
  const circumference = dimension(project, isFree ? 'width' : 'circumference', isBand ? 52 : 58);
  const length = dimension(project, isBand ? 'width' : 'length', isBand ? 9 : 28);
  const radius = circumference / TAU;
  const height = length * (kind === 'snood' ? 0.83 : 1);
  function sheet(u, v) {
    const a = wrapAngle(u);
    const gathered = isBand ? Math.exp(-(a * a) / 0.16) : 0;
    const fullness = kind === 'snood' ? 0.055 * Math.sin(2.2 * TAU * v + Math.sin(a) * 0.9)
      + 0.055 * Math.cos(2 * a + 1.6 * v) + 0.033 * Math.sin(5 * a - 5 * v) : 0.008 * Math.cos(3 * a + v);
    const r = radius * (1 + fullness) + (isBand ? (v - 0.5) * height * Math.sin(2.4 * a) * gathered * 0.32 : 0);
    let y = (v - 0.5) * height * (1 - 0.5 * gathered);
    if (kind === 'snood') y += height * (0.08 * Math.sin(2 * a + v) - 0.18 * v * v * Math.cos(a));
    if (isBand) y += height * 0.03 * Math.sin(a + 0.4);
    return V(Math.sin(a) * r * 1.055, y, Math.cos(a) * r * 0.94);
  }
  const segments = low ? 48 : 80;
  const rows = isBand ? 9 : (low ? 18 : 32);
  fabric(group, grid(segments, rows, sheet, { closed: true }), knit('body', 'body', circumference, length));
  const thick = Math.min(radius, length) * (isBand ? 0.025 : 0.018);
  fabric(group, grid(segments, Math.ceil(rows / 2), (u, v) => {
    const p = sheet(u, v);
    const f = 1 - thick / radius;
    return V(p.x * f, p.y, p.z * f);
  }, { closed: true, reverse: true }), {...knit('body', 'body', circumference, length, 'garter'),inside:true});
  for (const edge of [0, 1]) roll(group, u => sheet(u, edge), circumference, Math.max(thick * 0.8, 0.12), 'rolled-edge-' + edge, low);
  if (isBand) {
    fabric(group, grid(14, 10, (u, v) => {
      const p = sheet(0.5 + (u - 0.5) * 0.065, v);
      p.z += thick * (1.3 + 0.38 * Math.sin(TAU * u));
      p.y += (u - 0.5) * height * 0.15;
      return p;
    }), knit('trim', 'centre-wrap', circumference * 0.065, length * 0.65, 'rib'));
  }
  return group;
}

function joinedGeometries(parts) {
  const position = [];
  const normal = [];
  const uv = [];
  const indices = [];
  for (const part of parts) {
    const offset = position.length / 3;
    position.push(...part.attributes.position.array);
    normal.push(...part.attributes.normal.array);
    uv.push(...part.attributes.uv.array);
    for (const index of part.index.array) indices.push(index + offset);
    part.dispose();
  }
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normal, 3));
  result.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  result.setIndex(indices);
  return result;
}

function scarf(project, low) {
  const group = new THREE.Group();
  const width = dimension(project, 'width', 24);
  const length = dimension(project, 'length', 160);
  const neckWidth = Math.min(width, length * 0.21);
  const tail = Math.max(length * 0.16, (length - 3.4 * neckWidth) / 2);
  const w = neckWidth;
  const points = [
    V(-0.86 * w, -tail * 1.12, w * 0.27),
    V(-0.80 * w, -tail * 0.54, w * 0.33),
    V(-0.71 * w, -0.18 * w, w * 0.12),
    V(-0.59 * w, 0.27 * w, -0.30 * w),
    V(-0.23 * w, 0.49 * w, -0.58 * w),
    V(0.22 * w, 0.46 * w, -0.55 * w),
    V(0.51 * w, 0.22 * w, -0.28 * w),
    V(0.55 * w, -0.23 * w, w * 0.18),
    V(0.54 * w, -tail * 0.48, w * 0.55),
    V(0.71 * w, -tail * 0.91, w * 0.48)
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  const correctLength = length / curve.getLength();
  for (const p of points) p.multiplyScalar(correctLength);
  curve.updateArcLengths();
  const frames = new Map();
  function frame(t) {
    if (frames.has(t)) return frames.get(t);
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const widthAxis = tangent.clone().cross(V(0, 0.03, 1)).normalize();
    const normal = widthAxis.clone().cross(tangent).normalize();
    const result = { center, tangent, widthAxis, normal };
    frames.set(t, result);
    return result;
  }
  function cloth(u, v) {
    const { center, widthAxis, normal } = frame(v);
    const x = u - 0.5;
    const turn = 0.3 * Math.sin(2 * TAU * v + 0.2);
    const folds = width * (0.038 * Math.cos(3.1 * Math.PI * u + 4 * v)
      + 0.10 * x * x + turn * x);
    return center.clone().addScaledVector(widthAxis, x * width).addScaledVector(normal, folds);
  }
  const nx = low ? 16 : 29;
  const ny = low ? 48 : 88;
  fabric(group, grid(nx, ny, cloth), knit('body', 'body', width, length));
  const thickness = clamp(width * 0.015, 0.12, 0.42);
  fabric(group, grid(nx, ny, (u, v) => cloth(u, v).addScaledVector(frame(v).normal, -thickness),
    { reverse: true }), {...knit('body', 'body', width, length, 'garter'),inside:true});
  for (const edge of [0, 1]) {
    fabric(group, grid(2, ny, (u, v) => cloth(edge, v).addScaledVector(frame(v).normal, -thickness * u),
      { reverse: edge === 1 }), knit('trim', 'selvedge-' + edge, thickness, length, 'garter'));
  }
  const tufts = [];
  const count = low ? 8 : 13;
  for (const edge of [0, 1]) for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const start = cloth(u, edge);
    const drop = width * (0.17 + 0.026 * Math.sin(i * 2.3));
    const axis = frame(edge).tangent.clone().multiplyScalar(edge ? 1 : -1);
    const drift = width * 0.025 * Math.sin(i * 1.35 + edge);
    const thread = new THREE.CatmullRomCurve3([
      start, start.clone().addScaledVector(axis, drop * 0.25),
      start.clone().add(V(drift, -drop * 0.69, width * 0.018)),
      start.clone().add(V(drift * 1.25, -drop, width * 0.016))
    ]);
    tufts.push(new THREE.TubeGeometry(thread, low ? 4 : 8, clamp(width * 0.008, 0.07, 0.22), low ? 4 : 6, false));
  }
  fabric(group, joinedGeometries(tufts), knit('trim', 'franges', width * 0.17, width * 0.025, 'garter'));
  return group;
}

function panelObject(project, low, kind) {
  const group = new THREE.Group();
  const triangle = kind === 'chale' || kind === 'triangle';
  const washcloth = kind === 'lavette';
  const width = dimension(project, 'width', triangle ? 150 : washcloth ? 24 : 100);
  const length = dimension(project, 'length', triangle ? 65 : washcloth ? 24 : 140);
  const short = Math.min(width, length);
  function cloth(u, v) {
    const across = u * 2 - 1;
    if (triangle) {
      const fraction = mix(0.003, 1, v);
      const x = across * fraction * width / 2;
      const drape = kind === 'chale' ? 1 : 0.35;
      const y = (v - 0.5) * length
        + drape * length * (0.10 * across * across - 0.035 * Math.cos(Math.PI * across)) * v;
      const z = drape * short * (0.07 * Math.sin(2.5 * Math.PI * u + v * 0.8)
        + 0.105 * across * across) * v;
      return V(x, y, z);
    }
    const corner = smooth(0.66, 1, u) * smooth(0.70, 1, v);
    const drape = kind === 'couverture' ? 1 : washcloth ? 0.68 : 0.38;
    const fullness = 0.054 * Math.sin(2.4 * Math.PI * u + 1.4 * v) + 0.025 * Math.cos(4 * Math.PI * u - 2 * v);
    return V(width * (u - 0.5) - drape * short * 0.065 * corner,
      length * (v - 0.5) + short * drape * (0.027 * Math.sin(TAU * u + v * 1.8) - 0.13 * corner),
      short * drape * (fullness + 0.19 * corner + 0.025 * Math.cos(1.8 * Math.PI * v)));
  }
  flatCloth(group, cloth, width, length, low, { borders: kind !== 'rectangle' });
  if (washcloth) {
    const root = cloth(0.96, 0.98);
    const w = short * 0.045, h = short * 0.10;
    const loop = new THREE.CatmullRomCurve3([
      root.clone().add(V(-0.25 * w, 0, 0)), root.clone().add(V(-0.7 * w, 0.7 * h, 0.1)),
      root.clone().add(V(0.23 * w, h, 0.15)), root.clone().add(V(w, 0.7 * h, 0.04)),
      root.clone().add(V(0.26 * w, 0, 0))
    ]);
    fabric(group, new THREE.TubeGeometry(loop, low ? 14 : 24, clamp(short * 0.007, 0.08, 0.22), 6, false),
      knit('trim', 'attache', h * 2.4, short * 0.03, 'garter'));
  }
  return group;
}

function cushion(project, low) {
  const group = new THREE.Group();
  const width = dimension(project, 'width', 45);
  const length = dimension(project, 'length', 45);
  const depth = dimension(project, 'depth', Math.min(width, length) * 0.23);
  const across = low ? 23 : 48;
  const along = low ? 22 : 47;
  function panel(u, v, side) {
    const x = u * 2 - 1, y = v * 2 - 1;
    const bx = Math.pow(1 - Math.pow(x, 4), 0.56);
    const by = Math.pow(1 - Math.pow(y, 4), 0.56);
    const crease = 1 - 0.20 * Math.exp(-Math.pow((Math.abs(x) - Math.abs(y)) / 0.09, 2))
      * smooth(0.62, 0.98, Math.max(Math.abs(x), Math.abs(y)));
    const z = side * 0.5 * depth * (0.060 + 0.94 * bx * by * crease);
    return V(0.5 * width * x * (1 - 0.076 * Math.pow(y, 8)),
      0.5 * length * y * (1 - 0.076 * Math.pow(x, 8)), z);
  }
  fabric(group, grid(across, along, (u, v) => panel(u, v, 1)), knit('body', 'body', width, length));
  fabric(group, grid(across, along, (u, v) => panel(1 - u, v, -1)), knit('body', 'reverse', width, length));
  const perimeter = [];
  const n = low ? 16 : 30;
  for (let i = 0; i < n; i++) perimeter.push(panel(i / n, 0, 0));
  for (let i = 0; i < n; i++) perimeter.push(panel(1, i / n, 0));
  for (let i = 0; i < n; i++) perimeter.push(panel(1 - i / n, 1, 0));
  for (let i = 0; i < n; i++) perimeter.push(panel(0, 1 - i / n, 0));
  const piping = new THREE.CatmullRomCurve3(perimeter, true);
  const line = new THREE.TubeGeometry(piping, 4 * n, Math.max(depth * 0.035, Math.min(width, length) * 0.007), low ? 6 : 9, true);
  fabric(group, line, knit('trim', 'couture', 2 * (width + length), depth * 0.15, 'garter'));
  return group;
}

function bag(project, low) {
  const group = new THREE.Group();
  const width = dimension(project, 'width', 32);
  const length = dimension(project, 'length', 36);
  const depth = dimension(project, 'depth', 9);
  const handleLength = dimension(project, 'handle', 46);
  const around = 2 * (width + depth);
  const segments = low ? 56 : 92;
  const strapWidth = Math.min(Math.min(width, depth) * 0.27, 3.3);
  const span = Math.min(width * 0.63, handleLength * 0.8);
  const power = n => Math.sign(n) * Math.pow(Math.abs(n), 0.57);
  function shell(u, v) {
    const a = wrapAngle(u);
    const sx = power(Math.sin(a));
    const sz = power(Math.cos(a));
    const gather = 0.04 * Math.sin(5 * a + v) + 0.035 * Math.cos(7 * a - 2 * v);
    const taper = 0.89 + 0.11 * smooth(0, 0.55, v);
    const x = width * 0.5 * sx * taper;
    const sag = (Math.cos(a) ** 2) * Math.exp(-((2.3 * x / width) ** 2));
    const top = length * (1 - 0.11 * sag);
    return V(x, v * top + length * 0.014 * Math.sin(2 * a + 0.6) * (1 - v),
      depth * 0.5 * sz * (0.85 + 0.15 * Math.sin(Math.PI * v) + gather * v));
  }
  fabric(group, grid(segments, low ? 16 : 30, (u, v) => shell(u, v * 0.94), { closed: true }),
    knit('body', 'body', around, length * 0.94));
  fabric(group, grid(segments, low ? 3 : 5, (u, v) => shell(u, mix(0.94, 1, v)), { closed: true }),
    knit('rib', 'rim', around, length * 0.06, 'rib'));
  const thickness = Math.min(depth * 0.05, 0.36);
  fabric(group, grid(segments, low ? 8 : 16, (u, v) => {
    const p = shell(u, mix(0.02, 1, v));
    return V(p.x * (1 - 2 * thickness / width), p.y - thickness * 0.4, p.z * (1 - 2 * thickness / depth));
  }, { closed: true, reverse: true }), {...knit('body', 'body', around, length * .94, 'garter'),inside:true});
  roll(group, u => shell(u, 1), around, thickness * 0.66, 'bord-roule', low);
  const base = (u, v) => {
    const p = shell(u, 0);
    return V(p.x * v, p.y * v - thickness * (1 - v), p.z * v);
  };
  fabric(group, grid(segments, 3, base, { closed: true }), knit('trim', 'fond', width, depth, 'garter'));
  function handle(sign) {
    const z = sign * depth * 0.40;
    const start = V(-span / 2, length * 0.95, z);
    const end = V(span / 2, length * 0.95, z);
    const curveAt = rise => new THREE.CubicBezierCurve3(start,
      V(-span * 0.60, start.y + rise * 1.32, z + sign * 0.14 * depth),
      V(span * 0.60, end.y + rise * 1.32, z + sign * 0.12 * depth), end);
    let lo = 0, hi = handleLength;
    for (let i = 0; i < 12; i++) {
      const mid = (lo + hi) / 2;
      if (curveAt(mid).getLength() < handleLength) lo = mid;
      else hi = mid;
    }
    const curve = curveAt((lo + hi) / 2);
    const { points, widthAxes, normals } = pathFrames(curve, low ? 24 : 42);
    const rows = points.length - 1;
    const geo = grid(low ? 8 : 12, rows, (u, v) => {
      const i = Math.round(v * rows);
      const a = wrapAngle(u);
      return points[i].clone().addScaledVector(widthAxes[i], strapWidth * 0.5 * Math.sin(a))
        .addScaledVector(normals[i], strapWidth * 0.16 * Math.cos(a));
    }, { closed: true });
    fabric(group, geo, knit('trim', sign === 1 ? 'anse-avant' : 'anse-arriere', strapWidth * 2.25, handleLength, 'garter'));
  }
  handle(-1);
  handle(1);
  return group;
}

function pathFrames(curve, count) {
  const points = [], widthAxes = [], normals = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const tangent = curve.getTangentAt(t);
    const reference = Math.abs(tangent.z) > 0.95 ? V(0, 1, 0) : V(0, 0, 1);
    const widthAxis = tangent.clone().cross(reference).normalize();
    points.push(curve.getPointAt(t));
    widthAxes.push(widthAxis);
    normals.push(widthAxis.clone().cross(tangent).normalize());
  }
  return { points, widthAxes, normals };
}

function oneSock(project, low, second) {
  const group = new THREE.Group();
  const circumference = dimension(project, 'circumference', 22);
  const foot = dimension(project, 'foot', 24);
  const leg = dimension(project, 'leg', 18);
  const r = circumference / TAU;
  const toe = Math.max(foot * 0.52, foot - 1.04 * r);
  // y, z, half-width, half-depth, rotation of the dorsal side around x.
  const sections = [
    [r * 0.63, toe, r * 0.012, r * 0.012, 0],
    [r * 0.66, toe - foot * 0.047, r * 0.82, r * 0.48, 0],
    [r * 0.73, toe - foot * 0.13, r * 1.12, r * 0.66, 0.005],
    [r * 0.76, toe * 0.58, r * 1.10, r * 0.69, 0.055],
    [r * 0.91, toe * 0.27, r * 0.96, r * 0.79, 0.14],
    [r * 1.15, toe * 0.058, r * 1.01, r * 1.08, 0.39],
    [r * 1.66, r * -0.03, r * 1.02, r * 1.17, 0.89],
    [r * 2.36, 0, r * 0.96, r * 1.04, 1.44],
    [r * 2.8 + leg * 0.23, 0, r * 0.945, r * 0.96, Math.PI / 2],
    [r * 2.8 + leg * 0.69, r * -0.07, r * 1.02, r * 0.99, Math.PI / 2],
    [r * 2.8 + leg, r * -0.13, r * 1.035, r * 0.99, Math.PI / 2]
  ];
  const distances = [0];
  for (let i = 1; i < sections.length; i++) {
    distances.push(distances[i - 1] + Math.hypot(sections[i][0] - sections[i - 1][0], sections[i][1] - sections[i - 1][1]));
  }
  const pathLength = distances.at(-1);
  function surface(u, v) {
    const d = v * pathLength;
    let i = 0;
    while (i < sections.length - 2 && d > distances[i + 1]) i++;
    const f = (d - distances[i]) / (distances[i + 1] - distances[i]);
    const [y, z, rx, ry, angle] = stations(sections, (i + f) / (sections.length - 1));
    const a = wrapAngle(u);
    const radial = Math.max(r * 0.012, ry) * Math.cos(a);
    return V(Math.max(r * 0.012, rx) * Math.sin(a), y + radial * Math.cos(angle), z + radial * Math.sin(angle));
  }
  const id = second ? 'body-right' : 'body';
  const n = low ? 30 : 56;
  const cuff = clamp(leg * 0.24, 1.2, 6);
  const vCuff = clamp(1 - cuff / pathLength, 0.70, 0.98);
  fabric(group, grid(n, low ? 31 : 54, (u, v) => surface(u, v * vCuff), { closed: true }),
    knit('body', id, circumference, pathLength - cuff));
  fabric(group, grid(n, low ? 4 : 8, (u, v) => surface(u, mix(vCuff, 1, v)), { closed: true }),
    knit('rib', id + '-cuff', circumference, cuff, 'rib'));
  roll(group, u => surface(u, 1), circumference, r * 0.045, id + '-opening', low);
  lining(group, u => surface(u, 1), V(0, -1, 0), Math.min(leg * 0.72, r * 2.8), circumference, id + '-lining', low);
  return group;
}

function slipper(project, low, second) {
  const group = new THREE.Group();
  const foot = dimension(project, 'foot', 24);
  const circumference = dimension(project, 'circumference', 22);
  const height = dimension(project, 'leg', 5);
  const r = circumference / TAU;
  const id = second ? 'body-right' : 'body';
  function soleWidth(t) {
    return r * 1.24 * Math.pow(Math.max(0.00001, 4 * t * (1 - t)), 0.36)
      * (0.89 + 0.21 * smooth(0.26, 0.68, t));
  }
  function shell(u, v, inside = false) {
    const t = 1 - v;
    const arch = clamp((t - 0.10) / 0.55, 0, 1);
    const gap = 1.28 * Math.pow(Math.max(0, Math.sin(Math.PI * arch)), 0.71);
    const a = mix(gap, TAU - gap, u);
    const breadth = soleWidth(t);
    const wave = Math.pow(Math.max(0.001, Math.sin(Math.PI * t)), 0.32);
    const wallHeight = (height * (0.75 - 0.22 * t) + r * 0.53) * wave;
    const inset = inside ? 0.93 : 1;
    const top = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), Math.cos(a) > 0 ? 0.89 : 0.34);
    return V(breadth * Math.sin(a) * inset, wallHeight * (0.56 + 0.49 * top * inset), (t - 0.5) * foot);
  }
  const n = low ? 26 : 48;
  const h = low ? 24 : 42;
  fabric(group, grid(n, h, (u, v) => shell(u, v)), knit('body', id, circumference, foot));
  fabric(group, grid(low ? 18 : 35, low ? 17 : 30, (u, v) => shell(u, v, true), { reverse: true }),
    {...knit('trim', id + '-lining', circumference * 0.92, foot, 'garter'),inside:true});
  function lip(u) {
    const forward = u < 0.5;
    const t = mix(0.1, 0.65, forward ? 2 * u : 2 - 2 * u);
    return shell(forward ? 0 : 1, 1 - t);
  }
  roll(group, lip, foot * 1.20, clamp(r * 0.070, 0.15, 0.4), id + '-collar', low, 'garter');
  // The sole follows the actual outline rather than an oversized flat ellipse.
  function outline(u) {
    const a = wrapAngle(u);
    const t = (Math.cos(a) + 1) * 0.5;
    const sign = Math.sign(Math.sin(a));
    const side = soleWidth(t) * Math.min(1, Math.abs(Math.sin(a)) * 5);
    return V(sign * side * 0.97, 0, (t - 0.5) * foot);
  }
  const baseHeight = r * 0.20;
  fabric(group, grid(low ? 48 : 80, 3, (u, v) => {
    const p = outline(u);
    p.x *= 0.96 + 0.04 * Math.sin(Math.PI * v);
    p.y = baseHeight * v;
    return p;
  }, { closed: true }), knit('trim', id + '-sole-edge', foot * 2.4, baseHeight, 'garter'));
  fabric(group, grid(low ? 48 : 80, 3, (u, v) => outline(u).multiplyScalar(v), { closed: true }),
    knit('trim', id + '-sole', circumference / 2, foot, 'garter'));
  fabric(group, grid(low ? 40 : 68, 3, (u, v) => {
    const p = outline(u).multiplyScalar(v);
    p.y = baseHeight * (1 + 0.18 * (1 - v * v));
    return p;
  }, { closed: true, reverse: true }), knit('trim', id + '-footbed', circumference / 2, foot, 'garter'));
  return group;
}

function footwear(project, low, kind) {
  const group = new THREE.Group();
  const foot = dimension(project, 'foot', 24);
  const circumference = dimension(project, 'circumference', 22);
  const offset = circumference * 0.25 + foot * 0.115;
  for (const second of [false, true]) {
    const piece = kind === 'chaussons' ? slipper(project, low, second) : oneSock(project, low, second);
    piece.rotation.y = second ? 0.45 : -0.68;
    piece.rotation.z = kind === 'chaussons' ? 0 : second ? -0.075 : 0.055;
    piece.position.set(second ? offset : -offset, second ? foot * 0.085 : 0, second ? -foot * 0.18 : 0);
    group.add(piece);
  }
  // A shallow display tilt reveals the heel and the slipper opening from the front preset.
  group.rotation.x = kind === 'chaussons' ? 0.44 : 0.16;
  return group;
}

function handwear(project, low, fingerless) {
  const group = new THREE.Group();
  const circumference = dimension(project, 'circumference', 20);
  const length = dimension(project, 'length', fingerless ? 18 : 25);
  const thumbLength = dimension(project, 'thumb', fingerless ? 5 : 8);
  const r = circumference / TAU;
  const palmWidth = r * 1.30;
  const palmDepth = r * 0.67;
  const cuffHeight = length * (fingerless ? 0.29 : 0.245);
  const n = low ? 27 : 60;
  for (const sign of [-1, 1]) {
    const hand = new THREE.Group();
    const id = sign < 0 ? 'body' : 'body-right';
    function palm(u, v) {
      const a = wrapAngle(u);
      const width = mix(0.85, 1, smooth(0, 0.32, v)) - 0.035 * smooth(0.5, 0.92, v);
      const cap = clamp((v - 0.64) / 0.36, 0, 1);
      const crown = fingerless ? 1 : Math.sqrt(Math.max(0.00006, 1 - cap * cap));
      const tilt = -sign * palmWidth * 0.12 * v * v;
      const ease = palmDepth * 0.12 * Math.sin(Math.PI * v);
      const cut = fingerless ? 0.16 * r * (sign * Math.sin(a) - 0.3 * Math.cos(a)) * v * v : 0;
      return V(tilt + palmWidth * width * crown * Math.sin(a), cuffHeight + v * (length - cuffHeight) + cut,
        ease + palmDepth * (0.88 + 0.12 * width) * crown * Math.cos(a));
    }
    const rise = t => fingerless ? t : Math.sin(t * Math.PI / 2);
    fabric(hand, grid(n, low ? 17 : 36, (u, v) => palm(u, rise(v)), { closed: true, uv: (u, v) => [u, rise(v)] }),
      knit('body', id, circumference, length - cuffHeight));
    function cuff(u, v) {
      const a = wrapAngle(u), wide = mix(0.78, 0.85, smooth(0.18, 0.95, v));
      return V(palmWidth * wide * Math.sin(a), v * cuffHeight, palmDepth * (0.83 + 0.15 * v) * Math.cos(a));
    }
    fabric(hand, grid(n, low ? 4 : 8, cuff, { closed: true }), knit('rib', id + '-wrist', circumference * 0.86, cuffHeight, 'rib'));
    roll(hand, u => cuff(u, 0), circumference * 0.85, r * 0.035, id + '-wrist-edge', low);
    if (fingerless) {
      roll(hand, u => palm(u, 1), circumference, r * 0.048, id + '-finger-edge', low, 'garter');
      lining(hand, u => palm(u, 1), V(0, -1, 0), r * 1.7, circumference, id + '-finger-lining', low);
    }
    const thumb = new THREE.CubicBezierCurve3(
      V(sign * palmWidth * 0.66, cuffHeight + length * 0.13, palmDepth * 0.14),
      V(sign * (palmWidth + thumbLength * 0.24), cuffHeight + length * 0.22, palmDepth * 0.20),
      V(sign * (palmWidth + thumbLength * 0.40), cuffHeight + length * 0.16 + thumbLength * 0.60, palmDepth * 0.40),
      V(sign * (palmWidth + thumbLength * 0.47), cuffHeight + length * 0.16 + thumbLength * 0.91, palmDepth * 0.44));
    const count = low ? 11 : 24;
    const frames = pathFrames(thumb, count);
    const thumbRadius = r * (fingerless ? 0.42 : 0.46);
    function thumbSurface(u, v) {
      const i = Math.round(v * count), theta = wrapAngle(u);
      const cap = clamp((v - 0.70) / 0.30, 0, 1);
      const tip = fingerless ? 1 : Math.sqrt(Math.max(0.00005, 1 - cap * cap));
      const radius = thumbRadius * (1.11 - 0.15 * v) * tip;
      return frames.points[i].clone().addScaledVector(frames.widthAxes[i], radius * Math.sin(theta))
        .addScaledVector(frames.normals[i], radius * Math.cos(theta));
    }
    fabric(hand, grid(low ? 18 : 34, count, thumbSurface, { closed: true }),
      knit('sleeve', id + '-thumb', TAU * thumbRadius, thumbLength));
    if (fingerless) {
      roll(hand, u => thumbSurface(u, 1), TAU * thumbRadius, r * 0.038, id + '-thumb-edge', low);
      lining(hand, u => thumbSurface(u, 1), thumb.getTangentAt(1).negate(), thumbRadius * 1.45,
        TAU * thumbRadius, id + '-thumb-lining', low);
    }
    hand.position.set(sign * (palmWidth * 1.43), sign > 0 ? length * 0.075 : 0, sign > 0 ? -palmDepth * 0.72 : 0);
    hand.rotation.z = sign * 0.095;
    hand.rotation.y = sign * 0.07;
    group.add(hand);
  }
  return group;
}

function disc(project, low) {
  const group = new THREE.Group();
  const diameter = dimension(project, 'width', 36);
  const radius = diameter / 2;
  function plate(u, v) {
    const a = wrapAngle(u);
    return V(radius * v * Math.sin(a), radius * v * Math.cos(a),
      radius * (0.027 * v * v * Math.sin(4 * a + v) + 0.018 * Math.cos(Math.PI * v)));
  }
  const uv = (u, v) => [0.5 + 0.5 * v * Math.sin(wrapAngle(u)), 0.5 + 0.5 * v * Math.cos(wrapAngle(u))];
  const segments = low ? 52 : 90;
  const rings = low ? 10 : 18;
  fabric(group, grid(segments, rings, plate, { closed: true, uv }), knit('body', 'body', diameter, diameter));
  const edgeRadius = clamp(diameter * 0.004, 0.07, 0.28);
  fabric(group, grid(segments, rings, (u, v) => plate(u, v).sub(V(0, 0, edgeRadius)),
    { closed: true, uv, reverse: true }), {...knit('body', 'body', diameter, diameter, 'garter'),inside:true});
  roll(group, u => plate(u, 1), Math.PI * diameter, edgeRadius, 'rolled-edge', low, 'garter');
  return group;
}

export function buildObject(project, lowDetail = false) {
  const kind = project.kind;
  let group;
  switch (kind) {
    case 'bonnet': group = beanie(project, lowDetail); break;
    case 'echarpe': group = scarf(project, lowDetail); break;
    case 'snood':
    case 'bandeau': group = ringCloth(project, lowDetail, kind); break;
    case 'chale':
    case 'couverture':
    case 'lavette': group = panelObject(project, lowDetail, kind); break;
    case 'chaussettes':
    case 'chaussons': group = footwear(project, lowDetail, kind); break;
    case 'mitaines':
    case 'moufles': group = handwear(project, lowDetail, kind === 'mitaines'); break;
    case 'coussin': group = cushion(project, lowDetail); break;
    case 'sac': group = bag(project, lowDetail); break;
    case 'libre': {
      if (project.form === 'disque') group = disc(project, lowDetail);
      else if (project.form === 'tube') group = ringCloth(project, lowDetail, 'tube');
      else group = panelObject(project, lowDetail, project.form === 'triangle' ? 'triangle' : 'rectangle');
      break;
    }
    default: throw new RangeError('Ouvrage inconnu : ' + kind);
  }
  group.name = kind;
  if (['bonnet','snood','bandeau','chaussettes','mitaines','moufles','sac'].includes(kind) || (kind==='libre' && project.form==='tube')) {
    group.traverse(object=>{
      const k=object.userData.knit;
      if(k && (k.part==='body'||k.part==='sleeve'))k.circular=true;
    });
  }
  return group;
}
