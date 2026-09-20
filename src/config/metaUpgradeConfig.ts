export type MetaUpgradeId =
  | 'might'
  | 'vitality'
  | 'armor'
  | 'swiftness'
  | 'haste'
  | 'magnetism'
  | 'growth'
  | 'greed';

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  icon: string;
  description: string;
  maxRank: number;
  baseCost: number;
  costMultiplier: number;
  bonusPerRank: number;
  formatValue: (rank: number) => string;
}

export const META_UPGRADES: Record<MetaUpgradeId, MetaUpgradeDef> = {
  might: {
    id: 'might',
    name: 'Might',
    icon: '⚔️',
    description: 'Increases all weapon damage.',
    maxRank: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    bonusPerRank: 0.05,
    formatValue: (rank) => `+${rank * 5}% Damage`,
  },
  vitality: {
    id: 'vitality',
    name: 'Vitality',
    icon: '❤️',
    description: 'Increases maximum Health Points.',
    maxRank: 5,
    baseCost: 40,
    costMultiplier: 1.5,
    bonusPerRank: 15,
    formatValue: (rank) => `+${rank * 15} Max HP`,
  },
  armor: {
    id: 'armor',
    name: 'Armor',
    icon: '🛡️',
    description: 'Reduces damage taken from all enemy attacks.',
    maxRank: 3,
    baseCost: 100,
    costMultiplier: 2.0,
    bonusPerRank: 1,
    formatValue: (rank) => `-${rank} Damage Taken`,
  },
  swiftness: {
    id: 'swiftness',
    name: 'Swiftness',
    icon: '👟',
    description: 'Increases hero movement speed.',
    maxRank: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    bonusPerRank: 0.04,
    formatValue: (rank) => `+${rank * 4}% Move Speed`,
  },
  haste: {
    id: 'haste',
    name: 'Arcane Haste',
    icon: '⚡',
    description: 'Reduces weapon attack cooldowns.',
    maxRank: 5,
    baseCost: 60,
    costMultiplier: 1.5,
    bonusPerRank: 0.04,
    formatValue: (rank) => `-${rank * 4}% Cooldown`,
  },
  magnetism: {
    id: 'magnetism',
    name: 'Magnetism',
    icon: '🧲',
    description: 'Expands item and XP gem attraction radius.',
    maxRank: 5,
    baseCost: 40,
    costMultiplier: 1.5,
    bonusPerRank: 0.15,
    formatValue: (rank) => `+${rank * 15}% Pickup Radius`,
  },
  growth: {
    id: 'growth',
    name: 'Wisdom',
    icon: '📜',
    description: 'Increases experience gained from all gems.',
    maxRank: 5,
    baseCost: 75,
    costMultiplier: 1.6,
    bonusPerRank: 0.1,
    formatValue: (rank) => `+${rank * 10}% XP Gain`,
  },
  greed: {
    id: 'greed',
    name: 'Greed',
    icon: '🪙',
    description: 'Increases gold coins earned at end of runs and chests.',
    maxRank: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    bonusPerRank: 0.1,
    formatValue: (rank) => `+${rank * 10}% Gold Earned`,
  },
};

export function getUpgradeCost(def: MetaUpgradeDef, currentRank: number): number {
  if (currentRank >= def.maxRank) return Infinity;
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentRank));
}
