import * as THREE from 'three';
import { ToonMaterialFactory } from './ToonMaterialFactory';
import { PALETTE } from './Palette';

export interface PlayerVisualComponents {
  rootGroup: THREE.Group;
  modelGroup: THREE.Group;
  materialsToFlash: THREE.MeshToonMaterial[];
  originalColors: number[];
  staffGemMesh: THREE.Mesh;
}

/**
 * Builds the Stylized Chibi Hero / Knight-Mage model using low-poly toon primitives.
 * Keeps triangle count well below 1,000 for exceptional browser performance.
 */
export class CharacterBuilder {
  public static buildPlayerHero(): PlayerVisualComponents {
    const rootGroup = new THREE.Group();
    const modelGroup = new THREE.Group();
    rootGroup.add(modelGroup);

    const materialsToFlash: THREE.MeshToonMaterial[] = [];
    const originalColors: number[] = [];

    const registerFlashable = (mat: THREE.MeshToonMaterial, color: number) => {
      materialsToFlash.push(mat);
      originalColors.push(color);
    };

    // 1. Torso: Faceted cylinder tunic
    const tunicMat = ToonMaterialFactory.getMaterial(PALETTE.player.tunic);
    registerFlashable(tunicMat, PALETTE.player.tunic);

    const torsoGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.55, 6);
    torsoGeo.translate(0, 0, 0);
    const torsoMesh = new THREE.Mesh(torsoGeo, tunicMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    modelGroup.add(torsoMesh);

    // 2. Leather Belt & Buckle
    const beltMat = ToonMaterialFactory.getMaterial(PALETTE.player.bootsLeather);
    const beltGeo = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 6);
    beltGeo.translate(0, -0.12, 0);
    const beltMesh = new THREE.Mesh(beltGeo, beltMat);
    beltMesh.castShadow = true;
    modelGroup.add(beltMesh);

    const buckleMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    const buckleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.08);
    buckleGeo.translate(0, -0.12, -0.32);
    const buckleMesh = new THREE.Mesh(buckleGeo, buckleMat);
    buckleMesh.castShadow = true;
    modelGroup.add(buckleMesh);

    // 3. Head & Helmet (Low-poly faceted)
    const helmetMat = ToonMaterialFactory.getMaterial(PALETTE.player.armorWhite);
    registerFlashable(helmetMat, PALETTE.player.armorWhite);

    const headGeo = new THREE.DodecahedronGeometry(0.32, 0);
    headGeo.translate(0, 0.48, 0);
    const headMesh = new THREE.Mesh(headGeo, helmetMat);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    modelGroup.add(headMesh);

    // 4. Helmet Crest (Gold ridge)
    const crestMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    const crestGeo = new THREE.BoxGeometry(0.08, 0.22, 0.32);
    crestGeo.translate(0, 0.68, 0.02);
    const crestMesh = new THREE.Mesh(crestGeo, crestMat);
    crestMesh.castShadow = true;
    modelGroup.add(crestMesh);

    // 5. Visor (Glow emissive cyan facing front -Z)
    const visorMat = ToonMaterialFactory.getMaterial(PALETTE.player.visorGlow, {
      emissive: PALETTE.player.visorGlow,
      emissiveIntensity: 0.8,
    });
    const visorGeo = new THREE.BoxGeometry(0.28, 0.1, 0.15);
    visorGeo.translate(0, 0.48, -0.25);
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.castShadow = true;
    modelGroup.add(visorMesh);

    // 6. Shoulders / Pauldrons (Left & Right)
    const pauldronMat = ToonMaterialFactory.getMaterial(PALETTE.player.trimGold);
    registerFlashable(pauldronMat, PALETTE.player.trimGold);

    const pauldronGeo = new THREE.DodecahedronGeometry(0.16, 0);

    const leftPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    leftPauldron.position.set(-0.38, 0.2, 0);
    leftPauldron.castShadow = true;
    modelGroup.add(leftPauldron);

    const rightPauldron = new THREE.Mesh(pauldronGeo, pauldronMat);
    rightPauldron.position.set(0.38, 0.2, 0);
    rightPauldron.castShadow = true;
    modelGroup.add(rightPauldron);

    // 7. Heroic Cape (Back +Z)
    const capeMat = ToonMaterialFactory.getMaterial(PALETTE.player.tunic);
    const capeGeo = new THREE.BoxGeometry(0.38, 0.55, 0.05);
    capeGeo.translate(0, -0.05, 0.24);
    const capeMesh = new THREE.Mesh(capeGeo, capeMat);
    capeMesh.rotation.x = 0.15; // Flow slightly backwards
    capeMesh.castShadow = true;
    modelGroup.add(capeMesh);

    // 8. Staff Weapon (Held on right side)
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.42, 0.05, -0.15);

    const staffHandleMat = ToonMaterialFactory.getMaterial(PALETTE.player.staffWood);
    const staffHandleGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.95, 5);
    staffHandleGeo.translate(0, 0, 0);
    const staffHandleMesh = new THREE.Mesh(staffHandleGeo, staffHandleMat);
    staffHandleMesh.castShadow = true;
    staffGroup.add(staffHandleMesh);

    const staffGemMat = ToonMaterialFactory.getMaterial(PALETTE.player.staffGem, {
      emissive: PALETTE.player.staffGem,
      emissiveIntensity: 0.6,
    });
    const staffGemGeo = new THREE.OctahedronGeometry(0.12, 0);
    staffGemGeo.translate(0, 0.52, 0);
    const staffGemMesh = new THREE.Mesh(staffGemGeo, staffGemMat);
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
}
