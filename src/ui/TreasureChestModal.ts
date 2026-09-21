import '../styles/menu.css';

export interface ChestRewards {
  gold: number;
  upgradeName: string;
  upgradeIcon: string;
  relicName?: string;
  relicIcon?: string;
}

export class TreasureChestModal {
  private element: HTMLDivElement | null = null;
  private onClaimCallback: (() => void) | null = null;
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;

  public mount(parent: HTMLElement, rewards: ChestRewards, onClaim: () => void): void {
    if (this.element) return;

    this.onClaimCallback = onClaim;
    this.element = document.createElement('div');
    this.element.className = 'overlay-screen tavern-theme';

    const panel = document.createElement('div');
    panel.className = 'chest-panel';

    const icon = document.createElement('div');
    icon.className = 'chest-icon';
    icon.textContent = '🎁';

    const title = document.createElement('h2');
    title.className = 'chest-title';
    title.textContent = 'TESOURO DESBLOQUEADO!';

    const subtitle = document.createElement('p');
    subtitle.className = 'chest-subtitle';
    subtitle.textContent = 'VOCÊ DERROTOU O TITÃ E RESGATOU OS ESPÓLIOS DA GUILDA!';

    const rewardList = document.createElement('div');
    rewardList.className = 'chest-rewards';

    // Gold reward row
    const goldRow = document.createElement('div');
    goldRow.className = 'chest-reward-item';
    goldRow.innerHTML = `
      <span>🪙 MOEDAS DE OURO:</span>
      <span class="chest-gold">+${rewards.gold} OURO</span>
    `;
    rewardList.appendChild(goldRow);

    // Relic reward row (if discovered)
    if (rewards.relicName && rewards.relicIcon) {
      const relicRow = document.createElement('div');
      relicRow.className = 'chest-reward-item relic';
      relicRow.innerHTML = `
        <span>${rewards.relicIcon} NOVA RELÍQUIA:</span>
        <span class="chest-relic-name">${rewards.relicName}</span>
      `;
      rewardList.appendChild(relicRow);
    }

    // Upgrade reward row
    const upgRow = document.createElement('div');
    upgRow.className = 'chest-reward-item';
    upgRow.innerHTML = `
      <span>${rewards.upgradeIcon} UPGRADE BÔNUS:</span>
      <span class="chest-upgrade-name">${rewards.upgradeName}</span>
    `;
    rewardList.appendChild(upgRow);

    const claimBtn = document.createElement('button');
    claimBtn.className = 'menu-button';
    claimBtn.textContent = 'RESGATAR RECOMPENSAS (ENTER)';
    const handleClaim = () => {
      const cb = this.onClaimCallback;
      this.unmount();
      if (cb) {
        cb();
      }
    };
    claimBtn.onclick = handleClaim;

    panel.appendChild(icon);
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(rewardList);
    panel.appendChild(claimBtn);

    this.element.appendChild(panel);
    parent.appendChild(this.element);

    // Also support Enter / Space keypress for quick claiming
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        handleClaim();
      }
    };
    window.addEventListener('keydown', this.boundKeyHandler);
  }

  public unmount(): void {
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.onClaimCallback = null;
  }
}
