import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import { clamp } from '../utils/math';
import type { Disposable } from '../types';

export class ArenaBounds implements Disposable {
  private group: THREE.Group;
  private wallMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.wallMaterial = new THREE.MeshStandardMaterial({
      color: WORLD_CONFIG.wallColor,
      emissive: WORLD_CONFIG.wallEmissive,
      emissiveIntensity: WORLD_CONFIG.wallEmissiveIntensity,
      roughness: 0.5,
      metalness: 0.3,
    });

    this.createWalls();
  }

  private createWalls(): void {
    const halfW = WORLD_CONFIG.arenaWidth / 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2;
    const h = WORLD_CONFIG.wallHeight;
    const t = WORLD_CONFIG.wallThickness;
    const yPos = h / 2;

    // North & South walls (width along X)
    const horizGeo = new THREE.BoxGeometry(WORLD_CONFIG.arenaWidth + t, h, t);

    const northWall = new THREE.Mesh(horizGeo, this.wallMaterial);
    northWall.position.set(0, yPos, -halfD);
    northWall.castShadow = true;
    northWall.receiveShadow = true;
    this.group.add(northWall);

    const southWall = new THREE.Mesh(horizGeo, this.wallMaterial);
    southWall.position.set(0, yPos, halfD);
    southWall.castShadow = true;
    southWall.receiveShadow = true;
    this.group.add(southWall);

    // East & West walls (depth along Z)
    const vertGeo = new THREE.BoxGeometry(t, h, WORLD_CONFIG.arenaDepth - t);

    const westWall = new THREE.Mesh(vertGeo, this.wallMaterial);
    westWall.position.set(-halfW, yPos, 0);
    westWall.castShadow = true;
    westWall.receiveShadow = true;
    this.group.add(westWall);

    const eastWall = new THREE.Mesh(vertGeo, this.wallMaterial);
    eastWall.position.set(halfW, yPos, 0);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    this.group.add(eastWall);
  }

  public clampPosition(position: THREE.Vector3, radius: number): void {
    const halfW = WORLD_CONFIG.arenaWidth / 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2;
    const margin = radius + WORLD_CONFIG.wallThickness / 2;

    position.x = clamp(position.x, -halfW + margin, halfW - margin);
    position.z = clamp(position.z, -halfD + margin, halfD - margin);
  }

  public isWithinBounds(position: THREE.Vector3, margin: number = 0): boolean {
    const halfW = WORLD_CONFIG.arenaWidth / 2 - margin;
    const halfD = WORLD_CONFIG.arenaDepth / 2 - margin;

    return (
      position.x >= -halfW &&
      position.x <= halfW &&
      position.z >= -halfD &&
      position.z <= halfD
    );
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  public dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.wallMaterial.dispose();
  }
}
