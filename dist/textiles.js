/* Motifs originaux pour l’atelier Maille. La première ligne d’une grille est son haut. */

function gridOf(cols, rows, sample = () => 0) {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => sample(x, y)));
}

function pattern(id, name, group, grid, description) {
  return { id, name, group, cols: grid[0].length, rows: grid.length, grid, description };
}

function wrap(value, period) {
  return ((value % period) + period) % period;
}

// Un point laisse la couleur présente dessous. Le report traverse les bords
// afin de raccorder les motifs en quinconce au tour suivant.
function stamp(grid, drawing, left, top, thread = 1) {
  drawing.forEach((line, y) => {
    [...line].forEach((mark, x) => {
      if (mark === '.') return;
      const color = mark === '+' ? 2 : thread;
      grid[wrap(top + y, grid.length)][wrap(left + x, grid[0].length)] = color;
    });
  });
  return grid;
}

function mirrorHalf(half) {
  return half.map(line => line + [...line].reverse().join(''));
}

function nordicRose() {
  const petals = Array.from({ length: 8 }, (_, k) => {
    const angle = k * Math.PI / 4;
    return [Math.cos(angle), Math.sin(angle)];
  });
  return gridOf(24, 24, (x, y) => {
    if (y === 1 || y === 22) return 2;
    if (y === 3 || y === 20) return (x % 4 === 1 || x % 4 === 2) ? 1 : 0;
    const dx = x - 12, dy = y - 12;
    if (dx === 0 && dy === 0) return 2;
    if (dx * dx + dy * dy <= 2) return 1;
    const petal = petals.some(([vx, vy]) => {
      const r = dx * vx + dy * vy;
      const d = Math.abs(dx * vy - dy * vx);
      const spread = r <= 5.3 ? r / 5.3 : (8.3 - r) / 3;
      return r > 0 && r < 8.3 && d < 0.20 + 1.32 * spread;
    });
    if (petal) return 1;
    const nearEdge = Math.min(x, 23 - x);
    return nearEdge + Math.abs(y - 11.5) < 2.1 ? 2 : 0;
  });
}

function littleForest() {
  const grid = gridOf(22, 18, (x, y) => y === 16 ? 2 : 0);
  const tree = [
    '....#....', '...###...', '....#....', '..#####..',
    '...###...', '.#######.', '..#####..', '#########',
    '....#....', '....#....'
  ];
  stamp(grid, tree, 1, 5);
  stamp(grid, ['..#..', '.###.', '..#..', '#####', '..#..'], 14, 10);
  for (const [x, y] of [[0, 1], [7, 2], [12, 6], [17, 4], [21, 9]]) grid[y][x] = 1;
  return grid;
}

function winterWalk() {
  const grid = gridOf(24, 20, (x, y) => y === 18 || (y === 1 && x % 4 === 0) ? 2 : 0);
  const deer = [
    '............#..#..', '............#.#.#.', '...........#.##...',
    '............##....', '............###...', '...........#######',
    '..#.......####....', '...###########....', '..###########.....',
    '...#########......', '....##...##.......', '...##....###......',
    '...#......#.#.....', '..##......#..#....'
  ];
  return stamp(grid, deer, 2, 3);
}

function windingLeaves() {
  const grid = gridOf(18, 24);
  for (let y = 0; y < 24; y++) {
    const x = Math.round(8.5 + 2.2 * Math.sin(y * Math.PI / 12));
    grid[y][x] = 1;
  }
  const leaf = ['....##', '...###', '..##.#', '.####.', '.###..', '##....'];
  stamp(grid, leaf, 10, 3);
  stamp(grid, leaf.map(line => [...line].reverse().join('')), 2, 11);
  stamp(grid, ['.+.', '+++', '.+.'], 10, 17);
  return grid;
}

function meander() {
  const grid = gridOf(16, 12);
  const points = [[-2, 3], [11, 3], [11, 8], [5, 8], [5, 5], [8, 5], [8, 6]];
  const path = (x0, y0, x1, y1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i++) {
      grid[Math.round(y0 + (y1 - y0) * i / steps)][wrap(Math.round(x0 + (x1 - x0) * i / steps), 16)] = 1;
    }
  };
  for (let i = 1; i < points.length; i++) path(...points[i - 1], ...points[i]);
  path(14, 3, 14, 10); path(14, 10, 2, 10); path(2, 10, 2, 5);
  for (let x = 0; x < 16; x++) grid[0][x] = 2;
  return grid;
}

