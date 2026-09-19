import * as THREE from 'three';
import { Entity } from '../Entity';
import { ENEMY_CONFIG } from '../../config/enemyConfig';

export class Enemy extends Entity {
  public speed: number = ENEMY_CONFIG.basic.speed;
  public hp: number = ENEMY_CONFIG.basic.maxHp;
  public maxHp: number = ENEMY_CONFIG.basic.maxHp;
  public damage: number = ENEMY_CONFIG.basic.damage;
  public radius: number = ENEMY_CONFIG.basic.radius;
  public isDead: boolean = false;

  constructor(x: number = 0, z: number = 0) {
    const group = new THREE.Group();

    // Body: menacing dark red capsule
    const cylinderHeight = Math.max(
      0.1,
      ENEMY_CONFIG.basic.height - ENEMY_CONFIG.basic.radius * 2
    );
    const bodyGeo = new THREE.CapsuleGeometry(
      ENEMY_CONFIG.basic.radius,
      cylinderHeight,
      12,
      12
    );
    const bodyMat = new THREE.MeshStandardMaterial({
      color: ENEMY_CONFIG.basic.color,
      roughness: ENEMY_CONFIG.basic.roughness,
      metalness: ENEMY_CONFIG.basic.metalness,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Glowing eyes / front indicator
    const eyeGeo = new THREE.BoxGeometry(0.3, 0.1, 0.15);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: ENEMY_CONFIG.basic.accentColor,
      emissive: ENEMY_CONFIG.basic.accentColor,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.position.set(0, 0.2, -ENEMY_CONFIG.basic.radius);
    group.add(eyeMesh);

    super(group);

    const initialY = ENEMY_CONFIG.basic.height / 2;
    this.position.set(x, initialY, z);
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      return true;
    }
    return false;
  }

  public override dispose(): void {
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
  }
}
