/**
 * BodyOS Anatomy Core
 * Anatomical data: BodyParts3D / Z-Anatomy, CC BY-SA. See licenses/.
 * Viewer runtime: Three.js, MIT.
 */
import * as THREE from "./three.module.min.js?v=5";
import { OrbitControls } from "./addons/controls/OrbitControls.js?v=5";
import { GLTFLoader } from "./addons/loaders/GLTFLoader.js?v=5";

const GROUPS = [
  "pectoraux",
  "dorsaux",
  "trapezes",
  "deltoide_avant",
  "deltoide_lateral",
  "deltoide_arriere",
  "biceps",
  "triceps",
  "avant_bras",
  "abdominaux",
  "obliques",
  "lombaires",
  "quadriceps",
  "ischio_jambiers",
  "fessiers",
  "adducteurs",
  "mollets",
];

const LABELS = {
  pectoraux: "Pectoraux",
  dorsaux: "Grand dorsal",
  trapezes: "Trapèzes",
  deltoide_avant: "Deltoïde antérieur",
  deltoide_lateral: "Deltoïde latéral",
  deltoide_arriere: "Deltoïde postérieur",
  biceps: "Biceps",
  triceps: "Triceps",
  avant_bras: "Avant-bras",
  abdominaux: "Abdominaux",
  obliques: "Obliques",
  lombaires: "Lombaires",
  quadriceps: "Quadriceps",
  ischio_jambiers: "Ischio-jambiers",
  fessiers: "Fessiers",
  adducteurs: "Adducteurs",
  mollets: "Mollets",
};

const NON_MUSCLE_RE = /bursa|ligament|fascia|tendon|retinaculum|sheath|aponeuros|linea alba|tarsus|tendinous arch|intermuscular septum|synovial|iliotibial tract/i;

function classify(rawName) {
  const name = rawName.toLowerCase().replace(/\.(l|r)$/i, "");
  if (/pectoralis/.test(name)) return "pectoraux";
  if (/clavicular part of deltoid/.test(name)) return "deltoide_avant";
  if (/acromial part of deltoid/.test(name)) return "deltoide_lateral";
  if (/scapular spinal part of deltoid/.test(name)) return "deltoide_arriere";
  if (/trapezius/.test(name)) return "trapezes";
  if (/latissimus dorsi|teres major|rhomboid|serratus anterior/.test(name)) return "dorsaux";
  if (/biceps brachii|brachialis|coracobrachialis/.test(name)) return "biceps";
  if (/triceps brachii|anconeus/.test(name)) return "triceps";
  if (/rectus abdominis|transversus abdominis|pyramidalis/.test(name)) return "abdominaux";
  if (/abdominal oblique/.test(name)) return "obliques";
  if (/quadratus lumborum|iliocostalis lumborum|longissimus thoracis|spinalis thoracis|interspinales lumborum|multifidus lumborum|multifidus thoracis|rotatores|semispinalis thoracis|intertransversarii lumborum/.test(name)) return "lombaires";
  if (/rectus femoris|vastus |sartorius/.test(name)) return "quadriceps";
  if (/biceps femoris|semimembranosus|semitendinosus/.test(name)) return "ischio_jambiers";
  if (/gluteus |tensor fasciae latae/.test(name)) return "fessiers";
  if (/^\(?adductor (brevis|longus|magnus|minimus)|gracilis|pectineus/.test(name)) return "adducteurs";
  if (/gastrocnemius|soleus|plantaris|fibularis (brevis|longus)/.test(name)) return "mollets";
  if (/brachioradialis|pronator|supinator|flexor carpi|flexor digitorum (profundus|superficialis)|flexor pollicis|palmaris longus|extensor carpi|extensor digitorum$|extensor digiti minimi|extensor indicis|extensor pollicis|abductor pollicis|interossei muscles of hand|lumbrical muscles of hand|adductor pollicis|opponens/.test(name)) return "avant_bras";
  return null;
}

function parseName(rawName) {
  const sideMatch = rawName.match(/\.(l|r)$/i);
  const side = sideMatch ? (sideMatch[1].toLowerCase() === "l" ? "gauche" : "droit") : null;
  const clean = rawName
    .replace(/\.(l|r)$/i, "")
    .replace(/^\((.*)\)$/, "$1")
    .replace(/ muscle$/i, "")
    .trim();
  return { clean, side };
}

function mergeGeometries(geometries) {
  let vertexCount = 0;
  let indexCount = 0;
  for (const geometry of geometries) {
    vertexCount += geometry.attributes.position.count;
    indexCount += geometry.index ? geometry.index.count : geometry.attributes.position.count;
  }

  const position = new Float32Array(vertexCount * 3);
  const normal = new Float32Array(vertexCount * 3);
  const structureId = new Float32Array(vertexCount);
  const groupId = new Float32Array(vertexCount);
  const index = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount);

  let vertexOffset = 0;
  let indexOffset = 0;
  for (const geometry of geometries) {
    const count = geometry.attributes.position.count;
    position.set(geometry.attributes.position.array.subarray(0, count * 3), vertexOffset * 3);
    normal.set(geometry.attributes.normal.array.subarray(0, count * 3), vertexOffset * 3);
    structureId.set(geometry.attributes.structureId.array.subarray(0, count), vertexOffset);
    groupId.set(geometry.attributes.bodyosGroup.array.subarray(0, count), vertexOffset);

    if (geometry.index) {
      for (let i = 0; i < geometry.index.count; i += 1) {
        index[indexOffset + i] = geometry.index.array[i] + vertexOffset;
      }
      indexOffset += geometry.index.count;
    } else {
      for (let i = 0; i < count; i += 1) index[indexOffset + i] = vertexOffset + i;
      indexOffset += count;
    }
    vertexOffset += count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(position, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normal, 3));
  merged.setAttribute("structureId", new THREE.BufferAttribute(structureId, 1));
  merged.setAttribute("bodyosGroup", new THREE.BufferAttribute(groupId, 1));
  merged.setIndex(new THREE.BufferAttribute(index, 1));
  merged.computeBoundingSphere();
  return merged;
}

