import {
  META_UPGRADES,
  getUpgradeCost,
  type MetaUpgradeId,
} from './metaUpgradeConfig';
import { CHARACTER_CONFIG, type CharacterId } from './characterConfig';
import type { StageId } from './stageConfig';
import {
  ACHIEVEMENTS_CONFIG,
  type AchievementId,
} from './achievementConfig';

export interface StageRecord {
  bestTime: number;
  maxKills: number;
  cleared: boolean;
}

export interface AchievementRecord {
  unlocked: boolean;
  claimed: boolean;
  currentProgress: number;
}

export interface CumulativeStats {
  lifetimeKills: number;
  lifetimeBossKills: Record<string, number>;
  lifetimeChests: number;
  lifetimeBreakables: number;
  lifetimeEvolutions: number;
  heroesWon: CharacterId[];
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
  achievements: Record<AchievementId, AchievementRecord>;
  stats: CumulativeStats;
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

const createDefaultAchievements = (): Record<AchievementId, AchievementRecord> => {
  const result = {} as Record<AchievementId, AchievementRecord>;
  for (const key of Object.keys(ACHIEVEMENTS_CONFIG) as AchievementId[]) {
    result[key] = {
      unlocked: false,
      claimed: false,
      currentProgress: 0,
    };
  }
  return result;
};

const DEFAULT_STATS: CumulativeStats = {
  lifetimeKills: 0,
  lifetimeBossKills: {},
  lifetimeChests: 0,
  lifetimeBreakables: 0,
  lifetimeEvolutions: 0,
  heroesWon: [],
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
  achievements: createDefaultAchievements(),
  stats: { ...DEFAULT_STATS },
};

export class MetaManager {
  private static instance: MetaManager | null = null;
  private records: PlayerRecords;
  private achievementListeners: ((id: AchievementId) => void)[] = [];

  private constructor() {
    this.records = this.loadRecords();
  }

  public static getInstance(): MetaManager {
    if (!this.instance) {
      this.instance = new MetaManager();
    }
    return this.instance;
  }

  public onAchievementUnlocked(listener: (id: AchievementId) => void): () => void {
    this.achievementListeners.push(listener);
    return () => {
      this.achievementListeners = this.achievementListeners.filter((l) => l !== listener);
    };
  }

  private notifyAchievement(id: AchievementId): void {
    for (let i = 0; i < this.achievementListeners.length; i++) {
      try {
        this.achievementListeners[i](id);
      } catch (err) {
        console.warn('[MetaManager] Error in achievement listener:', err);
      }
    }
  }

