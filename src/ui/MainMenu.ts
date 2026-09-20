import { GAME_CONFIG } from '../config/gameConfig';
import { SettingsMenu } from './SettingsMenu';
import { MetaManager } from '../config/metaConfig';
import { formatTime } from '../utils/math';
import '../styles/menu.css';

export class MainMenu {
  private element: HTMLDivElement | null = null;
  private onStartCallback: () => void;
  private settingsMenu: SettingsMenu;

  constructor(onStart: () => void) {
    this.onStartCallback = onStart;
    this.settingsMenu = new SettingsMenu(() => {
      this.settingsMenu.unmount();
      if (this.element) {
        this.element.style.display = 'flex';
      }
    });
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = GAME_CONFIG.title;

    const startBtn = document.createElement('button');
    startBtn.className = 'menu-button';
    startBtn.textContent = 'START GAME';
    startBtn.onclick = () => this.onStartCallback();

    const optionsBtn = document.createElement('button');
    optionsBtn.className = 'menu-button secondary';
    optionsBtn.textContent = 'OPTIONS';
    optionsBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.settingsMenu.mount(parent);
    };

    this.element.appendChild(title);
    this.element.appendChild(startBtn);
    this.element.appendChild(optionsBtn);

    const records = MetaManager.getInstance().getRecords();
    if (records.totalRuns > 0) {
      const statsBadge = document.createElement('div');
      statsBadge.className = 'main-menu-records';
      statsBadge.innerHTML = `
        <span>🏆 BEST: <b>${formatTime(records.bestTime)}</b></span>
        <span>⚔️ KILLS: <b>${records.maxKills}</b></span>
        <span>⭐ LVL: <b>${records.highestLevel}</b></span>
        <span>🪙 GOLD: <b>${records.totalGold}</b></span>
      `;
      this.element.appendChild(statsBadge);
    }

    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.settingsMenu.unmount();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
