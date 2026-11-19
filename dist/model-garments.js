import * as THREE from './vendor/three.module.js';

export const GARMENT_KINDS = Object.freeze([
  'pull', 'gilet', 'debardeur', 'robe', 'poncho', 'brassiere', 'jupe'
]);

const PI = Math.PI;
const TAU = 2 * PI;
const mix = THREE.MathUtils.lerp;
const clamp = THREE.MathUtils.clamp;
const smooth = x => x * x * (3 - 2 * x);
const vec = (x, y, z) => new THREE.Vector3(x, y, z);
const samples = n => Array.from({ length: n + 1 }, (_, i) => i / n);
const between = (a, b, n) => samples(n).map(t => mix(a, b, t));
const positive = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const sumLength = points => points.reduce((total, p, i) => total + (i ? p.distanceTo(points[i - 1]) : 0), 0);

function unique(values) {
  return values.sort((a, b) => a - b).filter((value, i, arr) => !i || value - arr[i - 1] > 0.00001);
}

// Ramanujan's approximation preserves the entered circumference even for a
// flattened silhouette viewed on an invisible dress form.
function ellipseRadius(circumference, ratio) {
  const unitPerimeter = PI * (3 * (1 + ratio) - Math.sqrt((3 + ratio) * (1 + 3 * ratio)));
  return circumference / unitPerimeter;
}

