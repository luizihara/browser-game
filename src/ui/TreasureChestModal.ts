import '../styles/menu.css';

export interface ChestRewards {
  gold: number;
  upgradeName: string;
  upgradeIcon: string;
}

export class TreasureChestModal {
  private element: HTMLDivElement | null = null;
  private onClaimCallback: (() => void) | null = null;

  public mount(parent: HTMLElement, rewards: ChestRewards, onClaim: () => void): void {
    if (this.element) return;

    this.onClaimCallback = onClaim;
    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const panel = document.createElement('div');
    panel.className = 'chest-panel';

    const icon = document.createElement('div');
    icon.className = 'chest-icon';
    icon.textContent = '🎁';

    const title = document.createElement('h2');
    title.className = 'chest-title';
    title.textContent = 'TREASURE UNLOCKED!';

    const subtitle = document.createElement('p');
    subtitle.className = 'chest-subtitle';
    subtitle.textContent = 'YOU VANQUISHED THE TITAN AND CLAIMED THEIR SPOILS!';

    const rewardList = document.createElement('div');
    rewardList.className = 'chest-rewards';

    // Gold reward row
    const goldRow = document.createElement('div');
    goldRow.className = 'chest-reward-item';
    goldRow.innerHTML = `
      <span>🪙 GOLD COINS:</span>
      <span class="chest-gold">+${rewards.gold} GOLD</span>
    `;
    rewardList.appendChild(goldRow);

    // Upgrade reward row
    const upgRow = document.createElement('div');
    upgRow.className = 'chest-reward-item';
    upgRow.innerHTML = `
      <span>${rewards.upgradeIcon} BONUS UPGRADE:</span>
      <span class="chest-upgrade-name">${rewards.upgradeName}</span>
    `;
    rewardList.appendChild(upgRow);

    const claimBtn = document.createElement('button');
    claimBtn.className = 'menu-button';
    claimBtn.textContent = 'CLAIM SPOILS';
    claimBtn.onclick = () => {
      this.unmount();
      if (this.onClaimCallback) {
        this.onClaimCallback();
      }
    };

    panel.appendChild(icon);
    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(rewardList);
    panel.appendChild(claimBtn);

    this.element.appendChild(panel);
    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.onClaimCallback = null;
  }
}
