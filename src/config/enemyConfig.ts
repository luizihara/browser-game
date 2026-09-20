export type EnemyType = 'basic' | 'fast' | 'tank' | 'elite';

export interface EnemyArchetypeConfig {
  name: string;
  speed: number;
  maxHp: number;
  damage: number;
  radius: number;
  height: number;
  color: number;
  accentColor: number;
  roughness: number;
  metalness: number;
  xpReward: number;
  gemTier: 'green' | 'blue' | 'gold';
}

export const ENEMY_CONFIG = {
  basic: {
    name: 'Stalker',
    speed: 3.5,
    maxHp: 20,
    damage: 10,
    radius: 0.45,
    height: 1.2,
    color: 0x9b2c2c, // Menacing dark red
    accentColor: 0xff4e50, // Crimson glow
    roughness: 0.4,
    metalness: 0.2,
    xpReward: 5,
    gemTier: 'green' as const,
  },
  fast: {
    name: 'Skitterer',
    speed: 5.2,
    maxHp: 10,
    damage: 6,
    radius: 0.32,
    height: 0.8,
    color: 0xd97706, // Amber orange
    accentColor: 0xfef08a, // Neon yellow eyes
    roughness: 0.3,
    metalness: 0.3,
    xpReward: 5,
    gemTier: 'green' as const,
  },
  tank: {
    name: 'Brute',
    speed: 2.1,
    maxHp: 75,
    damage: 22,
    radius: 0.7,
    height: 1.6,
    color: 0x4c1d95, // Deep violet purple
    accentColor: 0xa855f7, // Vivid purple eyes
    roughness: 0.5,
    metalness: 0.4,
    xpReward: 25,
    gemTier: 'blue' as const,
  },
  elite: {
    name: 'Goliath',
    speed: 2.6,
    maxHp: 250,
    damage: 30,
    radius: 0.95,
    height: 2.2,
    color: 0x881337, // Royal ruby red
    accentColor: 0xfacc15, // Golden halo and eyes
    roughness: 0.2,
    metalness: 0.6,
    xpReward: 100,
    gemTier: 'gold' as const,
  },
  spawner: {
    initialInterval: 2.0,
    minInterval: 0.35,
    spawnRadiusMin: 18,
    spawnRadiusMax: 24,
    batchSpawnCount: 5,
    maxActiveEnemies: 250,
    difficultyRampDuration: 180, // seconds to ramp difficulty to maximum
  },
} as const;
