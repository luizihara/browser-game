export interface BaseSoundConfig {
  volume: number;
  duration: number;
  minInterval?: number;
}

export interface SweepSoundConfig extends BaseSoundConfig {
  startFrequency: number;
  endFrequency: number;
  type: OscillatorType;
}

export interface HitSoundConfig extends BaseSoundConfig {
  startFrequency: number;
  endFrequency: number;
  type: OscillatorType;
}

export interface DeathSoundConfig extends BaseSoundConfig {
  startFrequency: number;
  endFrequency: number;
  filterCutoff: number;
  type: OscillatorType;
}

export interface ArpeggioSoundConfig extends BaseSoundConfig {
  frequencies: readonly number[];
  noteStep: number;
  noteDuration: number;
  type: OscillatorType;
}

export interface WaveAlertSoundConfig extends BaseSoundConfig {
  startFrequency: number;
  peakFrequency: number;
  endFrequency: number;
  type: OscillatorType;
}

export interface GameOverSoundConfig extends BaseSoundConfig {
  frequencies: readonly number[];
  noteStep: number;
  noteDuration: number;
  type: OscillatorType;
}

export interface AudioConfig {
  masterVolume: number;
  shoot: SweepSoundConfig;
  hit: HitSoundConfig;
  death: DeathSoundConfig;
  gemPickup: ArpeggioSoundConfig;
  levelUp: ArpeggioSoundConfig;
  waveAlert: WaveAlertSoundConfig;
  gameOver: GameOverSoundConfig;
}

export const AUDIO_CONFIG: AudioConfig = {
  masterVolume: 0.5,
  shoot: {
    volume: 0.25,
    duration: 0.12,
    startFrequency: 880,
    endFrequency: 180,
    type: 'sawtooth',
    minInterval: 0.04,
  },
  hit: {
    volume: 0.3,
    duration: 0.06,
    startFrequency: 240,
    endFrequency: 60,
    type: 'triangle',
    minInterval: 0.03,
  },
  death: {
    volume: 0.4,
    duration: 0.22,
    startFrequency: 150,
    endFrequency: 30,
    filterCutoff: 350,
    type: 'sawtooth',
    minInterval: 0.05,
  },
  gemPickup: {
    volume: 0.3,
    duration: 0.2,
    frequencies: [1046.5, 1318.51, 1567.98, 2093.0], // C6, E6, G6, C7 (sparkling crystal arpeggio)
    noteStep: 0.04,
    noteDuration: 0.08,
    type: 'sine',
    minInterval: 0.04,
  },
  levelUp: {
    volume: 0.45,
    duration: 0.75,
    frequencies: [523.25, 659.25, 783.99, 1046.5, 1318.51], // C5, E5, G5, C6, E6 (triumphant fanfare)
    noteStep: 0.09,
    noteDuration: 0.22,
    type: 'triangle',
    minInterval: 0.5,
  },
  waveAlert: {
    volume: 0.5,
    duration: 1.0,
    startFrequency: 110,
    peakFrequency: 220,
    endFrequency: 85,
    type: 'sawtooth',
    minInterval: 1.0,
  },
  gameOver: {
    volume: 0.5,
    duration: 1.4,
    frequencies: [392.0, 349.23, 311.13, 261.63], // G4, F4, Eb4, C4 (descending C minor)
    noteStep: 0.24,
    noteDuration: 0.35,
    type: 'sawtooth',
    minInterval: 1.0,
  },
} as const;
