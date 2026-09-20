import {
  DIRECTOR_CONFIG,
  type WaveEvent,
} from '../config/directorConfig';
import { ENEMY_CONFIG, type EnemyType } from '../config/enemyConfig';
import type { BossId } from '../config/bossConfig';
import type { EnemyStatMultipliers } from '../entities/enemy/Enemy';
import type { EnemySpawner } from './EnemySpawner';

export class DirectorSystem {
  private runTime: number = 0;
  private triggeredEventIds: Set<string> = new Set();
  private nextRecurringTime: number = 0;
  private lastScheduledTime: number = 0;

  constructor() {
    this.initTimeline();
  }

  private initTimeline(): void {
    let maxTime = 0;
    for (let i = 0; i < DIRECTOR_CONFIG.scheduledEvents.length; i++) {
      if (DIRECTOR_CONFIG.scheduledEvents[i].triggerTime > maxTime) {
        maxTime = DIRECTOR_CONFIG.scheduledEvents[i].triggerTime;
      }
    }
    this.lastScheduledTime = maxTime;
    this.nextRecurringTime = maxTime + DIRECTOR_CONFIG.recurringEventInterval;
  }

  public getMultipliers(): EnemyStatMultipliers {
    const minutes = this.runTime / 60;
    const hp = 1.0 + minutes * DIRECTOR_CONFIG.scaling.hpGrowthPerMinute;
    const damage = 1.0 + minutes * DIRECTOR_CONFIG.scaling.damageGrowthPerMinute;
    const speed =
      1.0 +
      Math.min(
        DIRECTOR_CONFIG.scaling.speedGrowthMax,
        minutes * DIRECTOR_CONFIG.scaling.speedGrowthPerMinute
      );
    return { hp, damage, speed };
  }

  public getRandomEnemyType(): EnemyType {
    const phases = DIRECTOR_CONFIG.phaseProbabilities;
    let chosenPhase = phases[phases.length - 1];

    for (let i = 0; i < phases.length; i++) {
      if (this.runTime <= phases[i].endTime) {
        chosenPhase = phases[i];
        break;
      }
    }

    const r = Math.random();
    let accum = 0;

    // Ordered check for deterministic cumulative distribution
    const types: EnemyType[] = ['basic', 'fast', 'tank', 'elite'];
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      const weight = chosenPhase.weights[type] ?? 0;
      accum += weight;
      if (r <= accum) {
        return type;
      }
    }

    return 'basic';
  }

  public getSpawnInterval(): number {
    const progress = Math.min(
      1.0,
      this.runTime / ENEMY_CONFIG.spawner.difficultyRampDuration
    );
    const interval =
      ENEMY_CONFIG.spawner.initialInterval -
      progress *
        (ENEMY_CONFIG.spawner.initialInterval -
          DIRECTOR_CONFIG.scaling.spawnIntervalFloor);
    return Math.max(DIRECTOR_CONFIG.scaling.spawnIntervalFloor, interval);
  }

  public update(
    deltaTime: number,
    spawner: EnemySpawner,
    onWaveAlert?: (event: WaveEvent) => void,
    onBossSpawn?: (bossId: BossId) => void
  ): void {
    this.runTime += deltaTime;
    const multipliers = this.getMultipliers();

    // Check scheduled wave events
    const events = DIRECTOR_CONFIG.scheduledEvents;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (this.runTime >= ev.triggerTime && !this.triggeredEventIds.has(ev.id)) {
        this.triggeredEventIds.add(ev.id);
        if (ev.bossId && onBossSpawn) {
          onBossSpawn(ev.bossId);
        } else {
          this.executeEvent(ev, spawner, multipliers);
        }
        if (onWaveAlert) {
          onWaveAlert(ev);
        }
      }
    }

    // Check recurring events after last scheduled event
    if (this.runTime >= this.nextRecurringTime) {
      this.nextRecurringTime += DIRECTOR_CONFIG.recurringEventInterval;
      const recurringEvent: WaveEvent = {
        id: `recurring_${Math.floor(this.runTime)}`,
        triggerTime: this.runTime,
        title: '⚠️ MASSIVE SURGE!',
        subtitle: 'A deadly swarm converges from all sides!',
        isElite: Math.random() < 0.35,
        spawnType: 'ring',
        enemyType: Math.random() < 0.5 ? 'fast' : 'basic',
        count: 16 + Math.min(14, Math.floor((this.runTime - this.lastScheduledTime) / 30) * 2),
      };

      this.executeEvent(recurringEvent, spawner, multipliers);
      if (recurringEvent.isElite) {
        spawner.spawnElite(1, multipliers);
      }
      if (onWaveAlert) {
        onWaveAlert(recurringEvent);
      }
    }
  }

  private executeEvent(
    ev: WaveEvent,
    spawner: EnemySpawner,
    multipliers: EnemyStatMultipliers
  ): void {
    switch (ev.spawnType) {
      case 'ring':
        spawner.spawnRingSurge(ev.enemyType, ev.count, multipliers);
        break;
      case 'pack':
        spawner.spawnPack(ev.enemyType, ev.count, multipliers);
        break;
      case 'elite':
        spawner.spawnElite(ev.count, multipliers);
        break;
      case 'boss':
        // Handled via onBossSpawn callback
        break;
    }
  }

  public getRunTime(): number {
    return this.runTime;
  }

  public reset(): void {
    this.runTime = 0;
    this.triggeredEventIds.clear();
    this.initTimeline();
  }
}
