import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import type { ArenaBounds } from '../world/ArenaBounds';
import { Enemy } from '../entities/enemy/Enemy';
import { ENEMY_CONFIG } from '../config/enemyConfig';
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

  public update(deltaTime: number, runTime: number): void {
    if (!this.target) return;
    if (this.enemies.length >= ENEMY_CONFIG.spawner.maxActiveEnemies) return;

    // Calculate dynamic interval based on difficulty ramp
    const progress = Math.min(
      1.0,
      runTime / ENEMY_CONFIG.spawner.difficultyRampDuration
    );
    const currentInterval =
      ENEMY_CONFIG.spawner.initialInterval -
      progress *
        (ENEMY_CONFIG.spawner.initialInterval - ENEMY_CONFIG.spawner.minInterval);

    this.spawnTimer += deltaTime;
    while (this.spawnTimer >= currentInterval) {
      this.spawnTimer -= currentInterval;
      this.spawnSingle();
    }
  }

  public spawnSingle(): Enemy | null {
    if (!this.target) return null;

    const angle = Math.random() * Math.PI * 2;
    const distanceRange =
      ENEMY_CONFIG.spawner.spawnRadiusMax - ENEMY_CONFIG.spawner.spawnRadiusMin;
    const distance =
      ENEMY_CONFIG.spawner.spawnRadiusMin + Math.random() * distanceRange;

    let spawnX = this.target.position.x + Math.cos(angle) * distance;
    let spawnZ = this.target.position.z + Math.sin(angle) * distance;

    const enemy = new Enemy(spawnX, spawnZ);

    // Keep spawned enemy inside the arena boundaries
    if (this.bounds) {
      this.bounds.clampPosition(enemy.position, enemy.radius);
    }

    this.enemies.push(enemy);
    this.entityManager.add(enemy);

    return enemy;
  }

  public spawnBatch(count: number = ENEMY_CONFIG.spawner.batchSpawnCount): void {
    for (let i = 0; i < count; i++) {
      this.spawnSingle();
    }
    console.info(`[EnemySpawner] Spawned batch of ${count} enemies. Total: ${this.enemies.length}`);
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
