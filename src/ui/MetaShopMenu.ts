import { MetaManager } from '../config/metaConfig';
import {
  META_UPGRADES,
  getUpgradeCost,
} from '../config/metaUpgradeConfig';
import '../styles/menu.css';

export class MetaShopMenu {
  private element: HTMLDivElement | null = null;
  private onCloseCallback: () => void;
  private goldBadge: HTMLDivElement | null = null;
  private gridContainer: HTMLDivElement | null = null;

  constructor(onClose: () => void) {
    this.onCloseCallback = onClose;
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const panel = document.createElement('div');
    panel.className = 'shop-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'shop-header';

    const title = document.createElement('h2');
    title.className = 'shop-title';
    title.textContent = 'POWER-UPS';

    this.goldBadge = document.createElement('div');
    this.goldBadge.className = 'shop-gold-badge';
    this.updateGoldDisplay();

    header.appendChild(title);
    header.appendChild(this.goldBadge);
    panel.appendChild(header);

    // Grid of Upgrades
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'shop-grid';
    this.renderUpgradeCards();
    panel.appendChild(this.gridContainer);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'shop-footer-row';

    const refundBtn = document.createElement('button');
    refundBtn.className = 'menu-button secondary';
    refundBtn.textContent = 'REFUND ALL';
    refundBtn.onclick = () => {
      const refunded = MetaManager.getInstance().refundUpgrades();
      if (refunded > 0) {
        this.renderUpgradeCards();
        this.updateGoldDisplay();
      }
    };

    const backBtn = document.createElement('button');
    backBtn.className = 'menu-button';
    backBtn.textContent = 'BACK';
    backBtn.onclick = () => this.onCloseCallback();

    footer.appendChild(refundBtn);
    footer.appendChild(backBtn);
    panel.appendChild(footer);

    this.element.appendChild(panel);
    parent.appendChild(this.element);
  }

  private updateGoldDisplay(): void {
    if (this.goldBadge) {
      const gold = MetaManager.getInstance().getGold();
      this.goldBadge.textContent = `🪙 ${gold.toLocaleString()} GOLD`;
    }
  }

  private renderUpgradeCards(): void {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    const meta = MetaManager.getInstance();
    const currentGold = meta.getGold();

    for (const def of Object.values(META_UPGRADES)) {
      const card = document.createElement('div');
      card.className = 'shop-card';

      const currentRank = meta.getUpgradeRank(def.id);
      const isMaxed = currentRank >= def.maxRank;
      const cost = getUpgradeCost(def, currentRank);
      const canAfford = currentGold >= cost;

      // Card Top
      const topRow = document.createElement('div');
      topRow.className = 'shop-card-top';

      const nameEl = document.createElement('span');
      nameEl.className = 'shop-card-name';
      nameEl.textContent = `${def.icon} ${def.name}`;

      const rankText = document.createElement('span');
      rankText.className = 'shop-stat-val';
      rankText.textContent = `RANK ${currentRank}/${def.maxRank}`;

      topRow.appendChild(nameEl);
      topRow.appendChild(rankText);
      card.appendChild(topRow);

      // Description
      const descEl = document.createElement('p');
      descEl.className = 'shop-card-desc';
      descEl.textContent = def.description;
      card.appendChild(descEl);

      // Pips
      const pipsRow = document.createElement('div');
      pipsRow.className = 'shop-pips-row';
      for (let i = 0; i < def.maxRank; i++) {
        const pip = document.createElement('div');
        pip.className = `shop-pip ${i < currentRank ? 'filled' : ''}`;
        pipsRow.appendChild(pip);
      }
      card.appendChild(pipsRow);

      // Bottom Row
      const bottomRow = document.createElement('div');
      bottomRow.className = 'shop-card-bottom';

      const statVal = document.createElement('span');
      statVal.className = 'shop-stat-val';
      statVal.textContent = currentRank > 0 ? def.formatValue(currentRank) : 'No Bonus';

      const buyBtn = document.createElement('button');
      buyBtn.className = 'shop-buy-btn';
      if (isMaxed) {
        buyBtn.textContent = 'MAXED';
        buyBtn.disabled = true;
        buyBtn.classList.add('maxed');
      } else {
        buyBtn.textContent = `BUY 🪙 ${cost}`;
        buyBtn.disabled = !canAfford;
        buyBtn.onclick = () => {
          if (meta.buyUpgrade(def.id)) {
            this.renderUpgradeCards();
            this.updateGoldDisplay();
          }
        };
      }

      bottomRow.appendChild(statVal);
      bottomRow.appendChild(buyBtn);
      card.appendChild(bottomRow);

      this.gridContainer.appendChild(card);
    }
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.goldBadge = null;
    this.gridContainer = null;
  }
}
