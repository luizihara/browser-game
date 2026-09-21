import * as THREE from 'three';
import { Entity } from '../Entity';
import { ENEMY_CONFIG, type EnemyType } from '../../config/enemyConfig';
import type { GemTier } from '../../config/experienceConfig';
import { FX_CONFIG } from '../../config/fxConfig';
import { EnemyVisualBuilder, type EnemyVisualSetup } from '../../art/EnemyVisualBuilder';

export interface EnemyStatMultipliers {
  hp?: number;
  damage?: number;
  speed?: number;
}

export class Enemy extends Entity {
  public readonly type: EnemyType;
  public speed: number;
  public hp: number;
  public maxHp: number;
  public damage: number;
  public radius: number;
  public isDead: boolean = false;
  public xpReward: number;
  public gemTier: GemTier;

  protected visualSetup?: EnemyVisualSetup;
  protected haloMesh: THREE.Mesh | null = null;
  protected bodyMesh: THREE.Mesh | null = null;
  protected baseMaterial: THREE.MeshToonMaterial | null = null;
  protected originalColor: number;
  protected flashTimer: number = 0;
  protected wobbleTimer: number = 0;
  public freezeTimer: number = 0;
  public burnTimer: number = 0;
  public burnDps: number = 0;
  private burnTickTimer: number = 0;
  public chillTimer: number = 0;
  public chillSlow: number = 0.40;

  constructor(
    x: number = 0,
    z: number = 0,
    type: EnemyType = 'basic',
    multipliers?: EnemyStatMultipliers,
    customGroup?: THREE.Group
  ) {
    const visual = customGroup ? null : EnemyVisualBuilder.buildEnemy(type);
    super(customGroup ?? visual!.rootGroup);

    if (visual) {
      this.visualSetup = visual;
      this.bodyMesh = visual.bodyMesh;
      this.haloMesh = visual.haloMesh;
      this.baseMaterial = visual.baseMaterial;
    }

    const cfg = ENEMY_CONFIG[type];
    const hpMult = multipliers?.hp ?? 1.0;
    const dmgMult = multipliers?.damage ?? 1.0;
    const spdMult = multipliers?.speed ?? 1.0;

    this.type = type;
    this.originalColor = cfg.color;
    this.maxHp = Math.round(cfg.maxHp * hpMult);
    this.hp = this.maxHp;
    this.damage = Math.round(cfg.damage * dmgMult);
    this.speed = cfg.speed * spdMult;
    this.radius = cfg.radius;
    this.xpReward = cfg.xpReward;
    this.gemTier = cfg.gemTier;

    // Randomize initial wobble phase to prevent synchronized hive marching
    this.wobbleTimer = Math.random() * 10.0;

    const initialY = cfg.height / 2;
    this.position.set(x, initialY, z);
  }

  public override update(deltaTime: number): void {
    this.wobbleTimer += deltaTime;

    // 1. Archetype-specific procedural motion personality
    if (this.visualSetup) {
      const model = this.visualSetup.modelGroup;
    switch (this.type) {
      case 'basic': // Stalker: rapid lateral imp swagger
        model.rotation.z = Math.sin(this.wobbleTimer * 12.0) * 0.08;
        break;
      case 'fast': // Skitterer: high-frequency scuttling shake
        model.rotation.z = Math.sin(this.wobbleTimer * 22.0) * 0.05;
        model.position.y = Math.abs(Math.sin(this.wobbleTimer * 22.0)) * 0.03;
        break;
      case 'tank': // Brute: heavy, low-frequency stone stomp
        model.rotation.z = Math.sin(this.wobbleTimer * 5.0) * 0.07;
        model.position.y = Math.abs(Math.cos(this.wobbleTimer * 5.0)) * 0.04;
        break;
      case 'elite': // Goliath: slow imposing hover & halo spin
        model.position.y = Math.sin(this.wobbleTimer * 3.5) * 0.04;
        if (this.haloMesh) {
          this.haloMesh.rotation.z += deltaTime * 2.5;
        }
        break;
      }
    }

    // 2. Individual hit flash countdown
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        if (this.bodyMesh && this.baseMaterial) {
          this.bodyMesh.material = this.baseMaterial;
        }
      }
    }

    // 3. Freeze timer countdown
    if (this.freezeTimer > 0) {
      this.freezeTimer -= deltaTime;
      if (this.freezeTimer < 0) this.freezeTimer = 0;
    }

    // 4. Chill timer countdown
    if (this.chillTimer > 0) {
      this.chillTimer -= deltaTime;
      if (this.chillTimer < 0) this.chillTimer = 0;
    }

    // 5. Burn DoT tick
    if (this.burnTimer > 0 && !this.isDead) {
      this.burnTimer -= deltaTime;
      this.burnTickTimer += deltaTime;
      if (this.burnTickTimer >= 0.5) {
        this.burnTickTimer = 0;
        this.takeDamage(Math.max(1, this.burnDps * 0.5));
      }
      if (this.burnTimer <= 0) {
        this.burnTimer = 0;
        this.burnDps = 0;
      }
    }
  }

  public applyFreeze(duration: number): void {
    if (this.isDead) return;
    this.freezeTimer = Math.max(this.freezeTimer, duration);
  }

  public applyBurn(duration: number, dps: number): void {
    if (this.isDead) return;
    this.burnTimer = Math.max(this.burnTimer, duration);
    this.burnDps = Math.max(this.burnDps, dps);
  }

  public applyChill(duration: number, slowFactor: number = 0.40): void {
    if (this.isDead) return;
    this.chillTimer = Math.max(this.chillTimer, duration);
    this.chillSlow = slowFactor;
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    this.hp -= amount;
    this.flashTimer = FX_CONFIG.hitFlash.duration;
    if (this.bodyMesh) {
      this.bodyMesh.material = EnemyVisualBuilder.getFlashMaterial();
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }

  public applyKnockback(dirX: number, dirZ: number, force: number): void {
    if (this.isDead) return;
    const resistance = this.type === 'elite' ? 0.2 : this.type === 'tank' ? 0.4 : 1.0;
    const effectiveForce = force * resistance;
    this.position.x += dirX * effectiveForce;
    this.position.z += dirZ * effectiveForce;
  }

  public getColor(): number {
    return this.originalColor;
  }

  public override dispose(): void {
    if (this.flashTimer > 0 && this.bodyMesh && this.baseMaterial) {
      this.flashTimer = 0;
      this.bodyMesh.material = this.baseMaterial;
    }
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.haloMesh = null;
  }
}
