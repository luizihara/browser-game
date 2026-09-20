export type GemTier = 'green' | 'blue' | 'gold';

export interface GemVisualConfig {
  xp: number;
  size: number;
  color: number;
  emissive: number;
  emissiveIntensity: number;
}

export const GEM_TIER_CONFIG: Record<GemTier, GemVisualConfig> = {
  green: {
    xp: 5,
    size: 0.25,
    color: 0x38a169,
    emissive: 0x48bb78,
    emissiveIntensity: 0.8,
  },
  blue: {
    xp: 25,
    size: 0.35,
    color: 0x2563eb,
    emissive: 0x60a5fa,
    emissiveIntensity: 1.0,
  },
  gold: {
    xp: 100,
    size: 0.52,
    color: 0xd97706,
    emissive: 0xfacc15,
    emissiveIntensity: 1.3,
  },
};

export const EXPERIENCE_CONFIG = {
  baseXpToLevel: 15,
  xpGrowthFactor: 1.25,
  defaultGemXp: 5,
  basePickupRange: 3.5, // units
  magnetSpeed: 14.0, // units/sec when flying towards player
  gemSize: 0.25,
  gemColor: 0x38a169,
  gemEmissive: 0x48bb78,
  gemEmissiveIntensity: 0.8,
  rotationSpeed: 2.0,
  bobFrequency: 3.0,
  bobAmplitude: 0.1,
  tiers: GEM_TIER_CONFIG,
} as const;
