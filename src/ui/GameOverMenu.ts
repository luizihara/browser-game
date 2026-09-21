import '../styles/menu.css';

export class GameOverMenu {
  private element: HTMLDivElement | null = null;
  private statText: HTMLParagraphElement | null = null;
  private onRestartCallback: () => void;
  private onMainMenuCallback: () => void;

  constructor(onRestart: () => void, onMainMenu: () => void) {
    this.onRestartCallback = onRestart;
    this.onMainMenuCallback = onMainMenu;
  }

  public mount(
    parent: HTMLElement,
    survivedTime: string,
    isEndless: boolean = false,
    tormentRank: number = 0
  ): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'game-over-title';
    title.textContent = isEndless ? 'FALLEN IN ENDLESS COMBAT' : 'GAME OVER';

    this.statText = document.createElement('p');
    this.statText.className = 'survival-stat';
    const tag = isEndless
      ? tormentRank > 0
        ? ` (ENDLESS • TORMENTO ${tormentRank})`
        : ' (MODO SEM FIM)'
      : tormentRank > 0
        ? ` (TORMENTO ${tormentRank})`
        : '';
    this.statText.textContent = `SOBREVIVEU: ${survivedTime}${tag}`;

    const restartBtn = document.createElement('button');
    restartBtn.className = 'menu-button';
    restartBtn.textContent = 'TRY AGAIN';
    restartBtn.onclick = () => this.onRestartCallback();

    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.className = 'menu-button secondary';
    mainMenuBtn.textContent = 'MAIN MENU';
    mainMenuBtn.onclick = () => this.onMainMenuCallback();

    this.element.appendChild(title);
    this.element.appendChild(this.statText);
    this.element.appendChild(restartBtn);
    this.element.appendChild(mainMenuBtn);

    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
    this.statText = null;
  }
}
