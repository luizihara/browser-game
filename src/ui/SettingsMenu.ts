import { SettingsManager, type ScreenShakeLevel } from '../config/settingsConfig';
import '../styles/menu.css';

export class SettingsMenu {
  private element: HTMLDivElement | null = null;
  private onCloseCallback: () => void;
  private settingsManager: SettingsManager;

  constructor(onClose: () => void) {
    this.onCloseCallback = onClose;
    this.settingsManager = SettingsManager.getInstance();
  }

  public mount(parent: HTMLElement): void {
    if (this.element) return;

    const current = this.settingsManager.getSettings();

    this.element = document.createElement('div');
    this.element.className = 'overlay-screen settings-screen';

    const panel = document.createElement('div');
    panel.className = 'settings-panel';

    const title = document.createElement('h1');
    title.className = 'screen-title';
    title.textContent = 'OPTIONS';

    // 1. Master Volume Row
    const masterRow = document.createElement('div');
    masterRow.className = 'settings-row';

    const masterLabel = document.createElement('span');
    masterLabel.className = 'settings-label';
    masterLabel.textContent = 'MASTER VOLUME';

    const masterVal = document.createElement('span');
    masterVal.className = 'settings-value';
    masterVal.textContent = `${Math.round(current.masterVolume * 100)}%`;

    const masterSlider = document.createElement('input');
    masterSlider.type = 'range';
    masterSlider.min = '0';
    masterSlider.max = '100';
    masterSlider.value = `${Math.round(current.masterVolume * 100)}`;
    masterSlider.className = 'settings-slider';
    masterSlider.oninput = () => {
      const val = parseInt(masterSlider.value, 10) / 100;
      masterVal.textContent = `${masterSlider.value}%`;
      this.settingsManager.updateSettings({ masterVolume: val });
    };

    masterRow.appendChild(masterLabel);
    masterRow.appendChild(masterSlider);
    masterRow.appendChild(masterVal);

    // 2. SFX Volume Row
    const sfxRow = document.createElement('div');
    sfxRow.className = 'settings-row';

    const sfxLabel = document.createElement('span');
    sfxLabel.className = 'settings-label';
    sfxLabel.textContent = 'SFX VOLUME';

    const sfxVal = document.createElement('span');
    sfxVal.className = 'settings-value';
    sfxVal.textContent = `${Math.round(current.sfxVolume * 100)}%`;

    const sfxSlider = document.createElement('input');
    sfxSlider.type = 'range';
    sfxSlider.min = '0';
    sfxSlider.max = '100';
    sfxSlider.value = `${Math.round(current.sfxVolume * 100)}`;
    sfxSlider.className = 'settings-slider';
    sfxSlider.oninput = () => {
      const val = parseInt(sfxSlider.value, 10) / 100;
      sfxVal.textContent = `${sfxSlider.value}%`;
      this.settingsManager.updateSettings({ sfxVolume: val });
    };

    sfxRow.appendChild(sfxLabel);
    sfxRow.appendChild(sfxSlider);
    sfxRow.appendChild(sfxVal);

    // 3. Mute Toggle Row
    const muteRow = document.createElement('div');
    muteRow.className = 'settings-row';

    const muteLabel = document.createElement('span');
    muteLabel.className = 'settings-label';
    muteLabel.textContent = 'MUTE ALL SOUND';

    const muteBtn = document.createElement('button');
    muteBtn.className = `settings-toggle-btn ${current.muted ? 'active' : ''}`;
    muteBtn.textContent = current.muted ? 'MUTED' : 'UNMUTED';
    muteBtn.onclick = () => {
      const isMuted = !this.settingsManager.getSettings().muted;
      muteBtn.className = `settings-toggle-btn ${isMuted ? 'active' : ''}`;
      muteBtn.textContent = isMuted ? 'MUTED' : 'UNMUTED';
      this.settingsManager.updateSettings({ muted: isMuted });
    };

    muteRow.appendChild(muteLabel);
    muteRow.appendChild(muteBtn);

    // 4. Screen Shake Row
    const shakeRow = document.createElement('div');
    shakeRow.className = 'settings-row';

    const shakeLabel = document.createElement('span');
    shakeLabel.className = 'settings-label';
    shakeLabel.textContent = 'SCREEN SHAKE';

    const shakeGroup = document.createElement('div');
    shakeGroup.className = 'settings-btn-group';

    const shakeLevels: ScreenShakeLevel[] = ['full', 'reduced', 'off'];
    const shakeBtns: HTMLButtonElement[] = [];

    shakeLevels.forEach((lvl) => {
      const btn = document.createElement('button');
      btn.className = `settings-choice-btn ${current.screenShake === lvl ? 'active' : ''}`;
      btn.textContent = lvl.toUpperCase();
      btn.onclick = () => {
        this.settingsManager.updateSettings({ screenShake: lvl });
        shakeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      };
      shakeBtns.push(btn);
      shakeGroup.appendChild(btn);
    });

    shakeRow.appendChild(shakeLabel);
    shakeRow.appendChild(shakeGroup);

    // 5. Damage Flash Row
    const flashRow = document.createElement('div');
    flashRow.className = 'settings-row';

    const flashLabel = document.createElement('span');
    flashLabel.className = 'settings-label';
    flashLabel.textContent = 'DAMAGE FLASH';

    const flashBtn = document.createElement('button');
    flashBtn.className = `settings-toggle-btn ${current.damageFlash ? 'active' : ''}`;
    flashBtn.textContent = current.damageFlash ? 'ON' : 'OFF';
    flashBtn.onclick = () => {
      const flash = !this.settingsManager.getSettings().damageFlash;
      flashBtn.className = `settings-toggle-btn ${flash ? 'active' : ''}`;
      flashBtn.textContent = flash ? 'ON' : 'OFF';
      this.settingsManager.updateSettings({ damageFlash: flash });
    };

    flashRow.appendChild(flashLabel);
    flashRow.appendChild(flashBtn);

    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'menu-button';
    closeBtn.textContent = 'BACK';
    closeBtn.onclick = () => this.onCloseCallback();

    panel.appendChild(title);
    panel.appendChild(masterRow);
    panel.appendChild(sfxRow);
    panel.appendChild(muteRow);
    panel.appendChild(shakeRow);
    panel.appendChild(flashRow);
    panel.appendChild(closeBtn);

    this.element.appendChild(panel);
    parent.appendChild(this.element);
  }

  public unmount(): void {
    if (this.element && this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
    this.element = null;
  }
}
