export interface FxEffectConfig {
  count: number;
  minLifetime: number;
  maxLifetime: number;
  minSpeed: number;
  maxSpeed: number;
  size: number;
  color: number;
  colors: readonly number[];
  gravity: number;
  drag: number;
}

export const FX_CONFIG = {
  maxParticles: 600,
  hitFlash: {
    duration: 0.08,
    color: 0xffffff,
  },
  hitSparks: {
    count: 8,
    minLifetime: 0.15,
    maxLifetime: 0.35,
    minSpeed: 3.0,
    maxSpeed: 8.0,
    size: 0.22,
    color: 0xffe066,
    colors: [0xffffff, 0xffe066, 0xffa94d, 0xffd43b] as const,
    gravity: -10.0,
    drag: 0.92,
  },
  deathExplosion: {
    count: 24,
    minLifetime: 0.3,
    maxLifetime: 0.6,
    minSpeed: 4.0,
    maxSpeed: 10.0,
    size: 0.32,
    color: 0xff4d4f,
    colors: [0xff4d4f, 0xff7a45, 0xffa94d, 0xffec3d, 0xffffff] as const,
    gravity: -12.0,
    drag: 0.90,
  },
  levelUpBurst: {
    count: 60,
    minLifetime: 0.5,
    maxLifetime: 0.8,
    minSpeed: 4.0,
    maxSpeed: 8.0,
    size: 0.36,
    color: 0x52c41a,
    colors: [0x52c41a, 0x73d13d, 0xffec3d, 0x40a9ff, 0xffffff] as const,
    gravity: -3.0,
    drag: 0.94,
  },
} as const;
