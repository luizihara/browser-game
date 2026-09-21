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

  /**
   * Procedural chest open sound: bright triumphant major fanfare.
   */
  public playChestOpen(): void {
    if (!this.canPlay('chestOpen', 0.5)) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880, 1108.73];
    const step = 0.08;

    for (let i = 0; i < freqs.length; i++) {
      const noteTime = now + i * step;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freqs[i]!, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  /**
   * Procedural heal sound: warm chime.
   */
  public playHeal(): void {
    if (!this.canPlay('heal', 0.2)) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99];

    for (let i = 0; i < freqs.length; i++) {
      const noteTime = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqs[i]!, noteTime);

      gain.gain.setValueAtTime(0.0001, noteTime);
      gain.gain.linearRampToValueAtTime(0.3, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    }
  }

  /**
   * Procedural vacuum sound: cosmic magnetic whoosh.
   */
  public playVacuum(): void {
    if (!this.canPlay('vacuum', 0.5)) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.5);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural holy bomb explosion sound.
   */
  public playBombExplosion(): void {
    if (!this.canPlay('bomb', 0.5)) return;
    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.7);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.7);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  public startBiomeAmbience(theme: 'nature' | 'magma' | 'frost'): void {
    this.stopBiomeAmbience();
    if (!this.audioContext || !this.masterGain) return;
    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      if (theme === 'magma') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(130, now);
        gain.gain.setValueAtTime(0.045, now);
      } else if (theme === 'frost') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.035, now);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(260, now);
        gain.gain.setValueAtTime(0.03, now);
      }

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);

      this.ambientOsc = osc;
      this.ambientGain = gain;
    } catch {
      // Audio context might be suspended
    }
  }

  public stopBiomeAmbience(): void {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch {}
      this.ambientOsc = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {}
      this.ambientGain = null;
    }
  }

  public playBreakableShatter(type: 'pot' | 'barrel' | 'crystal' = 'pot'): void {
    if (!this.canPlay('break_prop', 0.05)) return;
    if (!this.audioContext || !this.masterGain) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    if (type === 'barrel') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    } else if (type === 'crystal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, now);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  }

  /**
   * Procedural triumphant medieval fanfare for achievement unlock.
   */
  public playAchievementUnlock(): void {
    if (!this.canPlay('achievement', 0.2)) return;
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const noteDuration = 0.12;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.24, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + (idx === 3 ? 0.45 : noteDuration));

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + (idx === 3 ? 0.5 : noteDuration + 0.05));

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }

  /**
   * Procedural bright crystalline coin reward jingle.
   */
  public playCoinReward(): void {
    if (!this.canPlay('coin_reward', 0.05)) return;
    if (!this.audioContext || !this.masterGain) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const freqs = [987.77, 1318.51, 1975.53]; // B5, E6, B6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startTime + 0.1);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(startTime);
      osc.stop(startTime + 0.2);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }

  /**
   * Procedural lightning sound: electric crack + resonant bass thunder crash.
   */
  public playLightning(): void {
    if (!this.canPlay('lightning', 0.1)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    // High electric crack
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.26);

    // Deep sub bass impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(75, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.3, now + 0.015);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain!);

    subOsc.start(now);
    subOsc.stop(now + 0.36);

    subOsc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      subOsc.disconnect();
      subGain.disconnect();
    };
  }

  /**
   * Procedural glass flask shatter sound: sharp brittle chime + splash.
   */
  public playPotionShatter(): void {
    if (!this.canPlay('potionShatter', 0.08)) return;

    const ctx = this.audioContext!;
    const now = ctx.currentTime;

    const freqs = [1760, 2489, 3520]; // Glass harmonics A6, D#7, A7
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + idx * 0.01;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, start + 0.15);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(start);
      osc.stop(start + 0.17);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
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
    this.stopBiomeAmbience();
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
