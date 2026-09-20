import * as THREE from 'three';
import { Entity } from '../Entity';
import { ENEMY_CONFIG, type EnemyType } from '../../config/enemyConfig';
import type { GemTier } from '../../config/experienceConfig';
import { FX_CONFIG } from '../../config/fxConfig';

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

  private haloMesh: THREE.Mesh | null = null;
  private bodyMaterial: THREE.MeshStandardMaterial;
  private originalColor: number;
  private flashTimer: number = 0;

  constructor(
    x: number = 0,
    z: number = 0,
    type: EnemyType = 'basic',
    multipliers?: EnemyStatMultipliers
  ) {
    const group = new THREE.Group();
    const cfg = ENEMY_CONFIG[type];

    const hpMult = multipliers?.hp ?? 1.0;
    const dmgMult = multipliers?.damage ?? 1.0;
    const spdMult = multipliers?.speed ?? 1.0;

    const cylinderHeight = Math.max(0.1, cfg.height - cfg.radius * 2);

    // Main Body: 3D Capsule Geometry
    const bodyGeo = new THREE.CapsuleGeometry(cfg.radius, cylinderHeight, 12, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      roughness: cfg.roughness,
      metalness: cfg.metalness,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Glowing Eyes / Visor indicator
    const eyeWidth = cfg.radius * 0.7;
    const eyeHeight = 0.12 * (cfg.height / 1.2);
    const eyeDepth = 0.12;
    const eyeGeo = new THREE.BoxGeometry(eyeWidth, eyeHeight, eyeDepth);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: cfg.accentColor,
      emissive: cfg.accentColor,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5,
    });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, cfg.height * 0.15, -cfg.radius);
    group.add(eyeMesh);

    // Archetype-specific primitive decorations
    if (type === 'tank') {
      // Bulky side shoulder armor plates
      const padGeo = new THREE.BoxGeometry(0.3, 0.5, 0.4);
      const padMat = new THREE.MeshStandardMaterial({
        color: 0x2e1065,
        roughness: 0.7,
        metalness: 0.3,
      });

      const leftPad = new THREE.Mesh(padGeo, padMat);
      leftPad.position.set(-cfg.radius * 0.9, 0.1, 0);
      group.add(leftPad);

      const rightPad = new THREE.Mesh(padGeo, padMat);
      rightPad.position.set(cfg.radius * 0.9, 0.1, 0);
      group.add(rightPad);
    } else if (type === 'elite') {
      // Golden Crown / Halo floating above head
      const haloGeo = new THREE.TorusGeometry(cfg.radius * 0.7, 0.08, 8, 24);
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.2,
        roughness: 0.1,
        metalness: 0.8,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, cfg.height / 2 + 0.35, 0);
      group.add(halo);
      // Saved for rotation in update
      // We will assign haloMesh after super()
    }

    super(group);

    this.bodyMaterial = bodyMat;
    this.originalColor = cfg.color;

    this.type = type;
    this.maxHp = Math.round(cfg.maxHp * hpMult);
    this.hp = this.maxHp;
    this.damage = Math.round(cfg.damage * dmgMult);
    this.speed = cfg.speed * spdMult;
    this.radius = cfg.radius;
    this.xpReward = cfg.xpReward;
    this.gemTier = cfg.gemTier;

    if (type === 'elite') {
      // Find halo mesh in group
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.TorusGeometry) {
          this.haloMesh = child;
        }
      });
    }

    const initialY = cfg.height / 2;
    this.position.set(x, initialY, z);
  }

  public override update(deltaTime: number): void {
    if (this.haloMesh) {
      this.haloMesh.rotation.z += deltaTime * 2.0;
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        this.bodyMaterial.color.setHex(this.originalColor);
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    this.hp -= amount;
    this.flashTimer = FX_CONFIG.hitFlash.duration;
    this.bodyMaterial.color.setHex(FX_CONFIG.hitFlash.color);

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }

  public getColor(): number {
    return this.originalColor;
  }

  public override dispose(): void {
    if (this.flashTimer > 0) {
      this.flashTimer = 0;
      this.bodyMaterial.color.setHex(this.originalColor);
    }
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.haloMesh = null;
  }
}
