import * as THREE from 'three';
import { BaseScene, type SceneContext } from './Scene';
import type { Renderer } from '../core/Renderer';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  constructor(context: SceneContext, renderer: Renderer) {
    super(context);
    this.renderer = renderer;
    this.threeScene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 15);
    this.camera.lookAt(0, 0, 0);
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.camera);
  }

  public override resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
