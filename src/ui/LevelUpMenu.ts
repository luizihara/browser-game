import type { UpgradeDefinition, UpgradeId } from '../config/upgradeConfig';
import '../styles/menu.css';

export class LevelUpMenu {
  private element: HTMLDivElement | null = null;
  private onSelectCallback: (upgradeId: UpgradeId) => void;

  constructor(onSelect: (upgradeId: UpgradeId) => void) {
    this.onSelectCallback = onSelect;
  }

  public mount(
    parent: HTMLElement,
    level: number,
    choices: UpgradeDefinition[]
  ): void {
    if (this.element) return;

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen';

    const title = document.createElement('h1');
    title.className = 'levelup-title';
    title.textContent = 'LEVEL UP!';

    const subtitle = document.createElement('p');
    subtitle.className = 'levelup-subtitle';
    subtitle.textContent = `CHOOSE AN UPGRADE • LEVEL ${level}`;

    const container = document.createElement('div');
    container.className = 'levelup-container';

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i];

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.onclick = () => this.onSelectCallback(choice.id);

      const icon = document.createElement('div');
      icon.className = 'upgrade-icon';
      icon.textContent = choice.icon;

      const cardTitle = document.createElement('div');
      cardTitle.className = 'upgrade-title';
      cardTitle.textContent = choice.name;

      const desc = document.createElement('div');
      desc.className = 'upgrade-description';
      desc.textContent = choice.description;

      card.appendChild(icon);
      card.appendChild(cardTitle);
      card.appendChild(desc);

      container.appendChild(card);
    }

    this.element.appendChild(title);
    this.element.appendChild(subtitle);
    this.element.appendChild(container);

    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
