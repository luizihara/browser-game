import { SettingsMenu } from './SettingsMenu';
import '../styles/menu.css';

export class PauseMenu {
  private element: HTMLDivElement | null = null;
  private onResumeCallback: () => void;
  private onMainMenuCallback: () => void;
  private settingsMenu: SettingsMenu;

  constructor(onResume: () => void, onMainMenu: () => void) {
    this.onResumeCallback = onResume;
    this.onMainMenuCallback = onMainMenu;
    this.settingsMenu = new SettingsMenu(() => {
      this.settingsMenu.unmount();
      if (this.element) {
        this.element.style.display = 'flex';
      }
    });
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

    const optionsBtn = document.createElement('button');
    optionsBtn.className = 'menu-button secondary';
    optionsBtn.textContent = 'OPTIONS';
    optionsBtn.onclick = () => {
      if (this.element) {
        this.element.style.display = 'none';
      }
      this.settingsMenu.mount(parent);
    };

    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.className = 'menu-button secondary';
    mainMenuBtn.textContent = 'MAIN MENU';
    mainMenuBtn.onclick = () => this.onMainMenuCallback();

    this.element.appendChild(title);
    this.element.appendChild(resumeBtn);
    this.element.appendChild(optionsBtn);
    this.element.appendChild(mainMenuBtn);

    parent.appendChild(this.element);
  }

  public unmount(): void {
    this.settingsMenu.unmount();
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
