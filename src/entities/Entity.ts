import * as THREE from 'three';
import type { Disposable, Updatable } from '../types';

export abstract class Entity implements Disposable, Updatable {
  protected mesh: THREE.Object3D;

  constructor(mesh: THREE.Object3D) {
    this.mesh = mesh;
  }

  public get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  public get rotation(): THREE.Euler {
    return this.mesh.rotation;
  }

  public getMesh(): THREE.Object3D {
    return this.mesh;
  }

  public update(_deltaTime: number): void {}

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
  }

  public dispose(): void {
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
