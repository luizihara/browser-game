import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import type { Disposable } from '../types';

export class Ground implements Disposable {
  private mesh: THREE.Mesh;
  private grid: THREE.GridHelper;

  constructor() {
    const geometry = new THREE.PlaneGeometry(WORLD_CONFIG.size, WORLD_CONFIG.size);
    const material = new THREE.MeshStandardMaterial({
      color: WORLD_CONFIG.groundColor,
      roughness: 0.8,
      metalness: 0.1,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;

    this.grid = new THREE.GridHelper(
      WORLD_CONFIG.size,
      WORLD_CONFIG.gridDivisions,
      WORLD_CONFIG.gridColor2,
      WORLD_CONFIG.gridColor1
    );
    this.grid.position.y = 0.01; // Slightly above ground to prevent z-fighting
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
    scene.add(this.grid);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    scene.remove(this.grid);
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    this.grid.geometry.dispose();
    if (Array.isArray(this.grid.material)) {
      this.grid.material.forEach((m) => m.dispose());
    } else {
      this.grid.material.dispose();
    }
  }
}
