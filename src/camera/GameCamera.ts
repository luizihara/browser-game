import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/cameraConfig';

export class GameCamera {
  private camera: THREE.PerspectiveCamera;

  constructor(width: number, height: number) {
    const aspect = height > 0 ? width / height : 1;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      aspect,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public getThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
