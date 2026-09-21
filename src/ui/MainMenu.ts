import { GAME_CONFIG } from '../config/gameConfig';
import { SettingsMenu } from './SettingsMenu';
import { MetaShopMenu } from './MetaShopMenu';
import { CharacterSelectMenu } from './CharacterSelectMenu';
import { StageSelectMenu } from './StageSelectMenu';
import { BountyBoardMenu } from './BountyBoardMenu';
import { MetaManager } from '../config/metaConfig';
import { formatTime } from '../utils/math';
import '../styles/menu.css';

export class MainMenu {
  private element: HTMLDivElement | null = null;
  private onStartCallback: () => void;
  private settingsMenu: SettingsMenu;
  private metaShopMenu: MetaShopMenu;
  private characterSelectMenu: CharacterSelectMenu;
  private stageSelectMenu: StageSelectMenu;
  private bountyBoardMenu: BountyBoardMenu;
  private parentContainer: HTMLElement | null = null;
  private bountyBtn: HTMLButtonElement | null = null;

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

    this.bountyBoardMenu = new BountyBoardMenu(() => {
      this.bountyBoardMenu.unmount();
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

  public mount(parent: HTMLElement): void {
    if (this.element) return;
    this.parentContainer = parent;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen tavern-theme';

    // 1. Chained Signboard Header
    const signBoard = document.createElement('div');
    signBoard.className = 'tavern-signboard';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = GAME_CONFIG.title;
    signBoard.appendChild(title);

    // 2. Interactive Buttons
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

    this.bountyBtn = document.createElement('button');
    this.bountyBtn.className = 'menu-button';
    this.bountyBtn.textContent = 'BOUNTY BOARD 📜';
    this.bountyBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.bountyBoardMenu.mount(parent);
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
    buttonContainer.appendChild(this.bountyBtn);
    buttonContainer.appendChild(optionsBtn);

    this.element.appendChild(signBoard);
    this.element.appendChild(buttonContainer);

    this.refreshRecords();

    parent.appendChild(this.element);
  }

  private refreshRecords(): void {
    if (!this.element) return;

    // Refresh Bounty Button badge
    if (this.bountyBtn) {
      const unclaimed = MetaManager.getInstance().getUnclaimedAchievementsCount();
      if (unclaimed > 0) {
        this.bountyBtn.innerHTML = `BOUNTY BOARD 📜 <span class="tavern-notify-badge">${unclaimed}</span>`;
      } else {
        this.bountyBtn.textContent = 'BOUNTY BOARD 📜';
      }
    }

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
    this.settingsMenu.unmount();
    this.metaShopMenu.unmount();
    this.bountyBoardMenu.unmount();
    this.characterSelectMenu.unmount();
    this.stageSelectMenu.unmount();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.parentContainer = null;
    this.bountyBtn = null;
  }
}