  private loadRecords(): PlayerRecords {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        const mergedAchievements = createDefaultAchievements();
        if (parsed.achievements) {
          for (const key of Object.keys(parsed.achievements) as AchievementId[]) {
            if (mergedAchievements[key]) {
              mergedAchievements[key] = {
                ...mergedAchievements[key],
                ...parsed.achievements[key],
              };
            }
          }
        }

        const mergedStats: CumulativeStats = {
          ...DEFAULT_STATS,
          ...(parsed.stats || {}),
        };

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
          achievements: mergedAchievements,
          stats: mergedStats,
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
      achievements: createDefaultAchievements(),
      stats: { ...DEFAULT_STATS },
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
    this.checkGoldAchievements();
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

  // --- ACHIEVEMENTS MANAGEMENT ---

  public getAchievementState(id: AchievementId): AchievementRecord {
    return this.records.achievements[id] ?? { unlocked: false, claimed: false, currentProgress: 0 };
  }

  public getAllAchievements(): Record<AchievementId, AchievementRecord> {
    return this.records.achievements;
  }

  public getStats(): Readonly<CumulativeStats> {
    return this.records.stats;
  }

  public unlockAchievement(id: AchievementId): boolean {
    const record = this.records.achievements[id];
    if (!record || record.unlocked) return false;

    const def = ACHIEVEMENTS_CONFIG[id];
    record.unlocked = true;
    record.currentProgress = def ? def.maxProgress : 1;
    this.saveRecords();
    this.notifyAchievement(id);
    return true;
  }

  public updateAchievementProgress(
    id: AchievementId,
    progressDeltaOrTotal: number,
    isAbsolute: boolean = false
  ): boolean {
    const record = this.records.achievements[id];
    if (!record || record.unlocked) return false;

    const def = ACHIEVEMENTS_CONFIG[id];
    if (!def) return false;

    if (isAbsolute) {
      record.currentProgress = Math.max(record.currentProgress, progressDeltaOrTotal);
    } else {
      record.currentProgress += progressDeltaOrTotal;
    }

    if (record.currentProgress >= def.maxProgress) {
      record.unlocked = true;
      record.currentProgress = def.maxProgress;
      this.saveRecords();
      this.notifyAchievement(id);
      return true;
    }

    this.saveRecords();
    return false;
  }

  public claimAchievement(id: AchievementId): number {
    const record = this.records.achievements[id];
    if (!record || !record.unlocked || record.claimed) return 0;

    const def = ACHIEVEMENTS_CONFIG[id];
    if (!def) return 0;

    record.claimed = true;
    this.records.totalGold += def.rewardGold;
    this.checkGoldAchievements();
    this.saveRecords();
    return def.rewardGold;
  }

  public claimAllAchievements(): number {
    let totalClaimed = 0;
    for (const key of Object.keys(this.records.achievements) as AchievementId[]) {
      const record = this.records.achievements[key];
      if (record && record.unlocked && !record.claimed) {
        const def = ACHIEVEMENTS_CONFIG[key];
        if (def) {
          record.claimed = true;
          totalClaimed += def.rewardGold;
        }
      }
    }

    if (totalClaimed > 0) {
      this.records.totalGold += totalClaimed;
      this.checkGoldAchievements();
      this.saveRecords();
    }
    return totalClaimed;
  }

  public getUnclaimedAchievementsCount(): number {
    let count = 0;
    for (const key of Object.keys(this.records.achievements) as AchievementId[]) {
      const record = this.records.achievements[key];
      if (record && record.unlocked && !record.claimed) {
        count++;
      }
    }
    return count;
  }

  public recordChestOpened(): void {
    this.records.stats.lifetimeChests += 1;
    this.updateAchievementProgress('treasure_hunter', 1);
    this.saveRecords();
  }

  public recordPropDestroyed(): void {
    this.records.stats.lifetimeBreakables += 1;
    this.updateAchievementProgress('prop_smasher', 1);
    this.saveRecords();
  }

  public recordEvolutionCrafted(): void {
    this.records.stats.lifetimeEvolutions += 1;
    this.unlockAchievement('legendary_crafter');
    this.saveRecords();
  }

  public recordBossKill(bossId: string): void {
    if (!this.records.stats.lifetimeBossKills[bossId]) {
      this.records.stats.lifetimeBossKills[bossId] = 0;
    }
    this.records.stats.lifetimeBossKills[bossId] += 1;

    if (bossId.includes('gorgonath')) {
      this.unlockAchievement('boss_gorgonath');
    } else if (bossId.includes('malakor')) {
      this.unlockAchievement('boss_malakor');
    }
    this.saveRecords();
  }

  private checkGoldAchievements(): void {
    this.updateAchievementProgress('gold_hoarder', this.records.totalGold, true);
  }

  public submitRun(
    runTime: number,
    level: number,
    kills: number,
    gold: number,
    stageId: StageId = this.records.selectedStage || 'verdant',
    heroId: CharacterId = this.records.selectedCharacter || 'knight'
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

    // Cumulative Stats
    this.records.stats.lifetimeKills += kills;
    this.updateAchievementProgress('monster_slayer', kills);
    this.updateAchievementProgress('genocide', kills);

    if (kills >= 100) {
      this.unlockAchievement('first_blood');
    }

    if (runTime >= 180) {
      this.unlockAchievement('survivor_novice');
    }

    if (runTime >= 300) {
      this.unlockAchievement('survivor_champion');
      if (!this.records.stats.heroesWon.includes(heroId)) {
        this.records.stats.heroesWon.push(heroId);
      }
      if (heroId === 'knight') this.unlockAchievement('knight_glory');
      if (heroId === 'mage') this.unlockAchievement('mage_ascension');
      if (heroId === 'rogue') this.unlockAchievement('rogue_shadows');
      if (heroId === 'templar') this.unlockAchievement('templar_light');
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
    this.checkGoldAchievements();

    this.saveRecords();
    return isNewRecord;
  }
}
