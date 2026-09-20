import type { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/player/Player';
import { XpGem } from '../entities/pickup/XpGem';
import { EXPERIENCE_CONFIG, type GemTier } from '../config/experienceConfig';
import type { Disposable } from '../types';

export class ExperienceSystem implements Disposable {
  private entityManager: EntityManager;
  private activeGems: XpGem[] = [];
  private currentLevel: number = 1;
  private currentXp: number = 0;
  private xpToNextLevel: number;
  private pickupRange: number = EXPERIENCE_CONFIG.basePickupRange;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.xpToNextLevel = this.calculateXpRequirement(this.currentLevel);
  }

  public calculateXpRequirement(level: number): number {
    return Math.floor(
      EXPERIENCE_CONFIG.baseXpToLevel *
        Math.pow(EXPERIENCE_CONFIG.xpGrowthFactor, level - 1)
    );
  }

  public spawnGem(
    x: number,
    z: number,
    tierOrAmount: GemTier | number = 'green',
    customAmount?: number
  ): void {
    const gem = new XpGem(x, z, tierOrAmount, customAmount);
    this.activeGems.push(gem);
    this.entityManager.add(gem);
  }

  public update(
    deltaTime: number,
    player: Player,
    onLevelUp: (newLevel: number) => void,
    onGemCollected?: (gem: XpGem) => void
  ): void {
    if (player.hp <= 0) return;

    const px = player.position.x;
    const py = player.position.y;
    const pz = player.position.z;
    const rangeSq = this.pickupRange * this.pickupRange;

    for (let i = this.activeGems.length - 1; i >= 0; i--) {
      const gem = this.activeGems[i];
      if (gem.isCollected) {
        this.removeGemAt(i);
        continue;
      }

      const dx = px - gem.position.x;
      const dz = pz - gem.position.z;
      const distSq = dx * dx + dz * dz;

      // Attract if within magnetic range or already attracted
      if (gem.isAttracted || distSq <= rangeSq) {
        const collected = gem.attractTowards(px, py, pz, deltaTime);
        if (collected) {
          this.addXp(gem.amount, onLevelUp);
          if (onGemCollected) {
            onGemCollected(gem);
          }
          this.removeGemAt(i);
        }
      }
    }
  }

  public addXp(amount: number, onLevelUp: (newLevel: number) => void): void {
    this.currentXp += amount;

    while (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.currentLevel++;
      this.xpToNextLevel = this.calculateXpRequirement(this.currentLevel);
      onLevelUp(this.currentLevel);
    }
  }

  private removeGemAt(index: number): void {
    const gem = this.activeGems[index];
    const last = this.activeGems.pop()!;
    if (index < this.activeGems.length) {
      this.activeGems[index] = last;
    }
    this.entityManager.remove(gem);
  }

  public getProgress(): {
    level: number;
    currentXp: number;
    requiredXp: number;
    ratio: number;
  } {
    const ratio = Math.min(1.0, Math.max(0, this.currentXp / this.xpToNextLevel));
    return {
      level: this.currentLevel,
      currentXp: this.currentXp,
      requiredXp: this.xpToNextLevel,
      ratio,
    };
  }

  public getPickupRange(): number {
    return this.pickupRange;
  }

  public setPickupRange(range: number): void {
    this.pickupRange = range;
  }

  public reset(): void {
    this.clear();
    this.currentLevel = 1;
    this.currentXp = 0;
    this.xpToNextLevel = this.calculateXpRequirement(this.currentLevel);
    this.pickupRange = EXPERIENCE_CONFIG.basePickupRange;
  }

  public clear(): void {
    for (let i = 0; i < this.activeGems.length; i++) {
      this.entityManager.remove(this.activeGems[i]);
    }
    this.activeGems.length = 0;
  }

  public dispose(): void {
    this.clear();
  }
}
