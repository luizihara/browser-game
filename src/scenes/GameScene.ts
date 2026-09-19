import * as THREE from 'three';
import { BaseScene, type SceneContext } from './Scene';
import type { Renderer } from '../core/Renderer';
import { World } from '../world/World';
import { Player } from '../entities/player/Player';
import { PlayerController } from '../entities/player/PlayerController';
import { GameCamera } from '../camera/GameCamera';
import { CameraController } from '../camera/CameraController';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private gameCamera: GameCamera;
  private cameraController: CameraController;
  private world: World | null = null;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;

  constructor(context: SceneContext, renderer: Renderer) {
    super(context);
    this.renderer = renderer;
    this.threeScene = new THREE.Scene();
    this.gameCamera = new GameCamera(window.innerWidth, window.innerHeight);
    this.cameraController = new CameraController(this.gameCamera);
  }

  public override enter(): void {
    if (!this.world) {
      this.world = new World(this.threeScene);
    }
    if (!this.player) {
      this.player = new Player();
      this.player.addToScene(this.threeScene);
      this.playerController = new PlayerController(this.player, this.context.inputSystem);
      this.cameraController.setTarget(this.player.position, true);
    }
  }

  public override update(deltaTime: number): void {
    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.gameCamera.getThreeCamera());
  }

  public override resize(width: number, height: number): void {
    this.gameCamera.resize(width, height);
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

  public getCameraController(): CameraController {
    return this.cameraController;
  }

  public getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  public getGameCamera(): GameCamera {
    return this.gameCamera;
  }
}
