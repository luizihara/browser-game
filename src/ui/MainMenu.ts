import { GAME_CONFIG } from '../config/gameConfig';
import { SettingsMenu } from './SettingsMenu';
import { MetaShopMenu } from './MetaShopMenu';
import { CharacterSelectMenu } from './CharacterSelectMenu';
import { StageSelectMenu } from './StageSelectMenu';
import { MetaManager } from '../config/metaConfig';
import { formatTime } from '../utils/math';
import '../styles/menu.css';
import '../styles/menuThemes.css';

export interface ThemeOption {
  id: number;
  label: string;
}

export const MENU_THEMES: ThemeOption[] = [
  { id: 1, label: '1: 16-Bit' },
  { id: 2, label: '2: Comic' },
  { id: 3, label: '3: Tome' },
  { id: 4, label: '4: Tavern' },
  { id: 5, label: '5: Clay' },
  { id: 6, label: '6: Gothic' },
  { id: 7, label: '7: Tactical' },
  { id: 8, label: '8: Magitech' },
  { id: 9, label: '9: Synthwave' },
  { id: 10, label: '10: Shonen' },
];

export class MainMenu {
  private element: HTMLDivElement | null = null;
  private onStartCallback: () => void;
  private settingsMenu: SettingsMenu;
  private metaShopMenu: MetaShopMenu;
  private characterSelectMenu: CharacterSelectMenu;
  private stageSelectMenu: StageSelectMenu;
  private parentContainer: HTMLElement | null = null;
  private currentTheme: number = 1;
  private boundPopStateHandler: (() => void) | null = null;
  private switcherButtons: HTMLButtonElement[] = [];

  constructor(onStart: () => void) {
    this.onStartCallback = onStart;

    this.settingsMenu = new SettingsMenu(() => {
      this.settingsMenu.unmount();
      if (this.element) {
        this.element.style.display = 'flex';
      }
    });

    this.metaShopMenu = new MetaShopMenu(() => {
      this.metaShopMenu.unmount();
      if (this.element) {
        this.element.style.display = 'flex';
        this.refreshRecords();
      }
    });

    this.stageSelectMenu = new StageSelectMenu(
      () => {
        this.stageSelectMenu.unmount();
        this.onStartCallback();
      },
      () => {
        this.stageSelectMenu.unmount();
        if (this.parentContainer) {
          this.characterSelectMenu.mount(this.parentContainer);
        }
      }
    );

    this.characterSelectMenu = new CharacterSelectMenu(
      () => {
        this.characterSelectMenu.unmount();
        if (this.parentContainer) {
          this.stageSelectMenu.mount(this.parentContainer);
        } else {
          this.onStartCallback();
        }
      },
      () => {
        this.characterSelectMenu.unmount();
        if (this.element) {
          this.element.style.display = 'flex';
          this.refreshRecords();
        }
      }
    );
  }

  private parseThemeFromUrl(): number {
    const matchPath = window.location.pathname.match(/^\/(\d+)\/?$/);
    if (matchPath) {
      const n = parseInt(matchPath[1]!, 10);
      if (n >= 1 && n <= 10) return n;
    }
    const params = new URLSearchParams(window.location.search);
    const q = params.get('style') || params.get('menu');
    if (q) {
      const n = parseInt(q, 10);
      if (n >= 1 && n <= 10) return n;
    }
    const matchHash = window.location.hash.match(/^#(\d+)$/);
    if (matchHash) {
      const n = parseInt(matchHash[1]!, 10);
      if (n >= 1 && n <= 10) return n;
    }
    return 1;
  }

  public setTheme(themeId: number, updateHistory: boolean = true): void {
    this.currentTheme = themeId;
    if (this.element) {
      // Retain overlay-screen base class and apply active theme
      this.element.className = `overlay-screen theme-${themeId}`;
    }

    this.switcherButtons.forEach((btn, idx) => {
      if (idx + 1 === themeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (updateHistory) {
      try {
        window.history.pushState(null, '', `/${themeId}`);
      } catch {
        // Fallback for strict origin restrictions if any
      }
    }
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;
    this.parentContainer = parent;

    this.currentTheme = this.parseThemeFromUrl();

    this.element = document.createElement('div');
    this.element.className = `overlay-screen theme-${this.currentTheme}`;

    // 1. Top Theme Switcher Bar
    const switcherBar = document.createElement('div');
    switcherBar.className = 'theme-switcher-bar';

    const switcherLabel = document.createElement('span');
    switcherLabel.className = 'theme-switcher-label';
    switcherLabel.textContent = 'MENU STYLES:';
    switcherBar.appendChild(switcherLabel);

    this.switcherButtons = [];
    MENU_THEMES.forEach((t) => {
      const btn = document.createElement('button');
      btn.className = `theme-switcher-btn ${t.id === this.currentTheme ? 'active' : ''}`;
      btn.textContent = t.label;
      btn.onclick = () => this.setTheme(t.id, true);
      switcherBar.appendChild(btn);
      this.switcherButtons.push(btn);
    });
    this.element.appendChild(switcherBar);

    // 2. Main Title
    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = GAME_CONFIG.title;

    // 3. Interactive Buttons
    const startBtn = document.createElement('button');
    startBtn.className = 'menu-button';
    startBtn.textContent = 'START GAME';
    startBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.characterSelectMenu.mount(parent);
    };

    const shopBtn = document.createElement('button');
    shopBtn.className = 'menu-button';
    shopBtn.textContent = 'POWER-UPS 🪙';
    shopBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.metaShopMenu.mount(parent);
    };

    const optionsBtn = document.createElement('button');
    optionsBtn.className = 'menu-button secondary';
    optionsBtn.textContent = 'OPTIONS';
    optionsBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.settingsMenu.mount(parent);
    };

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'main-menu-buttons';
    buttonContainer.appendChild(startBtn);
    buttonContainer.appendChild(shopBtn);
    buttonContainer.appendChild(optionsBtn);

    this.element.appendChild(title);
    this.element.appendChild(buttonContainer);

    this.refreshRecords();

    parent.appendChild(this.element);

    // Synchronize theme on browser back/forward history navigation
    this.boundPopStateHandler = () => {
      const theme = this.parseThemeFromUrl();
      this.setTheme(theme, false);
    };
    window.addEventListener('popstate', this.boundPopStateHandler);
  }

  private refreshRecords(): void {
    if (!this.element) return;

    const oldBadge = this.element.querySelector('.main-menu-records');
    if (oldBadge) {
      oldBadge.remove();
    }

    const records = MetaManager.getInstance().getRecords();
    if (records.totalRuns > 0 || records.totalGold > 0) {
      const statsBadge = document.createElement('div');
      statsBadge.className = 'main-menu-records';
      statsBadge.innerHTML = `
        <span>🏆 BEST: <b>${formatTime(records.bestTime)}</b></span>
        <span>⚔️ KILLS: <b>${records.maxKills}</b></span>
        <span>⭐ LVL: <b>${records.highestLevel}</b></span>
        <span>🪙 GOLD: <b>${records.totalGold.toLocaleString()}</b></span>
      `;
      this.element.appendChild(statsBadge);
    }
  }

  public unmount(): void {
    if (this.boundPopStateHandler) {
      window.removeEventListener('popstate', this.boundPopStateHandler);
      this.boundPopStateHandler = null;
    }
    this.settingsMenu.unmount();
    this.metaShopMenu.unmount();
    this.characterSelectMenu.unmount();
    this.stageSelectMenu.unmount();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.parentContainer = null;
    this.switcherButtons = [];
  }
}
