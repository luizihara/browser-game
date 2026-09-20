import * as THREE from 'three';
import { Entity } from '../Entity';
import { ToonMaterialFactory } from '../../art/ToonMaterialFactory';

export type BreakableType = 'pot' | 'barrel' | 'crystal';

export class BreakableProp extends Entity {
  public readonly propType: BreakableType;
  public radius: number = 0.6;
  public hp: number = 1;
  public isDead: boolean = false;
  private color: number;

  constructor(x: number, z: number, propType: BreakableType = 'pot') {
    const group = new THREE.Group();
    super(group);

    this.propType = propType;
    this.color = this.buildModel(group, propType);
    this.position.set(x, 0, z);
  }

  private buildModel(group: THREE.Group, type: BreakableType): number {
    switch (type) {
      case 'pot': {
        // Ancient Terracotta Urn
        const mat = ToonMaterialFactory.getMaterial(0xd97706);
        const rimMat = ToonMaterialFactory.getMaterial(0xb45309);

        // Body
        const bodyGeo = new THREE.DodecahedronGeometry(0.55, 0);
        bodyGeo.scale(1.0, 1.3, 1.0);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.55;
        body.castShadow = true;
        group.add(body);

        // Neck / Rim
        const rimGeo = new THREE.CylinderGeometry(0.32, 0.25, 0.25, 6);
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 1.05;
        rim.castShadow = true;
        group.add(rim);

        return 0xd97706;
      }

      case 'barrel': {
        // Volcanic Reinforced Cask
        const woodMat = ToonMaterialFactory.getMaterial(0x451a03);
        const metalMat = ToonMaterialFactory.getMaterial(0xd97706);

        // Barrel Body
        const bodyGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.1, 7);
        const body = new THREE.Mesh(bodyGeo, woodMat);
        body.position.y = 0.55;
        body.castShadow = true;
        group.add(body);

        // Metal Band Top
        const bandTopGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 7);
        const bandTop = new THREE.Mesh(bandTopGeo, metalMat);
        bandTop.position.y = 0.85;
        group.add(bandTop);

        // Metal Band Bottom
        const bandBotGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 7);
        const bandBot = new THREE.Mesh(bandBotGeo, metalMat);
        bandBot.position.y = 0.25;
        group.add(bandBot);

        return 0x9a3412;
      }

      case 'crystal': {
        // Frost Permafrost Crystal Cluster
        const iceMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.8,
          roughness: 0.15,
          metalness: 0.3,
        });

        // Main spire
        const spire1Geo = new THREE.ConeGeometry(0.35, 1.4, 5);
        const spire1 = new THREE.Mesh(spire1Geo, iceMat);
        spire1.position.set(0, 0.7, 0);
        spire1.rotation.x = 0.1;
        spire1.castShadow = true;
        group.add(spire1);

        // Secondary spires
        const spire2Geo = new THREE.ConeGeometry(0.22, 0.9, 4);
        const spire2 = new THREE.Mesh(spire2Geo, iceMat);
        spire2.position.set(0.25, 0.45, 0.2);
        spire2.rotation.z = -0.3;
        spire2.castShadow = true;
        group.add(spire2);

        const spire3Geo = new THREE.ConeGeometry(0.2, 0.75, 4);
        const spire3 = new THREE.Mesh(spire3Geo, iceMat);
        spire3.position.set(-0.22, 0.38, -0.15);
        spire3.rotation.x = -0.25;
        spire3.castShadow = true;
        group.add(spire3);

        return 0x38bdf8;
      }
    }
  }

  public getColor(): number {
    return this.color;
  }

  public takeDamage(amount: number): boolean {
    if (this.isDead) return true;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  public override dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
