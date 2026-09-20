import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import { PALETTE } from '../art/Palette';
import { ToonMaterialFactory } from '../art/ToonMaterialFactory';
import { clamp } from '../utils/math';
import type { Disposable } from '../types';

export class ArenaBounds implements Disposable {
  private group: THREE.Group;
  private wallMaterial: THREE.MeshToonMaterial;
  private pillarMaterial: THREE.MeshToonMaterial;

  constructor() {
    this.group = new THREE.Group();

    this.wallMaterial = ToonMaterialFactory.getMaterial(PALETTE.environment.wallStone);
    this.pillarMaterial = ToonMaterialFactory.getMaterial(PALETTE.environment.wallTop);

    this.createWalls();
    this.createCornerPillars();
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

  private createCornerPillars(): void {
    const halfW = WORLD_CONFIG.arenaWidth / 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2;
    const pillarH = WORLD_CONFIG.wallHeight * 1.5;
    const pillarGeo = new THREE.CylinderGeometry(0.7, 0.85, pillarH, 6);
    pillarGeo.translate(0, pillarH / 2, 0);

    const corners = [
      { x: -halfW, z: -halfD },
      { x: halfW, z: -halfD },
      { x: -halfW, z: halfD },
      { x: halfW, z: halfD },
    ];

    corners.forEach((c) => {
      const pillar = new THREE.Mesh(pillarGeo, this.pillarMaterial);
      pillar.position.set(c.x, 0, c.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.group.add(pillar);
    });
  }

  public get halfWidth(): number {
    return WORLD_CONFIG.arenaWidth / 2;
  }

  public get halfDepth(): number {
    return WORLD_CONFIG.arenaDepth / 2;
  }

  public get halfSize(): number {
    return Math.max(this.halfWidth, this.halfDepth);
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

  public applyBiomeMaterials(wallColor: number, pillarColor: number): void {
    const newWallMat = ToonMaterialFactory.getMaterial(wallColor);
    const newPillarMat = ToonMaterialFactory.getMaterial(pillarColor);
    this.wallMaterial = newWallMat;
    this.pillarMaterial = newPillarMat;

    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry instanceof THREE.CylinderGeometry) {
          child.material = newPillarMat;
        } else if (child.geometry instanceof THREE.BoxGeometry) {
          child.material = newWallMat;
        }
      }
    });
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
    this.group.clear();
  }
}
