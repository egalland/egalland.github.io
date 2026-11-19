import { buildMechanics } from './mechanics.js';
import { buildElectronics } from './electronics.js';

const el = id => document.getElementById(id);
const categories = new Map([
  ['chassis', 'Châssis'],
  ['transmission', 'Transmission'],
  ['suspension', 'Suspensions & direction'],
  ['roues', 'Roues'],
  ['carrosserie', 'Carrosserie'],
  ['electronique', 'Électronique & caméra'],
  ['impression', 'Supports à imprimer'],
]);
const state = {
  engine: null,
  selected: null,
  isolated: false,
  focused: false,
  shellVisible: true,
  separation: 0,
  animation: 0,
  open: new Set(['chassis']),
  entries: new Map(),
};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const announce = value => { el('announce').textContent = value; };

function updateVisibility() {
  const hidden = new Set();
  for (const part of state.engine.parts) {
    const isHidden = (state.isolated && part.id !== state.selected)
      || (!state.isolated && !state.shellVisible && part.category === 'carrosserie');
    if (isHidden) hidden.add(part.id);
  }
  state.engine.setHidden(hidden);
  state.engine.setSelected(state.isolated ? null : state.selected);
  el('shell').textContent = state.shellVisible ? 'Carrosserie visible' : 'Carrosserie masquée';
  el('shell').setAttribute('aria-pressed', String(state.shellVisible));
  el('isolate').setAttribute('aria-pressed', String(state.isolated));
  el('isolate').textContent = state.isolated ? 'Voir l’ensemble' : 'Isoler la pièce';
}

function selectPart(id) {
  const part = state.engine.parts.find(item => item.id === id);
  state.selected = part?.id ?? null;
  if (!part) state.isolated = false;
  if (part?.category === 'carrosserie') state.shellVisible = true;
  updateVisibility();
  if (state.focused && part) state.engine.focusPart?.(part.id);
  el('detail').hidden = !part;
  el('partTag').hidden = !part;
  for (const [entryId, button] of state.entries) {
    button.setAttribute('aria-pressed', String(entryId === state.selected));
  }
  if (!part) {
    announce('Vue de l’ensemble');
    return;
  }
  el('detailFamily').textContent = categories.get(part.category);
  el('detailName').textContent = part.label;
  el('detailDescription').textContent = part.description;
  el('partTag').textContent = part.label;
  const button = state.entries.get(part.id);
  if (button) button.closest('details').open = true;
  announce(part.label);
}

function renderList() {
  const query = normalize(el('filter').value.trim());
  const list = el('parts');
  const groups = document.createDocumentFragment();
  state.entries.clear();
  for (const [category, label] of categories) {
    const items = state.engine.parts.filter(part => part.category === category &&
      (!query || normalize([part.label, label, part.description].join(' ')).includes(query)));
    if (!items.length) continue;
    const group = document.createElement('details');
    group.open = !!query || state.open.has(category);
    const summary = document.createElement('summary');
    summary.textContent = label;
    const count = document.createElement('small');
    count.textContent = items.length;
    summary.append(count);
    group.append(summary);
    for (const part of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'entry';
      button.textContent = part.label;
      button.setAttribute('aria-pressed', String(part.id === state.selected));
      button.addEventListener('click', () => selectPart(part.id));
      group.append(button);
      state.entries.set(part.id, button);
    }
    group.addEventListener('toggle', () => {
      if (!query) {
        if (group.open) state.open.add(category);
        else state.open.delete(category);
      }
    });
    groups.append(group);
  }
  list.replaceChildren(groups);
  el('empty').hidden = state.entries.size > 0;
  el('count').textContent = query ? state.entries.size + ' / ' + state.engine.parts.length : state.engine.parts.length + ' ensembles';
}

function setSeparation(value) {
  state.separation = Math.max(0, Math.min(100, value));
  el('separation').value = Math.round(state.separation);
  el('amount').value = Math.round(state.separation) + ' %';
  el('assembled').setAttribute('aria-pressed', String(state.separation === 0));
  el('exploded').setAttribute('aria-pressed', String(state.separation > 0));
  state.engine.setExplosion(state.separation / 100);
}

