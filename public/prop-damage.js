// Shared gameplay units. These profiles cover street furniture with solid collision bodies.
const profiles = Object.freeze({
  crate:   { material: 'wood', maxHealth: 24 },
  bin:     { material: 'metal', maxHealth: 42 },
  bench:   { material: 'wood', maxHealth: 72 },
  postbox: { material: 'metal', maxHealth: 82 },
  bollard: { material: 'iron', maxHealth: 112 },
  lamp:    { material: 'metal', maxHealth: 140 },
  tree:    { material: 'bark', maxHealth: 156 },
  hydrant: { material: 'iron', maxHealth: 170 }
});

export const propMaxHealth = type => Object.hasOwn(profiles, type) ? profiles[type].maxHealth : 0;
export const propMaterial = type => Object.hasOwn(profiles, type) ? profiles[type].material : null;

export function applyPropDamage(type, previousHealth, rawDamage) {
  const maxHealth = propMaxHealth(type);
  if (!maxHealth || !Number.isFinite(rawDamage) || rawDamage <= 0) return null;
  const before = Number.isFinite(previousHealth)
    ? Math.min(maxHealth, Math.max(0, Math.round(previousHealth))) : maxHealth;
  const damage = Math.min(before, 150, Math.round(rawDamage));
  return { health: before - damage, maxHealth, damage };
}

// The collision normal discards speed parallel to a wall. A resting bumper cannot chip away a prop.
export function vehiclePropDamage(normalSpeed, halfLength) {
  if (!Number.isFinite(normalSpeed) || !Number.isFinite(halfLength) || normalSpeed < 2.5) return 0;
  const scale = Math.max(.45, Math.min(1.7, halfLength / 2.1));
  return Math.min(150, Math.round((normalSpeed - 1.5) ** 1.55 * 1.9 * scale));
}
