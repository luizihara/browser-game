import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import type { CharacterId } from '../config/characterConfig';

export interface PlayerVisualComponents {
  rootGroup: THREE.Group;
  modelGroup: THREE.Group;
  materialsToFlash: THREE.MeshToonMaterial[];
  originalColors: number[];
  staffGemMesh: THREE.Mesh;
}

/**
 * Builds Stylized Low-Poly Toon 3D Hero models for each character archetype.
 * Maintains triangle counts well below 1,000 for high FPS on all devices.
 */
export class CharacterBuilder {
  public static buildPlayerHero(characterId: CharacterId = 'knight'): PlayerVisualComponents {
    switch (characterId) {
      case 'mage':
        return this.buildMage();
      case 'rogue':
        return this.buildRogue();
      case 'templar':
        return this.buildTemplar();
      case 'knight':
      default:
        return this.buildKnight();
    }
  }

  /**
   * Sir Roderick: Heavy steel armor, crimson crest plume, heater shield & broadsword.
   */
  public static buildKnight(): PlayerVisualComponents {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const materialsToFlash: THREE.MeshToonMaterial[] = [];
    const originalColors: number[] = [];
    const registerFlashable = (mat: THREE.MeshToonMaterial, color: number) => {
      materialsToFlash.push(mat);
      originalColors.push(color);
    };

    // 1. Torso: Steel plate cuirass
    const steelMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightSteel);
    registerFlashable(steelMat, PALETTE.player.knightSteel);

    const torsoGeo = new THREE.CylinderGeometry(0.34, 0.28, 0.58, 6);
    const torsoMesh = new THREE.Mesh(torsoGeo, steelMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    modelGroup.add(torsoMesh);

    // 2. Gold Belt
    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    registerFlashable(goldMat, PALETTE.player.trimGold);
    const beltGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 6);
    beltGeo.translate(0, -0.14, 0);
    const beltMesh = new THREE.Mesh(beltGeo, goldMat);
    beltMesh.castShadow = true;
    modelGroup.add(beltMesh);

    // 3. Head & Great Helm
    const helmGeo = new THREE.DodecahedronGeometry(0.33, 0);
    helmGeo.translate(0, 0.48, 0);
    const helmMesh = new THREE.Mesh(helmGeo, steelMat);
    helmMesh.castShadow = true;
    helmMesh.receiveShadow = true;
    modelGroup.add(helmMesh);

