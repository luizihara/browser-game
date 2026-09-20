import type { Disposable } from '../types';
import { AUDIO_CONFIG } from '../config/audioConfig';
import { SettingsManager } from '../config/settingsConfig';

export class SoundManager implements Disposable {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume: number = AUDIO_CONFIG.masterVolume;
  private muted: boolean = false;
  private lastPlayTimes: Record<string, number> = {};
  private boundUnlockAudio: () => void;
  private unsubscribeSettings: (() => void) | null = null;

  constructor() {
    this.boundUnlockAudio = this.unlockAudio.bind(this);
    this.initContext();
    this.addUnlockListeners();

    this.unsubscribeSettings = SettingsManager.getInstance().subscribe((settings) => {
      this.setMasterVolume(settings.masterVolume);
      this.setMuted(settings.muted);
    });
  }

  private initContext(): void {
    if (typeof window === 'undefined') return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      console.warn('[SoundManager] Web Audio API is not supported in this environment.');
      return;
    }

    try {
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.setValueAtTime(
        this.muted ? 0 : this.masterVolume,
        this.audioContext.currentTime
      );
      this.masterGain.connect(this.audioContext.destination);
    } catch (err) {
      console.warn('[SoundManager] Failed to initialize AudioContext:', err);
    }
  }

  private addUnlockListeners(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('pointerdown', this.boundUnlockAudio, { passive: true });
    window.addEventListener('keydown', this.boundUnlockAudio, { passive: true });
    window.addEventListener('click', this.boundUnlockAudio, { passive: true });
  }

  private removeUnlockListeners(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('pointerdown', this.boundUnlockAudio);
    window.removeEventListener('keydown', this.boundUnlockAudio);
    window.removeEventListener('click', this.boundUnlockAudio);
  }

  private unlockAudio(): void {
    if (!this.audioContext) {
      this.initContext();
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext
        .resume()
        .then(() => {
          this.removeUnlockListeners();
        })
        .catch(() => {
          // Keep listeners to retry on next user gesture
        });
    } else if (this.audioContext && this.audioContext.state === 'running') {
      this.removeUnlockListeners();
    }
  }

  private canPlay(soundKey: string, minInterval: number = 0): boolean {
    if (!this.audioContext || !this.masterGain) {
      return false;
    }

    if (this.muted) {
      return false;
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume();
      // Drop audio trigger when suspended to prevent sudden audio bursts upon unlocking
      return false;
    }

    if (this.audioContext.state !== 'running') {
      return false;
    }

    const now = this.audioContext.currentTime;
    const lastTime = this.lastPlayTimes[soundKey] ?? -1;
    if (minInterval > 0 && now - lastTime < minInterval) {
      return false;
    }

    this.lastPlayTimes[soundKey] = now;
    return true;
  }

  /**
   * Procedural shoot sound: frequency sweep downwards (pew / zap).
   */
  public playShoot(): void {
    const config = AUDIO_CONFIG.shoot;
    if (!this.canPlay('shoot', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, config.endFrequency),
      now + config.duration
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(config.volume, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + config.duration);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural hit sound: sharp percussive punch.
   */
  public playHit(): void {
    const config = AUDIO_CONFIG.hit;
    if (!this.canPlay('hit', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, config.endFrequency),
      now + config.duration
    );

    gain.gain.setValueAtTime(config.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + config.duration);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural enemy death sound: crunchy low-frequency pop.
   */
  public playEnemyDeath(): void {
    const config = AUDIO_CONFIG.death;
    if (!this.canPlay('death', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, config.endFrequency),
      now + config.duration
    );

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.filterCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + config.duration);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(config.volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + config.duration);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural gem pickup sound: sparkling crystal arpeggio chime.
   */
  public playGemPickup(): void {
    const config = AUDIO_CONFIG.gemPickup;
    if (!this.canPlay('gemPickup', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    for (let i = 0; i < config.frequencies.length; i++) {
      const noteTime = now + i * config.noteStep;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequencies[i]!, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(config.volume, noteTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + config.noteDuration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + config.noteDuration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  /**
   * Procedural level up sound: triumphant fanfare chord arpeggio.
   */
  public playLevelUp(): void {
    const config = AUDIO_CONFIG.levelUp;
    if (!this.canPlay('levelUp', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    for (let i = 0; i < config.frequencies.length; i++) {
      const noteTime = now + i * config.noteStep;
      const isLast = i === config.frequencies.length - 1;
      const noteDur = isLast ? config.noteDuration * 1.8 : config.noteDuration;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequencies[i]!, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(config.volume, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + noteDur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + noteDur);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  /**
   * Procedural wave alert sound: ominous siren / brassy war horn.
   */
  public playWaveAlert(): void {
    const config = AUDIO_CONFIG.waveAlert;
    if (!this.canPlay('waveAlert', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = config.type;
    osc.frequency.setValueAtTime(config.startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(
      config.peakFrequency,
      now + config.duration * 0.4
    );
    osc.frequency.exponentialRampToValueAtTime(
      config.endFrequency,
      now + config.duration
    );

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(config.volume, now + 0.12);
    gain.gain.setValueAtTime(config.volume, now + config.duration * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + config.duration);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural game over sound: mournful descending minor tones.
   */
  public playGameOver(): void {
    const config = AUDIO_CONFIG.gameOver;
    if (!this.canPlay('gameOver', config.minInterval)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    for (let i = 0; i < config.frequencies.length; i++) {
      const noteTime = now + i * config.noteStep;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequencies[i]!, noteTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(config.volume, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + config.noteDuration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + config.noteDuration);

      osc.onended = () => {
        osc.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.audioContext && this.masterGain && !this.muted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.audioContext && this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        muted ? 0 : this.masterVolume,
        this.audioContext.currentTime
      );
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public dispose(): void {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    this.removeUnlockListeners();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
    this.lastPlayTimes = {};
  }
}
