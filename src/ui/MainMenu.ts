import { GAME_CONFIG } from '../config/gameConfig';
import '../styles/menu.css';

export class MainMenu {
  private element: HTMLDivElement | null = null;
  private onStartCallback: () => void;

  constructor(onStart: () => void) {
    this.onStartCallback = onStart;
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = GAME_CONFIG.title;

    const startBtn = document.createElement('button');
    startBtn.className = 'menu-button';
    startBtn.textContent = 'START GAME';
    startBtn.onclick = () => this.onStartCallback();

    this.element.appendChild(title);
    this.element.appendChild(startBtn);

    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