function hearts() {
  const grid = gridOf(18, 18);
  const drawing = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  stamp(grid, drawing, 2, 1);
  stamp(grid, drawing, 11, 10, 2);
  return grid;
}

function butterflies() {
  const grid = gridOf(16, 14);
  const half = ['.....#', '.##...', '####.#', '.#####', '..####', '...#.+', '..####', '.###.#', '..##..'];
  return stamp(grid, mirrorHalf(half), 2, 2);
}

function daisies() {
  const grid = gridOf(18, 18);
  const flower = ['...#...', '..###..', '.#.+.#.', '##+++##', '.#.+.#.', '..###..', '...#...'];
  stamp(grid, flower, 1, 1);
  stamp(grid, flower, 10, 10);
  return grid;
}

function tinyBunnies() {
  const grid = gridOf(16, 16);
  const bunny = [
    '..#..#......', '..#..#......', '..##.##.....', '...###......', '..####......',
    '.##.###.....', '.#####......', '...#######..', '...########.', '...#######.+',
    '...########.', '..###..####.', '.####.####..'
  ];
  return stamp(grid, bunny, 2, 1);
}

function bees() {
  const grid = gridOf(16, 12);
  const bee = [
    '...##.##....', '..##.#.##...', '..##.#.##...', '...#####....',
    '..##++##++#.', '.###++##++##', '..##++##++#.', '...#######..'
  ];
  stamp(grid, bee, 1, 2);
  grid[5][14] = 1;
  return grid;
}

function pebbles() {
  const grid = gridOf(12, 12);
  const stone = ['.##.', '####', '####', '.##.'];
  stamp(grid, stone, 1, 1);
  stamp(grid, stone, 7, 7, 2);
  return grid;
}

function fanBorder() {
  return gridOf(16, 12, (x, y) => {
    const phase = y < 6 ? x : wrap(x + 8, 16);
    const dx = Math.abs(phase - 7.5), dy = (y % 6) - 5.5;
    const radius = Math.sqrt(dx * dx + dy * dy * 1.8);
    if (radius >= 6.5 && radius < 8) return 1;
    if (radius < 1.8) return 2;
    return 0;
  });
}

function snowCrystals() {
  const grid = gridOf(16, 16);
  const drawing = [
    '....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########',
    '...###...', '..#.#.#..', '.#..#..#.', '....#....'
  ];
  stamp(grid, drawing, 4, 4);
  stamp(grid, ['.+.', '+++', '.+.'], -1, -1);
  return grid;
}

