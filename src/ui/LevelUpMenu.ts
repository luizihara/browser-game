import type { UpgradeDefinition, UpgradeId } from '../config/upgradeConfig';
import '../styles/menu.css';

export interface LevelUpMenuActions {
  onSelect: (upgradeId: UpgradeId) => void;
  onReroll?: () => void;
  onSkip?: () => void;
  onBanish?: (upgradeId: UpgradeId) => void;
}

export class LevelUpMenu {
  private element: HTMLDivElement | null = null;
  private actions: LevelUpMenuActions;
  private boundOnKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private currentChoices: UpgradeDefinition[] = [];
  private rerollsLeft: number = 0;
  private skipsLeft: number = 0;
  private banishesLeft: number = 0;
  private containerElement: HTMLDivElement | null = null;
  private actionsBar: HTMLDivElement | null = null;

  constructor(actions: ((upgradeId: UpgradeId) => void) | LevelUpMenuActions) {
    if (typeof actions === 'function') {
      this.actions = { onSelect: actions };
    } else {
      this.actions = actions;
    }
  }

  public mount(
    parent: HTMLElement,
    level: number,
    choices: UpgradeDefinition[],
    rerollsLeft: number = 1,
    skipsLeft: number = 1,
    banishesLeft: number = 1
  ): void {
    if (this.element) return;

    this.currentChoices = choices;
    this.rerollsLeft = rerollsLeft;
    this.skipsLeft = skipsLeft;
    this.banishesLeft = banishesLeft;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen tavern-theme';

    const title = document.createElement('h1');
    title.className = 'levelup-title';
    title.textContent = 'LEVEL UP!';

    const subtitle = document.createElement('p');
    subtitle.className = 'levelup-subtitle';
    subtitle.textContent = `ESCOLHA UM UPGRADE • NÍVEL ${level} (TECLAS 1, 2 OU 3)`;

    this.containerElement = document.createElement('div');
    this.containerElement.className = 'levelup-container';

    this.actionsBar = document.createElement('div');
    this.actionsBar.className = 'levelup-actions-bar';

    this.renderCards();
    this.renderActionsBar();

    this.element.appendChild(title);
    this.element.appendChild(subtitle);
    this.element.appendChild(this.containerElement);
    this.element.appendChild(this.actionsBar);

    parent.appendChild(this.element);

    this.bindKeyboard();
  }

  public refreshChoices(
    choices: UpgradeDefinition[],
    rerollsLeft: number,
    skipsLeft: number,
    banishesLeft: number
  ): void {
    this.currentChoices = choices;
    this.rerollsLeft = rerollsLeft;
    this.skipsLeft = skipsLeft;
    this.banishesLeft = banishesLeft;

    this.renderCards();
    this.renderActionsBar();
    this.bindKeyboard();
  }

  private renderCards(): void {
    if (!this.containerElement) return;
    this.containerElement.innerHTML = '';

    for (let i = 0; i < this.currentChoices.length; i++) {
      const choice = this.currentChoices[i]!;
      const keyIndex = i + 1;

      const card = document.createElement('div');
      card.className =
        choice.category === 'evolution' ? 'upgrade-card evolution' : 'upgrade-card';
      card.onclick = () => this.actions.onSelect(choice.id);

      // Card Header: Key shortcut and category badge
      const headerRow = document.createElement('div');
      headerRow.className = 'upgrade-card-header';

      const badge = document.createElement('span');
      badge.className = `upgrade-badge badge-${choice.category}`;
      badge.textContent = choice.categoryLabel;

      const rightControls = document.createElement('div');
      rightControls.className = 'upgrade-header-controls';

      if (this.banishesLeft > 0 && this.actions.onBanish && choice.category !== 'evolution') {
        const banishBtn = document.createElement('button');
        banishBtn.className = 'upgrade-banish-btn';
        banishBtn.title = 'Banir este upgrade do pool permanente desta run';
        banishBtn.innerHTML = '🚫 BANIR';
        banishBtn.onclick = (e) => {
          e.stopPropagation();
          if (this.actions.onBanish) {
            this.actions.onBanish(choice.id);
          }
        };
        rightControls.appendChild(banishBtn);
      }

      const keyTag = document.createElement('span');
      keyTag.className = 'upgrade-key-shortcut';
      keyTag.textContent = `[ ${keyIndex} ]`;
      rightControls.appendChild(keyTag);

      headerRow.appendChild(badge);
      headerRow.appendChild(rightControls);

      const icon = document.createElement('div');
      icon.className = 'upgrade-icon';
      icon.textContent = choice.icon;

      const cardTitle = document.createElement('div');
      cardTitle.className = 'upgrade-title';
      cardTitle.textContent = choice.name;

      const desc = document.createElement('div');
      desc.className = 'upgrade-description';
      desc.textContent = choice.description;

      card.appendChild(headerRow);
      card.appendChild(icon);
      card.appendChild(cardTitle);
      card.appendChild(desc);

      this.containerElement.appendChild(card);
    }
  }

  private renderActionsBar(): void {
    if (!this.actionsBar) return;
    this.actionsBar.innerHTML = '';

    // 1. Reroll Button
    const rerollBtn = document.createElement('button');
    rerollBtn.className = `levelup-action-btn ${this.rerollsLeft <= 0 ? 'disabled' : ''}`;
    rerollBtn.innerHTML = `🎲 REROLL <b>(${this.rerollsLeft})</b> <span class="action-hotkey">[R]</span>`;
    rerollBtn.disabled = this.rerollsLeft <= 0;
    rerollBtn.onclick = () => {
      if (this.rerollsLeft > 0 && this.actions.onReroll) {
        this.actions.onReroll();
      }
    };
    this.actionsBar.appendChild(rerollBtn);

    // 2. Skip Button
    const skipBtn = document.createElement('button');
    skipBtn.className = `levelup-action-btn ${this.skipsLeft <= 0 ? 'disabled' : ''}`;
    skipBtn.innerHTML = `⏭️ PULAR (+50🪙) <b>(${this.skipsLeft})</b> <span class="action-hotkey">[S]</span>`;
    skipBtn.disabled = this.skipsLeft <= 0;
    skipBtn.onclick = () => {
      if (this.skipsLeft > 0 && this.actions.onSkip) {
        this.actions.onSkip();
      }
    };
    this.actionsBar.appendChild(skipBtn);
  }

  private bindKeyboard(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
    }

    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        if (this.currentChoices[0]) {
          e.preventDefault();
          this.actions.onSelect(this.currentChoices[0].id);
        }
      } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        if (this.currentChoices[1]) {
          e.preventDefault();
          this.actions.onSelect(this.currentChoices[1].id);
        }
      } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        if (this.currentChoices[2]) {
          e.preventDefault();
          this.actions.onSelect(this.currentChoices[2].id);
        }
      } else if ((e.key === 'r' || e.key === 'R') && this.rerollsLeft > 0 && this.actions.onReroll) {
        e.preventDefault();
        this.actions.onReroll();
      } else if ((e.key === 's' || e.key === 'S') && this.skipsLeft > 0 && this.actions.onSkip) {
        e.preventDefault();
        this.actions.onSkip();
      }
    };

    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  public unmount(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
      this.boundOnKeyDown = null;
    }
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.containerElement = null;
    this.actionsBar = null;
  }
}
