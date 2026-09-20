import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import type { Disposable } from '../types';

export class PropBuilder implements Disposable {
  private group: THREE.Group;
  private trunkMesh: THREE.InstancedMesh | null = null;
  private foliageMesh: THREE.InstancedMesh | null = null;
  private rockMesh: THREE.InstancedMesh | null = null;

  constructor(arenaWidth: number, arenaDepth: number) {
    this.group = new THREE.Group();
    this.buildTrees(arenaWidth, arenaDepth);
    this.buildRocks(arenaWidth, arenaDepth);
  }

  private buildTrees(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;

    // Generate positions along the outer border of the arena (outside playing field)
    const treePositions: { x: number; z: number; scale: number }[] = [];
    const countPerSide = 7;
    const offsetDistance = 3.5;

    // North & South outer lines
    for (let i = 0; i < countPerSide; i++) {
      const t = (i / (countPerSide - 1)) * (width + 6) - (halfW + 3);
      treePositions.push({
        x: t + (Math.sin(i * 1.7) * 1.5),
        z: -(halfD + offsetDistance + Math.abs(Math.sin(i * 2.3)) * 2),
        scale: 0.85 + Math.abs(Math.sin(i * 3.1)) * 0.4,
      });
      treePositions.push({
        x: t + (Math.cos(i * 1.9) * 1.5),
        z: halfD + offsetDistance + Math.abs(Math.cos(i * 2.7)) * 2,
        scale: 0.85 + Math.abs(Math.cos(i * 2.9)) * 0.4,
      });
    }

    // East & West outer lines
    for (let i = 1; i < countPerSide - 1; i++) {
      const t = (i / (countPerSide - 1)) * (depth + 6) - (halfD + 3);
      treePositions.push({
        x: -(halfW + offsetDistance + Math.abs(Math.cos(i * 1.4)) * 2),
        z: t + (Math.sin(i * 2.1) * 1.5),
        scale: 0.85 + Math.abs(Math.sin(i * 1.8)) * 0.4,
      });
      treePositions.push({
        x: halfW + offsetDistance + Math.abs(Math.sin(i * 2.5)) * 2,
        z: t + (Math.cos(i * 2.1) * 1.5),
        scale: 0.85 + Math.abs(Math.cos(i * 2.2)) * 0.4,
      });
    }

    const totalTrees = treePositions.length;

    // Trunks: low-poly 5-sided cylinder
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.2, 5);
    trunkGeo.translate(0, 1.1, 0);
    const trunkMat = ToonMaterialFactory.getMaterial(PALETTE.environment.treeWood);
    this.trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);
    this.trunkMesh.castShadow = true;
    this.trunkMesh.receiveShadow = true;

    // Foliage: faceted low-poly dodecahedron
    const foliageGeo = new THREE.DodecahedronGeometry(1.6, 0);
    foliageGeo.translate(0, 2.8, 0);
    const foliageMat = ToonMaterialFactory.getMaterial(PALETTE.environment.treeFoliageA);
    this.foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, totalTrees);
    this.foliageMesh.castShadow = true;
    this.foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < totalTrees; i++) {
      const pt = treePositions[i]!;
      dummy.position.set(pt.x, 0, pt.z);
      dummy.rotation.y = (i * 1.15) % (Math.PI * 2);
      dummy.scale.set(pt.scale, pt.scale * (0.9 + Math.sin(i) * 0.2), pt.scale);
      dummy.updateMatrix();

      this.trunkMesh.setMatrixAt(i, dummy.matrix);
      this.foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    this.trunkMesh.instanceMatrix.needsUpdate = true;
    this.foliageMesh.instanceMatrix.needsUpdate = true;

    this.group.add(this.trunkMesh);
    this.group.add(this.foliageMesh);
  }

  private buildRocks(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;

    const rockPositions: { x: number; z: number; scale: number; rotY: number }[] = [];
    const corners = [
      { cx: -halfW, cz: -halfD },
      { cx: halfW, cz: -halfD },
      { cx: -halfW, cz: halfD },
      { cx: halfW, cz: halfD },
    ];

    // Cluster 3 rocks per corner outside the border
    corners.forEach((corner, cIdx) => {
      for (let r = 0; r < 3; r++) {
        const angle = (r / 3) * Math.PI * 0.5 + (cIdx * Math.PI * 0.5);
        const dist = 2.0 + r * 1.2;
        rockPositions.push({
          x: corner.cx + Math.cos(angle) * dist,
          z: corner.cz + Math.sin(angle) * dist,
          scale: 0.7 + Math.random() * 0.6,
          rotY: Math.random() * Math.PI * 2,
        });
      }
    });

    const totalRocks = rockPositions.length;
    const rockGeo = new THREE.DodecahedronGeometry(1.1, 0);
    rockGeo.scale(1.2, 0.8, 1.0);
    rockGeo.translate(0, 0.4, 0);
    const rockMat = ToonMaterialFactory.getMaterial(PALETTE.environment.rockDark);

    this.rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, totalRocks);
    this.rockMesh.castShadow = true;
    this.rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < totalRocks; i++) {
      const rk = rockPositions[i]!;
      dummy.position.set(rk.x, 0, rk.z);
      dummy.rotation.set(0.1, rk.rotY, 0.05);
      dummy.scale.set(rk.scale, rk.scale, rk.scale);
      dummy.updateMatrix();

      this.rockMesh.setMatrixAt(i, dummy.matrix);
    }

    this.rockMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.rockMesh);
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
    if (this.trunkMesh) {
      this.trunkMesh.geometry.dispose();
    }
    if (this.foliageMesh) {
      this.foliageMesh.geometry.dispose();
    }
    if (this.rockMesh) {
      this.rockMesh.geometry.dispose();
    }
    this.group.clear();
  }
}
