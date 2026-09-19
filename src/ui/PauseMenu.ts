import '../styles/menu.css';

export class PauseMenu {
  private element: HTMLDivElement | null = null;
  private onResumeCallback: () => void;
  private onMainMenuCallback: () => void;

  constructor(onResume: () => void, onMainMenu: () => void) {
    this.onResumeCallback = onResume;
    this.onMainMenuCallback = onMainMenu;
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'PAUSED';

    const resumeBtn = document.createElement('button');
    resumeBtn.className = 'menu-button';
    resumeBtn.textContent = 'RESUME';
    resumeBtn.onclick = () => this.onResumeCallback();

    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.className = 'menu-button secondary';
    mainMenuBtn.textContent = 'MAIN MENU';
    mainMenuBtn.onclick = () => this.onMainMenuCallback();

    this.element.appendChild(title);
    this.element.appendChild(resumeBtn);
    this.element.appendChild(mainMenuBtn);

    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
