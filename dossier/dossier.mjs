import {themeSwitch} from '/portfolio-assets/theme-switch.mjs?v=dossier2';

const updateLinks = themeSwitch();
const index = [...document.querySelectorAll('.dossier-index a')];
const anchors = [...document.querySelectorAll('.dossier-section, .reel-entry, #contact')];
let scheduled = false;

function syncReadingPosition() {
 scheduled = false;
 const readingLine = Math.min(220, innerHeight * 0.36);
 let current = anchors[0];
 for (const anchor of anchors) {
  if (anchor.getBoundingClientRect().top > readingLine) break;
  current = anchor;
 }
 const activeSection = current.closest('.dossier-section')?.id || 'about';
 for (const link of index) {
  if (link.hash === '#' + activeSection) link.setAttribute('aria-current', 'location');
  else link.removeAttribute('aria-current');
 }
 updateLinks(current.id);
}

function scheduleSync() {
 if (scheduled) return;
 scheduled = true;
 requestAnimationFrame(syncReadingPosition);
}

addEventListener('scroll', scheduleSync, {passive: true});
addEventListener('resize', scheduleSync);
addEventListener('hashchange', scheduleSync);
addEventListener('pageshow', scheduleSync);
syncReadingPosition();

const print = document.querySelector('#print-cv');
print.hidden = false;
print.addEventListener('click', () => window.print());
