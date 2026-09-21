export interface TormentConfig {
  rank: number;
  name: string;
  badge: string;
  description: string;
  enemyHpMult: number;
  enemySpeedMult: number;
  enemyDamageMult: number;
  goldMult: number;
  xpMult: number;
}

export const TORMENT_CONFIG: Record<number, TormentConfig> = {
  0: {
    rank: 0,
    name: 'Normal',
    badge: '🌿 Normal',
    description: 'Dificuldade padrão da Guilda sem modificadores adicionais.',
    enemyHpMult: 1.0,
    enemySpeedMult: 1.0,
    enemyDamageMult: 1.0,
    goldMult: 1.0,
    xpMult: 1.0,
  },
  1: {
    rank: 1,
    name: 'Tormento I',
    badge: '💀 Tormento I',
    description: 'Inimigos +20% HP, +15% Dano. Recompensas: +25% Ouro, +20% XP.',
    enemyHpMult: 1.2,
    enemySpeedMult: 1.05,
    enemyDamageMult: 1.15,
    goldMult: 1.25,
    xpMult: 1.2,
  },
  2: {
    rank: 2,
    name: 'Tormento II',
    badge: '🔥 Tormento II',
    description: 'Inimigos +40% HP, +30% Dano, +10% Vel. Recompensas: +50% Ouro, +40% XP.',
    enemyHpMult: 1.4,
    enemySpeedMult: 1.1,
    enemyDamageMult: 1.3,
    goldMult: 1.5,
    xpMult: 1.4,
  },
  3: {
    rank: 3,
    name: 'Tormento III',
    badge: '⚡ Tormento III',
    description: 'Inimigos +65% HP, +45% Dano, +15% Vel. Recompensas: +80% Ouro, +65% XP.',
    enemyHpMult: 1.65,
    enemySpeedMult: 1.15,
    enemyDamageMult: 1.45,
    goldMult: 1.8,
    xpMult: 1.65,
  },
  4: {
    rank: 4,
    name: 'Tormento IV',
    badge: '🩸 Tormento IV',
    description: 'Inimigos +90% HP, +60% Dano, +20% Vel. Recompensas: +110% Ouro, +90% XP.',
    enemyHpMult: 1.9,
    enemySpeedMult: 1.2,
    enemyDamageMult: 1.6,
    goldMult: 2.1,
    xpMult: 1.9,
  },
  5: {
    rank: 5,
    name: 'Tormento V',
    badge: '👑 Tormento V (Extremo)',
    description: 'Hordas implacáveis: +120% HP, +80% Dano, +25% Vel. Recompensas: +150% Ouro, +120% XP!',
    enemyHpMult: 2.2,
    enemySpeedMult: 1.25,
    enemyDamageMult: 1.8,
    goldMult: 2.5,
    xpMult: 2.2,
  },
};

export const MAX_TORMENT_RANK = 5;