function meshGrid(uValues, vValues, pointAt, { reverse = false, uvAt = (u, v) => [u, v] } = {}) {
  const positions = [];
  const textureCoordinates = [];
  const triangles = [];
  const stride = uValues.length;
  vValues.forEach((v, row) => {
    uValues.forEach((u, column) => {
      const point = pointAt(u, v);
      positions.push(point.x, point.y, point.z);
      textureCoordinates.push(...uvAt(u, v));
      if (row === vValues.length - 1 || column === stride - 1) return;
      const a = row * stride + column;
      const b = a + 1;
      const c = a + stride;
      const d = c + 1;
      if (reverse) triangles.push(a, c, b, b, c, d);
      else triangles.push(a, b, c, b, d, c);
    });
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(textureCoordinates, 2));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  // A shoulder strip collapses to a point at the side of the neckline. Give
  // duplicated pole vertices the normal of the first intact adjacent face.
  const normals = geometry.attributes.normal;
  const normal = new THREE.Vector3();
  for (let i = 0; i < normals.count; i++) {
    normal.fromBufferAttribute(normals, i);
    if (normal.lengthSq() > 0.25) continue;
    const neighbor = i % stride === stride - 1 ? i - 1 : i + 1;
    normal.fromBufferAttribute(normals, neighbor);
    if (normal.lengthSq() < 0.25) normal.set(0, 1, 0);
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  return geometry;
}

function atelier(kind, lowDetail) {
  const group = new THREE.Group();
  group.name = kind;
  const yarn = new THREE.MeshStandardMaterial({ color: 0xd7bfa5, roughness: 0.96, side: THREE.DoubleSide });
  const wood = new THREE.MeshStandardMaterial({ color: 0x936336, roughness: 0.63, side: THREE.DoubleSide });
  const darkWood = new THREE.MeshStandardMaterial({ color: 0x423424, roughness: 0.9, side: THREE.DoubleSide });
  const yarnMaterial = (name, geometry, part, surface, widthCm, heightCm, style = 'stockinette') => {
    const mesh = new THREE.Mesh(geometry, yarn);
    mesh.name = name;
    mesh.userData.knit = { part, surface, widthCm: Math.max(0.2, widthCm), heightCm: Math.max(0.2, heightCm), style };
    if(part==='sleeve'||(part==='body'&&surface==='body'))mesh.userData.knit.circular=true;
    group.add(mesh);
    return mesh;
  };
  return { group, yarnMaterial, wood, darkWood, lowDetail };
}

function measurements(project) {
  const m = project.measures || {};
  const baby = project.kind === 'brassiere';
  const chest = positive(m.chest, baby ? 47 : 104);
  const length = positive(m.length, baby ? 27 : project.kind === 'robe' ? 91 : 63);
  const armhole = Math.min(positive(m.armhole, baby ? 11 : 22), length * 0.74);
  const neck = Math.min(positive(m.neck, baby ? 25 : 41), chest * 0.74);
  const upperArm = positive(m.upperArm, baby ? 17 : 35);
  return {
    chest, length, armhole, neck, upperArm,
    sleeve: positive(m.sleeve, baby ? 17 : 44),
    cuff: positive(m.cuff, baby ? 12 : 19),
    hem: positive(m.hem, project.kind === 'robe' ? chest * 1.22 : chest * 0.95)
  };
}

function topBlock(project) {
  const m = measurements(project);
  const { kind } = project;
  const collar = ['high', 'v'].includes(project.collar) ? project.collar : 'round';
  const baby = kind === 'brassiere';
  const sleeveless = kind === 'debardeur';
  const dress = kind === 'robe';
  const ratio = baby ? 0.46 : 0.54;
  const chestRadius = ellipseRadius(m.chest, ratio);
  const hemRadius = ellipseRadius(m.hem, ratio);
  const neckRadius = ellipseRadius(m.neck, 0.78);
  const shoulderRadius = Math.max(chestRadius * (sleeveless ? 0.90 : 1.02), neckRadius * 1.22);
  const drop = Math.min(m.armhole * 0.18, chestRadius * 0.19);
  const frontDip = Math.min(m.armhole * (collar === 'v' ? 0.82 : collar === 'high' ? 0.15 : 0.40), m.length * 0.32);
  const backDip = Math.min(2.6, m.armhole * 0.12);
  const hemBand = Math.min(m.length * (dress ? 0.035 : 0.068), baby ? 2.1 : 4.6);
  const underY = m.length - m.armhole;
  const underT = (underY - hemBand) / (m.length - hemBand);
  const neckU = Math.asin(clamp(neckRadius / shoulderRadius, 0.02, 0.99)) / (PI / 2);
  const shoulderThickness = Math.min(m.armhole * 0.2, chestRadius * 0.22);
  const gapU = kind === 'gilet' ? 0.028 : 0;

  function widthAt(baseY) {
    if (baseY >= underY) {
      const h = clamp((baseY - underY) / m.armhole, 0, 1);
      const cut = sleeveless ? chestRadius * 0.14 * Math.sin(PI * h) ** 0.78 : chestRadius * 0.02 * Math.sin(PI * h);
      return mix(chestRadius, shoulderRadius, smooth(h)) - cut;
    }
    const fraction = clamp((baseY - hemBand) / Math.max(1, underY - hemBand), 0, 1);
    if (dress) {
      const waist = chestRadius * 0.89;
      if (fraction < 0.61) return mix(hemRadius, waist, fraction / 0.61);
      return mix(waist, chestRadius, smooth((fraction - 0.61) / 0.39));
    }
    const eased = smooth(Math.min(fraction / 0.30, 1));
    return mix(hemRadius, chestRadius * 1.025, eased) - chestRadius * 0.025 * fraction;
  }

  function topEdge(u, front) {
    const x = shoulderRadius * Math.sin(u * PI / 2);
    const a = Math.abs(x);
    const side = front ? 1 : -1;
    if (a <= neckRadius + 0.00001) {
      const nx = Math.min(a / neckRadius, 1);
      const arc = Math.sqrt(Math.max(0, 1 - nx * nx));
      const amount = front && collar === 'v' ? 1 - nx : arc;
      return vec(x, m.length - (front ? frontDip : backDip) * amount, side * neckRadius * 0.78 * arc);
    }
    const s = (a - neckRadius) / (shoulderRadius - neckRadius);
    return vec(x, m.length - drop * s ** 1.16, side * shoulderThickness * Math.sin(s * PI / 2));
  }

  function point(u, t, front = true) {
    const theta = u * PI / 2;
    const baseY = mix(hemBand, m.length, t);
    const h = clamp((baseY - underY) / m.armhole, 0, 1);
    const rotation = front ? theta : PI - theta;
    const profile = widthAt(baseY);
    const edge = topEdge(u, front);
    const fold = (0.029 + (dress ? 0.057 : 0.015) * (1 - t)) *
      (Math.sin(7 * rotation + t * 1.7) * 0.63 + Math.sin(11 * rotation - t * 2.4) * 0.37) *
      (1 - t) ** 0.72;
    let x = profile * Math.sin(theta) * (1 + fold);
    let z = (front ? 1 : -1) * profile * ratio * Math.cos(theta) * (1 + 2 * fold);
    if (h > 0) {
      const edgeBlend = smooth(h);
      x = mix(x, edge.x, Math.pow(h, 4));
      z = mix(z, edge.z, edgeBlend);
      // The front and back part at the underarm and taper into the shoulder cap.
      z += (front ? 1 : -1) * Math.pow(Math.abs(u), 3.5) * Math.sin(PI * h) * shoulderThickness * 0.75;
    }
    const y = baseY + h ** 1.65 * (edge.y - m.length) +
      Math.min(0.7, m.length * 0.011) * (1 - t) ** 2 * Math.sin(3 * rotation + 0.65);
    return vec(x, y, z);
  }

  function bridge(sign, along, across) {
    const u = sign * mix(neckU, 1, along);
    const front = point(u, 1, true);
    const back = point(u, 1, false);
    const p = front.lerp(back, across);
    p.y += Math.sin(PI * across) * Math.sin(PI * along / 2) * Math.min(1.45, m.armhole * 0.066);
    return p;
  }

  return { ...m, kind, collar, ratio, chestRadius, shoulderRadius, neckRadius, neckU, underT, underY,
    shoulderThickness, hemBand, gapU, point, bridge, topEdge };
}

function addBody(art, b) {
  const n = art.lowDetail ? 18 : 38;
  const columns = unique([...between(-1, 1, n), -b.neckU, -b.neckU / 2, b.neckU / 2, b.neckU]);
  const rows = unique([
    ...between(0, b.underT, art.lowDetail ? 8 : 18),
    ...between(b.underT, 1, art.lowDetail ? 8 : 16)
  ]);
  const frontRanges = b.gapU ? [[-1, -b.gapU], [b.gapU, 1]] : [[-1, 1]];
  function addPanel(front, lo, hi, uvAt) {
    const us = unique([lo, ...columns.filter(u => u > lo && u < hi), hi]);
    const geo = meshGrid(us, rows, (u, t) => b.point(u, t, front), { reverse: !front, uvAt });
    art.yarnMaterial(front ? 'Devant' : 'Dos', geo, 'body', 'body', b.chest, b.length - b.hemBand);
    const bandRows = samples(art.lowDetail ? 3 : 7);
    const hemGeo = meshGrid(us, bandRows, (u, t) => {
      const p = b.point(u, 0, front);
      const contour = 1 - 0.022 * (1 - t) + 0.007 * Math.sin(PI * t);
      p.x *= contour;
      p.z *= contour;
      p.y -= (1 - t) * b.hemBand;
      return p;
    }, { reverse: !front, uvAt });
    art.yarnMaterial('Bord du bas', hemGeo, 'rib', 'hem', b.hem, b.hemBand, 'rib');
  }
  for (const [lo, hi] of frontRanges) addPanel(true, lo, hi, (u, v) => [0.5 + 0.25 * u, v]);
  // A UV seam on the back splits the two panels at u=0. Each triangle has
  // neighboring texture coordinates on its own side of the seam.
  for (const [lo, hi, origin] of [[-1, 0, 0], [0, 1, 1]]) {
    addPanel(false, lo, hi, (u, v) => [origin - 0.25 * u, v]);
  }
  for (const sign of [-1, 1]) {
    const geo = meshGrid(samples(art.lowDetail ? 6 : 13), samples(art.lowDetail ? 4 : 8), (u, v) => b.bridge(sign, u, v), { reverse: sign < 0 });
    art.yarnMaterial('Épaule', geo, 'body', sign < 0 ? 'shoulder-left' : 'shoulder-right',
      b.shoulderRadius - b.neckRadius, 2 * b.shoulderThickness);
  }
  // From the front the raised back neck shows the reverse side of the fabric.
  // A returning surface also works in renderers that cull back-facing faces.
  const insideStart = b.kind === 'gilet' ? 0 : b.underT * 0.78;
  const inside = meshGrid(between(-1, 1, art.lowDetail ? 20 : 36), between(insideStart, 1, 8), (u, t) => {
    const p = b.point(u, t, false);
    p.z += b.chest * 0.0017 * Math.cos(u * PI / 2);
    return p;
  }, { uvAt: (u, v) => [(u + 1) / 2, (v - insideStart) / (1 - insideStart)] });
  const innerMesh = art.yarnMaterial('Envers de l’encolure', inside, 'trim', 'back-neck-inside', b.chest / 2, b.armhole * 1.15);
  innerMesh.userData.knit.inside = true;
  if (b.kind === 'gilet') {
    const innerHem = meshGrid(between(-0.18, 0.18, 5), samples(2), (u, t) => {
      const p = b.point(u, 0, false);
      p.z += b.chest * 0.0017;
      p.y -= (1 - t) * b.hemBand;
      return p;
    }, { uvAt: (u, v) => [(u + 0.18) / 0.36, v] });
    art.yarnMaterial('Envers du bord', innerHem, 'trim', 'inside-hem', b.chest * 0.09, b.hemBand, 'rib').userData.knit.inside = true;
  }
}

function addCollar(art, b) {
  const tall = b.collar === 'high';
  const height = tall ? Math.min(10, b.neck * 0.23) : Math.min(2.8, b.neck * 0.055);
  const gapAngle = b.gapU ? Math.asin(clamp(b.shoulderRadius * Math.sin(b.gapU * PI / 2) / b.neckRadius, 0, 0.9)) : 0;
  const angles = between(gapAngle, TAU - gapAngle, art.lowDetail ? 36 : 76);
  const ring = (angle, t) => {
    const x = b.neckRadius * Math.sin(angle);
    const u = Math.asin(x / b.shoulderRadius) / (PI / 2);
    const base = b.topEdge(u, Math.cos(angle) >= 0);
    const radius = 1 - (tall ? 0.065 : 0.105) * t + (tall ? 0.032 : 0.012) * Math.sin(PI * t);
    return vec(base.x * radius, base.y + height * t + (tall ? height * 0.035 * t * Math.sin(3 * angle) : 0), base.z * radius);
  };
  const uvAt = (angle, v) => [angle / TAU, v];
  const geo = meshGrid(angles, samples(art.lowDetail ? 4 : 9), ring, { uvAt });
  art.yarnMaterial('Bordure d’encolure', geo, 'rib', 'collar', b.neck, height, 'rib');
  const fold = meshGrid(angles, samples(3), (angle, v) => {
    const p = ring(angle, 1);
    const inside = 1 - 0.055 * v;
    return vec(p.x * inside, p.y + 0.20 * Math.sin(v * PI) - Math.min(0.7, height * 0.28) * v, p.z * inside);
  }, { uvAt });
  art.yarnMaterial('Revers du col', fold, 'rib', 'collar-edge', b.neck * 0.93, 0.65, 'rib');
  const insideWall = meshGrid(angles, samples(art.lowDetail ? 2 : 4), (angle, t) => {
    const p = ring(angle, t);
    const clearance = mix(0.015, 0.055, t);
    return vec(p.x * (1 - clearance), p.y - Math.min(0.7, height * 0.28) * t, p.z * (1 - clearance));
  }, { uvAt, reverse: true });
  art.yarnMaterial('Intérieur du col', insideWall, 'rib', 'collar-inside', b.neck * 0.94, height, 'rib').userData.knit.inside = true;
}

function armhole(b, sign, lowDetail) {
  const count = lowDetail ? 8 : 16;
  const points = between(b.underT, 1, count).map(t => b.point(sign, t, true));
  for (const t of samples(lowDetail ? 4 : 8).slice(1)) points.push(b.bridge(sign, 1, t));
  for (const t of between(1, b.underT, count).slice(1)) points.push(b.point(sign, t, false));
  points[points.length - 1] = points[0].clone();
  return points;
}

function addSleeve(art, b, sign) {
  const hole = armhole(b, sign, art.lowDetail);
  const side = sign < 0 ? 'left' : 'right';
  if (b.kind === 'debardeur') {
    const curve = new THREE.CatmullRomCurve3(hole.slice(0, -1), true, 'centripetal');
    const edge = new THREE.TubeGeometry(curve, art.lowDetail ? 30 : 66, b.chest * 0.006, art.lowDetail ? 5 : 8, true);
    art.yarnMaterial('Bordure d’emmanchure', edge, 'trim', 'armhole-' + side, sumLength(hole), b.chest * 0.015, 'rib');
    return;
  }
  const distances = [0];
  for (let i = 1; i < hole.length; i++) distances.push(distances[i - 1] + hole[i].distanceTo(hole[i - 1]));
  const length = distances.at(-1);
  const angles = distances.map(d => d / length);
  const start = vec(sign * b.shoulderRadius * 0.975, b.underY + b.armhole * 0.47, 0);
  const end = vec(sign * (b.chestRadius + b.sleeve * 0.44), b.underY - b.sleeve * 0.885, b.sleeve * 0.10);
  const bend1 = start.clone().lerp(end, 0.32);
  const bend2 = start.clone().lerp(end, 0.72);
  bend1.x += sign * b.sleeve * 0.095;
  bend1.y += b.sleeve * 0.018;
  bend2.x += sign * b.sleeve * 0.072;
  bend2.z -= b.sleeve * 0.045;
  const axis = new THREE.CubicBezierCurve3(start, bend1, bend2, end);
  const cuffFraction = clamp(Math.min(6, b.sleeve * 0.115) / (b.sleeve + b.armhole / 2), 0.055, 0.13);
  const cuffStart = 1 - cuffFraction;
  function point(index, t) {
    if (t === 0) return hole[index].clone();
    const angle = TAU * angles[index];
    const center = axis.getPoint(t);
    const tangent = axis.getTangent(t);
    const outward = vec(-sign * tangent.y, sign * tangent.x, 0).normalize();
    const front = vec(0, 0, 1).addScaledVector(tangent, -tangent.z).normalize();
    const taper = t < cuffStart ? smooth(t / cuffStart) : 1;
    const girth = mix(b.upperArm, b.cuff * 1.06, taper);
    const radius = ellipseRadius(girth, 0.86);
    const fold = 1 + 0.025 * Math.sin(5 * angle + 1.8 * t) * Math.sin(PI * t);
    const p = center.clone().addScaledVector(outward, -Math.cos(angle) * radius * fold)
      .addScaledVector(front, Math.sin(angle) * radius * 0.86 * fold);
    // Translate the attachment loop along the upper sleeve, then ease it into
    // the arm section. This closes the armhole without an intersecting cap.
    if (t < 0.32) {
      const attachment = hole[index].clone().add(center.clone().sub(start));
      p.lerp(attachment, 1 - smooth(t / 0.32));
    }
    return p;
  }
  const indices = hole.map((_, i) => i);
  const bodyUV = (i, t) => [angles[i], 1 - t / cuffStart];
  const sleeve = meshGrid(indices, between(0, cuffStart, art.lowDetail ? 15 : 30), point, { reverse: sign > 0, uvAt: bodyUV });
  art.yarnMaterial('Manche ' + side, sleeve, 'sleeve', 'sleeve-' + side, b.upperArm, b.sleeve + b.armhole / 2);
  const cuffUV = (i, t) => [angles[i], (1 - t) / cuffFraction];
  const cuff = meshGrid(indices, between(cuffStart, 1, art.lowDetail ? 3 : 6), point, { reverse: sign > 0, uvAt: cuffUV });
  art.yarnMaterial('Poignet ' + side, cuff, 'rib', 'cuff-' + side, b.cuff, b.sleeve * cuffFraction, 'rib');
}

function buttonAt(art, point, radius) {
  const segments = art.lowDetail ? 12 : 20;
  const rim = new THREE.CylinderGeometry(radius * 0.94, radius, radius * 0.29, segments);
  rim.rotateX(PI / 2);
  const mesh = new THREE.Mesh(rim, art.wood);
  mesh.name = 'Bouton en bois';
  mesh.position.copy(point);
  mesh.position.z += radius * 0.20;
  art.group.add(mesh);
  for (const x of [-0.25, 0.25]) {
    const stitchHole = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.13, 6), art.darkWood);
    stitchHole.name = 'Trou de bouton';
    stitchHole.position.copy(mesh.position);
    stitchHole.position.x += radius * x;
    stitchHole.position.z += radius * 0.155;
    art.group.add(stitchHole);
  }
}

