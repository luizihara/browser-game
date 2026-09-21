import { MetaManager } from '../config/metaConfig';
import {
  ACHIEVEMENTS_CONFIG,
  ACHIEVEMENT_CATEGORIES,
  type AchievementCategory,
  type AchievementId,
  type AchievementDefinition,
} from '../config/achievementConfig';
import { SoundManager } from '../audio/SoundManager';
import '../styles/menu.css';

export class BountyBoardMenu {
  private element: HTMLDivElement | null = null;
  private onBackCallback: () => void;
  private soundManager: SoundManager;
  private activeCategory: AchievementCategory | 'all' = 'all';
  private listContainer: HTMLDivElement | null = null;
  private claimAllBtn: HTMLButtonElement | null = null;
  private unclaimedBadge: HTMLSpanElement | null = null;

  constructor(onBack: () => void) {
    this.onBackCallback = onBack;
    this.soundManager = new SoundManager();
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen tavern-theme bounty-board-screen';

    // 1. Chained Signboard Header
    const signBoard = document.createElement('div');
    signBoard.className = 'tavern-signboard';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'QUADRO DE CAÇADAS';

    const subtitle = document.createElement('p');
    subtitle.className = 'tavern-screen-subtitle';
    subtitle.textContent = 'Cumpra missões heroicas e reivindique as recompensas da Guilda';

    signBoard.appendChild(title);
    signBoard.appendChild(subtitle);
    this.element.appendChild(signBoard);

    // 2. Action & Stats Bar (Unclaimed count + Claim All button)
    const topBar = document.createElement('div');
    topBar.className = 'bounty-top-bar';

    const countContainer = document.createElement('div');
    countContainer.className = 'bounty-unclaimed-info';
    this.unclaimedBadge = document.createElement('span');
    this.unclaimedBadge.className = 'bounty-unclaimed-text';
    countContainer.appendChild(this.unclaimedBadge);

    this.claimAllBtn = document.createElement('button');
    this.claimAllBtn.className = 'menu-button bounty-claim-all-btn';
    this.claimAllBtn.textContent = 'COLETAR TODAS 🪙';
    this.claimAllBtn.onclick = () => {
      const meta = MetaManager.getInstance();
      const gold = meta.claimAllAchievements();
      if (gold > 0) {
        this.soundManager.playCoinReward();
        this.renderCards();
        this.updateTopBar();
      }
    };

    topBar.appendChild(countContainer);
    topBar.appendChild(this.claimAllBtn);
    this.element.appendChild(topBar);

    // 3. Category Filter Tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'bounty-tabs-container';

    ACHIEVEMENT_CATEGORIES.forEach((cat) => {
      const tabBtn = document.createElement('button');
      tabBtn.className = `bounty-tab-btn ${this.activeCategory === cat.id ? 'active' : ''}`;
      tabBtn.innerHTML = `${cat.icon} <span>${cat.label}</span>`;
      tabBtn.onclick = () => {
        if (this.activeCategory !== cat.id) {
          this.activeCategory = cat.id;
          tabsContainer.querySelectorAll('.bounty-tab-btn').forEach((btn) => {
            btn.classList.remove('active');
          });
          tabBtn.classList.add('active');
          this.renderCards();
        }
      };
      tabsContainer.appendChild(tabBtn);
    });

    this.element.appendChild(tabsContainer);

    // 4. Scrollable Parchment Notices List
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'bounty-cards-container';
    this.element.appendChild(this.listContainer);

    this.renderCards();
    this.updateTopBar();

    // 5. Back Button
    const backBtn = document.createElement('button');
    backBtn.className = 'menu-button secondary';
    backBtn.textContent = 'VOLTAR À TABERNA';
    backBtn.onclick = () => {
      this.onBackCallback();
    };
    this.element.appendChild(backBtn);

    parent.appendChild(this.element);
  }

  private updateTopBar(): void {
    const meta = MetaManager.getInstance();
    const unclaimed = meta.getUnclaimedAchievementsCount();
    const records = meta.getRecords();

    if (this.unclaimedBadge) {
      if (unclaimed > 0) {
        this.unclaimedBadge.innerHTML = `📜 Recompensas prontas: <b>${unclaimed}</b> &nbsp;|&nbsp; 🪙 Cofre: <b>${records.totalGold.toLocaleString()}</b>`;
      } else {
        this.unclaimedBadge.innerHTML = `📜 Nenhuma recompensa pendente &nbsp;|&nbsp; 🪙 Cofre: <b>${records.totalGold.toLocaleString()}</b>`;
      }
    }

    if (this.claimAllBtn) {
      this.claimAllBtn.style.display = unclaimed > 0 ? 'inline-flex' : 'none';
    }
  }

