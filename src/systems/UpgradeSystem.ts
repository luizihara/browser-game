import {
  UPGRADE_CONFIG,
  type UpgradeId,
  type UpgradeDefinition,
} from '../config/upgradeConfig';
import { WEAPON_CONFIG, type WeaponId } from '../config/weaponConfig';
import { EVOLUTION_CONFIG } from '../config/evolutionConfig';
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
  private acquiredPassives: Set<string> = new Set();

  public getEligibleEvolutions(weaponSystem?: WeaponSystem): UpgradeDefinition[] {
    if (!weaponSystem) return [];
    const result: UpgradeDefinition[] = [];
    const equipped = weaponSystem.getWeapons();

    for (let i = 0; i < equipped.length; i++) {
      const w = equipped[i];
      if (w.isMaxLevel && !w.isEvolved) {
        const evoDef = EVOLUTION_CONFIG[w.id];
        if (evoDef && this.acquiredPassives.has(evoDef.requiredPassiveId)) {
          result.push({
            id: `evolution_${w.id}`,
            name: evoDef.name,
            description: evoDef.description,
            icon: evoDef.icon,
            category: 'evolution',
            categoryLabel: evoDef.badgeLabel,
            weaponId: w.id,
          });
        }
      }
    }
    return result;
  }

  public getRandomUpgrades(
    count: number = 3,
    weaponSystem?: WeaponSystem
  ): UpgradeDefinition[] {
    const pool: UpgradeDefinition[] = [];
    const evolutions = this.getEligibleEvolutions(weaponSystem);

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

    // Shuffle general pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);

    // If there are eligible evolutions, prioritize including one in the selection
    const finalChoices: UpgradeDefinition[] = [];
    if (evolutions.length > 0) {
      finalChoices.push(evolutions[0]);
    }

    for (let i = 0; i < shuffled.length && finalChoices.length < count; i++) {
      if (!finalChoices.some((c) => c.id === shuffled[i].id)) {
        finalChoices.push(shuffled[i]);
      }
    }

    return finalChoices;
  }

  public applyUpgrade(
    upgradeId: UpgradeId,
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem
  ): void {
    if (upgradeId.startsWith('evolution_')) {
      const wid = upgradeId.replace('evolution_', '') as WeaponId;
      weaponSystem.evolveWeapon(wid);
      return;
    }

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

    this.acquiredPassives.add(upgradeId);

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

  public grantRandomChestUpgrade(
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem
  ): UpgradeDefinition {
    // Priority 1: Evolve weapon if eligible
    const evolutions = this.getEligibleEvolutions(weaponSystem);
    if (evolutions.length > 0) {
      const chosen = evolutions[0];
      this.applyUpgrade(chosen.id, player, weaponSystem, expSystem);
      return chosen;
    }

    const choices = this.getRandomUpgrades(1, weaponSystem);
    const chosen = choices[0] ?? {
      id: 'might',
      name: UPGRADE_CONFIG.might.name,
      description: UPGRADE_CONFIG.might.description,
      icon: UPGRADE_CONFIG.might.icon,
      category: 'passive',
      categoryLabel: 'PASSIVE',
    };

    this.applyUpgrade(chosen.id, player, weaponSystem, expSystem);
    return chosen;
  }

  public reset(
    player: Player,
    weaponSystem: WeaponSystem,
    expSystem: ExperienceSystem,
    startingWeaponId: WeaponId = 'wand'
  ): void {
    this.damageMultiplier = 1.0;
    this.speedMultiplier = 1.0;
    this.cooldownMultiplier = 1.0;
    this.pickupRangeMultiplier = 1.0;
    this.projectileSpeedMultiplier = 1.0;
    this.acquiredPassives.clear();

    player.speed = PLAYER_CONFIG.speed;
    player.maxHp = PLAYER_CONFIG.maxHp;
    player.resetHp();

    weaponSystem.resetToDefault(startingWeaponId);
    expSystem.reset();
  }
}
