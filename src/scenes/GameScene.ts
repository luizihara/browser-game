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
import { ExperienceSystem } from '../systems/ExperienceSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { DirectorSystem } from '../systems/DirectorSystem';
import { GameCamera } from '../camera/GameCamera';
import { CameraController } from '../camera/CameraController';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { GameOverMenu } from '../ui/GameOverMenu';
import { LevelUpMenu } from '../ui/LevelUpMenu';
import { VictoryMenu, type WeaponDamageStat } from '../ui/VictoryMenu';
import { MetaManager } from '../config/metaConfig';
import { DIRECTOR_CONFIG } from '../config/directorConfig';
import type { WeaponId } from '../config/weaponConfig';
import { InputAction } from '../systems/InputSystem';
import { formatTime } from '../utils/math';
import { FpsTracker, IS_DEV } from '../utils/debug';
import { PLAYER_CONFIG } from '../config/playerConfig';
import type { Enemy } from '../entities/enemy/Enemy';
import type { UpgradeId } from '../config/upgradeConfig';
import { ParticleSystem } from '../fx/ParticleSystem';
import { SoundManager } from '../audio/SoundManager';

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
  private experienceSystem: ExperienceSystem;
  private upgradeSystem: UpgradeSystem;
  private directorSystem: DirectorSystem;
  private particleSystem: ParticleSystem;
  private soundManager: SoundManager;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private gameOverMenu: GameOverMenu;
  private levelUpMenu: LevelUpMenu;
  private victoryMenu: VictoryMenu;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private isLevelingUp: boolean = false;
  private isVictory: boolean = false;
  private runTime: number = 0;
  private killCount: number = 0;
  private totalDamageDealt: number = 0;
  private weaponDamageDealt: Record<WeaponId, number> = {
    wand: 0,
    orbital: 0,
    aura: 0,
    dagger: 0,
  };
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

    this.particleSystem = new ParticleSystem(this.threeScene);
    this.soundManager = new SoundManager();
    this.enemySpawner = new EnemySpawner(this.entityManager, null, null);
    this.enemyMovementSystem = new EnemyMovementSystem(null, null);
    this.combatSystem = new CombatSystem(null);
    this.weaponSystem = new WeaponSystem(this.entityManager, this.threeScene);
    this.experienceSystem = new ExperienceSystem(this.entityManager);
    this.upgradeSystem = new UpgradeSystem();
    this.directorSystem = new DirectorSystem();

    this.pauseMenu = new PauseMenu(
      () => this.resume(),
      () => this.goToMainMenu()
    );

    this.gameOverMenu = new GameOverMenu(
      () => this.restart(),
      () => this.goToMainMenu()
    );

    this.levelUpMenu = new LevelUpMenu((upgradeId) => this.chooseUpgrade(upgradeId));
    this.victoryMenu = new VictoryMenu(
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
    this.weaponSystem.setScene(this.threeScene);
    this.particleSystem.setScene(this.threeScene);

    if (IS_DEV && !this.sandboxSpawner) {
      this.sandboxSpawner = new SandboxSpawner(this.entityManager, bounds);
    }

    this.isPaused = false;
    this.isGameOver = false;
    this.isLevelingUp = false;
    this.runTime = 0;
    this.killCount = 0;

    this.experienceSystem.reset();
    this.upgradeSystem.reset(this.player!, this.weaponSystem, this.experienceSystem);
    this.directorSystem.reset();

    this.hud.mount(this.context.uiRoot);
    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);

    const xpProg = this.experienceSystem.getProgress();
    this.hud.updateXp(xpProg.ratio, xpProg.level);

    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }
  }

  public override update(deltaTime: number): void {
    if (this.isLevelingUp || this.isGameOver || this.isVictory) {
      this.particleSystem.update(deltaTime);
      this.cameraController.update(deltaTime);
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
        this.experienceSystem.clear();
        this.particleSystem.clear();
      }
    }

    this.runTime += deltaTime;
    this.hud.updateTime(formatTime(this.runTime));

    // Check Victory condition (Stage clear at victoryTime)
    if (this.runTime >= DIRECTOR_CONFIG.victoryTime && !this.isVictory && !this.isGameOver) {
      this.triggerVictory();
      return;
    }

    // Update active entities (Player, Dummies, Projectiles, XpGems)
    this.entityManager.update(deltaTime);
    this.particleSystem.update(deltaTime);

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
        this.enemySpawner.getEnemies(),
        (killedEnemy) => this.onEnemyDefeated(killedEnemy),
        (_enemy, hitX, hitY, hitZ, weaponId, dmg) => {
          this.soundManager.playHit();
          this.particleSystem.emitHitSparks(hitX, hitY, hitZ);
          if (weaponId && dmg) {
            this.totalDamageDealt += dmg;
            this.weaponDamageDealt[weaponId] = (this.weaponDamageDealt[weaponId] || 0) + dmg;
          }
        },
        () => {
          this.soundManager.playShoot();
        }
      );
    }

    // Director: Timeline, scaling multipliers, and scripted wave events
    this.directorSystem.update(deltaTime, this.enemySpawner, (event) => {
      this.hud.showWaveAlert(event.title, event.subtitle, event.isElite);
      this.soundManager.playWaveAlert();
      this.cameraController.addTrauma(0.4);
    });

    // Update Enemies & Spawner with Director scaling
    this.enemySpawner.update(deltaTime, this.directorSystem);
    this.enemyMovementSystem.update(this.enemySpawner.getEnemies(), deltaTime);

    // Combat: Player vs Enemies & Projectiles vs Enemies
    this.combatSystem.update(
      this.enemySpawner.getEnemies(),
      this.weaponSystem.getActiveProjectiles(),
      (killedEnemy) => this.onEnemyDefeated(killedEnemy),
      (hitProjectile) => {
        this.weaponSystem.removeProjectile(hitProjectile);
      },
      () => {
        this.cameraController.addTrauma(0.25);
      },
      (_enemy, hitX, hitY, hitZ, projectile, weaponId, dmg) => {
        this.soundManager.playHit();
        this.particleSystem.emitHitSparks(
          hitX,
          hitY,
          hitZ,
          projectile?.color
        );
        const wId = weaponId ?? projectile?.weaponId ?? 'wand';
        const d = dmg ?? projectile?.damage ?? 10;
        this.totalDamageDealt += d;
        this.weaponDamageDealt[wId] = (this.weaponDamageDealt[wId] || 0) + d;
      }
    );

    // Update Experience & Pickups
    if (this.player) {
      this.experienceSystem.update(
        deltaTime,
        this.player,
        (newLevel) => {
          this.triggerLevelUp(newLevel);
        },
        () => {
          this.soundManager.playGemPickup();
        }
      );

      const xpProg = this.experienceSystem.getProgress();
      this.hud.updateXp(xpProg.ratio, xpProg.level);
    }

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

  private onEnemyDefeated(killedEnemy: Enemy): void {
    this.killCount++;
    this.hud.updateKills(this.killCount);
    this.soundManager.playEnemyDeath();
    this.particleSystem.emitDeathExplosion(
      killedEnemy.position.x,
      killedEnemy.position.y,
      killedEnemy.position.z,
      killedEnemy.getColor()
    );
    // Spawn XP gem with the dead enemy's tier and amount
    this.experienceSystem.spawnGem(
      killedEnemy.position.x,
      killedEnemy.position.z,
      killedEnemy.gemTier,
      killedEnemy.xpReward
    );
    this.enemySpawner.removeEnemy(killedEnemy);
  }

  private triggerLevelUp(level: number): void {
    this.isLevelingUp = true;
    this.soundManager.playLevelUp();
    if (this.player) {
      this.particleSystem.emitLevelUpBurst(
        this.player.position.x,
        this.player.position.y,
        this.player.position.z
      );
    }
    const choices = this.upgradeSystem.getRandomUpgrades(3, this.weaponSystem);
    this.levelUpMenu.mount(this.context.uiRoot, level, choices);
  }

  private chooseUpgrade(upgradeId: UpgradeId): void {
    if (!this.player) return;

    this.upgradeSystem.applyUpgrade(
      upgradeId,
      this.player,
      this.weaponSystem,
      this.experienceSystem
    );
    this.levelUpMenu.unmount();
    this.isLevelingUp = false;
    this.context.inputSystem.reset();
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.soundManager.playGameOver();
    const level = this.experienceSystem.getLevel();
    const goldEarned = Math.floor(this.killCount * 0.5 + this.runTime * 0.2 + level * 5);
    MetaManager.getInstance().submitRun(
      this.runTime,
      level,
      this.killCount,
      goldEarned
    );
    this.gameOverMenu.mount(this.context.uiRoot, formatTime(this.runTime));
  }

  private triggerVictory(): void {
    this.isVictory = true;
    this.soundManager.playLevelUp();
    this.cameraController.addTrauma(0.5);

    const level = this.experienceSystem.getLevel();
    const goldEarned = Math.floor(this.killCount * 1.0 + this.runTime * 0.5 + level * 20);
    const isNewRecord = MetaManager.getInstance().submitRun(
      this.runTime,
      level,
      this.killCount,
      goldEarned
    );

    const weaponStats: WeaponDamageStat[] = (Object.keys(this.weaponDamageDealt) as WeaponId[])
      .filter((id) => this.weaponDamageDealt[id] > 0)
      .map((id) => ({
        weaponId: id,
        damage: this.weaponDamageDealt[id],
      }));

    this.victoryMenu.mount(this.context.uiRoot, {
      runTime: formatTime(this.runTime),
      killCount: this.killCount,
      totalDamage: this.totalDamageDealt,
      levelReached: level,
      goldEarned,
      weaponStats,
      isNewRecord,
    });
  }

  public restart(): void {
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.isGameOver = false;
    this.isVictory = false;
    this.isPaused = false;
    this.isLevelingUp = false;
    this.runTime = 0;
    this.killCount = 0;
    this.totalDamageDealt = 0;
    this.weaponDamageDealt = {
      wand: 0,
      orbital: 0,
      aura: 0,
      dagger: 0,
    };

    if (this.player) {
      this.upgradeSystem.reset(
        this.player,
        this.weaponSystem,
        this.experienceSystem
      );
      this.player.position.set(
        PLAYER_CONFIG.initialPosition.x,
        PLAYER_CONFIG.initialPosition.y,
        PLAYER_CONFIG.initialPosition.z
      );
      this.cameraController.setTarget(this.player.position, true);
      this.cameraController.resetTrauma();
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }

    this.enemySpawner.clear();
    this.weaponSystem.clear();
    this.particleSystem.clear();
    this.cameraController.resetTrauma();
    this.experienceSystem.reset();
    this.directorSystem.reset();
    this.sandboxSpawner?.clearDummies();

    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);
    const xpProg = this.experienceSystem.getProgress();
    this.hud.updateXp(xpProg.ratio, xpProg.level);

    this.context.inputSystem.reset();
  }

  public pause(): void {
    if (this.isPaused || this.isGameOver || this.isVictory || this.isLevelingUp) return;
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
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isLevelingUp = false;
    this.context.switchScene('menu');
  }

  public override render(): void {
    this.renderer.render(this.threeScene, this.gameCamera.getThreeCamera());
  }

  public override resize(width: number, height: number): void {
    this.gameCamera.resize(width, height);
  }

  public override exit(): void {
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.hud.unmount();
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isLevelingUp = false;
  }

  public override dispose(): void {
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.hud.unmount();
    if (this.sandboxSpawner) {
      this.sandboxSpawner.dispose();
      this.sandboxSpawner = null;
    }
    this.particleSystem.dispose();
    this.soundManager.dispose();
    this.weaponSystem.dispose();
    this.enemySpawner.dispose();
    this.experienceSystem.dispose();
    this.entityManager.dispose();
    this.player = null;
    this.playerController = null;
    if (this.world) {
      this.world.dispose();
      this.world = null;
    }
  }

  public getDirectorSystem(): DirectorSystem {
    return this.directorSystem;
  }

  public getExperienceSystem(): ExperienceSystem {
    return this.experienceSystem;
  }

  public getUpgradeSystem(): UpgradeSystem {
    return this.upgradeSystem;
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

  public getIsLevelingUp(): boolean {
    return this.isLevelingUp;
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

  public getParticleSystem(): ParticleSystem {
    return this.particleSystem;
  }

  public getSoundManager(): SoundManager {
    return this.soundManager;
  }
}
