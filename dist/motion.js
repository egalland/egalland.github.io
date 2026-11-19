/* Motion enhances rendered UI only. Élan keeps ownership of navigation, dialogs and records. */
(() => {
  const content = document.querySelector('#content');
  const nav = document.querySelector('#nav');
  const sheet = document.querySelector('#modal');
  const toast = document.querySelector('#toast');
  if (!content || !nav || !sheet || !toast) return;

  const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canAnimate = () => !prefersStill.matches && !document.hidden && typeof Element.prototype.animate === 'function';
  const easing = 'cubic-bezier(.18,.82,.24,1)';
  let lastView = content.dataset.view || null;
  let navFrame = 0;
  let viewAnimations = [];
  const order = ['plan','ideas','contacts','stats'];

  function syncNav() {
    navFrame = 0;
    const active = nav.querySelector('[aria-current="page"]');
    if (!active) return;
    const base = nav.getBoundingClientRect();
    const tab = active.getBoundingClientRect();
    if (!base.width || !tab.width) return;
    nav.classList.toggle('motion-relative', getComputedStyle(nav).position === 'static' || nav.classList.contains('motion-relative') && getComputedStyle(nav).position === 'relative');
    nav.style.setProperty('--marker-x', (tab.left - base.left + tab.width / 2 - 9) + 'px');
    nav.style.setProperty('--marker-y', (tab.bottom - base.top - 4) + 'px');
    nav.classList.add('motion-nav');
  }
  function scheduleNav() {
    if (!navFrame) navFrame = requestAnimationFrame(syncNav);
  }

  function animateRoute() {
    scheduleNav();
    const next = content.dataset.view;
    if (!next || next === lastView) return;
    const previous = lastView;
    lastView = next;
    viewAnimations.forEach(animation => animation.cancel());
    viewAnimations = [];
    if (!previous || !canAnimate()) return;

    const dir = order.indexOf(next) >= order.indexOf(previous) ? 1 : -1;
    const page = content.querySelector('.sc-page');
    const pieces = page ? [...page.children] : [...content.children].flatMap(el =>
      el.classList.contains('agenda-grid') ? [...el.children] : [el]
    );
    // Keep later offscreen content immediately visible and interactive.
    const visible = pieces.filter(el => {
      const box = el.getBoundingClientRect();
      return box.width && box.bottom > 0 && box.top < innerHeight + 50;
    }).slice(0, 6);
    visible.forEach((el,i) => {
      viewAnimations.push(el.animate([
        {opacity:.15,transform:'translate3d(' + dir * 9 + 'px,8px,0)'},
        {opacity:1,transform:'translate3d(0,0,0)'}
      ], {duration:310, delay:i * 30, easing, fill:'backwards'}));
    });
  }

  new MutationObserver(animateRoute).observe(content, {attributes:true, attributeFilter:['data-view']});
  new MutationObserver(scheduleNav).observe(nav, {childList:true});
  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleNav).observe(nav);
  }
  window.addEventListener('resize', scheduleNav, {passive:true});
  document.fonts?.ready.then(scheduleNav);
  scheduleNav();

  // Real completion is recorded synchronously by the original form submit handler.
  // Schedule the reward afterwards so opening the form or dismissing it has no effect.
  document.addEventListener('submit', event => {
    if (event.target.id !== 'doneForm') return;
    const previousId = state.history.at(-1)?.id;
    queueMicrotask(() => {
      const record = state.history.at(-1);
      if (!record || record.id === previousId || !toast.textContent) return;
      showCompletion();
    });
  }, true);

  function showCompletion() {
    toast.classList.add('motion-completed');
    if (!canAnimate()) return;
    const toastBox = toast.getBoundingClientRect();
    if (!toastBox.width) return;
    const cluster = document.createElement('div');
    cluster.className = 'motion-sparks';
    cluster.setAttribute('aria-hidden','true');
    cluster.style.left = (toastBox.left + 24) + 'px';
    cluster.style.top = (toastBox.top + toastBox.height / 2) + 'px';
    document.body.append(cluster);
    const colors = ['#ff7843','#aa8cfb','#ffc1a1','#f3bd72'];
    for (let i = 0; i < 9; i++) {
      const particle = document.createElement('i');
      const angle = i / 9 * Math.PI * 2;
      const reach = 25 + (i % 3) * 7;
      particle.style.background = colors[i % colors.length];
      cluster.append(particle);
      particle.animate([
        {opacity:0, transform:'translate(0,0) scale(.25)'},
        {opacity:1, offset:.18},
        {opacity:0, transform:`translate(${Math.cos(angle)*reach}px,${Math.sin(angle)*reach}px) rotate(${i*37}deg) scale(.6)`}
      ], {duration:490+(i%3)*55,easing:'cubic-bezier(.12,.65,.27,1)',fill:'both'});
    }
    setTimeout(() => cluster.remove(), 670);
  }
  // toast() replaces the text node before every new message.
  new MutationObserver(() => {
    if (!toast.textContent.startsWith('Tâche terminée')) toast.classList.remove('motion-completed');
  }).observe(toast,{childList:true});

  // When a workflow swaps sheets inside the same native dialog, crossfade its body
  // without replacing focus or replaying the animation on each elapsed second.
  let previousHeading = '';
  new MutationObserver(() => {
    const heading = sheet.querySelector('.modal-head h2')?.textContent || '';
    if (canAnimate() && sheet.open && previousHeading && heading && previousHeading !== heading) {
      sheet.querySelector('.sheet-scroll')?.animate([
        {opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}
      ], {duration:205,easing});
    }
    previousHeading = heading;
  }).observe(document.getElementById('modalBody'),{childList:true});
  sheet.addEventListener('close',() => { previousHeading = ''; });
  prefersStill.addEventListener('change', () => {
    if (prefersStill.matches) {
      viewAnimations.forEach(animation => animation.cancel());
      document.querySelectorAll('.motion-sparks').forEach(node => node.remove());
    }
  });
})();

// A small parallax shift gives the focus sculpture depth without moving the controls.
(() => {
  const allowed = matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
  let card, pending, x, y;
  function reset() {
    cancelAnimationFrame(pending);
    pending = 0;
    card?.style.removeProperty('--sculpt-x');
    card?.style.removeProperty('--sculpt-y');
    card?.style.removeProperty('--sculpt-angle');
    card = null;
  }
  function update() {
    pending = 0;
    if (!card?.isConnected) return;
    const rect = card.getBoundingClientRect();
    const rx = (x - rect.left) / rect.width - .5;
    const ry = (y - rect.top) / rect.height - .5;
    card.style.setProperty('--sculpt-x', (rx * 14).toFixed(1) + 'px');
    card.style.setProperty('--sculpt-y', (ry * 9).toFixed(1) + 'px');
    card.style.setProperty('--sculpt-angle', (rx * 9).toFixed(2) + 'deg');
  }
  document.addEventListener('pointermove', event => {
    if (!allowed.matches || event.pointerType !== 'mouse') return;
    const target = event.target.closest('.focus-card');
    if (!target) { if (card) reset(); return; }
    card = target; x = event.clientX; y = event.clientY;
    if (!pending) pending = requestAnimationFrame(update);
  }, {passive:true});
  allowed.addEventListener('change',reset);
  window.addEventListener('blur',reset);
})();
