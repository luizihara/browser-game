import {
  META_UPGRADES,
  getUpgradeCost,
  type MetaUpgradeId,
} from './metaUpgradeConfig';
import { CHARACTER_CONFIG, type CharacterId } from './characterConfig';
import type { StageId } from './stageConfig';

export interface StageRecord {
  bestTime: number;
  maxKills: number;
  cleared: boolean;
}

export interface PlayerRecords {
  bestTime: number; // in seconds
  highestLevel: number;
  maxKills: number;
  totalGold: number;
  totalRuns: number;
  upgrades: Record<MetaUpgradeId, number>;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  selectedStage: StageId;
  unlockedStages: StageId[];
  stageRecords: Record<StageId, StageRecord>;
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

const DEFAULT_STAGE_RECORDS: Record<StageId, StageRecord> = {
  verdant: { bestTime: 0, maxKills: 0, cleared: false },
  inferno: { bestTime: 0, maxKills: 0, cleared: false },
  glacial: { bestTime: 0, maxKills: 0, cleared: false },
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
  selectedStage: 'verdant',
  unlockedStages: ['verdant'],
  stageRecords: { ...DEFAULT_STAGE_RECORDS },
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
          selectedStage: parsed.selectedStage || 'verdant',
          unlockedStages: parsed.unlockedStages || ['verdant'],
          stageRecords: {
            ...DEFAULT_STAGE_RECORDS,
            ...(parsed.stageRecords || {}),
          },
        };
      }
    } catch {
      // Fallback to default
    }
    return {
      ...DEFAULT_RECORDS,
      upgrades: { ...DEFAULT_UPGRADES },
      unlockedCharacters: ['knight', 'mage'],
      selectedStage: 'verdant',
      unlockedStages: ['verdant'],
      stageRecords: { ...DEFAULT_STAGE_RECORDS },
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

  public getSelectedStage(): StageId {
    return this.records.selectedStage || 'verdant';
  }

  public setSelectedStage(id: StageId): void {
    if (this.isStageUnlocked(id)) {
      this.records.selectedStage = id;
      this.saveRecords();
    }
  }

  public isStageUnlocked(id: StageId): boolean {
    return this.records.unlockedStages?.includes(id) ?? id === 'verdant';
  }

  public unlockStage(id: StageId): boolean {
    if (this.isStageUnlocked(id)) return true;
    if (!this.records.unlockedStages) {
      this.records.unlockedStages = ['verdant'];
    }
    this.records.unlockedStages.push(id);
    this.saveRecords();
    return true;
  }

  public getStageRecord(id: StageId): StageRecord {
    return (
      this.records.stageRecords?.[id] ?? {
        bestTime: 0,
        maxKills: 0,
        cleared: false,
      }
    );
  }

  public submitRun(
    runTime: number,
    level: number,
    kills: number,
    gold: number,
    stageId: StageId = this.records.selectedStage || 'verdant'
  ): boolean {
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

    // Update Stage-Specific Record
    if (!this.records.stageRecords) {
      this.records.stageRecords = {
        verdant: { bestTime: 0, maxKills: 0, cleared: false },
        inferno: { bestTime: 0, maxKills: 0, cleared: false },
        glacial: { bestTime: 0, maxKills: 0, cleared: false },
      };
    }
    const currentStageRecord = this.records.stageRecords[stageId] ?? {
      bestTime: 0,
      maxKills: 0,
      cleared: false,
    };
    if (runTime > currentStageRecord.bestTime) {
      currentStageRecord.bestTime = runTime;
    }
    if (kills > currentStageRecord.maxKills) {
      currentStageRecord.maxKills = kills;
    }
    if (runTime >= 300) {
      currentStageRecord.cleared = true;
    }
    this.records.stageRecords[stageId] = currentStageRecord;

    // Stage Progression Unlock Check
    if (stageId === 'verdant' && runTime >= 180) {
      this.unlockStage('inferno');
    }
    if (stageId === 'inferno' && runTime >= 180) {
      this.unlockStage('glacial');
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
