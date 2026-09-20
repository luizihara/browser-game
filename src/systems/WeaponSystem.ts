import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Weapon } from '../weapons/Weapon';
import { ProjectileWeapon } from '../weapons/ProjectileWeapon';
import type { Projectile } from '../entities/projectile/Projectile';
import type { Disposable } from '../types';

export class WeaponSystem implements Disposable {
  private entityManager: EntityManager;
  private weapons: Weapon[] = [];
  private activeProjectiles: Projectile[] = [];

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    // Add starting default weapon
    this.addWeapon(new ProjectileWeapon());
  }

  public addWeapon(weapon: Weapon): void {
    this.weapons.push(weapon);
  }

  public update(
    deltaTime: number,
    player: Player,
    enemies: readonly Enemy[]
  ): void {
    if (player.hp <= 0) return;

    // Update all equipped weapons
    for (let i = 0; i < this.weapons.length; i++) {
      this.weapons[i].update(
        deltaTime,
        player,
        enemies,
        (projectile) => this.spawnProjectile(projectile)
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

  public dispose(): void {
    this.clear();
    this.weapons.length = 0;
  }
}