function addFastening(art, b) {
  if (b.kind === 'gilet') {
    for (const sign of [-1, 1]) {
      const band = meshGrid(samples(2), samples(art.lowDetail ? 18 : 34), (u, t) => {
        const p = b.point(sign * (b.gapU + 0.064 * u), t, true);
        p.z += b.chest * 0.0021;
        return p;
      }, { reverse: sign < 0 });
      art.yarnMaterial('Patte de boutonnage', band, 'trim', sign < 0 ? 'band-left' : 'band-right', b.chest * 0.021, b.length - b.hemBand, 'garter');
    }
    for (const t of between(0.07, 0.88, 5)) {
      const p = b.point(b.gapU + 0.032, t, true);
      p.z += b.chest * 0.0022;
      buttonAt(art, p, b.chest * 0.0087);
    }
  }
  if (b.kind === 'brassiere') {
    const diagonal = (u, t) => {
      const position = mix(0.60, -b.neckU, t) + 0.052 * (u - 0.5);
      const p = b.point(position, 0.17 + 0.83 * t, true);
      p.z += b.chest * 0.004;
      return p;
    };
    art.yarnMaterial('Bordure du cache-cœur', meshGrid(samples(2), samples(art.lowDetail ? 18 : 30), diagonal),
      'trim', 'wrap-edge', b.chest * 0.025, b.length * 0.88, 'garter');
    for (const t of [0.025, 0.18, 0.335]) buttonAt(art, diagonal(0.5, t), b.chest * 0.012);
  }
}

