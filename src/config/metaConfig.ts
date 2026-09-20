export interface PlayerRecords {
  bestTime: number; // in seconds
  highestLevel: number;
  maxKills: number;
  totalGold: number;
  totalRuns: number;
}

const STORAGE_KEY = 'survivor_player_records';

const DEFAULT_RECORDS: PlayerRecords = {
  bestTime: 0,
  highestLevel: 1,
  maxKills: 0,
  totalGold: 0,
  totalRuns: 0,
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
        return { ...DEFAULT_RECORDS, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_RECORDS };
  }

  private saveRecords(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // Ignore
    }
  }

  public getRecords(): Readonly<PlayerRecords> {
    return this.records;
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

    this.records.totalGold += gold;
    this.records.totalRuns += 1;

    this.saveRecords();
    return isNewRecord;
  }
}
