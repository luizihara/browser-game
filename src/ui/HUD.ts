import '../styles/hud.css';
import { IS_DEV } from '../utils/debug';

export class HUD {
  private element: HTMLDivElement | null = null;
  private xpBarContainer: HTMLDivElement | null = null;
  private xpFill: HTMLDivElement | null = null;
  private hpLabel: HTMLSpanElement | null = null;
  private hpFill: HTMLDivElement | null = null;
  private levelBadge: HTMLSpanElement | null = null;
  private killsText: HTMLSpanElement | null = null;
  private timerText: HTMLSpanElement | null = null;
  private debugFpsValue: HTMLSpanElement | null = null;
  private debugEntityValue: HTMLSpanElement | null = null;
  private debugPosValue: HTMLSpanElement | null = null;

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    // 1. Horizontal XP Bar across top of viewport
    this.xpBarContainer = document.createElement('div');
    this.xpBarContainer.className = 'hud-xp-bar-container';

    this.xpFill = document.createElement('div');
    this.xpFill.className = 'hud-xp-bar-fill';
    this.xpBarContainer.appendChild(this.xpFill);
    parent.appendChild(this.xpBarContainer);

    // 2. HUD Main Container
    this.element = document.createElement('div');
    this.element.className = 'hud-container';

    const topBar = document.createElement('div');
    topBar.className = 'hud-top-bar';

    // HP Block
    const hpContainer = document.createElement('div');
    hpContainer.className = 'hud-hp-container';

    this.hpLabel = document.createElement('span');
    this.hpLabel.className = 'hud-hp-label';
    this.hpLabel.textContent = 'HP: 100 / 100';

    const hpBar = document.createElement('div');
    hpBar.className = 'hud-hp-bar';

    this.hpFill = document.createElement('div');
    this.hpFill.className = 'hud-hp-fill';
    hpBar.appendChild(this.hpFill);

    hpContainer.appendChild(this.hpLabel);
    hpContainer.appendChild(hpBar);

    // Center Stats Group (Level + Kills + Timer)
    const statsGroup = document.createElement('div');
    statsGroup.className = 'hud-stats-group';

    this.levelBadge = document.createElement('span');
    this.levelBadge.className = 'hud-level-badge';
    this.levelBadge.textContent = 'LVL 1';

    const killsContainer = document.createElement('div');
    killsContainer.className = 'hud-kills-container';
    this.killsText = document.createElement('span');
    this.killsText.className = 'hud-kills-text';
    this.killsText.textContent = 'KILLS: 0';
    killsContainer.appendChild(this.killsText);

    const timerContainer = document.createElement('div');
    timerContainer.className = 'hud-timer-container';
    this.timerText = document.createElement('span');
    this.timerText.className = 'hud-timer-text';
    this.timerText.textContent = '00:00';
    timerContainer.appendChild(this.timerText);

    statsGroup.appendChild(this.levelBadge);
    statsGroup.appendChild(killsContainer);
    statsGroup.appendChild(timerContainer);

    topBar.appendChild(hpContainer);
    topBar.appendChild(statsGroup);

    // Dev Debug Block
    if (IS_DEV) {
      const debugContainer = document.createElement('div');
      debugContainer.className = 'hud-debug-container';

      const fpsItem = document.createElement('div');
      fpsItem.className = 'hud-debug-item';
      fpsItem.textContent = 'FPS: ';
      this.debugFpsValue = document.createElement('span');
      this.debugFpsValue.className = 'hud-debug-value';
      this.debugFpsValue.textContent = '60';
      fpsItem.appendChild(this.debugFpsValue);

      const entityItem = document.createElement('div');
      entityItem.className = 'hud-debug-item';
      entityItem.textContent = 'ENTITIES: ';
      this.debugEntityValue = document.createElement('span');
      this.debugEntityValue.className = 'hud-debug-value';
      this.debugEntityValue.textContent = '1';
      entityItem.appendChild(this.debugEntityValue);

      const posItem = document.createElement('div');
      posItem.className = 'hud-debug-item';
      posItem.textContent = 'POS: ';
      this.debugPosValue = document.createElement('span');
      this.debugPosValue.className = 'hud-debug-value';
      this.debugPosValue.textContent = '(0.0, 0.0, 0.0)';
      posItem.appendChild(this.debugPosValue);

      debugContainer.appendChild(fpsItem);
      debugContainer.appendChild(entityItem);
      debugContainer.appendChild(posItem);
      topBar.appendChild(debugContainer);
    }

    this.element.appendChild(topBar);
    parent.appendChild(this.element);
  }

  public updateHp(current: number, max: number): void {
    if (this.hpLabel) {
      this.hpLabel.textContent = `HP: ${Math.round(current)} / ${max}`;
    }
    if (this.hpFill) {
      const pct = Math.max(0, Math.min((current / max) * 100, 100));
      this.hpFill.style.width = `${pct}%`;
    }
  }

  public updateXp(ratio: number, level: number): void {
    if (this.xpFill) {
      this.xpFill.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    }
    if (this.levelBadge) {
      this.levelBadge.textContent = `LVL ${level}`;
    }
  }

  public updateKills(count: number): void {
    if (this.killsText) {
      this.killsText.textContent = `KILLS: ${count}`;
    }
  }

  public updateTime(formattedTime: string): void {
    if (this.timerText) {
      this.timerText.textContent = formattedTime;
    }
  }

  public updateDebug(fps: number, x: number, y: number, z: number, entityCount?: number): void {
    if (!IS_DEV) return;
    if (this.debugFpsValue) {
      this.debugFpsValue.textContent = `${fps}`;
    }
    if (this.debugEntityValue && entityCount !== undefined) {
      this.debugEntityValue.textContent = `${entityCount}`;
    }
    if (this.debugPosValue) {
      this.debugPosValue.textContent = `(${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)})`;
    }
  }

  public getRootElement(): HTMLDivElement | null {
    return this.element;
  }

  public unmount(): void {
    if (this.xpBarContainer && this.xpBarContainer.parentElement) {
      this.xpBarContainer.parentElement.removeChild(this.xpBarContainer);
    }
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.xpBarContainer = null;
    this.xpFill = null;
    this.element = null;
    this.hpLabel = null;
    this.hpFill = null;
    this.levelBadge = null;
    this.killsText = null;
    this.timerText = null;
    this.debugFpsValue = null;
    this.debugEntityValue = null;
    this.debugPosValue = null;
  }
}
