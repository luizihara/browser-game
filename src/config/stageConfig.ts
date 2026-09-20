export type StageId = 'verdant' | 'inferno' | 'glacial';

export interface StageVisualConfig {
  groundBaseColor: number;
  groundTileA: number;
  groundTileB: number;
  sunColor: number;
  sunIntensity: number;
  skyColor: number;
  groundLightColor: number;
  hemisphereIntensity: number;
  wallColor: number;
  pillarColor: number;
  ambientWeather: 'none' | 'embers' | 'snow';
}

export interface StageModifiers {
  enemyHpMult: number;
  enemySpeedMult: number;
  enemyDamageMult: number;
  xpMult: number;
  goldMult: number;
}

export interface StageConfig {
  id: StageId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  badge: string;
  unlockTime: number; // minimum survive seconds on previous stage to unlock
  prevStageId: StageId | null;
  visual: StageVisualConfig;
  modifiers: StageModifiers;
  ambientTheme: 'nature' | 'magma' | 'frost';
  destructibleType: 'pot' | 'barrel' | 'crystal';
}

export const STAGE_CONFIG: Record<StageId, StageConfig> = {
  verdant: {
    id: 'verdant',
    name: 'Verdant Citadel',
    subtitle: 'RUÍNAS ANCESTRAIS DA CLAREIRA',
    description: 'Campos verdejantes pontilhados por ruínas sagradas de mármore e flores silvestres.',
    icon: '🌿',
    badge: 'ESTÁGIO 1',
    unlockTime: 0,
    prevStageId: null,
    visual: {
      groundBaseColor: 0x4d7c0f, // Rich moss green
      groundTileA: 0x65a30d, // Sunlit meadow
      groundTileB: 0x365314, // Deep forest green
      sunColor: 0xffedd5, // Warm daytime sunlight
      sunIntensity: 1.1,
      skyColor: 0x93c5fd, // Soft azure sky
      groundLightColor: 0x3f6212, // Warm grass bounce
      hemisphereIntensity: 0.85,
      wallColor: 0x475569, // Ancient grey stone
      pillarColor: 0x334155, // Weathered slate
      ambientWeather: 'none',
    },
    modifiers: {
      enemyHpMult: 1.0,
      enemySpeedMult: 1.0,
      enemyDamageMult: 1.0,
      xpMult: 1.0,
      goldMult: 1.0,
    },
    ambientTheme: 'nature',
    destructibleType: 'pot',
  },
  inferno: {
    id: 'inferno',
    name: 'Infernal Caldera',
    subtitle: 'FOSSO VULCÂNICO DE BASALTO & MAGMA',
    description: 'Terreno negro vulcânico permeado por veios de magma brilhante, espirais pontiagudas e chuva de brasas incandescentes.',
    icon: '🌋',
    badge: 'ESTÁGIO 2',
    unlockTime: 180, // 3 minutes on Verdant Citadel
    prevStageId: 'verdant',
    visual: {
      groundBaseColor: 0x1c1917, // Obsidian charcoal
      groundTileA: 0x292524, // Volcanic basalt
      groundTileB: 0x7c2d12, // Smoldering ember crust
      sunColor: 0xf97316, // Fiery volcanic sunlight
      sunIntensity: 1.25,
      skyColor: 0x450a0a, // Blood red volcanic sky
      groundLightColor: 0xea580c, // Lava ground bounce
      hemisphereIntensity: 0.95,
      wallColor: 0x27272a, // Basalt block walls
      pillarColor: 0xc2410c, // Magma veined pillars
      ambientWeather: 'embers',
    },
    modifiers: {
      enemyHpMult: 1.1,
      enemySpeedMult: 1.2, // +20% enemy movement speed
      enemyDamageMult: 1.15,
      xpMult: 1.1,
      goldMult: 1.3, // +30% gold reward
    },
    ambientTheme: 'magma',
    destructibleType: 'barrel',
  },
  glacial: {
    id: 'glacial',
    name: 'Glacial Crypts',
    subtitle: 'CRIPTAS ANCESTRAIS DO GELO ETERNO',
    description: 'Cavernas congeladas de permafrost com monólitos de gelo translúcido e nevasca constante.',
    icon: '❄️',
    badge: 'ESTÁGIO 3',
    unlockTime: 180, // 3 minutes on Infernal Caldera
    prevStageId: 'inferno',
    visual: {
      groundBaseColor: 0x0c4a6e, // Deep glacier ice
      groundTileA: 0x0284c7, // Crystalline blue
      groundTileB: 0xe0f2fe, // Powder snow crust
      sunColor: 0xbae6fd, // Crisp arctic blue daylight
      sunIntensity: 1.2,
      skyColor: 0x1e293b, // Twilight night sky
      groundLightColor: 0x38bdf8, // Cyan ice glow
      hemisphereIntensity: 0.9,
      wallColor: 0x0369a1, // Frozen ice block walls
      pillarColor: 0x7dd3fc, // Glacial spire top
      ambientWeather: 'snow',
    },
    modifiers: {
      enemyHpMult: 1.3, // +30% enemy HP
      enemySpeedMult: 1.05,
      enemyDamageMult: 1.1,
      xpMult: 1.25, // +25% XP multiplier
      goldMult: 1.2,
    },
    ambientTheme: 'frost',
    destructibleType: 'crystal',
  },
};
