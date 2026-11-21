import {themeSwitch} from '/portfolio-assets/theme-switch.mjs?v=dossier2';
import {preservesNativeMenu} from '/portfolio-assets/context-menu.mjs?v=dossier1';
import {enableStripScroll} from '/chrome/strip-scroll.mjs';

const root = document.documentElement;
const cabin = document.querySelector('.lift-opening');
const shell = document.querySelector('.lift');
const shortcuts = shell.querySelector('.mobile-floor-nav');
const room = document.querySelector('.lift-room');
const shaftTrack = cabin.querySelector('.shaft-track');
const scroller = room.querySelector('.room-scroller');
const stopsLayer = room.querySelector('.room-stops');
const stopTemplate = document.querySelector('#room-stop-template');
const roomNav = room.querySelector('.room-navigation');
const previousStop = roomNav.querySelector('[data-room-step="-1"]');
const nextStop = roomNav.querySelector('[data-room-step="1"]');
const contextTrigger = roomNav.querySelector('.dossier-menu-trigger');
const contextMenu = document.querySelector('#dossier-context');
const contextObjects = contextMenu.querySelector('.dossier-context-objects');
const roomPassages = room.querySelector('.room-passages');
const explore = room.querySelector('.room-explore');
const roomName = room.querySelector('.room-name');
const roomLevel = room.querySelector('.room-level');
const detailBar = document.querySelector('.lift-details-bar');
const roomBack = detailBar.querySelector('.room-back');
const viewport = document.querySelector('.lift-viewport');
const display = document.querySelector('.lift-display');
const consoleClose = document.querySelector('.console-close');
const consoleBackdrop = document.querySelector('.console-backdrop');
const panel = document.querySelector('.lift-buttons');
const indicator = document.querySelector('.lift-number');
const direction = document.querySelector('.lift-direction');
const readout = document.querySelector('.lift-readout');
const label = document.querySelector('.floor-label');
const announcement = document.querySelector('.lift-announcement');
const travel = document.querySelector('.lift-travel');
const down = travel.querySelector('[data-step="-1"]');
const up = travel.querySelector('[data-step="1"]');
const print = document.querySelector('#print-cv');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const updateLinks = themeSwitch();
const floors = [...panel.querySelectorAll('a')].map(link => ({
 link,
 id: link.hash.slice(1),
 number: link.dataset.floor,
 level: Number(link.dataset.level),
 name: link.querySelector('span').textContent,
 roomName: link.dataset.roomName,
 action: link.dataset.action,
 section: document.querySelector(link.hash)
}));
const serviced = [...new Set(floors.map(floor => floor.level))].sort((a, b) => a - b);
const entrance = floors.findIndex(floor => floor.id === 'home');
const passages = {
 home: [['work', 'Galerie'], ['parcours', 'Archives']],
 parcours: [['home', 'Atrium'], ['competences', 'Labo']],
 competences: [['atelier', 'Atelier'], ['parcours', 'Archives']],
 work: [['atelier', 'Atelier'], ['contact', 'Terrasse']],
 atelier: [['work', 'Galerie'], ['competences', 'Labo']],
 about: [['work', 'Galerie'], ['contact', 'Terrasse']],
 contact: [['about', 'Studio'], ['home', 'Atrium']]
};
const roomStops = {
 // Centre et dimensions de chaque objet, en pourcentage de la fresque.
 home: [['home', 'Profil', 23, 48, 16, 31], ['profile-role', 'Mon métier', 68, 61, 15, 18], ['print-cv', 'CV imprimable', 87, 63, 16, 15]],
 parcours: [['experience-1', 'Saint-Gobain', 26, 57, 20, 58], ['experience-2', 'Frontend', 49, 59, 10, 20], ['experience-4', 'Backend', 77, 67, 13, 43]],
 competences: [['competences', 'Compétences', 22, 63, 17, 30], ['tools', 'Outils', 60, 57, 14, 24], ['formation', 'Formation', 92, 57, 14, 25]],
 work: [['market-plus', 'Market Plus', 31, 66, 16, 15], ['kikalmo', 'Kikalmo', 57, 59, 7, 16], ['pills', 'Pills', 73, 54, 15, 13]],
 atelier: [['livre', 'Atelier du livre', 29, 57, 15, 46], ['redim', 'Redim', 53, 70, 21, 28], ['atlas', 'Atlas', 87, 60, 12, 20]],
 about: [['practice-1', 'Animer', 27, 48, 15, 27], ['practice-3', 'Relier', 53, 63, 9, 39], ['practice-4', 'Automatiser', 68, 57, 8, 22]],
 contact: [['contact', 'Contact', 20.5, 54, 9.5, 56], ['contact-github', 'GitHub', 89, 62, 11, 29]]
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const doorTime = 420;
cabin.style.setProperty('--door-time', doorTime + 'ms');

let current = entrance;
let passingLevel = 0;
let destination = entrance;
let trip = 0;
let closedAt = 0;
let shaftMotion;
let projectAnchors = [];
let arrivalScrollTop;
let stops = [];
let stopIndex = 0;
let panProgress = 0;
let panWidth = 0;
let panRange = 0;
let detailTrigger;
let suppressHotspotClick = false;

const maxPan = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);
const panBlocked = () => Boolean(cabin.dataset.travel || cabin.hasAttribute('data-details') || shell.dataset.console);
const floorAt = level => floors.find(floor => floor.level === level);
const displayLevel = level => floorAt(level)?.number ?? String(level).padStart(2, '0');

