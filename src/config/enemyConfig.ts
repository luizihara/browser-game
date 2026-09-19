export const ENEMY_CONFIG = {
  basic: {
    speed: 3.5,
    maxHp: 20,
    damage: 10,
    radius: 0.45,
    height: 1.2,
    color: 0x9b2c2c,
    accentColor: 0xff4e50,
    roughness: 0.4,
    metalness: 0.2,
  },
  spawner: {
    initialInterval: 2.0,
    minInterval: 0.35,
    spawnRadiusMin: 18,
    spawnRadiusMax: 24,
    batchSpawnCount: 5,
    maxActiveEnemies: 200,
    difficultyRampDuration: 120, // seconds to ramp difficulty to maximum
  },
} as const;
