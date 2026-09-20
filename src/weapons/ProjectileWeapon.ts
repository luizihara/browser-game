import type { Weapon } from './Weapon';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import { Projectile } from '../entities/projectile/Projectile';
import { WEAPON_CONFIG } from '../config/weaponConfig';

export class ProjectileWeapon implements Weapon {
  public readonly name: string = WEAPON_CONFIG.wand.name;
  private cooldownTimer: number = 0;

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    onSpawnProjectile: (projectile: Projectile) => void
  ): void {
    this.cooldownTimer -= deltaTime;
    if (this.cooldownTimer > 0) return;

    const closestEnemy = this.findClosestEnemy(player, enemies);
    if (!closestEnemy) return;

    const px = player.position.x;
    const pz = player.position.z;
    const dx = closestEnemy.position.x - px;
    const dz = closestEnemy.position.z - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq > 0.0001) {
      const invDist = 1 / Math.sqrt(distSq);
      const dirX = dx * invDist;
      const dirZ = dz * invDist;

      const projectile = new Projectile(
        px,
        player.position.y,
        pz,
        dirX,
        dirZ,
        WEAPON_CONFIG.wand.damage,
        WEAPON_CONFIG.wand.projectileSpeed,
        WEAPON_CONFIG.wand.projectileRadius,
        WEAPON_CONFIG.wand.projectileLifetime
      );

      onSpawnProjectile(projectile);
      this.cooldownTimer = WEAPON_CONFIG.wand.cooldown;
    }
  }

  private findClosestEnemy(
    player: Player,
    enemies: readonly Enemy[]
  ): Enemy | null {
    let closest: Enemy | null = null;
    let minDistanceSq = WEAPON_CONFIG.wand.range * WEAPON_CONFIG.wand.range;

    const px = player.position.x;
    const pz = player.position.z;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDead) continue;

      const dx = enemy.position.x - px;
      const dz = enemy.position.z - pz;
      const distSq = dx * dx + dz * dz;

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closest = enemy;
      }
    }

    return closest;
  }

  public reset(): void {
    this.cooldownTimer = 0;
  }
}