function syncPanorama() {
 const distance = maxPan();
 panProgress = distance ? Math.max(0, Math.min(1, scroller.scrollLeft / distance)) : 0;
 stopIndex = Math.round(panProgress * 2);
 roomNav.style.setProperty('--pan-progress', (panProgress * 100) + '%');
 previousStop.setAttribute('aria-disabled', String(panProgress <= .005));
 nextStop.setAttribute('aria-disabled', String(panProgress >= .995));
}

function moveToStop(index, smooth = false) {
 const position = Math.max(0, Math.min(index, 2)) / 2;
 if (Math.abs(position - panProgress) <= .005 && smooth) return;
 scroller.scrollTo({
  left: maxPan() * position,
  behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'
 });
 syncPanorama();
}

function renderStops(floor) {
 detailTrigger = undefined;
 stops = roomStops[floor.id].map(([id, name, x, y, width, height]) => {
  const stop = stopTemplate.content.firstElementChild.cloneNode(true);
  stop.dataset.target = id;
  stop.querySelector('.room-hotspot-label').textContent = name;
  stop.style.left = x + '%';
  stop.style.top = y + '%';
  stop.style.width = width + '%';
  stop.style.height = height + '%';
  return stop;
 });
 stopsLayer.replaceChildren(...stops);
 roomPassages.replaceChildren(...passages[floor.id].map(([id, name]) => {
  const link = document.createElement('a');
  link.href = '#' + id;
  link.textContent = name;
  return link;
 }));
}

function targetFor(hash) {
 let id = hash.slice(1);
 try { id = decodeURIComponent(id); } catch {}
 id = ({chrome: 'home', 'market-interface': 'market-plus', 'kikalmo-personnage': 'kikalmo', 'kikalmo-interface': 'kikalmo', 'maison-reseaux': 'maison', 'bodyos-tendance': 'bodyos'})[id] || id;
 const target = document.getElementById(id);
 const section = target?.closest('.dossier-section');
 const index = floors.findIndex(floor => floor.section === section);
 return index >= 0 ? {index, target} : {index: entrance, target: floors[entrance].section};
}

function syncProject() {
 if (viewport.scrollTop === arrivalScrollTop) return;
 arrivalScrollTop = undefined;
 const top = viewport.getBoundingClientRect().top + 96;
 const atEnd = viewport.scrollTop > 0 && viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop < 2;
 const project = atEnd ? projectAnchors.at(-1) : projectAnchors.findLast(node => node.getBoundingClientRect().top <= top);
 updateLinks(project?.id || floors[current].id);
}

