/* Mobile sheets, quick task entry and a device-local focus clock. */
(() => {
  const sheet = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const originalModal = modal;
  const clockKey = 'elan-focus-v1';
  let clock;
  let visibleClockId = null;
  let viewportFrame = 0;

  function scrollForKeyboard() {
    cancelAnimationFrame(viewportFrame);
    viewportFrame = requestAnimationFrame(() => {
      const viewport = window.visualViewport;
      const height = viewport ? viewport.height : window.innerHeight;
      const gap = viewport ? Math.max(0, window.innerHeight - height - viewport.offsetTop) : 0;
      sheet.style.setProperty('--sheet-viewport', height + 'px');
      sheet.style.setProperty('--keyboard-gap', gap + 'px');
      const field = document.activeElement;
      if (gap > 80 && body.contains(field) && field.matches('input, select, textarea')) {
        field.scrollIntoView({block: 'nearest'});
      }
    });
  }
  window.visualViewport?.addEventListener('resize', scrollForKeyboard);
  window.visualViewport?.addEventListener('scroll', scrollForKeyboard);
  window.addEventListener('resize', scrollForKeyboard);

  modal = function showSheet(title, markup) {
    visibleClockId = null;
    originalModal(title, markup);
    body.querySelector('h2').id = 'sheet-title';
    sheet.setAttribute('aria-labelledby', 'sheet-title');
    body.scrollTop = 0;
    sheet.scrollTop = 0;
    body.querySelectorAll('input[type=number]').forEach(input => {
      input.inputMode = input.step === '0.01' || input.step === '0.5' ? 'decimal' : 'numeric';
    });
    for (const form of body.querySelectorAll('form')) {
      // Reserve a stable action row below the independently scrolling fields.
      if (form === body.lastElementChild && form.id !== 'settingsForm') {
        const button = form.querySelector('button.primary:not([type=button])');
        if (!button) continue;
        const actions = button.closest('.form-actions') || document.createElement('div');
        if (!actions.contains(button)) actions.append(button);
        button.setAttribute('form', form.id);
        actions.classList.add('sheet-actions');
        body.append(actions);
      }
    }
    const scroll = document.createElement('div');
    scroll.className = 'sheet-scroll';
    const header = body.querySelector('.modal-head');
    const footer = body.querySelector(':scope > .sheet-actions');
    for (const child of Array.from(body.children)) {
      if (child !== header && child !== footer) scroll.append(child);
    }
    header.after(scroll);
    scrollForKeyboard();
  };

  function durationChoices(name, selected) {
    return '<div class="duration-options" role="group" aria-label="Durées rapides">' +
      [15, 30, 45, 60].map(value =>
        '<button type="button" data-minutes="' + value + '" data-field="' + name +
        '" aria-pressed="' + (value === selected) + '">' + value + ' min</button>'
      ).join('') + '</div>';
  }

  function syncChoices(form, field) {
    form.querySelectorAll('[data-field="' + field.name + '"]').forEach(button => {
      button.setAttribute('aria-pressed', Number(field.value) === Number(button.dataset.minutes));
    });
  }

  function attachChoices(form, field) {
    form.addEventListener('click', event => {
      const button = event.target.closest('[data-minutes]');
      if (!button || button.dataset.field !== field.name) return;
      field.value = button.dataset.minutes;
      field.dispatchEvent(new Event('input', {bubbles: true}));
    });
    field.addEventListener('input', () => syncChoices(form, field));
  }

  const originalContact = contactModal;
  contactModal = function editContact(id) {
    originalContact(id);
    const form = document.getElementById('contactForm');
    const fields = form.elements;
    const schedule = fields.follow.closest('.row');
    const shortcuts = document.createElement('div');
    shortcuts.className = 'follow-shortcuts';
    shortcuts.setAttribute('role', 'group');
    shortcuts.setAttribute('aria-label', 'Programmer la relance');
    for (const [days, label] of [[0, 'Aujourd’hui'], [1, 'Demain'], [7, 'Dans 7 jours']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.onclick = () => {
        fields.follow.value = addDays(today(), days);
        fields.follow.dispatchEvent(new Event('change', {bubbles:true}));
      };
      button.dataset.days = days;
      shortcuts.append(button);
    }
    const indicateFollow = () => shortcuts.querySelectorAll('button').forEach(button => {
      button.setAttribute('aria-pressed', fields.follow.value === addDays(today(), Number(button.dataset.days)));
    });
    fields.follow.addEventListener('change', indicateFollow);
    indicateFollow();
    schedule.after(shortcuts);
    const optional = document.createElement('details');
    optional.className = 'sheet-details';
    optional.open = Boolean(Number(fields.value.value) || fields.note.value);
    const summary = document.createElement('summary');
    summary.textContent = 'Devis et notes';
    optional.append(summary);
    shortcuts.after(optional);
    optional.append(fields.value.closest('label'), fields.note.closest('label'));
  };

  const originalMoney = money;
  money = function enterTransaction() {
    originalMoney();
    const form = document.getElementById('moneyForm');
    const type = form.elements.type;
    const row = type.closest('.row');
    const choice = document.createElement('div');
    choice.className = 'transaction-choice';
    choice.setAttribute('role', 'group');
    choice.setAttribute('aria-label', 'Type de mouvement');
    for (const option of type.options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.type = option.value;
      button.textContent = option.text;
      button.setAttribute('aria-pressed', option.selected);
      button.onclick = () => {
        type.value = option.value;
        choice.querySelectorAll('button').forEach(item => {
          item.setAttribute('aria-pressed', item.dataset.type === type.value);
        });
      };
      choice.append(button);
    }
    const amount = form.elements.amount.closest('label');
    row.before(choice, amount);
    // Preserve the select so the existing save handler submits the same data.
    row.hidden = true;
  };

  taskModal = function editTask(id, defaults = {}) {
    const existing = state.tasks.find(item => item.id === id);
    const item = existing || task('', 'general', 30, defaults);
    const detailsOpen = item.note || item.priority === 'high';
    modal(existing ? 'Modifier la tâche' : 'Nouvelle tâche', `
      <form id="taskForm" class="quick-form">
        <label>Action<input name="title" required maxlength="180" placeholder="Ex. Relancer trois prospects" value="${esc(item.title)}"></label>
        <label>Piste<select name="cat">${options(cats, item.cat)}</select></label>
        <div class="duration-field">
          <label>Durée estimée
            <span class="unit-input"><input name="min" type="number" min="1" max="10080" required value="${item.min}"><span aria-hidden="true">min</span></span>
          </label>
          ${durationChoices('min', item.min)}
        </div>
        <button type="button" class="estimate-action" id="estimate">Recalculer l’estimation</button>
        <div class="row">
          <label>Échéance<input name="date" type="date" required value="${esc(item.date)}"></label>
          <label>Répétition<select name="repeat">${options(repeatName, item.repeat)}</select></label>
        </div>
        <details class="sheet-details" ${detailsOpen ? 'open' : ''}>
          <summary>Priorité et notes</summary>
          <label>Priorité<select name="priority">${options({normal:'Normale',high:'Prioritaire'},item.priority)}</select></label>
          <label>Notes<textarea name="note" placeholder="Résultat attendu ou détail utile">${esc(item.note)}</textarea></label>
        </details>
        <div class="form-actions">
          ${existing ? '<button type="button" class="danger" id="deleteTask">Supprimer</button>' : ''}
          <button class="primary">${existing ? 'Enregistrer' : 'Ajouter la tâche'}</button>
        </div>
      </form>`);
    const form = document.getElementById('taskForm');
    const fields = form.elements;
    let userSetDuration = Boolean(existing || defaults.min);
    function autoEstimate() {
      if (!fields.title.value.trim()) return;
      fields.min.value = estimate(fields.title.value, fields.cat.value);
      syncChoices(form, fields.min);
    }
    fields.title.addEventListener('input', () => {
      fields.title.setCustomValidity('');
      if (!userSetDuration) autoEstimate();
    });
    fields.cat.addEventListener('change', () => { if (!userSetDuration) autoEstimate(); });
    fields.min.addEventListener('input', () => { userSetDuration = true; });
    attachChoices(form, fields.min);
    document.getElementById('estimate').onclick = () => {
      userSetDuration = false;
      if (!fields.title.value.trim()) { fields.title.focus(); return; }
      autoEstimate();
      toast('Durée estimée à ' + fmt(Number(fields.min.value)));
    };
    form.onsubmit = event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      values.title = values.title.trim();
      if (!values.title) {
        fields.title.setCustomValidity('Indique l’action à réaliser.');
        fields.title.reportValidity();
        return;
      }
      values.min = Number(values.min);
      if (existing) Object.assign(existing, values);
      else state.tasks.push({...item, ...values});
      close();
      render();
      toast(existing ? 'Tâche mise à jour' : 'Tâche ajoutée');
    };
    const remove = document.getElementById('deleteTask');
    if (remove) remove.onclick = () => {
      modal('Supprimer la tâche ?', `<p class="sub">${esc(item.title)}</p>
        <div class="form-actions"><button class="secondary" data-close>Conserver</button>
        <button class="danger" id="confirmTaskDelete">Supprimer</button></div>`);
      document.getElementById('confirmTaskDelete').onclick = () => {
        state.tasks = state.tasks.filter(t => t.id !== item.id);
        if (clock?.id === item.id) writeClock(null);
        close();
        render();
        toast('Tâche supprimée');
      };
    };
  };

  function readClock() {
    try {
      const value = JSON.parse(localStorage.getItem(clockKey));
      if (value && typeof value.id === 'string' && typeof value.running === 'boolean' &&
          Number.isFinite(value.start) && Number.isFinite(value.elapsed) && value.elapsed >= 0) {
        return value;
      }
    } catch { /* A disabled store still allows an in-memory clock. */ }
    return null;
  }
  clock = readClock();

  function elapsed() {
    if (!clock) return 0;
    return clock.elapsed + (clock.running ? Math.max(0, Date.now() - clock.start) : 0);
  }
  function currentClock() {
    if (!clock) return null;
    const item = state.tasks.find(t => t.id === clock.id);
    return item ? {id:item.id, title:item.title, running:clock.running, elapsedMs:elapsed()} : null;
  }
  function writeClock(value) {
    clock = value;
    try {
      if (clock) localStorage.setItem(clockKey, JSON.stringify(clock));
      else localStorage.removeItem(clockKey);
    } catch { toast('Chrono disponible pendant cette visite uniquement.'); }
    document.dispatchEvent(new CustomEvent('elan:chronochange', {detail:currentClock()}));
  }
  function toggleClock() {
    if (!clock) return;
    writeClock({...clock, elapsed:elapsed(), start:Date.now(), running:!clock.running});
    drawClock();
  }
  function clockDisplay(ms) {
    const total = Math.floor(ms / 1000);
    const seconds = String(total % 60).padStart(2, '0');
    const minutes = Math.floor(total / 60);
    if (minutes >= 60) return Math.floor(minutes / 60) + ':' + String(minutes % 60).padStart(2, '0') + ':' + seconds;
    return String(minutes).padStart(2, '0') + ':' + seconds;
  }
  function drawClock() {
    if (!sheet.open || !visibleClockId) return;
    const item = state.tasks.find(t => t.id === visibleClockId);
    const label = document.getElementById('focusTime');
    if (!item || !clock || clock.id !== item.id || !label) return;
    const ms = elapsed();
    label.textContent = clockDisplay(ms);
    const dial = document.getElementById('focusDial');
    dial.style.setProperty('--progress', Math.min(100, ms / (item.min * 60000) * 100) + '%');
    dial.classList.toggle('paused', !clock.running);
    document.getElementById('focusStatus').textContent = clock.running ? 'En cours' : 'En pause';
    document.getElementById('pauseFocus').textContent = clock.running ? 'Pause' : 'Reprendre';
  }
  window.elanChrono = Object.freeze({ current:currentClock, format:clockDisplay });
  window.addEventListener('storage', event => {
    if (event.key !== clockKey && event.key !== null) return;
    clock = readClock();
    if (sheet.open && visibleClockId && visibleClockId !== clock?.id) close();
    drawClock();
    document.dispatchEvent(new CustomEvent('elan:chronochange', {detail:currentClock()}));
  });
  document.addEventListener('visibilitychange', drawClock);
  setInterval(drawClock, 1000);

  focus = function showClock(id) {
    const item = state.tasks.find(t => t.id === id);
    if (!item) return;
    const active = currentClock();
    if (active && active.id !== id) {
      modal('Une session est déjà ouverte', `<p class="sub">${esc(active.title)}</p>
        <div class="form-actions"><button class="secondary" data-close>Fermer</button>
        <button class="primary" data-focus="${esc(active.id)}">Ouvrir son chrono</button></div>`);
      return;
    }
    if (!active) writeClock({id, elapsed:0, start:Date.now(), running:true});
    modal('Chronomètre', `
      <div class="focus-task"><span class="focus-category">${esc(cats[item.cat] || '')}</span><h3>${esc(item.title)}</h3></div>
      <div class="focus-dial" id="focusDial"><div class="focus-dial-face">
        <span aria-live="polite" class="focus-status" id="focusStatus"></span>
        <strong role="timer" aria-label="Temps écoulé" id="focusTime">00:00</strong>
        <span>prévu ${fmt(item.min)}</span>
      </div></div>
      <div class="timer-actions"><button type="button" class="secondary" id="pauseFocus"></button>
        <button type="button" class="primary" id="finishFocus">Terminer la tâche</button></div>
      <p class="hint focus-hint">Tu peux fermer le chrono et le retrouver depuis l’accueil.</p>
    `);
    visibleClockId = id;
    drawClock();
    document.getElementById('pauseFocus').onclick = toggleClock;
    document.getElementById('finishFocus').onclick = () => doneModal(id);
  };

  doneModal = function finishTask(id, actual) {
    const item = state.tasks.find(t => t.id === id);
    if (!item) return;
    const timed = currentClock()?.id === id;
    if (timed && clock.running) toggleClock();
    const minutes = actual || (timed ? Math.max(1, Math.min(10080, Math.round(elapsed() / 60000))) : item.min);
    modal('Terminer la tâche', `
      <p class="sheet-task-name">${esc(item.title)}</p>
      <form id="doneForm" class="quick-form">
        <label>Temps réellement passé
          <span class="unit-input"><input name="actual" type="number" min="1" max="10080" required value="${minutes}"><span aria-hidden="true">min</span></span>
        </label>
        ${durationChoices('actual', minutes)}
        <p class="hint">Durée prévue · ${fmt(item.min)}${item.repeat !== 'none' ?
          '<br>Prochaine échéance · ' + new Date(nextDate(item) + 'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long'}) : ''}</p>
        <button class="primary">Valider la tâche terminée</button>
      </form>`);
    const form = document.getElementById('doneForm');
    attachChoices(form, form.elements.actual);
    form.onsubmit = event => {
      event.preventDefault();
      if (!state.tasks.some(t => t.id === id)) { close(); return; }
      const snapshot = {...item};
      state.history.push({
        id:uid(), taskId:id, title:item.title, cat:item.cat, estimate:item.min,
        actual:Number(form.elements.actual.value), date:today(), snapshot
      });
      if (item.repeat === 'none') state.tasks = state.tasks.filter(t => t.id !== id);
      else item.date = nextDate(item);
      if (clock?.id === id) writeClock(null);
      close();
      render();
      toast(item.repeat === 'none' ? 'Tâche terminée' : 'Tâche terminée · prochaine échéance planifiée');
    };
  };
})();
