import { RELIC_CONFIG, type RelicId, type RelicDefinition } from '../config/relicConfig';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { ExperienceSystem } from './ExperienceSystem';
import type { ParticleSystem } from '../fx/ParticleSystem';
import type { SoundManager } from '../audio/SoundManager';
import type { DamageNumberSystem } from '../fx/DamageNumberSystem';
import type { Disposable } from '../types';

interface FirePatch {
  active: boolean;
  x: number;
  z: number;
  timer: number;
  damageCooldown: number;
}

const MAX_FIRE_PATCHES = 24;
const FIRE_PATCH_LIFETIME = 2.2;
const FIRE_PATCH_RADIUS_SQ = 1.3 * 1.3;

export class RelicSystem implements Disposable {
  private activeRelics: RelicId[] = [];
  private hourglassTimer: number = 0;
  private compassTimer: number = 0;
  private fireDropTimer: number = 0;
  private lastPlayerX: number = 0;
  private lastPlayerZ: number = 0;
  private firePatches: FirePatch[] = [];

  constructor() {
    for (let i = 0; i < MAX_FIRE_PATCHES; i++) {
      this.firePatches.push({
        active: false,
        x: 0,
        z: 0,
        timer: 0,
        damageCooldown: 0,
      });
    }
  }

  public getActiveRelics(): readonly RelicId[] {
    return this.activeRelics;
  }

  public hasRelic(id: RelicId): boolean {
    return this.activeRelics.includes(id);
  }

  public canAddRelic(): boolean {
    return this.activeRelics.length < 3;
  }

  public addRelic(id: RelicId): boolean {
    if (this.hasRelic(id) || !this.canAddRelic()) return false;
    this.activeRelics.push(id);
    return true;
  }

  public getAvailableRelics(): RelicDefinition[] {
    const all = Object.values(RELIC_CONFIG);
    return all.filter((r) => !this.hasRelic(r.id));
  }

  public getRandomAvailableRelic(): RelicDefinition | null {
    const available = this.getAvailableRelics();
    if (available.length === 0) return null;
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
  }

  public getExtraRerolls(): number {
    return this.hasRelic('dice') ? 2 : 0;
  }

  public getCritChanceBonus(): number {
    return this.hasRelic('dice') ? 0.10 : 0.0;
  }

  public getGoldBonus(): number {
    return this.hasRelic('dice') ? 0.25 : 0.0;
  }

  public getMagnetBonus(): number {
    return this.hasRelic('compass') ? 0.75 : 0.0;
  }

  public getArmorDamageBonus(playerArmor: number): number {
    if (!this.hasRelic('golem_heart') || playerArmor <= 0) return 0;
    return playerArmor * 0.10;
  }

  public onCritDamage(
    damage: number,
    player: Player,
    damageNumbers: DamageNumberSystem,
    soundManager: SoundManager
  ): void {
    if (!this.hasRelic('chalice') || player.hp <= 0) return;
    const healAmount = Math.max(1, Math.round(damage * 0.06));
    const healed = player.heal(healAmount);
    if (healed > 0) {
      soundManager.playHeal();
      damageNumbers.spawn(
        player.position.x,
        player.position.y + 0.9,
        player.position.z,
        healed,
        'heal'
      );
    }
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    expSystem: ExperienceSystem,
    particleSystem: ParticleSystem,
    soundManager: SoundManager,
    damageNumbers: DamageNumberSystem,
    onEnemyKilled: (enemy: Enemy) => void
  ): void {
    if (player.hp <= 0) return;

    // 1. Chrono Hourglass (Freeze enemies)
    if (this.hasRelic('hourglass')) {
      this.hourglassTimer += deltaTime;
      if (this.hourglassTimer >= 45) {
        this.hourglassTimer = 0;
        soundManager.playLevelUp();
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.isDead) {
            e.applyFreeze(3.5);
            particleSystem.emitHitSparks(e.position.x, 0.5, e.position.z, 0x38bdf8);
          }
        }
      }
    }

    // 2. Astral Compass (Periodic Vacuum)
    if (this.hasRelic('compass')) {
      this.compassTimer += deltaTime;
      if (this.compassTimer >= 40) {
        this.compassTimer = 0;
        expSystem.attractAllGems();
        soundManager.playVacuum();
      }
    }

    // 3. Boots of Hermes (Fire Trail)
    if (this.hasRelic('boots')) {
      const px = player.position.x;
      const pz = player.position.z;
      const movedDistSq = (px - this.lastPlayerX) * (px - this.lastPlayerX) +
                          (pz - this.lastPlayerZ) * (pz - this.lastPlayerZ);

      this.fireDropTimer += deltaTime;
      if (movedDistSq > 0.08 && this.fireDropTimer >= 0.28) {
        this.fireDropTimer = 0;
        this.spawnFirePatch(px, pz);
        this.lastPlayerX = px;
        this.lastPlayerZ = pz;
      }

      // Update active fire patches
      for (let i = 0; i < MAX_FIRE_PATCHES; i++) {
        const patch = this.firePatches[i];
        if (!patch.active) continue;

        patch.timer -= deltaTime;
        if (patch.timer <= 0) {
          patch.active = false;
          continue;
        }

        // Emit small flame particle
        if (Math.random() < 0.25) {
          particleSystem.emitHitSparks(
            patch.x + (Math.random() - 0.5) * 0.6,
            0.15,
            patch.z + (Math.random() - 0.5) * 0.6,
            0xf97316
          );
        }

        // Damage enemies stepping on fire patch every 0.35s
        patch.damageCooldown -= deltaTime;
        if (patch.damageCooldown <= 0) {
          patch.damageCooldown = 0.35;
          for (let j = 0; j < enemies.length; j++) {
            const enemy = enemies[j];
            if (enemy.isDead) continue;

            const edx = enemy.position.x - patch.x;
            const edz = enemy.position.z - patch.z;
            if (edx * edx + edz * edz <= FIRE_PATCH_RADIUS_SQ) {
              const died = enemy.takeDamage(12);
              damageNumbers.spawn(
                enemy.position.x,
                enemy.position.y + 0.6,
                enemy.position.z,
                12,
                'default'
              );
              particleSystem.emitHitSparks(enemy.position.x, 0.4, enemy.position.z, 0xf97316);
              if (died) {
                onEnemyKilled(enemy);
              }
            }
          }
        }
      }
    }
  }

  private spawnFirePatch(x: number, z: number): void {
    for (let i = 0; i < MAX_FIRE_PATCHES; i++) {
      const patch = this.firePatches[i];
      if (!patch.active) {
        patch.active = true;
        patch.x = x;
        patch.z = z;
        patch.timer = FIRE_PATCH_LIFETIME;
        patch.damageCooldown = 0;
        return;
      }
    }
  }

  public reset(): void {
    this.activeRelics = [];
    this.hourglassTimer = 0;
    this.compassTimer = 0;
    this.fireDropTimer = 0;
    this.lastPlayerX = 0;
    this.lastPlayerZ = 0;
    for (let i = 0; i < MAX_FIRE_PATCHES; i++) {
      this.firePatches[i].active = false;
    }
  }

  public dispose(): void {
    this.reset();
  }
}
