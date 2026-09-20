import * as THREE from 'three';
import { BaseScene, type SceneContext } from './Scene';
import type { Renderer } from '../core/Renderer';
import { World } from '../world/World';
import { Player } from '../entities/player/Player';
import { PlayerController } from '../entities/player/PlayerController';
import { EntityManager } from '../entities/EntityManager';
import { SandboxSpawner } from '../systems/SandboxSpawner';
import { EnemySpawner } from '../systems/EnemySpawner';
import { EnemyMovementSystem } from '../systems/EnemyMovementSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import { GameCamera } from '../camera/GameCamera';
import { CameraController } from '../camera/CameraController';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { GameOverMenu } from '../ui/GameOverMenu';
import { InputAction } from '../systems/InputSystem';
import { formatTime } from '../utils/math';
import { FpsTracker, IS_DEV } from '../utils/debug';
import { PLAYER_CONFIG } from '../config/playerConfig';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private gameCamera: GameCamera;
  private cameraController: CameraController;
  private world: World | null = null;
  private entityManager: EntityManager;
  private sandboxSpawner: SandboxSpawner | null = null;
  private enemySpawner: EnemySpawner;
  private enemyMovementSystem: EnemyMovementSystem;
  private combatSystem: CombatSystem;
  private weaponSystem: WeaponSystem;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private gameOverMenu: GameOverMenu;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private runTime: number = 0;
  private killCount: number = 0;
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

    this.enemySpawner = new EnemySpawner(this.entityManager, null, null);
    this.enemyMovementSystem = new EnemyMovementSystem(null, null);
    this.combatSystem = new CombatSystem(null);
    this.weaponSystem = new WeaponSystem(this.entityManager);

    this.pauseMenu = new PauseMenu(
      () => this.resume(),
      () => this.goToMainMenu()
    );

    this.gameOverMenu = new GameOverMenu(
      () => this.restart(),
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

    const bounds = this.world.getBounds();
    this.enemySpawner.setTarget(this.player);
    this.enemySpawner.setBounds(bounds);
    this.enemyMovementSystem.setTarget(this.player);
    this.enemyMovementSystem.setBounds(bounds);
    this.combatSystem.setPlayer(this.player);

    if (IS_DEV && !this.sandboxSpawner) {
      this.sandboxSpawner = new SandboxSpawner(this.entityManager, bounds);
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.runTime = 0;
    this.killCount = 0;

    this.hud.mount(this.context.uiRoot);
    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);

    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }
  }

  public override update(deltaTime: number): void {
    if (this.isGameOver) {
      return;
    }

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

    // Dev Debug Keybinds
    if (IS_DEV) {
      if (this.context.inputSystem.isActionJustPressed(InputAction.DebugSpawn)) {
        this.sandboxSpawner?.spawnBatch();
      }
      if (this.context.inputSystem.isActionJustPressed(InputAction.DebugSpawnEnemy)) {
        this.enemySpawner.spawnBatch();
      }
      if (this.context.inputSystem.isActionJustPressed(InputAction.DebugClear)) {
        this.sandboxSpawner?.clearDummies();
        this.enemySpawner.clear();
        this.weaponSystem.clear();
      }
    }

    this.runTime += deltaTime;
    this.hud.updateTime(formatTime(this.runTime));

    // Update active entities (Player, Dummies, Projectiles)
    this.entityManager.update(deltaTime);

    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }

    // Update Weapons & Automatic Attacks
    if (this.player) {
      this.weaponSystem.update(
        deltaTime,
        this.player,
        this.enemySpawner.getEnemies()
      );
    }

    // Update Enemies
    this.enemySpawner.update(deltaTime, this.runTime);
    this.enemyMovementSystem.update(this.enemySpawner.getEnemies(), deltaTime);

    // Combat: Player vs Enemies & Projectiles vs Enemies
    this.combatSystem.update(
      this.enemySpawner.getEnemies(),
      this.weaponSystem.getActiveProjectiles(),
      (killedEnemy) => {
        this.killCount++;
        this.hud.updateKills(this.killCount);
        this.enemySpawner.removeEnemy(killedEnemy);
      },
      (hitProjectile) => {
        this.weaponSystem.removeProjectile(hitProjectile);
      }
    );

    // Check Player Status & Update HUD
    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);

      if (this.player.hp <= 0) {
        this.triggerGameOver();
        return;
      }

      if (IS_DEV) {
        const fps = this.fpsTracker.update();
        this.hud.updateDebug(
          fps,
          this.player.position.x,
          this.player.position.y,
          this.player.position.z,
          this.entityManager.getCount()
        );
      }
    }
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.gameOverMenu.mount(this.context.uiRoot, formatTime(this.runTime));
  }

  public restart(): void {
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.isGameOver = false;
    this.isPaused = false;
    this.runTime = 0;
    this.killCount = 0;

    if (this.player) {
      this.player.resetHp();
      this.player.position.set(
        PLAYER_CONFIG.initialPosition.x,
        PLAYER_CONFIG.initialPosition.y,
        PLAYER_CONFIG.initialPosition.z
      );
      this.cameraController.setTarget(this.player.position, true);
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }

    this.enemySpawner.clear();
    this.weaponSystem.clear();
    this.sandboxSpawner?.clearDummies();

    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);
    this.context.inputSystem.reset();
  }

  public pause(): void {
    if (this.isPaused || this.isGameOver) return;
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
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.isPaused = false;
    this.isGameOver = false;
    this.context.switchScene('menu');
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.gameCamera.getThreeCamera());
  }

  public override resize(width: number, height: number): void {
    this.gameCamera.resize(width, height);
  }

  public override exit(): void {
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.hud.unmount();
    this.isPaused = false;
    this.isGameOver = false;
  }

  public override dispose(): void {
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.hud.unmount();
    if (this.sandboxSpawner) {
      this.sandboxSpawner.dispose();
      this.sandboxSpawner = null;
    }
    this.weaponSystem.dispose();
    this.enemySpawner.dispose();
    this.entityManager.dispose();
    this.player = null;
    this.playerController = null;
    if (this.world) {
      this.world.dispose();
      this.world = null;
    }
  }

  public getKillCount(): number {
    return this.killCount;
  }

  public getWeaponSystem(): WeaponSystem {
    return this.weaponSystem;
  }

  public getEnemySpawner(): EnemySpawner {
    return this.enemySpawner;
  }

  public getSandboxSpawner(): SandboxSpawner | null {
    return this.sandboxSpawner;
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

  public getIsGameOver(): boolean {
    return this.isGameOver;
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
