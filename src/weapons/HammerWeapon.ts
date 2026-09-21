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

const MAX_BOLTS = 14;

interface LightningBoltMesh {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
}

export class HammerWeapon implements Weapon {
  public readonly id: WeaponId = 'hammer';
  public readonly name: string = WEAPON_CONFIG.hammer.name;
  public readonly icon: string = WEAPON_CONFIG.hammer.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.hammer.maxLevel;
  public isEvolved: boolean = false;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private scene: THREE.Scene | null = null;
  private bolts: LightningBoltMesh[] = [];
  private flashTimer: number = 0;
  private cooldownTimer: number = 0;

  // Zero-GC reusables
  private chainTargets: Enemy[] = [];
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private upAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  constructor(scene?: THREE.Scene) {
    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    this.disposeMeshes();
    this.scene = scene;
    this.initMeshes();
  }

  private initMeshes(): void {
    if (!this.scene) return;

    const geo = new THREE.CylinderGeometry(0.12, 0.12, 1, 5);
    for (let i = 0; i < MAX_BOLTS; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: this.isEvolved ? 0x22d3ee : 0x38bdf8,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.bolts.push({ mesh, mat, active: false });
    }
  }

  private disposeMeshes(): void {
    if (this.scene) {
      for (let i = 0; i < this.bolts.length; i++) {
        this.scene.remove(this.bolts[i].mesh);
        this.bolts[i].mat.dispose();
      }
    }
    if (this.bolts.length > 0) {
      this.bolts[0].mesh.geometry.dispose();
    }
    this.bolts.length = 0;
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
    for (let i = 0; i < this.bolts.length; i++) {
      this.bolts[i].mat.color.setHex(0x22d3ee);
    }
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.hammer.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Storm Cataclysm: Tempestade cataclísmica contínua que eletrocuta e congela até 10 inimigos com dano colossal.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Might!';
    return WEAPON_CONFIG.hammer.levels[this.level].description;
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
    if (!this.scene) return;
    if (this.bolts.length === 0) {
      this.initMeshes();
    }

    // Flash timer update for active bolts
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        for (let i = 0; i < this.bolts.length; i++) {
          this.bolts[i].mesh.visible = false;
          this.bolts[i].active = false;
        }
      }
    }

    this.cooldownTimer -= deltaTime;
    if (this.cooldownTimer > 0) return;

    const cfg = this.getCurrentConfig();
    const maxChain = this.isEvolved ? 10 : (cfg.count ?? 3);
    const range = this.isEvolved ? 18.0 : (cfg.range ?? 14.0);
    const chainRangeSq = (this.isEvolved ? 11.0 : 8.5) * (this.isEvolved ? 11.0 : 8.5);

    // 1. Find initial target closest to player
    const px = player.position.x;
    const pz = player.position.z;
    let closestEnemy: Enemy | null = null;
    let minDistanceSq = range * range;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead) continue;
      const dx = e.position.x - px;
      const dz = e.position.z - pz;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestEnemy = e;
      }
    }

    if (!closestEnemy) return;

    // Reset cooldown
    const cooldown = (this.isEvolved ? 0.75 : cfg.cooldown) * this.cooldownMultiplier;
    this.cooldownTimer = cooldown;

    // 2. Build chain targets list without allocations
    this.chainTargets.length = 0;
    this.chainTargets.push(closestEnemy);

    let current = closestEnemy;
    while (this.chainTargets.length < maxChain) {
      let nextTarget: Enemy | null = null;
      let nextDistSq = chainRangeSq;
      const cx = current.position.x;
      const cz = current.position.z;

      for (let i = 0; i < enemies.length; i++) {
        const candidate = enemies[i];
        if (candidate.isDead || this.chainTargets.indexOf(candidate) !== -1) continue;

        const dx = candidate.position.x - cx;
        const dz = candidate.position.z - cz;
        const distSq = dx * dx + dz * dz;
        if (distSq < nextDistSq) {
          nextDistSq = distSq;
          nextTarget = candidate;
        }
      }

      if (!nextTarget) break;
      this.chainTargets.push(nextTarget);
      current = nextTarget;
    }

    // 3. Deal damage and apply electric shock / freeze
    const baseDmg = this.isEvolved ? 120 : cfg.damage;
    const damage = Math.round(baseDmg * this.damageMultiplier);

    for (let i = 0; i < this.chainTargets.length; i++) {
      const target = this.chainTargets[i];
      const died = target.takeDamage(damage);

      if (this.isEvolved) {
        target.applyFreeze(0.45);
      } else {
        target.applyChill(1.5, 0.40);
      }

      if (onEnemyHit) {
        onEnemyHit(
          target,
          target.position.x,
          target.position.y + 0.6,
          target.position.z,
          'hammer',
          damage
        );
      }

      if (died && onEnemyKilled) {
        onEnemyKilled(target);
      }
    }

    // 4. Orient and show visual lightning meshes
    let boltIndex = 0;

    // First bolt: Sky strike down to target 0
    if (this.chainTargets.length > 0 && boltIndex < this.bolts.length) {
      const t0 = this.chainTargets[0];
      this.positionBolt(
        boltIndex,
        t0.position.x + (Math.random() - 0.5) * 0.5,
        11.0,
        t0.position.z + (Math.random() - 0.5) * 0.5,
        t0.position.x,
        t0.position.y + 0.5,
        t0.position.z
      );
      boltIndex++;
    }

    // Subsequent chain arcs between enemies
    for (let i = 1; i < this.chainTargets.length && boltIndex < this.bolts.length; i++) {
      const from = this.chainTargets[i - 1];
      const to = this.chainTargets[i];
      this.positionBolt(
        boltIndex,
        from.position.x,
        from.position.y + 0.5,
        from.position.z,
        to.position.x,
        to.position.y + 0.5,
        to.position.z
      );
      boltIndex++;
    }

    this.flashTimer = 0.12;
  }

  private positionBolt(
    index: number,
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ): void {
    const b = this.bolts[index];
    if (!b) return;

    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < 0.001) return;

    b.mesh.position.set((x1 + x2) * 0.5, (y1 + y2) * 0.5, (z1 + z2) * 0.5);
    b.mesh.scale.set(this.isEvolved ? 1.6 : 1.0, dist, this.isEvolved ? 1.6 : 1.0);

    this.tempVec.set(dx, dy, dz).normalize();
    b.mesh.quaternion.setFromUnitVectors(this.upAxis, this.tempVec);

    b.mesh.visible = true;
    b.active = true;
  }

  public reset(): void {
    this.level = 1;
    this.isEvolved = false;
    this.cooldownTimer = 0;
    this.flashTimer = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
    for (let i = 0; i < this.bolts.length; i++) {
      this.bolts[i].mesh.visible = false;
      this.bolts[i].active = false;
      this.bolts[i].mat.color.setHex(0x38bdf8);
    }
  }

  public dispose(): void {
    this.disposeMeshes();
    this.scene = null;
  }
}
