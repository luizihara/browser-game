import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import type { ArenaBounds } from '../world/ArenaBounds';
import { Enemy, type EnemyStatMultipliers } from '../entities/enemy/Enemy';
import { ENEMY_CONFIG, type EnemyType } from '../config/enemyConfig';
import type { DirectorSystem } from './DirectorSystem';
import type { Disposable } from '../types';

export class EnemySpawner implements Disposable {
  private entityManager: EntityManager;
  private target: Player | null = null;
  private bounds: ArenaBounds | null = null;
  private enemies: Enemy[] = [];
  private spawnTimer: number = 0;

  constructor(
    entityManager: EntityManager,
    target: Player | null,
    bounds?: ArenaBounds | null
  ) {
    this.entityManager = entityManager;
    this.target = target;
    this.bounds = bounds ?? null;
  }

  public setTarget(target: Player | null): void {
    this.target = target;
  }

  public setBounds(bounds: ArenaBounds | null): void {
    this.bounds = bounds;
  }

  public update(deltaTime: number, directorOrRunTime: DirectorSystem | number): void {
    if (!this.target) return;
    if (this.enemies.length >= ENEMY_CONFIG.spawner.maxActiveEnemies) return;

    let interval: number;
    let type: EnemyType = 'basic';
    let multipliers: EnemyStatMultipliers | undefined = undefined;

    if (typeof directorOrRunTime === 'number') {
      const runTime = directorOrRunTime;
      const progress = Math.min(
        1.0,
        runTime / ENEMY_CONFIG.spawner.difficultyRampDuration
      );
      interval =
        ENEMY_CONFIG.spawner.initialInterval -
        progress *
          (ENEMY_CONFIG.spawner.initialInterval -
            ENEMY_CONFIG.spawner.minInterval);
    } else {
      interval = directorOrRunTime.getSpawnInterval();
      type = directorOrRunTime.getRandomEnemyType();
      multipliers = directorOrRunTime.getMultipliers();
    }

    this.spawnTimer += deltaTime;
    while (this.spawnTimer >= interval) {
      this.spawnTimer -= interval;
      this.spawnEnemy(type, multipliers);
    }
  }

  public spawnEnemy(
    type: EnemyType = 'basic',
    multipliers?: EnemyStatMultipliers,
    customX?: number,
    customZ?: number
  ): Enemy | null {
    if (!this.target) return null;
    if (this.enemies.length >= ENEMY_CONFIG.spawner.maxActiveEnemies) return null;

    let spawnX: number;
    let spawnZ: number;

    if (customX !== undefined && customZ !== undefined) {
      spawnX = customX;
      spawnZ = customZ;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const distanceRange =
        ENEMY_CONFIG.spawner.spawnRadiusMax - ENEMY_CONFIG.spawner.spawnRadiusMin;
      const distance =
        ENEMY_CONFIG.spawner.spawnRadiusMin + Math.random() * distanceRange;

      spawnX = this.target.position.x + Math.cos(angle) * distance;
      spawnZ = this.target.position.z + Math.sin(angle) * distance;
    }

    const enemy = new Enemy(spawnX, spawnZ, type, multipliers);

    if (this.bounds) {
      this.bounds.clampPosition(enemy.position, enemy.radius);
    }

    this.enemies.push(enemy);
    this.entityManager.add(enemy);

    return enemy;
  }

  public spawnSingle(): Enemy | null {
    return this.spawnEnemy('basic');
  }

  public spawnRingSurge(
    type: EnemyType,
    count: number,
    multipliers?: EnemyStatMultipliers,
    radius: number = 20
  ): void {
    if (!this.target) return;
    const px = this.target.position.x;
    const pz = this.target.position.z;
    const angleStep = (Math.PI * 2) / count;
    const offset = Math.random() * Math.PI;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= ENEMY_CONFIG.spawner.maxActiveEnemies) break;
      const angle = offset + i * angleStep;
      const sx = px + Math.cos(angle) * radius;
      const sz = pz + Math.sin(angle) * radius;
      this.spawnEnemy(type, multipliers, sx, sz);
    }
  }

  public spawnPack(
    type: EnemyType,
    count: number,
    multipliers?: EnemyStatMultipliers
  ): void {
    if (!this.target) return;
    const px = this.target.position.x;
    const pz = this.target.position.z;
    const baseAngle = Math.random() * Math.PI * 2;
    const baseDist = 20;

    for (let i = 0; i < count; i++) {
      if (this.enemies.length >= ENEMY_CONFIG.spawner.maxActiveEnemies) break;
      const angle = baseAngle + (Math.random() - 0.5) * 0.5;
      const dist = baseDist + (Math.random() - 0.5) * 4;
      const sx = px + Math.cos(angle) * dist;
      const sz = pz + Math.sin(angle) * dist;
      this.spawnEnemy(type, multipliers, sx, sz);
    }
  }

  public spawnElite(count: number = 1, multipliers?: EnemyStatMultipliers): void {
    if (!this.target) return;
    for (let i = 0; i < count; i++) {
      this.spawnEnemy('elite', multipliers);
    }
  }

  public spawnBatch(count: number = ENEMY_CONFIG.spawner.batchSpawnCount): void {
    for (let i = 0; i < count; i++) {
      this.spawnSingle();
    }
    console.info(
      `[EnemySpawner] Spawned batch of ${count} enemies. Total: ${this.enemies.length}`
    );
  }

  public removeEnemy(enemy: Enemy): void {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      const last = this.enemies.pop()!;
      if (idx < this.enemies.length) {
        this.enemies[idx] = last;
      }
      this.entityManager.remove(enemy);
    }
  }

  public getEnemies(): readonly Enemy[] {
    return this.enemies;
  }

  public getEnemyCount(): number {
    return this.enemies.length;
  }

  public clear(): void {
    for (let i = 0; i < this.enemies.length; i++) {
      this.entityManager.remove(this.enemies[i]);
    }
    this.enemies.length = 0;
    this.spawnTimer = 0;
  }

  public dispose(): void {
    this.clear();
  }
}
