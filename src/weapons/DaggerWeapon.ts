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
  public isEvolved: boolean = false;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private cooldownTimer: number = 0;
  private spiralAngle: number = 0;

  public get isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }

  public upgrade(): boolean {
    if (this.isMaxLevel) return false;
    this.level++;
    return true;
  }

  public evolve(): boolean {
    if (this.isEvolved) return false;
    this.isEvolved = true;
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.dagger.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Thousand Shadow Blades: Tempestade espiral contínua em 360° de lâminas sombrias perfurantes.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Swiftness!';
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
    const cooldown = (this.isEvolved ? 0.32 : cfg.cooldown) * this.cooldownMultiplier;
    this.cooldownTimer = cooldown;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;

    const count = this.isEvolved ? 8 : (cfg.count ?? 2);
    const baseDmg = this.isEvolved ? 45 : cfg.damage;
    const damage = Math.round(baseDmg * this.damageMultiplier);
    const speed =
      (this.isEvolved ? 24.0 : (cfg.speed ?? 18.0)) * this.projectileSpeedMultiplier;

    const color = this.isEvolved ? 0xa855f7 : WEAPON_CONFIG.dagger.color;
    const emissiveColor = this.isEvolved ? 0xd8b4fe : WEAPON_CONFIG.dagger.emissiveColor;
    const emissiveIntensity = this.isEvolved ? 1.2 : WEAPON_CONFIG.dagger.emissiveIntensity;

    if (this.isEvolved) {
      // 360-degree rotating spiral fan
      this.spiralAngle = (this.spiralAngle + 0.35) % (Math.PI * 2);
      const angleStep = (Math.PI * 2) / count;

      for (let i = 0; i < count; i++) {
        const angle = this.spiralAngle + i * angleStep;
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
          WEAPON_CONFIG.dagger.projectileRadius * 1.2,
          2.0,
          color,
          emissiveColor,
          emissiveIntensity,
          true,
          this.id
        );
        dagger.pierceCount = 2; // Pierces 2 enemies!
        onSpawnProjectile(dagger);
      }
    } else {
      // Player orientation determines firing direction
      const rotY = player.getMesh().rotation.y;
      const fwdX = Math.sin(rotY);
      const fwdZ = Math.cos(rotY);
      const baseAngle = Math.atan2(fwdZ, fwdX);

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
          color,
          emissiveColor,
          emissiveIntensity,
          true,
          this.id
        );

        onSpawnProjectile(dagger);
      }
    }
  }

  public reset(): void {
    this.level = 1;
    this.isEvolved = false;
    this.cooldownTimer = 0;
    this.spiralAngle = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
  }

  public dispose(): void {
    this.reset();
  }
}
