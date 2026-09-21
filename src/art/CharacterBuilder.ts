import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';
import type { CharacterId } from '../config/characterConfig';

export interface PlayerVisualComponents {
  rootGroup: THREE.Group;
  modelGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  capeMesh: THREE.Mesh | null;
  materialsToFlash: THREE.MeshToonMaterial[];
  originalColors: number[];
  staffGemMesh: THREE.Mesh;
}

/**
 * Builds High-Fidelity Stylized Low-Poly Toon 3D Hero models for each character archetype.
 * Includes articulated limbs (legs, boots, arms, hands), distinct weapons, dynamic capes/scarves,
 * and maintains low triangle counts (< 900 tris) for 144 FPS performance.
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
   * Sir Roderick: Heavy plate knight, great helm with flowing crimson plume,
   * heraldic heater shield, broadsword with fuller, articulated steel sabatons.
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

    // Shared materials
    const steelMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightSteel);
    registerFlashable(steelMat, PALETTE.player.knightSteel);

    const steelDarkMat = ToonMaterialFactory.getMaterial(PALETTE.player.steelDark);
    registerFlashable(steelDarkMat, PALETTE.player.steelDark);

    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    registerFlashable(goldMat, PALETTE.player.trimGold);

    const goldHiMat = ToonMaterialFactory.getMaterial(PALETTE.player.goldHighlight);
    registerFlashable(goldHiMat, PALETTE.player.goldHighlight);

    const plumeMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightPlume);
    registerFlashable(plumeMat, PALETTE.player.knightPlume);

    const shieldMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightShield);
    registerFlashable(shieldMat, PALETTE.player.knightShield);

    const leatherMat = ToonMaterialFactory.getMaterial(PALETTE.player.bootsLeather);
    registerFlashable(leatherMat, PALETTE.player.bootsLeather);

    const visorMat = ToonMaterialFactory.getMaterial(PALETTE.player.visorGlow, {
      emissive: PALETTE.player.visorGlow,
      emissiveIntensity: 0.9,
    });

    // 1. Torso & Armor Plating
    const torsoGroup = new THREE.Group();

    // Steel cuirass
    const cuirassGeo = new THREE.CylinderGeometry(0.33, 0.27, 0.48, 6);
    const cuirassMesh = new THREE.Mesh(cuirassGeo, steelMat);
    cuirassMesh.position.y = 0.04;
    cuirassMesh.castShadow = true;
    cuirassMesh.receiveShadow = true;
    torsoGroup.add(cuirassMesh);

    // Beveled breastplate center ridge
    const ridgeGeo = new THREE.BoxGeometry(0.1, 0.36, 0.08);
    ridgeGeo.translate(0, 0.06, -0.16);
    const ridgeMesh = new THREE.Mesh(ridgeGeo, goldMat);
    ridgeMesh.castShadow = true;
    torsoGroup.add(ridgeMesh);

    // Gorget / Neck plate
    const gorgetGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.1, 6);
    gorgetGeo.translate(0, 0.28, 0);
    const gorgetMesh = new THREE.Mesh(gorgetGeo, steelDarkMat);
    gorgetMesh.castShadow = true;
    torsoGroup.add(gorgetMesh);

    // Gold Trim Belt & Buckle
    const beltGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 6);
    beltGeo.translate(0, -0.16, 0);
    const beltMesh = new THREE.Mesh(beltGeo, goldMat);
    beltMesh.castShadow = true;
    torsoGroup.add(beltMesh);

    const buckleGeo = new THREE.BoxGeometry(0.1, 0.1, 0.06);
    buckleGeo.translate(0, -0.16, -0.2);
    const buckleMesh = new THREE.Mesh(buckleGeo, goldHiMat);
    buckleMesh.castShadow = true;
    torsoGroup.add(buckleMesh);

    modelGroup.add(torsoGroup);

    // 2. Head & Great Helm
    const headGroup = new THREE.Group();

    const helmGeo = new THREE.DodecahedronGeometry(0.32, 0);
    helmGeo.translate(0, 0.52, 0);
    const helmMesh = new THREE.Mesh(helmGeo, steelMat);
    helmMesh.castShadow = true;
    helmMesh.receiveShadow = true;
    headGroup.add(helmMesh);

    // Brow reinforcement band
    const browGeo = new THREE.BoxGeometry(0.34, 0.08, 0.34);
    browGeo.translate(0, 0.54, 0);
    const browMesh = new THREE.Mesh(browGeo, goldMat);
    browMesh.castShadow = true;
    headGroup.add(browMesh);

    // Glowing Visor (Facing -Z)
    const visorGeo = new THREE.BoxGeometry(0.26, 0.07, 0.12);
    visorGeo.translate(0, 0.52, -0.24);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.castShadow = true;
    headGroup.add(visorMesh);

    // Nose & Chin vertical guard
    const chinGeo = new THREE.BoxGeometry(0.08, 0.18, 0.08);
    chinGeo.translate(0, 0.45, -0.24);
    const chinMesh = new THREE.Mesh(chinGeo, steelDarkMat);
    chinMesh.castShadow = true;
    headGroup.add(chinMesh);

    // Crimson Plume Crest
    const plumeSocketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6);
    plumeSocketGeo.translate(0, 0.68, 0.04);
    const plumeSocketMesh = new THREE.Mesh(plumeSocketGeo, goldMat);
    plumeSocketMesh.castShadow = true;
    headGroup.add(plumeSocketMesh);

    const plumeGeo = new THREE.BoxGeometry(0.08, 0.32, 0.36);
    plumeGeo.translate(0, 0.78, 0.04);
    const plumeMesh = new THREE.Mesh(plumeGeo, plumeMat);
    plumeMesh.castShadow = true;
    headGroup.add(plumeMesh);

    modelGroup.add(headGroup);

    // 3. Left Arm (Shoulder pauldron + Forearm + Heater Shield)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.36, 0.22, 0);

    const pauldronGeo = new THREE.DodecahedronGeometry(0.18, 0);
    const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    leftPauldron.castShadow = true;
    leftArm.add(leftPauldron);

    const leftForearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.24, 6);
    leftForearmGeo.translate(0, -0.12, 0);
    const leftForearm = new THREE.Mesh(leftForearmGeo, steelMat);
    leftForearm.castShadow = true;
    leftArm.add(leftForearm);

    // Heater Shield mounted to left arm
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.06, -0.14, -0.1);

    const shieldRimGeo = new THREE.BoxGeometry(0.08, 0.54, 0.38);
    const shieldRim = new THREE.Mesh(shieldRimGeo, goldMat);
    shieldRim.castShadow = true;
    shieldGroup.add(shieldRim);

    const shieldBodyGeo = new THREE.BoxGeometry(0.06, 0.5, 0.34);
    const shieldBody = new THREE.Mesh(shieldBodyGeo, shieldMat);
    shieldBody.castShadow = true;
    shieldGroup.add(shieldBody);

    // Steel cross emblem on shield
    const crossVGeo = new THREE.BoxGeometry(0.09, 0.36, 0.08);
    const crossVMesh = new THREE.Mesh(crossVGeo, steelMat);
    shieldGroup.add(crossVMesh);

    const crossHGeo = new THREE.BoxGeometry(0.09, 0.08, 0.22);
    const crossHMesh = new THREE.Mesh(crossHGeo, steelMat);
    shieldGroup.add(crossHMesh);

    leftArm.add(shieldGroup);
    modelGroup.add(leftArm);

    // 4. Right Arm (Shoulder pauldron + Gauntlet + Broadsword)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.36, 0.22, 0);

    const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    rightPauldron.castShadow = true;
    rightArm.add(rightPauldron);

    const rightForearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.24, 6);
    rightForearmGeo.translate(0, -0.12, 0);
    const rightForearm = new THREE.Mesh(rightForearmGeo, steelMat);
    rightForearm.castShadow = true;
    rightArm.add(rightForearm);

    // Broadsword held in hand
    const swordGroup = new THREE.Group();
    swordGroup.position.set(0.04, -0.16, -0.16);

    const guardGeo = new THREE.BoxGeometry(0.3, 0.06, 0.08);
    const guardMesh = new THREE.Mesh(guardGeo, goldMat);
    guardMesh.castShadow = true;
    swordGroup.add(guardMesh);

    const gripGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.16, 5);
    gripGeo.translate(0, -0.1, 0);
    const gripMesh = new THREE.Mesh(gripGeo, leatherMat);
    gripMesh.castShadow = true;
    swordGroup.add(gripMesh);

    const pommelGeo = new THREE.OctahedronGeometry(0.08, 0);
    pommelGeo.translate(0, -0.2, 0);
    const pommelMesh = new THREE.Mesh(pommelGeo, goldHiMat);
    pommelMesh.castShadow = true;
    swordGroup.add(pommelMesh);

    const bladeGeo = new THREE.BoxGeometry(0.06, 0.64, 0.12);
    bladeGeo.translate(0, 0.34, 0);
    const bladeMesh = new THREE.Mesh(bladeGeo, steelMat);
    bladeMesh.castShadow = true;
    swordGroup.add(bladeMesh);

    const fullerGeo = new THREE.BoxGeometry(0.07, 0.44, 0.03);
    fullerGeo.translate(0, 0.32, 0);
    const fullerMesh = new THREE.Mesh(fullerGeo, steelDarkMat);
    swordGroup.add(fullerMesh);

    rightArm.add(swordGroup);
    modelGroup.add(rightArm);

    // 5. Left Leg (Thigh + Knee + Armored Sabaton)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, -0.18, 0);

    const thighGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.22, 6);
    thighGeo.translate(0, -0.1, 0);
    const leftThigh = new THREE.Mesh(thighGeo, steelDarkMat);
    leftThigh.castShadow = true;
    leftLeg.add(leftThigh);

    const kneeGeo = new THREE.BoxGeometry(0.12, 0.09, 0.09);
    kneeGeo.translate(0, -0.2, -0.04);
    const leftKnee = new THREE.Mesh(kneeGeo, goldMat);
    leftKnee.castShadow = true;
    leftLeg.add(leftKnee);

    const bootGeo = new THREE.BoxGeometry(0.13, 0.2, 0.15);
    bootGeo.translate(0, -0.31, 0);
    const leftBoot = new THREE.Mesh(bootGeo, steelMat);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);

    const toeGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
    toeGeo.translate(0, -0.37, -0.08); // Points forward in -Z
    const leftToe = new THREE.Mesh(toeGeo, steelMat);
    leftToe.castShadow = true;
    leftLeg.add(leftToe);

    modelGroup.add(leftLeg);

    // 6. Right Leg (Thigh + Knee + Armored Sabaton)
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, -0.18, 0);

    const rightThigh = new THREE.Mesh(thighGeo, steelDarkMat);
    rightThigh.castShadow = true;
    rightLeg.add(rightThigh);

    const rightKnee = new THREE.Mesh(kneeGeo, goldMat);
    rightKnee.castShadow = true;
    rightLeg.add(rightKnee);

    const rightBoot = new THREE.Mesh(bootGeo, steelMat);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);

    const rightToe = new THREE.Mesh(toeGeo, steelMat);
    rightToe.castShadow = true;
    rightLeg.add(rightToe);

    modelGroup.add(rightLeg);

    // 7. Crimson Cape (+Z, trailing behind)
    const capeGeo = new THREE.BoxGeometry(0.44, 0.65, 0.04);
    capeGeo.translate(0, -0.06, 0.24);
    const capeMesh = new THREE.Mesh(capeGeo, plumeMat);
    capeMesh.rotation.x = 0.15;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    return {
      rootGroup,
      modelGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      capeMesh,
      materialsToFlash,
      originalColors,
      staffGemMesh: pommelMesh,
    };
  }

  /**
   * Elara: Arcane robe, wizard hat with wide brim & curved peak,
   * celestial glowing crystal staff, potion pouch, dynamic billowing cape.
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

    const robeMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageRobe);
    registerFlashable(robeMat, PALETTE.player.mageRobe);

    const hatMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageHat);
    registerFlashable(hatMat, PALETTE.player.mageHat);

    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    registerFlashable(goldMat, PALETTE.player.trimGold);

    const leatherMat = ToonMaterialFactory.getMaterial(PALETTE.player.bootsLeather);
    registerFlashable(leatherMat, PALETTE.player.bootsLeather);

    const headMat = ToonMaterialFactory.getMaterial(PALETTE.player.armorWhite);
    registerFlashable(headMat, PALETTE.player.armorWhite);

    const staffWoodMat = ToonMaterialFactory.getMaterial(PALETTE.player.staffWood);
    registerFlashable(staffWoodMat, PALETTE.player.staffWood);

    const glowMat = ToonMaterialFactory.getMaterial(PALETTE.player.mageGlow, {
      emissive: PALETTE.player.mageGlow,
      emissiveIntensity: 1.1,
    });

    // 1. Torso & Pleated Robe
    const torsoGroup = new THREE.Group();

    const robeGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.54, 7);
    robeGeo.translate(0, 0.04, 0);
    const robeMesh = new THREE.Mesh(robeGeo, robeMat);
    robeMesh.castShadow = true;
    robeMesh.receiveShadow = true;
    torsoGroup.add(robeMesh);

    // Gold embroidered collar mantle
    const mantleGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.12, 7);
    mantleGeo.translate(0, 0.26, 0);
    const mantleMesh = new THREE.Mesh(mantleGeo, goldMat);
    mantleMesh.castShadow = true;
    torsoGroup.add(mantleMesh);

    // Mystic sash & belt pouch
    const sashGeo = new THREE.CylinderGeometry(0.31, 0.33, 0.08, 7);
    sashGeo.translate(0, -0.14, 0);
    const sashMesh = new THREE.Mesh(sashGeo, goldMat);
    sashMesh.castShadow = true;
    torsoGroup.add(sashMesh);

    const pouchGeo = new THREE.BoxGeometry(0.1, 0.14, 0.08);
    pouchGeo.translate(-0.24, -0.14, 0);
    const pouchMesh = new THREE.Mesh(pouchGeo, leatherMat);
    pouchMesh.castShadow = true;
    torsoGroup.add(pouchMesh);

    modelGroup.add(torsoGroup);

    // 2. Head & Wizard Hat
    const headGroup = new THREE.Group();

    const headGeo = new THREE.DodecahedronGeometry(0.3, 0);
    headGeo.translate(0, 0.48, 0);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Arcane glowing eyes/visor (-Z)
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.12);
    visorGeo.translate(0, 0.48, -0.23);
    const visorMesh = new THREE.Mesh(visorGeo, glowMat);
    visorMesh.castShadow = true;
    headGroup.add(visorMesh);

    // Wide brim
    const brimGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.04, 10);
    brimGeo.translate(0, 0.62, 0);
    const brimMesh = new THREE.Mesh(brimGeo, hatMat);
    brimMesh.castShadow = true;
    headGroup.add(brimMesh);

    // Starry gold band
    const hatBandGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.07, 8);
    hatBandGeo.translate(0, 0.66, 0);
    const hatBandMesh = new THREE.Mesh(hatBandGeo, goldMat);
    hatBandMesh.castShadow = true;
    headGroup.add(hatBandMesh);

    // Hat cone tilted back
    const coneGeo = new THREE.CylinderGeometry(0.04, 0.28, 0.55, 7);
    coneGeo.translate(0, 0.92, -0.04);
    const coneMesh = new THREE.Mesh(coneGeo, hatMat);
    coneMesh.rotation.x = -0.15;
    coneMesh.castShadow = true;
    headGroup.add(coneMesh);

    // Curved whimsical tip
    const tipGeo = new THREE.ConeGeometry(0.06, 0.18, 4);
    tipGeo.translate(0, 1.18, -0.14);
    const tipMesh = new THREE.Mesh(tipGeo, hatMat);
    tipMesh.rotation.x = -0.3;
    tipMesh.castShadow = true;
    headGroup.add(tipMesh);

    modelGroup.add(headGroup);

    // 3. Left Arm (Flowing robe sleeve + Floating mana orb)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.34, 0.22, 0);

    const sleeveGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.28, 6);
    sleeveGeo.translate(0, -0.12, 0);
    const leftSleeve = new THREE.Mesh(sleeveGeo, robeMat);
    leftSleeve.castShadow = true;
    leftArm.add(leftSleeve);

    const orbGeo = new THREE.OctahedronGeometry(0.08, 0);
    orbGeo.translate(0, -0.28, -0.06);
    const orbMesh = new THREE.Mesh(orbGeo, glowMat);
    orbMesh.castShadow = true;
    leftArm.add(orbMesh);

    modelGroup.add(leftArm);

    // 4. Right Arm (Flowing sleeve + Arcane Staff)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.34, 0.22, 0);

    const rightSleeve = new THREE.Mesh(sleeveGeo, robeMat);
    rightSleeve.castShadow = true;
    rightArm.add(rightSleeve);

    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.04, 0.08, -0.16);

    const shaftGeo = new THREE.CylinderGeometry(0.035, 0.045, 1.1, 5);
    const shaftMesh = new THREE.Mesh(shaftGeo, staffWoodMat);
    shaftMesh.castShadow = true;
    staffGroup.add(shaftMesh);

    const clawGeo = new THREE.TorusGeometry(0.12, 0.03, 4, 8);
    clawGeo.translate(0, 0.58, 0);
    const clawMesh = new THREE.Mesh(clawGeo, goldMat);
    clawMesh.castShadow = true;
    staffGroup.add(clawMesh);

    const gemGeo = new THREE.OctahedronGeometry(0.15, 0);
    gemGeo.translate(0, 0.66, 0);
    const gemMesh = new THREE.Mesh(gemGeo, glowMat);
    gemMesh.castShadow = true;
    staffGroup.add(gemMesh);

    rightArm.add(staffGroup);
    modelGroup.add(rightArm);

    // 5. Left Leg & Boot
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.13, -0.18, 0);

    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.22, 5);
    legGeo.translate(0, -0.1, 0);
    const leftPants = new THREE.Mesh(legGeo, hatMat);
    leftPants.castShadow = true;
    leftLeg.add(leftPants);

    const bootGeo = new THREE.BoxGeometry(0.12, 0.18, 0.14);
    bootGeo.translate(0, -0.28, 0);
    const leftBoot = new THREE.Mesh(bootGeo, leatherMat);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);

    const toeGeo = new THREE.BoxGeometry(0.11, 0.08, 0.12);
    toeGeo.translate(0, -0.34, -0.07);
    const leftToe = new THREE.Mesh(toeGeo, leatherMat);
    leftToe.castShadow = true;
    leftLeg.add(leftToe);

    modelGroup.add(leftLeg);

    // 6. Right Leg & Boot
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.13, -0.18, 0);

    const rightPants = new THREE.Mesh(legGeo, hatMat);
    rightPants.castShadow = true;
    rightLeg.add(rightPants);

    const rightBoot = new THREE.Mesh(bootGeo, leatherMat);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);

    const rightToe = new THREE.Mesh(toeGeo, leatherMat);
    rightToe.castShadow = true;
    rightLeg.add(rightToe);

    modelGroup.add(rightLeg);

    // 7. Arcane Cape
    const capeGeo = new THREE.BoxGeometry(0.4, 0.62, 0.04);
    capeGeo.translate(0, -0.04, 0.22);
    const capeMesh = new THREE.Mesh(capeGeo, robeMat);
    capeMesh.rotation.x = 0.16;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    return {
      rootGroup,
      modelGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      capeMesh,
      materialsToFlash,
      originalColors,
      staffGemMesh: gemMesh,
    };
  }

  /**
   * Kage: Nocturnal stealth shinobi, hooded cowl, glowing emerald slit eyes,
   * flowing dual emerald scarf tails, dual curved obsidian daggers, agile tabi boots.
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

    const darkMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueDark);
    registerFlashable(darkMat, PALETTE.player.rogueDark);

    const cowlMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueCowl);
    registerFlashable(cowlMat, PALETTE.player.rogueCowl);

    const scarfMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueScarf);
    registerFlashable(scarfMat, PALETTE.player.rogueScarf);

    const steelMat = ToonMaterialFactory.getMaterial(PALETTE.player.knightSteel);
    registerFlashable(steelMat, PALETTE.player.knightSteel);

    const leatherDarkMat = ToonMaterialFactory.getMaterial(PALETTE.player.leatherDark);
    registerFlashable(leatherDarkMat, PALETTE.player.leatherDark);

    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    registerFlashable(goldMat, PALETTE.player.trimGold);

    const eyeMat = ToonMaterialFactory.getMaterial(PALETTE.player.rogueEyes, {
      emissive: PALETTE.player.rogueEyes,
      emissiveIntensity: 1.1,
    });

    // 1. Torso: Studded leather brigandine
    const torsoGroup = new THREE.Group();

    const tunicGeo = new THREE.CylinderGeometry(0.28, 0.24, 0.5, 6);
    tunicGeo.translate(0, 0.04, 0);
    const tunicMesh = new THREE.Mesh(tunicGeo, darkMat);
    tunicMesh.castShadow = true;
    tunicMesh.receiveShadow = true;
    torsoGroup.add(tunicMesh);

    // Crossed chest straps
    const harnessGeo = new THREE.BoxGeometry(0.26, 0.36, 0.06);
    harnessGeo.translate(0, 0.06, -0.12);
    const harnessMesh = new THREE.Mesh(harnessGeo, leatherDarkMat);
    harnessMesh.castShadow = true;
    torsoGroup.add(harnessMesh);

    // Shinobi belt & pouches
    const beltGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.07, 6);
    beltGeo.translate(0, -0.14, 0);
    const beltMesh = new THREE.Mesh(beltGeo, goldMat);
    beltMesh.castShadow = true;
    torsoGroup.add(beltMesh);

    const pouchGeo = new THREE.BoxGeometry(0.08, 0.1, 0.06);
    pouchGeo.translate(-0.22, -0.14, 0);
    const leftPouch = new THREE.Mesh(pouchGeo, leatherDarkMat);
    torsoGroup.add(leftPouch);

    const rightPouch = new THREE.Mesh(pouchGeo, leatherDarkMat);
    rightPouch.position.x = 0.44;
    torsoGroup.add(rightPouch);

    modelGroup.add(torsoGroup);

    // 2. Ninja Cowl & Mask
    const headGroup = new THREE.Group();

    const cowlGeo = new THREE.DodecahedronGeometry(0.29, 0);
    cowlGeo.translate(0, 0.48, 0);
    const cowlMesh = new THREE.Mesh(cowlGeo, cowlMat);
    cowlMesh.castShadow = true;
    headGroup.add(cowlMesh);

    // Lower cloth mask
    const maskGeo = new THREE.BoxGeometry(0.24, 0.15, 0.12);
    maskGeo.translate(0, 0.42, -0.2);
    const maskMesh = new THREE.Mesh(maskGeo, darkMat);
    maskMesh.castShadow = true;
    headGroup.add(maskMesh);

    // Sharp glowing emerald eyes (-Z)
    const eyeGeo = new THREE.BoxGeometry(0.22, 0.06, 0.1);
    eyeGeo.translate(0, 0.49, -0.22);
    const eyeMesh = new THREE.Mesh(eyeGeo, eyeMat);
    eyeMesh.castShadow = true;
    headGroup.add(eyeMesh);

    // Scarf wrap at neck
    const wrapGeo = new THREE.BoxGeometry(0.34, 0.12, 0.14);
    wrapGeo.translate(0, 0.26, 0);
    const wrapMesh = new THREE.Mesh(wrapGeo, scarfMat);
    wrapMesh.castShadow = true;
    headGroup.add(wrapMesh);

    modelGroup.add(headGroup);

    // 3. Left Arm & Dagger
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.32, 0.22, 0);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.24, 5);
    armGeo.translate(0, -0.11, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, darkMat);
    leftArmMesh.castShadow = true;
    leftArm.add(leftArmMesh);

    const bracerGeo = new THREE.BoxGeometry(0.1, 0.12, 0.1);
    bracerGeo.translate(0, -0.2, -0.04);
    const leftBracer = new THREE.Mesh(bracerGeo, leatherDarkMat);
    leftArm.add(leftBracer);

    // Reverse-grip dagger
    const d1Geo = new THREE.BoxGeometry(0.04, 0.36, 0.08);
    d1Geo.translate(0, -0.1, -0.14);
    const d1Mesh = new THREE.Mesh(d1Geo, steelMat);
    d1Mesh.castShadow = true;
    leftArm.add(d1Mesh);

    modelGroup.add(leftArm);

    // 4. Right Arm & Dagger
    const rightArm = new THREE.Group();
    rightArm.position.set(0.32, 0.22, 0);

    const rightArmMesh = new THREE.Mesh(armGeo, darkMat);
    rightArmMesh.castShadow = true;
    rightArm.add(rightArmMesh);

    const rightBracer = new THREE.Mesh(bracerGeo, leatherDarkMat);
    rightArm.add(rightBracer);

    // Forward-grip dagger
    const d2Geo = new THREE.BoxGeometry(0.04, 0.38, 0.08);
    d2Geo.translate(0, -0.1, -0.16);
    const d2Mesh = new THREE.Mesh(d2Geo, steelMat);
    d2Mesh.castShadow = true;
    rightArm.add(d2Mesh);

    modelGroup.add(rightArm);

    // 5. Left Leg & Tabi Boot
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.13, -0.16, 0);

    const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.22, 5);
    legGeo.translate(0, -0.1, 0);
    const leftPants = new THREE.Mesh(legGeo, darkMat);
    leftPants.castShadow = true;
    leftLeg.add(leftPants);

    const shinGeo = new THREE.BoxGeometry(0.11, 0.18, 0.12);
    shinGeo.translate(0, -0.27, 0);
    const leftShin = new THREE.Mesh(shinGeo, leatherDarkMat);
    leftShin.castShadow = true;
    leftLeg.add(leftShin);

    const footGeo = new THREE.BoxGeometry(0.1, 0.08, 0.15);
    footGeo.translate(0, -0.36, -0.05); // Forward in -Z
    const leftFoot = new THREE.Mesh(footGeo, cowlMat);
    leftFoot.castShadow = true;
    leftLeg.add(leftFoot);

    modelGroup.add(leftLeg);

    // 6. Right Leg & Tabi Boot
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.13, -0.16, 0);

    const rightPants = new THREE.Mesh(legGeo, darkMat);
    rightPants.castShadow = true;
    rightLeg.add(rightPants);

    const rightShin = new THREE.Mesh(shinGeo, leatherDarkMat);
    rightShin.castShadow = true;
    rightLeg.add(rightShin);

    const rightFoot = new THREE.Mesh(footGeo, cowlMat);
    rightFoot.castShadow = true;
    rightLeg.add(rightFoot);

    modelGroup.add(rightLeg);

    // 7. Dynamic Flowing Scarf Tail (acts as capeMesh)
    const tailGeo = new THREE.BoxGeometry(0.14, 0.46, 0.03);
    tailGeo.translate(0.1, 0.06, 0.22);
    const tailMesh = new THREE.Mesh(tailGeo, scarfMat);
    tailMesh.rotation.x = 0.22;
    tailMesh.castShadow = true;
    modelGroup.add(tailMesh);

    // Spinning Shuriken accessory
    const shurikenGeo = new THREE.OctahedronGeometry(0.11, 0);
    shurikenGeo.translate(-0.16, 0.12, 0.22);
    const shurikenMesh = new THREE.Mesh(shurikenGeo, eyeMat);
    shurikenMesh.castShadow = true;
    modelGroup.add(shurikenMesh);

    return {
      rootGroup,
      modelGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      capeMesh: tailMesh,
      materialsToFlash,
      originalColors,
      staffGemMesh: shurikenMesh,
    };
  }

  /**
   * Aurelius: Radiant golden plate crusader, floating celestial sun halo,
   * sacred white & gold tabard, lion-head pauldrons, holy sun warhammer.
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

    const goldMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarGold);
    registerFlashable(goldMat, PALETTE.player.templarGold);

    const sunMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarSun);
    registerFlashable(sunMat, PALETTE.player.templarSun);

    const whiteMat = ToonMaterialFactory.getMaterial(PALETTE.player.armorWhite);
    registerFlashable(whiteMat, PALETTE.player.armorWhite);

    const steelDarkMat = ToonMaterialFactory.getMaterial(PALETTE.player.steelDark);
    registerFlashable(steelDarkMat, PALETTE.player.steelDark);

    const leatherMat = ToonMaterialFactory.getMaterial(PALETTE.player.bootsLeather);
    registerFlashable(leatherMat, PALETTE.player.bootsLeather);

    const haloMat = ToonMaterialFactory.getMaterial(PALETTE.player.templarSun, {
      emissive: PALETTE.player.templarGlow,
      emissiveIntensity: 0.95,
    });

    // 1. Torso & Tabard
    const torsoGroup = new THREE.Group();

    const plateGeo = new THREE.CylinderGeometry(0.34, 0.28, 0.5, 6);
    plateGeo.translate(0, 0.04, 0);
    const plateMesh = new THREE.Mesh(plateGeo, goldMat);
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    torsoGroup.add(plateMesh);

    // Sunburst chest relief
    const sunburstGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 8);
    sunburstGeo.translate(0, 0.12, -0.2);
    const sunburstMesh = new THREE.Mesh(sunburstGeo, sunMat);
    sunburstMesh.castShadow = true;
    torsoGroup.add(sunburstMesh);

    // Front white ceremonial tabard with golden cross
    const tabardGeo = new THREE.BoxGeometry(0.24, 0.52, 0.04);
    tabardGeo.translate(0, -0.06, -0.22);
    const tabardMesh = new THREE.Mesh(tabardGeo, whiteMat);
    tabardMesh.castShadow = true;
    torsoGroup.add(tabardMesh);

    const crossVGeo = new THREE.BoxGeometry(0.06, 0.32, 0.05);
    crossVGeo.translate(0, -0.06, -0.23);
    const crossVMesh = new THREE.Mesh(crossVGeo, sunMat);
    torsoGroup.add(crossVMesh);

    const crossHGeo = new THREE.BoxGeometry(0.18, 0.06, 0.05);
    crossHGeo.translate(0, 0.02, -0.23);
    const crossHMesh = new THREE.Mesh(crossHGeo, sunMat);
    torsoGroup.add(crossHMesh);

    modelGroup.add(torsoGroup);

    // 2. Head & Golden Helm
    const headGroup = new THREE.Group();

    const helmGeo = new THREE.DodecahedronGeometry(0.32, 0);
    helmGeo.translate(0, 0.52, 0);
    const helmMesh = new THREE.Mesh(helmGeo, goldMat);
    helmMesh.castShadow = true;
    headGroup.add(helmMesh);

    // Slotted sun visor (-Z)
    const visorGeo = new THREE.BoxGeometry(0.26, 0.09, 0.14);
    visorGeo.translate(0, 0.52, -0.23);
    const visorMesh = new THREE.Mesh(visorGeo, sunMat);
    visorMesh.castShadow = true;
    headGroup.add(visorMesh);

    // Radiant Solar Halo (Floating behind head at +Z)
    const haloGroup = new THREE.Group();
    haloGroup.position.set(0, 0.56, 0.14);

    const haloRingGeo = new THREE.TorusGeometry(0.38, 0.035, 4, 16);
    const haloRingMesh = new THREE.Mesh(haloRingGeo, haloMat);
    haloRingMesh.castShadow = true;
    haloGroup.add(haloRingMesh);

    // 4 Solar Rays
    for (let i = 0; i < 4; i++) {
      const rayGeo = new THREE.ConeGeometry(0.04, 0.14, 4);
      rayGeo.translate(0, 0.44, 0);
      const rayMesh = new THREE.Mesh(rayGeo, haloMat);
      rayMesh.rotation.z = (i * Math.PI) / 2;
      haloGroup.add(rayMesh);
    }

    headGroup.add(haloGroup);
    modelGroup.add(headGroup);

    // 3. Left Arm (Lion pauldron + Holy Kite Shield)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.36, 0.22, 0);

    const pauldronGeo = new THREE.BoxGeometry(0.26, 0.24, 0.26);
    const leftPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    leftPauldron.castShadow = true;
    leftArm.add(leftPauldron);

    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.24, 6);
    armGeo.translate(0, -0.12, 0);
    const leftForearm = new THREE.Mesh(armGeo, goldMat);
    leftForearm.castShadow = true;
    leftArm.add(leftForearm);

    // Sun Shield
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(-0.06, -0.14, -0.08);

    const shieldBodyGeo = new THREE.BoxGeometry(0.06, 0.52, 0.34);
    const shieldBody = new THREE.Mesh(shieldBodyGeo, whiteMat);
    shieldBody.castShadow = true;
    shieldGroup.add(shieldBody);

    const shieldSunGeo = new THREE.OctahedronGeometry(0.12, 0);
    shieldSunGeo.translate(-0.04, 0, 0);
    const shieldSun = new THREE.Mesh(shieldSunGeo, sunMat);
    shieldGroup.add(shieldSun);

    leftArm.add(shieldGroup);
    modelGroup.add(leftArm);

    // 4. Right Arm (Lion pauldron + Blessed Sun Warhammer)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.36, 0.22, 0);

    const rightPauldron = new THREE.Mesh(pauldronGeo, goldMat);
    rightPauldron.castShadow = true;
    rightArm.add(rightPauldron);

    const rightForearm = new THREE.Mesh(armGeo, goldMat);
    rightForearm.castShadow = true;
    rightArm.add(rightForearm);

    // Warhammer
    const hammerGroup = new THREE.Group();
    hammerGroup.position.set(0.04, -0.06, -0.18);

    const shaftGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.76, 5);
    shaftGeo.translate(0, 0.04, 0);
    const shaftMesh = new THREE.Mesh(shaftGeo, leatherMat);
    shaftMesh.castShadow = true;
    hammerGroup.add(shaftMesh);

    const hammerHeadGeo = new THREE.BoxGeometry(0.2, 0.16, 0.28);
    hammerHeadGeo.translate(0, 0.36, 0);
    const hammerHeadMesh = new THREE.Mesh(hammerHeadGeo, goldMat);
    hammerHeadMesh.castShadow = true;
    hammerGroup.add(hammerHeadMesh);

    const hammerGemGeo = new THREE.OctahedronGeometry(0.09, 0);
    hammerGemGeo.translate(0, 0.36, 0);
    const hammerGemMesh = new THREE.Mesh(hammerGemGeo, haloMat);
    hammerGemMesh.castShadow = true;
    hammerGroup.add(hammerGemMesh);

    rightArm.add(hammerGroup);
    modelGroup.add(rightArm);

    // 5. Left Leg & Golden Sabaton
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.14, -0.18, 0);

    const thighGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.22, 6);
    thighGeo.translate(0, -0.1, 0);
    const leftThigh = new THREE.Mesh(thighGeo, steelDarkMat);
    leftThigh.castShadow = true;
    leftLeg.add(leftThigh);

    const kneeGeo = new THREE.BoxGeometry(0.12, 0.09, 0.09);
    kneeGeo.translate(0, -0.2, -0.04);
    const leftKnee = new THREE.Mesh(kneeGeo, sunMat);
    leftKnee.castShadow = true;
    leftLeg.add(leftKnee);

    const bootGeo = new THREE.BoxGeometry(0.14, 0.2, 0.15);
    bootGeo.translate(0, -0.31, 0);
    const leftBoot = new THREE.Mesh(bootGeo, goldMat);
    leftBoot.castShadow = true;
    leftLeg.add(leftBoot);

    const toeGeo = new THREE.BoxGeometry(0.13, 0.08, 0.12);
    toeGeo.translate(0, -0.37, -0.08); // Forward in -Z
    const leftToe = new THREE.Mesh(toeGeo, goldMat);
    leftToe.castShadow = true;
    leftLeg.add(leftToe);

    modelGroup.add(leftLeg);

    // 6. Right Leg & Golden Sabaton
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.14, -0.18, 0);

    const rightThigh = new THREE.Mesh(thighGeo, steelDarkMat);
    rightThigh.castShadow = true;
    rightLeg.add(rightThigh);

    const rightKnee = new THREE.Mesh(kneeGeo, sunMat);
    rightKnee.castShadow = true;
    rightLeg.add(rightKnee);

    const rightBoot = new THREE.Mesh(bootGeo, goldMat);
    rightBoot.castShadow = true;
    rightLeg.add(rightBoot);

    const rightToe = new THREE.Mesh(toeGeo, goldMat);
    rightToe.castShadow = true;
    rightLeg.add(rightToe);

    modelGroup.add(rightLeg);

    // 7. White & Gold Cape
    const capeGeo = new THREE.BoxGeometry(0.44, 0.65, 0.04);
    capeGeo.translate(0, -0.05, 0.24);
    const capeMesh = new THREE.Mesh(capeGeo, whiteMat);
    capeMesh.rotation.x = 0.14;
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    return {
      rootGroup,
      modelGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      capeMesh,
      materialsToFlash,
      originalColors,
      staffGemMesh: hammerGemMesh,
    };
  }
}
