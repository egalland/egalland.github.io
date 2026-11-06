// A displacement is S·sin(angle) + C·(cos(angle) − 1). With two vectors we
// can describe a wave, a rigid orbit, or a hinged page in the same GPU buffer.
export function wave(point, direction, speed, phase = 0) {
  const sine = direction.map(value => value * Math.cos(phase));
  const cosine = direction.map(value => value * Math.sin(phase));
  point.motion = [...sine, speed, ...cosine, 0];
}

// axis is a unit vector. A sweep gives the hinge a return stroke (radians).
export function orbit(point, center, axis, speed, sweep = 0) {
  const x = point.x - center[0], y = point.y - center[1], z = point.z - center[2];
  const [ax, ay, az] = axis, along = x * ax + y * ay + z * az;
  point.motion = [
    ay * z - az * y, az * x - ax * z, ax * y - ay * x, speed,
    x - ax * along, y - ay * along, z - az * along, sweep
  ];
  // Moving dots on a rigid hand or page must stay attached to that part.
  delete point.track;
}

export function addMotion(out, data, offset, time, blend = 1) {
  const speed = data[offset + 3];
  if (!speed || !time) return;
  const sweep = data[offset + 7], phase = time * speed;
  const angle = sweep ? sweep * (1 - Math.cos(phase)) / 2 : phase;
  const sine = Math.sin(angle) * blend, cosine = (Math.cos(angle) - 1) * blend;
  for (let i = 0; i < 3; i++) out[i] += data[offset + i] * sine + data[offset + 4 + i] * cosine;
}

// Start the gathering gesture when enough of the model is on screen to see it.
// Remember the first entrance so scrolling back doesn't dismantle the model.
export function arrivalScatter(slot, time, fraction, reduced) {
  if (reduced) return 0;
  if (slot.enteredAt === undefined) {
    if (fraction < 0.18) return 1;
    slot.enteredAt = time;
  }
  const left = Math.max(0, 1 - (time - slot.enteredAt) / 1.35);
  return left * left * (3 - 2 * left);
}
