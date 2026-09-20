import type { Weapon } from './Weapon';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import { Projectile } from '../entities/projectile/Projectile';
import {
  WEAPON_CONFIG,
  type WeaponId,
  type WeaponLevelConfig,
} from '../config/weaponConfig';

export class DaggerWeapon implements Weapon {
  public readonly id: WeaponId = 'dagger';
  public readonly name: string = WEAPON_CONFIG.dagger.name;
  public readonly icon: string = WEAPON_CONFIG.dagger.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.dagger.maxLevel;

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
    const levels = WEAPON_CONFIG.dagger.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isMaxLevel) return 'Maximum Level reached.';
    return WEAPON_CONFIG.dagger.levels[this.level].description;
  }

  public update(
    deltaTime: number,
    player: Player,
    _enemies: readonly Enemy[],
    onSpawnProjectile: (projectile: Projectile) => void
  ): void {
    this.cooldownTimer -= deltaTime;
    if (this.cooldownTimer > 0) return;

    const cfg = this.getCurrentConfig();
    this.cooldownTimer = cfg.cooldown * this.cooldownMultiplier;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;

    // Player orientation determines firing direction
    const rotY = player.getMesh().rotation.y;
    const fwdX = Math.sin(rotY);
    const fwdZ = Math.cos(rotY);
    const baseAngle = Math.atan2(fwdZ, fwdX);

    const count = cfg.count ?? 2;
    const damage = Math.round(cfg.damage * this.damageMultiplier);
    const speed =
      (cfg.speed ?? 18.0) * this.projectileSpeedMultiplier;

    const spreadStep = count > 1 ? 0.16 : 0;
    const startAngle = baseAngle - ((count - 1) * spreadStep) / 2;

    for (let i = 0; i < count; i++) {
      const angle = startAngle + i * spreadStep;
      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);

      const dagger = new Projectile(
        px,
        py,
        pz,
        dirX,
        dirZ,
        damage,
        speed,
        WEAPON_CONFIG.dagger.projectileRadius,
        WEAPON_CONFIG.dagger.projectileLifetime,
        WEAPON_CONFIG.dagger.color,
        WEAPON_CONFIG.dagger.emissiveColor,
        WEAPON_CONFIG.dagger.emissiveIntensity,
        true, // isDagger geometry
        this.id
      );

      onSpawnProjectile(dagger);
    }
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
