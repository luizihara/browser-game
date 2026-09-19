import type { EntityManager } from '../entities/EntityManager';
import type { ArenaBounds } from '../world/ArenaBounds';
import { SandboxDummy } from '../entities/sandbox/SandboxDummy';
import { SANDBOX_CONFIG } from '../config/sandboxConfig';
import { WORLD_CONFIG } from '../config/worldConfig';
import type { Disposable } from '../types';

export class SandboxSpawner implements Disposable {
  private entityManager: EntityManager;
  private dummies: SandboxDummy[] = [];

  constructor(entityManager: EntityManager, _bounds?: ArenaBounds) {
    this.entityManager = entityManager;
  }

  public spawnBatch(count: number = SANDBOX_CONFIG.batchSpawnCount): void {
    const halfW = WORLD_CONFIG.arenaWidth / 2 - 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2 - 2;

    for (let i = 0; i < count; i++) {
      const randX = (Math.random() * 2 - 1) * halfW;
      const randZ = (Math.random() * 2 - 1) * halfD;

      const dummy = new SandboxDummy(randX, randZ);
      this.dummies.push(dummy);
      this.entityManager.add(dummy);
    }

    console.info(`[SandboxSpawner] Spawned batch of ${count} dummies. Total dummies: ${this.dummies.length}`);
  }

  public clearDummies(): void {
    for (let i = 0; i < this.dummies.length; i++) {
      this.entityManager.remove(this.dummies[i]);
    }
    this.dummies.length = 0;
    console.info('[SandboxSpawner] Cleared all sandbox dummies');
  }

  public getDummyCount(): number {
    return this.dummies.length;
  }

  public dispose(): void {
    this.clearDummies();
  }
}
