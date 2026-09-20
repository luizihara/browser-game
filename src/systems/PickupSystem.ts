import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import { PickupItem, type PickupType } from '../entities/pickup/PickupItem';
import type { Disposable } from '../types';

export class PickupSystem implements Disposable {
  private entityManager: EntityManager;
  private activePickups: PickupItem[] = [];
  private pickupRange: number = 3.0;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public setPickupRange(range: number): void {
    this.pickupRange = range;
  }

  public spawnChest(x: number, z: number): void {
    const chest = new PickupItem(x, z, 'chest');
    this.activePickups.push(chest);
    this.entityManager.add(chest);
  }

  public spawnDrop(x: number, z: number, type: PickupType): void {
    const item = new PickupItem(x, z, type);
    this.activePickups.push(item);
    this.entityManager.add(item);
  }

  public trySpawnRandomDrop(x: number, z: number): void {
    const roll = Math.random();
    // 2% Potion, 1% Vacuum, 1% Bomb
    if (roll < 0.02) {
      this.spawnDrop(x, z, 'potion');
    } else if (roll < 0.03) {
      this.spawnDrop(x, z, 'vacuum');
    } else if (roll < 0.04) {
      this.spawnDrop(x, z, 'bomb');
    }
  }

  public update(
    deltaTime: number,
    player: Player,
    onCollect: (item: PickupItem) => void
  ): void {
    if (player.hp <= 0) return;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;
    const rangeSq = this.pickupRange * this.pickupRange;

    for (let i = this.activePickups.length - 1; i >= 0; i--) {
      const item = this.activePickups[i];
      if (item.isCollected) {
        this.removePickupAt(i);
        continue;
      }

      item.update(deltaTime);

      const dx = px - item.position.x;
      const dz = pz - item.position.z;
      const distSq = dx * dx + dz * dz;

      if (item.isAttracted || distSq <= rangeSq) {
        const collected = item.attractTowards(px, py, pz, deltaTime);
        if (collected) {
          onCollect(item);
          this.removePickupAt(i);
        }
      }
    }
  }

  private removePickupAt(index: number): void {
    const item = this.activePickups[index];
    const last = this.activePickups.pop()!;
    if (index < this.activePickups.length) {
      this.activePickups[index] = last;
    }
    this.entityManager.remove(item);
  }

  public clear(): void {
    for (let i = 0; i < this.activePickups.length; i++) {
      this.entityManager.remove(this.activePickups[i]);
    }
    this.activePickups.length = 0;
  }

  public dispose(): void {
    this.clear();
  }
}
