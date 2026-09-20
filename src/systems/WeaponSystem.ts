import * as THREE from 'three';
import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Weapon } from '../weapons/Weapon';
import { ProjectileWeapon } from '../weapons/ProjectileWeapon';
import { OrbitalWeapon } from '../weapons/OrbitalWeapon';
import { AuraWeapon } from '../weapons/AuraWeapon';
import { DaggerWeapon } from '../weapons/DaggerWeapon';
import type { Projectile } from '../entities/projectile/Projectile';
import { WEAPON_CONFIG, type WeaponId } from '../config/weaponConfig';
import type { Disposable } from '../types';

export class WeaponSystem implements Disposable {
  private entityManager: EntityManager;
  private scene: THREE.Scene | null = null;
  private weapons: Weapon[] = [];
  private activeProjectiles: Projectile[] = [];

  private damageMultiplier: number = 1.0;
  private cooldownMultiplier: number = 1.0;
  private projectileSpeedMultiplier: number = 1.0;

  constructor(entityManager: EntityManager, scene?: THREE.Scene) {
    this.entityManager = entityManager;
    if (scene) {
      this.scene = scene;
    }
    // Add default starting weapon
    this.addWeapon(new ProjectileWeapon());
  }

  public setScene(scene: THREE.Scene): void {
    this.scene = scene;
    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      if (w instanceof OrbitalWeapon || w instanceof AuraWeapon) {
        w.setScene(scene);
      }
    }
  }

  public addWeapon(weapon: Weapon): void {
    weapon.damageMultiplier = this.damageMultiplier;
    weapon.cooldownMultiplier = this.cooldownMultiplier;
    weapon.projectileSpeedMultiplier = this.projectileSpeedMultiplier;

    if (this.scene) {
      if (weapon instanceof OrbitalWeapon || weapon instanceof AuraWeapon) {
        weapon.setScene(this.scene);
      }
    }

    this.weapons.push(weapon);
  }

  public getWeapons(): readonly Weapon[] {
    return this.weapons;
  }

  public getWeapon(id: WeaponId): Weapon | undefined {
    return this.weapons.find((w) => w.id === id);
  }

  public hasWeapon(id: WeaponId): boolean {
    return this.weapons.some((w) => w.id === id);
  }

  public canEquipNewWeapon(): boolean {
    return this.weapons.length < WEAPON_CONFIG.maxEquippedWeapons;
  }

  public unlockWeapon(id: WeaponId): Weapon | null {
    if (this.hasWeapon(id) || !this.canEquipNewWeapon()) {
      return null;
    }

    let newWeapon: Weapon;
    switch (id) {
      case 'wand':
        newWeapon = new ProjectileWeapon();
        break;
      case 'orbital':
        newWeapon = new OrbitalWeapon(this.scene ?? undefined);
        break;
      case 'aura':
        newWeapon = new AuraWeapon(this.scene ?? undefined);
        break;
      case 'dagger':
        newWeapon = new DaggerWeapon();
        break;
    }

    this.addWeapon(newWeapon);
    return newWeapon;
  }

  public upgradeWeapon(id: WeaponId): boolean {
    const weapon = this.getWeapon(id);
    if (!weapon || weapon.isMaxLevel) {
      return false;
    }
    return weapon.upgrade();
  }

  public applyStatModifiers(
    damageMult: number,
    cooldownMult: number,
    projSpeedMult: number
  ): void {
    this.damageMultiplier = damageMult;
    this.cooldownMultiplier = cooldownMult;
    this.projectileSpeedMultiplier = projSpeedMult;

    for (let i = 0; i < this.weapons.length; i++) {
      const w = this.weapons[i];
      w.damageMultiplier = damageMult;
      w.cooldownMultiplier = cooldownMult;
      w.projectileSpeedMultiplier = projSpeedMult;
    }
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[],
    onEnemyKilled?: (enemy: Enemy) => void,
    onEnemyHit?: (enemy: Enemy, hitX: number, hitY: number, hitZ: number) => void,
    onWeaponFired?: () => void
  ): void {
    if (player.hp <= 0) return;

    // Update all equipped weapons
    for (let i = 0; i < this.weapons.length; i++) {
      let weaponFiredThisFrame = false;
      this.weapons[i].update(
        deltaTime,
        player,
        enemies,
        (projectile) => {
          this.spawnProjectile(projectile);
          if (!weaponFiredThisFrame) {
            weaponFiredThisFrame = true;
            if (onWeaponFired) {
              onWeaponFired();
            }
          }
        },
        onEnemyKilled,
        onEnemyHit
      );
    }

    // Clean up expired projectiles
    for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
      const proj = this.activeProjectiles[i];
      if (proj.isExpired) {
        this.removeProjectileAt(i);
      }
    }
  }

  private spawnProjectile(projectile: Projectile): void {
    this.activeProjectiles.push(projectile);
    this.entityManager.add(projectile);
  }

  public removeProjectile(projectile: Projectile): void {
    const idx = this.activeProjectiles.indexOf(projectile);
    if (idx !== -1) {
      this.removeProjectileAt(idx);
    }
  }

  private removeProjectileAt(index: number): void {
    const proj = this.activeProjectiles[index];
    const last = this.activeProjectiles.pop()!;
    if (index < this.activeProjectiles.length) {
      this.activeProjectiles[index] = last;
    }
    this.entityManager.remove(proj);
  }

  public getActiveProjectiles(): readonly Projectile[] {
    return this.activeProjectiles;
  }

  public clear(): void {
    for (let i = 0; i < this.activeProjectiles.length; i++) {
      this.entityManager.remove(this.activeProjectiles[i]);
    }
    this.activeProjectiles.length = 0;

    for (let i = 0; i < this.weapons.length; i++) {
      this.weapons[i].reset();
    }
  }

  public resetToDefault(): void {
    // Clean all projectiles
    for (let i = 0; i < this.activeProjectiles.length; i++) {
      this.entityManager.remove(this.activeProjectiles[i]);
    }
    this.activeProjectiles.length = 0;

    // Dispose all secondary weapons
    for (let i = 0; i < this.weapons.length; i++) {
      this.weapons[i].dispose();
    }
    this.weapons.length = 0;

    // Re-create default starting weapon
    this.damageMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;

    const startingWand = new ProjectileWeapon();
    this.addWeapon(startingWand);
  }

  public dispose(): void {
    this.clear();
    for (let i = 0; i < this.weapons.length; i++) {
      this.weapons[i].dispose();
    }
    this.weapons.length = 0;
    this.scene = null;
  }
}
