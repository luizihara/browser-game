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
    const pRadius = this.target.radius;
    const len = enemies.length;

    // 1. Move enemies toward the target and orient them correctly
    for (let i = 0; i < len; i++) {
      const enemy = enemies[i]!;
      if (enemy.isDead) continue;

      const dx = targetX - enemy.position.x;
      const dz = targetZ - enemy.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq > 0.0001) {
        const invDist = 1 / Math.sqrt(distSq);
        const dirX = dx * invDist;
        const dirZ = dz * invDist;

        enemy.position.x += dirX * enemy.speed * deltaTime;
        enemy.position.z += dirZ * enemy.speed * deltaTime;

        // Model forward is -Z, so face toward movement vector (dirX, -dirZ)
        enemy.getMesh().rotation.y = Math.atan2(dirX, -dirZ);
      }

      // Hard circle separation against the Player: two bodies cannot occupy the same space
      const toPlayerX = enemy.position.x - targetX;
      const toPlayerZ = enemy.position.z - targetZ;
      const distSqHero = toPlayerX * toPlayerX + toPlayerZ * toPlayerZ;
      const minHeroDist = pRadius + enemy.radius;

      if (distSqHero < minHeroDist * minHeroDist) {
        const curDist = Math.sqrt(distSqHero);
        if (curDist > 0.0001) {
          const pushRatio = (minHeroDist - curDist) / curDist;
          enemy.position.x += toPlayerX * pushRatio;
          enemy.position.z += toPlayerZ * pushRatio;
        } else {
          // Exactly on top of player: push outwards
          enemy.position.x = targetX + minHeroDist;
        }
      }
    }

    // 2. Enemy vs Enemy Circle-Circle separation (Zero-GC crowd relaxation)
    for (let i = 0; i < len; i++) {
      const a = enemies[i]!;
      if (a.isDead) continue;

      const ax = a.position.x;
      const az = a.position.z;
      const ar = a.radius;

      for (let j = i + 1; j < len; j++) {
        const b = enemies[j]!;
        if (b.isDead) continue;

        const minD = ar + b.radius;
        const edx = ax - b.position.x;
        const edz = az - b.position.z;
        const eDistSq = edx * edx + edz * edz;

        if (eDistSq < minD * minD && eDistSq > 0.00001) {
          const eDist = Math.sqrt(eDistSq);
          const overlap = (minD - eDist) * 0.5;
          const invEDist = 1 / eDist;
          const nx = edx * invEDist;
          const nz = edz * invEDist;

          a.position.x += nx * overlap;
          a.position.z += nz * overlap;
          b.position.x -= nx * overlap;
          b.position.z -= nz * overlap;
        }
      }
    }

    // 3. Re-verify Player collision and Arena boundaries after crowd relaxation
    for (let i = 0; i < len; i++) {
      const enemy = enemies[i]!;
      if (enemy.isDead) continue;

      const toPlayerX = enemy.position.x - targetX;
      const toPlayerZ = enemy.position.z - targetZ;
      const distSqHero = toPlayerX * toPlayerX + toPlayerZ * toPlayerZ;
      const minHeroDist = pRadius + enemy.radius;

      if (distSqHero < minHeroDist * minHeroDist) {
        const curDist = Math.sqrt(distSqHero);
        if (curDist > 0.0001) {
          const pushRatio = (minHeroDist - curDist) / curDist;
          enemy.position.x += toPlayerX * pushRatio;
          enemy.position.z += toPlayerZ * pushRatio;
        }
      }

      if (this.bounds) {
        this.bounds.clampPosition(enemy.position, enemy.radius);
      }
    }
  }
}
