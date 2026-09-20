import { STAGE_CONFIG, type StageId } from '../config/stageConfig';
import { MetaManager } from '../config/metaConfig';
import { formatTime } from '../utils/math';
import '../styles/menu.css';

export class StageSelectMenu {
  private element: HTMLDivElement | null = null;
  private onStartRunCallback: (stageId: StageId) => void;
  private onBackCallback: () => void;
  private gridContainer: HTMLDivElement | null = null;

  constructor(onStartRun: (stageId: StageId) => void, onBack: () => void) {
    this.onStartRunCallback = onStartRun;
    this.onBackCallback = onBack;
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const panel = document.createElement('div');
    panel.className = 'char-select-panel'; // Reusing panel container

    // Header
    const header = document.createElement('div');
    header.className = 'char-select-header';

    const title = document.createElement('h2');
    title.className = 'char-select-title';
    title.textContent = 'SELECT STAGE & BIOME';

    const subtitle = document.createElement('div');
    subtitle.className = 'stage-select-subtitle';
    subtitle.textContent = 'Cada bioma possui perigos atmosféricos e multiplicadores de recompensa únicos';

    header.appendChild(title);
    header.appendChild(subtitle);
    panel.appendChild(header);

    // Grid Container
    this.gridContainer = document.createElement('div');
    this.gridContainer.className = 'stage-grid';
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
    startBtn.textContent = 'LAUNCH RUN ⚔️';
    startBtn.onclick = () => {
      const selected = MetaManager.getInstance().getSelectedStage();
      this.onStartRunCallback(selected);
    };

    footer.appendChild(backBtn);
    footer.appendChild(startBtn);
    panel.appendChild(footer);

    this.element.appendChild(panel);
    parent.appendChild(this.element);
  }

  private renderCards(): void {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = '';

    const meta = MetaManager.getInstance();
    const selectedStage = meta.getSelectedStage();

    for (const stage of Object.values(STAGE_CONFIG)) {
      const isUnlocked = meta.isStageUnlocked(stage.id);
      const isSelected = selectedStage === stage.id;
      const record = meta.getStageRecord(stage.id);

      const card = document.createElement('div');
      card.className = `stage-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      // Icon & Badge
      const headerRow = document.createElement('div');
      headerRow.className = 'stage-card-header';

      const iconEl = document.createElement('div');
      iconEl.className = 'stage-avatar';
      iconEl.textContent = stage.icon;

      const badgeEl = document.createElement('div');
      badgeEl.className = 'stage-badge';
      badgeEl.textContent = stage.badge;

      headerRow.appendChild(iconEl);
      headerRow.appendChild(badgeEl);
      card.appendChild(headerRow);

      // Name & Subtitle
      const nameEl = document.createElement('div');
      nameEl.className = 'stage-name';
      nameEl.textContent = stage.name;
      card.appendChild(nameEl);

      const subEl = document.createElement('div');
      subEl.className = 'stage-subtitle';
      subEl.textContent = stage.subtitle;
      card.appendChild(subEl);

      // Description
      const descEl = document.createElement('div');
      descEl.className = 'stage-desc';
      descEl.textContent = stage.description;
      card.appendChild(descEl);

      // Modifiers list
      const modContainer = document.createElement('div');
      modContainer.className = 'stage-modifiers';

      if (stage.modifiers.goldMult > 1.0) {
        const m = document.createElement('span');
        m.className = 'stage-mod-tag gold';
        m.textContent = `+${Math.round((stage.modifiers.goldMult - 1.0) * 100)}% OURO`;
        modContainer.appendChild(m);
      }
      if (stage.modifiers.xpMult > 1.0) {
        const m = document.createElement('span');
        m.className = 'stage-mod-tag xp';
        m.textContent = `+${Math.round((stage.modifiers.xpMult - 1.0) * 100)}% XP`;
        modContainer.appendChild(m);
      }
      if (stage.modifiers.enemySpeedMult > 1.0) {
        const m = document.createElement('span');
        m.className = 'stage-mod-tag danger';
        m.textContent = `+${Math.round((stage.modifiers.enemySpeedMult - 1.0) * 100)}% VELOCIDADE`;
        modContainer.appendChild(m);
      }
      if (stage.modifiers.enemyHpMult > 1.0) {
        const m = document.createElement('span');
        m.className = 'stage-mod-tag danger';
        m.textContent = `+${Math.round((stage.modifiers.enemyHpMult - 1.0) * 100)}% HP INIMIGOS`;
        modContainer.appendChild(m);
      }
      if (modContainer.children.length === 0) {
        const m = document.createElement('span');
        m.className = 'stage-mod-tag neutral';
        m.textContent = 'PADRÃO';
        modContainer.appendChild(m);
      }
      card.appendChild(modContainer);

      // Best Record or Lock Info
      const recordEl = document.createElement('div');
      recordEl.className = 'stage-record';

      if (!isUnlocked) {
        const prevStageName = stage.prevStageId ? STAGE_CONFIG[stage.prevStageId].name : 'anterior';
        recordEl.innerHTML = `🔒 <em>Sobreviva 3 min em ${prevStageName}</em>`;
      } else if (record.bestTime > 0) {
        const clearBadge = record.cleared ? ' 🏆' : '';
        recordEl.textContent = `Recorde: ${formatTime(record.bestTime)} | ${record.maxKills} Kills${clearBadge}`;
      } else {
        recordEl.textContent = 'Ainda não jogado';
      }
      card.appendChild(recordEl);

      // Card Click Handler
      if (isUnlocked) {
        card.onclick = () => {
          meta.setSelectedStage(stage.id);
          this.renderCards();
        };
      }

      this.gridContainer.appendChild(card);
    }
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
      this.element = null;
    }
    this.gridContainer = null;
  }
}
