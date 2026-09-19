import * as THREE from 'three';
import { CAMERA_CONFIG } from '../config/cameraConfig';

export class GameCamera {
  private camera: THREE.PerspectiveCamera;

  constructor(width: number, height: number) {
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public getThreeCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
