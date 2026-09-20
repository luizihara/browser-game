import type { EnemyType } from './enemyConfig';

export interface WaveEvent {
  id: string;
  triggerTime: number; // runTime in seconds
  title: string;
  subtitle: string;
  isElite?: boolean;
  spawnType: 'ring' | 'pack' | 'elite';
  enemyType: EnemyType;
  count: number;
}

export interface PhaseProbability {
  endTime: number; // up to which second this phase applies
  weights: Record<EnemyType, number>;
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
      weights: { basic: 1.0, fast: 0.0, tank: 0.0, elite: 0.0 },
    },
    {
      endTime: 75, // 35 - 75s
      weights: { basic: 0.7, fast: 0.3, tank: 0.0, elite: 0.0 },
    },
    {
      endTime: 130, // 75 - 130s
      weights: { basic: 0.5, fast: 0.35, tank: 0.15, elite: 0.0 },
    },
    {
      endTime: 210, // 130 - 210s
      weights: { basic: 0.35, fast: 0.4, tank: 0.2, elite: 0.05 },
    },
    {
      endTime: Infinity, // 210s+
      weights: { basic: 0.25, fast: 0.4, tank: 0.28, elite: 0.07 },
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
      id: 'siege_1',
      triggerTime: 160,
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
  ] as WaveEvent[],

  // Periodic recurring horde after all scheduled events pass
  recurringEventInterval: 60, // every 60s past last scheduled event
} as const;
