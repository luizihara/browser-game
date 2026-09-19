import * as THREE from 'three';
import { Entity } from '../Entity';
import { PLAYER_CONFIG } from '../../config/playerConfig';

export class Player extends Entity {
  public speed: number = PLAYER_CONFIG.speed;
  public hp: number = PLAYER_CONFIG.maxHp;
  public maxHp: number = PLAYER_CONFIG.maxHp;
  public radius: number = PLAYER_CONFIG.radius;
  private invulnerableTimer: number = 0;
  private bodyMaterial: THREE.MeshStandardMaterial;

  constructor() {
    const group = new THREE.Group();

    // Body: Capsule
    const cylinderHeight = Math.max(0.1, PLAYER_CONFIG.height - PLAYER_CONFIG.radius * 2);
    const bodyGeo = new THREE.CapsuleGeometry(PLAYER_CONFIG.radius, cylinderHeight, 16, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: PLAYER_CONFIG.color,
      roughness: 0.3,
      metalness: 0.2,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Visor/Direction indicator to show facing orientation
    const visorGeo = new THREE.BoxGeometry(
      PLAYER_CONFIG.visorSize.width,
      PLAYER_CONFIG.visorSize.height,
      PLAYER_CONFIG.visorSize.depth
    );
    const visorMat = new THREE.MeshStandardMaterial({
      color: PLAYER_CONFIG.accentColor,
      roughness: 0.2,
      metalness: 0.8,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, PLAYER_CONFIG.visorOffsetY, -PLAYER_CONFIG.radius);
    visorMesh.castShadow = true;
    group.add(visorMesh);

    super(group);

    this.bodyMaterial = bodyMat;

    this.position.set(
      PLAYER_CONFIG.initialPosition.x,
      PLAYER_CONFIG.initialPosition.y,
      PLAYER_CONFIG.initialPosition.z
    );
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.hp <= 0) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = PLAYER_CONFIG.invulnerabilityDuration;

    return true;
  }

  public isInvulnerable(): boolean {
    return this.invulnerableTimer > 0;
  }

  public resetHp(): void {
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;
    this.bodyMaterial.color.setHex(PLAYER_CONFIG.color);
  }

  public override update(deltaTime: number): void {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;

      // Visual flash effect during i-frames
      const flash = Math.floor(this.invulnerableTimer * 16) % 2 === 0;
      this.bodyMaterial.color.setHex(
        flash ? PLAYER_CONFIG.damageFlashColor : PLAYER_CONFIG.color
      );

      if (this.invulnerableTimer <= 0) {
        this.invulnerableTimer = 0;
        this.bodyMaterial.color.setHex(PLAYER_CONFIG.color);
      }
    }
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
