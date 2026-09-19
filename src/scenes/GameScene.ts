import * as THREE from 'three';
import { BaseScene, type SceneContext } from './Scene';
import type { Renderer } from '../core/Renderer';
import { World } from '../world/World';
import { Player } from '../entities/player/Player';
import { PlayerController } from '../entities/player/PlayerController';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private world: World | null = null;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;

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
    this.camera.position.set(0, 15, 12);
    this.camera.lookAt(0, 0, 0);
  }

  public override enter(): void {
    if (!this.world) {
      this.world = new World(this.threeScene);
    }
    if (!this.player) {
      this.player = new Player();
      this.player.addToScene(this.threeScene);
      this.playerController = new PlayerController(this.player, this.context.inputSystem);
    }
  }

  public override update(deltaTime: number): void {
    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.camera);
  }

  public override resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public override dispose(): void {
    if (this.player) {
      this.player.removeFromScene(this.threeScene);
      this.player.dispose();
      this.player = null;
      this.playerController = null;
    }
    if (this.world) {
      this.world.dispose();
      this.world = null;
    }
  }

  public getPlayer(): Player | null {
    return this.player;
  }

  public getPlayerController(): PlayerController | null {
    return this.playerController;
  }

  public getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}