function setDetails(open) {
 cabin.toggleAttribute('data-details', open);
 detailBar.hidden = !open;
 viewport.inert = !open;
 room.inert = open;
}

function focusContent(target) {
 const heading = target.querySelector('h1, h2, h3') || target;
 heading.tabIndex = -1;
 heading.focus({preventScroll: true});
}

function setConsole(open) {
 if (open) {
  shell.dataset.console = 'expanded';
  (panel.querySelector('[aria-current]') || display).focus({preventScroll: true});
 } else {
  delete shell.dataset.console;
  if (panel.contains(document.activeElement) || travel.contains(document.activeElement) ||
      consoleClose === document.activeElement || consoleBackdrop === document.activeElement) {
   display.focus({preventScroll: true});
  }
 }
 display.setAttribute('aria-expanded', String(open));
 display.setAttribute('aria-label', open ? 'Fermer le plan de la tour' : 'Ouvrir le plan de la tour');
 display.title = open ? 'Revenir à la cabine' : 'Ouvrir le plan de la tour';
 consoleClose.hidden = !open;
 consoleBackdrop.hidden = !open;
 cabin.inert = open;
 shortcuts.inert = open;
}

function showFloor({index, target}, {moveFocus, announce, reveal}) {
 current = index;
 const floor = floors[index];
 passingLevel = floor.level;
 for (const item of floors) {
  const active = item === floor;
  item.section.inert = !active;
  item.section.toggleAttribute('data-active-floor', active);
  if (active) item.link.setAttribute('aria-current', 'location');
  else item.link.removeAttribute('aria-current');
 }
 for (const link of shortcuts.querySelectorAll('a')) {
  if (link.hash === floor.link.hash) link.setAttribute('aria-current', 'location');
  else link.removeAttribute('aria-current');
 }
 const newRoom = cabin.dataset.room !== floor.id;
 cabin.dataset.room = floor.id;
 cabin.dataset.doors = 'open';
 delete cabin.dataset.travel;
 delete cabin.dataset.shaft;
 shaftTrack.replaceChildren();
 indicator.textContent = floor.number;
 direction.textContent = 'Plan';
 readout.textContent = floor.level === 0 ? 'Rez-de-chaussée' : floor.name;
 label.textContent = floor.number + ' / ' + floor.name;
 roomLevel.textContent = label.textContent;
 roomName.textContent = floor.roomName;
 explore.firstChild.textContent = floor.action + ' ';
 if (newRoom) {
  renderStops(floor);
  const linkedStop = stops.find(stop => stop.dataset.target === target.id && target !== floor.section);
  scroller.scrollLeft = linkedStop ? linkedStop.offsetLeft - scroller.clientWidth / 2 : 0;
  syncPanorama();
 }
 const details = reveal || target !== floor.section;
 setDetails(details);
 projectAnchors = [...floor.section.querySelectorAll('.reel-entry')];
 viewport.scrollTop = 0;
 if (details && target !== floor.section) {
  viewport.scrollTop = target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
 }
 arrivalScrollTop = viewport.scrollTop;
 updateLinks(target.matches('.reel-entry') ? target.id : floor.id);
 if (moveFocus) {
  if (details) focusContent(target);
  else scroller.focus({preventScroll: true});
 }
 if (announce) announcement.textContent = floor.roomName + ' · ' + (floor.number === 'T' ? 'Toit' : floor.level === 0 ? 'Rez-de-chaussée' : 'Niveau ' + floor.number);
}

function prepareShaft(from, target, step) {
 const route = [];
 for (let level = from; level !== target.level + step; level += step) {
  const scene = document.createElement('div');
  scene.className = 'shaft-floor';
  scene.style.top = (from - level) * 100 + '%';
  const floor = level === target.level ? target : level === floors[current].level ? floors[current] : floorAt(level);
  scene.toggleAttribute('data-service', !floor);
  const asset = new URL('scenes/' + (floor ? floor.id + '-panorama' : 'shaft') + '.webp', import.meta.url);
  scene.style.backgroundImage = 'url("' + asset.href + '")';
  route.push(scene);
 }
 shaftTrack.replaceChildren(...route);
}

