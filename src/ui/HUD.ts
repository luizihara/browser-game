import '../styles/hud.css';

export class HUD {
  private element: HTMLDivElement | null = null;
  private hpLabel: HTMLSpanElement | null = null;
  private hpFill: HTMLDivElement | null = null;
  private timerText: HTMLSpanElement | null = null;

  public mount(parent: HTMLElement): void {
    if (this.element) return;

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

    // Timer Block
    const timerContainer = document.createElement('div');
    timerContainer.className = 'hud-timer-container';

    this.timerText = document.createElement('span');
    this.timerText.className = 'hud-timer-text';
    this.timerText.textContent = '00:00';
    timerContainer.appendChild(this.timerText);

    topBar.appendChild(hpContainer);
    topBar.appendChild(timerContainer);

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

  public updateTime(formattedTime: string): void {
    if (this.timerText) {
      this.timerText.textContent = formattedTime;
    }
  }

  public getRootElement(): HTMLDivElement | null {
    return this.element;
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.hpLabel = null;
    this.hpFill = null;
    this.timerText = null;
  }
}