function addPoncho(art, project) {
  const m = project.measures || {};
  const width = positive(m.width, 116);
  const length = positive(m.length, 66);
  const neck = Math.min(positive(m.neck, 44), width * 1.2);
  const neckX = ellipseRadius(neck, 0.78);
  const neckZ = neckX * 0.78;
  const hemX = width / 2;
  const hemZ = Math.max(neckZ * 1.45, width * 0.19);
  const neckDrop = Math.min(neckX * 0.52, length * 0.13);
  const isV = project.collar === 'v';
  function point(u, v) {
    const a = TAU * (u - 0.5);
    const d = 1 - v;
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    const baseHem = length * (0.40 * Math.abs(sa) ** 1.6 + (ca < 0 ? 0.055 * ca * ca : 0));
    const top = length - neckDrop * (ca > 0 ? (isV ? 1.75 * (1 - Math.abs(sa)) : ca) : -0.27 * ca);
    const folds = (0.038 * Math.sin(9 * a + d * 0.8) + 0.022 * Math.sin(15 * a - d * 1.3)) * d;
    const shoulder = 1 - (1 - d) ** 1.8;
    const x = mix(neckX, hemX, shoulder) * sa * (1 + folds);
    const z = mix(neckZ, hemZ, d ** 0.75) * ca * (1 + 2.2 * folds);
    const y = mix(top, baseHem, d) + length * 0.012 * d * d * Math.sin(5 * a + 0.4);
    return vec(x, y, z);
  }
  const us = samples(art.lowDetail ? 44 : 84);
  const edge = Math.min(0.07, 2.7 / length);
  art.yarnMaterial('Poncho drapé', meshGrid(us, between(edge, 1, art.lowDetail ? 15 : 30), point, { uvAt: (u, v) => [u, (v - edge) / (1 - edge)] }),
    'body', 'body', PI * (hemX + hemZ), length * (1 - edge));
  art.yarnMaterial('Bordure du poncho', meshGrid(us, between(0, edge, 3), point, { uvAt: (u, v) => [u, v / edge] }),
    'trim', 'hem', PI * (hemX + hemZ), edge * length, 'garter');
  const collarHeight = project.collar === 'high' ? neck * 0.18 : neck * 0.047;
  const collar = meshGrid(us, samples(4), (u, t) => {
    const p = point(u, 1), s = 1 - 0.085 * t;
    return vec(p.x * s, p.y + collarHeight * t, p.z * s);
  });
  art.yarnMaterial('Col du poncho', collar, 'rib', 'collar', neck, collarHeight, 'rib');
  // Each tassel follows gravity from its own hem point, including the tilted
  // sides. A short individual taper reads at both overview and detail scale.
  for (let i = 0; i < 32; i++) {
    const p = point(i / 32, 0);
    const tasselLength = Math.min(6, length * 0.075) * (0.88 + 0.12 * Math.cos(i * 2.3));
    const r = Math.min(0.40, width * 0.003);
    const geo = meshGrid(samples(5), samples(2), (u, v) => {
      const a = u * TAU, radius = r * (0.45 + 0.55 * Math.sin(PI * v / 2));
      return vec(p.x + Math.sin(a) * radius + r * Math.sin(i) * (1 - v), p.y - tasselLength * (1 - v), p.z + Math.cos(a) * radius);
    });
    art.yarnMaterial('Frange', geo, 'trim', 'fringe', 2 * PI * r, tasselLength, 'garter');
  }
}

