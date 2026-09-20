import type { EntityManager } from '../entities/EntityManager';
import { BreakableProp, type BreakableType } from '../entities/destructible/BreakableProp';
import type { ArenaBounds } from '../world/ArenaBounds';
import type { Projectile } from '../entities/projectile/Projectile';
import type { Disposable } from '../types';

export type DestructibleDrop =
  | { type: 'gold'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'xp'; amount: number };

export type PropDrop = DestructibleDrop;

export class DestructibleSystem implements Disposable {
  private entityManager: EntityManager;
  private props: BreakableProp[] = [];
  private bounds: ArenaBounds | null = null;
  private currentType: BreakableType = 'pot';
  private respawnTimer: number = 0;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  public initForStage(
    stageType: BreakableType,
    bounds: ArenaBounds | null,
    count: number = 18
  ): void {
    this.clear();
    this.currentType = stageType;
    this.bounds = bounds;
    this.respawnTimer = 0;

    const halfW = bounds ? bounds.halfWidth - 4 : 26;
    const halfD = bounds ? bounds.halfDepth - 4 : 26;

    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      let attempts = 0;

      // Ensure props don't spawn right on the player's initial start spot
      do {
        x = (Math.random() * 2 - 1) * halfW;
        z = (Math.random() * 2 - 1) * halfD;
        attempts++;
      } while (x * x + z * z < 36 && attempts < 15);

      const prop = new BreakableProp(x, z, stageType);
      this.props.push(prop);
      this.entityManager.add(prop);
    }
  }

  public update(
    deltaTime: number,
    projectiles: readonly Projectile[],
    onPropShattered: (prop: BreakableProp, drop: DestructibleDrop) => void
  ): void {
    // 1. Check Projectile vs BreakableProp collision
    if (projectiles.length > 0 && this.props.length > 0) {
      for (let p = 0; p < projectiles.length; p++) {
        const proj = projectiles[p];
        if (proj.isExpired) continue;

        const px = proj.position.x;
        const pz = proj.position.z;
        const pRadius = proj.radius;

        for (let i = this.props.length - 1; i >= 0; i--) {
          const prop = this.props[i];
          if (prop.isDead) continue;

          const dx = px - prop.position.x;
          const dz = pz - prop.position.z;
          const hitDist = pRadius + prop.radius;

          if (dx * dx + dz * dz <= hitDist * hitDist) {
            prop.takeDamage(proj.damage);
            if (prop.isDead) {
              const drop = this.rollDrop();
              onPropShattered(prop, drop);
              this.removePropAt(i);
            }
            // Projectile pierce handling
            if (proj.pierceCount > 0) {
              proj.pierceCount--;
            } else {
              proj.isExpired = true;
              break;
            }
          }
        }
      }
    }

    // 2. Slow periodic respawn of props if population is low
    this.respawnTimer += deltaTime;
    if (this.respawnTimer >= 25.0) {
      this.respawnTimer = 0;
      if (this.props.length < 10 && this.bounds) {
        const halfW = this.bounds.halfWidth - 5;
        const halfD = this.bounds.halfDepth - 5;
        const x = (Math.random() * 2 - 1) * halfW;
        const z = (Math.random() * 2 - 1) * halfD;
        const prop = new BreakableProp(x, z, this.currentType);
        this.props.push(prop);
        this.entityManager.add(prop);
      }
    }
  }

  public breakNear(
    x: number,
    z: number,
    radius: number,
    onPropShattered: (prop: BreakableProp, drop: DestructibleDrop) => void
  ): void {
    const rSq = radius * radius;
    for (let i = this.props.length - 1; i >= 0; i--) {
      const prop = this.props[i];
      if (prop.isDead) continue;

      const dx = x - prop.position.x;
      const dz = z - prop.position.z;
      if (dx * dx + dz * dz <= rSq) {
        prop.isDead = true;
        const drop = this.rollDrop();
        onPropShattered(prop, drop);
        this.removePropAt(i);
      }
    }
  }

  private rollDrop(): DestructibleDrop {
    const roll = Math.random();
    if (roll < 0.55) {
      // 55% Gold drop: 8 - 18 gold coins
      return { type: 'gold', amount: Math.floor(8 + Math.random() * 11) };
    } else if (roll < 0.8) {
      // 25% Health Heart: restores 15 HP
      return { type: 'heal', amount: 15 };
    } else {
      // 20% XP bonus gem
      return { type: 'xp', amount: 25 };
    }
  }

  private removePropAt(index: number): void {
    const prop = this.props[index];
    const last = this.props.pop()!;
    if (index < this.props.length) {
      this.props[index] = last;
    }
    this.entityManager.remove(prop);
    prop.dispose();
  }

  public getProps(): readonly BreakableProp[] {
    return this.props;
  }

  public clear(): void {
    for (let i = 0; i < this.props.length; i++) {
      this.entityManager.remove(this.props[i]);
      this.props[i].dispose();
    }
    this.props = [];
    this.respawnTimer = 0;
  }

  public dispose(): void {
    this.clear();
    this.bounds = null;
  }
}
