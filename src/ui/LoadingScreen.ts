import '../styles/menu.css';

export class LoadingScreen {
  private element: HTMLDivElement | null = null;
  private progressFill: HTMLDivElement | null = null;
  private statusText: HTMLParagraphElement | null = null;

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'SURVIVOR 3D';

    this.statusText = document.createElement('p');
    this.statusText.className = 'loading-text';
    this.statusText.textContent = 'Loading...';

    const barContainer = document.createElement('div');
    barContainer.className = 'progress-bar-container';

    this.progressFill = document.createElement('div');
    this.progressFill.className = 'progress-bar-fill';
    barContainer.appendChild(this.progressFill);

    this.element.appendChild(title);
    this.element.appendChild(this.statusText);
    this.element.appendChild(barContainer);

    parent.appendChild(this.element);
  }

  public setProgress(progress: number, message?: string): void {
    const pct = Math.min(Math.max(progress * 100, 0), 100);
    if (this.progressFill) {
      this.progressFill.style.width = `${pct}%`;
    }
    if (this.statusText && message) {
      this.statusText.textContent = message;
    }
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.progressFill = null;
    this.statusText = null;
  }
}
