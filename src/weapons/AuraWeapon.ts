import * as THREE from 'three';
import type { Weapon } from './Weapon';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Projectile } from '../entities/projectile/Projectile';
import {
  WEAPON_CONFIG,
  type WeaponId,
  type WeaponLevelConfig,
} from '../config/weaponConfig';

export class AuraWeapon implements Weapon {
  public readonly id: WeaponId = 'aura';
  public readonly name: string = WEAPON_CONFIG.aura.name;
  public readonly icon: string = WEAPON_CONFIG.aura.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.aura.maxLevel;
  public isEvolved: boolean = false;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private scene: THREE.Scene | null = null;
  private ringMesh: THREE.Mesh | null = null;
  private ringMat: THREE.MeshBasicMaterial | null = null;

  private cooldownTimer: number = 0;
  private pulseTimer: number = 0;
  private readonly pulseDuration: number = 0.45;
  private currentWaveRadius: number = 5.0;

  constructor(scene?: THREE.Scene) {
    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    if (this.ringMesh && this.scene) {
      this.scene.remove(this.ringMesh);
    }
    this.scene = scene;
    this.initVisual();
  }

  private initVisual(): void {
    if (!this.scene) return;
    if (this.ringMesh) {
      this.scene.remove(this.ringMesh);
    }

    const geo = new THREE.RingGeometry(0.8, 1.0, 32);
    geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.isEvolved ? 0xf97316 : WEAPON_CONFIG.aura.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.ringMesh = new THREE.Mesh(geo, this.ringMat);
    this.ringMesh.position.set(0, 0.05, 0);
    this.scene.add(this.ringMesh);
  }

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
    if (this.ringMat) {
      this.ringMat.color.setHex(0xf97316);
    }
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.aura.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Solar Supernova: Pulso solar devastador de plasma com alcance dobrado e dano cataclísmico.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Might!';
    return WEAPON_CONFIG.aura.levels[this.level].description;
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    _onSpawnProjectile: (projectile: Projectile) => void,
    onEnemyKilled?: (enemy: Enemy) => void,
    onEnemyHit?: (
      enemy: Enemy,
      hitX: number,
      hitY: number,
      hitZ: number,
      weaponId?: WeaponId,
      damage?: number
    ) => void
  ): void {
    if (!this.ringMesh && this.scene) {
      this.initVisual();
    }

    const cfg = this.getCurrentConfig();
    this.cooldownTimer -= deltaTime;

    // Trigger radiant pulse shockwave
    if (this.cooldownTimer <= 0) {
      const cooldown = (this.isEvolved ? 1.3 : cfg.cooldown) * this.cooldownMultiplier;
      this.cooldownTimer = cooldown;
      this.pulseTimer = this.pulseDuration;
      this.currentWaveRadius = this.isEvolved ? 8.5 : (cfg.radius ?? 5.0);

      // Deal damage to all enemies within radius
      const px = player.position.x;
      const py = player.position.y;
      const pz = player.position.z;
      const baseDmg = this.isEvolved ? 110 : cfg.damage;
      const damage = Math.round(baseDmg * this.damageMultiplier);
      const radSq = this.currentWaveRadius * this.currentWaveRadius;

      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.isDead) continue;

        const dx = enemy.position.x - px;
        const dz = enemy.position.z - pz;
        if (dx * dx + dz * dz <= radSq) {
          const died = enemy.takeDamage(damage);
          if (onEnemyHit) {
            onEnemyHit(enemy, enemy.position.x, py, enemy.position.z, this.id, damage);
          }
          if (died && onEnemyKilled) {
            onEnemyKilled(enemy);
          }
        }
      }
    }

    // Animate expanding wave visual
    if (this.ringMesh && this.ringMat) {
      if (this.pulseTimer > 0) {
        this.pulseTimer -= deltaTime;
        const progress = Math.max(0, 1 - this.pulseTimer / this.pulseDuration);
        const scale = 0.1 + progress * this.currentWaveRadius;

        this.ringMesh.position.set(player.position.x, 0.05, player.position.z);
        this.ringMesh.scale.set(scale, 1, scale);
        this.ringMat.opacity = (1 - progress) * (this.isEvolved ? 0.95 : 0.85);
      } else {
        this.ringMat.opacity = 0;
      }
    }
  }

  public reset(): void {
    this.level = 1;
    this.isEvolved = false;
    this.cooldownTimer = 0;
    this.pulseTimer = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
    if (this.ringMat) {
      this.ringMat.color.setHex(WEAPON_CONFIG.aura.color);
      this.ringMat.opacity = 0;
    }
  }

  public dispose(): void {
    this.reset();
    if (this.ringMesh && this.scene) {
      this.scene.remove(this.ringMesh);
      this.ringMesh.geometry.dispose();
      if (this.ringMat) {
        this.ringMat.dispose();
      }
      this.ringMesh = null;
      this.ringMat = null;
      this.scene = null;
    }
  }
}
