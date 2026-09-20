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
  public isEvolved: boolean = false;

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

  public evolve(): boolean {
    if (this.isEvolved) return false;
    this.isEvolved = true;
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.wand.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Holy Astral Beam: Dispara feixes cósmicos contínuos e velozes que perfuram múltiplos inimigos.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Haste!';
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
    const range = this.isEvolved ? 15 : (cfg.range ?? WEAPON_CONFIG.wand.range);

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

      const count = this.isEvolved ? 4 : (cfg.count ?? 1);
      const baseDmg = this.isEvolved ? 60 : cfg.damage;
      const damage = Math.round(baseDmg * this.damageMultiplier);
      const speed =
        (this.isEvolved ? 25 : (cfg.speed ?? WEAPON_CONFIG.wand.projectileSpeed)) *
        this.projectileSpeedMultiplier;

      const spreadStep = count > 1 ? (this.isEvolved ? 0.12 : 0.16) : 0;
      const startAngle = baseAngle - ((count - 1) * spreadStep) / 2;

      const radius = this.isEvolved ? 0.28 : WEAPON_CONFIG.wand.projectileRadius;
      const lifetime = this.isEvolved ? 2.2 : WEAPON_CONFIG.wand.projectileLifetime;
      const color = this.isEvolved ? 0x38bdf8 : WEAPON_CONFIG.wand.color;
      const emissiveColor = this.isEvolved ? 0xbae6fd : WEAPON_CONFIG.wand.emissiveColor;
      const emissiveIntensity = this.isEvolved ? 1.0 : WEAPON_CONFIG.wand.emissiveIntensity;

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
          radius,
          lifetime,
          color,
          emissiveColor,
          emissiveIntensity,
          false,
          'wand'
        );

        if (this.isEvolved) {
          projectile.pierceCount = 3; // Pierces 3 enemies!
        }

        onSpawnProjectile(projectile);
      }

      const cooldown = (this.isEvolved ? 0.42 : cfg.cooldown) * this.cooldownMultiplier;
      this.cooldownTimer = cooldown;
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
    this.isEvolved = false;
    this.cooldownTimer = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
  }

  public dispose(): void {
    this.reset();
  }
}
