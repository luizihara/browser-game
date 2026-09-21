import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import type { StageId } from '../config/stageConfig';
import type { Disposable } from '../types';

export class PropBuilder implements Disposable {
  private group: THREE.Group;
  private meshes: THREE.InstancedMesh[] = [];

  constructor(arenaWidth: number, arenaDepth: number, biome: StageId = 'verdant') {
    this.group = new THREE.Group();
    this.buildForBiome(biome, arenaWidth, arenaDepth);
  }

  public buildForBiome(biome: StageId, width: number, depth: number): void {
    this.clear();

    // Universal core landmarks across all biomes
    this.buildCentralSanctuary(biome);
    this.buildSanctuaryGuardianStatues(biome);
    this.buildStonePathways(width, depth, biome);
    this.buildRunicMonoliths(width, depth, biome);
    this.buildFoliageBushes(width, depth, biome);

    switch (biome) {
      case 'verdant':
        this.buildPerimeterTrees(width, depth);
        this.buildCornerRocks(width, depth);
        this.buildInteriorGrassTufts(width, depth);
        this.buildWildflowers(width, depth);
        this.buildAncientPillars(width, depth);
        this.buildAncientRuinedArches(width, depth);
        this.buildCentralCobblestones();
        this.buildGlowingMushrooms(width, depth);
        this.buildFieldBoulders(width, depth);
        this.buildFairyCircles(width, depth);
        this.buildAncientKnightStatues(width, depth);
        break;

      case 'inferno':
        this.buildVolcanicSpires(width, depth);
        this.buildBasaltColumns(width, depth);
        this.buildMagmaGeodes(width, depth);
        this.buildCharredRocks(width, depth);
        this.buildVolcanicVents(width, depth);
        this.buildDeadwoodTrees(width, depth);
        this.buildAshMounds(width, depth);
        this.buildObsidianHorns(width, depth);
        this.buildMagmaCraters(width, depth);
        break;

      case 'glacial':
        this.buildSnowPines(width, depth);
        this.buildIceCrystals(width, depth);
        this.buildFrostMonoliths(width, depth);
        this.buildSnowDrifts(width, depth);
        this.buildFrozenRuins(width, depth);
        this.buildFrostGrass(width, depth);
        this.buildIceSpireClusters(width, depth);
        this.buildFrozenTombs(width, depth);
        break;
    }
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

  private buildVolcanicSpires(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const totalSpires = 32;

    const spireGeo = new THREE.ConeGeometry(0.5, 3.2, 5);
    spireGeo.translate(0, 1.6, 0);
    const spireMat = ToonMaterialFactory.getMaterial(0x1c1917);
    const spireMesh = new THREE.InstancedMesh(spireGeo, spireMat, totalSpires);
    spireMesh.castShadow = true;
    spireMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalSpires; i++) {
      const angle = (i / totalSpires) * Math.PI * 2;
      const r = Math.min(halfW, halfD) * (0.8 + Math.abs(Math.sin(i * 3.7)) * 0.25);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const s = 0.8 + Math.abs(Math.cos(i * 2.1)) * 0.6;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.15, i * 0.9, Math.cos(i) * 0.15);
      dummy.scale.set(s, s * 1.3, s);
      dummy.updateMatrix();
      spireMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(spireMesh);
  }

