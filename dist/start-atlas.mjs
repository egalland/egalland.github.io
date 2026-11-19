async function hasPreparedMap() {
  try {
    const response = await fetch('/assets/map-3.json');
    if (!response.ok) return false;
    const data = await response.json();
    return Array.isArray(data.places) && data.width > 0 && data.height > 0;
  } catch {
    return false;
  }
}

if (await hasPreparedMap()) {
  await import('./app.js?v=5');
} else {
  window.location.replace('./panoramas.html');
}
