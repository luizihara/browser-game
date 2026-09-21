import type { EnemyType } from './enemyConfig';
import type { BossId } from './bossConfig';

export interface WaveEvent {
  id: string;
  triggerTime: number; // runTime in seconds
  title: string;
  subtitle: string;
  isElite?: boolean;
  spawnType: 'ring' | 'pack' | 'elite' | 'boss';
  enemyType: EnemyType;
  count: number;
  bossId?: BossId;
}

export interface PhaseProbability {
  endTime: number; // up to which second this phase applies
  weights: Partial<Record<EnemyType, number>>;
}

export const DIRECTOR_CONFIG = {
  // Scaling factors based on elapsed run time
  scaling: {
    hpGrowthPerMinute: 0.25, // +25% enemy HP per minute
    damageGrowthPerMinute: 0.15, // +15% enemy damage per minute
    speedGrowthMax: 0.35, // max +35% enemy speed
    speedGrowthPerMinute: 0.08, // +8% enemy speed per minute
    spawnIntervalFloor: 0.25, // minimum spawn interval in seconds
  },

  // Dynamic spawn probabilities across game phases
  phaseProbabilities: [
    {
      endTime: 35, // 0 - 35s
      weights: { basic: 0.9, fast: 0.1 },
    },
    {
      endTime: 75, // 35 - 75s
      weights: { basic: 0.5, fast: 0.3, ranged: 0.15, volatile: 0.05 },
    },
    {
      endTime: 130, // 75 - 130s
      weights: { basic: 0.3, fast: 0.25, tank: 0.15, ranged: 0.15, shaman: 0.1, volatile: 0.05 },
    },
    {
      endTime: 210, // 130 - 210s
      weights: { basic: 0.2, fast: 0.2, tank: 0.18, ranged: 0.15, shaman: 0.12, volatile: 0.1, elite: 0.05 },
    },
    {
      endTime: Infinity, // 210s+
      weights: { basic: 0.15, fast: 0.2, tank: 0.2, ranged: 0.15, shaman: 0.12, volatile: 0.11, elite: 0.07 },
    },
  ] as PhaseProbability[],

  // Scripted wave events and milestones
  scheduledEvents: [
    {
      id: 'swarm_1',
      triggerTime: 40,
      title: '⚠️ SWARM SURGE!',
      subtitle: 'Fast skitterers incoming!',
      isElite: false,
      spawnType: 'pack',
      enemyType: 'fast',
      count: 10,
    },
    {
      id: 'horde_1',
      triggerTime: 75,
      title: '⚠️ HORDE APPROACHING!',
      subtitle: 'Enemies converging on your position',
      isElite: false,
      spawnType: 'ring',
      enemyType: 'basic',
      count: 14,
    },
    {
      id: 'elite_1',
      triggerTime: 110,
      title: '💀 ELITE DETECTED!',
      subtitle: 'Goliath approaches with massive vitality',
      isElite: true,
      spawnType: 'elite',
      enemyType: 'elite',
      count: 1,
    },
    {
      id: 'boss_gorgonath',
      triggerTime: 150,
      title: '🌋 GORGONATH AWAKENS!',
      subtitle: 'The Earthbreaker rises from the molten depths!',
      isElite: true,
      spawnType: 'boss',
      enemyType: 'elite',
      bossId: 'gorgonath',
      count: 1,
    },
    {
      id: 'siege_1',
      triggerTime: 180,
      title: '⚠️ RING OF DOOM!',
      subtitle: 'Brutes and skitterers surrounding you',
      isElite: false,
      spawnType: 'ring',
      enemyType: 'fast',
      count: 18,
    },
    {
      id: 'elite_2',
      triggerTime: 220,
      title: '💀 TWIN TITANS!',
      subtitle: 'Multiple Elites advancing',
      isElite: true,
      spawnType: 'elite',
      enemyType: 'elite',
      count: 2,
    },
    {
      id: 'boss_malakor',
      triggerTime: 260,
      title: '💀 MALAKOR DESCENDS!',
      subtitle: 'The Shadow Overlord arrives with netherflame!',
      isElite: true,
      spawnType: 'boss',
      enemyType: 'elite',
      bossId: 'malakor',
      count: 1,
    },
  ] as WaveEvent[],

  // Run Victory Condition
  victoryTime: 300, // 5 minutes to clear stage and claim victory

  // Periodic recurring horde after all scheduled events pass
  recurringEventInterval: 60, // every 60s past last scheduled event
} as const;
