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
  private basePosition: THREE.Vector3 = new THREE.Vector3();
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  // Trauma-based camera shake
  private trauma: number = 0;
  private traumaTime: number = 0;

  constructor(gameCamera: GameCamera) {
    this.gameCamera = gameCamera;
    this.basePosition.copy(gameCamera.getThreeCamera().position);
  }

  public setTarget(target: THREE.Vector3 | null, instant: boolean = false): void {
    this.target = target;
    if (instant && this.target) {
      this.snap();
    }
  }

  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + Math.max(0, amount));
  }

  public getTrauma(): number {
    return this.trauma;
  }

  public resetTrauma(): void {
    this.trauma = 0;
  }

  public snap(): void {
    if (!this.target) return;
    const camera = this.gameCamera.getThreeCamera();

    this.basePosition.set(
      this.target.x + CAMERA_CONFIG.offset.x,
      this.target.y + CAMERA_CONFIG.offset.y,
      this.target.z + CAMERA_CONFIG.offset.z
    );
    camera.position.copy(this.basePosition);

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
    this.basePosition.lerp(this.desiredPosition, t);
    camera.position.copy(this.basePosition);

    // Process screen shake trauma
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - CAMERA_CONFIG.shake.decayRate * deltaTime);
      const intensity = this.trauma * this.trauma;

      if (intensity > 0.0001) {
        this.traumaTime += deltaTime * CAMERA_CONFIG.shake.frequency;
        const maxOffset = CAMERA_CONFIG.shake.maxOffset;

        // Damped high-frequency offsets using trigonometric pseudo-noise
        const nx = Math.sin(this.traumaTime * 1.1) * 0.7 + Math.sin(this.traumaTime * 2.3) * 0.3;
        const ny = Math.cos(this.traumaTime * 1.3) * 0.5 + Math.sin(this.traumaTime * 2.7) * 0.5;
        const nz = Math.sin(this.traumaTime * 1.7) * 0.7 + Math.cos(this.traumaTime * 1.9) * 0.3;

        this.shakeOffset.set(
          nx * maxOffset * intensity,
          ny * maxOffset * intensity,
          nz * maxOffset * intensity
        );
        camera.position.add(this.shakeOffset);
      }
    }

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
