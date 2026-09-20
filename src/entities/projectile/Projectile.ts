import * as THREE from 'three';
import { Entity } from '../Entity';
import { WEAPON_CONFIG } from '../../config/weaponConfig';

export class Projectile extends Entity {
  public damage: number;
  public speed: number;
  public radius: number;
  public lifetime: number;
  public isExpired: boolean = false;
  public readonly color: number;
  private dirX: number;
  private dirZ: number;

  constructor(
    startX: number,
    startY: number,
    startZ: number,
    dirX: number,
    dirZ: number,
    damage: number = WEAPON_CONFIG.wand.damage,
    speed: number = WEAPON_CONFIG.wand.projectileSpeed,
    radius: number = WEAPON_CONFIG.wand.projectileRadius,
    lifetime: number = WEAPON_CONFIG.wand.projectileLifetime,
    color: number = WEAPON_CONFIG.wand.color,
    emissiveColor: number = WEAPON_CONFIG.wand.emissiveColor,
    emissiveIntensity: number = WEAPON_CONFIG.wand.emissiveIntensity,
    isDagger: boolean = false
  ) {
    let geo: THREE.BufferGeometry;
    if (isDagger) {
      geo = new THREE.ConeGeometry(radius, radius * 3.5, 6);
      geo.rotateX(Math.PI / 2);
    } else {
      geo = new THREE.SphereGeometry(radius, 8, 8);
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: emissiveColor,
      emissiveIntensity,
      roughness: 0.2,
      metalness: 0.6,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    super(mesh);

    this.damage = damage;
    this.speed = speed;
    this.radius = radius;
    this.lifetime = lifetime;
    this.color = color;
    this.dirX = dirX;
    this.dirZ = dirZ;

    this.position.set(startX, startY, startZ);

    if (isDagger) {
      this.mesh.rotation.y = Math.atan2(dirX, dirZ);
    }
  }

  public override update(deltaTime: number): void {
    if (this.isExpired) return;

    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) {
      this.isExpired = true;
      return;
    }

    this.position.x += this.dirX * this.speed * deltaTime;
    this.position.z += this.dirZ * this.speed * deltaTime;
  }

  public override dispose(): void {
    if (this.mesh instanceof THREE.Mesh) {
      this.mesh.geometry.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach((m) => m.dispose());
      } else {
        this.mesh.material.dispose();
      }
    }
  }
}
