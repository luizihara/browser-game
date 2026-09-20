import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import type { Disposable } from '../types';

export class PropBuilder implements Disposable {
  private group: THREE.Group;
  private meshes: THREE.InstancedMesh[] = [];

  constructor(arenaWidth: number, arenaDepth: number) {
    this.group = new THREE.Group();

    this.buildPerimeterTrees(arenaWidth, arenaDepth);
    this.buildCornerRocks(arenaWidth, arenaDepth);
    this.buildInteriorGrassTufts(arenaWidth, arenaDepth);
    this.buildWildflowers(arenaWidth, arenaDepth);
    this.buildAncientPillars(arenaWidth, arenaDepth);
    this.buildCentralCobblestones();
    this.buildGlowingMushrooms(arenaWidth, arenaDepth);
    this.buildFieldBoulders(arenaWidth, arenaDepth);
  }

  private registerInstancedMesh(mesh: THREE.InstancedMesh): void {
    mesh.instanceMatrix.needsUpdate = true;
    this.meshes.push(mesh);
    this.group.add(mesh);
  }

  private buildPerimeterTrees(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const treePositions: { x: number; z: number; scale: number; rotY: number }[] = [];
    const countPerSide = 10;
    const offsetDistance = 3.2;

    // North & South outer lines
    for (let i = 0; i < countPerSide; i++) {
      const t = (i / (countPerSide - 1)) * (width + 8) - (halfW + 4);
      treePositions.push({
        x: t + Math.sin(i * 1.7) * 1.5,
        z: -(halfD + offsetDistance + Math.abs(Math.sin(i * 2.3)) * 2.5),
        scale: 0.85 + Math.abs(Math.sin(i * 3.1)) * 0.45,
        rotY: i * 0.8,
      });
      treePositions.push({
        x: t + Math.cos(i * 1.9) * 1.5,
        z: halfD + offsetDistance + Math.abs(Math.cos(i * 2.7)) * 2.5,
        scale: 0.85 + Math.abs(Math.cos(i * 2.9)) * 0.45,
        rotY: i * 1.2,
      });
    }

    // East & West outer lines
    for (let i = 1; i < countPerSide - 1; i++) {
      const t = (i / (countPerSide - 1)) * (depth + 8) - (halfD + 4);
      treePositions.push({
        x: -(halfW + offsetDistance + Math.abs(Math.cos(i * 1.4)) * 2.5),
        z: t + Math.sin(i * 2.1) * 1.5,
        scale: 0.85 + Math.abs(Math.sin(i * 1.8)) * 0.45,
        rotY: i * 0.9,
      });
      treePositions.push({
        x: halfW + offsetDistance + Math.abs(Math.sin(i * 2.5)) * 2.5,
        z: t + Math.cos(i * 2.1) * 1.5,
        scale: 0.85 + Math.abs(Math.cos(i * 2.2)) * 0.45,
        rotY: i * 1.1,
      });
    }

    const totalTrees = treePositions.length;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.48, 2.4, 5);
    trunkGeo.translate(0, 1.2, 0);
    const trunkMat = ToonMaterialFactory.getMaterial(PALETTE.environment.treeWood);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;

