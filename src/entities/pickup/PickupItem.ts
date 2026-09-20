import * as THREE from 'three';
import { Entity } from '../Entity';
import { ToonMaterialFactory } from '../../art/ToonMaterialFactory';

export type PickupType = 'chest' | 'potion' | 'vacuum' | 'bomb';

export class PickupItem extends Entity {
  public readonly pickupType: PickupType;
  public isCollected: boolean = false;
  public isAttracted: boolean = false;
  private baseY: number;
  private animTimer: number = Math.random() * Math.PI * 2;
  private ringMesh: THREE.Mesh | null = null;

  constructor(x: number, z: number, type: PickupType) {
    const group = new THREE.Group();
    super(group);

    this.pickupType = type;

    switch (type) {
      case 'chest': {
        this.baseY = 0.45;
        // Chest base
        const baseMat = ToonMaterialFactory.getMaterial(0x854d0e);
        const baseGeo = new THREE.BoxGeometry(0.7, 0.35, 0.5);
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.175;
        baseMesh.castShadow = true;
        group.add(baseMesh);

        // Chest lid
        const lidGeo = new THREE.BoxGeometry(0.74, 0.18, 0.54);
        const lidMesh = new THREE.Mesh(lidGeo, baseMat);
        lidMesh.position.y = 0.4;
        lidMesh.castShadow = true;
        group.add(lidMesh);

        // Golden lock / latch
        const goldMat = ToonMaterialFactory.getMaterial(0xfbbf24, {
          emissive: 0xf59e0b,
          emissiveIntensity: 0.6,
        });
        const latchGeo = new THREE.BoxGeometry(0.16, 0.16, 0.08);
        const latchMesh = new THREE.Mesh(latchGeo, goldMat);
        latchMesh.position.set(0, 0.3, 0.27);
        group.add(latchMesh);
        break;
      }
      case 'potion': {
        this.baseY = 0.45;
        // Potion flask
        const flaskMat = ToonMaterialFactory.getMaterial(0xef4444, {
          emissive: 0xdc2626,
          emissiveIntensity: 0.8,
        });
        const flaskGeo = new THREE.CylinderGeometry(0.12, 0.28, 0.5, 6);
        const flaskMesh = new THREE.Mesh(flaskGeo, flaskMat);
        flaskMesh.position.y = 0.25;
        flaskMesh.castShadow = true;
        group.add(flaskMesh);

        // Cork
        const corkMat = ToonMaterialFactory.getMaterial(0xd97706);
        const corkGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.12, 6);
        const corkMesh = new THREE.Mesh(corkGeo, corkMat);
        corkMesh.position.y = 0.54;
        group.add(corkMesh);
        break;
      }
      case 'vacuum': {
        this.baseY = 0.5;
        // Cosmic orb
        const orbMat = ToonMaterialFactory.getMaterial(0x8b5cf6, {
          emissive: 0x38bdf8,
          emissiveIntensity: 0.9,
        });
        const orbGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const orbMesh = new THREE.Mesh(orbGeo, orbMat);
        orbMesh.position.y = 0.3;
        orbMesh.castShadow = true;
        group.add(orbMesh);

        // Torus orbit ring
        const ringMat = ToonMaterialFactory.getMaterial(0x38bdf8, {
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.8,
        });
        const ringGeo = new THREE.TorusGeometry(0.44, 0.04, 4, 12);
        this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
        this.ringMesh.position.y = 0.3;
        this.ringMesh.rotation.x = Math.PI / 3;
        group.add(this.ringMesh);
        break;
      }
      case 'bomb': {
        this.baseY = 0.45;
        // Radiant golden bomb
        const bombMat = ToonMaterialFactory.getMaterial(0x1e293b, {
          emissive: 0xf59e0b,
          emissiveIntensity: 0.4,
        });
        const bombGeo = new THREE.SphereGeometry(0.32, 8, 8);
        const bombMesh = new THREE.Mesh(bombGeo, bombMat);
        bombMesh.position.y = 0.32;
        bombMesh.castShadow = true;
        group.add(bombMesh);

        // Spark fuse
        const fuseMat = ToonMaterialFactory.getMaterial(0xfbbf24, {
          emissive: 0xf59e0b,
          emissiveIntensity: 1.0,
        });
        const fuseGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 4);
        const fuseMesh = new THREE.Mesh(fuseGeo, fuseMat);
        fuseMesh.position.y = 0.65;
        group.add(fuseMesh);
        break;
      }
    }

    this.position.set(x, this.baseY, z);
  }

  public override update(deltaTime: number): void {
    this.animTimer += deltaTime * 3.5;
    this.rotation.y += deltaTime * 2.2;

    if (this.ringMesh) {
      this.ringMesh.rotation.z += deltaTime * 4.0;
    }

    if (!this.isAttracted) {
      this.position.y = this.baseY + Math.sin(this.animTimer) * 0.12;
    }
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

    if (distSq < 0.4) {
      this.isCollected = true;
      return true;
    }

    const dist = Math.sqrt(distSq);
    const speed = 14.0 * deltaTime;
    const step = Math.min(dist, speed);

    this.position.x += (dx / dist) * step;
    this.position.y += (dy / dist) * step;
    this.position.z += (dz / dist) * step;

    return false;
  }
}
