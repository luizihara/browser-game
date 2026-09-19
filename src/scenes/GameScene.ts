import * as THREE from 'three';
import { BaseScene, type SceneContext } from './Scene';
import type { Renderer } from '../core/Renderer';
import { World } from '../world/World';
import { Player } from '../entities/player/Player';
import { PlayerController } from '../entities/player/PlayerController';
import { EntityManager } from '../entities/EntityManager';
import { GameCamera } from '../camera/GameCamera';
import { CameraController } from '../camera/CameraController';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { InputAction } from '../systems/InputSystem';
import { formatTime } from '../utils/math';
import { FpsTracker, IS_DEV } from '../utils/debug';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private gameCamera: GameCamera;
  private cameraController: CameraController;
  private world: World | null = null;
  private entityManager: EntityManager;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private isPaused: boolean = false;
  private runTime: number = 0;
  private fpsTracker: FpsTracker;

  constructor(context: SceneContext, renderer: Renderer) {
    super(context);
    this.renderer = renderer;
    this.threeScene = new THREE.Scene();
    this.entityManager = new EntityManager(this.threeScene);
    this.gameCamera = new GameCamera(window.innerWidth, window.innerHeight);
    this.cameraController = new CameraController(this.gameCamera);
    this.hud = new HUD();
    this.fpsTracker = new FpsTracker();
    this.pauseMenu = new PauseMenu(
      () => this.resume(),
      () => this.goToMainMenu()
    );
  }

  public override enter(): void {
    if (!this.world) {
      this.world = new World(this.threeScene);
    }
    if (!this.player) {
      this.player = new Player();
      this.entityManager.add(this.player);
      this.playerController = new PlayerController(
        this.player,
        this.context.inputSystem,
        this.world.getBounds()
      );
      this.cameraController.setTarget(this.player.position, true);
    } else if (this.playerController && this.world) {
      this.playerController.setBounds(this.world.getBounds());
    }

    this.isPaused = false;
    this.runTime = 0;
    this.hud.mount(this.context.uiRoot);
    this.hud.updateTime(formatTime(this.runTime));
  }

  public override update(deltaTime: number): void {
    if (this.context.inputSystem.isActionJustPressed(InputAction.Pause)) {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
      return;
    }

    if (this.isPaused) {
      return;
    }

    this.runTime += deltaTime;
    this.hud.updateTime(formatTime(this.runTime));

    this.entityManager.update(deltaTime);

    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }
    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);
      if (IS_DEV) {
        const fps = this.fpsTracker.update();
        this.hud.updateDebug(
          fps,
          this.player.position.x,
          this.player.position.y,
          this.player.position.z
        );
      }
    }
  }

  public pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseMenu.mount(this.context.uiRoot);
  }

  public resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.pauseMenu.unmount();
    this.context.inputSystem.reset();
  }

  private goToMainMenu(): void {
    this.resume();
    this.context.switchScene('menu');
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.gameCamera.getThreeCamera());
  }

  public override resize(width: number, height: number): void {
    this.gameCamera.resize(width, height);
  }

  public override exit(): void {
    this.pauseMenu.unmount();
    this.hud.unmount();
    this.isPaused = false;
  }

  public override dispose(): void {
    this.pauseMenu.unmount();
    this.hud.unmount();
    this.entityManager.dispose();
    this.player = null;
    this.playerController = null;
    if (this.world) {
      this.world.dispose();
      this.world = null;
    }
  }

  public getEntityManager(): EntityManager {
    return this.entityManager;
  }

  public getWorld(): World | null {
    return this.world;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getRunTime(): number {
    return this.runTime;
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

  public getHUD(): HUD {
    return this.hud;
  }

  public getThreeScene(): THREE.Scene {
    return this.threeScene;
  }

  public getGameCamera(): GameCamera {
    return this.gameCamera;
  }
}
