import * as THREE from 'three';
import { GRAPHICS_CONFIG } from '../config/graphicsConfig';
import type { Disposable } from '../types';

export class Renderer implements Disposable {
  private renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: GRAPHICS_CONFIG.antialias,
      powerPreference: 'high-performance',
    });

    this.updatePixelRatio();
    this.renderer.setClearColor(GRAPHICS_CONFIG.clearColor);
    this.renderer.shadowMap.enabled = GRAPHICS_CONFIG.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.resize(window.innerWidth, window.innerHeight);
  }

  public updatePixelRatio(): void {
    const pixelRatio = Math.min(window.devicePixelRatio, GRAPHICS_CONFIG.maxPixelRatio);
    this.renderer.setPixelRatio(pixelRatio);
  }

  public resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.updatePixelRatio();
    this.renderer.setSize(width, height, false);
  }

  public render(scene: THREE.Scene, camera: THREE.Camera): void {
    this.renderer.render(scene, camera);
  }

  public getThreeRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public dispose(): void {
    this.renderer.dispose();
  }
}
