import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';

export class CombatSystem {
  private player: Player | null = null;

  constructor(player: Player | null) {
    this.player = player;
  }

  public setPlayer(player: Player | null): void {
    this.player = player;
  }

  public update(enemies: readonly Enemy[]): void {
    if (!this.player || this.player.hp <= 0) return;

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
          // If player just took damage, i-frames are triggered so we can exit early this frame
          break;
        }
      }
    }
  }
}