function animateSeparation(target) {
  cancelAnimationFrame(state.animation);
  const startValue = state.separation;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || startValue === target) {
    setSeparation(target);
    return;
  }
  const start = performance.now();
  const step = now => {
    const elapsed = Math.min(1, (now - start) / 700);
    const eased = elapsed * elapsed * (3 - 2 * elapsed);
    setSeparation(startValue + (target - startValue) * eased);
    if (elapsed < 1) state.animation = requestAnimationFrame(step);
  };
  state.animation = requestAnimationFrame(step);
}

async function toggleFullscreen() {
  const viewer = el('viewer');
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (viewer.classList.contains('full-window')) viewer.classList.remove('full-window');
    else if (viewer.requestFullscreen) await viewer.requestFullscreen();
    else viewer.classList.add('full-window');
  } catch {
    viewer.classList.toggle('full-window');
  }
  updateFullscreenLabel();
  state.engine.resize();
}

function updateFullscreenLabel() {
  const active = Boolean(document.fullscreenElement || el('viewer').classList.contains('full-window'));
  const label = active ? 'Quitter le plein écran' : 'Afficher la vue en plein écran';
  el('fullscreen').setAttribute('aria-label', label);
  el('fullscreen').title = label;
}

function bindControls() {
  const engine = state.engine;
  engine.onPick = selectPart;
  el('filter').addEventListener('input', renderList);
  el('assembled').onclick = () => animateSeparation(0);
  el('exploded').onclick = () => animateSeparation(100);
  el('separation').oninput = event => {
    cancelAnimationFrame(state.animation);
    setSeparation(Number(event.target.value));
  };
  const resetView = angle => {
    state.focused = false;
    engine.resetView(angle);
  };
  el('angle').onchange = event => resetView(event.target.value);
  el('homeView').onclick = () => {
    el('angle').value = 'perspective';
    resetView('perspective');
  };
  el('shell').onclick = () => {
    if (state.focused || state.isolated) resetView(el('angle').value);
    state.shellVisible = !state.shellVisible;
    state.isolated = false;
    if (!state.shellVisible && engine.parts.find(part => part.id === state.selected)?.category === 'carrosserie') selectPart(null);
    else updateVisibility();
  };
  el('isolate').onclick = () => {
    state.isolated = !state.isolated;
    updateVisibility();
    if (state.isolated) {
      state.focused = true;
      engine.focusPart?.(state.selected);
    } else resetView(el('angle').value);
  };
  el('focus').hidden = typeof engine.focusPart !== 'function';
  el('focus').onclick = () => {
    state.focused = true;
    engine.focusPart?.(state.selected);
  };
  el('zoomIn').onclick = () => engine.zoomBy?.(1.25);
  el('zoomOut').onclick = () => engine.zoomBy?.(0.8);
  el('zoomIn').hidden = el('zoomOut').hidden = typeof engine.zoomBy !== 'function';
  el('unselect').onclick = () => {
    const returnToAssembly = state.isolated || state.focused;
    selectPart(null);
    if (returnToAssembly) resetView(el('angle').value);
  };
  el('fullscreen').onclick = toggleFullscreen;
  document.addEventListener('fullscreenchange', () => { updateFullscreenLabel(); engine.resize(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && el('viewer').classList.contains('full-window')) {
      el('viewer').classList.remove('full-window');
      updateFullscreenLabel();
      engine.resize();
    }
  });
  let visible = true;
  const syncActive = () => engine.setActive(visible && !document.hidden);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncActive(); }).observe(el('studio'));
  new ResizeObserver(() => engine.resize()).observe(el('studio'));
  document.addEventListener('visibilitychange', syncActive);
}

function build(engine) {
  buildMechanics(engine);
  buildElectronics(engine);
  engine.finish();
  return engine;
}

async function init() {
  const canvas = el('modelCanvas');
  try {
    const { makeEngine } = await import('./engine.js');
    state.engine = build(makeEngine(canvas));
  } catch (error) {
    console.warn('Rendu WebGL indisponible. Rendu 3D de compatibilité activé.', error);
    const replacement = canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    const { makeCanvasEngine } = await import('./fallback.js');
    state.engine = build(makeCanvasEngine(replacement));
  }
  renderList();
  bindControls();
  setSeparation(location.hash === '#eclate' ? 100 : 0);
  el('loading').hidden = true;
}
init().catch(error => {
  console.error(error);
  el('loading').textContent = 'Le modèle 3D n’a pas pu être chargé. Recharge la page pour réessayer.';
});
