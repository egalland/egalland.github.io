import {themeSwitch} from '/portfolio-assets/theme-switch.mjs?v=dossier2';

const root = document.documentElement;
const cabin = document.querySelector('.lift-opening');
const shell = document.querySelector('.lift');
const shortcuts = shell.querySelector('.mobile-floor-nav');
const room = document.querySelector('.lift-room');
const scroller = room.querySelector('.room-scroller');
const stopsLayer = room.querySelector('.room-stops');
const stopTemplate = document.querySelector('#room-stop-template');
const roomNav = room.querySelector('.room-navigation');
const previousStop = roomNav.querySelector('[data-room-step="-1"]');
const nextStop = roomNav.querySelector('[data-room-step="1"]');
const roomPosition = roomNav.querySelector('.room-position');
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
 name: link.querySelector('span').textContent,
 roomName: link.dataset.roomName,
 action: link.dataset.action,
 section: document.querySelector(link.hash)
}));
const roomStops = {
 home: [['home', 'Profil'], ['profile-role', 'Mon métier'], ['print-cv', 'CV imprimable']],
 parcours: [['experience-1', 'Saint-Gobain'], ['experience-2', 'Frontend'], ['experience-4', 'Backend']],
 competences: [['competences', 'Compétences'], ['tools', 'Outils'], ['formation', 'Formation']],
 work: [['market-plus', 'Market Plus'], ['kikalmo', 'Kikalmo'], ['pills', 'Pills']],
 atelier: [['livre', 'Atelier du livre'], ['redim', 'Redim'], ['atlas', 'Atlas']],
 about: [['practice-1', 'Animer'], ['practice-3', 'Relier'], ['practice-4', 'Automatiser']],
 contact: [['contact', 'Contact'], ['contact-github', 'GitHub']]
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let current = 0;
let destination = 0;
let trip = 0;
let projectAnchors = [];
let arrivalScrollTop;
let stops = [];
let stopIndex = 0;
let detailTrigger;

const maxPan = () => Math.max(0, scroller.scrollWidth - scroller.clientWidth);

function syncPanorama() {
 const progress = maxPan() ? scroller.scrollLeft / maxPan() : 0;
 stopIndex = Math.round(progress * (stops.length - 1));
 stops.forEach((stop, index) => stop.toggleAttribute('data-current', index === stopIndex));
 roomPosition.textContent = (stopIndex + 1) + ' / ' + stops.length;
 previousStop.setAttribute('aria-disabled', String(stopIndex === 0));
 nextStop.setAttribute('aria-disabled', String(stopIndex >= stops.length - 1));
}

function moveToStop(index, smooth = false) {
 const position = Math.max(0, Math.min(index, stops.length - 1));
 if (position === stopIndex && smooth) return;
 scroller.scrollTo({
  left: maxPan() * position / Math.max(1, stops.length - 1),
  behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'
 });
 syncPanorama();
}

function layoutStops() {
 const distance = maxPan() / Math.max(1, stops.length - 1);
 stops.forEach((stop, index) => {
  stop.style.left = (scroller.clientWidth / 2 + index * distance) + 'px';
 });
}

function renderStops(floor) {
 detailTrigger = undefined;
 stops = roomStops[floor.id].map(([id, name]) => {
  const stop = stopTemplate.content.firstElementChild.cloneNode(true);
  stop.dataset.target = id;
  stop.querySelector('.room-hotspot-label').textContent = name;
  return stop;
 });
 stopsLayer.replaceChildren(...stops);
 layoutStops();
}

function targetFor(hash) {
 let id = hash.slice(1);
 try { id = decodeURIComponent(id); } catch {}
 id = ({chrome: 'home', 'market-interface': 'market-plus', 'kikalmo-personnage': 'kikalmo', 'kikalmo-interface': 'kikalmo', 'maison-reseaux': 'maison', 'bodyos-tendance': 'bodyos'})[id] || id;
 const target = document.getElementById(id);
 const section = target?.closest('.dossier-section');
 const index = floors.findIndex(floor => floor.section === section);
 return index >= 0 ? {index, target} : {index: 0, target: floors[0].section};
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
 display.setAttribute('aria-label', open ? 'Réduire le panneau de commande' : 'Agrandir le panneau de commande');
 display.title = open ? 'Revenir à la cabine' : 'Agrandir les commandes';
 consoleClose.hidden = !open;
 consoleBackdrop.hidden = !open;
 cabin.inert = open;
 shortcuts.inert = open;
}

function showFloor({index, target}, {moveFocus, announce, reveal}) {
 current = index;
 const floor = floors[index];
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
 indicator.textContent = floor.number;
 direction.textContent = '⤢';
 readout.textContent = index === 0 ? 'Rez-de-chaussée' : floor.name;
 label.textContent = floor.number + ' / ' + floor.name;
 roomLevel.textContent = label.textContent;
 roomName.textContent = floor.roomName;
 explore.firstChild.textContent = floor.action + ' ';
 if (newRoom) {
  renderStops(floor);
  const linkedStop = stops.findIndex(stop => stop.dataset.target === target.id);
  moveToStop(Math.max(0, linkedStop));
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
 if (announce) announcement.textContent = (index === 0 ? 'Rez-de-chaussée' : 'Étage ' + floor.number) + ' · ' + floor.roomName;
}

async function go(hash, {animate = true, moveFocus = false, announce = true, reveal = false} = {}) {
 const target = targetFor(hash);
 destination = target.index;
 down.setAttribute('aria-disabled', String(destination === 0));
 up.setAttribute('aria-disabled', String(destination === floors.length - 1));
 const ticket = ++trip;
 const options = {moveFocus, announce, reveal};
 if (destination === current || !animate || reducedMotion.matches) {
  showFloor(target, options);
  return;
 }
 const step = Math.sign(destination - current);
 // Give the next panorama the duration of the elevator trip to load.
 const nextScene = new Image();
 nextScene.src = new URL('scenes/' + floors[destination].id + '.webp', import.meta.url).href;
 setDetails(false);
 cabin.dataset.doors = 'closed';
 cabin.dataset.travel = step > 0 ? 'up' : 'down';
 direction.textContent = step > 0 ? '↑' : '↓';
 readout.textContent = 'En déplacement';
 await wait(340);
 if (ticket !== trip) return;
 cabin.dataset.shaft = '';
 for (let index = current + step; ticket === trip; index += step) {
  indicator.textContent = floors[index].number;
  await wait(130);
  if (index === target.index) break;
 }
 if (ticket === trip) showFloor(target, options);
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
 if (!stop || cabin.dataset.travel) return;
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
 const index = {Home: 0, End: stops.length - 1, ArrowLeft: stopIndex - 1, ArrowRight: stopIndex + 1}[event.key];
 moveToStop(index, true);
});

scroller.addEventListener('wheel', event => {
 if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) || cabin.dataset.travel) return;
 const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scroller.clientWidth : 1);
 const position = Math.max(0, Math.min(maxPan(), scroller.scrollLeft + delta));
 if (Math.abs(position - scroller.scrollLeft) < 1) return;
 event.preventDefault();
 scroller.scrollLeft = position;
}, {passive: false});

