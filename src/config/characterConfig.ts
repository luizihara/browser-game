import type { WeaponId } from './weaponConfig';

export type CharacterId = 'knight' | 'mage' | 'rogue' | 'templar';

export interface CharacterStatModifiers {
  maxHpOffset: number;
  armorOffset: number;
  speedMultiplier: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  pickupRangeMultiplier: number;
  projectileSpeedMultiplier: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  avatar: string;
  startingWeapon: WeaponId;
  description: string;
  passiveName: string;
  passiveDesc: string;
  statModifiers: CharacterStatModifiers;
  unlockCondition: {
    type: 'free' | 'gold';
    cost?: number;
    description: string;
  };
}

export const CHARACTER_CONFIG: Record<CharacterId, CharacterDef> = {
  knight: {
    id: 'knight',
    name: 'Sir Roderick',
    title: 'The Iron Knight',
    avatar: '🛡️',
    startingWeapon: 'aura',
    description: 'A resilient bastion in heavy steel armor who crushes close foes with sacred radiant light.',
    passiveName: 'Fortress of Valor',
    passiveDesc: '+30 Max HP, +2 Armor, -8% Move Speed',
    statModifiers: {
      maxHpOffset: 30,
      armorOffset: 2,
      speedMultiplier: 0.92,
      damageMultiplier: 1.0,
      cooldownMultiplier: 1.0,
      pickupRangeMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
    },
    unlockCondition: {
      type: 'free',
      description: 'Available from the start',
    },
  },
  mage: {
    id: 'mage',
    name: 'Elara',
    title: 'The Arcane Mage',
    avatar: '🪄',
    startingWeapon: 'wand',
    description: 'A mystical scholar wielding destructive magical bolts with superior velocity.',
    passiveName: 'Arcane Mastery',
    passiveDesc: '+20% Damage, +20% Shot Speed, -15 Max HP',
    statModifiers: {
      maxHpOffset: -15,
      armorOffset: 0,
      speedMultiplier: 1.0,
      damageMultiplier: 1.2,
      cooldownMultiplier: 1.0,
      pickupRangeMultiplier: 1.0,
      projectileSpeedMultiplier: 1.2,
    },
    unlockCondition: {
      type: 'free',
      description: 'Available from the start',
    },
  },
  rogue: {
    id: 'rogue',
    name: 'Kage',
    title: 'The Shadow Rogue',
    avatar: '🗡️',
    startingWeapon: 'dagger',
    description: 'A silent nocturnal stalker flinging piercing daggers with blinding quickness.',
    passiveName: 'Shadowstep',
    passiveDesc: '+20% Move Speed, +15% Haste, -10 Max HP',
    statModifiers: {
      maxHpOffset: -10,
      armorOffset: 0,
      speedMultiplier: 1.2,
      damageMultiplier: 1.0,
      cooldownMultiplier: 0.85,
      pickupRangeMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
    },
    unlockCondition: {
      type: 'gold',
      cost: 200,
      description: 'Unlock for 🪙 200 Gold',
    },
  },
  templar: {
    id: 'templar',
    name: 'Aurelius',
    title: 'The Sun Templar',
    avatar: '☀️',
    startingWeapon: 'orbital',
    description: 'A holy champion protected by celestial orbiting sun orbs and cosmic magnetism.',
    passiveName: 'Solar Resonance',
    passiveDesc: '+25% Magnetism, +10 Max HP, +10% Damage',
    statModifiers: {
      maxHpOffset: 10,
      armorOffset: 0,
      speedMultiplier: 1.0,
      damageMultiplier: 1.1,
      cooldownMultiplier: 1.0,
      pickupRangeMultiplier: 1.25,
      projectileSpeedMultiplier: 1.0,
    },
    unlockCondition: {
      type: 'gold',
      cost: 400,
      description: 'Unlock for 🪙 400 Gold',
    },
  },
};
