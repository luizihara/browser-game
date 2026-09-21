import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import { type EnemyType } from '../config/enemyConfig';

export interface EnemyVisualSetup {
  rootGroup: THREE.Group;
  modelGroup: THREE.Group;
  bodyMesh: THREE.Mesh;
  haloMesh: THREE.Mesh | null;
  baseMaterial: THREE.MeshToonMaterial;
}

/**
 * Builds distinct stylized low-poly cartoon meshes for each enemy archetype.
 * Uses shared ToonMaterials to guarantee zero material bloat in memory.
 */
export class EnemyVisualBuilder {
  private static flashMaterial: THREE.MeshToonMaterial | null = null;

  public static getFlashMaterial(): THREE.MeshToonMaterial {
    if (!this.flashMaterial) {
      this.flashMaterial = ToonMaterialFactory.getMaterial(PALETTE.vfx.hitFlash, {
        emissive: PALETTE.vfx.hitFlash,
        emissiveIntensity: 0.6,
      });
    }
    return this.flashMaterial;
  }

  public static buildEnemy(type: EnemyType): EnemyVisualSetup {
    switch (type) {
      case 'fast':
        return this.buildSkitterer();
      case 'tank':
        return this.buildBrute();
      case 'elite':
        return this.buildGoliath();
      case 'ranged':
        return this.buildRanged();
      case 'shaman':
        return this.buildShaman();
      case 'volatile':
        return this.buildVolatile();
      case 'basic':
      default:
        return this.buildStalker();
    }
  }

