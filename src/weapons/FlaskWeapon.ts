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
import { MetaManager } from '../config/metaConfig';

const MAX_FLASKS = 4;
const MAX_PUDDLES = 8;

interface FlyingFlask {
  mesh: THREE.Group;
  active: boolean;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetZ: number;
  progress: number;
  duration: number;
  damage: number;
  burnDps: number;
  radius: number;
  isEvolved: boolean;
}

interface ToxicPuddle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  active: boolean;
  x: number;
  z: number;
  radius: number;
  lifetime: number;
  maxLifetime: number;
  burnDps: number;
  tickTimer: number;
  isEvolved: boolean;
}

export class FlaskWeapon implements Weapon {
  public readonly id: WeaponId = 'flask';
  public readonly name: string = WEAPON_CONFIG.flask.name;
  public readonly icon: string = WEAPON_CONFIG.flask.icon;
  public level: number = 1;
  public readonly maxLevel: number = WEAPON_CONFIG.flask.maxLevel;
  public isEvolved: boolean = false;

  public damageMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  private scene: THREE.Scene | null = null;
  private flasks: FlyingFlask[] = [];
  private puddles: ToxicPuddle[] = [];
  private cooldownTimer: number = 0;

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

    // 1. Pre-allocate flying flask meshes
    const bottleGeo = new THREE.CylinderGeometry(0.14, 0.22, 0.45, 6);
    const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 6);
    neckGeo.translate(0, 0.28, 0);

    for (let i = 0; i < MAX_FLASKS; i++) {
      const group = new THREE.Group();
      const bottleMat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.9,
      });
      const neckMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });

      const bottle = new THREE.Mesh(bottleGeo, bottleMat);
      const neck = new THREE.Mesh(neckGeo, neckMat);
      group.add(bottle);
      group.add(neck);

      group.visible = false;
      this.scene.add(group);

      this.flasks.push({
        mesh: group,
        active: false,
        startX: 0,
        startY: 0,
        startZ: 0,
        targetX: 0,
        targetZ: 0,
        progress: 0,
        duration: 0.5,
        damage: 20,
        burnDps: 18,
        radius: 2.2,
        isEvolved: false,
      });
    }

    // 2. Pre-allocate ground puddle decals
    const puddleGeo = new THREE.CircleGeometry(1.0, 24);
    puddleGeo.rotateX(-Math.PI / 2);

    for (let i = 0; i < MAX_PUDDLES; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(puddleGeo, mat);
      mesh.position.set(0, 0.04, 0);
      mesh.visible = false;
      this.scene.add(mesh);

      this.puddles.push({
        mesh,
        mat,
        active: false,
        x: 0,
        z: 0,
        radius: 2.2,
        lifetime: 0,
        maxLifetime: 3.5,
        burnDps: 18,
        tickTimer: 0,
        isEvolved: false,
      });
    }
  }

  private disposeMeshes(): void {
    if (this.scene) {
      for (let i = 0; i < this.flasks.length; i++) {
        this.scene.remove(this.flasks[i].mesh);
      }
      for (let i = 0; i < this.puddles.length; i++) {
        this.scene.remove(this.puddles[i].mesh);
        this.puddles[i].mat.dispose();
      }
    }
    if (this.puddles.length > 0) {
      this.puddles[0].mesh.geometry.dispose();
    }
    this.flasks.length = 0;
    this.puddles.length = 0;
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
    for (let i = 0; i < this.puddles.length; i++) {
      this.puddles[i].mat.color.setHex(0xfacc15);
    }
    return true;
  }

  public getCurrentConfig(): WeaponLevelConfig {
    const levels = WEAPON_CONFIG.flask.levels;
    return levels[Math.min(this.level - 1, levels.length - 1)];
  }

  public getCurrentDescription(): string {
    if (this.isEvolved) {
      return '[EVOLVED] Midas Plague: Transmuta o solo em poças de ouro líquido cáustico. Dano massivo de queimadura e inimigos mortos rendem ouro bônus.';
    }
    return this.getCurrentConfig().description;
  }

  public getNextLevelDescription(): string {
    if (this.isEvolved) return 'Evolução Máxima alcançada.';
    if (this.isMaxLevel) return 'Nível Máximo alcançado. Pronto para evoluir com Magnet!';
    return WEAPON_CONFIG.flask.levels[this.level].description;
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
    if (this.flasks.length === 0) {
      this.initMeshes();
    }

    // 1. Update flying flasks (parabolic arc kinematics)
    for (let i = 0; i < this.flasks.length; i++) {
      const f = this.flasks[i];
      if (!f.active) continue;

      f.progress += deltaTime / f.duration;

      if (f.progress >= 1.0) {
        // Flask lands and shatters
        f.active = false;
        f.mesh.visible = false;

        // AoE initial impact damage
        const radSq = f.radius * f.radius;
        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          if (enemy.isDead) continue;
          const dx = enemy.position.x - f.targetX;
          const dz = enemy.position.z - f.targetZ;
          if (dx * dx + dz * dz <= radSq) {
            enemy.applyBurn(3.0, f.burnDps);
            const died = enemy.takeDamage(f.damage);
            if (onEnemyHit) {
              onEnemyHit(enemy, enemy.position.x, 0.4, enemy.position.z, 'flask', f.damage);
            }
            if (died && onEnemyKilled) {
              onEnemyKilled(enemy);
            }
          }
        }

        // Spawn ground chemical hazard puddle
        this.spawnPuddle(f.targetX, f.targetZ, f.radius, f.burnDps, f.isEvolved);
      } else {
        // Linear XZ + Parabolic Y
        const p = f.progress;
        const curX = f.startX + (f.targetX - f.startX) * p;
        const curZ = f.startZ + (f.targetZ - f.startZ) * p;
        const curY = f.startY + Math.sin(p * Math.PI) * 3.5;

        f.mesh.position.set(curX, curY, curZ);
        f.mesh.rotation.x += deltaTime * 12.0;
        f.mesh.rotation.z += deltaTime * 8.0;
      }
    }

    // 2. Update active puddles (DoT burn ticks)
    for (let i = 0; i < this.puddles.length; i++) {
      const pud = this.puddles[i];
      if (!pud.active) continue;

      pud.lifetime -= deltaTime;
      if (pud.lifetime <= 0) {
        pud.active = false;
        pud.mesh.visible = false;
        pud.mat.opacity = 0;
        continue;
      }

      // Fade out near end of life
      const lifeRatio = Math.min(1.0, pud.lifetime / 0.8);
      pud.mat.opacity = (pud.isEvolved ? 0.75 : 0.6) * lifeRatio;

      pud.tickTimer += deltaTime;
      if (pud.tickTimer >= 0.4) {
        pud.tickTimer = 0;

        const radSq = pud.radius * pud.radius;
        const tickDmg = Math.max(1, Math.round(pud.burnDps * 0.4));

        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          if (enemy.isDead) continue;

          const dx = enemy.position.x - pud.x;
          const dz = enemy.position.z - pud.z;
          if (dx * dx + dz * dz <= radSq) {
            enemy.applyBurn(2.5, pud.burnDps);
            const died = enemy.takeDamage(tickDmg);

            if (onEnemyHit) {
              onEnemyHit(enemy, enemy.position.x, 0.2, enemy.position.z, 'flask', tickDmg);
            }

            if (died) {
              if (pud.isEvolved && Math.random() < 0.5) {
                // Midas plague bonus gold!
                MetaManager.getInstance().addGold(1);
              }
              if (onEnemyKilled) {
                onEnemyKilled(enemy);
              }
            }
          }
        }
      }
    }

    // 3. Cooldown and Lobbing Logic
    this.cooldownTimer -= deltaTime;
    if (this.cooldownTimer > 0) return;

    const cfg = this.getCurrentConfig();
    const count = this.isEvolved ? 3 : (cfg.count ?? 1);
    const range = 13.0;

    // Find enemies in range to lob at
    const px = player.position.x;
    const pz = player.position.z;
    const candidates: Enemy[] = [];

    for (let i = 0; i < enemies.length && candidates.length < count; i++) {
      const e = enemies[i];
      if (e.isDead) continue;
      const dx = e.position.x - px;
      const dz = e.position.z - pz;
      if (dx * dx + dz * dz <= range * range) {
        candidates.push(e);
      }
    }

    if (candidates.length === 0) return;

    // Reset cooldown
    const cooldown = (this.isEvolved ? 0.95 : cfg.cooldown) * this.cooldownMultiplier;
    this.cooldownTimer = cooldown;

    const baseDmg = this.isEvolved ? 65 : cfg.damage;
    const damage = Math.round(baseDmg * this.damageMultiplier);
    const burnDps = Math.round((this.isEvolved ? 60 : 18 + this.level * 6) * this.damageMultiplier);
    const radius = this.isEvolved ? 3.6 : (cfg.radius ?? 2.2);

    for (let i = 0; i < candidates.length; i++) {
      const target = candidates[i];
      this.launchFlask(
        px,
        player.position.y + 0.8,
        pz,
        target.position.x + (Math.random() - 0.5) * 0.8,
        target.position.z + (Math.random() - 0.5) * 0.8,
        damage,
        burnDps,
        radius,
        this.isEvolved
      );
    }
  }

  private launchFlask(
    startX: number,
    startY: number,
    startZ: number,
    targetX: number,
    targetZ: number,
    damage: number,
    burnDps: number,
    radius: number,
    isEvolved: boolean
  ): void {
    // Find available flask slot
    for (let i = 0; i < this.flasks.length; i++) {
      const f = this.flasks[i];
      if (!f.active) {
        f.active = true;
        f.startX = startX;
        f.startY = startY;
        f.startZ = startZ;
        f.targetX = targetX;
        f.targetZ = targetZ;
        f.progress = 0;
        f.damage = damage;
        f.burnDps = burnDps;
        f.radius = radius;
        f.isEvolved = isEvolved;
        f.duration = 0.48;

        f.mesh.position.set(startX, startY, startZ);
        f.mesh.visible = true;
        break;
      }
    }
  }

  private spawnPuddle(
    x: number,
    z: number,
    radius: number,
    burnDps: number,
    isEvolved: boolean
  ): void {
    // Find available puddle slot
    for (let i = 0; i < this.puddles.length; i++) {
      const p = this.puddles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.z = z;
        p.radius = radius;
        p.burnDps = burnDps;
        p.isEvolved = isEvolved;
        p.lifetime = 3.6;
        p.maxLifetime = 3.6;
        p.tickTimer = 0;

        p.mesh.position.set(x, 0.04, z);
        p.mesh.scale.set(radius, 1, radius);
        p.mat.color.setHex(isEvolved ? 0xfacc15 : 0x10b981);
        p.mat.opacity = isEvolved ? 0.75 : 0.6;
        p.mesh.visible = true;
        break;
      }
    }
  }

  public reset(): void {
    this.level = 1;
    this.isEvolved = false;
    this.cooldownTimer = 0;
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;

    for (let i = 0; i < this.flasks.length; i++) {
      this.flasks[i].active = false;
      this.flasks[i].mesh.visible = false;
    }
    for (let i = 0; i < this.puddles.length; i++) {
      this.puddles[i].active = false;
      this.puddles[i].mesh.visible = false;
      this.puddles[i].mat.opacity = 0;
      this.puddles[i].mat.color.setHex(0x10b981);
    }
  }

  public dispose(): void {
    this.disposeMeshes();
    this.scene = null;
  }
}