export const PATTERNS = [
  pattern('nordic', 'Étoile nordique', 'Jacquard', nordicRose(),
    'Rosace à huit pointes entre deux liserés, pour un empiècement ou une bordure.'),
  pattern('crystals', 'Cristaux de neige', 'Jacquard', snowCrystals(),
    'Deux tailles de flocons se répondent en quinconce.'),
  pattern('fir', 'Forêt de sapins', 'Jacquard', littleForest(),
    'Une frise de grands et petits sapins sur fond de neige.'),
  pattern('deer', 'Rennes d’hiver', 'Jacquard', winterWalk(),
    'Un renne de profil et deux lignes de couleur forment une frise.'),
  pattern('crosses', 'Petites croix', 'Jacquard', gridOf(12, 12, (x, y) => {
    const shifted = wrap(x - (y < 6 ? 0 : 6), 12);
    const dx = Math.abs(shifted - 5), dy = Math.abs((y % 6) - 2);
    return dx + dy <= 1 ? 1 : 0;
  }), 'Des croix de cinq mailles disposées en quinconce.'),
  pattern('greek', 'Clé grecque', 'Géométrie', meander(),
    'Un méandre à angles droits, à répéter le long d’un bord.'),
  pattern('houndstooth', 'Pied-de-poule', 'Géométrie', gridOf(8, 8, (x, y) => {
    const warp = x < 4 ? 1 : 0, weft = y < 4 ? 1 : 0;
    return wrap(x - y, 4) < 2 ? warp : weft;
  }), 'Un petit rapport bicolore, avec des angles en escalier.'),
  pattern('chevron', 'Chevrons', 'Géométrie', gridOf(16, 12, (x, y) => {
    const level = wrap(y - Math.abs(x - 7), 12);
    if (level < 2) return 1;
    return level === 5 ? 2 : 0;
  }), 'Deux zigzags d’épaisseurs différentes traversent la grille.'),
  pattern('diamond', 'Losanges en chaîne', 'Géométrie', gridOf(12, 12, (x, y) => {
    const distance = Math.abs(x - 5.5) + Math.abs(y - 5.5);
    if (distance < 2) return 2;
    return distance === 6 ? 1 : 0;
  }), 'Des losanges fins entourent un petit centre contrasté.'),
  pattern('fans', 'Éventails', 'Géométrie', fanBorder(),
    'Des arches décalées forment des rangées d’écailles.'),
  pattern('checkers', 'Damier', 'Géométrie', gridOf(8, 8, (x, y) =>
    (Math.floor(x / 4) + Math.floor(y / 4)) % 2), 'Des carrés de quatre mailles alternent en deux couleurs.'),
  pattern('herringbone', 'Bâtons rompus', 'Géométrie', gridOf(12, 12, (x, y) => {
    const side = Math.floor(x / 6), tooth = x % 6;
    const level = wrap(y + (side === 0 ? tooth : -tooth - 1), 6);
    return level < 3 ? 1 : 0;
  }), 'De courtes diagonales jointives dessinent un tissu à chevrons.'),
  pattern('leaves', 'Rameau et baies', 'Nature', windingLeaves(),
    'Une tige serpente entre deux feuilles et une petite baie.'),
  pattern('daisies', 'Marguerites', 'Nature', daisies(),
    'Des fleurs à cœur contrasté, décalées d’une rangée à l’autre.'),
  pattern('wave', 'Petites vagues', 'Nature', gridOf(20, 12, (x, y) => {
    const level = wrap(y - Math.round(2 * Math.sin(x * Math.PI / 10)), 12);
    if (level < 2) return 1;
    return level === 6 ? 2 : 0;
  }), 'Deux lignes ondulées se répètent horizontalement.'),
  pattern('seeds', 'Grains de blé', 'Nature', gridOf(12, 12, (x, y) => {
    const line = y % 6, stem = y < 6 ? 3 : 9;
    if (line === 0 || line === 5) return 0;
    if (x === stem) return 1;
    const offset = line < 3 ? -1 : 1;
    return x === stem + offset ? 1 : 0;
  }), 'De petits épis bicolores espacés sur un fond uni.'),
  pattern('heart', 'Petits cœurs', 'Figuratif', hearts(),
    'Deux couleurs de cœurs alternent sur un fond commun.'),
  pattern('butterfly', 'Papillons', 'Figuratif', butterflies(),
    'Deux ailes symétriques avec une maille de contraste au centre.'),
  pattern('rabbit', 'Petits lapins', 'Figuratif', tinyBunnies(),
    'Un lapin assis avec une queue en couleur d’accent.'),
  pattern('bee', 'Abeilles', 'Figuratif', bees(),
    'Des abeilles rayées à deux petites ailes sur un fond uni.'),
  pattern('pebbles', 'Pois galets', 'Pois et carreaux', pebbles(),
    'Des pois arrondis en deux nuances, alignés en diagonale.'),
  pattern('dots', 'Plumetis', 'Pois et carreaux', gridOf(8, 8, (x, y) =>
    (x === 2 && y === 2) || (x === 6 && y === 6) ? 1 : 0),
    'Une seule maille contrastée par point.'),
  pattern('gingham', 'Vichy', 'Pois et carreaux', gridOf(12, 12, (x, y) =>
    Number(x < 6) + Number(y < 6)), 'Trois tons restituent l’intersection des bandes du vichy.'),
  pattern('tartan', 'Carreaux croisés', 'Pois et carreaux', gridOf(16, 16, (x, y) => {
    if (x === 10 || y === 10) return 2;
    if ((x < 4 && y < 4) || ((x < 4 || y < 4) && wrap(x - y, 4) < 2)) return 1;
    return 0;
  }), 'Un carreau large traversé par une fine ligne de contraste.'),
  pattern('stripe', 'Marinière', 'Rayures', gridOf(8, 10, (_, y) => y < 3 ? 1 : 0),
    'Trois rangs de rayure alternent avec sept rangs de fond.'),
  pattern('mist', 'Rayures de brume', 'Rayures', gridOf(8, 16, (_, y) => {
    if (y >= 3 && y <= 5) return 1;
    return y === 9 || y === 12 ? 2 : 0;
  }), 'Une bande large et deux filets composent le rapport.'),
  pattern('diagonal', 'Biais bicolore', 'Rayures', gridOf(10, 10, (x, y) =>
    wrap(x - y, 10) < 3 ? 1 : 0), 'Une rayure de trois mailles se décale à chaque rang.'),
  pattern('blank', 'Grille vierge', 'À dessiner', gridOf(24, 24),
    'Vingt-quatre mailles sur vingt-quatre rangs pour dessiner librement.')
];

