import * as THREE from 'three';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { TelegraphSystem } from './TelegraphSystem';
import type { ParticleSystem } from '../fx/ParticleSystem';
import type { DamageNumberSystem } from '../fx/DamageNumberSystem';
import type { SoundManager } from '../audio/SoundManager';
import type { CameraController } from '../camera/CameraController';
import type { StageId } from '../config/stageConfig';
import type { Disposable } from '../types';

const MAX_HOSTILE_PROJ = 16;
const MAX_METEORS = 4;

interface HostileProjectile {
  mesh: THREE.Mesh;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
  damage: number;
  life: number;
  maxLife: number;
  radius: number;
}

interface MeteorDrop {
  active: boolean;
  x: number;
  z: number;
  delayTimer: number;
}

export class EnemyAbilitySystem implements Disposable {
  private scene: THREE.Scene | null = null;
  private projectiles: HostileProjectile[] = [];
  private meteors: MeteorDrop[] = [];

  // Stage weather timers
  private weatherEventTimer: number = 0;
  private blizzardActiveTimer: number = 0;
  private meteorSalvoActive: boolean = false;

  constructor(scene?: THREE.Scene) {
    this.initPools();
    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    this.disposeMeshes();
    this.scene = scene;
    this.initMeshes();
  }

  private initPools(): void {
    for (let i = 0; i < MAX_METEORS; i++) {
      this.meteors.push({ active: false, x: 0, z: 0, delayTimer: 0 });
    }
  }

  private initMeshes(): void {
    if (!this.scene) return;

    const geo = new THREE.SphereGeometry(0.24, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.95,
    });

    for (let i = 0; i < MAX_HOSTILE_PROJ; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);

