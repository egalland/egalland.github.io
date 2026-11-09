// The browser draws the actual tip. Only the registration marks trail behind it.
export function startEditorPointer({signal, reduced}) {
  const canUseMouse = matchMedia('(any-pointer: fine) and (forced-colors: none)');
  const marks = document.createElement('div');
  marks.className = 'editor-pointer-marks';
  marks.setAttribute('aria-hidden', 'true');
  marks.hidden = true;
  if (!reduced) document.body.append(marks);

  let hit = null, position = null, followX = 0, followY = 0, frame = 0, checkHit = false;
  const listen = (target, event, handler, options = {}) =>
    target.addEventListener(event, handler, {...options, signal});
  const actions = 'a[href], button, summary, [role="button"], [role="tab"]';
  const text = 'p, h1, h2, h3, h4, h5, h6, span, strong, em, small, li, label, pre, code, blockquote';

  function updateHit(element) {
    if (element === hit) return;
    hit?.removeAttribute('data-editor-hit');
    hit = element;
    const native = !hit || hit.closest('input, textarea, select, :disabled, [aria-disabled="true"]') || hit.isContentEditable;
    const action = !native && hit.closest(actions);
    const kind = native ? null : action ? 'action' : hit.closest(text) ? null : 'draw';
    if (kind) hit.setAttribute('data-editor-hit', kind);
    const show = !reduced && kind && !hit.closest('[popover], dialog');
    if (show && marks.hidden) {
      followX = position.x;
      followY = position.y;
      marks.style.transform = `translate3d(${followX}px, ${followY}px, 0)`;
    }
    marks.hidden = !show;
    if (show) marks.dataset.kind = kind;
  }

  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    checkHit = false;
    marks.hidden = true;
    marks.removeAttribute('data-pressed');
    hit?.removeAttribute('data-editor-hit');
    hit = position = null;
  }

  function paint() {
    frame = 0;
    if (!position) return;
    if (checkHit) {
      checkHit = false;
      updateHit(document.elementFromPoint(position.x, position.y));
    }
    if (marks.hidden) return;
    const dx = followX - position.x, dy = followY - position.y;
    const distance = Math.hypot(dx, dy);
    const lag = distance < .35 ? 0 : Math.min(.55, 6 / distance);
    followX = position.x + dx * lag;
    followY = position.y + dy * lag;
    marks.style.transform = `translate3d(${followX}px, ${followY}px, 0)`;
    if (lag) frame = requestAnimationFrame(paint);
  }

  function queue() {
    if (!frame) frame = requestAnimationFrame(paint);
  }

  function track(event) {
    const selecting = event.type === 'pointermove' && (event.buttons & 1) && window.getSelection()?.isCollapsed === false;
    if (event.pointerType !== 'mouse' || !canUseMouse.matches || selecting) {
      reset();
      return;
    }
    position = {x: event.clientX, y: event.clientY};
    updateHit(event.target);
    if (event.type === 'pointerdown' && event.button === 0) marks.dataset.pressed = '';
    if (!event.buttons) marks.removeAttribute('data-pressed');
    if (!marks.hidden) queue();
  }

  function refresh() {
    if (!position) return;
    checkHit = true;
    queue();
  }

  for (const type of ['pointerover', 'pointermove', 'pointerdown', 'pointerup']) {
    listen(document, type, track, {passive: true, capture: true});
  }
  listen(document, 'pointerout', event => { if (!event.relatedTarget) reset(); });
  listen(document, 'pointercancel', reset);
  listen(document, 'dragstart', reset);
  listen(document, 'keydown', reset);
  listen(document, 'visibilitychange', () => { if (document.hidden) reset(); });
  listen(window, 'blur', reset);
  listen(window, 'scroll', refresh, {passive: true, capture: true});
  listen(document, 'toggle', refresh, {capture: true});
  listen(canUseMouse, 'change', reset);
  signal.addEventListener('abort', () => { reset(); marks.remove(); }, {once: true});
}
