import * as T from './vendor/three.bundle.js';

const TAU = Math.PI * 2;
const vec = (value) => new T.Vector3(...value);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const UP = new T.Vector3(0, 1, 0);

// An HDR studio dome gives the curved metal, lacquer and glass recognizable
// reflections. A procedural light rig keeps the viewer self-contained.
function makeReflectionMap(renderer) {
  const width = 256;
  const height = 128;
  const data = new Float32Array(width * height * 4);
  const panels = [
    [-0.82, 0.74, 0.72, 0.36, 9.2, [1.00, 0.95, 0.84]],
    [1.98, 0.54, 0.34, 0.55, 6.7, [0.81, 0.90, 1.00]],
    [0.74, 1.26, 1.28, 0.10, 7.8, [1.00, 1.00, 0.98]],
    [2.94, 0.11, 0.09, 0.48, 3.8, [0.80, 0.91, 0.85]],
    [-2.55, 0.13, 0.17, 0.37, 2.5, [1.00, 0.86, 0.70]],
  ];
  for (let y = 0; y < height; y++) {
    const elevation = ((y + 0.5) / height - 0.5) * Math.PI;
    for (let x = 0; x < width; x++) {
      const azimuth = ((x + 0.5) / width - 0.5) * TAU;
      const level = elevation < 0 ? 0.20 : 0.22 + 0.23 * Math.sin(elevation);
      let red = level * 0.99, green = level, blue = level * 0.95;
      for (const [a, e, w, h, intensity, tint] of panels) {
        const dx = Math.abs(Math.atan2(Math.sin(azimuth - a), Math.cos(azimuth - a))) / w;
        const dy = Math.abs(elevation - e) / h;
        const weight = intensity * (1 - clamp((Math.max(dx, dy) - 0.91) / 0.11, 0, 1));
        red += weight * tint[0];
        green += weight * tint[1];
        blue += weight * tint[2];
      }
      const i = 4 * (y * width + x);
      data[i] = red; data[i + 1] = green; data[i + 2] = blue; data[i + 3] = 1;
    }
  }
  const dome = new T.DataTexture(data, width, height, T.RGBAFormat, T.FloatType);
  dome.mapping = T.EquirectangularReflectionMapping;
  dome.needsUpdate = true;
  const pmrem = new T.PMREMGenerator(renderer);
  const result = pmrem.fromEquirectangular(dome);
  pmrem.dispose();
  dome.dispose();
  return result;
}

function buildMaterials() {
  // [sRGB color, metalness, roughness, surface grain].
  const recipes = {
    alloy: [0x565d5e, 0.88, 0.36, 0.038],
    edge: [0xb2b9b8, 0.95, 0.20, 0.024],
    steel: [0x747b7b, 0.92, 0.29, 0.022],
    dark: [0x394044, 0.68, 0.41, 0.030],
    black: [0x343839, 0.08, 0.42, 0.035],
    rubber: [0x282a2b, 0.01, 0.78, 0.105],
    tread: [0x323536, 0.01, 0.70, 0.115],
    chrome: [0xd9e1e2, 1.0, 0.13, 0.010],
    spring: [0x646a72, 0.93, 0.24, 0.016],
    oil: [0x73563a, 0.75, 0.26, 0.012],
    green: [0x186242, 0.18, 0.38, 0.025],
    paint: [0xc95a28, 0.51, 0.25, 0.016],
    glass: [0x34494b, 0.42, 0.11, 0.0],
    light: [0xf3eac5, 0.28, 0.16, 0.0],
    amber: [0xf19725, 0.29, 0.23, 0.010],
    red: [0xa72f22, 0.12, 0.37, 0.015],
    blue: [0x226a95, 0.48, 0.31, 0.016],
    white: [0xe5e4d8, 0.08, 0.42, 0.015],
  };
  const materials = new Map();
  for (const [key, [color, metalness, roughness, grain]] of Object.entries(recipes)) {
    const coated = ['glass', 'paint', 'light'].includes(key);
    const common = {color, metalness, roughness, side: T.DoubleSide};
    const m = coated
      ? new T.MeshPhysicalMaterial({...common, clearcoat: 0.88, clearcoatRoughness: 0.13})
      : new T.MeshStandardMaterial(common);
    if (key === 'glass') {
      m.transparent = true;
      m.opacity = 0.84;
      m.depthWrite = false;
    }
    if (key === 'light') m.emissive.setHex(0x4c3e22);
    if (grain) {
      m.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', '#include <common>\nvarying vec3 partSurfacePosition;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\npartSurfacePosition = position;');
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 partSurfacePosition;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n' +
            'vec3 p = floor(partSurfacePosition * 3.0 + 0.5);\n' +
            'float noiseGrain = fract(sin(dot(p, vec3(12.9898,78.233,56.17))) * 43758.5453);\n' +
            'diffuseColor.rgb *= 1.0 + (noiseGrain - 0.5) * ' + grain.toFixed(3) + ';');
      };
      m.customProgramCacheKey = () => 'surface-grain-' + grain;
    }
    const selected = m.clone();
    selected.onBeforeCompile = m.onBeforeCompile;
    selected.customProgramCacheKey = m.customProgramCacheKey;
    selected.emissive.setHex(0x7b5d14);
    selected.emissiveIntensity = 0.48;
    materials.set(key, {base: m, selected});
  }
  return materials;
}

