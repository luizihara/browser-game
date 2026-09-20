import type { UpgradeDefinition, UpgradeId } from '../config/upgradeConfig';
import '../styles/menu.css';

export class LevelUpMenu {
  private element: HTMLDivElement | null = null;
  private onSelectCallback: (upgradeId: UpgradeId) => void;
  private boundOnKeyDown: ((e: KeyboardEvent) => void) | null = null;

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
    subtitle.textContent = `CHOOSE AN UPGRADE • LEVEL ${level} (PRESS 1, 2, OR 3)`;

    const container = document.createElement('div');
    container.className = 'levelup-container';

    for (let i = 0; i < choices.length; i++) {
      const choice = choices[i]!;
      const keyIndex = i + 1;

      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.onclick = () => this.onSelectCallback(choice.id);

      // Card Header: Key shortcut and category badge
      const headerRow = document.createElement('div');
      headerRow.className = 'upgrade-card-header';

      const keyTag = document.createElement('span');
      keyTag.className = 'upgrade-key-shortcut';
      keyTag.textContent = `[ ${keyIndex} ]`;

      const badge = document.createElement('span');
      badge.className = `upgrade-badge badge-${choice.category}`;
      badge.textContent = choice.categoryLabel;

      headerRow.appendChild(badge);
      headerRow.appendChild(keyTag);

      const icon = document.createElement('div');
      icon.className = 'upgrade-icon';
      icon.textContent = choice.icon;

      const cardTitle = document.createElement('div');
      cardTitle.className = 'upgrade-title';
      cardTitle.textContent = choice.name;

      const desc = document.createElement('div');
      desc.className = 'upgrade-description';
      desc.textContent = choice.description;

      card.appendChild(headerRow);
      card.appendChild(icon);
      card.appendChild(cardTitle);
      card.appendChild(desc);

      container.appendChild(card);
    }

    this.element.appendChild(title);
    this.element.appendChild(subtitle);
    this.element.appendChild(container);

    parent.appendChild(this.element);

    // Keyboard shortcuts for instant selection (1, 2, 3)
    this.boundOnKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        if (choices[0]) {
          e.preventDefault();
          this.onSelectCallback(choices[0].id);
        }
      } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        if (choices[1]) {
          e.preventDefault();
          this.onSelectCallback(choices[1].id);
        }
      } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        if (choices[2]) {
          e.preventDefault();
          this.onSelectCallback(choices[2].id);
        }
      }
    };

    window.addEventListener('keydown', this.boundOnKeyDown);
  }

  public unmount(): void {
    if (this.boundOnKeyDown) {
      window.removeEventListener('keydown', this.boundOnKeyDown);
      this.boundOnKeyDown = null;
    }
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
