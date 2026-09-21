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
import { PickupSystem } from '../systems/PickupSystem';
import type { PickupItem } from '../entities/pickup/PickupItem';
import { TreasureChestModal } from '../ui/TreasureChestModal';
import { EXPERIENCE_CONFIG } from '../config/experienceConfig';
import { CHARACTER_CONFIG } from '../config/characterConfig';
import { Boss } from '../entities/boss/Boss';
import type { BossId } from '../config/bossConfig';
import { TelegraphSystem } from '../systems/TelegraphSystem';
import { RadarSystem } from '../systems/RadarSystem';
import { DamageNumberSystem, type DamageNumberType } from '../fx/DamageNumberSystem';
import { STAGE_CONFIG, type StageId } from '../config/stageConfig';
import { DestructibleSystem, type PropDrop } from '../systems/DestructibleSystem';
import { EnemyAbilitySystem } from '../systems/EnemyAbilitySystem';
import type { BreakableProp } from '../entities/destructible/BreakableProp';
import { AuraWeapon } from '../weapons/AuraWeapon';
import { ACHIEVEMENTS_CONFIG } from '../config/achievementConfig';
import { RelicSystem } from '../systems/RelicSystem';
import { TORMENT_CONFIG } from '../config/tormentConfig';

export class GameScene extends BaseScene {
  public readonly name: string = 'game';
  private renderer: Renderer;
  private threeScene: THREE.Scene;
  private gameCamera: GameCamera;
  private cameraController: CameraController;
  private unsubscribeAchievement: (() => void) | null = null;
  private tookDamageThisRun: boolean = false;
  private relicSystem: RelicSystem = new RelicSystem();
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
  private destructibleSystem: DestructibleSystem;
  private currentStageId: StageId = 'verdant';
  private weatherTimer: number = 0;
  private particleSystem: ParticleSystem;
  private damageNumberSystem: DamageNumberSystem = new DamageNumberSystem();
  private telegraphSystem: TelegraphSystem = new TelegraphSystem();
  private enemyAbilitySystem: EnemyAbilitySystem = new EnemyAbilitySystem();
  private radarSystem: RadarSystem = new RadarSystem();
  private activeBoss: Boss | null = null;
  private combatEnemies: Enemy[] = [];
  private soundManager: SoundManager;
  private player: Player | null = null;
  private playerController: PlayerController | null = null;
  private hud: HUD;
  private pauseMenu: PauseMenu;
  private gameOverMenu: GameOverMenu;
  private levelUpMenu: LevelUpMenu;
  private victoryMenu: VictoryMenu;
  private chestModal: TreasureChestModal;
  private pickupSystem: PickupSystem;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;
  private isLevelingUp: boolean = false;
  private isVictory: boolean = false;
  private isEndless: boolean = false;
  private isChestOpening: boolean = false;
  private runTime: number = 0;
  private killCount: number = 0;
  private totalDamageDealt: number = 0;
  private weaponDamageDealt: Record<WeaponId, number> = {
    wand: 0,
    orbital: 0,
    aura: 0,
    dagger: 0,
    hammer: 0,
    flask: 0,
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
    this.pickupSystem = new PickupSystem(this.entityManager);
    this.destructibleSystem = new DestructibleSystem(this.entityManager);
    this.upgradeSystem = new UpgradeSystem();
    this.directorSystem = new DirectorSystem();
    this.chestModal = new TreasureChestModal();

    this.pauseMenu = new PauseMenu(
      () => this.resume(),
      () => this.goToMainMenu()
    );

    this.gameOverMenu = new GameOverMenu(
      () => this.restart(),
      () => this.goToMainMenu()
    );

    this.levelUpMenu = new LevelUpMenu({
      onSelect: (upgradeId) => this.chooseUpgrade(upgradeId),
      onReroll: () => this.handleReroll(),
      onSkip: () => this.handleSkip(),
      onBanish: (upgradeId) => this.handleBanish(upgradeId),
    });
    this.victoryMenu = new VictoryMenu(
      () => this.restart(),
      () => this.goToMainMenu(),
      () => this.continueEndlessMode()
    );
  }