async function go(hash, {animate = true, moveFocus = false, announce = true, reveal = false} = {}) {
 const target = targetFor(hash);
 destination = target.index;
 const floor = floors[destination];
 const destinationLevel = serviced.indexOf(floor.level);
 down.setAttribute('aria-disabled', String(destinationLevel === 0));
 up.setAttribute('aria-disabled', String(destinationLevel === serviced.length - 1));
 const ticket = ++trip;
 const options = {moveFocus, announce, reveal};
 const from = passingLevel;
 const distance = Math.abs(floor.level - from);
 shaftMotion?.cancel();
 shaftMotion = undefined;
 if (!distance || !animate || reducedMotion.matches) {
  const crossing = !distance && destination !== current && animate && !reducedMotion.matches && !cabin.dataset.travel;
  showFloor(target, options);
  if (crossing) room.animate([{opacity: .3}, {opacity: 1}], {duration: 360});
  return;
 }
 const step = Math.sign(floor.level - from);
 prepareShaft(from, floor, step);
 setDetails(false);
 room.inert = true;
 if (cabin.dataset.doors !== 'closed') closedAt = performance.now() + doorTime;
 cabin.dataset.doors = 'closed';
 cabin.dataset.travel = step > 0 ? 'up' : 'down';
 direction.textContent = step > 0 ? '↑' : '↓';
 readout.textContent = (step > 0 ? 'Montée' : 'Descente') + ' · ' + floor.number;
 const remaining = closedAt - performance.now();
 if (remaining > 0) await wait(remaining);
 if (ticket !== trip) return;
 cabin.dataset.shaft = '';
 const motion = shaftTrack.animate(
  [{transform: 'translateY(0)'}, {transform: 'translateY(' + step * distance * 100 + '%)'}],
  {duration: 300 + 240 * distance, easing: 'cubic-bezier(.42,.05,.58,.95)', fill: 'forwards'}
 );
 shaftMotion = motion;
 const updateIndicator = () => {
  if (shaftMotion !== motion || motion.playState === 'finished') return;
  const progress = motion.effect.getComputedTiming().progress ?? 0;
  const level = from + step * Math.round(progress * distance);
  if (level !== passingLevel) {
   passingLevel = level;
   indicator.textContent = displayLevel(level);
  }
  requestAnimationFrame(updateIndicator);
 };
 requestAnimationFrame(updateIndicator);
 await motion.finished.catch(() => {});
 if (ticket !== trip) return;
 passingLevel = floor.level;
 indicator.textContent = floor.number;
 await wait(130);
 if (ticket !== trip) return;
 motion.cancel();
 shaftMotion = undefined;
 showFloor(target, options);
}

function select(hash, options) {
 if (hash !== location.hash) history.pushState(null, '', hash);
 void go(hash, options);
}

document.addEventListener('click', event => {
 const link = event.target.closest('a[href^="#"]');
 if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 if (shell.dataset.console) setConsole(false);
 select(link.hash, {moveFocus: !panel.contains(link), reveal: link.classList.contains('skip')});
});

stopsLayer.addEventListener('click', event => {
 const stop = event.target.closest('[data-target]');
 if (!stop || cabin.dataset.travel || (suppressHotspotClick && event.detail)) return;
 detailTrigger = stop;
 select('#' + stop.dataset.target, {moveFocus: true, reveal: true});
});

explore.addEventListener('click', () => {
 if (cabin.dataset.travel) return;
 detailTrigger = explore;
 select(floors[current].link.hash, {moveFocus: true, reveal: true});
});

