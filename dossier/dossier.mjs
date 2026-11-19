import {themeSwitch} from '/portfolio-assets/theme-switch.mjs?v=dossier2';

const root = document.documentElement;
const cabin = document.querySelector('.lift-opening');
const shell = document.querySelector('.lift');
const room = document.querySelector('.lift-room');
const hotspot = room.querySelector('.room-hotspot');
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
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let current = 0;
let destination = 0;
let trip = 0;
let projectAnchors = [];
let arrivalScrollTop;

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
  if (consoleClose.contains(document.activeElement) || consoleBackdrop === document.activeElement) {
   display.focus({preventScroll: true});
  }
 }
 display.setAttribute('aria-expanded', String(open));
 display.setAttribute('aria-label', open ? 'Réduire le panneau de commande' : 'Agrandir le panneau de commande');
 display.title = open ? 'Revenir à la cabine' : 'Agrandir les commandes';
 consoleClose.hidden = !open;
 consoleBackdrop.hidden = !open;
 cabin.inert = open;
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
 cabin.dataset.room = floor.id;
 cabin.dataset.doors = 'open';
 delete cabin.dataset.travel;
 delete cabin.dataset.shaft;
 room.style.removeProperty('--room-pan');
 room.style.removeProperty('--room-scale');
 indicator.textContent = floor.number;
 direction.textContent = '⤢';
 readout.textContent = index === 0 ? 'Rez-de-chaussée' : floor.name;
 label.textContent = floor.number + ' / ' + floor.name;
 roomLevel.textContent = label.textContent;
 roomName.textContent = floor.roomName;
 explore.firstChild.textContent = floor.action + ' ';
 hotspot.setAttribute('aria-label', floor.action);
 const details = reveal || target !== floor.section;
 setDetails(details);
 projectAnchors = [...floor.section.querySelectorAll('.reel-entry')];
 viewport.scrollTop = 0;
 if (details && target !== floor.section) {
  viewport.scrollTop = target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
 }
 arrivalScrollTop = viewport.scrollTop;
 updateLinks(target.id);
 if (moveFocus) {
  if (details) focusContent(target);
  else hotspot.focus({preventScroll: true});
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

function exploreFloor() {
 if (cabin.dataset.travel) return;
 setDetails(true);
 focusContent(floors[current].section);
}

hotspot.addEventListener('click', exploreFloor);
explore.addEventListener('click', exploreFloor);
roomBack.addEventListener('click', () => {
 setDetails(false);
 explore.focus({preventScroll: true});
});

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
room.addEventListener('pointerdown', event => {
 if (event.button !== 0 || event.target.closest('button') || reducedMotion.matches) return;
 const offset = parseFloat(room.style.getPropertyValue('--room-pan')) || 0;
 drag = {id: event.pointerId, start: event.clientX, offset};
 room.setPointerCapture(event.pointerId);
 room.dataset.dragging = '';
});

room.addEventListener('pointermove', event => {
 if (drag?.id !== event.pointerId) return;
 const offset = drag.offset + (event.clientX - drag.start) * 32 / room.clientWidth;
 room.style.setProperty('--room-pan', Math.max(-8, Math.min(8, offset)) + '%');
 room.style.setProperty('--room-scale', '1.04');
});

function stopDrag(event) {
 if (drag?.id !== event.pointerId) return;
 drag = undefined;
 delete room.dataset.dragging;
}

room.addEventListener('pointerup', stopDrag);
room.addEventListener('pointercancel', stopDrag);
room.addEventListener('lostpointercapture', stopDrag);

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