  public override enter(): void {
    const selectedCharId = MetaManager.getInstance().getSelectedCharacter();
    const charDef = CHARACTER_CONFIG[selectedCharId] ?? CHARACTER_CONFIG.knight;

    this.currentStageId = MetaManager.getInstance().getSelectedStage();
    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;

    if (!this.world) {
      this.world = new World(this.threeScene);
    }
    this.world.applyStage(stageDef);
    this.soundManager.startBiomeAmbience(stageDef.ambientTheme);

    if (!this.player) {
      this.player = new Player(selectedCharId);
      this.entityManager.add(this.player);
      this.playerController = new PlayerController(
        this.player,
        this.context.inputSystem,
        this.world.getBounds()
      );
      this.cameraController.setTarget(this.player.position, true);
    } else {
      this.player.setCharacter(selectedCharId);
      if (this.playerController && this.world) {
        this.playerController.setBounds(this.world.getBounds());
      }
    }

    const bounds = this.world.getBounds();
    this.destructibleSystem.initForStage(stageDef.destructibleType, bounds);
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
    this.isVictory = false;
    this.isEndless = false;
    this.isChestOpening = false;
    this.runTime = 0;
    this.killCount = 0;
    this.totalDamageDealt = 0;
    this.weaponDamageDealt = {
      wand: 0,
      orbital: 0,
      aura: 0,
      dagger: 0,
      hammer: 0,
      flask: 0,
    };
    this.tookDamageThisRun = false;

    if (this.unsubscribeAchievement) {
      this.unsubscribeAchievement();
    }
    this.unsubscribeAchievement = MetaManager.getInstance().onAchievementUnlocked((id) => {
      const def = ACHIEVEMENTS_CONFIG[id];
      if (def) {
        this.soundManager.playAchievementUnlock();
        this.hud.showAchievementToast(def.title, def.rewardGold, def.icon);
      }
    });

    this.pickupSystem.clear();
    this.experienceSystem.reset();
    this.upgradeSystem.reset(
      this.player!,
      this.weaponSystem,
      this.experienceSystem,
      charDef.startingWeapon
    );
    this.directorSystem.reset();

    const tormentRank = MetaManager.getInstance().getSelectedTorment();
    const tormentCfg = TORMENT_CONFIG[tormentRank] ?? TORMENT_CONFIG[0];
    this.directorSystem.setTormentModifiers(
      tormentCfg.enemyHpMult,
      tormentCfg.enemySpeedMult,
      tormentCfg.enemyDamageMult
    );

    this.relicSystem.reset();
    this.applyPermanentMetaUpgrades();

    this.hud.mount(this.context.uiRoot);
    this.hud.setEndlessMode(false);
    this.hud.updateRelics(this.relicSystem.getActiveRelics());
    this.damageNumberSystem.mount(this.context.uiRoot);
    this.telegraphSystem.setScene(this.threeScene);
    this.enemyAbilitySystem.setScene(this.threeScene);
    this.enemyAbilitySystem.reset();
    this.radarSystem.mount(this.context.uiRoot);
    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);