      this.projectiles.push({
        mesh,
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vz: 0,
        speed: 8.5,
        damage: 12,
        life: 0,
        maxLife: 2.2,
        radius: 0.35,
      });
    }
  }

  private disposeMeshes(): void {
    if (this.scene) {
      for (let i = 0; i < this.projectiles.length; i++) {
        this.scene.remove(this.projectiles[i].mesh);
      }
    }
    if (this.projectiles.length > 0) {
      this.projectiles[0].mesh.geometry.dispose();
      (this.projectiles[0].mesh.material as THREE.Material).dispose();
    }
    this.projectiles.length = 0;
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    stageId: StageId,
    telegraphSystem: TelegraphSystem,
    particleSystem: ParticleSystem,
    damageNumbers: DamageNumberSystem,
    soundManager: SoundManager,
    cameraController: CameraController,
    onEnemyKilled?: (enemy: Enemy) => void
  ): void {
    if (!player || player.hp <= 0) return;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;
    const pRadius = player.radius;

    // 1. Process Enemy Archetype Abilities
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead || e.freezeTimer > 0) continue;

      const dx = px - e.position.x;
      const dz = pz - e.position.z;
      const distSq = dx * dx + dz * dz;

      // --- Cultist (Ranged Bolt) ---
      if (e.type === 'ranged') {
        if (distSq <= 12.0 * 12.0) {
          e.abilityTimer += deltaTime;
          if (e.abilityTimer >= 3.4) {
            e.abilityTimer = 0;
            const dist = Math.sqrt(distSq);
            if (dist > 0.001) {
              this.spawnHostileProjectile(
                e.position.x,
                e.position.y + 0.6,
                e.position.z,
                dx / dist,
                dz / dist,
                e.damage
              );
              soundManager.playCast();
            }
          }
        }
      }

      // --- Bone Shaman (Healing & Haste Ritual) ---
      else if (e.type === 'shaman') {
        e.abilityTimer += deltaTime;
        if (e.abilityTimer >= 3.6) {
          e.abilityTimer = 0;
          particleSystem.emitChemicalSplash(e.position.x, e.position.y + 0.5, e.position.z, 16, false);

          // Heal nearby allies
          const healRadiusSq = 6.5 * 6.5;
          for (let j = 0; j < enemies.length; j++) {
            const ally = enemies[j];
            if (ally === e || ally.isDead) continue;
            const ax = ally.position.x - e.position.x;
            const az = ally.position.z - e.position.z;
            if (ax * ax + az * az <= healRadiusSq) {
              ally.heal(25);
              ally.speedBuffTimer = 2.5;
              damageNumbers.spawn(
                ally.position.x,
                ally.position.y + 0.8,
                ally.position.z,
                25,
                'heal'
              );
            }
          }
        }
      }

      // --- Volatile Crawler (Priming Suicide Blast) ---
      else if (e.type === 'volatile') {
        if (e.isPriming) {
          if (e.primeTimer === 0) {
            // First frame: show danger telegraph circle
            telegraphSystem.spawnCircle(e.position.x, e.position.z, 3.2, 0.85);
          }
          e.primeTimer += deltaTime;

          if (e.primeTimer >= 0.85) {
            // Explode!
            particleSystem.emitDeathExplosion(e.position.x, 0.3, e.position.z, 0xf97316, 24);
            soundManager.playExplosion();
            cameraController.addTrauma(0.35);

            const blastRadiusSq = 3.2 * 3.2;

            // Damage player if caught
            const toPlayerX = px - e.position.x;
            const toPlayerZ = pz - e.position.z;
            if (toPlayerX * toPlayerX + toPlayerZ * toPlayerZ <= blastRadiusSq) {
              player.takeDamage(28);
              damageNumbers.spawn(px, py + 0.8, pz, 28, 'hero');
            }

            // Damage nearby enemies (friendly fire reward)
            for (let j = 0; j < enemies.length; j++) {
              const other = enemies[j];
              if (other === e || other.isDead) continue;
              const ox = other.position.x - e.position.x;
              const oz = other.position.z - e.position.z;
              if (ox * ox + oz * oz <= blastRadiusSq) {
                const died = other.takeDamage(140);
                damageNumbers.spawn(other.position.x, 0.4, other.position.z, 140, 'fire');
                if (died && onEnemyKilled) {
                  onEnemyKilled(other);
                }
              }
            }

            // Volatile Crawler dies on detonation
            e.takeDamage(99999);
            if (onEnemyKilled) {
              onEnemyKilled(e);
            }
          }
        }
      }
    }

    // 2. Update Hostile Projectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) continue;

      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }

      p.x += p.vx * p.speed * deltaTime;
      p.z += p.vz * p.speed * deltaTime;
      p.mesh.position.set(p.x, p.y, p.z);

      // Check collision against player
      const dx = px - p.x;
      const dz = pz - p.z;
      const hitDist = pRadius + p.radius;
      if (dx * dx + dz * dz <= hitDist * hitDist) {
        p.active = false;
        p.mesh.visible = false;

        player.takeDamage(p.damage);
        damageNumbers.spawn(px, py + 0.8, pz, p.damage, 'hero');
        soundManager.playHit();
        particleSystem.emitHitSparks(p.x, p.y, p.z, 0xc084fc);
        cameraController.addTrauma(0.2);
      }
    }

    // 3. Stage-Specific Active Environmental Weather Events
    this.updateActiveWeather(
      deltaTime,
      player,
      enemies,
      stageId,
      telegraphSystem,
      particleSystem,
      damageNumbers,
      soundManager,
      cameraController,
      onEnemyKilled
    );
  }

  private updateActiveWeather(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    stageId: StageId,
    telegraphSystem: TelegraphSystem,
    particleSystem: ParticleSystem,
    damageNumbers: DamageNumberSystem,
    soundManager: SoundManager,
    cameraController: CameraController,
    onEnemyKilled?: (enemy: Enemy) => void
  ): void {
    this.weatherEventTimer += deltaTime;

    // A. Infernal Caldera: Periodic Cataclysmic Meteor Salvos
    if (stageId === 'inferno') {
      if (this.weatherEventTimer >= 38.0 && !this.meteorSalvoActive) {
        this.meteorSalvoActive = true;
        this.weatherEventTimer = 0;

        const px = player.position.x;
        const pz = player.position.z;

        for (let m = 0; m < MAX_METEORS; m++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 2.0 + Math.random() * 6.5;
          const mx = px + Math.cos(angle) * dist;
          const mz = pz + Math.sin(angle) * dist;

          this.meteors[m].active = true;
          this.meteors[m].x = mx;
          this.meteors[m].z = mz;
          this.meteors[m].delayTimer = m * 0.45; // Staggered rain
        }
      }

      if (this.meteorSalvoActive) {
        let allFinished = true;
        for (let m = 0; m < MAX_METEORS; m++) {
          const met = this.meteors[m];
          if (!met.active) continue;

          allFinished = false;
          met.delayTimer -= deltaTime;
          if (met.delayTimer <= 0) {
            met.active = false;
            const impactX = met.x;
            const impactZ = met.z;

            // Spawn danger circle telegraph
            telegraphSystem.spawnCircle(impactX, impactZ, 2.6, 1.1, () => {
              // Meteor impact event
              particleSystem.emitDeathExplosion(impactX, 0.2, impactZ, 0xf97316, 26);
              soundManager.playExplosion();
              cameraController.addTrauma(0.3);

              const radSq = 2.6 * 2.6;
              const px = player.position.x;
              const pz = player.position.z;

              // Player damage
              if ((px - impactX) * (px - impactX) + (pz - impactZ) * (pz - impactZ) <= radSq) {
                player.takeDamage(22);
                damageNumbers.spawn(px, player.position.y + 0.8, pz, 22, 'hero');
              }

              // Enemy environmental damage
              for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (e.isDead) continue;
                const ex = e.position.x - impactX;
                const ez = e.position.z - impactZ;
                if (ex * ex + ez * ez <= radSq) {
                  const died = e.takeDamage(180);
                  damageNumbers.spawn(e.position.x, 0.4, e.position.z, 180, 'fire');
                  if (died && onEnemyKilled) {
                    onEnemyKilled(e);
                  }
                }
              }
            });
          }
        }

        if (allFinished) {
          this.meteorSalvoActive = false;
        }
      }
    }

    // B. Glacial Crypts: Periodic Howling Blizzard Gale
    else if (stageId === 'glacial') {
      if (this.weatherEventTimer >= 45.0) {
        this.weatherEventTimer = 0;
        this.blizzardActiveTimer = 6.0;
      }

      if (this.blizzardActiveTimer > 0) {
        this.blizzardActiveTimer -= deltaTime;
        particleSystem.emitAmbientSnow(player.position.x, player.position.z, 8);

        // Apply slight chill to all mobs and player during blizzard gale
        for (let i = 0; i < enemies.length; i++) {
          enemies[i].applyChill(0.5, 0.25);
        }
      }
    }
  }

  private spawnHostileProjectile(
    startX: number,
    startY: number,
    startZ: number,
    dirX: number,
    dirZ: number,
    damage: number
  ): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.active) {
        p.active = true;
        p.x = startX;
        p.y = startY;
        p.z = startZ;
        p.vx = dirX;
        p.vz = dirZ;
        p.damage = damage;
        p.life = 0;
        p.mesh.position.set(startX, startY, startZ);
        p.mesh.visible = true;
        break;
      }
    }
  }

  public reset(): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].active = false;
      this.projectiles[i].mesh.visible = false;
    }
    for (let i = 0; i < this.meteors.length; i++) {
      this.meteors[i].active = false;
    }
    this.weatherEventTimer = 0;
    this.blizzardActiveTimer = 0;
    this.meteorSalvoActive = false;
  }

  public dispose(): void {
    this.reset();
    this.disposeMeshes();
    this.scene = null;
  }
}
