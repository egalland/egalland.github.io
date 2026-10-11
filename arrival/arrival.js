'use strict';

(() => {
  const overlay = document.getElementById('personal-arrival');
  const html = document.documentElement;
  if (!overlay) { html.classList.remove('arrival-pending'); return; }
  const page = document.querySelector('.page');
  const stage = overlay.querySelector('.arrival-photos');
  const curtain = overlay.querySelector('.arrival-curtain');
  const pictures = [...overlay.querySelectorAll('.arrival-photo')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wasInert = page?.inert ?? false;
  const navigation = performance.getEntriesByType('navigation')[0];
  const animations = [];
  let finished = false;
  let fallback;
  let imageTimeout;

  function finish() {
    if (finished) return;
    finished = true;
    const restoreFocus = overlay.contains(document.activeElement);
    clearTimeout(fallback);
    clearTimeout(imageTimeout);
    clearTimeout(window.__egArrivalGuard);
    delete window.__egArrivalGuard;
    animations.forEach(animation => animation.cancel());
    html.classList.remove('arrival-pending', 'arrival-running');
    if (page) page.inert = wasInert;
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    motion.removeEventListener?.('change', onMotion);
    if (restoreFocus && page && !wasInert) {
      page.querySelector('a, button')?.focus({preventScroll: true});
    }
  }

  function onKey(event) { if (event.key === 'Escape') { event.preventDefault(); finish(); } }
  function onMotion(event) { if (event.matches) finish(); }
  function animate(element, frames, duration, delay = 0, easing = 'cubic-bezier(.22,1,.36,1)') {
    const animation = element.animate(frames, {duration, delay, easing, fill: 'both'});
    animations.push(animation);
    return animation;
  }

  if (motion.matches || typeof overlay.animate !== 'function' || navigation?.type === 'back_forward') {
    finish();
    return;
  }
  overlay.hidden = false;
  html.classList.add('arrival-running');
  html.classList.remove('arrival-pending');
  if (page) page.inert = true;
  overlay.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  motion.addEventListener?.('change', onMotion);
  fallback = setTimeout(finish, 9500);

  async function play() {
    // Bound loading time: a slow or missing photograph must never block the calendar.
    await Promise.race([
      Promise.allSettled(pictures.map(image => image.decode())),
      new Promise(resolve => { imageTimeout = setTimeout(resolve, 1800); })
    ]);
    clearTimeout(imageTimeout);
    if (finished) return;
    const ready = pictures.filter(image => image.complete && image.naturalWidth > 0);
    pictures.forEach(image => { image.hidden = !ready.includes(image); });
    if (!ready.length) { finish(); return; }
    stage.style.opacity = '1';
    ready.forEach((image, index) => {
      // Four photographs in order: cinema, garden, stars, forest.
      animate(image, [
        {clipPath: 'inset(0 50% 0 50%)', transform: 'scale(1.045)'},
        {clipPath: 'inset(0)', transform: 'scale(1)'}
      ], 760, index * 1150);
    });
    animate(stage, [
      {transform: 'translate(-50%, -50%) translateY(0px) scale(1)', opacity: 1},
      {transform: 'translate(-50%, -50%) translateY(-75px) scale(.94)', opacity: 1, offset: .62},
      {transform: 'translate(-50%, -50%) translateY(-105px) scale(.9)', opacity: 0}
    ], 1350, 4850);
    const lift = animate(curtain, [
      {transform: 'translateY(0)'},
      {transform: 'translateY(-102%)'}
    ], 1350, 4850, 'cubic-bezier(.65,0,.18,1)');
    try { await lift.finished; } catch (_) { /* Skipping cancels the animation. */ }
    finish();
  }
  play().catch(finish);
})();
