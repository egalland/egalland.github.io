import {themeSwitch} from '/portfolio-assets/theme-switch.mjs?v=dossier2';

const root = document.documentElement;
const cabin = document.querySelector('.lift-opening');
const viewport = document.querySelector('.lift-viewport');
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
 section: document.querySelector(link.hash)
}));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let current = 0;
let destination = 0;
let trip = 0;
let projectAnchors = [];

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
 const top = viewport.getBoundingClientRect().top + 96;
 const project = projectAnchors.findLast(node => node.getBoundingClientRect().top <= top);
 updateLinks(project?.id || floors[current].id);
}

function showFloor({index, target}, moveFocus, announce) {
 current = index;
 const floor = floors[index];
 for (const item of floors) {
  const active = item === floor;
  item.section.inert = !active;
  item.section.toggleAttribute('data-active-floor', active);
  if (active) item.link.setAttribute('aria-current', 'location');
  else item.link.removeAttribute('aria-current');
 }
 cabin.dataset.doors = 'open';
 indicator.textContent = floor.number;
 direction.textContent = '–';
 readout.textContent = index === 0 ? 'Rez-de-chaussée' : floor.name;
 label.textContent = floor.number + ' / ' + floor.name;
 projectAnchors = [...floor.section.querySelectorAll('.reel-entry')];
 viewport.scrollTop = 0;
 if (target !== floor.section) {
  viewport.scrollTop = target.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
 }
 updateLinks(target.id);
 if (moveFocus) {
  const heading = target.querySelector('h1, h2, h3') || target;
  heading.tabIndex = -1;
  heading.focus({preventScroll: true});
 }
 if (announce) announcement.textContent = (index === 0 ? 'Rez-de-chaussée' : 'Étage ' + floor.number) + ' · ' + floor.name;
}

async function go(hash, {animate = true, moveFocus = false, announce = true} = {}) {
 const target = targetFor(hash);
 destination = target.index;
 down.setAttribute('aria-disabled', String(destination === 0));
 up.setAttribute('aria-disabled', String(destination === floors.length - 1));
 const ticket = ++trip;
 if (destination === current || !animate || reducedMotion.matches) {
  showFloor(target, moveFocus, announce);
  return;
 }
 const step = Math.sign(destination - current);
 cabin.dataset.doors = 'closed';
 direction.textContent = step > 0 ? '↑' : '↓';
 readout.textContent = 'En déplacement';
 await wait(230);
 for (let index = current + step; ticket === trip; index += step) {
  indicator.textContent = floors[index].number;
  await wait(85);
  if (index === target.index) break;
 }
 if (ticket === trip) showFloor(target, moveFocus, announce);
}

function select(hash, moveFocus = false) {
 if (hash !== location.hash) history.pushState(null, '', hash);
 void go(hash, {moveFocus});
}

document.addEventListener('click', event => {
 const link = event.target.closest('a[href^="#"]');
 if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
 event.preventDefault();
 select(link.hash, !panel.contains(link));
});

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
 if (next) select(next.link.hash);
});

addEventListener('hashchange', () => { void go(location.hash); });
viewport.addEventListener('scroll', syncProject, {passive: true});
print.addEventListener('click', () => window.print());
print.hidden = false;
travel.hidden = false;
root.dataset.lift = 'ready';
void go(location.hash, {animate: false, announce: false});