roomBack.addEventListener('click', () => {
 setDetails(false);
 const floor = floors[current];
 if (location.hash && location.hash !== floor.link.hash) history.replaceState(null, '', floor.link.hash);
 updateLinks(floor.id);
 (detailTrigger || scroller).focus({preventScroll: true});
});

roomNav.addEventListener('click', event => {
 const button = event.target.closest('[data-room-step]');
 if (!button || button.getAttribute('aria-disabled') === 'true') return;
 moveToStop(stopIndex + Number(button.dataset.roomStep), true);
});

scroller.addEventListener('scroll', syncPanorama, {passive: true});
scroller.addEventListener('keydown', event => {
 if (event.target !== scroller || !['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
 event.preventDefault();
 const index = {Home: 0, End: 2, ArrowLeft: stopIndex - 1, ArrowRight: stopIndex + 1}[event.key];
 moveToStop(index, true);
});

room.addEventListener('wheel', event => {
 if (event.ctrlKey || panBlocked()) return;
 const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1;
 const delta = unit * (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY);
 const position = Math.max(0, Math.min(maxPan(), scroller.scrollLeft + delta));
 if (position === scroller.scrollLeft) return;
 event.preventDefault();
 scroller.scrollLeft = position;
}, {passive: false});

enableStripScroll(scroller, {
 blocked: panBlocked,
 coast: distance => {
  if (!reducedMotion.matches) scroller.scrollBy({left: distance, behavior: 'smooth'});
 }
});

display.addEventListener('click', () => setConsole(!shell.dataset.console));
consoleClose.addEventListener('click', () => setConsole(false));
consoleBackdrop.addEventListener('click', () => setConsole(false));

document.addEventListener('keydown', event => {
 if (event.key !== 'Escape' || contextMenu.matches(':popover-open')) return;
 if (shell.dataset.console) {
  setConsole(false);
  display.focus({preventScroll: true});
 } else if (cabin.hasAttribute('data-details')) {
  roomBack.click();
 }
});

function openContext(x, y) {
 if (shell.dataset.console || cabin.dataset.travel) return false;
 contextMenu.querySelector('[data-context-action="panorama"]').textContent = cabin.hasAttribute('data-details')
  ? 'Revenir à la fresque' : 'Début de la fresque';
 contextObjects.replaceChildren(...stops.map(stop => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.contextTarget = stop.dataset.target;
  button.textContent = stop.querySelector('.room-hotspot-label').textContent;
  return button;
 }));
 for (const link of contextMenu.querySelectorAll('[data-context-view]')) {
  link.href = document.querySelector('.theme-switch a[data-theme-choice="' + link.dataset.contextView + '"]').href;
 }
 if (!contextMenu.matches(':popover-open')) contextMenu.showPopover();
 const bounds = contextMenu.getBoundingClientRect();
 contextMenu.style.left = Math.max(8, Math.min(x, innerWidth - bounds.width - 8)) + 'px';
 contextMenu.style.top = Math.max(8, Math.min(y, innerHeight - bounds.height - 8)) + 'px';
 return true;
}

contextTrigger.addEventListener('click', event => {
 if (contextMenu.matches(':popover-open')) contextMenu.hidePopover();
 else {
  const box = contextTrigger.getBoundingClientRect();
  if (openContext(box.right, box.bottom + 4) && !event.detail) {
   contextMenu.querySelector('[data-context-action]').focus();
  }
 }
});
contextMenu.addEventListener('toggle', () => {
 contextTrigger.setAttribute('aria-expanded', String(contextMenu.matches(':popover-open')));
});
contextMenu.addEventListener('click', event => {
 const command = event.target.closest('[data-context-action], [data-context-target]');
 if (!command) return;
 const {contextAction, contextTarget} = command.dataset;
 contextMenu.hidePopover();
 if (contextTarget) {
  detailTrigger = stops.find(stop => stop.dataset.target === contextTarget);
  if (detailTrigger) scroller.scrollLeft = detailTrigger.offsetLeft - scroller.clientWidth / 2;
  select('#' + contextTarget, {moveFocus: true, reveal: true});
 } else if (contextAction === 'plan') setConsole(true);
 else if (contextAction === 'print') window.print();
 else if (cabin.hasAttribute('data-details')) roomBack.click();
 else {
  moveToStop(0, true);
  scroller.focus({preventScroll: true});
 }
});
contextMenu.addEventListener('keydown', event => {
 if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
 const choices = [...contextMenu.querySelectorAll('[data-context-action], [data-context-target], a')];
 const index = choices.indexOf(document.activeElement);
 const step = event.key === 'ArrowDown' ? 1 : -1;
 const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1
  : (Math.max(index, step > 0 ? -1 : 0) + step + choices.length) % choices.length;
 event.preventDefault();
 choices[next].focus();
});
document.addEventListener('contextmenu', event => {
 const selection = getSelection()?.toString();
 if (contextMenu.contains(event.target) || preservesNativeMenu(event.target, {shiftKey: event.shiftKey, selection})) return;
 if (openContext(event.clientX + 8, event.clientY + 6)) event.preventDefault();
});
document.addEventListener('keydown', event => {
 if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
 if (preservesNativeMenu(event.target, {selection: getSelection()?.toString()})) return;
 const box = document.activeElement.getBoundingClientRect();
 if (!openContext(box.left + 8, box.top + 8)) return;
 event.preventDefault();
 contextMenu.querySelector('[data-context-action]').focus();
});
addEventListener('resize', () => {
 if (contextMenu.matches(':popover-open')) contextMenu.hidePopover();
});

let drag;
scroller.addEventListener('pointerdown', event => {
 suppressHotspotClick = false;
 if (event.pointerType !== 'mouse' || event.button !== 0 || panBlocked()) return;
 drag = {id: event.pointerId, start: event.clientX, left: scroller.scrollLeft};
});

scroller.addEventListener('pointermove', event => {
 if (drag?.id !== event.pointerId || panBlocked()) return;
 const distance = drag.start - event.clientX;
 if (!suppressHotspotClick) {
  if (Math.abs(distance) < 5) return;
  suppressHotspotClick = true;
  scroller.setPointerCapture(event.pointerId);
  scroller.dataset.dragging = '';
 }
 scroller.scrollLeft = drag.left + distance;
});

function stopDrag(event) {
 if (drag?.id !== event.pointerId) return;
 drag = undefined;
 delete scroller.dataset.dragging;
}

window.addEventListener('pointerup', stopDrag);
scroller.addEventListener('pointercancel', stopDrag);
scroller.addEventListener('lostpointercapture', stopDrag);

new ResizeObserver(() => {
 const width = scroller.clientWidth;
 const range = maxPan();
 if (!stops.length || !width || (width === panWidth && range === panRange)) return;
 const widthChanged = width !== panWidth;
 panWidth = width;
 panRange = range;
 if (widthChanged) scroller.scrollLeft = range * panProgress;
 syncPanorama();
}).observe(scroller);

panel.addEventListener('keydown', event => {
 const index = floors.findIndex(floor => floor.link === event.target);
 if (index === -1) return;
 const next = ({ArrowUp: index - 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: floors.length - 1})[event.key];
 if (next === undefined) return;
 event.preventDefault();
 floors[Math.max(0, Math.min(next, floors.length - 1))].link.focus();
});

travel.addEventListener('click', event => {
 const button = event.target.closest('[data-step]');
 if (!button) return;
 const next = floorAt(serviced[serviced.indexOf(floors[destination].level) + Number(button.dataset.step)]);
 if (next) {
  if (shell.dataset.console) setConsole(false);
  select(next.link.hash);
 }
});

addEventListener('hashchange', () => { void go(location.hash); });
viewport.addEventListener('scroll', syncProject, {passive: true});
print.addEventListener('click', () => window.print());
for (const floor of floors) floor.link.title = floor.name;
print.hidden = false;
travel.hidden = false;
room.hidden = false;
root.dataset.lift = 'ready';
void go(location.hash, {animate: false, announce: false});
