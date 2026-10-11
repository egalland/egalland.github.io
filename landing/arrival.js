'use strict';

(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const curtain = $('.intro-curtain');
  const counter = $('.intro-counter');
  const counterDigits = $('.counter-digits');
  const photo = $('.photo-stage');
  const tower = $('.tower-layer');
  const terrace = $('.terrace-layer');
  const headline = $('.headline-reveal');
  const track = $('.headline-track');
  const menu = $('#animation-menu');
  const menuButton = $('#menu-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const ease = 'cubic-bezier(.76,0,.24,1)';
  const arrivalPace = 1.6;
  const timing = { photographs: 1100, liftAt: 1180, liftFor: 760, headlineAt: 1410, headlineFor: 800, finish: 2340 };
  let run = 0;
  let animations = [];
  let ticker = 0;
  let finishTimer = 0;
  let lastCount = -1;
  let rails = [];
  let marquee = null;
  let resizeTimer = 0;
  let activeDialog = null;
  let loaded = false;
  let settled = false;

  function tween(element, frames, options) {
    const animation = element.animate(frames, {
      fill: 'both', ...options,
      delay: (options.delay ?? 0) * arrivalPace,
      duration: options.duration * arrivalPace
    });
    animations.push(animation);
    return animation;
  }

  function setMenu(open) {
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  function stopArrival() {
    run += 1;
    cancelAnimationFrame(ticker);
    clearTimeout(finishTimer);
    animations.forEach((animation) => animation.cancel());
    animations = [];
    marquee?.cancel();
    marquee = null;
  }

  function createCounter() {
    lastCount = -1;
    rails = [];
    counterDigits.replaceChildren();
    for (let column = 0; column < 3; column += 1) {
      const window = document.createElement('div');
      window.className = 'digit-window';
      const rail = document.createElement('div');
      rail.className = 'digit-rail';
      for (let digit = 0; digit < 10; digit += 1) {
        const span = document.createElement('span');
        span.textContent = String(digit);
        rail.append(span);
      }
      window.append(rail);
      counterDigits.append(window);
      rails.push(rail);
    }
    updateCounter(76);
  }

  function updateCounter(value) {
    if (lastCount === value) return;
    lastCount = value;
    const digits = String(value).padStart(3, '0');
    rails.forEach((rail, index) => {
      rail.style.transform = `translateY(-${Number(digits[index])}em)`;
      rail.parentElement.style.display = index === 0 && value < 100 ? 'none' : 'block';
    });
  }

  function startMarquee(keepPosition = false) {
    let offset = 0;
    if (marquee && keepPosition) {
      const computed = getComputedStyle(track).transform;
      if (computed !== 'none') offset = new DOMMatrixReadOnly(computed).m41;
    }
    marquee?.cancel();
    marquee = null;
    if (motion.matches || !Element.prototype.animate || document.hidden || activeDialog) return;
    const width = $('.headline-unit').getBoundingClientRect().width;
    if (width < 1) return;
    marquee = track.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${width}px)` }], {
      duration: (width / 34) * 1000, iterations: Infinity, easing: 'linear'
    });
    if (keepPosition) marquee.currentTime = ((-offset % width + width) % width) / 34 * 1000;
  }

  function showFinal() {
    stopArrival();
    settled = true;
    curtain.hidden = true;
    counter.hidden = true;
    photo.style.top = '40.7%';
    tower.style.clipPath = 'inset(0%)';
    terrace.style.clipPath = 'inset(0%)';
    headline.style.transform = 'translateY(0)';
    $$('.arrival-content').forEach((element) => {
      element.style.opacity = '1';
      element.style.transform = element.classList.contains('hero-copy') ? 'translate(-50%, 0)' : 'translateY(0)';
      element.inert = false;
    });
    document.body.classList.remove('arriving');
    startMarquee();
  }

  function playArrival() {
    stopArrival();
    setMenu(false);
    $$('dialog[open]').forEach((dialog) => dialog.close());
    activeDialog = null;
    if (motion.matches || !Element.prototype.animate) {
      showFinal();
      return;
    }
    settled = false;
    const thisRun = run;
    document.body.classList.add('arriving');
    curtain.hidden = false;
    counter.hidden = false;
    curtain.style.transform = 'translateY(0)';
    counter.style.opacity = '1';
    photo.style.top = '50%';
    tower.style.clipPath = 'inset(50%)';
    terrace.style.clipPath = 'inset(50%)';
    headline.style.transform = 'translateY(110%)';
    $$('.arrival-content').forEach((element) => {
      element.style.opacity = '0';
      element.style.transform = element.classList.contains('hero-copy') ? 'translate(-50%, 12px)' : 'translateY(12px)';
      element.inert = true;
    });
    createCounter();

    // The photograph persists above the curtain and moves into its hero position.
    tween(tower, [{ clipPath: 'inset(50%)' }, { clipPath: 'inset(5%)' }, { clipPath: 'inset(0%)' }], { delay: 75, duration: 540, easing: ease });
    tween(terrace, [{ clipPath: 'inset(50%)' }, { clipPath: 'inset(15%)', offset: .63 }, { clipPath: 'inset(0%)' }], { delay: 425, duration: 675, easing: ease });
    tween(curtain, [{ transform: 'translateY(0)', backgroundColor: '#1c224e' }, { transform: 'translateY(-100%)', backgroundColor: '#252d67' }], { delay: timing.liftAt, duration: timing.liftFor, easing: ease });
    tween(photo, [{ top: '50%' }, { top: '40.7%' }], { delay: timing.liftAt, duration: timing.liftFor, easing: ease });
    tween(counter, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -16px' }], { delay: 1140, duration: 220, easing: 'ease-in' });
    tween(headline, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { delay: timing.headlineAt, duration: timing.headlineFor, easing: 'cubic-bezier(.22,1,.36,1)' });
    $$('.arrival-content').forEach((element, index) => {
      const centered = element.classList.contains('hero-copy');
      tween(element, [{ opacity: 0, transform: centered ? 'translate(-50%, 12px)' : 'translateY(12px)' }, { opacity: 1, transform: centered ? 'translate(-50%, 0)' : 'translateY(0)' }], {
        delay: 1450 + index * 110, duration: 650, easing: 'cubic-bezier(.22,1,.36,1)'
      });
    });

    const started = performance.now();
    const tick = (now) => {
      if (thisRun !== run) return;
      const progress = Math.min((now - started) / (timing.photographs * arrivalPace), 1);
      updateCounter(Math.min(100, 76 + Math.floor(24 * (1 - Math.pow(1 - progress, 1.7)))));
      if (progress < 1) ticker = requestAnimationFrame(tick);
    };
    ticker = requestAnimationFrame(tick);
    finishTimer = setTimeout(() => { if (thisRun === run) showFinal(); }, timing.finish * arrivalPace);
  }

  function openDialog(dialog) {
    setMenu(false);
    activeDialog = dialog;
    marquee?.pause();
    dialog.showModal();
  }

  menuButton.addEventListener('click', () => setMenu(menu.hidden));
  $('#replay-button').addEventListener('click', playArrival);
  $$('[data-replay]').forEach((button) => button.addEventListener('click', playArrival));
  $$('[data-dialog]').forEach((button) => button.addEventListener('click', () => openDialog(document.getElementById(button.dataset.dialog))));
  $$('[data-close]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      if (activeDialog === dialog) activeDialog = null;
      if (settled && !document.hidden) {
        if (marquee) marquee.play();
        else startMarquee();
      }
    });
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
    });
  });
  document.addEventListener('click', (event) => {
    if (!menu.hidden && !event.target.closest('.menu-wrap')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) marquee?.pause();
    else if (settled && !motion.matches && !activeDialog) {
      if (marquee) marquee.play();
      else startMarquee();
    }
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (settled) startMarquee(true); }, 150);
  });
  motion.addEventListener('change', () => { if (loaded) showFinal(); });

  // Local photos are decoded before the animation, with a bounded wait.
  const images = $$('.photo-stage img');
  const ready = Promise.allSettled(images.map((image) => image.decode ? image.decode() : Promise.resolve()));
  let readyTimeout;
  Promise.race([ready, new Promise((resolve) => { readyTimeout = setTimeout(resolve, 1800); })]).then(() => {
    clearTimeout(readyTimeout);
    loaded = true;
    playArrival();
  });
})();
