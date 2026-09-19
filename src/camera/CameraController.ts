import * as THREE from 'three';
import type { GameCamera } from './GameCamera';
import { CAMERA_CONFIG } from '../config/cameraConfig';
import type { Updatable } from '../types';

export class CameraController implements Updatable {
  private gameCamera: GameCamera;
  private target: THREE.Vector3 | null = null;
  // Reusable Vector3 to eliminate per-frame allocations
  private desiredPosition: THREE.Vector3 = new THREE.Vector3();
  private lookTarget: THREE.Vector3 = new THREE.Vector3();

  constructor(gameCamera: GameCamera) {
    this.gameCamera = gameCamera;
  }

  public setTarget(target: THREE.Vector3 | null, instant: boolean = false): void {
    this.target = target;
    if (instant && this.target) {
      this.snap();
    }
  }

  public snap(): void {
    if (!this.target) return;
    const camera = this.gameCamera.getThreeCamera();

    camera.position.set(
      this.target.x + CAMERA_CONFIG.offset.x,
      this.target.y + CAMERA_CONFIG.offset.y,
      this.target.z + CAMERA_CONFIG.offset.z
    );

    this.lookTarget.set(
      this.target.x + CAMERA_CONFIG.lookAtOffset.x,
      this.target.y + CAMERA_CONFIG.lookAtOffset.y,
      this.target.z + CAMERA_CONFIG.lookAtOffset.z
    );
    camera.lookAt(this.lookTarget);
  }

  public update(deltaTime: number): void {
    if (!this.target) return;
    const camera = this.gameCamera.getThreeCamera();

    this.desiredPosition.set(
      this.target.x + CAMERA_CONFIG.offset.x,
      this.target.y + CAMERA_CONFIG.offset.y,
      this.target.z + CAMERA_CONFIG.offset.z
    );

    // Frame-rate independent exponential smoothing
    const t = 1.0 - Math.exp(-CAMERA_CONFIG.smoothFactor * deltaTime);
    camera.position.lerp(this.desiredPosition, t);

    this.lookTarget.set(
      this.target.x + CAMERA_CONFIG.lookAtOffset.x,
      this.target.y + CAMERA_CONFIG.lookAtOffset.y,
      this.target.z + CAMERA_CONFIG.lookAtOffset.z
    );
    camera.lookAt(this.lookTarget);
  }

  public getGameCamera(): GameCamera {
    return this.gameCamera;
  }
}
