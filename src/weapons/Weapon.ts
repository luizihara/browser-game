import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Projectile } from '../entities/projectile/Projectile';
import type { WeaponId } from '../config/weaponConfig';
import type { Disposable } from '../types';

export interface Weapon extends Disposable {
  readonly id: WeaponId;
  readonly name: string;
  readonly icon: string;
  level: number;
  readonly maxLevel: number;
  readonly isMaxLevel: boolean;
  isEvolved: boolean;

  damageMultiplier: number;
  cooldownMultiplier: number;
  projectileSpeedMultiplier: number;

  upgrade(): boolean;
  evolve(): boolean;
  getCurrentDescription(): string;
  getNextLevelDescription(): string;

  update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    onSpawnProjectile: (projectile: Projectile) => void,
    onEnemyKilled?: (enemy: Enemy) => void,
    onEnemyHit?: (
      enemy: Enemy,
      hitX: number,
      hitY: number,
      hitZ: number,
      weaponId?: WeaponId,
      damage?: number
    ) => void
  ): void;

  reset(): void;
}
