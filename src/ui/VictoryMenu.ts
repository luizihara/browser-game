import type { WeaponId } from '../config/weaponConfig';
import { WEAPON_CONFIG } from '../config/weaponConfig';
import '../styles/menu.css';

export interface WeaponDamageStat {
  weaponId: WeaponId;
  damage: number;
}

export interface VictoryStats {
  runTime: string;
  killCount: number;
  totalDamage: number;
  levelReached: number;
  goldEarned: number;
  weaponStats: WeaponDamageStat[];
  isNewRecord: boolean;
}

export class VictoryMenu {
  private element: HTMLDivElement | null = null;
  private onRestartCallback: () => void;
  private onMainMenuCallback: () => void;
  private onContinueEndlessCallback?: () => void;

  constructor(
    onRestart: () => void,
    onMainMenu: () => void,
    onContinueEndless?: () => void
  ) {
    this.onRestartCallback = onRestart;
    this.onMainMenuCallback = onMainMenu;
    this.onContinueEndlessCallback = onContinueEndless;
  }

  public mount(parent: HTMLElement, stats: VictoryStats): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen victory-screen';

    const panel = document.createElement('div');
    panel.className = 'victory-panel';

    const title = document.createElement('h1');
    title.className = 'victory-title';
    title.textContent = 'STAGE CLEAR!';

    const subtitle = document.createElement('p');
    subtitle.className = 'victory-subtitle';
    subtitle.textContent = 'YOU SURVIVED THE INVASION & VANQUISHED THE HORDE!';

    // Main Run Stats Grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'victory-stats-grid';

    const createStatBox = (label: string, value: string, highlight?: boolean) => {
      const box = document.createElement('div');
      box.className = `victory-stat-box ${highlight ? 'highlight' : ''}`;
      const lbl = document.createElement('span');
      lbl.className = 'victory-stat-label';
      lbl.textContent = label;
      const val = document.createElement('span');
      val.className = 'victory-stat-val';
      val.textContent = value;
      box.appendChild(lbl);
      box.appendChild(val);
      return box;
    };

    statsGrid.appendChild(createStatBox('TIME SURVIVED', stats.runTime));
    statsGrid.appendChild(createStatBox('ENEMIES SLAIN', `${stats.killCount}`));
    statsGrid.appendChild(createStatBox('LEVEL REACHED', `LVL ${stats.levelReached}`));
    statsGrid.appendChild(createStatBox('TOTAL DAMAGE', stats.totalDamage.toLocaleString()));
    statsGrid.appendChild(createStatBox('GOLD EARNED', `+${stats.goldEarned} 🪙`, true));

    // Weapon Breakdown Table
    const weaponSection = document.createElement('div');
    weaponSection.className = 'victory-weapons-section';

    const weaponHeader = document.createElement('h3');
    weaponHeader.className = 'victory-section-title';
    weaponHeader.textContent = 'WEAPON DAMAGE BREAKDOWN';
    weaponSection.appendChild(weaponHeader);

    const weaponList = document.createElement('div');
    weaponList.className = 'victory-weapon-list';

    const totalDmg = Math.max(1, stats.totalDamage);
    stats.weaponStats.forEach((w) => {
      const wCfg = WEAPON_CONFIG[w.weaponId];
      const pct = Math.round((w.damage / totalDmg) * 100);

      const row = document.createElement('div');
      row.className = 'victory-weapon-row';

      const iconName = document.createElement('span');
      iconName.className = 'victory-weapon-name';
      iconName.textContent = `${wCfg.icon} ${wCfg.name}`;

      const dmgVal = document.createElement('span');
      dmgVal.className = 'victory-weapon-val';
      dmgVal.textContent = `${w.damage.toLocaleString()} (${pct}%)`;

      row.appendChild(iconName);
      row.appendChild(dmgVal);
      weaponList.appendChild(row);
    });
    weaponSection.appendChild(weaponList);

    // Button Row
    const btnRow = document.createElement('div');
    btnRow.className = 'victory-btn-row';

    if (this.onContinueEndlessCallback) {
      const endlessBtn = document.createElement('button');
      endlessBtn.className = 'menu-button';
      endlessBtn.style.background = 'linear-gradient(180deg, #c2410c 0%, #7c2d12 100%)';
      endlessBtn.style.color = '#fef08a';
      endlessBtn.textContent = '🔥 CONTINUAR (ENDLESS)';
      endlessBtn.onclick = () => {
        this.unmount();
        if (this.onContinueEndlessCallback) {
          this.onContinueEndlessCallback();
        }
      };
      btnRow.appendChild(endlessBtn);
    }

    const restartBtn = document.createElement('button');
    restartBtn.className = 'menu-button';
    restartBtn.textContent = 'PLAY AGAIN';
    restartBtn.onclick = () => this.onRestartCallback();

    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.className = 'menu-button secondary';
    mainMenuBtn.textContent = 'MAIN MENU';
    mainMenuBtn.onclick = () => this.onMainMenuCallback();

    btnRow.appendChild(restartBtn);
    btnRow.appendChild(mainMenuBtn);

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(statsGrid);
    panel.appendChild(weaponSection);
    panel.appendChild(btnRow);

    this.element.appendChild(panel);
    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