    const foliageGeo = new THREE.DodecahedronGeometry(1.65, 0);
    foliageGeo.translate(0, 2.9, 0);
    const foliageMat = ToonMaterialFactory.getMaterial(PALETTE.environment.treeFoliageA);
    const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, totalTrees);
    foliageMesh.castShadow = true;
    foliageMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalTrees; i++) {
      const pt = treePositions[i]!;
      dummy.position.set(pt.x, 0, pt.z);
      dummy.rotation.set(0, pt.rotY, 0);
      dummy.scale.set(pt.scale, pt.scale * (0.9 + Math.sin(i) * 0.2), pt.scale);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(trunkMesh);
    this.registerInstancedMesh(foliageMesh);
  }

  private buildCornerRocks(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const corners = [
      { cx: -halfW, cz: -halfD },
      { cx: halfW, cz: -halfD },
      { cx: -halfW, cz: halfD },
      { cx: halfW, cz: halfD },
    ];

    const rockPositions: { x: number; z: number; scale: number; rotY: number }[] = [];
    corners.forEach((corner, cIdx) => {
      for (let r = 0; r < 4; r++) {
        const angle = (r / 4) * Math.PI * 0.5 + cIdx * Math.PI * 0.5;
        const dist = 2.2 + r * 1.3;
        rockPositions.push({
          x: corner.cx + Math.cos(angle) * dist,
          z: corner.cz + Math.sin(angle) * dist,
          scale: 0.8 + Math.abs(Math.sin(r * 2.1)) * 0.7,
          rotY: r * 1.3,
        });
      }
    });

    const total = rockPositions.length;
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    rockGeo.scale(1.2, 0.75, 1.0);
    rockGeo.translate(0, 0.45, 0);
    const rockMat = ToonMaterialFactory.getMaterial(PALETTE.environment.rockDark);

    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, total);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const rk = rockPositions[i]!;
      dummy.position.set(rk.x, 0, rk.z);
      dummy.rotation.set(0.1, rk.rotY, 0.05);
      dummy.scale.set(rk.scale, rk.scale, rk.scale);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(rockMesh);
  }

  private buildInteriorGrassTufts(width: number, depth: number): void {
    const totalTufts = 140;
    const halfW = width * 0.44;
    const halfD = depth * 0.44;

    const bladeGeo = new THREE.ConeGeometry(0.08, 0.42, 3);
    bladeGeo.translate(0, 0.21, 0);
    const grassMat = ToonMaterialFactory.getMaterial(PALETTE.environment.grassBlade);
    const grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, totalTufts);
    grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalTufts; i++) {
      // Deterministic pseudo-random distribution avoiding center spawn point
      const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const seed2 = Math.cos(i * 4.1414 + 13.371) * 23421.6312;
      const rX = ((seed1 - Math.floor(seed1)) * 2 - 1) * halfW;
      const rZ = ((seed2 - Math.floor(seed2)) * 2 - 1) * halfD;

      dummy.position.set(rX, 0, rZ);
      dummy.rotation.set(
        (Math.sin(i * 2.1) * 0.2),
        i * 0.7,
        (Math.cos(i * 1.7) * 0.2)
      );
      const s = 0.75 + Math.abs(Math.sin(i * 3.7)) * 0.5;
      dummy.scale.set(s, s * (1.0 + Math.cos(i) * 0.3), s);
      dummy.updateMatrix();

      grassMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(grassMesh);
  }

  private buildWildflowers(width: number, depth: number): void {
    const totalFlowers = 75;
    const halfW = width * 0.42;
    const halfD = depth * 0.42;

    const flowerGeo = new THREE.DodecahedronGeometry(0.14, 0);
    flowerGeo.translate(0, 0.16, 0);

    const colors = [
      PALETTE.environment.flowerGold,
      PALETTE.environment.flowerBlue,
      PALETTE.environment.flowerPink,
    ];

    colors.forEach((col, cIdx) => {
      const count = Math.floor(totalFlowers / 3);
      const flowerMat = ToonMaterialFactory.getMaterial(col);
      const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, count);
      flowerMesh.receiveShadow = true;

      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i++) {
        const seed = Math.sin((i * 3 + cIdx) * 17.13) * 31415.92;
        const seedZ = Math.cos((i * 3 + cIdx) * 23.41) * 27182.81;
        const x = ((seed - Math.floor(seed)) * 2 - 1) * halfW;
        const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

        dummy.position.set(x, 0, z);
        dummy.rotation.set(0, (i + cIdx) * 1.5, 0);
        const s = 0.85 + Math.abs(Math.sin(i * 2.3)) * 0.4;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();

        flowerMesh.setMatrixAt(i, dummy.matrix);
      }

      this.registerInstancedMesh(flowerMesh);
    });
  }

  private buildAncientPillars(width: number, depth: number): void {
    const pillarPositions = [
      { x: -width * 0.28, z: -depth * 0.28, h: 2.6, broken: false },
      { x: width * 0.28, z: -depth * 0.28, h: 1.8, broken: true },
      { x: -width * 0.28, z: depth * 0.28, h: 1.9, broken: true },
      { x: width * 0.28, z: depth * 0.28, h: 2.8, broken: false },
      { x: -width * 0.18, z: 0, h: 1.5, broken: true },
      { x: width * 0.18, z: 0, h: 2.4, broken: false },
      { x: 0, z: -depth * 0.18, h: 2.2, broken: false },
      { x: 0, z: depth * 0.18, h: 1.4, broken: true },
    ];

    const total = pillarPositions.length;
    const pillarGeo = new THREE.CylinderGeometry(0.55, 0.65, 2.0, 6);
    pillarGeo.translate(0, 1.0, 0);
    const pillarMat = ToonMaterialFactory.getMaterial(PALETTE.environment.wallRuin);
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, total);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const p = pillarPositions[i]!;
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(p.broken ? 0.08 : 0, i * 0.78, p.broken ? -0.06 : 0);
      dummy.scale.set(1.0, p.h / 2.0, 1.0);
      dummy.updateMatrix();
      pillarMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(pillarMesh);
  }

  private buildCentralCobblestones(): void {
    const stonePositions: { x: number; z: number; scale: number; rotY: number }[] = [];
    const ringCount = 18;
    const radius = 5.2;

    // Inner ritual ring
    for (let i = 0; i < ringCount; i++) {
      const angle = (i / ringCount) * Math.PI * 2;
      stonePositions.push({
        x: Math.cos(angle) * radius + (Math.sin(i * 2) * 0.2),
        z: Math.sin(angle) * radius + (Math.cos(i * 2) * 0.2),
        scale: 0.9 + Math.abs(Math.sin(i)) * 0.3,
        rotY: angle,
      });
    }

    // Secondary outer ring
    const outerCount = 24;
    const outerRadius = 8.5;
    for (let i = 0; i < outerCount; i++) {
      const angle = (i / outerCount) * Math.PI * 2;
      stonePositions.push({
        x: Math.cos(angle) * outerRadius + (Math.sin(i * 1.5) * 0.3),
        z: Math.sin(angle) * outerRadius + (Math.cos(i * 1.5) * 0.3),
        scale: 0.85 + Math.abs(Math.cos(i)) * 0.3,
        rotY: angle + 0.3,
      });
    }

    const total = stonePositions.length;
    const stoneGeo = new THREE.CylinderGeometry(0.5, 0.58, 0.08, 6);
    stoneGeo.translate(0, 0.04, 0);
    const stoneMat = ToonMaterialFactory.getMaterial(PALETTE.environment.pavingStone);
    const stoneMesh = new THREE.InstancedMesh(stoneGeo, stoneMat, total);
    stoneMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const st = stonePositions[i]!;
      dummy.position.set(st.x, 0, st.z);
      dummy.rotation.set(0, st.rotY, 0);
      dummy.scale.set(st.scale, 1.0, st.scale);
      dummy.updateMatrix();
      stoneMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(stoneMesh);
  }

  private buildGlowingMushrooms(width: number, depth: number): void {
    const totalMushrooms = 26;
    const halfW = width * 0.38;
    const halfD = depth * 0.38;

    const stemGeo = new THREE.CylinderGeometry(0.04, 0.07, 0.3, 5);
    stemGeo.translate(0, 0.15, 0);
    const stemMat = ToonMaterialFactory.getMaterial(PALETTE.environment.mushroomStem);
    const stemMesh = new THREE.InstancedMesh(stemGeo, stemMat, totalMushrooms);

    const capGeo = new THREE.ConeGeometry(0.18, 0.16, 6);
    capGeo.translate(0, 0.32, 0);
    const capMat = ToonMaterialFactory.getMaterial(PALETTE.environment.mushroomCap, {
      emissive: PALETTE.environment.mushroomCap,
      emissiveIntensity: 0.8,
    });
    const capMesh = new THREE.InstancedMesh(capGeo, capMat, totalMushrooms);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalMushrooms; i++) {
      const seedX = Math.sin(i * 37.19) * 12345.67;
      const seedZ = Math.cos(i * 41.53) * 98765.43;
      const x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.15, i * 1.1, Math.cos(i) * 0.15);
      const s = 0.8 + Math.abs(Math.sin(i * 2.5)) * 0.45;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      stemMesh.setMatrixAt(i, dummy.matrix);
      capMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(stemMesh);
    this.registerInstancedMesh(capMesh);
  }

  private buildFieldBoulders(width: number, depth: number): void {
    const totalBoulders = 30;
    const halfW = width * 0.42;
    const halfD = depth * 0.42;

    const rockGeo = new THREE.DodecahedronGeometry(0.7, 0);
    rockGeo.scale(1.1, 0.7, 1.0);
    rockGeo.translate(0, 0.25, 0);
    const rockMat = ToonMaterialFactory.getMaterial(PALETTE.environment.rockLight);
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, totalBoulders);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalBoulders; i++) {
      const seedX = Math.sin(i * 53.17) * 78912.34;
      const seedZ = Math.cos(i * 61.29) * 45678.91;
      const x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(0.1, i * 1.3, 0.08);
      const s = 0.65 + Math.abs(Math.sin(i * 2.2)) * 0.55;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      rockMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(rockMesh);
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  public dispose(): void {
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i]!.geometry.dispose();
    }
    this.meshes = [];
    this.group.clear();
  }
}
