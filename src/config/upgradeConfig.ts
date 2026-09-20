import type { WeaponId } from './weaponConfig';

export const UPGRADE_CONFIG = {
  might: {
    id: 'might',
    name: 'Might',
    description: 'Increases all weapon damage by +25%.',
    icon: '⚔️',
    multiplier: 1.25,
  },
  swiftness: {
    id: 'swiftness',
    name: 'Swiftness',
    description: 'Increases player movement speed by +15%.',
    icon: '👟',
    multiplier: 1.15,
  },
  haste: {
    id: 'haste',
    name: 'Haste',
    description: 'Reduces all weapon attack cooldowns by -15%.',
    icon: '⚡',
    multiplier: 0.85,
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    description: 'Increases max HP by +25 and heals for 25 HP.',
    icon: '❤️',
    bonusHp: 25,
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet',
    description: 'Increases XP gem collection range by +35%.',
    icon: '🧲',
    multiplier: 1.35,
  },
  aerodynamics: {
    id: 'aerodynamics',
    name: 'Aerodynamics',
    description: 'Increases projectile and orbital speed by +25%.',
    icon: '🏹',
    multiplier: 1.25,
  },
} as const;

export type PassiveUpgradeId = keyof typeof UPGRADE_CONFIG;
export type UpgradeId = string;
export type UpgradeCategory = 'new_weapon' | 'weapon_upgrade' | 'passive' | 'evolution';

export interface UpgradeDefinition {
  readonly id: UpgradeId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: UpgradeCategory;
  readonly categoryLabel: string;
  readonly weaponId?: WeaponId;
}