    // 4. Crimson Plume
    const plumeMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightPlume);
    const plumeGeo = new THREE.BoxGeometry(0.08, 0.28, 0.38);
    plumeGeo.translate(0, 0.72, 0.05);
    const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    plumeMesh.castShadow = true;
    modelGroup.add(plumeMesh);

    // 5. Glowing Visor (facing -Z)
    const visorMat = ToonMaterialFactory.getMaterial(PALETTE.player.visorGlow, {
      emissive: PALETTE.player.visorGlow,
      emissiveIntensity: 0.85,
    });
    const visorGeo = new THREE.BoxGeometry(0.28, 0.1, 0.15);
    visorGeo.translate(0, 0.48, -0.26);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.castShadow = true;
    modelGroup.add(visorMesh);

    // 6. Heavy Steel Pauldrons
    const pauldronGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    leftPauldron.position.set(-0.38, 0.22, 0);
    leftPauldron.castShadow = true;
    modelGroup.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    rightPauldron.position.set(0.38, 0.22, 0);
    rightPauldron.castShadow = true;
    modelGroup.add(rightPauldron);

    // 7. Heater Shield on Left Arm (-X)
    const shieldMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightShield);
    const shieldGeo = new THREE.BoxGeometry(0.08, 0.48, 0.32);
    shieldGeo.translate(-0.42, 0.05, -0.1);
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.castShadow = true;
    modelGroup.add(shieldMesh);

    // 8. Broadsword on Right Arm (+X)
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.42, 0.05, -0.15);
    const bladeGeo = new THREE.BoxGeometry(0.06, 0.65, 0.12);
    bladeGeo.translate(0, 0.15, 0);
    const bladeMesh = new THREE.Mesh(bladeGeo, steelMat);
    bladeMesh.castShadow = true;
    swordGroup.add(bladeMesh);

    const pommelMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold, {
      emissive: PALETTE.player.trimGold,
      emissiveIntensity: 0.5,
    });
    const pommelGeo = new THREE.OctahedronGeometry(0.1, 0);
    pommelGeo.translate(0, 0.52, 0);
    const pommelMesh = new THREE.Mesh(pommelGeo, pommelMat);
    pommelMesh.castShadow = true;
    swordGroup.add(pommelMesh);
    modelGroup.add(swordGroup);

    // 9. Crimson Cape (+Z)
    const capeGeo = new THREE.BoxGeometry(0.42, 0.58, 0.05);
    capeGeo.translate(0, -0.05, 0.25);
    const capeMesh = new THREE.Mesh(capeGeo, plumeMat);
    capeMesh.rotation.x = 0.15;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    return {
      rootGroup,
      modelGroup,
      materialsToFlash,
      originalColors,
      staffGemMesh: pommelMesh,
    };
  }

  /**
   * Elara: Arcane robe, wizard hat with wide brim, glowing crystal staff.
   */
  public static buildMage(): PlayerVisualComponents {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const materialsToFlash: THREE.MeshToonMaterial[] = [];
    const originalColors: number[] = [];
    const registerFlashable = (mat: THREE.MeshToonMaterial, color: number) => {
      materialsToFlash.push(mat);
      originalColors.push(color);
    };

    // 1. Torso: Arcane violet robe
    const robeMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageRobe);
    registerFlashable(robeMat, PALETTE.player.mageRobe);

    const torsoGeo = new THREE.CylinderGeometry(0.3, 0.36, 0.6, 6);
    const torsoMesh = new THREE.Mesh(torsoGeo, robeMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    modelGroup.add(torsoMesh);

    // 2. Head (Chibi spherical)
    const headMat = ToonMaterialFactory.getMaterial(PALETTE.player.armorWhite);
    registerFlashable(headMat, PALETTE.player.armorWhite);
    const headGeo = new THREE.DodecahedronGeometry(0.3, 0);
    headGeo.translate(0, 0.46, 0);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    modelGroup.add(headMesh);

    // 3. Wizard Conical Hat
    const hatMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageHat);
    registerFlashable(hatMat, PALETTE.player.mageHat);

    // Brim
    const brimGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.05, 8);
    brimGeo.translate(0, 0.58, 0);
    const brimMesh = new THREE.Mesh(brimGeo, hatMat);
    brimMesh.castShadow = true;
    modelGroup.add(brimMesh);

    // Cone
    const coneGeo = new THREE.CylinderGeometry(0.04, 0.28, 0.48, 7);
    coneGeo.translate(0, 0.82, -0.04);
    const coneMesh = new THREE.Mesh(coneGeo, hatMat);
    coneMesh.rotation.x = -0.12; // Slight tilt backwards
    coneMesh.castShadow = true;
    modelGroup.add(coneMesh);

    // 4. Glowing Cyan Eyes/Visor
    const glowMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageGlow, {
      emissive: PALETTE.player.mageGlow,
      emissiveIntensity: 0.9,
    });
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.12);
    visorGeo.translate(0, 0.46, -0.24);
    const visorMesh = new THREE.Mesh(visorGeo, glowMat);
    visorMesh.castShadow = true;
    modelGroup.add(visorMesh);

    // 5. Arcane Cape
    const capeGeo = new THREE.BoxGeometry(0.36, 0.55, 0.04);
    capeGeo.translate(0, -0.05, 0.24);
    const capeMesh = new THREE.Mesh(capeGeo, robeMat);
    capeMesh.rotation.x = 0.18;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    // 6. Arcane Staff Weapon
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.42, 0.05, -0.15);

    const handleMat = ToonMaterialFactory.getMaterial(PALETTE.player.staffWood);
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.04, 1.0, 5);
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.castShadow = true;
    staffGroup.add(handleMesh);

    const staffGemGeo = new THREE.OctahedronGeometry(0.14, 0);
    staffGemGeo.translate(0, 0.56, 0);
    const staffGemMesh = new THREE.Mesh(staffGemGeo, glowMat);
    staffGemMesh.castShadow = true;
    staffGroup.add(staffGemMesh);
    modelGroup.add(staffGroup);

    return {
      rootGroup,
      modelGroup,
      materialsToFlash,
      originalColors,
      staffGemMesh,
    };
  }

  /**
   * Kage: Nocturnal stealth leather, ninja cowl, emerald eyes, dual back daggers.
   */
  public static buildRogue(): PlayerVisualComponents {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const materialsToFlash: THREE.MeshToonMaterial[] = [];
    const originalColors: number[] = [];
    const registerFlashable = (mat: THREE.MeshToonMaterial, color: number) => {
      materialsToFlash.push(mat);
      originalColors.push(color);
    };

    // 1. Torso: Dark leather tunic
    const darkMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueDark);
    registerFlashable(darkMat, PALETTE.player.rogueDark);

    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.52, 6);
    const torsoMesh = new THREE.Mesh(torsoGeo, darkMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    modelGroup.add(torsoMesh);

    // 2. Ninja Cowl / Mask
    const cowlMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueCowl);
    registerFlashable(cowlMat, PALETTE.player.rogueCowl);

    const headGeo = new THREE.DodecahedronGeometry(0.3, 0);
    headGeo.translate(0, 0.46, 0);
    const headMesh = new THREE.Mesh(headGeo, cowlMat);
    headMesh.castShadow = true;
    modelGroup.add(headMesh);

    // 3. Emerald Glowing Eye Slits
    const eyeMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueEyes, {
      emissive: PALETTE.player.rogueEyes,
      emissiveIntensity: 0.95,
    });
    const eyeGeo = new THREE.BoxGeometry(0.22, 0.06, 0.12);
    eyeGeo.translate(0, 0.46, -0.24);
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.castShadow = true;
    modelGroup.add(eyeMesh);

    // 4. Flowing Emerald Scarf
    const scarfMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueScarf);
    const scarfGeo = new THREE.BoxGeometry(0.32, 0.12, 0.12);
    scarfGeo.translate(0, 0.26, 0);
    const scarfMesh = new THREE.Mesh(scarfGeo, scarfMat);
    scarfMesh.castShadow = true;
    modelGroup.add(scarfMesh);

    const tailGeo = new THREE.BoxGeometry(0.12, 0.4, 0.04);
    tailGeo.translate(0.15, 0.1, 0.22);
    const tailMesh = new THREE.Mesh(tailGeo, scarfMat);
    tailMesh.rotation.x = 0.25;
    tailMesh.castShadow = true;
    modelGroup.add(tailMesh);

    // 5. Dual Crossed Back Daggers (+Z)
    const daggerMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightSteel);
    const d1Geo = new THREE.BoxGeometry(0.05, 0.45, 0.06);
    d1Geo.translate(-0.08, 0.2, 0.2);
    const d1Mesh = new THREE.Mesh(d1Geo, daggerMat);
    d1Mesh.rotation.z = 0.4;
    d1Mesh.castShadow = true;
    modelGroup.add(d1Mesh);

    const d2Geo = new THREE.BoxGeometry(0.05, 0.45, 0.06);
    d2Geo.translate(0.08, 0.2, 0.2);
    const d2Mesh = new THREE.Mesh(d2Geo, daggerMat);
    d2Mesh.rotation.z = -0.4;
    d2Mesh.castShadow = true;
    modelGroup.add(d2Mesh);

    // Decorative spinning shuriken accessory as staffGemMesh
    const shurikenGeo = new THREE.OctahedronGeometry(0.1, 0);
    shurikenGeo.translate(0.35, 0.1, -0.15);
    const shurikenMesh = new THREE.Mesh(shurikenGeo, eyeMat);
    shurikenMesh.castShadow = true;
    modelGroup.add(shurikenMesh);

    return {
      rootGroup,
      modelGroup,
      materialsToFlash,
      originalColors,
      staffGemMesh: shurikenMesh,
    };
  }

  /**
   * Aurelius: Golden radiant plate, solar halo ring, sun tabard.
   */
  public static buildTemplar(): PlayerVisualComponents {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const materialsToFlash: THREE.MeshToonMaterial[] = [];
    const originalColors: number[] = [];
    const registerFlashable = (mat: THREE.MeshToonMaterial, color: number) => {
      materialsToFlash.push(mat);
      originalColors.push(color);
    };

    // 1. Torso: Polished golden breastplate
    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarGold);
    registerFlashable(goldMat, PALETTE.player.templarGold);

    const torsoGeo = new THREE.CylinderGeometry(0.34, 0.3, 0.58, 6);
    const torsoMesh = new THREE.Mesh(torsoGeo, goldMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    modelGroup.add(torsoMesh);

    // 2. White Tabard front
    const tabardMat = ToonMaterialFactory.getMaterial(PALETTE.player.armorWhite);
    const tabardGeo = new THREE.BoxGeometry(0.24, 0.5, 0.06);
    tabardGeo.translate(0, -0.05, -0.28);
    const tabardMesh = new THREE.Mesh(tabardGeo, tabardMat);
    tabardMesh.castShadow = true;
    modelGroup.add(tabardMesh);

    // 3. Head & Golden Helm
    const headGeo = new THREE.DodecahedronGeometry(0.32, 0);
    headGeo.translate(0, 0.48, 0);
    const headMesh = new THREE.Mesh(headGeo, goldMat);
    headMesh.castShadow = true;
    modelGroup.add(headMesh);

    // 4. Solar Radiant Halo (floating behind head)
    const haloMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarSun, {
      emissive: PALETTE.player.templarGlow,
      emissiveIntensity: 0.9,
    });
    const haloGeo = new THREE.TorusGeometry(0.36, 0.035, 4, 16);
    haloGeo.translate(0, 0.52, 0.12);
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.castShadow = true;
    modelGroup.add(haloMesh);

    // 5. Sun Visor
    const visorMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarSun, {
      emissive: PALETTE.player.templarSun,
      emissiveIntensity: 0.8,
    });
    const visorGeo = new THREE.BoxGeometry(0.26, 0.1, 0.14);
    visorGeo.translate(0, 0.48, -0.25);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.castShadow = true;
    modelGroup.add(visorMesh);

    // 6. Massive Lion Pauldrons
    const pauldronGeo = new THREE.BoxGeometry(0.26, 0.22, 0.26);
    const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    leftPauldron.position.set(-0.38, 0.25, 0);
    leftPauldron.castShadow = true;
    modelGroup.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    rightPauldron.position.set(0.38, 0.25, 0);
    rightPauldron.castShadow = true;
    modelGroup.add(rightPauldron);

    // 7. White & Gold Cape
    const capeGeo = new THREE.BoxGeometry(0.42, 0.58, 0.05);
    capeGeo.translate(0, -0.05, 0.25);
    const capeMesh = new THREE.Mesh(capeGeo, tabardMat);
    capeMesh.rotation.x = 0.14;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    return {
      rootGroup,
      modelGroup,
      materialsToFlash,
      originalColors,
      staffGemMesh: haloMesh,
    };
  }
}