  /**
   * Stalker (Goblin / Imp):
   * Agile, sharp, triangular head, small horns, glowing yellow eyes.
   */
  private static buildStalker(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.stalkerBody);
    const accentMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.stalkerAccent);
    const eyeMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.stalkerEyes, {
      emissive: PALETTE.enemies.stalkerEyes,
      emissiveIntensity: 0.8,
    });

    // Body: Compact low-poly 6-sided capsule/cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.25, 0.75, 6);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // Horns / Pointy ears
    const hornGeo = new THREE.ConeGeometry(0.08, 0.28, 4);
    hornGeo.translate(0, 0.14, 0);

    const leftHorn = new THREE.Mesh(hornGeo, accentMaterial);
    leftHorn.position.set(-0.22, 0.38, 0);
    leftHorn.rotation.z = 0.35;
    leftHorn.castShadow = true;
    modelGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, accentMaterial);
    rightHorn.position.set(0.22, 0.38, 0);
    rightHorn.rotation.z = -0.35;
    rightHorn.castShadow = true;
    modelGroup.add(rightHorn);

    // Glowing Eyes (Facing -Z)
    const eyeGeo = new THREE.BoxGeometry(0.09, 0.08, 0.08);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    leftEye.position.set(-0.14, 0.18, -0.32);
    modelGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMaterial);
    rightEye.position.set(0.14, 0.18, -0.32);
    modelGroup.add(rightEye);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }

  /**
   * Skitterer (Insectoid / Spider):
   * Low triangular carapace, splayed angular legs, pink neon eyes.
   */
  private static buildSkitterer(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.skittererBody);
    const legMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.skittererLegs);
    const eyeMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.skittererEyes, {
      emissive: PALETTE.enemies.skittererEyes,
      emissiveIntensity: 0.9,
    });

    // Body: Flattened dodecahedron carapace
    const bodyGeo = new THREE.DodecahedronGeometry(0.35, 0);
    bodyGeo.scale(1.2, 0.55, 1.3);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // 4 Splayed Low-Poly Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.45, 4);
    legGeo.translate(0, -0.15, 0);

    const legConfigs = [
      { x: -0.38, z: -0.2, rotZ: -0.6, rotY: 0.3 },
      { x: 0.38, z: -0.2, rotZ: 0.6, rotY: -0.3 },
      { x: -0.38, z: 0.2, rotZ: -0.6, rotY: -0.3 },
      { x: 0.38, z: 0.2, rotZ: 0.6, rotY: 0.3 },
    ];

    legConfigs.forEach((cfg) => {
      const leg = new THREE.Mesh(legGeo, legMaterial);
      leg.position.set(cfg.x, -0.05, cfg.z);
      leg.rotation.z = cfg.rotZ;
      leg.rotation.y = cfg.rotY;
      leg.castShadow = true;
      modelGroup.add(leg);
    });

    // Multi-Cluster Glowing Eyes (Front -Z)
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const eye1 = new THREE.Mesh(eyeGeo, eyeMaterial);
    eye1.position.set(-0.12, 0.05, -0.42);
    modelGroup.add(eye1);

    const eye2 = new THREE.Mesh(eyeGeo, eyeMaterial);
    eye2.position.set(0.12, 0.05, -0.42);
    modelGroup.add(eye2);

    const eyeCenter = new THREE.Mesh(eyeGeo, eyeMaterial);
    eyeCenter.position.set(0, 0.12, -0.38);
    eyeCenter.scale.set(0.8, 0.8, 0.8);
    modelGroup.add(eyeCenter);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }

  /**
   * Brute (Golem / Heavy Rock Monster):
   * Massive inverted-trapezoid torso, heavy rocky shoulders, fiery magma accents.
   */
  private static buildBrute(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.bruteBody);
    const shoulderMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.bruteCrags);
    const magmaMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.bruteMagma, {
      emissive: PALETTE.enemies.bruteMagma,
      emissiveIntensity: 0.7,
    });

    // Massive Torso: Faceted box/dodecahedron
    const bodyGeo = new THREE.DodecahedronGeometry(0.65, 0);
    bodyGeo.scale(1.2, 1.1, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // Bulky Rock Shoulders
    const shoulderGeo = new THREE.DodecahedronGeometry(0.35, 0);

    const leftShoulder = new THREE.Mesh(shoulderGeo, shoulderMaterial);
    leftShoulder.position.set(-0.75, 0.35, 0);
    leftShoulder.castShadow = true;
    modelGroup.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, shoulderMaterial);
    rightShoulder.position.set(0.75, 0.35, 0);
    rightShoulder.castShadow = true;
    modelGroup.add(rightShoulder);

    // Glowing Magma Core in chest
    const coreGeo = new THREE.OctahedronGeometry(0.2, 0);
    const coreMesh = new THREE.Mesh(coreGeo, magmaMaterial);
    coreMesh.position.set(0, 0.05, -0.6);
    modelGroup.add(coreMesh);

    // Sunken Fiery Eyes
    const eyeGeo = new THREE.BoxGeometry(0.14, 0.08, 0.1);
    const eyes = new THREE.Mesh(eyeGeo, magmaMaterial);
    eyes.position.set(0, 0.35, -0.6);
    modelGroup.add(eyes);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }

  /**
   * Goliath Elite (Titan Conquistador):
   * Giant scale, horned gold crown, obsidian dark armor, radiant spinning halo.
   */
  private static buildGoliath(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.goliathArmor);
    const goldMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.goliathGold);
    const haloMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.goliathHalo, {
      emissive: PALETTE.enemies.goliathHalo,
      emissiveIntensity: 1.1,
    });
    const coreMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.goliathGlow, {
      emissive: PALETTE.enemies.goliathGlow,
      emissiveIntensity: 0.9,
    });

    // Giant Torso
    const bodyGeo = new THREE.DodecahedronGeometry(0.9, 0);
    bodyGeo.scale(1.15, 1.3, 1.0);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    modelGroup.add(bodyMesh);

    // Golden Horned Crown
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 1.1, 0);

    const hornGeo = new THREE.ConeGeometry(0.14, 0.55, 5);
    hornGeo.translate(0, 0.27, 0);

    const leftHorn = new THREE.Mesh(hornGeo, goldMaterial);
    leftHorn.position.set(-0.35, 0, 0);
    leftHorn.rotation.z = 0.4;
    leftHorn.castShadow = true;
    crownGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, goldMaterial);
    rightHorn.position.set(0.35, 0, 0);
    rightHorn.rotation.z = -0.4;
    rightHorn.castShadow = true;
    crownGroup.add(rightHorn);

    const centerHorn = new THREE.Mesh(hornGeo, goldMaterial);
    centerHorn.position.set(0, 0.08, -0.1);
    centerHorn.scale.set(0.85, 0.85, 0.85);
    centerHorn.castShadow = true;
    crownGroup.add(centerHorn);

    modelGroup.add(crownGroup);

    // Giant Radiant Halo floating overhead
    const haloGeo = new THREE.TorusGeometry(0.8, 0.08, 6, 24);
    const haloMesh = new THREE.Mesh(haloGeo, haloMaterial);
    haloMesh.rotation.x = Math.PI / 2;
    haloMesh.position.set(0, 1.75, 0);
    rootGroup.add(haloMesh);

    // Radiant Core on chest
    const chestCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), coreMaterial);
    chestCore.position.set(0, 0.15, -0.85);
    modelGroup.add(chestCore);

    return { rootGroup, modelGroup, bodyMesh, haloMesh, baseMaterial };
  }

  /**
   * Cultist (Ranged):
   * Robed silhouette with dark hood, glowing arcane eye slit, and staff with floating crystal.
   */
  private static buildRanged(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.rangedRobe);
    const staffMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.rangedStaff);
    const glowMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.rangedGlow, {
      emissive: PALETTE.enemies.rangedGlow,
      emissiveIntensity: 0.9,
    });

    // Robe Cone Body
    const bodyGeo = new THREE.ConeGeometry(0.42, 1.25, 7);
    bodyGeo.translate(0, 0.6, 0);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    modelGroup.add(bodyMesh);

    // Hood / Cowl
    const hoodGeo = new THREE.SphereGeometry(0.24, 6, 6);
    hoodGeo.scale(1, 1.2, 1);
    const hood = new THREE.Mesh(hoodGeo, baseMaterial);
    hood.position.set(0, 1.15, -0.05);
    hood.castShadow = true;
    modelGroup.add(hood);

    // Arcane Eye Visor Slit
    const eyeGeo = new THREE.BoxGeometry(0.22, 0.06, 0.1);
    const eyes = new THREE.Mesh(eyeGeo, glowMaterial);
    eyes.position.set(0, 1.15, -0.22);
    modelGroup.add(eyes);

    // Staff in right hand
    const staffGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.35, 5);
    staffGeo.translate(0, 0.65, 0);
    const staff = new THREE.Mesh(staffGeo, staffMaterial);
    staff.position.set(0.4, 0, -0.15);
    staff.castShadow = true;
    modelGroup.add(staff);

    // Floating Arcane Crystal on staff tip
    const crystalGeo = new THREE.OctahedronGeometry(0.12, 0);
    const crystal = new THREE.Mesh(crystalGeo, glowMaterial);
    crystal.position.set(0.4, 1.38, -0.15);
    modelGroup.add(crystal);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }

  /**
   * Bone Shaman:
   * Moss green ritualist with animal bone skull mask, horns, and ritual glow.
   */
  private static buildShaman(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.shamanBody);
    const maskMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.shamanMask);
    const glowMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.shamanGlow, {
      emissive: PALETTE.enemies.shamanGlow,
      emissiveIntensity: 0.85,
    });

    // Ritual Robe
    const robeGeo = new THREE.CylinderGeometry(0.28, 0.48, 1.3, 6);
    robeGeo.translate(0, 0.65, 0);
    const bodyMesh = new THREE.Mesh(robeGeo, baseMaterial);
    bodyMesh.castShadow = true;
    modelGroup.add(bodyMesh);

    // Animal Skull Mask
    const skullGeo = new THREE.BoxGeometry(0.28, 0.32, 0.28);
    const skull = new THREE.Mesh(skullGeo, maskMaterial);
    skull.position.set(0, 1.25, -0.15);
    skull.castShadow = true;
    modelGroup.add(skull);

    // Antler Horns
    const hornGeo = new THREE.ConeGeometry(0.06, 0.45, 4);
    hornGeo.translate(0, 0.22, 0);

    const leftHorn = new THREE.Mesh(hornGeo, maskMaterial);
    leftHorn.position.set(-0.2, 1.35, -0.05);
    leftHorn.rotation.z = 0.5;
    leftHorn.castShadow = true;
    modelGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, maskMaterial);
    rightHorn.position.set(0.2, 1.35, -0.05);
    rightHorn.rotation.z = -0.5;
    rightHorn.castShadow = true;
    modelGroup.add(rightHorn);

    // Glowing Ritual Eyes in Mask
    const eyeGeo = new THREE.SphereGeometry(0.05, 4, 4);
    const leftEye = new THREE.Mesh(eyeGeo, glowMaterial);
    leftEye.position.set(-0.08, 1.25, -0.3);
    modelGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, glowMaterial);
    rightEye.position.set(0.08, 1.25, -0.3);
    modelGroup.add(rightEye);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }

  /**
   * Volatile Crawler:
   * Bulbous volcanic tick with pulsating molten pustules on its back.
   */
  private static buildVolatile(): EnemyVisualSetup {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const baseMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.volatileShell);
    const pustuleMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.volatilePustule, {
      emissive: PALETTE.enemies.volatilePustule,
      emissiveIntensity: 0.7,
    });
    const coreMaterial = ToonMaterialFactory.getMaterial(PALETTE.enemies.volatileCore, {
      emissive: PALETTE.enemies.volatileCore,
      emissiveIntensity: 0.9,
    });

    // Bulbous Body
    const bodyGeo = new THREE.SphereGeometry(0.38, 7, 6);
    bodyGeo.scale(1.2, 0.7, 1.2);
    bodyGeo.translate(0, 0.35, 0);
    const bodyMesh = new THREE.Mesh(bodyGeo, baseMaterial);
    bodyMesh.castShadow = true;
    modelGroup.add(bodyMesh);

    // Glowing Volcanic Pustules on shell
    const pustuleGeo = new THREE.SphereGeometry(0.14, 5, 5);
    const p1 = new THREE.Mesh(pustuleGeo, pustuleMaterial);
    p1.position.set(-0.15, 0.58, 0.1);
    modelGroup.add(p1);

    const p2 = new THREE.Mesh(pustuleGeo, pustuleMaterial);
    p2.position.set(0.16, 0.55, -0.05);
    p2.scale.set(0.85, 0.85, 0.85);
    modelGroup.add(p2);

    const p3 = new THREE.Mesh(pustuleGeo, coreMaterial);
    p3.position.set(0, 0.62, 0.15);
    p3.scale.set(1.1, 1.1, 1.1);
    modelGroup.add(p3);

    // Front Pincer Fangs
    const fangGeo = new THREE.ConeGeometry(0.06, 0.22, 4);
    fangGeo.rotateX(-Math.PI / 2);

    const leftFang = new THREE.Mesh(fangGeo, pustuleMaterial);
    leftFang.position.set(-0.14, 0.25, -0.45);
    leftFang.rotation.y = 0.25;
    modelGroup.add(leftFang);

    const rightFang = new THREE.Mesh(fangGeo, pustuleMaterial);
    rightFang.position.set(0.14, 0.25, -0.45);
    rightFang.rotation.y = -0.25;
    modelGroup.add(rightFang);

    return { rootGroup, modelGroup, bodyMesh, haloMesh: null, baseMaterial };
  }
}
