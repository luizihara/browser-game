export const WEAPON_CONFIG = {
  wand: {
    name: 'Magic Wand',
    damage: 20,
    cooldown: 1.2, // seconds between attacks
    range: 15.0, // target search radius
    projectileSpeed: 16.0,
    projectileRadius: 0.25,
    projectileLifetime: 1.5, // seconds before despawning
    color: 0x38b2ac,
    emissiveColor: 0x4fd1c5,
    emissiveIntensity: 0.8,
  },
} as const;
