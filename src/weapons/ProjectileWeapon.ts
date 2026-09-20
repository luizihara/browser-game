import type { Weapon } from './Weapon';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import { Projectile } from '../entities/projectile/Projectile';
import {
  WEAPON_CONFIG,
  type WeaponId,
  type WeaponLevelConfig,
} from '../config/weaponConfig';

export class ProjectileWeapon implements Weapon {
  public readonly id: WeaponId = 'wand';
  public readonly name: string = WEAPON_CONFIG.wand.name;
  public readonly icon: string = WEAPON_CONFIG.wand.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.wand.maxLevel;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private cooldownTimer: number = 0;

  public get isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }

  public upgrade(): boolean {
    if (this.isMaxLevel) return false;
    this.level++;
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.wand.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isMaxLevel) return 'Maximum Level reached.';
    return WEAPON_CONFIG.wand.levels[this.level].description;
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    onSpawnProjectile: (projectile: Projectile) => void
  ): void {
    this.cooldownTimer -= deltaTime;
    if (this.cooldownTimer > 0) return;

    const cfg = this.getCurrentConfig();
    const range = cfg.range ?? WEAPON_CONFIG.wand.range;

    const closestEnemy = this.findClosestEnemy(player, enemies, range);
    if (!closestEnemy) return;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;
    const dx = closestEnemy.position.x - px;
    const dz = closestEnemy.position.z - pz;
    const distSq = dx * dx + dz * dz;

    if (distSq > 0.0001) {
      const invDist = 1 / Math.sqrt(distSq);
      const baseDirX = dx * invDist;
      const baseDirZ = dz * invDist;
      const baseAngle = Math.atan2(baseDirZ, baseDirX);

      const count = cfg.count ?? 1;
      const damage = Math.round(cfg.damage * this.damageMultiplier);
      const speed =
        (cfg.speed ?? WEAPON_CONFIG.wand.projectileSpeed) *
        this.projectileSpeedMultiplier;

      const spreadStep = count > 1 ? 0.16 : 0;
      const startAngle = baseAngle - ((count - 1) * spreadStep) / 2;

      for (let i = 0; i < count; i++) {
        const angle = startAngle + i * spreadStep;
        const dirX = Math.cos(angle);
        const dirZ = Math.sin(angle);

        const projectile = new Projectile(
          px,
          py,
          pz,
          dirX,
          dirZ,
          damage,
          speed,
          WEAPON_CONFIG.wand.projectileRadius,
          WEAPON_CONFIG.wand.projectileLifetime,
          WEAPON_CONFIG.wand.color,
          WEAPON_CONFIG.wand.emissiveColor,
          WEAPON_CONFIG.wand.emissiveIntensity
        );

        onSpawnProjectile(projectile);
      }

      this.cooldownTimer = cfg.cooldown * this.cooldownMultiplier;
    }
  }

  private findClosestEnemy(
    player: Player,
    enemies: readonly Enemy[],
    range: number
  ): Enemy | null {
    let closest: Enemy | null = null;
    let minDistanceSq = range * range;

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
    this.level = 1;
    this.cooldownTimer = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
  }

  public dispose(): void {
    this.reset();
  }
}