display.addEventListener('click', () => setConsole(!shell.dataset.console));
consoleClose.addEventListener('click', () => setConsole(false));
consoleBackdrop.addEventListener('click', () => setConsole(false));

document.addEventListener('keydown', event => {
 if (event.key !== 'Escape') return;
 if (shell.dataset.console) {
  setConsole(false);
  display.focus({preventScroll: true});
 } else if (cabin.hasAttribute('data-details')) {
  roomBack.click();
 }
});

let drag;
scroller.addEventListener('pointerdown', event => {
 if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button') || cabin.dataset.travel) return;
 drag = {id: event.pointerId, start: event.clientX, left: scroller.scrollLeft};
 scroller.setPointerCapture(event.pointerId);
 scroller.dataset.dragging = '';
});

scroller.addEventListener('pointermove', event => {
 if (drag?.id === event.pointerId) scroller.scrollLeft = drag.left + drag.start - event.clientX;
});

function stopDrag(event) {
 if (drag?.id !== event.pointerId) return;
 drag = undefined;
 delete scroller.dataset.dragging;
}

scroller.addEventListener('pointerup', stopDrag);
scroller.addEventListener('pointercancel', stopDrag);
scroller.addEventListener('lostpointercapture', stopDrag);

new ResizeObserver(() => {
 if (!stops.length) return;
 const position = stopIndex;
 layoutStops();
 moveToStop(position);
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
 const next = floors[destination + Number(button.dataset.step)];
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