  private buildBasaltColumns(width: number, depth: number): void {
    const halfW = width * 0.42;
    const halfD = depth * 0.42;
    const totalCols = 24;

    const colGeo = new THREE.CylinderGeometry(0.45, 0.45, 2.2, 6);
    colGeo.translate(0, 1.1, 0);
    const colMat = ToonMaterialFactory.getMaterial(0x292524);
    const colMesh = new THREE.InstancedMesh(colGeo, colMat, totalCols);
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalCols; i++) {
      const x = ((Math.sin(i * 47.1) * 1000) % 1) * halfW * 1.8 - halfW * 0.9;
      const z = ((Math.cos(i * 39.3) * 1000) % 1) * halfD * 1.8 - halfD * 0.9;
      const s = 0.7 + Math.abs(Math.sin(i * 1.5)) * 0.5;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, i * 0.5, 0);
      dummy.scale.set(s, s * 0.9, s);
      dummy.updateMatrix();
      colMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(colMesh);
  }

  private buildMagmaGeodes(width: number, depth: number): void {
    const halfW = width * 0.44;
    const halfD = depth * 0.44;
    const totalGeodes = 36;

    const geo = new THREE.DodecahedronGeometry(0.45, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.2,
      roughness: 0.25,
    });
    const geodeMesh = new THREE.InstancedMesh(geo, mat, totalGeodes);
    geodeMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalGeodes; i++) {
      const x = ((Math.sin(i * 73.11) * 1000) % 1) * halfW * 1.8 - halfW * 0.9;
      const z = ((Math.cos(i * 81.17) * 1000) % 1) * halfD * 1.8 - halfD * 0.9;
      const s = 0.5 + Math.abs(Math.sin(i * 3.3)) * 0.5;

      dummy.position.set(x, 0.25, z);
      dummy.rotation.set(i * 0.4, i * 1.1, i * 0.7);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      geodeMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(geodeMesh);
  }

  private buildCharredRocks(width: number, depth: number): void {
    const halfW = width * 0.45;
    const halfD = depth * 0.45;
    const totalRocks = 30;

    const geo = new THREE.DodecahedronGeometry(0.65, 0);
    geo.scale(1.2, 0.6, 1.0);
    const mat = ToonMaterialFactory.getMaterial(0x0c0a09);
    const rockMesh = new THREE.InstancedMesh(geo, mat, totalRocks);
    rockMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalRocks; i++) {
      const x = ((Math.sin(i * 29.13) * 1000) % 1) * halfW * 1.8 - halfW * 0.9;
      const z = ((Math.cos(i * 31.19) * 1000) % 1) * halfD * 1.8 - halfD * 0.9;
      const s = 0.6 + Math.abs(Math.cos(i * 2.5)) * 0.6;

      dummy.position.set(x, 0.2, z);
      dummy.rotation.set(0.1, i * 1.4, 0.05);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      rockMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(rockMesh);
  }

  private buildSnowPines(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const totalTrees = 36;

    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.4, 2.2, 5);
    trunkGeo.translate(0, 1.1, 0);
    const trunkMat = ToonMaterialFactory.getMaterial(0x1e293b);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, totalTrees);

    const foliageGeo = new THREE.ConeGeometry(1.5, 3.2, 5);
    foliageGeo.translate(0, 2.8, 0);
    const foliageMat = ToonMaterialFactory.getMaterial(0xe0f2fe);
    const foliageMesh = new THREE.InstancedMesh(foliageGeo, foliageMat, totalTrees);
    foliageMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalTrees; i++) {
      const angle = (i / totalTrees) * Math.PI * 2;
      const r = Math.min(halfW, halfD) * (0.85 + Math.abs(Math.sin(i * 2.3)) * 0.2);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const s = 0.8 + Math.abs(Math.sin(i * 1.7)) * 0.45;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, i * 0.7, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      trunkMesh.setMatrixAt(i, dummy.matrix);
      foliageMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(trunkMesh);
    this.registerInstancedMesh(foliageMesh);
  }

  private buildIceCrystals(width: number, depth: number): void {
    const halfW = width * 0.44;
    const halfD = depth * 0.44;
    const totalCrystals = 34;

    const geo = new THREE.ConeGeometry(0.35, 1.8, 5);
    geo.translate(0, 0.9, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.35,
    });
    const crystalMesh = new THREE.InstancedMesh(geo, mat, totalCrystals);
    crystalMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalCrystals; i++) {
      const x = ((Math.sin(i * 61.7) * 1000) % 1) * halfW * 1.8 - halfW * 0.9;
      const z = ((Math.cos(i * 53.9) * 1000) % 1) * halfD * 1.8 - halfD * 0.9;
      const s = 0.6 + Math.abs(Math.sin(i * 2.9)) * 0.6;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.2, i * 1.3, Math.cos(i) * 0.2);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      crystalMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(crystalMesh);
  }

  private buildFrostMonoliths(width: number, depth: number): void {
    const halfW = width * 0.35;
    const halfD = depth * 0.35;
    const totalMonoliths = 10;

    const geo = new THREE.BoxGeometry(0.8, 3.2, 0.8);
    geo.translate(0, 1.6, 0);
    const mat = ToonMaterialFactory.getMaterial(0x0284c7);
    const mesh = new THREE.InstancedMesh(geo, mat, totalMonoliths);
    mesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalMonoliths; i++) {
      const angle = (i / totalMonoliths) * Math.PI * 2;
      const r = Math.min(halfW, halfD) * 0.75;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(0.08, i * 0.8, -0.08);
      dummy.scale.set(1.0, 0.8 + Math.abs(Math.sin(i)) * 0.6, 1.0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(mesh);
  }

  private buildSnowDrifts(width: number, depth: number): void {
    const halfW = width * 0.45;
    const halfD = depth * 0.45;
    const totalDrifts = 40;

    const geo = new THREE.DodecahedronGeometry(0.7, 1);
    geo.scale(1.4, 0.4, 1.2);
    const mat = ToonMaterialFactory.getMaterial(0xf0f9ff);
    const mesh = new THREE.InstancedMesh(geo, mat, totalDrifts);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalDrifts; i++) {
      const x = ((Math.sin(i * 89.3) * 1000) % 1) * halfW * 1.8 - halfW * 0.9;
      const z = ((Math.cos(i * 97.1) * 1000) % 1) * halfD * 1.8 - halfD * 0.9;
      const s = 0.7 + Math.abs(Math.sin(i * 1.8)) * 0.6;

      dummy.position.set(x, 0.1, z);
      dummy.rotation.set(0, i * 0.5, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(mesh);
  }

  private buildCentralSanctuary(biome: StageId): void {
    // 1. Raised Carved Stone Dais Base
    const daisGeo = new THREE.CylinderGeometry(5.8, 6.2, 0.14, 16);
    daisGeo.translate(0, 0.07, 0);
    const daisMat = ToonMaterialFactory.getMaterial(
      biome === 'inferno' ? 0x27272a : biome === 'glacial' ? 0x075985 : PALETTE.environment.pavingStone
    );
    const daisMesh = new THREE.InstancedMesh(daisGeo, daisMat, 1);
    daisMesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    dummy.position.set(0, 0, 0);
    dummy.updateMatrix();
    daisMesh.setMatrixAt(0, dummy.matrix);
    this.registerInstancedMesh(daisMesh);

    // 2. Inner Glowing Runic Inlay Ring
    const runeRingGeo = new THREE.RingGeometry(2.6, 3.4, 16);
    runeRingGeo.rotateX(-Math.PI / 2);
    runeRingGeo.translate(0, 0.15, 0);
    const runeColor = biome === 'inferno' ? 0xf97316 : biome === 'glacial' ? 0x38bdf8 : 0xfbbf24;
    const runeMat = ToonMaterialFactory.getMaterial(runeColor, {
      emissive: runeColor,
      emissiveIntensity: 0.9,
    });
    const runeMesh = new THREE.InstancedMesh(runeRingGeo, runeMat, 1);
    runeMesh.setMatrixAt(0, dummy.matrix);
    this.registerInstancedMesh(runeMesh);

    // 3. 4 Ancient Stone Braziers at Cardinal Points (N, S, E, W)
    const brazierPositions = [
      { x: 0, z: -5.0 },
      { x: 0, z: 5.0 },
      { x: -5.0, z: 0 },
      { x: 5.0, z: 0 },
    ];
    const pedestalGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.3, 6);
    pedestalGeo.translate(0, 0.65, 0);
    const pedestalMat = ToonMaterialFactory.getMaterial(
      biome === 'inferno' ? 0x18181b : biome === 'glacial' ? 0x0369a1 : PALETTE.environment.wallRuin
    );
    const pedestalMesh = new THREE.InstancedMesh(pedestalGeo, pedestalMat, 4);
    pedestalMesh.castShadow = true;
    pedestalMesh.receiveShadow = true;

    // Bowl
    const bowlGeo = new THREE.CylinderGeometry(0.55, 0.28, 0.35, 6);
    bowlGeo.translate(0, 1.45, 0);
    const bowlMesh = new THREE.InstancedMesh(bowlGeo, pedestalMat, 4);
    bowlMesh.castShadow = true;

    // Flame top
    const flameGeo = new THREE.ConeGeometry(0.24, 0.55, 5);
    flameGeo.translate(0, 1.85, 0);
    const flameMat = ToonMaterialFactory.getMaterial(runeColor, {
      emissive: runeColor,
      emissiveIntensity: 1.4,
    });
    const flameMesh = new THREE.InstancedMesh(flameGeo, flameMat, 4);

    for (let i = 0; i < 4; i++) {
      const pos = brazierPositions[i]!;
      dummy.position.set(pos.x, 0, pos.z);
      dummy.rotation.set(0, i * (Math.PI / 2), 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      pedestalMesh.setMatrixAt(i, dummy.matrix);
      bowlMesh.setMatrixAt(i, dummy.matrix);
      flameMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(pedestalMesh);
    this.registerInstancedMesh(bowlMesh);
    this.registerInstancedMesh(flameMesh);
  }

  private buildFoliageBushes(width: number, depth: number, biome: StageId): void {
    const totalBushes = 48;
    const halfW = width * 0.43;
    const halfD = depth * 0.43;

    // Low-poly bush cluster
    const bushGeo = new THREE.DodecahedronGeometry(0.7, 0);
    bushGeo.scale(1.2, 0.75, 1.1);
    bushGeo.translate(0, 0.4, 0);

    const bushColor =
      biome === 'inferno' ? 0x27272a : biome === 'glacial' ? 0x0284c7 : 0x16a34a;
    const bushMat = ToonMaterialFactory.getMaterial(bushColor);
    const bushMesh = new THREE.InstancedMesh(bushGeo, bushMat, totalBushes);
    bushMesh.castShadow = true;
    bushMesh.receiveShadow = true;

    const topGeo = new THREE.DodecahedronGeometry(0.48, 0);
    topGeo.translate(0.2, 0.65, 0.1);
    const topColor =
      biome === 'inferno' ? 0x44403c : biome === 'glacial' ? 0xf0f9ff : 0x22c55e;
    const topMat = ToonMaterialFactory.getMaterial(topColor);
    const topMesh = new THREE.InstancedMesh(topGeo, topMat, totalBushes);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalBushes; i++) {
      const seedX = Math.sin(i * 43.17 + 19.3) * 65432.1;
      const seedZ = Math.cos(i * 37.89 + 31.7) * 98765.4;
      let x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      let z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      const dist = Math.sqrt(x * x + z * z);
      if (dist < 7.5) {
        x += (x >= 0 ? 7.5 : -7.5);
        z += (z >= 0 ? 7.5 : -7.5);
      }

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.1, i * 1.3, Math.cos(i) * 0.1);
      const s = 0.75 + Math.abs(Math.sin(i * 2.7)) * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      bushMesh.setMatrixAt(i, dummy.matrix);
      topMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(bushMesh);
    this.registerInstancedMesh(topMesh);
  }

  private buildStonePathways(_width: number, _depth: number, biome: StageId): void {
    const totalStones = 72;
    const stoneGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.07, 6);
    stoneGeo.translate(0, 0.04, 0);

    const stoneColor =
      biome === 'inferno' ? 0x292524 : biome === 'glacial' ? 0x0369a1 : PALETTE.environment.pavingStone;
    const stoneMat = ToonMaterialFactory.getMaterial(stoneColor);
    const stoneMesh = new THREE.InstancedMesh(stoneGeo, stoneMat, totalStones);
    stoneMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;

    const dirs = [
      { dx: 1, dz: 0 },
      { dx: -1, dz: 0 },
      { dx: 0, dz: 1 },
      { dx: 0, dz: -1 },
    ];
    const stonesPerDir = 18;

    dirs.forEach((dir, dIdx) => {
      for (let step = 0; step < stonesPerDir; step++) {
        if (idx >= totalStones) break;
        const dist = 6.8 + step * 1.15;
        const jitter = Math.sin(step * 2.1 + dIdx) * 0.6;
        const x = dir.dx * dist + (dir.dz !== 0 ? jitter : 0);
        const z = dir.dz * dist + (dir.dx !== 0 ? jitter : 0);

        dummy.position.set(x, 0, z);
        dummy.rotation.set(0, (step + dIdx) * 0.8, 0);
        const s = 0.75 + Math.abs(Math.cos(step * 1.7)) * 0.45;
        dummy.scale.set(s, 1, s * (0.9 + Math.sin(step) * 0.2));
        dummy.updateMatrix();

        stoneMesh.setMatrixAt(idx++, dummy.matrix);
      }
    });

    this.registerInstancedMesh(stoneMesh);
  }

  private buildAncientRuinedArches(width: number, depth: number): void {
    const archPositions = [
      { x: -width * 0.26, z: depth * 0.22, rotY: 0.4 },
      { x: width * 0.26, z: -depth * 0.22, rotY: -0.6 },
    ];
    const totalArches = archPositions.length;

    const postGeo = new THREE.CylinderGeometry(0.5, 0.6, 3.4, 6);
    postGeo.translate(0, 1.7, 0);
    const stoneMat = ToonMaterialFactory.getMaterial(PALETTE.environment.wallRuin);
    const postMesh = new THREE.InstancedMesh(postGeo, stoneMat, totalArches * 2);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;

    const beamGeo = new THREE.BoxGeometry(3.6, 0.65, 0.75);
    beamGeo.translate(0, 3.6, 0);
    const beamMesh = new THREE.InstancedMesh(beamGeo, stoneMat, totalArches);
    beamMesh.castShadow = true;
    beamMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalArches; i++) {
      const arch = archPositions[i]!;
      const cosR = Math.cos(arch.rotY);
      const sinR = Math.sin(arch.rotY);

      dummy.position.set(arch.x - cosR * 1.3, 0, arch.z - sinR * 1.3);
      dummy.rotation.set(0, arch.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      postMesh.setMatrixAt(i * 2, dummy.matrix);

      dummy.position.set(arch.x + cosR * 1.3, 0, arch.z + sinR * 1.3);
      dummy.rotation.set(0, arch.rotY + 0.3, 0);
      dummy.scale.set(1, 0.95, 1);
      dummy.updateMatrix();
      postMesh.setMatrixAt(i * 2 + 1, dummy.matrix);

      dummy.position.set(arch.x, 0, arch.z);
      dummy.rotation.set(0.04, arch.rotY, -0.06);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beamMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(postMesh);
    this.registerInstancedMesh(beamMesh);
  }

  private buildVolcanicVents(width: number, depth: number): void {
    const halfW = width * 0.42;
    const halfD = depth * 0.42;
    const totalVents = 14;

    const ventGeo = new THREE.CylinderGeometry(0.55, 0.9, 1.4, 6);
    ventGeo.translate(0, 0.7, 0);
    const ventMat = ToonMaterialFactory.getMaterial(0x1c1917);
    const ventMesh = new THREE.InstancedMesh(ventGeo, ventMat, totalVents);
    ventMesh.castShadow = true;
    ventMesh.receiveShadow = true;

    const coreGeo = new THREE.CircleGeometry(0.42, 6);
    coreGeo.rotateX(-Math.PI / 2);
    coreGeo.translate(0, 1.41, 0);
    const coreMat = ToonMaterialFactory.getMaterial(0xef4444, {
      emissive: 0xf97316,
      emissiveIntensity: 1.6,
    });
    const coreMesh = new THREE.InstancedMesh(coreGeo, coreMat, totalVents);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalVents; i++) {
      const seedX = Math.sin(i * 67.31 + 4.1) * 31415.9;
      const seedZ = Math.cos(i * 71.19 + 8.9) * 27182.8;
      const x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(0, i * 0.9, 0);
      const s = 0.8 + Math.abs(Math.sin(i * 2.1)) * 0.4;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      ventMesh.setMatrixAt(i, dummy.matrix);
      coreMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(ventMesh);
    this.registerInstancedMesh(coreMesh);
  }

  private buildDeadwoodTrees(width: number, depth: number): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    const totalTrees = 24;

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.42, 2.8, 5);
    trunkGeo.translate(0, 1.4, 0);
    const woodMat = ToonMaterialFactory.getMaterial(0x18181b);
    const trunkMesh = new THREE.InstancedMesh(trunkGeo, woodMat, totalTrees);
    trunkMesh.castShadow = true;

    const branchGeo = new THREE.CylinderGeometry(0.1, 0.18, 1.5, 4);
    branchGeo.translate(0, 0.75, 0);
    branchGeo.rotateZ(0.7);
    const branchMesh = new THREE.InstancedMesh(branchGeo, woodMat, totalTrees);
    branchMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalTrees; i++) {
      const angle = (i / totalTrees) * Math.PI * 2;
      const r = Math.min(halfW, halfD) * (0.86 + Math.abs(Math.sin(i * 1.9)) * 0.18);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.15, i * 0.8, Math.cos(i) * 0.15);
      const s = 0.8 + Math.abs(Math.cos(i * 1.3)) * 0.4;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      trunkMesh.setMatrixAt(i, dummy.matrix);
      branchMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(trunkMesh);
    this.registerInstancedMesh(branchMesh);
  }

  private buildAshMounds(width: number, depth: number): void {
    const halfW = width * 0.45;
    const halfD = depth * 0.45;
    const totalMounds = 32;

    const geo = new THREE.DodecahedronGeometry(0.8, 0);
    geo.scale(1.5, 0.35, 1.3);
    const mat = ToonMaterialFactory.getMaterial(0x1c1917);
    const mesh = new THREE.InstancedMesh(geo, mat, totalMounds);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalMounds; i++) {
      const seedX = Math.sin(i * 83.19) * 44444.4;
      const seedZ = Math.cos(i * 87.71) * 55555.5;
      const x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      dummy.position.set(x, 0.1, z);
      dummy.rotation.set(0, i * 0.6, 0);
      const s = 0.7 + Math.abs(Math.sin(i * 2.2)) * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(mesh);
  }

  private buildFrozenRuins(width: number, depth: number): void {
    const ruinPositions = [
      { x: -width * 0.28, z: -depth * 0.24, h: 2.2 },
      { x: width * 0.28, z: depth * 0.24, h: 1.8 },
      { x: -width * 0.15, z: depth * 0.32, h: 2.6 },
      { x: width * 0.15, z: -depth * 0.32, h: 1.5 },
    ];
    const total = ruinPositions.length;

    const geo = new THREE.BoxGeometry(1.2, 2.4, 0.7);
    geo.translate(0, 1.2, 0);
    const mat = ToonMaterialFactory.getMaterial(0x075985);
    const mesh = new THREE.InstancedMesh(geo, mat, total);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const r = ruinPositions[i]!;
      dummy.position.set(r.x, 0, r.z);
      dummy.rotation.set(0.12, i * 1.1, -0.08);
      dummy.scale.set(1.0, r.h / 2.0, 1.0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(mesh);
  }

  private buildFrostGrass(width: number, depth: number): void {
    const totalTufts = 120;
    const halfW = width * 0.44;
    const halfD = depth * 0.44;

    const bladeGeo = new THREE.ConeGeometry(0.06, 0.4, 3);
    bladeGeo.translate(0, 0.2, 0);
    const grassMat = ToonMaterialFactory.getMaterial(0x7dd3fc);
    const grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, totalTufts);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalTufts; i++) {
      const seedX = Math.sin(i * 19.91) * 77777.7;
      const seedZ = Math.cos(i * 23.33) * 88888.8;
      const x = ((seedX - Math.floor(seedX)) * 2 - 1) * halfW;
      const z = ((seedZ - Math.floor(seedZ)) * 2 - 1) * halfD;

      dummy.position.set(x, 0, z);
      dummy.rotation.set(Math.sin(i) * 0.15, i * 0.8, Math.cos(i) * 0.15);
      const s = 0.7 + Math.abs(Math.sin(i * 2.5)) * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(i, dummy.matrix);
    }
    this.registerInstancedMesh(grassMesh);
  }

  private buildSanctuaryGuardianStatues(biome: StageId): void {
    const sentinelPositions = [
      { x: 3.8, z: 3.8, rotY: -Math.PI * 0.75 },
      { x: -3.8, z: 3.8, rotY: -Math.PI * 0.25 },
      { x: 3.8, z: -3.8, rotY: Math.PI * 0.75 },
      { x: -3.8, z: -3.8, rotY: Math.PI * 0.25 },
    ];
    const total = sentinelPositions.length;

    const stoneColor = biome === 'inferno' ? 0x1f2937 : biome === 'glacial' ? 0x94a3b8 : PALETTE.environment.wallStone;
    const stoneMat = ToonMaterialFactory.getMaterial(stoneColor);

    // Pedestal
    const pedGeo = new THREE.BoxGeometry(0.7, 0.4, 0.7);
    pedGeo.translate(0, 0.2, 0);
    const pedMesh = new THREE.InstancedMesh(pedGeo, stoneMat, total);
    pedMesh.castShadow = true;
    pedMesh.receiveShadow = true;

    // Statue Body & Sword
    const bodyGeo = new THREE.CylinderGeometry(0.24, 0.36, 1.2, 5);
    bodyGeo.translate(0, 0.4 + 0.6, 0);
    const bodyMesh = new THREE.InstancedMesh(bodyGeo, stoneMat, total);
    bodyMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const p = sentinelPositions[i]!;
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      pedMesh.setMatrixAt(i, dummy.matrix);
      bodyMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(pedMesh);
    this.registerInstancedMesh(bodyMesh);
  }

  private buildRunicMonoliths(_width: number, _depth: number, biome: StageId): void {
    const monolithPositions = [
      { x: 14.5, z: 14.5 },
      { x: -14.5, z: 14.5 },
      { x: 14.5, z: -14.5 },
      { x: -14.5, z: -14.5 },
    ];
    const total = monolithPositions.length;

    const stoneColor = biome === 'inferno' ? 0x22222b : biome === 'glacial' ? 0x64748b : 0x52525b;
    const pillarMat = ToonMaterialFactory.getMaterial(stoneColor);

    const pillarGeo = new THREE.CylinderGeometry(0.5, 0.85, 4.4, 6);
    pillarGeo.translate(0, 2.2, 0);
    const pillarMesh = new THREE.InstancedMesh(pillarGeo, pillarMat, total);
    pillarMesh.castShadow = true;
    pillarMesh.receiveShadow = true;

    // Runic floating ring
    const ringColor = biome === 'inferno' ? 0xf97316 : biome === 'glacial' ? 0x38bdf8 : 0xfacc15;
    const ringMat = ToonMaterialFactory.getMaterial(ringColor);
    const ringGeo = new THREE.TorusGeometry(0.85, 0.08, 4, 8);
    ringGeo.rotateX(Math.PI * 0.5);
    ringGeo.translate(0, 2.6, 0);
    const ringMesh = new THREE.InstancedMesh(ringGeo, ringMat, total);

    // Apex Crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.48, 0);
    crystalGeo.translate(0, 4.8, 0);
    const crystalMesh = new THREE.InstancedMesh(crystalGeo, ringMat, total);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const p = monolithPositions[i]!;
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, i * 0.785, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      pillarMesh.setMatrixAt(i, dummy.matrix);
      ringMesh.setMatrixAt(i, dummy.matrix);
      crystalMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(pillarMesh);
    this.registerInstancedMesh(ringMesh);
    this.registerInstancedMesh(crystalMesh);
  }

  private buildFairyCircles(_width: number, _depth: number): void {
    const centers = [
      { cx: 11.5, cz: -13.0 },
      { cx: -13.0, cz: 11.5 },
      { cx: 15.0, cz: 13.0 },
      { cx: -11.0, cz: -14.5 },
    ];
    const mushroomsPerCircle = 7;
    const totalMushrooms = centers.length * mushroomsPerCircle;

    const shroomGeo = new THREE.ConeGeometry(0.24, 0.35, 5);
    shroomGeo.translate(0, 0.2, 0);
    const shroomMat = ToonMaterialFactory.getMaterial(0x34d399); // Glowing emerald
    const shroomMesh = new THREE.InstancedMesh(shroomGeo, shroomMat, totalMushrooms);

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let c = 0; c < centers.length; c++) {
      const center = centers[c]!;
      const radius = 1.4;
      for (let m = 0; m < mushroomsPerCircle; m++) {
        const angle = (m / mushroomsPerCircle) * Math.PI * 2 + c * 0.5;
        const x = center.cx + Math.cos(angle) * radius;
        const z = center.cz + Math.sin(angle) * radius;

        dummy.position.set(x, 0, z);
        dummy.rotation.set(Math.sin(m) * 0.15, angle, 0);
        const s = 0.8 + (m % 3) * 0.2;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        shroomMesh.setMatrixAt(idx++, dummy.matrix);
      }
    }
    this.registerInstancedMesh(shroomMesh);
  }

  private buildAncientKnightStatues(_width: number, _depth: number): void {
    const statuePositions = [
      { x: 18.0, z: 0.0, rotY: -Math.PI * 0.5 },
      { x: -18.0, z: 0.0, rotY: Math.PI * 0.5 },
      { x: 0.0, z: 18.0, rotY: Math.PI },
      { x: 0.0, z: -18.0, rotY: 0.0 },
    ];
    const total = statuePositions.length;

    const stoneMat = ToonMaterialFactory.getMaterial(PALETTE.environment.wallStone);
    const pedestalGeo = new THREE.BoxGeometry(1.2, 0.5, 1.2);
    pedestalGeo.translate(0, 0.25, 0);
    const pedestalMesh = new THREE.InstancedMesh(pedestalGeo, stoneMat, total);
    pedestalMesh.castShadow = true;
    pedestalMesh.receiveShadow = true;

    // Torso and embedded greatsword
    const knightGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.4, 5);
    knightGeo.translate(0, 0.5 + 0.7, 0);
    const knightMesh = new THREE.InstancedMesh(knightGeo, stoneMat, total);
    knightMesh.castShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const p = statuePositions[i]!;
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0, p.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      pedestalMesh.setMatrixAt(i, dummy.matrix);
      knightMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(pedestalMesh);
    this.registerInstancedMesh(knightMesh);
  }

  private buildObsidianHorns(width: number, depth: number): void {
    const totalHorns = 14;
    const hornPositions: { x: number; z: number; scale: number; rotY: number; tilt: number }[] = [];

    const halfW = width * 0.42;
    const halfD = depth * 0.42;
    for (let i = 0; i < totalHorns; i++) {
      const angle = (i / totalHorns) * Math.PI * 2;
      const radius = Math.min(halfW, halfD) * (0.65 + Math.sin(i * 3.7) * 0.25);
      hornPositions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: 0.8 + Math.abs(Math.sin(i * 1.9)) * 0.5,
        rotY: i * 1.2,
        tilt: 0.15 + (i % 3) * 0.08,
      });
    }

    const hornGeo = new THREE.ConeGeometry(0.55, 3.2, 5);
    hornGeo.translate(0, 1.6, 0);
    const hornMat = ToonMaterialFactory.getMaterial(0x18181b); // Jet black obsidian
    const hornMesh = new THREE.InstancedMesh(hornGeo, hornMat, totalHorns);
    hornMesh.castShadow = true;
    hornMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalHorns; i++) {
      const h = hornPositions[i]!;
      dummy.position.set(h.x, 0, h.z);
      dummy.rotation.set(h.tilt, h.rotY, 0);
      dummy.scale.set(h.scale, h.scale * 1.2, h.scale);
      dummy.updateMatrix();
      hornMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(hornMesh);
  }

  private buildMagmaCraters(_width: number, _depth: number): void {
    const craterPositions = [
      { x: 8.5, z: -10.5, r: 1.6 },
      { x: -9.5, z: 12.0, r: 1.8 },
      { x: 13.5, z: 8.5, r: 1.5 },
      { x: -12.0, z: -9.5, r: 1.9 },
      { x: 11.5, z: -14.0, r: 1.4 },
      { x: -14.0, z: 13.5, r: 1.7 },
    ];
    const total = craterPositions.length;

    // Rim
    const rimGeo = new THREE.CylinderGeometry(1.6, 1.9, 0.35, 7, 1, true);
    rimGeo.translate(0, 0.18, 0);
    const rimMat = ToonMaterialFactory.getMaterial(0x27272a);
    const rimMesh = new THREE.InstancedMesh(rimGeo, rimMat, total);
    rimMesh.receiveShadow = true;

    // Inner glowing magma pool
    const poolGeo = new THREE.CircleGeometry(1.3, 7);
    poolGeo.rotateX(-Math.PI * 0.5);
    poolGeo.translate(0, 0.08, 0);
    const poolMat = ToonMaterialFactory.getMaterial(0xef4444); // Magma red
    const poolMesh = new THREE.InstancedMesh(poolGeo, poolMat, total);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const c = craterPositions[i]!;
      dummy.position.set(c.x, 0, c.z);
      dummy.rotation.set(0, i * 0.9, 0);
      dummy.scale.set(c.r / 1.6, 1, c.r / 1.6);
      dummy.updateMatrix();

      rimMesh.setMatrixAt(i, dummy.matrix);
      poolMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(rimMesh);
    this.registerInstancedMesh(poolMesh);
  }

  private buildIceSpireClusters(width: number, depth: number): void {
    const totalSpires = 18;
    const spirePositions: { x: number; z: number; h: number; rotY: number }[] = [];

    const halfW = width * 0.42;
    const halfD = depth * 0.42;
    for (let i = 0; i < totalSpires; i++) {
      const angle = (i / totalSpires) * Math.PI * 2 + Math.sin(i) * 0.3;
      const dist = Math.min(halfW, halfD) * (0.6 + (i % 4) * 0.1);
      spirePositions.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        h: 2.2 + (i % 3) * 0.8,
        rotY: i * 0.85,
      });
    }

    const spireGeo = new THREE.CylinderGeometry(0.06, 0.42, 2.8, 5);
    spireGeo.translate(0, 1.4, 0);
    const spireMat = ToonMaterialFactory.getMaterial(0x67e8f9); // Crystal ice cyan
    const spireMesh = new THREE.InstancedMesh(spireGeo, spireMat, totalSpires);
    spireMesh.castShadow = true;
    spireMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < totalSpires; i++) {
      const s = spirePositions[i]!;
      dummy.position.set(s.x, 0, s.z);
      dummy.rotation.set(0.08, s.rotY, -0.06);
      dummy.scale.set(1, s.h / 2.8, 1);
      dummy.updateMatrix();
      spireMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(spireMesh);
  }

  private buildFrozenTombs(_width: number, _depth: number): void {
    const tombPositions = [
      { x: 10.5, z: -11.5, rotY: 0.4 },
      { x: -11.0, z: 10.5, rotY: -0.6 },
      { x: 14.0, z: 11.0, rotY: 1.2 },
      { x: -13.5, z: -12.0, rotY: -0.3 },
      { x: 12.0, z: -16.0, rotY: 0.8 },
      { x: -15.5, z: 12.5, rotY: -1.1 },
    ];
    const total = tombPositions.length;

    const stoneMat = ToonMaterialFactory.getMaterial(0x475569);
    const tombGeo = new THREE.BoxGeometry(1.2, 0.55, 2.0);
    tombGeo.translate(0, 0.28, 0);
    const tombMesh = new THREE.InstancedMesh(tombGeo, stoneMat, total);
    tombMesh.castShadow = true;
    tombMesh.receiveShadow = true;

    // Frost cap
    const capGeo = new THREE.BoxGeometry(1.26, 0.15, 2.06);
    capGeo.translate(0, 0.6, 0);
    const capMat = ToonMaterialFactory.getMaterial(0xe0f2fe);
    const capMesh = new THREE.InstancedMesh(capGeo, capMat, total);

    const dummy = new THREE.Object3D();
    for (let i = 0; i < total; i++) {
      const t = tombPositions[i]!;
      dummy.position.set(t.x, 0, t.z);
      dummy.rotation.set(0.06, t.rotY, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();

      tombMesh.setMatrixAt(i, dummy.matrix);
      capMesh.setMatrixAt(i, dummy.matrix);
    }

    this.registerInstancedMesh(tombMesh);
    this.registerInstancedMesh(capMesh);
  }

  public clear(): void {
    for (let i = 0; i < this.meshes.length; i++) {
      this.group.remove(this.meshes[i]!);
      this.meshes[i]!.geometry.dispose();
    }
    this.meshes = [];
    this.group.clear();
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group);
  }

  public dispose(): void {
    this.clear();
  }
}