// Merge the small mechanical details by part/material so wheels, PCB solder
// joints and tread lugs do not each incur their own GPU draw call.
function appendGeometry(part, source, materialKey, matrix) {
  let bucket = part.buckets.get(materialKey);
  if (!bucket) {
    bucket = {positions: [], normals: [], indices: []};
    part.buckets.set(materialKey, bucket);
  }
  const offset = bucket.positions.length / 3;
  const position = source.attributes.position;
  const normal = source.attributes.normal;
  const normalMatrix = new T.Matrix3().getNormalMatrix(matrix);
  const point = new T.Vector3();
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyMatrix4(matrix);
    bucket.positions.push(point.x, point.y, point.z);
    point.fromBufferAttribute(normal, i).applyNormalMatrix(normalMatrix);
    bucket.normals.push(point.x, point.y, point.z);
  }
  if (source.index) {
    for (let i = 0; i < source.index.count; i++) bucket.indices.push(offset + source.index.getX(i));
  } else {
    for (let i = 0; i < position.count; i++) bucket.indices.push(offset + i);
  }
}

// Framing follows the actual outline of parts (not the empty corners of a
// bounding box around a long shock absorber or a wheel turned at an angle).
const supportDirections = [];
for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
  if (x || y || z) supportDirections.push(new T.Vector3(x, y, z));
}
function outlinePoints(part) {
  const support = supportDirections.map(() => new T.Vector3());
  const scores = supportDirections.map(() => -Infinity);
  for (const mesh of part.node.children) {
    const points = mesh.geometry.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      supportDirections.forEach((dir, k) => {
        const score = x * dir.x + y * dir.y + z * dir.z;
        if (score > scores[k]) {
          support[k].set(x, y, z);
          scores[k] = score;
        }
      });
    }
  }
  return support;
}

function shadowTexture() {
  const image = document.createElement('canvas');
  image.width = image.height = 96;
  const painter = image.getContext('2d');
  const radial = painter.createRadialGradient(48, 48, 0, 48, 48, 48);
  radial.addColorStop(0, 'rgba(19,26,23,0.85)');
  radial.addColorStop(0.35, 'rgba(19,26,23,0.63)');
  radial.addColorStop(0.68, 'rgba(19,26,23,0.22)');
  radial.addColorStop(1, 'rgba(19,26,23,0)');
  painter.fillStyle = radial;
  painter.fillRect(0, 0, 96, 96);
  return new T.CanvasTexture(image);
}

