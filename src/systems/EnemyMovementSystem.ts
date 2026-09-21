import type { Enemy } from '../entities/enemy/Enemy';
import type { Player } from '../entities/player/Player';
import type { ArenaBounds } from '../world/ArenaBounds';

export class EnemyMovementSystem {
  private target: Player | null = null;
  private bounds: ArenaBounds | null = null;

  // Zero-GC Spatial Partitioning Grid for O(N) crowd relaxation
  private readonly gridCellSize = 3.0; // 3m cells
  private readonly gridDim = 20; // 20x20 = 400 cells covering 60m x 60m arena (-30 to +30)
  private readonly halfArena = 30.0;
  private cellHeads: Int32Array = new Int32Array(400);
  private nextEnemy: Int32Array = new Int32Array(600);

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
    if (len === 0) return;

    // Ensure next pointer buffer is large enough
    if (len > this.nextEnemy.length) {
      this.nextEnemy = new Int32Array(Math.max(len * 2, 600));
    }

    // 1. Move enemies toward the target and orient them correctly
    for (let i = 0; i < len; i++) {
      const enemy = enemies[i]!;
      if (enemy.isDead || enemy.freezeTimer > 0) continue;

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

    // 2. Spatial Grid Insertion: O(N) population of spatial hash table
    this.cellHeads.fill(-1);
    const cellSize = this.gridCellSize;
    const gridDim = this.gridDim;
    const halfA = this.halfArena;

    for (let i = 0; i < len; i++) {
      const e = enemies[i]!;
      if (e.isDead) continue;

      let cx = Math.floor((e.position.x + halfA) / cellSize);
      let cz = Math.floor((e.position.z + halfA) / cellSize);
      if (cx < 0) cx = 0;
      else if (cx >= gridDim) cx = gridDim - 1;
      if (cz < 0) cz = 0;
      else if (cz >= gridDim) cz = gridDim - 1;

      const cellIdx = cz * gridDim + cx;
      this.nextEnemy[i] = this.cellHeads[cellIdx];
      this.cellHeads[cellIdx] = i;
    }

    // 3. Enemy vs Enemy Circle-Circle separation via O(N) Spatial Neighbor checks
    for (let i = 0; i < len; i++) {
      const a = enemies[i]!;
      if (a.isDead) continue;

      const ax = a.position.x;
      const az = a.position.z;
      const ar = a.radius;

      let cx = Math.floor((ax + halfA) / cellSize);
      let cz = Math.floor((az + halfA) / cellSize);
      if (cx < 0) cx = 0;
      else if (cx >= gridDim) cx = gridDim - 1;
      if (cz < 0) cz = 0;
      else if (cz >= gridDim) cz = gridDim - 1;

      const minX = cx > 0 ? cx - 1 : 0;
      const maxX = cx < gridDim - 1 ? cx + 1 : gridDim - 1;
      const minZ = cz > 0 ? cz - 1 : 0;
      const maxZ = cz < gridDim - 1 ? cz + 1 : gridDim - 1;

      for (let nz = minZ; nz <= maxZ; nz++) {
        const rowOffset = nz * gridDim;
        for (let nx = minX; nx <= maxX; nx++) {
          let j = this.cellHeads[rowOffset + nx];
          while (j !== -1) {
            if (j > i) {
              const b = enemies[j]!;
              if (!b.isDead) {
                const minD = ar + b.radius;
                const edx = ax - b.position.x;
                const edz = az - b.position.z;
                const eDistSq = edx * edx + edz * edz;

                if (eDistSq < minD * minD && eDistSq > 0.00001) {
                  const eDist = Math.sqrt(eDistSq);
                  const overlap = (minD - eDist) * 0.5;
                  const invEDist = 1 / eDist;
                  const pushX = edx * invEDist * overlap;
                  const pushZ = edz * invEDist * overlap;

                  a.position.x += pushX;
                  a.position.z += pushZ;
                  b.position.x -= pushX;
                  b.position.z -= pushZ;
                }
              }
            }
            j = this.nextEnemy[j];
          }
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