function addSkirt(art, project) {
  const m = project.measures || {};
  const waist = positive(m.waist, 78), hem = positive(m.hem, 122), length = positive(m.length, 59);
  const waistX = ellipseRadius(waist, 0.70), hemX = ellipseRadius(hem, 0.54);
  const waistBand = Math.min(5, length * 0.075);
  const edge = Math.min(2.1, length * 0.04) / length;
  function point(u, v) {
    const a = TAU * (u - 0.5);
    const d = 1 - v;
    const hips = Math.sin(PI * Math.min(1, d / 0.54)) * Math.min(waistX * 0.105, 1.8);
    const blend = d ** 0.92;
    const folds = d ** 1.18 * (0.041 * Math.sin(10 * a + 0.6 * d) + 0.019 * Math.sin(15 * a - d));
    const rx = (mix(waistX, hemX, blend) + hips) * (1 + folds);
    const rz = (mix(waistX * 0.70, hemX * 0.54, blend) + hips * 0.52) * (1 + 1.6 * folds);
    const y = v * length + (1 - v) ** 2 * length * 0.012 * Math.sin(5 * a + 0.3);
    return vec(rx * Math.sin(a), y, rz * Math.cos(a));
  }
  const us = samples(art.lowDetail ? 48 : 92);
  const top = 1 - waistBand / length;
  art.yarnMaterial('Jupe évasée', meshGrid(us, between(edge, top, art.lowDetail ? 16 : 32), point, { uvAt: (u, v) => [u, (v - edge) / (top - edge)] }),
    'body', 'body', (waist + hem) / 2, length * (top - edge));
  art.yarnMaterial('Ceinture', meshGrid(us, between(top, 1, 5), point, { uvAt: (u, v) => [u, (v - top) / (1 - top)] }),
    'rib', 'waist', waist, waistBand, 'rib');
  art.yarnMaterial('Ourlet', meshGrid(us, between(0, edge, 2), point, { uvAt: (u, v) => [u, v / edge] }),
    'trim', 'hem', hem, length * edge, 'garter');
}

export function buildGarment(project, lowDetail = false) {
  if (!project || !GARMENT_KINDS.includes(project.kind)) throw new RangeError('Type de vêtement inconnu.');
  const art = atelier(project.kind, lowDetail);
  if (project.kind === 'poncho') addPoncho(art, project);
  else if (project.kind === 'jupe') addSkirt(art, project);
  else {
    const block = topBlock(project);
    addBody(art, block);
    addCollar(art, block);
    addSleeve(art, block, -1);
    addSleeve(art, block, 1);
    addFastening(art, block);
  }
  return art.group;
}