const HEIGHT_RATIO = 0.8;
const TAU = 2 * Math.PI;
const tileCache = new Map();

const fibers = {
  laine: { halo: 0.26, highlight: 0.11, twist: 3.15 },
  merinos: { halo: 0.20, highlight: 0.10, twist: 3.55 },
  coton: { halo: 0.03, highlight: 0.17, twist: 3.95 },
  alpaga: { halo: 0.32, highlight: 0.13, twist: 2.65 },
  mohair: { halo: 0.70, highlight: 0.12, twist: 2.05 },
  melange: { halo: 0.23, highlight: 0.12, twist: 3.25 }
};

function materialFor(label = '') {
  const name = String(label).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return ['mohair', 'alpaga', 'merinos', 'coton', 'melange', 'laine']
    .find(key => name.includes(key)) || 'laine';
}

function rgbOf(hex, fallback = '#84917f') {
  const value = /^#[0-9a-f]{6}$/i.test(hex || '') ? hex : fallback;
  const n = Number.parseInt(value.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function numberWithin(value, min, max, fallback) {
  return Number.isFinite(Number(value)) ? Math.max(min, Math.min(max, Number(value))) : fallback;
}

function numberNoise(x, y) {
  let n = Math.imul(x + 31, 0x45d9f3b) ^ Math.imul(y + 73, 0x27d4eb2d);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function createCanvas(width, height) {
  const canvas = typeof document !== 'undefined'
    ? document.createElement('canvas')
    : new OffscreenCanvas(width, height);
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function cubic(points, t) {
  const s = 1 - t;
  return [0, 1].map(i => points[0][i] * s * s * s + 3 * points[1][i] * t * s * s +
    3 * points[2][i] * t * t * s + points[3][i] * t * t * t);
}

const STOCK = [
  { points: [[-0.02, -0.23], [0.04, 0.13], [0.21, 0.64], [0.51, 1.02]], r: 0.148, z: 0.004, phase: 0.15 },
  { points: [[0.49, 1.04], [0.67, 0.79], [0.94, 0.18], [1.02, -0.23]], r: 0.15, z: 0.008, phase: 0.71 }
];
const RIB = [
  { points: [[0.05, -0.18], [0.075, 0.12], [0.20, 0.69], [0.50, 1.045]], r: 0.165, z: 0.032, phase: 0.12 },
  { points: [[0.50, 1.035], [0.71, 0.74], [0.93, 0.13], [0.95, -0.18]], r: 0.167, z: 0.031, phase: 0.74 }
];
const PURL = [
  { points: [[-0.19, 0.78], [-0.08, 0.23], [0.16, 0.08], [0.43, 0.25]], r: 0.13, z: -0.08, phase: 0.40 },
  { points: [[0.62, 0.24], [0.86, -0.03], [1.17, 0.42], [1.12, 0.69]], r: 0.13, z: -0.08, phase: 0.64 },
  { points: [[0.02, 0.62], [0.23, 0.23], [0.72, 0.74], [0.985, 0.38]], r: 0.16, z: 0.035, phase: 0.21 }
];
const UNDERLOOP = {
  points: [[-0.21, 0.20], [0.13, -0.09], [0.71, 0.11], [1.13, -0.015]],
  r: 0.142, z: -0.14, phase: 0.48
};

function curvesFor(style, col, row) {
  if (style === 'rib') return (col & 1) ? PURL : RIB;
  if (style === 'seed') return ((col + row) & 1) ? PURL : STOCK;
  if (style === 'garter') return (row & 1) ? STOCK : PURL;
  return STOCK;
}

// Rasterise the local cross-section of a twisted yarn. Tube normals follow
// the curve, so the same light gives continuous shading over a knitted leg.
function shadeSegment(field, a, b, radius, baseZ, startArc, phase, material, hasCompanion) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
  if (!len) return;
  const tw = field.width, th = field.height;
  const left = Math.max(0, Math.floor((Math.min(a[0], b[0]) - radius) * tw));
  const right = Math.min(tw - 1, Math.ceil((Math.max(a[0], b[0]) + radius) * tw));
  const top = Math.max(0, Math.floor((Math.min(a[1], b[1]) - radius) * th / HEIGHT_RATIO));
  const bottom = Math.min(th - 1, Math.ceil((Math.max(a[1], b[1]) + radius) * th / HEIGHT_RATIO));
  const nx = -dy / len, ny = dx / len;
  for (let py = top; py <= bottom; py++) {
    for (let px = left; px <= right; px++) {
      const vx = (px + 0.5) / tw - a[0], vy = (py + 0.5) / th * HEIGHT_RATIO - a[1];
      const t = Math.max(0, Math.min(1, (vx * dx + vy * dy) / (len * len)));
      const ex = vx - dx * t, ey = vy - dy * t;
      const cross = (ex * ex + ey * ey) / (radius * radius);
      if (cross >= 1) continue;
      const nz = Math.sqrt(1 - cross);
      const signed = Math.max(-1, Math.min(1, (vx * nx + vy * ny) / radius));
      const z = baseZ + radius * nz;
      const i = (py * tw + px);
      if (field.depth[i] >= z) continue;
      field.depth[i] = z;
      const along = startArc + len * t;
      const braid = TAU * (along * material.twist + phase) + 2.45 * Math.asin(signed);
      const strandWave = Math.cos(braid * 3);
      const separation = Math.max(0, -strandWave);
      const lambert = Math.max(0, nz * 0.75 - signed * (nx * 0.51 + ny * 0.43));
      const fineTwist = Math.sin(braid * 14 + 4 * signed + Math.sin(braid) * 0.45);
      const shadow = 0.11 * Math.min(0, baseZ * 5);
      const glint = material.highlight * Math.pow(lambert, 5) * (0.65 + 0.35 * strandWave);
      field.light[i] = 0.59 + 0.47 * lambert + shadow + 0.035 * strandWave
        - 0.07 * separation * separation + 0.031 * fineTwist + glint
        + (numberNoise(px, py) - 0.5) * (0.09 + 0.06 * material.halo);
      if (hasCompanion) {
        field.blend[i] = 0.5 + 0.5 * Math.tanh(3.4 * (Math.sin(braid * 0.78) - field.contrastThreshold));
      }
    }
  }
}

function drawCurve(field, curve, col, row, thickness, material, companion, recessed) {
  let last = cubic(curve.points, 0);
  let along = 0;
  const sampleCount = 13;
  for (let step = 1; step <= sampleCount; step++) {
    const t = step / sampleCount;
    const now = cubic(curve.points, t);
    const a = [last[0] + col, (last[1] + row) * HEIGHT_RATIO];
    const b = [now[0] + col, (now[1] + row) * HEIGHT_RATIO];
    const radius = curve.r * thickness * (0.94 + 0.09 * Math.sin(Math.PI * t));
    // Ends dive into adjacent loops; the middle of a knitted leg sits proud.
    const lift = curve.z + 0.036 * Math.sin(Math.PI * t) - recessed;
    shadeSegment(field, a, b, radius, lift, along, curve.phase, material, companion);
    along += Math.hypot(b[0] - a[0], b[1] - a[1]);
    last = now;
  }
}

function addHalo(ctx, yarnRgb, material, width, height) {
  const count = Math.round(material.halo * 61);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.35, width / 110);
  for (let i = 0; i < count; i++) {
    const x = numberNoise(i, 12) * width, y = numberNoise(i, 45) * height;
    const direction = x < width / 2 ? 1 : -1;
    const length = (0.10 + numberNoise(i, 96) * 0.24) * height;
    const light = 8 + Math.round(numberNoise(i, 9) * 36);
    const rgb = yarnRgb.map(c => Math.min(255, c + light));
    ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + (0.09 + numberNoise(i, 71) * 0.16) + ')';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + direction * length * 0.58, y + length * 0.33,
      x + direction * length * (0.29 + numberNoise(i, 53) * 0.7), y + length);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * One tile is one stitch. Its native width is size px and its height is
 * 0.8 × size; draw to the project's stitch proportions calculated from gauge.
 * For rib, garter, seed: variant = (column & 1) | ((row & 1) << 1).
 * A companion strand shares each loop, including its twist and relief.
 */
export function createStitchTile(yarn = {}, style = 'stockinette', size = 40, variant = 0) {
  const width = Math.round(numberWithin(size, 8, 160, 40));
  const height = Math.max(6, Math.round(width * HEIGHT_RATIO));
  const fiber = materialFor(yarn.fiber);
  const weight = Math.round(numberWithin(yarn.weight, 0, 7, 3));
  const stitch = ['stockinette', 'rib', 'garter', 'seed'].includes(style) ? style : 'stockinette';
  const phase = stitch === 'stockinette' ? 0 : (variant & 3);
  const base = rgbOf(yarn.color || yarn.hex);
  const companionColor = yarn.companion && (yarn.companion.color || yarn.companion.hex);
  const secondary = companionColor ? rgbOf(companionColor) : null;
  const companionWeight = secondary ? numberWithin(yarn.companion.weight, 0, 7, weight) : weight;
  const companionFiber = secondary ? materialFor(yarn.companion.fiber) : fiber;
  const key = [base, secondary, fiber, weight, companionFiber, companionWeight, stitch, width, phase].join('|');
  if (tileCache.has(key)) return tileCache.get(key);
  const proportion = secondary ? 1 / (1 + Math.pow(1.42, weight - companionWeight)) : 0;
  const material = { ...fibers[fiber] };
  if (secondary) {
    for (const key of Object.keys(material)) {
      material[key] = material[key] * (1 - proportion) + fibers[companionFiber][key] * proportion;
    }
  }
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);
  const count = width * height;
  const field = {
    width, height, depth: new Float32Array(count).fill(-1),
    light: new Float32Array(count), blend: new Float32Array(count), contrastThreshold: Math.cos(Math.PI * proportion)
  };
  const thickness = 1.03 + (weight - 3) * 0.022 + (secondary ? 0.035 : 0);
  const cx = phase & 1, cy = (phase >> 1) & 1;
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      const localCol = cx + col, localRow = cy + row;
      const recessed = stitch === 'rib' && (localCol & 1) ? 0.063 : 0;
      drawCurve(field, UNDERLOOP, col, row, thickness, material, secondary, recessed);
      for (const curve of curvesFor(stitch, localCol, localRow)) {
        drawCurve(field, curve, col, row, thickness, material, secondary, recessed);
      }
    }
  }
  for (let i = 0; i < count; i++) {
    const light = field.depth[i] > -1 ? field.light[i] : 0.43 + numberNoise(i % width, Math.floor(i / width)) * 0.11;
    const mix = field.depth[i] > -1 ? field.blend[i] : 0.35;
    for (let channel = 0; channel < 3; channel++) {
      const color = secondary ? base[channel] * (1 - mix) + secondary[channel] * mix : base[channel];
      // A little reflected light preserves relief on charcoal and navy yarns.
      image.data[4 * i + channel] = color * light + Math.max(0, light - 0.62) * 9;
    }
    image.data[4 * i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const haloColor = secondary ? base.map((c, i) => c * (1 - proportion) + secondary[i] * proportion) : base;
  addHalo(ctx, haloColor, material, width, height);
  if (tileCache.size >= 224) tileCache.delete(tileCache.keys().next().value);
  tileCache.set(key, canvas);
  return canvas;
}
