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

export class OrbitalWeapon implements Weapon {
  public readonly id: WeaponId = 'orbital';
  public readonly name: string = WEAPON_CONFIG.orbital.name;
  public readonly icon: string = WEAPON_CONFIG.orbital.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.orbital.maxLevel;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  public isEvolved: boolean = false;

  private scene: THREE.Scene | null = null;
  private group: THREE.Group = new THREE.Group();
  private orbMeshes: THREE.Mesh[] = [];
  private currentAngle: number = 0;
  private enemyHitTimers: Map<Enemy, number> = new Map();

  constructor(scene?: THREE.Scene) {
    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    if (this.scene) {
      this.scene.remove(this.group);
    }
    this.scene = scene;
    this.scene.add(this.group);
    this.rebuildOrbs();
  }

  public get isMaxLevel(): boolean {
    return this.level >= this.maxLevel;
  }

  public upgrade(): boolean {
    if (this.isMaxLevel) return false;
    this.level++;
    this.rebuildOrbs();
    return true;
  }

  public evolve(): boolean {
    if (this.isEvolved) return false;
    this.isEvolved = true;
    this.rebuildOrbs();
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.orbital.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Aegis Citadel: 6 orbes celestiais com rotação veloz, repulsão de impacto e dano ampliado.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Vitality!';
    return WEAPON_CONFIG.orbital.levels[this.level].description;
  }

  private rebuildOrbs(): void {
    // Clean existing meshes
    for (let i = 0; i < this.orbMeshes.length; i++) {
      const mesh = this.orbMeshes[i];
      this.group.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.orbMeshes.length = 0;

    const cfg = this.getCurrentConfig();
    const count = this.isEvolved ? 6 : (cfg.count ?? 1);
    const orbRadius = this.isEvolved ? 0.32 : WEAPON_CONFIG.orbital.orbRadius;
    const color = this.isEvolved ? 0xfacc15 : WEAPON_CONFIG.orbital.color;
    const emissive = this.isEvolved ? 0xfef08a : WEAPON_CONFIG.orbital.emissiveColor;
    const intensity = this.isEvolved ? 1.2 : WEAPON_CONFIG.orbital.emissiveIntensity;

    for (let i = 0; i < count; i++) {
      const geo = new THREE.SphereGeometry(orbRadius, 10, 10);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: intensity,
        roughness: 0.15,
        metalness: 0.85,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      this.group.add(mesh);
      this.orbMeshes.push(mesh);
    }
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
    if (this.orbMeshes.length === 0) {
      this.rebuildOrbs();
    }

    const cfg = this.getCurrentConfig();
    const count = this.orbMeshes.length;
    if (count === 0) return;

    const orbitSpeed =
      (this.isEvolved ? 6.2 : (cfg.speed ?? 3.0)) * this.projectileSpeedMultiplier;
    this.currentAngle += orbitSpeed * deltaTime;

    const orbitRadius = this.isEvolved ? 2.8 : (cfg.radius ?? 2.3);
    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;

    const baseDmg = this.isEvolved ? 55 : cfg.damage;
    const damage = Math.round(baseDmg * this.damageMultiplier);
    const hitCooldown = this.isEvolved ? 0.22 : (cfg.hitCooldown ?? 0.4);
    const orbRadius = this.isEvolved ? 0.32 : WEAPON_CONFIG.orbital.orbRadius;

    // Decay enemy hit timers
    for (const [enemy, timer] of this.enemyHitTimers.entries()) {
      if (enemy.isDead || timer <= deltaTime) {
        this.enemyHitTimers.delete(enemy);
      } else {
        this.enemyHitTimers.set(enemy, timer - deltaTime);
      }
    }

    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = this.currentAngle + i * angleStep;
      const ox = px + Math.cos(angle) * orbitRadius;
      const oz = pz + Math.sin(angle) * orbitRadius;

      this.orbMeshes[i].position.set(ox, py, oz);

      // Check collision with all active enemies
      for (let e = 0; e < enemies.length; e++) {
        const enemy = enemies[e];
        if (enemy.isDead) continue;

        const currentTimer = this.enemyHitTimers.get(enemy);
        if (currentTimer !== undefined && currentTimer > 0) continue;

        const dx = ox - enemy.position.x;
        const dz = oz - enemy.position.z;
        const maxDist = orbRadius + enemy.radius;

        if (dx * dx + dz * dz <= maxDist * maxDist) {
          const died = enemy.takeDamage(damage);
          this.enemyHitTimers.set(enemy, hitCooldown);

          if (this.isEvolved) {
            const dist = Math.sqrt(dx * dx + dz * dz);
            const invDist = dist > 0.001 ? 1 / dist : 0;
            // Repel enemy outward from player center
            const pushX = (enemy.position.x - px) * invDist;
            const pushZ = (enemy.position.z - pz) * invDist;
            enemy.applyKnockback(pushX, pushZ, 1.4);
          }

          if (onEnemyHit) {
            onEnemyHit(enemy, ox, py, oz, this.id, damage);
          }

          if (died && onEnemyKilled) {
            onEnemyKilled(enemy);
          }
        }
      }
    }
  }

  public reset(): void {
    this.level = 1;
    this.isEvolved = false;
    this.currentAngle = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
    this.enemyHitTimers.clear();
    this.rebuildOrbs();
  }

  public dispose(): void {
    this.reset();
    for (let i = 0; i < this.orbMeshes.length; i++) {
      const mesh = this.orbMeshes[i];
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.orbMeshes.length = 0;
    if (this.scene) {
      this.scene.remove(this.group);
      this.scene = null;
    }
  }
}
