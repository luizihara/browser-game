import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Projectile } from '../entities/projectile/Projectile';

export interface Weapon {
  readonly name: string;
  update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    onSpawnProjectile: (projectile: Projectile) => void
  ): void;
  reset(): void;
}
