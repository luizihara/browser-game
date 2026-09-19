import type { Enemy } from '../entities/enemy/Enemy';
import type { Player } from '../entities/player/Player';
import type { ArenaBounds } from '../world/ArenaBounds';

export class EnemyMovementSystem {
  private target: Player | null = null;
  private bounds: ArenaBounds | null = null;

  constructor(target: Player | null, bounds?: ArenaBounds | null) {
    this.target = target;
    this.bounds = bounds ?? null;
  }

  public setTarget(target: Player | null): void {
    this.target = target;
  }

  public setBounds(bounds: ArenaBounds | null): void {
    this.bounds = bounds;
  }

  public update(enemies: readonly Enemy[], deltaTime: number): void {
    if (!this.target) return;

    const targetX = this.target.position.x;
    const targetZ = this.target.position.z;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDead) continue;

      const dx = targetX - enemy.position.x;
      const dz = targetZ - enemy.position.z;
      const distSq = dx * dx + dz * dz;

      // Avoid jitter when directly on top of the player
      if (distSq > 0.001) {
        const invDist = 1 / Math.sqrt(distSq);
        const dirX = dx * invDist;
        const dirZ = dz * invDist;

        enemy.position.x += dirX * enemy.speed * deltaTime;
        enemy.position.z += dirZ * enemy.speed * deltaTime;

        // Rotate to face movement/target direction
        enemy.getMesh().rotation.y = Math.atan2(dirX, dirZ);
      }

      if (this.bounds) {
        this.bounds.clampPosition(enemy.position, enemy.radius);
      }
    }
  }
}
