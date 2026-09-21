export type WeaponId = 'wand' | 'orbital' | 'aura' | 'dagger' | 'hammer' | 'flask';

export interface WeaponLevelConfig {
  level: number;
  description: string;
  damage: number;
  cooldown: number;
  count?: number;
  radius?: number;
  speed?: number;
  range?: number;
  hitCooldown?: number;
}

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  icon: string;
  maxLevel: number;
  levels: readonly WeaponLevelConfig[];
}

export const WEAPON_CONFIG = {
  maxEquippedWeapons: 4,

  wand: {
    id: 'wand' as WeaponId,
    name: 'Magic Wand',
    icon: '🪄',
    maxLevel: 5,
    damage: 20,
    cooldown: 1.1,
    range: 15.0,
    projectileSpeed: 16.0,
    projectileRadius: 0.25,
    projectileLifetime: 1.5,
    color: 0x38b2ac,
    emissiveColor: 0x4fd1c5,
    emissiveIntensity: 0.9,
    levels: [
      {
        level: 1,
        description: 'Fires magical bolts at the nearest enemy.',
        damage: 20,
        cooldown: 1.1,
        count: 1,
        speed: 16.0,
        range: 15.0,
      },
      {
        level: 2,
        description: 'Fires +1 additional bolt in quick burst.',
        damage: 20,
        cooldown: 1.1,
        count: 2,
        speed: 16.0,
        range: 15.0,
      },
      {
        level: 3,
        description: 'Increases damage and reduces cooldown.',
        damage: 26,
        cooldown: 0.9,
        count: 2,
        speed: 17.5,
        range: 16.0,
      },
      {
        level: 4,
        description: 'Fires +1 additional bolt (3 total).',
        damage: 26,
        cooldown: 0.9,
        count: 3,
        speed: 17.5,
        range: 16.0,
      },
      {
        level: 5,
        description: 'Significantly increases damage, speed, and firing rate.',
        damage: 36,
        cooldown: 0.72,
        count: 3,
        speed: 19.0,
        range: 18.0,
      },
    ],
  },

  orbital: {
    id: 'orbital' as WeaponId,
    name: 'Guardian Orbs',
    icon: '🔮',
    maxLevel: 5,
    color: 0xd946ef,
    emissiveColor: 0xf43f5e,
    emissiveIntensity: 1.2,
    orbRadius: 0.35,
    levels: [
      {
        level: 1,
        description: '1 energy orb orbits you, shredding enemies on contact.',
        damage: 16,
        cooldown: 0,
        count: 1,
        radius: 2.2,
        speed: 2.6,
        hitCooldown: 0.5,
      },
      {
        level: 2,
        description: 'Adds a 2nd orbiting orb (180° apart).',
        damage: 20,
        cooldown: 0,
        count: 2,
        radius: 2.3,
        speed: 3.0,
        hitCooldown: 0.45,
      },
      {
        level: 3,
        description: 'Increases orb speed, damage, and orbit radius.',
        damage: 26,
        cooldown: 0,
        count: 2,
        radius: 2.5,
        speed: 3.6,
        hitCooldown: 0.4,
      },
      {
        level: 4,
        description: 'Adds a 3rd orbiting orb (120° apart).',
        damage: 30,
        cooldown: 0,
        count: 3,
        radius: 2.5,
        speed: 3.8,
        hitCooldown: 0.35,
      },
      {
        level: 5,
        description: 'Adds a 4th orbiting orb with maximum rotation speed.',
        damage: 40,
        cooldown: 0,
        count: 4,
        radius: 2.7,
        speed: 4.4,
        hitCooldown: 0.3,
      },
    ],
  },

  aura: {
    id: 'aura' as WeaponId,
    name: 'Radiant Aura',
    icon: '☀️',
    maxLevel: 5,
    color: 0xfacc15,
    emissiveColor: 0xf59e0b,
    emissiveIntensity: 1.3,
    levels: [
      {
        level: 1,
        description: 'Emits a periodic radial wave damaging all nearby enemies.',
        damage: 18,
        cooldown: 2.8,
        radius: 5.0,
      },
      {
        level: 2,
        description: 'Reduces cooldown and expands damage radius.',
        damage: 24,
        cooldown: 2.4,
        radius: 5.6,
      },
      {
        level: 3,
        description: 'Increases damage and wave shockwave reach.',
        damage: 32,
        cooldown: 2.1,
        radius: 6.4,
      },
      {
        level: 4,
        description: 'Faster pulses with devastating area impact.',
        damage: 42,
        cooldown: 1.8,
        radius: 7.2,
      },
      {
        level: 5,
        description: 'Blinding solar nova with massive radius and maximum power.',
        damage: 56,
        cooldown: 1.5,
        radius: 8.2,
      },
    ],
  },

  dagger: {
    id: 'dagger' as WeaponId,
    name: 'Dagger Throw',
    icon: '🗡️',
    maxLevel: 5,
    color: 0x38bdf8,
    emissiveColor: 0x0284c7,
    emissiveIntensity: 1.0,
    projectileRadius: 0.18,
    projectileLifetime: 1.2,
    levels: [
      {
        level: 1,
        description: 'Fires 2 sharp blades in your movement direction.',
        damage: 18,
        cooldown: 1.2,
        count: 2,
        speed: 18.0,
      },
      {
        level: 2,
        description: 'Fires +1 blade (3 total) with increased speed.',
        damage: 22,
        cooldown: 1.1,
        count: 3,
        speed: 19.5,
      },
      {
        level: 3,
        description: 'Increases blade damage and reduces attack cooldown.',
        damage: 28,
        cooldown: 0.95,
        count: 3,
        speed: 21.0,
      },
      {
        level: 4,
        description: 'Fires +1 blade (4 total) with faster recovery.',
        damage: 34,
        cooldown: 0.85,
        count: 4,
        speed: 22.5,
      },
      {
        level: 5,
        description: 'Fires 5 deadly blades in a lethal wide arc.',
        damage: 46,
        cooldown: 0.7,
        count: 5,
        speed: 24.0,
      },
    ],
  },

  hammer: {
    id: 'hammer' as WeaponId,
    name: 'Thunder Hammer',
    icon: '⚡',
    maxLevel: 5,
    color: 0x38bdf8,
    emissiveColor: 0xfacc15,
    emissiveIntensity: 1.4,
    range: 14.0,
    levels: [
      {
        level: 1,
        description: 'Calls down lightning striking the nearest foe and chaining to 2 adjacent enemies.',
        damage: 35,
        cooldown: 1.8,
        count: 3,
        range: 14.0,
      },
      {
        level: 2,
        description: 'Increases chain jumps to 4 targets and increases lightning damage.',
        damage: 45,
        cooldown: 1.8,
        count: 4,
        range: 14.0,
      },
      {
        level: 3,
        description: 'Reduces lightning cooldown and intensifies electric voltage.',
        damage: 55,
        cooldown: 1.45,
        count: 4,
        range: 15.0,
      },
      {
        level: 4,
        description: 'Chains to 5 targets with wider search radius and shocks enemies.',
        damage: 70,
        cooldown: 1.35,
        count: 5,
        range: 16.0,
      },
      {
        level: 5,
        description: 'Dual thunderbolts strike down simultaneously, chaining up to 8 targets.',
        damage: 90,
        cooldown: 1.15,
        count: 8,
        range: 18.0,
      },
    ],
  },

  flask: {
    id: 'flask' as WeaponId,
    name: 'Alchemist Flask',
    icon: '🧪',
    maxLevel: 5,
    color: 0x10b981,
    emissiveColor: 0x34d399,
    emissiveIntensity: 1.1,
    range: 13.0,
    levels: [
      {
        level: 1,
        description: 'Lobs a toxic chemical flask creating a lingering pool that inflicts Burn DoT.',
        damage: 20,
        cooldown: 2.2,
        count: 1,
        radius: 2.2,
      },
      {
        level: 2,
        description: 'Expands acid puddle radius and increases caustic Burn damage.',
        damage: 28,
        cooldown: 2.0,
        count: 1,
        radius: 2.7,
      },
      {
        level: 3,
        description: 'Reduces lob cooldown and increases chemical burn intensity.',
        damage: 38,
        cooldown: 1.7,
        count: 1,
        radius: 2.9,
      },
      {
        level: 4,
        description: 'Lobs 2 volatile flasks simultaneously in wide spread.',
        damage: 48,
        cooldown: 1.6,
        count: 2,
        radius: 3.2,
      },
      {
        level: 5,
        description: 'Lobs 3 flasks creating devastating cascading toxic hazard zones.',
        damage: 62,
        cooldown: 1.35,
        count: 3,
        radius: 3.6,
      },
    ],
  },
} as const;
