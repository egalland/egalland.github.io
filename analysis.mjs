export function analyzeEvents(events, factoryCount = 2) {
  if (!Array.isArray(events)) throw new TypeError('events doit être une liste.');
  if (!Number.isInteger(factoryCount) || factoryCount < 1) throw new RangeError('Nombre d’usines invalide.');
  const grouped = new Map();
  for (const event of events) {
    const time = Date.parse(event.at);
    if (typeof event.name !== 'string' || !event.name || !Number.isFinite(time)) {
      throw new Error('Chaque événement doit avoir un nom et un horodatage ISO.');
    }
    if (!grouped.has(event.name)) grouped.set(event.name, []);
    grouped.get(event.name).push({ ...event, time });
  }
  return [...grouped.entries()].map(([name, rows]) => {
    rows.sort((a, b) => a.time - b.time);
    const start = rows.find(event => event.action === 'join')?.time;
    const end = rows.at(-1).time;
    const observed = start === undefined ? rows : rows.filter(event => event.time >= start);
    const paused = new Set();
    let previous = start ?? observed[0].time;
    let pausedMs = 0, sales = 0, revenue = 0, unvaluedSales = 0, blocks = 0, resumptions = 0;
    for (const event of observed) {
      if (paused.size >= factoryCount) pausedMs += event.time - previous;
      previous = event.time;
      if (event.action === 'factory/pause') {
        const target = event.order?.target;
        if (typeof target !== 'string' && !Number.isFinite(target)) throw new Error('Usine absente pour une action factory/pause.');
        if (paused.has(target)) paused.delete(target);
        else paused.add(target);
      }
      if (event.action === 'townSell/') {
        sales++;
        if (Number.isFinite(event.before?.credits) && Number.isFinite(event.after?.credits)) {
          revenue += event.after.credits - event.before.credits;
        } else unvaluedSales++;
      }
      if (event.category === 'blocked') blocks++;
      if (event.action === 'reprise') resumptions++;
    }
    return { name, events: observed.length, sales, revenue, unvaluedSales, blocks, resumptions,
      pausePct: start !== undefined && end > start ? Math.round(10000 * pausedMs / (end - start)) / 100 : null };
  });
}
