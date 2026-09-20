import {
  UPGRADE_CONFIG,
  type UpgradeId,
  type UpgradeDefinition,
} from '../config/upgradeConfig';
import { WEAPON_CONFIG, type WeaponId } from '../config/weaponConfig';
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

  public getRandomUpgrades(
    count: number = 3,
    weaponSystem?: WeaponSystem
  ): UpgradeDefinition[] {
    const pool: UpgradeDefinition[] = [];

    if (weaponSystem) {
      const allWeaponIds: WeaponId[] = ['wand', 'orbital', 'aura', 'dagger'];

      // 1. Offer unowned weapons if player has open equipment slots
      if (weaponSystem.canEquipNewWeapon()) {
        for (let i = 0; i < allWeaponIds.length; i++) {
          const wid = allWeaponIds[i];
          if (!weaponSystem.hasWeapon(wid)) {
            const wCfg = WEAPON_CONFIG[wid];
            pool.push({
              id: `weapon_unlock_${wid}`,
              name: wCfg.name,
              description: wCfg.levels[0].description,
              icon: wCfg.icon,
              category: 'new_weapon',
              categoryLabel: 'NEW WEAPON',
              weaponId: wid,
            });
          }
        }
      }

      // 2. Offer upgrades for currently equipped weapons (if not max level)
      const equipped = weaponSystem.getWeapons();
      for (let i = 0; i < equipped.length; i++) {
        const w = equipped[i];
        if (!w.isMaxLevel) {
          pool.push({
            id: `weapon_upgrade_${w.id}`,
            name: `${w.name} (Lv ${w.level + 1})`,
            description: w.getNextLevelDescription(),
            icon: w.icon,
            category: 'weapon_upgrade',
            categoryLabel: `UPGRADE LVL ${w.level + 1}`,
            weaponId: w.id,
          });
        }
      }
    }

    // 3. Always offer cumulative passives
    const passives = Object.values(UPGRADE_CONFIG);
    for (let i = 0; i < passives.length; i++) {
      const p = passives[i];
      pool.push({
        id: p.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        category: 'passive',
        categoryLabel: 'PASSIVE',
      });
    }

    // Shuffle and pick unique options
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  public applyUpgrade(
    upgradeId: UpgradeId,
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem
  ): void {
    if (upgradeId.startsWith('weapon_unlock_')) {
      const wid = upgradeId.replace('weapon_unlock_', '') as WeaponId;
      weaponSystem.unlockWeapon(wid);
      return;
    }

    if (upgradeId.startsWith('weapon_upgrade_')) {
      const wid = upgradeId.replace('weapon_upgrade_', '') as WeaponId;
      weaponSystem.upgradeWeapon(wid);
      return;
    }

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

    // Sync weapon modifiers across all equipped weapons
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

    weaponSystem.resetToDefault();
    expSystem.reset();
  }
}
