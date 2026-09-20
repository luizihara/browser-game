import {
  UPGRADE_CONFIG,
  type UpgradeId,
  type UpgradeDefinition,
} from '../config/upgradeConfig';
import type { Player } from '../entities/player/Player';
import type { WeaponSystem } from './WeaponSystem';
import type { ExperienceSystem } from './ExperienceSystem';
import { PLAYER_CONFIG } from '../config/playerConfig';

export class UpgradeSystem {
  public damageMultiplier: number = 1.0;
  public speedMultiplier: number = 1.0;
  public cooldownMultiplier: number = 1.0;
  public pickupRangeMultiplier: number = 1.0;
  public projectileSpeedMultiplier: number = 1.0;

  public getRandomUpgrades(count: number = 3): UpgradeDefinition[] {
    const allUpgrades = Object.values(UPGRADE_CONFIG) as UpgradeDefinition[];
    const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  public applyUpgrade(
    upgradeId: UpgradeId,
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem
  ): void {
    switch (upgradeId) {
      case 'might':
        this.damageMultiplier *= UPGRADE_CONFIG.might.multiplier;
        break;
      case 'swiftness':
        this.speedMultiplier *= UPGRADE_CONFIG.swiftness.multiplier;
        player.speed = PLAYER_CONFIG.speed * this.speedMultiplier;
        break;
      case 'haste':
        this.cooldownMultiplier *= UPGRADE_CONFIG.haste.multiplier;
        break;
      case 'vitality':
        player.maxHp += UPGRADE_CONFIG.vitality.bonusHp;
        player.hp = Math.min(player.maxHp, player.hp + UPGRADE_CONFIG.vitality.bonusHp);
        break;
      case 'magnet':
        this.pickupRangeMultiplier *= UPGRADE_CONFIG.magnet.multiplier;
        expSystem.setPickupRange(
          expSystem.getPickupRange() * UPGRADE_CONFIG.magnet.multiplier
        );
        break;
      case 'aerodynamics':
        this.projectileSpeedMultiplier *= UPGRADE_CONFIG.aerodynamics.multiplier;
        break;
    }

    // Sync weapon modifiers
    weaponSystem.applyStatModifiers(
      this.damageMultiplier,
      this.cooldownMultiplier,
      this.projectileSpeedMultiplier
    );
  }

  public reset(
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem
  ): void {
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.pickupRangeMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;

    player.speed = PLAYER_CONFIG.speed;
    player.maxHp = PLAYER_CONFIG.maxHp;
    player.resetHp();

    weaponSystem.applyStatModifiers(1.0, 1.0, 1.0);
    expSystem.reset();
  }
}
