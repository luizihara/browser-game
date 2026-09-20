import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import type { Disposable } from '../types';

export class Lighting implements Disposable {
  private ambientLight: THREE.HemisphereLight;
  private directionalLight: THREE.DirectionalLight;

  constructor() {
    this.ambientLight = new THREE.HemisphereLight(
      WORLD_CONFIG.hemisphereSkyColor,
      WORLD_CONFIG.hemisphereGroundColor,
      WORLD_CONFIG.hemisphereIntensity
    );

    this.directionalLight = new THREE.DirectionalLight(
      WORLD_CONFIG.directionalColor,
      WORLD_CONFIG.directionalIntensity
    );
    this.directionalLight.position.set(
      WORLD_CONFIG.directionalPosition.x,
      WORLD_CONFIG.directionalPosition.y,
      WORLD_CONFIG.directionalPosition.z
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 120;
    this.directionalLight.shadow.bias = -0.0005;

    const d = 40;
    this.directionalLight.shadow.camera.left = -d;
    this.directionalLight.shadow.camera.right = d;
    this.directionalLight.shadow.camera.top = d;
    this.directionalLight.shadow.camera.bottom = -d;
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.ambientLight);
    scene.add(this.directionalLight);
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.ambientLight);
    scene.remove(this.directionalLight);
  }

  public dispose(): void {
    this.directionalLight.dispose();
  }
}
