import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Projectile } from '../entities/projectile/Projectile';
import type { WeaponId } from '../config/weaponConfig';

export class CombatSystem {
  private player: Player | null = null;

  constructor(player: Player | null) {
    this.player = player;
  }

  public setPlayer(player: Player | null): void {
    this.player = player;
  }

  public update(
    enemies: readonly Enemy[],
    projectiles?: readonly Projectile[],
    onEnemyKilled?: (enemy: Enemy) => void,
    onProjectileHit?: (projectile: Projectile) => void,
    onPlayerDamaged?: (player: Player) => void,
    onEnemyHit?: (
      enemy: Enemy,
      hitX: number,
      hitY: number,
      hitZ: number,
      projectile?: Projectile,
      weaponId?: WeaponId,
      damage?: number
    ) => void
  ): void {
    // 1. Player contact damage check
    if (this.player && this.player.hp > 0) {
      const px = this.player.position.x;
      const pz = this.player.position.z;
      const pRadius = this.player.radius;

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.isDead) continue;

        const dx = px - enemy.position.x;
        const dz = pz - enemy.position.z;
        const minDist = pRadius + enemy.radius;

        if (dx * dx + dz * dz <= minDist * minDist) {
          const tookDamage = this.player.takeDamage(enemy.damage);
          if (tookDamage) {
            if (onPlayerDamaged) {
              onPlayerDamaged(this.player);
            }
            break;
          }
        }
      }
    }

    // 2. Projectile vs Enemy collision check
    if (projectiles && projectiles.length > 0) {
      for (let p = 0; p < projectiles.length; p++) {
        const proj = projectiles[p];
        if (proj.isExpired) continue;

        const projX = proj.position.x;
        const projZ = proj.position.z;
        const projRadius = proj.radius;

        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          if (enemy.isDead) continue;

          const dx = projX - enemy.position.x;
          const dz = projZ - enemy.position.z;
          const collisionDist = projRadius + enemy.radius;

          if (dx * dx + dz * dz <= collisionDist * collisionDist) {
            const died = enemy.takeDamage(proj.damage);
            if (onEnemyHit) {
              onEnemyHit(enemy, projX, proj.position.y, projZ, proj, proj.weaponId, proj.damage);
            }
            if (died && onEnemyKilled) {
              onEnemyKilled(enemy);
            }
            if (onProjectileHit) {
              onProjectileHit(proj);
            }
            break; // Projectile consumed on impact
          }
        }
      }
    }
  }
}