  private renderCards(): void {
    if (!this.listContainer) return;
    this.listContainer.innerHTML = '';

    const meta = MetaManager.getInstance();
    const allIds = Object.keys(ACHIEVEMENTS_CONFIG) as AchievementId[];

    const filtered = allIds.filter((id) => {
      if (this.activeCategory === 'all') return true;
      return ACHIEVEMENTS_CONFIG[id].category === this.activeCategory;
    });

    filtered.forEach((id) => {
      const def: AchievementDefinition = ACHIEVEMENTS_CONFIG[id];
      const state = meta.getAchievementState(id);

      const card = document.createElement('div');
      card.className = `bounty-card ${state.unlocked ? (state.claimed ? 'claimed' : 'ready') : 'locked'}`;

      // Left: Heraldic Icon
      const iconBox = document.createElement('div');
      iconBox.className = 'bounty-card-icon';
      iconBox.textContent = def.icon;
      card.appendChild(iconBox);

      // Center: Title, Description, Progress
      const content = document.createElement('div');
      content.className = 'bounty-card-content';

      const titleRow = document.createElement('div');
      titleRow.className = 'bounty-card-title-row';

      const title = document.createElement('span');
      title.className = 'bounty-card-title';
      title.textContent = def.title;

      const rewardBadge = document.createElement('span');
      rewardBadge.className = 'bounty-card-reward-badge';
      rewardBadge.textContent = `+${def.rewardGold} 🪙`;

      titleRow.appendChild(title);
      titleRow.appendChild(rewardBadge);

      const desc = document.createElement('p');
      desc.className = 'bounty-card-description';
      desc.textContent = def.description;

      // Progress Bar
      const progressContainer = document.createElement('div');
      progressContainer.className = 'bounty-progress-wrapper';

      const progressBar = document.createElement('div');
      progressBar.className = 'bounty-progress-bar';

      const progressFill = document.createElement('div');
      progressFill.className = 'bounty-progress-fill';
      const progressValue = Math.min(state.currentProgress, def.maxProgress);
      const pct = Math.max(0, Math.min(100, (progressValue / def.maxProgress) * 100));
      progressFill.style.width = `${pct}%`;
      progressBar.appendChild(progressFill);

      const progressLabel = document.createElement('span');
      progressLabel.className = 'bounty-progress-label';
      progressLabel.textContent = `${progressValue.toLocaleString()} / ${def.maxProgress.toLocaleString()}`;

      progressContainer.appendChild(progressBar);
      progressContainer.appendChild(progressLabel);

      content.appendChild(titleRow);
      content.appendChild(desc);
      content.appendChild(progressContainer);
      card.appendChild(content);

      // Right: Action / Status button
      const actionBox = document.createElement('div');
      actionBox.className = 'bounty-card-action';

      if (state.claimed) {
        const claimedStamp = document.createElement('div');
        claimedStamp.className = 'bounty-wax-seal';
        claimedStamp.innerHTML = `<span>COLETADO</span>`;
        actionBox.appendChild(claimedStamp);
      } else if (state.unlocked) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'bounty-claim-btn';
        claimBtn.innerHTML = `<span>REIVINDICAR</span><b>+${def.rewardGold} 🪙</b>`;
        claimBtn.onclick = () => {
          const gold = meta.claimAchievement(id);
          if (gold > 0) {
            this.soundManager.playCoinReward();
            this.renderCards();
            this.updateTopBar();
          }
        };
        actionBox.appendChild(claimBtn);
      } else {
        const lockedTag = document.createElement('div');
        lockedTag.className = 'bounty-locked-tag';
        lockedTag.textContent = '🔒 EM PROGRESSO';
        actionBox.appendChild(lockedTag);
      }

      card.appendChild(actionBox);
      this.listContainer!.appendChild(card);
    });
  }

  public unmount(): void {
    this.soundManager.dispose();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.listContainer = null;
    this.claimAllBtn = null;
    this.unclaimedBadge = null;
  }
}
