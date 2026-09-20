import {
  META_UPGRADES,
  getUpgradeCost,
  type MetaUpgradeId,
} from './metaUpgradeConfig';
import { CHARACTER_CONFIG, type CharacterId } from './characterConfig';

export interface PlayerRecords {
  bestTime: number; // in seconds
  highestLevel: number;
  maxKills: number;
  totalGold: number;
  totalRuns: number;
  upgrades: Record<MetaUpgradeId, number>;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
}

const STORAGE_KEY = 'survivor_player_records';

const DEFAULT_UPGRADES: Record<MetaUpgradeId, number> = {
  might: 0,
  vitality: 0,
  armor: 0,
  swiftness: 0,
  haste: 0,
  magnetism: 0,
  growth: 0,
  greed: 0,
};

const DEFAULT_RECORDS: PlayerRecords = {
  bestTime: 0,
  highestLevel: 1,
  maxKills: 0,
  totalGold: 0,
  totalRuns: 0,
  upgrades: { ...DEFAULT_UPGRADES },
  selectedCharacter: 'knight',
  unlockedCharacters: ['knight', 'mage'],
};

export class MetaManager {
  private static instance: MetaManager | null = null;
  private records: PlayerRecords;

  private constructor() {
    this.records = this.loadRecords();
  }

  public static getInstance(): MetaManager {
    if (!this.instance) {
      this.instance = new MetaManager();
    }
    return this.instance;
  }

  private loadRecords(): PlayerRecords {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_RECORDS,
          ...parsed,
          upgrades: {
            ...DEFAULT_UPGRADES,
            ...(parsed.upgrades || {}),
          },
          selectedCharacter: parsed.selectedCharacter || 'knight',
          unlockedCharacters: parsed.unlockedCharacters || ['knight', 'mage'],
        };
      }
    } catch {
      // Fallback to default
    }
    return {
      ...DEFAULT_RECORDS,
      upgrades: { ...DEFAULT_UPGRADES },
      unlockedCharacters: ['knight', 'mage'],
    };
  }

  private saveRecords(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // Ignore storage errors
    }
  }

  public getRecords(): Readonly<PlayerRecords> {
    return this.records;
  }

  public getGold(): number {
    return this.records.totalGold;
  }

  public addGold(amount: number): void {
    if (amount <= 0) return;
    this.records.totalGold += amount;
    this.saveRecords();
  }

  public getUpgradeRank(id: MetaUpgradeId): number {
    return this.records.upgrades[id] ?? 0;
  }

  public getStatBonus(id: MetaUpgradeId): number {
    const rank = this.getUpgradeRank(id);
    const def = META_UPGRADES[id];
    if (!def) return 0;
    return rank * def.bonusPerRank;
  }

  public buyUpgrade(id: MetaUpgradeId): boolean {
    const def = META_UPGRADES[id];
    if (!def) return false;

    const currentRank = this.getUpgradeRank(id);
    if (currentRank >= def.maxRank) return false;

    const cost = getUpgradeCost(def, currentRank);
    if (this.records.totalGold < cost) return false;

    this.records.totalGold -= cost;
    this.records.upgrades[id] = currentRank + 1;
    this.saveRecords();
    return true;
  }

  public refundUpgrades(): number {
    let totalRefund = 0;

    for (const key of Object.keys(this.records.upgrades) as MetaUpgradeId[]) {
      const rank = this.records.upgrades[key];
      const def = META_UPGRADES[key];
      if (!def || rank <= 0) continue;

      for (let r = 0; r < rank; r++) {
        totalRefund += getUpgradeCost(def, r);
      }
      this.records.upgrades[key] = 0;
    }

    this.records.totalGold += totalRefund;
    this.saveRecords();
    return totalRefund;
  }

  public getSelectedCharacter(): CharacterId {
    return this.records.selectedCharacter;
  }

  public setSelectedCharacter(id: CharacterId): void {
    if (this.isCharacterUnlocked(id)) {
      this.records.selectedCharacter = id;
      this.saveRecords();
    }
  }

  public isCharacterUnlocked(id: CharacterId): boolean {
    return this.records.unlockedCharacters.includes(id);
  }

  public unlockCharacter(id: CharacterId): boolean {
    if (this.isCharacterUnlocked(id)) return true;

    const def = CHARACTER_CONFIG[id];
    if (!def || def.unlockCondition.type !== 'gold') return false;

    const cost = def.unlockCondition.cost ?? 0;
    if (this.records.totalGold < cost) return false;

    this.records.totalGold -= cost;
    this.records.unlockedCharacters.push(id);
    this.records.selectedCharacter = id;
    this.saveRecords();
    return true;
  }

  public submitRun(runTime: number, level: number, kills: number, gold: number): boolean {
    let isNewRecord = false;

    if (runTime > this.records.bestTime) {
      this.records.bestTime = runTime;
      isNewRecord = true;
    }
    if (level > this.records.highestLevel) {
      this.records.highestLevel = level;
      isNewRecord = true;
    }
    if (kills > this.records.maxKills) {
      this.records.maxKills = kills;
      isNewRecord = true;
    }

    // Apply Greed meta upgrade multiplier to end of run gold
    const greedBonus = this.getStatBonus('greed');
    const finalGold = Math.round(gold * (1.0 + greedBonus));

    this.records.totalGold += finalGold;
    this.records.totalRuns += 1;

    this.saveRecords();
    return isNewRecord;
  }
}
