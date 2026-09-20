export type ScreenShakeLevel = 'full' | 'reduced' | 'off';

export interface GameSettings {
  masterVolume: number; // 0.0 to 1.0
  sfxVolume: number; // 0.0 to 1.0
  muted: boolean;
  screenShake: ScreenShakeLevel;
  damageFlash: boolean;
  showFps: boolean;
  damageNumbers: boolean;
}

const STORAGE_KEY = 'survivor_game_settings';

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.8,
  sfxVolume: 0.8,
  muted: false,
  screenShake: 'full',
  damageFlash: true,
  showFps: true,
  damageNumbers: true,
};

export class SettingsManager {
  private static instance: SettingsManager | null = null;
  private settings: GameSettings;
  private listeners: ((settings: GameSettings) => void)[] = [];

  private constructor() {
    this.settings = this.loadFromStorage();
  }

  public static getInstance(): SettingsManager {
    if (!this.instance) {
      this.instance = new SettingsManager();
    }
    return this.instance;
  }

  private loadFromStorage(): GameSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Fallback to default settings
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage write errors (e.g. private mode)
    }
  }

  public getSettings(): Readonly<GameSettings> {
    return this.settings;
  }

  public updateSettings(partial: Partial<GameSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveToStorage();
    this.notifyListeners();
  }

  public subscribe(cb: (settings: GameSettings) => void): () => void {
    this.listeners.push(cb);
    cb(this.settings);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners(): void {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i]!(this.settings);
    }
  }
}