class BodyOSAnatomy {
  constructor() {
    this.root = document.getElementById("anatomy-root");
    this.loading = document.getElementById("loading");
    this.tooltip = document.getElementById("tooltip");
    this.error = document.getElementById("error");
    this.config = {
      mode: "exercise",
      primary: [],
      secondary: [],
      readiness: {},
      distribution: {},
      selected: null,
      interactive: false,
      autoSpin: false,
    };
    this.names = [];
    this.structureGroups = [];
    this.hoveredStructure = -1;
    this.hoveredGroup = null;
    this.pointer = new THREE.Vector2(-10, -10);
    this.pointerPx = { x: 0, y: 0 };
    this.raycaster = new THREE.Raycaster();
    this.lastPaintKey = "";
    this.dragDistance = 0;
    this.spin = false;
    this.setupScene();
    this.load();
  }

  setupScene() {
    const rect = this.root.getBoundingClientRect();
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(36, this.width / this.height, 0.05, 100);
    this.camera.position.set(0, 0.05, 5.4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setSize(this.width, this.height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.domElement.setAttribute("aria-label", "Faire pivoter le modèle anatomique");
    this.root.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 2.1;
    this.controls.maxDistance = 9;
    this.controls.enablePan = false;

    this.bodyGroup = new THREE.Group();
    this.bodyPivot = new THREE.Group();
    this.bodyGroup.add(this.bodyPivot);
    this.scene.add(this.bodyGroup);

    this.scene.add(new THREE.HemisphereLight(0xd7e6ff, 0x21120f, 1.05));
    const key = new THREE.DirectionalLight(0xfff1df, 2.2);
    key.position.set(3.5, 5, 5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x66d9ff, 0.9);
    fill.position.set(-4, 1, 3);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xd7ff38, 1.15);
    rim.position.set(1, 3, -5);
    this.scene.add(rim);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.root);
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  async load() {
    try {
      const gltf = await new GLTFLoader().loadAsync("./models/muscles.glb?v=1");
      const geometries = [];
      const associations = gltf.parser.associations;
      const json = gltf.parser.json;
      const originalName = (object) => {
        const association = associations.get(object);
        if (association && association.nodes !== undefined && json.nodes[association.nodes]) {
          return json.nodes[association.nodes].name || object.name;
        }
        return object.name;
      };

      gltf.scene.updateMatrixWorld(true);
      gltf.scene.traverse((child) => {
        if (!child.isMesh) return;
        const rawName = originalName(child) || `Structure ${this.names.length + 1}`;
        if (NON_MUSCLE_RE.test(rawName)) return;
        const geometry = child.geometry.clone();
        geometry.applyMatrix4(child.matrixWorld);
        geometry.deleteAttribute("uv");
        geometry.deleteAttribute("tangent");
        if (!geometry.attributes.normal) geometry.computeVertexNormals();
        const structureIndex = this.names.length;
        const group = classify(rawName);
        const groupIndex = group ? GROUPS.indexOf(group) : -1;
        this.names.push(rawName);
        this.structureGroups.push(group);
        const count = geometry.attributes.position.count;
        geometry.setAttribute("structureId", new THREE.BufferAttribute(new Float32Array(count).fill(structureIndex), 1));
        geometry.setAttribute("bodyosGroup", new THREE.BufferAttribute(new Float32Array(count).fill(groupIndex), 1));
        geometries.push(geometry);
      });

      const merged = mergeGeometries(geometries);
      geometries.forEach((geometry) => geometry.dispose());
      merged.setAttribute("color", new THREE.BufferAttribute(new Float32Array(merged.attributes.position.count * 3), 3));
      this.mesh = new THREE.Mesh(
        merged,
        new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.66,
          metalness: 0.03,
          side: THREE.DoubleSide,
        }),
      );
      this.bodyPivot.add(this.mesh);
      this.normalizeBody();
      this.paint(true);
      window.bodyosBootReady?.();
      parent.postMessage({ type: "bodyos-anatomy-ready" }, location.origin);
    } catch (error) {
      console.error(error);
      if (window.bodyosBootError) window.bodyosBootError(error);
      else {
        this.loading.classList.add("hidden");
        this.error.style.display = "grid";
      }
      parent.postMessage({ type: "bodyos-anatomy-error" }, location.origin);
    }
  }

  normalizeBody() {
    const bounds = new THREE.Box3().setFromObject(this.bodyPivot);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const targetHeight = 3.72;
    const scale = targetHeight / size.y;
    this.bodyPivot.scale.setScalar(scale);
    this.bodyPivot.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    this.bodyHeight = targetHeight;
    this.setCamera("front", false);
  }

  fitPosition(position, target) {
    const direction = position.clone().sub(target);
    const rawDistance = direction.length();
    const halfWidth = (this.bodyHeight || 3.72) * 0.27;
    const verticalFov = THREE.MathUtils.degToRad(this.camera.fov);
    const needed = halfWidth / (Math.tan(verticalFov / 2) * Math.max(this.camera.aspect, 0.28));
    const factor = Math.max(1, Math.min(2.7, needed / rawDistance));
    return target.clone().add(direction.multiplyScalar(factor));
  }

  setCamera(view, animate = true) {
    const height = this.bodyHeight || 3.72;
    const presets = {
      front: [[0, 0, height * 1.38], [0, 0, 0]],
      back: [[0, 0, -height * 1.38], [0, 0, 0]],
      left: [[-height * 1.38, 0, 0], [0, 0, 0]],
      right: [[height * 1.38, 0, 0], [0, 0, 0]],
      torso: [[0, height * 0.08, height * 0.72], [0, height * 0.08, 0]],
    };
    const preset = presets[view] || presets.front;
    const target = new THREE.Vector3(...preset[1]);
    const rawPosition = new THREE.Vector3(...preset[0]);
    const position = this.fitPosition(rawPosition, target);
    this.lastView = { rawPosition, target: target.clone() };
    if (!animate) {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      return;
    }
    const fromPosition = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const started = performance.now();
    const fly = () => {
      const progress = Math.min(1, (performance.now() - started) / 680);
      const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
      this.camera.position.lerpVectors(fromPosition, position, eased);
      this.controls.target.lerpVectors(fromTarget, target, eased);
      this.controls.update();
      if (progress < 1) requestAnimationFrame(fly);
    };
    fly();
  }

  resize() {
    const rect = this.root.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    if (this.lastView) {
      this.camera.position.copy(this.fitPosition(this.lastView.rawPosition, this.lastView.target));
      this.controls.target.copy(this.lastView.target);
      this.controls.update();
    }
  }

  colorForGroup(group) {
    const mode = this.config.mode;
    if (!group) return new THREE.Color("#241d1c");
    if (mode === "recovery") {
      const readiness = Math.max(0, Math.min(100, Number(this.config.readiness[group] ?? 100)));
      const hue = (readiness / 100) * 0.32;
      const lightness = readiness >= 99 ? 0.39 : 0.47;
      return new THREE.Color().setHSL(hue, 0.88, lightness);
    }
    if (mode === "distribution") {
      const values = Object.values(this.config.distribution || {}).map(Number).filter(Number.isFinite);
      const max = Math.max(1, ...values);
      const ratio = Math.max(0, Math.min(1, Number(this.config.distribution[group] || 0) / max));
      return new THREE.Color("#26302a").lerp(new THREE.Color("#d7ff38"), Math.pow(ratio, 0.72));
    }
    if (this.config.primary.includes(group)) return new THREE.Color("#d7ff38");
    if (this.config.secondary.includes(group)) return new THREE.Color("#66d9ff");
    return new THREE.Color("#302725");
  }

  paint(force = false) {
    if (!this.mesh) return;
    const key = JSON.stringify({ config: this.config, hover: this.hoveredGroup });
    if (!force && key === this.lastPaintKey) return;
    this.lastPaintKey = key;
    const colors = this.mesh.geometry.attributes.color.array;
    const groupIds = this.mesh.geometry.attributes.bodyosGroup.array;
    const structureIds = this.mesh.geometry.attributes.structureId.array;
    const color = new THREE.Color();
    for (let index = 0; index < groupIds.length; index += 1) {
      const groupIndex = groupIds[index];
      const group = groupIndex >= 0 ? GROUPS[groupIndex] : null;
      color.copy(this.colorForGroup(group));
      const shade = 0.86 + ((structureIds[index] * 37) % 23) / 100;
      color.multiplyScalar(shade);
      if (group && group === this.config.selected) color.lerp(new THREE.Color("#ffffff"), 0.24);
      if (group && group === this.hoveredGroup) color.lerp(new THREE.Color("#ffffff"), 0.32);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    this.mesh.geometry.attributes.color.needsUpdate = true;
  }

  nearestVertex(hit) {
    const position = hit.object.geometry.attributes.position;
    const point = new THREE.Vector3();
    let best = hit.face.a;
    let bestDistance = Infinity;
    for (const index of [hit.face.a, hit.face.b, hit.face.c]) {
      point.fromBufferAttribute(position, index).applyMatrix4(hit.object.matrixWorld);
      const distance = point.distanceToSquared(hit.point);
      if (distance < bestDistance) {
        best = index;
        bestDistance = distance;
      }
    }
    return best;
  }

  hitTest() {
    if (!this.mesh) return null;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.mesh, false)[0];
    if (!hit) return null;
    const vertex = this.nearestVertex(hit);
    const structureIndex = this.mesh.geometry.attributes.structureId.array[vertex];
    return {
      structureIndex,
      rawName: this.names[structureIndex],
      group: this.structureGroups[structureIndex],
    };
  }

  updateHover() {
    const hit = this.hitTest();
    const nextGroup = hit?.group || null;
    if (nextGroup !== this.hoveredGroup) {
      this.hoveredGroup = nextGroup;
      this.paint();
    }
    if (!hit) {
      this.tooltip.style.opacity = "0";
      return;
    }
    const parsed = parseName(hit.rawName);
    this.tooltip.innerHTML = `${parsed.clean}${parsed.side ? ` · ${parsed.side}` : ""}${hit.group ? `<b>${LABELS[hit.group]}</b>` : ""}`;
    this.tooltip.style.left = `${Math.min(this.width - 230, Math.max(4, this.pointerPx.x))}px`;
    this.tooltip.style.top = `${Math.min(this.height - 62, Math.max(4, this.pointerPx.y))}px`;
    this.tooltip.style.opacity = "1";
  }

  selectCurrent() {
    const hit = this.hitTest();
    if (!hit?.group) return;
    const parsed = parseName(hit.rawName);
    this.config.selected = hit.group;
    this.paint(true);
    parent.postMessage(
      {
        type: "bodyos-muscle-click",
        muscleId: hit.group,
        structureName: parsed.clean,
        side: parsed.side,
      },
      location.origin,
    );
  }

  bindEvents() {
    const canvas = this.renderer.domElement;
    let start = { x: 0, y: 0 };
    const updatePointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.pointerPx = { x, y };
      this.pointer.x = (x / rect.width) * 2 - 1;
      this.pointer.y = -(y / rect.height) * 2 + 1;
    };
    canvas.addEventListener("pointermove", (event) => {
      updatePointer(event);
      this.dragDistance += Math.hypot(event.clientX - start.x, event.clientY - start.y);
      start = { x: event.clientX, y: event.clientY };
      this.updateHover();
    });
    canvas.addEventListener("pointerdown", (event) => {
      updatePointer(event);
      start = { x: event.clientX, y: event.clientY };
      this.dragDistance = 0;
    });
    canvas.addEventListener("pointerup", (event) => {
      updatePointer(event);
      if (this.dragDistance < 12 && this.config.interactive) this.selectCurrent();
    });
    canvas.addEventListener("pointerleave", () => {
      this.pointer.set(-10, -10);
      this.hoveredGroup = null;
      this.tooltip.style.opacity = "0";
      this.paint();
    });

    window.addEventListener("message", (event) => {
      if (event.origin !== location.origin || event.source !== parent) return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.type === "bodyos-config") {
        this.config = {
          ...this.config,
          ...message.config,
          primary: Array.isArray(message.config?.primary) ? message.config.primary : [],
          secondary: Array.isArray(message.config?.secondary) ? message.config.secondary : [],
          readiness: message.config?.readiness || {},
          distribution: message.config?.distribution || {},
        };
        this.spin = Boolean(this.config.autoSpin);
        this.paint(true);
      }
      if (message.type === "bodyos-camera") this.setCamera(message.view || "front");
      if (message.type === "bodyos-spin") this.spin = Boolean(message.enabled);
    });
  }

  animate() {
    requestAnimationFrame(this.animate);
    if (this.spin && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.bodyGroup.rotation.y += 0.0024;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

new BodyOSAnatomy();
