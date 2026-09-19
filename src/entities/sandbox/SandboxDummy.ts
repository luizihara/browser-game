import * as THREE from 'three';
import { Entity } from '../Entity';
import { SANDBOX_CONFIG } from '../../config/sandboxConfig';

export class SandboxDummy extends Entity {
  private baseY: number;
  private animTimer: number = Math.random() * Math.PI * 2; // Offset phase so all dummies don't move in lockstep

  constructor(x: number = 0, z: number = 0) {
    const geo = new THREE.BoxGeometry(
      SANDBOX_CONFIG.dummy.width,
      SANDBOX_CONFIG.dummy.height,
      SANDBOX_CONFIG.dummy.depth
    );
    const mat = new THREE.MeshStandardMaterial({
      color: SANDBOX_CONFIG.dummy.color,
      roughness: SANDBOX_CONFIG.dummy.roughness,
      metalness: SANDBOX_CONFIG.dummy.metalness,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    super(mesh);

    this.baseY = SANDBOX_CONFIG.dummy.height / 2;
    this.position.set(x, this.baseY, z);
  }

  public override update(deltaTime: number): void {
    this.animTimer += deltaTime;
    this.position.y =
      this.baseY +
      Math.sin(this.animTimer * SANDBOX_CONFIG.dummy.bobFrequency) *
        SANDBOX_CONFIG.dummy.bobAmplitude;

    this.mesh.rotation.y += deltaTime * 1.5;
  }
}