export function makeEngine(canvas) {
  const renderer = new T.WebGLRenderer({canvas, antialias: true, alpha: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  canvas.style.background = 'radial-gradient(ellipse at 48% 34%, #e7e9df 0%, #d9dcd0 49%, #bac1b6 100%)';
  canvas.style.touchAction = 'none';
  canvas.style.cursor = 'grab';
  if (!canvas.hasAttribute('tabindex')) canvas.tabIndex = 0;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(35, 1, 1, 10000);
  const environment = makeReflectionMap(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.9;

  scene.add(new T.HemisphereLight(0xeaf2f4, 0xacaa91, 1.15));
  const key = new T.DirectionalLight(0xffefd5, 2.05);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.normalBias = 0.48;
  key.shadow.bias = -0.00014;
  key.shadow.radius = 3;
  scene.add(key, key.target);
  const rim = new T.DirectionalLight(0xd6e7ff, 1.46);
  rim.position.set(230, 250, -350);
  scene.add(rim);
  const softbox = new T.DirectionalLight(0xe6f4ef, 0.53);
  softbox.position.set(-300, 50, 320);
  scene.add(softbox);

  const ground = new T.Mesh(
    new T.PlaneGeometry(12000,12000),
    new T.ShadowMaterial({opacity: 0.22, color: 0x344139, depthWrite: false}),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.renderOrder = -2;
  scene.add(ground);
  const contact = new T.Mesh(
    new T.PlaneGeometry(1,1),
    new T.MeshBasicMaterial({map: shadowTexture(), transparent: true, opacity: 0.40, depthWrite: false}),
  );
  contact.rotation.x = -Math.PI / 2;
  contact.renderOrder = -1;
  scene.add(contact);

  const materials = buildMaterials();
  const primitives = new Map();
  primitives.set('box', new T.BoxGeometry(1,1,1));
  primitives.set('ball', new T.SphereGeometry(1, 20, 12));
  const parts = [];
  const partMap = new Map();
  let active = true, finished = false, frame = null, selected = null;
  let explosion = 0, targetExplosion = 0, zoom = 1, focus = null;
  let yaw = 0.8, elevation = 0.47;
  const pan = new T.Vector3();
  const target = new T.Vector3(), forward = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3();
  const corners = [], visibleMeshes = [];
  let width = 0, height = 0, distance = 650, previousTime = 0;

  function schedule() {
    if (active && finished && frame === null) frame = requestAnimationFrame(render);
  }
  function measure() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w <= 0 || h <= 0) return false;
    if (w !== width || h !== height) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  function updateLayout() {
    corners.length = 0;
    visibleMeshes.length = 0;
    const bounds = new T.Box3();
    const focusBounds = new T.Box3();
    for (const part of parts) {
      part.node.position.copy(part.origin).addScaledVector(part.offset, explosion);
      if (!part.node.visible || part.bounds.isEmpty()) continue;
      for (const child of part.node.children) visibleMeshes.push(child);
      for (const local of part.outline) {
        const p = local.clone().add(part.node.position);
        bounds.expandByPoint(p);
        if (part.id === focus) focusBounds.expandByPoint(p);
        if (!focus || part.id === focus) corners.push(p);
      }
    }
    if (bounds.isEmpty()) bounds.set(new T.Vector3(-170,0,-200),new T.Vector3(170,140,200));
    if (focus && focusBounds.isEmpty()) focus = null;
    (focus && !focusBounds.isEmpty() ? focusBounds : bounds).getCenter(target);
    const size = bounds.getSize(new T.Vector3());
    const center = bounds.getCenter(new T.Vector3());
    const floor = Math.min(bounds.min.y, 0) - 0.7;
    ground.position.y = floor;
    contact.position.set(center.x, floor + 0.15, center.z);
    contact.scale.set(Math.max(30,size.x * 1.20), Math.max(30,size.z * 1.21), 1);
    contact.material.opacity = 0.16 + (1 - explosion) * 0.27;

    // Keep both the assembled vehicle and the widest exploded view in the
    // shadow frustum. The light follows the model, independent of camera orbit.
    const radius = Math.max(190,size.length() * 0.59);
    key.position.copy(center).add(new T.Vector3(-0.75,1.70,0.93).multiplyScalar(radius));
    key.target.position.copy(center);
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -radius;
    sc.right = sc.top = radius;
    sc.near = 1;
    sc.far = radius * 4.4;
    sc.updateProjectionMatrix();
  }

  function updateCamera() {
    const cosElev = Math.cos(elevation);
    forward.set(Math.sin(yaw)*cosElev, Math.sin(elevation), Math.cos(yaw)*cosElev).normalize();
    right.crossVectors(UP, forward).normalize();
    up.crossVectors(forward, right).normalize();
    const tanY = Math.tan(camera.fov * Math.PI / 360);
    const tanX = tanY * camera.aspect;
    let centerX = 0, centerY = 0, fitDistance = 0;
    const margin = focus ? 1.28 : 1.16;
    const projected = corners.map(corner => {
      const delta = corner.clone().sub(target);
      return [delta.dot(right), delta.dot(up), delta.dot(forward)];
    });
    for (let pass = 0; pass < 3; pass++) {
      fitDistance = focus ? 32 : 100;
      for (const [x, y, z] of projected) {
        const halfWidth = Math.abs(x - centerX) / tanX;
        const halfHeight = Math.abs(y - centerY) / tanY;
        fitDistance = Math.max(fitDistance, z + margin * Math.max(halfWidth, halfHeight));
      }
      if (pass === 2 || !projected.length) break;
      let left = Infinity, rightEdge = -Infinity, top = -Infinity, bottom = Infinity;
      for (const [x, y, z] of projected) {
        const inverseDepth = 1 / Math.max(1, fitDistance - z);
        const u = (x - centerX) * inverseDepth, v = (y - centerY) * inverseDepth;
        left = Math.min(left, u); rightEdge = Math.max(rightEdge, u);
        bottom = Math.min(bottom, v); top = Math.max(top, v);
      }
      centerX += (left + rightEdge) * fitDistance * .5;
      centerY += (top + bottom) * fitDistance * .5;
    }
    distance = clamp(fitDistance / zoom, focus ? 18 : 65, 7500);
    const aimed = target.clone().add(pan).addScaledVector(right, centerX).addScaledVector(up, centerY);
    camera.position.copy(aimed).addScaledVector(forward, distance);
    camera.lookAt(aimed);
    camera.updateMatrixWorld();
  }

  function render(now) {
    frame = null;
    if (!active || !measure()) return;
    const dt = clamp((now - previousTime) / 1000, 0.016, 0.12);
    previousTime = now;
    explosion += (targetExplosion - explosion) * (1 - Math.exp(-dt * 19));
    if (Math.abs(targetExplosion - explosion) < 0.00065) explosion = targetExplosion;
    updateLayout();
    updateCamera();
    renderer.render(scene, camera);
    if (explosion !== targetExplosion) schedule();
  }

  const raycaster = new T.Raycaster();
  function pick(event) {
    if (!finished) return;
    const bounds = canvas.getBoundingClientRect();
    const pointer = new T.Vector2(
      2 * (event.clientX - bounds.left) / bounds.width - 1,
      1 - 2 * (event.clientY - bounds.top) / bounds.height,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(visibleMeshes, false)[0];
    engine.onPick?.(hit ? hit.object.userData.partId : null);
  }

  function setSelected(id) {
    const old = partMap.get(selected), next = partMap.get(id);
    if (old) for (const child of old.node.children) child.material = materials.get(child.userData.materialKey).base;
    selected = next?.id ?? null;
    if (next) for (const child of next.node.children) child.material = materials.get(child.userData.materialKey).selected;
    schedule();
  }

  function resetView(angle = 'perspective') {
    const views = {perspective:[0.76,0.47], front:[0,0.045], side:[Math.PI/2,0.045], top:[0,Math.PI/2-0.0008]};
    [yaw,elevation] = views[angle] || views.perspective;
    focus = null;
    pan.set(0,0,0);
    zoom = 1;
    schedule();
  }
  function zoomBy(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    zoom = clamp(zoom * factor, 0.52, 6.0);
    schedule();
  }
  function panPixels(dx,dy) {
    const mm = 2 * distance * Math.tan(camera.fov * Math.PI / 360) / Math.max(1,height);
    pan.addScaledVector(right, -dx * mm).addScaledVector(up, dy * mm);
  }

  const pointers = new Map();
  let moved = false;
  const pos = (e) => ({x:e.clientX,y:e.clientY});
  const dist = (a,b) => Math.hypot(a.x - b.x,a.y - b.y);
  const middle = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  let firstPosition = null;
  canvas.addEventListener('pointerdown', (event) => {
    if (!active || event.button > 2) return;
    if (pointers.size === 0) {
      moved = false;
      firstPosition = pos(event);
    } else moved = true;
    pointers.set(event.pointerId, pos(event));
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous || !active) return;
    const current = pos(event);
    if (pointers.size >= 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)[1];
      const oldMid = middle(previous,other), newMid = middle(current,other);
      panPixels(newMid.x - oldMid.x,newMid.y - oldMid.y);
      const priorDistance = dist(previous,other);
      if (priorDistance > 3) zoomBy(dist(current,other) / priorDistance);
    } else {
      const dx = current.x - previous.x, dy = current.y - previous.y;
      if (firstPosition && dist(firstPosition,current) > 4) moved = true;
      if (moved) {
        if (event.buttons & 6 || event.shiftKey) panPixels(dx,dy);
        else {
          yaw -= dx * 0.0065;
          elevation = clamp(elevation + dy * 0.0065, 0.015, Math.PI/2 - 0.0008);
        }
      }
    }
    pointers.set(event.pointerId,current);
    schedule();
  });
  function release(event) {
    if (!pointers.has(event.pointerId)) return;
    const canPick = event.type === 'pointerup' && event.button === 0 && !moved && pointers.size === 1;
    pointers.delete(event.pointerId);
    if (pointers.size === 0) canvas.style.cursor = 'grab';
    if (canPick) pick(event);
  }
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',release);
  canvas.addEventListener('contextmenu',(event) => event.preventDefault());
  canvas.addEventListener('wheel',(event) => {
    if (!active) return;
    event.preventDefault();
    const dy = event.deltaY * (event.deltaMode === 1 ? 15 : 1);
    zoomBy(Math.exp(-clamp(dy,-160,160) * 0.0017));
  },{passive:false});
  canvas.addEventListener('keydown', (event) => {
    if (!active) return;
    const actions = {
      ArrowLeft: () => { yaw -= 0.12; }, ArrowRight: () => { yaw += 0.12; },
      ArrowUp: () => { elevation = Math.min(Math.PI/2 - 0.0008,elevation + 0.10); },
      ArrowDown: () => { elevation = Math.max(0.015,elevation - 0.10); },
      '+': () => zoomBy(1.15), '=': () => zoomBy(1.15), '-': () => zoomBy(1/1.15), Home: resetView,
    };
    if (!actions[event.key]) return;
    event.preventDefault();
    event.stopPropagation();
    actions[event.key]();
    schedule();
  });

  const engine = {
    parts, onPick: null,
    group(id,label,category,position,explode,description) {
      if (partMap.has(id)) throw new Error('Identifiant de pièce dupliqué : ' + id);
      const part = {
        id, label, category, description,
        origin:vec(position), offset:vec(explode), node:new T.Group(), bounds:new T.Box3(), buckets:new Map(),
      };
      part.node.position.copy(part.origin);
      parts.push(part);
      partMap.set(id,part);
      scene.add(part.node);
      return part;
    },
    box(part,center,size,material,rotation=[0,0,0]) {
      const quaternion = new T.Quaternion().setFromEuler(new T.Euler(...rotation));
      appendGeometry(part,primitives.get('box'),material,new T.Matrix4().compose(vec(center),quaternion,vec(size)));
    },
    cyl(part,a,b,radius,material,sides=24) {
      const start = vec(a), end = vec(b), direction = end.clone().sub(start);
      const length = direction.length();
      if (length < 1e-7 || radius <= 0) return;
      const segments = clamp(Math.round(sides),3,80);
      if (!primitives.has(segments)) primitives.set(segments,new T.CylinderGeometry(1,1,1,segments));
      const rotation = new T.Quaternion().setFromUnitVectors(UP,direction.multiplyScalar(1/length));
      const matrix = new T.Matrix4().compose(start.lerp(end,0.5),rotation,new T.Vector3(radius,length,radius));
      appendGeometry(part,primitives.get(segments),material,matrix);
    },
    ball(part,center,radii,material) {
      const size = typeof radii === 'number' ? [radii,radii,radii] : radii;
      appendGeometry(part,primitives.get('ball'),material,new T.Matrix4().compose(vec(center),new T.Quaternion(),vec(size)));
    },
    mesh(part,vertices,indices,material) {
      if (vertices.length === 0 || indices.length === 0) return;
      const geometry = new T.BufferGeometry();
      geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
      geometry.setIndex(Array.from(indices));
      geometry.computeVertexNormals();
      appendGeometry(part,geometry,material,new T.Matrix4());
      geometry.dispose();
    },
    finish() {
      for (const part of parts) {
        for (const [materialKey, buffers] of part.buckets) {
          const key = materials.has(materialKey) ? materialKey : 'black';
          const geometry = new T.BufferGeometry();
          geometry.setAttribute('position', new T.Float32BufferAttribute(buffers.positions,3));
          geometry.setAttribute('normal', new T.Float32BufferAttribute(buffers.normals,3));
          geometry.setIndex(buffers.indices);
          geometry.computeBoundingBox();
          part.bounds.union(geometry.boundingBox);
          const mesh = new T.Mesh(geometry,materials.get(key).base);
          mesh.userData = {partId:part.id,materialKey:key};
          mesh.castShadow = key !== 'glass';
          mesh.receiveShadow = true;
          part.node.add(mesh);
        }
        part.outline = outlinePoints(part);
        part.buckets.clear();
      }
      const geometry = [...primitives.values()];
      geometry.forEach((g) => g.dispose());
      primitives.clear();
      finished = true;
      resetView();
    },
    setExplosion(value) { targetExplosion = clamp(Number(value)||0,0,1); schedule(); },
    setSelected, resetView, zoomBy,
    setHidden(ids) {
      const hidden = ids instanceof Set ? ids : new Set(ids);
      for (const part of parts) part.node.visible = !hidden.has(part.id);
      if (focus && hidden.has(focus)) focus = null;
      schedule();
    },
    focusPart(id) {
      const part = partMap.get(id);
      if (!part || !part.node.visible) return;
      focus = part.id;
      zoom = 1;
      pan.set(0,0,0);
      schedule();
    },
    setActive(value) {
      active = Boolean(value);
      if (!active && frame !== null) { cancelAnimationFrame(frame); frame = null; }
      if (active) schedule();
    },
    resize: schedule,
  };
  new ResizeObserver(schedule).observe(canvas);
  canvas.addEventListener('webglcontextrestored', schedule);
  return engine;
}
