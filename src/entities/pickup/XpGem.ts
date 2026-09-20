import * as THREE from 'three';
import { Entity } from '../Entity';
import { EXPERIENCE_CONFIG } from '../../config/experienceConfig';

export class XpGem extends Entity {
  public amount: number;
  public isCollected: boolean = false;
  public isAttracted: boolean = false;
  private baseY: number;
  private animTimer: number = Math.random() * Math.PI * 2;

  constructor(x: number, z: number, amount: number = EXPERIENCE_CONFIG.defaultGemXp) {
    const geo = new THREE.OctahedronGeometry(EXPERIENCE_CONFIG.gemSize, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: EXPERIENCE_CONFIG.gemColor,
      emissive: EXPERIENCE_CONFIG.gemEmissive,
      emissiveIntensity: EXPERIENCE_CONFIG.gemEmissiveIntensity,
      roughness: 0.2,
      metalness: 0.8,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    super(mesh);

    this.amount = amount;
    this.baseY = 0.35;
    this.position.set(x, this.baseY, z);
  }

  public attractTowards(
    targetX: number,
    targetY: number,
    targetZ: number,
    deltaTime: number
  ): boolean {
    this.isAttracted = true;

    const dx = targetX - this.position.x;
    const dy = targetY - this.position.y;
    const dz = targetZ - this.position.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    // Collected threshold
    if (distSq < 0.36) { // 0.6 * 0.6
      this.isCollected = true;
      return true;
    }

    const dist = Math.sqrt(distSq);
    const step = EXPERIENCE_CONFIG.magnetSpeed * deltaTime;
    const factor = Math.min(step / dist, 1.0);

    this.position.x += dx * factor;
    this.position.y += dy * factor;
    this.position.z += dz * factor;

    // Rotate faster while flying to player
    this.mesh.rotation.y += deltaTime * 6.0;

    return false;
  }

  public override update(deltaTime: number): void {
    if (this.isCollected) return;

    if (!this.isAttracted) {
      this.animTimer += deltaTime;
      this.position.y =
        this.baseY +
        Math.sin(this.animTimer * EXPERIENCE_CONFIG.bobFrequency) *
          EXPERIENCE_CONFIG.bobAmplitude;
      this.mesh.rotation.y += deltaTime * EXPERIENCE_CONFIG.rotationSpeed;
    }
  }
}
