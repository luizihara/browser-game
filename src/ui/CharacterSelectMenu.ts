import { CHARACTER_CONFIG } from '../config/characterConfig';
import { WEAPON_CONFIG } from '../config/weaponConfig';
import { MetaManager } from '../config/metaConfig';
import '../styles/menu.css';

export class CharacterSelectMenu {
  private element: HTMLDivElement | null = null;
  private onStartRunCallback: () => void;
  private onBackCallback: () => void;
  private gridContainer: HTMLDivElement | null = null;
  private goldBadge: HTMLDivElement | null = null;

  constructor(onStartRun: () => void, onBack: () => void) {
    this.onStartRunCallback = onStartRun;
    this.onBackCallback = onBack;
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const panel = document.createElement('div');
    panel.className = 'char-select-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'char-select-header';

    const title = document.createElement('h2');
    title.className = 'char-select-title';
    title.textContent = 'CHOOSE YOUR HERO';

    this.goldBadge = document.createElement('div');
    this.goldBadge.className = 'shop-gold-badge';
    this.updateGoldDisplay();

    header.appendChild(title);
    header.appendChild(this.goldBadge);
    panel.appendChild(header);

    // Hero Cards Grid
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'char-grid';
    this.renderCards();
    panel.appendChild(this.gridContainer);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'char-footer';

    const backBtn = document.createElement('button');
    backBtn.className = 'menu-button secondary';
    backBtn.textContent = 'BACK';
    backBtn.onclick = () => this.onBackCallback();

    const startBtn = document.createElement('button');
    startBtn.className = 'menu-button';
    startBtn.textContent = 'START RUN ⚔️';
    startBtn.onclick = () => this.onStartRunCallback();

    footer.appendChild(backBtn);
    footer.appendChild(startBtn);
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

  private renderCards(): void {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    const meta = MetaManager.getInstance();
    const selectedChar = meta.getSelectedCharacter();
    const currentGold = meta.getGold();

    for (const charDef of Object.values(CHARACTER_CONFIG)) {
      const isUnlocked = meta.isCharacterUnlocked(charDef.id);
      const isSelected = selectedChar === charDef.id;

      const card = document.createElement('div');
      card.className = `char-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      // Card Avatar
      const avatarEl = document.createElement('div');
      avatarEl.className = 'char-avatar';
      avatarEl.textContent = charDef.avatar;
      card.appendChild(avatarEl);

      // Name & Title
      const nameEl = document.createElement('div');
      nameEl.className = 'char-name';
      nameEl.textContent = charDef.name;
      card.appendChild(nameEl);

      const titleEl = document.createElement('div');
      titleEl.className = 'char-title';
      titleEl.textContent = charDef.title;
      card.appendChild(titleEl);

      // Starting Weapon Badge
      const wCfg = WEAPON_CONFIG[charDef.startingWeapon];
      const weaponBadge = document.createElement('div');
      weaponBadge.className = 'char-weapon-badge';
      weaponBadge.textContent = `${wCfg.icon} ${wCfg.name}`;
      card.appendChild(weaponBadge);

      // Passive Box
      const passiveBox = document.createElement('div');
      passiveBox.className = 'char-passive-box';

      const passiveName = document.createElement('div');
      passiveName.className = 'char-passive-name';
      passiveName.textContent = charDef.passiveName;

      const passiveDesc = document.createElement('p');
      passiveDesc.className = 'char-passive-desc';
      passiveDesc.textContent = charDef.passiveDesc;

      passiveBox.appendChild(passiveName);
      passiveBox.appendChild(passiveDesc);
      card.appendChild(passiveBox);

      // Action Button
      const btn = document.createElement('button');
      btn.className = 'char-card-btn';

      if (isSelected) {
        btn.textContent = 'SELECTED';
        btn.classList.add('selected');
      } else if (isUnlocked) {
        btn.textContent = 'SELECT';
        btn.classList.add('unlocked');
        btn.onclick = (e) => {
          e.stopPropagation();
          meta.setSelectedCharacter(charDef.id);
          this.renderCards();
        };
      } else {
        const cost = charDef.unlockCondition.cost ?? 0;
        const canAfford = currentGold >= cost;
        btn.textContent = `UNLOCK 🪙 ${cost}`;
        btn.classList.add('buy');
        btn.disabled = !canAfford;
        btn.onclick = (e) => {
          e.stopPropagation();
          if (meta.unlockCharacter(charDef.id)) {
            this.renderCards();
            this.updateGoldDisplay();
          }
        };
      }

      card.onclick = () => {
        if (isUnlocked && !isSelected) {
          meta.setSelectedCharacter(charDef.id);
          this.renderCards();
        }
      };

      card.appendChild(btn);
      this.gridContainer.appendChild(card);
    }
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.gridContainer = null;
    this.goldBadge = null;
  }
}