    const xpProg = this.experienceSystem.getProgress();
    this.hud.updateXp(xpProg.ratio, xpProg.level);

    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }
  }

  public override update(deltaTime: number): void {
    if (this.isLevelingUp || this.isGameOver || this.isVictory || this.isChestOpening) {
      this.particleSystem.update(deltaTime);
      this.cameraController.update(deltaTime);
      this.damageNumberSystem.update(
        deltaTime,
        this.gameCamera.getThreeCamera(),
        window.innerWidth,
        window.innerHeight
      );
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
        this.removeActiveBoss();
        this.telegraphSystem.clear();
        this.weaponSystem.clear();
        this.experienceSystem.clear();
        this.pickupSystem.clear();
        this.particleSystem.clear();
      }
    }

    this.runTime += deltaTime;
    this.hud.updateTime(formatTime(this.runTime));

    if (this.runTime >= 120 && !this.tookDamageThisRun) {
      MetaManager.getInstance().unlockAchievement('untouchable');
    }

    // Check Victory condition (Stage clear at victoryTime)
    if (this.runTime >= DIRECTOR_CONFIG.victoryTime && !this.isVictory && !this.isGameOver) {
      this.triggerVictory();
      return;
    }

    // Update active entities (Player, Dummies, Projectiles, XpGems)
    this.entityManager.update(deltaTime);
    this.particleSystem.update(deltaTime);
    this.damageNumberSystem.update(
      deltaTime,
      this.gameCamera.getThreeCamera(),
      window.innerWidth,
      window.innerHeight
    );

    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
    if (this.cameraController) {
      this.cameraController.update(deltaTime);
    }

    this.telegraphSystem.update(deltaTime);

    // Update Boss AI, attacks and danger telegraphs
    if (this.activeBoss && !this.activeBoss.isDead && this.player) {
      this.activeBoss.updateAI(
        deltaTime,
        this.player,
        this.telegraphSystem,
        (x, y, z, damage, radius) => {
          this.soundManager.playBombExplosion();
          this.cameraController.addTrauma(0.55);
          this.particleSystem.emitDeathExplosion(x, y + 0.1, z, 0xf97316);
          if (this.player && this.player.hp > 0) {
            const pdx = this.player.position.x - x;
            const pdz = this.player.position.z - z;
            if (pdx * pdx + pdz * pdz <= radius * radius) {
              const took = this.player.takeDamage(damage);
              if (took) {
                this.tookDamageThisRun = true;
                this.soundManager.playHit();
                this.damageNumberSystem.spawn(
                  this.player.position.x,
                  this.player.position.y + 0.8,
                  this.player.position.z,
                  damage,
                  'hero'
                );
              }
            }
          }
        },
        (x, _y, z) => {
          this.soundManager.playShoot();
          this.cameraController.addTrauma(0.4);
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const hx = x + Math.cos(angle) * 3.5;
            const hz = z + Math.sin(angle) * 3.5;
            this.particleSystem.emitHitSparks(hx, 0.5, hz, 0xef4444);
          }
          if (this.player && this.player.hp > 0) {
            const pdx = this.player.position.x - x;
            const pdz = this.player.position.z - z;
            if (pdx * pdx + pdz * pdz <= 5.0 * 5.0) {
              const took = this.player.takeDamage(25);
              if (took) {
                this.tookDamageThisRun = true;
                this.soundManager.playHit();
                this.damageNumberSystem.spawn(
                  this.player.position.x,
                  this.player.position.y + 0.8,
                  this.player.position.z,
                  25,
                  'hero'
                );
              }
            }
          }
        }
      );

      // Contact damage against player
      if (this.player.hp > 0 && !this.activeBoss.isDead) {
        const bDist = this.activeBoss.radius + this.player.radius;
        const bdx = this.player.position.x - this.activeBoss.position.x;
        const bdz = this.player.position.z - this.activeBoss.position.z;
        if (bdx * bdx + bdz * bdz <= bDist * bDist) {
          const took = this.player.takeDamage(this.activeBoss.contactDamage);
          if (took) {
            this.tookDamageThisRun = true;
            this.soundManager.playHit();
            this.cameraController.addTrauma(0.3);
            this.damageNumberSystem.spawn(
              this.player.position.x,
              this.player.position.y + 0.8,
              this.player.position.z,
              this.activeBoss.contactDamage,
              'hero'
            );
          }
        }
      }
    }

    // Assemble combat targets (Normal enemies + Boss)
    this.combatEnemies.length = 0;
    const spawnerEnemies = this.enemySpawner.getEnemies();
    for (let i = 0; i < spawnerEnemies.length; i++) {
      this.combatEnemies.push(spawnerEnemies[i]);
    }
    if (this.activeBoss && !this.activeBoss.isDead) {
      this.combatEnemies.push(this.activeBoss);
    }

    // Update Weapons & Automatic Attacks
    if (this.player) {
      this.weaponSystem.update(
        deltaTime,
        this.player,
        this.combatEnemies,
        (killedEnemy) => this.onEnemyDefeated(killedEnemy),
        (_enemy, hitX, hitY, hitZ, weaponId, dmg) => {
          this.soundManager.playHit();
          this.particleSystem.emitHitSparks(hitX, hitY, hitZ);
          if (weaponId && dmg) {
            this.totalDamageDealt += dmg;
            this.weaponDamageDealt[weaponId] = (this.weaponDamageDealt[weaponId] || 0) + dmg;
            const type: DamageNumberType =
              weaponId === 'wand'
                ? 'magic'
                : weaponId === 'aura'
                  ? 'holy'
                  : weaponId === 'dagger'
                    ? 'shadow'
                    : 'default';
            this.damageNumberSystem.spawn(hitX, hitY, hitZ, dmg, type, false);
          }
        },
        () => {
          this.soundManager.playShoot();
        }
      );
    }

    // Director: Timeline, scaling multipliers, and scripted wave events
    this.directorSystem.update(
      deltaTime,
      this.enemySpawner,
      (event) => {
        this.hud.showWaveAlert(event.title, event.subtitle, event.isElite);
        this.soundManager.playWaveAlert();
        this.cameraController.addTrauma(0.4);
      },
      (bossId) => {
        this.spawnBoss(bossId);
      }
    );

    // Update Enemies & Spawner with Director scaling
    this.enemySpawner.update(deltaTime, this.directorSystem);
    this.enemyMovementSystem.update(this.enemySpawner.getEnemies(), deltaTime);

    // Combat: Player vs Enemies & Projectiles vs Enemies
    this.combatSystem.update(
      this.combatEnemies,
      this.weaponSystem.getActiveProjectiles(),
      (killedEnemy) => this.onEnemyDefeated(killedEnemy),
      (hitProjectile) => {
        this.weaponSystem.removeProjectile(hitProjectile);
      },
      () => {
        this.tookDamageThisRun = true;
        this.cameraController.addTrauma(0.25);
        if (this.player) {
          this.damageNumberSystem.spawn(
            this.player.position.x,
            this.player.position.y + 0.8,
            this.player.position.z,
            15,
            'hero',
            false
          );
        }
      },
      (_enemy, hitX, hitY, hitZ, projectile, weaponId, dmg, isCrit) => {
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

        if (wId === 'hammer') {
          this.soundManager.playLightning();
          this.particleSystem.emitLightningSparks(hitX, hitY, hitZ, 6);
        } else if (wId === 'flask') {
          this.soundManager.playPotionShatter();
          this.particleSystem.emitChemicalSplash(hitX, hitY, hitZ, 6);
        }

        const type: DamageNumberType =
          wId === 'wand'
            ? 'magic'
            : wId === 'aura'
              ? 'holy'
              : wId === 'dagger'
                ? 'shadow'
                : wId === 'hammer'
                  ? 'lightning'
                  : wId === 'flask'
                    ? 'fire'
                    : 'default';
        this.damageNumberSystem.spawn(hitX, hitY, hitZ, d, type, isCrit ?? false);

        if (isCrit && this.player) {
          this.relicSystem.onCritDamage(d, this.player, this.damageNumberSystem, this.soundManager);
        }
      }
    );

    if (this.activeBoss) {
      this.hud.updateBossHp(this.activeBoss.hp, this.activeBoss.maxHp);
    }

    if (this.player) {
      this.enemyAbilitySystem.update(
        deltaTime,
        this.player,
        this.combatEnemies,
        this.currentStageId,
        this.telegraphSystem,
        this.particleSystem,
        this.damageNumberSystem,
        this.soundManager,
        this.cameraController,
        (killedEnemy) => this.onEnemyDefeated(killedEnemy)
      );
    }

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

    // Update Relics & Artifact Powers
    if (this.player) {
      this.relicSystem.update(
        deltaTime,
        this.player,
        this.combatEnemies,
        this.experienceSystem,
        this.particleSystem,
        this.soundManager,
        this.damageNumberSystem,
        (killedEnemy) => this.onEnemyDefeated(killedEnemy)
      );
    }

    // Update Special Arena Pickups
    if (this.player) {
      this.pickupSystem.update(deltaTime, this.player, (item) => {
        this.onCollectPickup(item);
      });
    }

    // Update Destructible Environmental Props & Collisions
    this.destructibleSystem.update(
      deltaTime,
      this.weaponSystem.getActiveProjectiles(),
      (prop, drop) => this.onPropShattered(prop, drop)
    );

    // Check aura pulse breaking nearby props
    const auraWeapon = this.weaponSystem.getWeapon('aura');
    if (auraWeapon && auraWeapon instanceof AuraWeapon && auraWeapon.isPulsing && this.player) {
      this.destructibleSystem.breakNear(
        this.player.position.x,
        this.player.position.z,
        auraWeapon.pulseRadius,
        (prop, drop) => this.onPropShattered(prop, drop)
      );
    }

    // Ambient Weather Particle Generation
    const currentStage = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;
    if (this.player) {
      this.weatherTimer += deltaTime;
      if (currentStage.visual.ambientWeather === 'embers' && this.weatherTimer >= 0.08) {
        this.weatherTimer = 0;
        this.particleSystem.emitAmbientEmbers(this.player.position.x, this.player.position.z, 2);
      } else if (currentStage.visual.ambientWeather === 'snow' && this.weatherTimer >= 0.05) {
        this.weatherTimer = 0;
        this.particleSystem.emitAmbientSnow(this.player.position.x, this.player.position.z, 4);
      }
    }

    // Check Player Status & Update HUD
    if (this.player) {
      this.hud.updateHp(this.player.hp, this.player.maxHp);

      if (this.player.hp <= 0) {
        this.triggerGameOver();
        return;
      }

      if (this.runTime >= 300 && !this.isVictory && !this.isEndless) {
        this.triggerVictory();
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

    // Update Radar Minimap & Threat Tracking
    this.radarSystem.update(
      this.player,
      this.activeBoss,
      this.enemySpawner.getEnemies(),
      this.pickupSystem.getPickups(),
      this.world?.getBounds() ?? null,
      this.gameCamera.getThreeCamera(),
      window.innerWidth,
      window.innerHeight
    );
  }

  private onEnemyDefeated(killedEnemy: Enemy): void {
    if (this.activeBoss && killedEnemy === this.activeBoss) {
      this.onBossDefeated(this.activeBoss);
      return;
    }
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
    // Drop logic: Elites drop treasure chests, normal enemies have random drops
    if (killedEnemy.type === 'elite') {
      this.pickupSystem.spawnChest(killedEnemy.position.x, killedEnemy.position.z);
    } else {
      this.pickupSystem.trySpawnRandomDrop(killedEnemy.position.x, killedEnemy.position.z);
    }
    this.enemySpawner.removeEnemy(killedEnemy);
  }

  private spawnBoss(bossId: BossId): void {
    if (this.activeBoss) {
      this.removeActiveBoss();
    }
    const angle = Math.random() * Math.PI * 2;
    const spawnDist = 20;
    const px = this.player ? this.player.position.x : 0;
    const pz = this.player ? this.player.position.z : 0;
    const bx = px + Math.cos(angle) * spawnDist;
    const bz = pz + Math.sin(angle) * spawnDist;

    this.activeBoss = new Boss(bossId, bx, bz);
    this.entityManager.add(this.activeBoss);

    this.hud.showBossBar(this.activeBoss.config.name, this.activeBoss.hp, this.activeBoss.maxHp);
    this.soundManager.playWaveAlert();
    this.cameraController.addTrauma(0.6);
  }

  private onBossDefeated(boss: Boss): void {
    this.killCount++;
    this.hud.updateKills(this.killCount);
    this.hud.hideBossBar();
    this.soundManager.playEnemyDeath();
    this.cameraController.addTrauma(0.8);

    MetaManager.getInstance().recordBossKill(boss.bossId);

    this.particleSystem.emitDeathExplosion(
      boss.position.x,
      boss.position.y,
      boss.position.z,
      boss.getColor()
    );

    // Boss rewards: Guaranteed Legendary Chest + Gold Gem + arena drop
    this.pickupSystem.spawnChest(boss.position.x, boss.position.z);
    this.experienceSystem.spawnGem(boss.position.x + 1.2, boss.position.z, 'gold', 1000);
    this.pickupSystem.trySpawnRandomDrop(boss.position.x - 1.2, boss.position.z);

    this.removeActiveBoss();

    if (boss.bossId === 'malakor' && !this.isVictory && !this.isEndless) {
      setTimeout(() => {
        if (!this.isGameOver) {
          this.triggerVictory();
        }
      }, 1500);
    }
  }

  private removeActiveBoss(): void {
    if (this.activeBoss) {
      this.entityManager.remove(this.activeBoss);
      this.activeBoss.dispose();
      this.activeBoss = null;
      this.hud.hideBossBar();
    }
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
    this.levelUpMenu.mount(
      this.context.uiRoot,
      level,
      choices,
      this.upgradeSystem.rerollsRemaining + this.relicSystem.getExtraRerolls(),
      this.upgradeSystem.skipsRemaining,
      this.upgradeSystem.banishesRemaining
    );
  }

  private handleReroll(): void {
    if (this.upgradeSystem.useReroll()) {
      this.soundManager.playShoot();
      const choices = this.upgradeSystem.getRandomUpgrades(3, this.weaponSystem);
      this.levelUpMenu.refreshChoices(
        choices,
        this.upgradeSystem.rerollsRemaining + this.relicSystem.getExtraRerolls(),
        this.upgradeSystem.skipsRemaining,
        this.upgradeSystem.banishesRemaining
      );
    }
  }

  private handleSkip(): void {
    if (this.upgradeSystem.useSkip()) {
      MetaManager.getInstance().addGold(50);
      this.soundManager.playCoinReward();
      this.levelUpMenu.unmount();
      this.isLevelingUp = false;
      this.context.inputSystem.reset();
    }
  }

  private handleBanish(upgradeId: UpgradeId): void {
    if (this.upgradeSystem.banish(upgradeId)) {
      this.soundManager.playEnemyDeath();
      const choices = this.upgradeSystem.getRandomUpgrades(3, this.weaponSystem);
      this.levelUpMenu.refreshChoices(
        choices,
        this.upgradeSystem.rerollsRemaining + this.relicSystem.getExtraRerolls(),
        this.upgradeSystem.skipsRemaining,
        this.upgradeSystem.banishesRemaining
      );
    }
  }

  private chooseUpgrade(upgradeId: UpgradeId): void {
    if (!this.player) return;

    this.upgradeSystem.applyUpgrade(
      upgradeId,
      this.player,
      this.weaponSystem,
      this.experienceSystem
    );

    if (upgradeId.startsWith('evolution_')) {
      MetaManager.getInstance().recordEvolutionCrafted();
    }
    if (this.weaponSystem.getWeapons().length >= 4) {
      MetaManager.getInstance().unlockAchievement('full_arsenal');
    }

    this.levelUpMenu.unmount();
    this.isLevelingUp = false;
    this.context.inputSystem.reset();
  }

  private onPropShattered(prop: BreakableProp, drop: PropDrop): void {
    this.soundManager.playBreakableShatter(prop.propType);
    this.particleSystem.emitHitSparks(
      prop.position.x,
      0.5,
      prop.position.z,
      prop.getColor()
    );

    MetaManager.getInstance().recordPropDestroyed();

    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;

    switch (drop.type) {
      case 'gold': {
        const greedBonus = MetaManager.getInstance().getStatBonus('greed');
        const amount = Math.round(drop.amount * (1.0 + greedBonus) * stageDef.modifiers.goldMult);
        MetaManager.getInstance().addGold(amount);
        this.damageNumberSystem.spawn(
          prop.position.x,
          prop.position.y + 0.6,
          prop.position.z,
          amount,
          'crit'
        );
        break;
      }
      case 'heal': {
        if (this.player && this.player.hp > 0) {
          this.player.heal(drop.amount);
          this.hud.updateHp(this.player.hp, this.player.maxHp);
          this.soundManager.playHeal();
          this.damageNumberSystem.spawn(
            this.player.position.x,
            this.player.position.y + 0.8,
            this.player.position.z,
            drop.amount,
            'heal'
          );
        }
        break;
      }
      case 'xp': {
        this.experienceSystem.spawnGem(
          prop.position.x,
          prop.position.z,
          'green',
          drop.amount
        );
        break;
      }
    }
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.soundManager.playGameOver();
    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;
    const tormentRank = MetaManager.getInstance().getSelectedTorment();
    const tormentCfg = TORMENT_CONFIG[tormentRank] ?? TORMENT_CONFIG[0];
    const level = this.experienceSystem.getLevel();
    const baseGold = Math.floor(this.killCount * 0.5 + this.runTime * 0.2 + level * 5);
    const goldEarned = Math.round(baseGold * stageDef.modifiers.goldMult * tormentCfg.goldMult);
    const selectedCharId = MetaManager.getInstance().getSelectedCharacter();
    MetaManager.getInstance().submitRun(
      this.runTime,
      level,
      this.killCount,
      goldEarned,
      this.currentStageId,
      selectedCharId
    );
    this.gameOverMenu.mount(
      this.context.uiRoot,
      formatTime(this.runTime),
      this.isEndless,
      tormentRank
    );
  }

  private triggerVictory(): void {
    this.isVictory = true;
    this.soundManager.playLevelUp();
    this.cameraController.addTrauma(0.5);

    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;
    const tormentRank = MetaManager.getInstance().getSelectedTorment();
    const tormentCfg = TORMENT_CONFIG[tormentRank] ?? TORMENT_CONFIG[0];
    const level = this.experienceSystem.getLevel();
    const baseGold = Math.floor(this.killCount * 1.0 + this.runTime * 0.5 + level * 20);
    const goldEarned = Math.round(baseGold * stageDef.modifiers.goldMult * tormentCfg.goldMult);
    const selectedCharId = MetaManager.getInstance().getSelectedCharacter();
    const isNewRecord = MetaManager.getInstance().submitRun(
      this.runTime,
      level,
      this.killCount,
      goldEarned,
      this.currentStageId,
      selectedCharId
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

  private continueEndlessMode(): void {
    this.isVictory = false;
    this.isEndless = true;
    const torment = MetaManager.getInstance().getSelectedTorment();
    this.hud.setEndlessMode(true, torment);
    this.context.inputSystem.reset();
  }

  private applyPermanentMetaUpgrades(): void {
    if (!this.player) return;
    const meta = MetaManager.getInstance();
    const selectedCharId = meta.getSelectedCharacter();
    const charDef = CHARACTER_CONFIG[selectedCharId] ?? CHARACTER_CONFIG.knight;
    const stats = charDef.statModifiers;
    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;

    // Vitality: +Max HP with class offset
    this.player.maxHp = Math.max(20, PLAYER_CONFIG.maxHp + stats.maxHpOffset + meta.getStatBonus('vitality'));
    this.player.resetHp();

    // Armor: flat damage reduction with class offset
    this.player.armor = stats.armorOffset + meta.getStatBonus('armor');

    // Swiftness: +move speed with class multiplier
    this.player.speed = PLAYER_CONFIG.speed * stats.speedMultiplier * (1.0 + meta.getStatBonus('swiftness'));

    // Might, Haste & Projectile Speed: damage, cooldown and speed with class multipliers
    this.upgradeSystem.damageMultiplier = stats.damageMultiplier * (1.0 + meta.getStatBonus('might'));
    this.upgradeSystem.cooldownMultiplier = stats.cooldownMultiplier * Math.max(0.2, 1.0 - meta.getStatBonus('haste'));
    this.upgradeSystem.projectileSpeedMultiplier = stats.projectileSpeedMultiplier;
    this.weaponSystem.applyStatModifiers(
      this.upgradeSystem.damageMultiplier,
      this.upgradeSystem.cooldownMultiplier,
      this.upgradeSystem.projectileSpeedMultiplier
    );

    // Magnetism: +pickup range with class multiplier
    const baseRange =
      EXPERIENCE_CONFIG.basePickupRange * stats.pickupRangeMultiplier * (1.0 + meta.getStatBonus('magnetism'));
    this.experienceSystem.setPickupRange(baseRange);
    this.pickupSystem.setPickupRange(baseRange);

    // Growth: +XP multiplier combined with stage modifier
    this.experienceSystem.xpMultiplier = (1.0 + meta.getStatBonus('growth')) * stageDef.modifiers.xpMult;

    // Director enemy multipliers based on stage
    this.directorSystem.setStageModifiers(stageDef.modifiers.enemyHpMult, stageDef.modifiers.enemySpeedMult);
  }

  private onCollectPickup(item: PickupItem): void {
    if (!this.player) return;

    switch (item.pickupType) {
      case 'potion': {
        this.player.heal(30);
        this.hud.updateHp(this.player.hp, this.player.maxHp);
        this.soundManager.playHeal();
        this.damageNumberSystem.spawn(
          this.player.position.x,
          this.player.position.y + 0.8,
          this.player.position.z,
          30,
          'heal'
        );
        this.particleSystem.emitHitSparks(
          this.player.position.x,
          this.player.position.y + 0.5,
          this.player.position.z,
          0xef4444
        );
        break;
      }
      case 'vacuum': {
        this.experienceSystem.attractAllGems();
        this.soundManager.playVacuum();
        this.particleSystem.emitLevelUpBurst(
          this.player.position.x,
          this.player.position.y,
          this.player.position.z
        );
        break;
      }
      case 'bomb': {
        this.soundManager.playBombExplosion();
        this.cameraController.addTrauma(0.6);
        const enemies = this.enemySpawner.getEnemies();
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          if (!e.isDead) {
            const died = e.takeDamage(250);
            this.damageNumberSystem.spawn(
              e.position.x,
              e.position.y + 0.5,
              e.position.z,
              250,
              'holy',
              true
            );
            this.particleSystem.emitDeathExplosion(
              e.position.x,
              e.position.y,
              e.position.z,
              0xfbbf24
            );
            if (died) {
              this.onEnemyDefeated(e);
            }
          }
        }
        break;
      }
      case 'chest': {
        this.openTreasureChest();
        break;
      }
    }
  }

  private openTreasureChest(): void {
    if (!this.player) return;
    this.isChestOpening = true;
    this.soundManager.playChestOpen();
    this.cameraController.addTrauma(0.3);

    const baseGold = Math.floor(60 + Math.random() * 60);
    const greedBonus = MetaManager.getInstance().getStatBonus('greed');
    const finalGold = Math.round(baseGold * (1.0 + greedBonus));
    MetaManager.getInstance().addGold(finalGold);

    const granted = this.upgradeSystem.grantRandomChestUpgrade(
      this.player,
      this.weaponSystem,
      this.experienceSystem
    );

    MetaManager.getInstance().recordChestOpened();
    if (granted.category === 'evolution') {
      MetaManager.getInstance().recordEvolutionCrafted();
    }
    if (this.weaponSystem.getWeapons().length >= 4) {
      MetaManager.getInstance().unlockAchievement('full_arsenal');
    }

    this.hud.updateHp(this.player.hp, this.player.maxHp);
    const xpProg = this.experienceSystem.getProgress();
    this.hud.updateXp(xpProg.ratio, xpProg.level);

    // Roll for ancient relic discovery (50% chance if has open relic slot)
    let discoveredRelic = null;
    if (this.relicSystem.canAddRelic() && Math.random() < 0.50) {
      discoveredRelic = this.relicSystem.getRandomAvailableRelic();
      if (discoveredRelic) {
        this.relicSystem.addRelic(discoveredRelic.id);
        if (discoveredRelic.id === 'dice') {
          this.upgradeSystem.rerollsRemaining += 2;
        }
        this.hud.updateRelics(this.relicSystem.getActiveRelics());
      }
    }

    this.chestModal.mount(
      this.context.uiRoot,
      {
        gold: finalGold,
        upgradeName: granted.name,
        upgradeIcon: granted.icon,
        relicName: discoveredRelic ? discoveredRelic.name : undefined,
        relicIcon: discoveredRelic ? discoveredRelic.icon : undefined,
      },
      () => {
        this.isChestOpening = false;
        this.context.inputSystem.reset();
      }
    );
  }

  public restart(): void {
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.chestModal.unmount();
    this.relicSystem.reset();
    this.hud.updateRelics(this.relicSystem.getActiveRelics());
    this.isGameOver = false;
    this.isVictory = false;
    this.isEndless = false;
    this.hud.setEndlessMode(false);
    this.isPaused = false;
    this.isLevelingUp = false;
    this.isChestOpening = false;
    this.runTime = 0;
    this.killCount = 0;
    this.totalDamageDealt = 0;
    this.weaponDamageDealt = {
      wand: 0,
      orbital: 0,
      aura: 0,
      dagger: 0,
      hammer: 0,
      flask: 0,
    };

    const selectedCharId = MetaManager.getInstance().getSelectedCharacter();
    const charDef = CHARACTER_CONFIG[selectedCharId] ?? CHARACTER_CONFIG.knight;

    this.currentStageId = MetaManager.getInstance().getSelectedStage();
    const stageDef = STAGE_CONFIG[this.currentStageId] ?? STAGE_CONFIG.verdant;

    if (this.world) {
      this.world.applyStage(stageDef);
    }
    this.soundManager.startBiomeAmbience(stageDef.ambientTheme);

    if (this.player) {
      this.player.setCharacter(selectedCharId);
      this.upgradeSystem.reset(
        this.player,
        this.weaponSystem,
        this.experienceSystem,
        charDef.startingWeapon
      );
      this.applyPermanentMetaUpgrades();
      this.player.position.set(
        PLAYER_CONFIG.initialPosition.x,
        PLAYER_CONFIG.initialPosition.y,
        PLAYER_CONFIG.initialPosition.z
      );
      this.cameraController.setTarget(this.player.position, true);
      this.cameraController.resetTrauma();
      this.hud.updateHp(this.player.hp, this.player.maxHp);
    }

    const bounds = this.world ? this.world.getBounds() : null;
    this.destructibleSystem.clear();
    if (bounds) {
      this.destructibleSystem.initForStage(stageDef.destructibleType, bounds);
    }

    this.enemySpawner.clear();
    this.removeActiveBoss();
    this.telegraphSystem.clear();
    this.radarSystem.clear();
    this.weaponSystem.clear();
    this.pickupSystem.clear();
    this.particleSystem.clear();
    this.damageNumberSystem.clear();
    this.cameraController.resetTrauma();
    this.experienceSystem.reset();
    this.directorSystem.reset();
    const tormentRank = MetaManager.getInstance().getSelectedTorment();
    const tormentCfg = TORMENT_CONFIG[tormentRank] ?? TORMENT_CONFIG[0];
    this.directorSystem.setTormentModifiers(
      tormentCfg.enemyHpMult,
      tormentCfg.enemySpeedMult,
      tormentCfg.enemyDamageMult
    );
    this.sandboxSpawner?.clearDummies();

    this.hud.updateTime(formatTime(this.runTime));
    this.hud.updateKills(this.killCount);
    const xpProg = this.experienceSystem.getProgress();
    this.hud.updateXp(xpProg.ratio, xpProg.level);

    this.context.inputSystem.reset();
  }

  public pause(): void {
    if (this.isPaused || this.isGameOver || this.isVictory || this.isLevelingUp || this.isChestOpening) return;
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
    this.chestModal.unmount();
    this.damageNumberSystem.clear();
    this.destructibleSystem.clear();
    this.soundManager.stopBiomeAmbience();
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isLevelingUp = false;
    this.isChestOpening = false;
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
    this.chestModal.unmount();
    this.hud.unmount();
    this.damageNumberSystem.clear();
    this.destructibleSystem.clear();
    this.soundManager.stopBiomeAmbience();
    this.removeActiveBoss();
    this.telegraphSystem.clear();
    this.radarSystem.clear();
    if (this.unsubscribeAchievement) {
      this.unsubscribeAchievement();
      this.unsubscribeAchievement = null;
    }
    this.isPaused = false;
    this.isGameOver = false;
    this.isVictory = false;
    this.isLevelingUp = false;
    this.isChestOpening = false;
  }

  public override dispose(): void {
    this.victoryMenu.unmount();
    this.gameOverMenu.unmount();
    this.pauseMenu.unmount();
    this.levelUpMenu.unmount();
    this.chestModal.unmount();
    this.hud.unmount();
    this.damageNumberSystem.dispose();
    this.destructibleSystem.dispose();
    this.soundManager.stopBiomeAmbience();
    this.removeActiveBoss();
    this.telegraphSystem.dispose();
    this.radarSystem.dispose();
    if (this.unsubscribeAchievement) {
      this.unsubscribeAchievement();
      this.unsubscribeAchievement = null;
    }
    if (this.sandboxSpawner) {
      this.sandboxSpawner.dispose();
      this.sandboxSpawner = null;
    }
    this.pickupSystem.dispose();
    this.particleSystem.dispose();
    this.soundManager.dispose();
    this.weaponSystem.dispose();
    this.enemyAbilitySystem.dispose();
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
