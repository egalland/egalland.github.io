const frame = document.querySelector('iframe');
const output = document.querySelector('output');
const send = data => frame.contentWindow.postMessage(data, location.origin);
for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => send({ type: 'bodyos-camera', view: button.dataset.view }));
}
const spin = document.querySelector('#spin');
spin.addEventListener('click', () => {
  const enabled = spin.getAttribute('aria-pressed') !== 'true';
  spin.setAttribute('aria-pressed', String(enabled));
  send({ type: 'bodyos-spin', enabled });
});
window.addEventListener('message', event => {
  if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
  if (event.data?.type === 'bodyos-muscle-click') {
    output.textContent = [event.data.structureName, event.data.side].filter(Boolean).join(' · ');
  } else if (event.data?.type === 'bodyos-anatomy-ready') {
    send({ type: 'bodyos-spin', enabled: spin.getAttribute('aria-pressed') === 'true' });
  }
});
