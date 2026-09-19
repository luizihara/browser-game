import { GAME_CONFIG } from '../config/gameConfig';

export class Time {
  private static _deltaTime: number = 0;
  private static _rawDeltaTime: number = 0;
  private static _elapsedTime: number = 0;
  private static _lastTime: number = 0;
  private static _timeScale: number = 1.0;
  private static _isFirstFrame: boolean = true;

  public static update(currentTimeMs: number): void {
    const currentTimeSec = currentTimeMs / 1000;

    if (this._isFirstFrame) {
      this._lastTime = currentTimeSec;
      this._isFirstFrame = false;
      this._deltaTime = 0;
      this._rawDeltaTime = 0;
      return;
    }

    const rawDelta = currentTimeSec - this._lastTime;
    this._lastTime = currentTimeSec;

    this._rawDeltaTime = rawDelta;
    // Clamp delta time to avoid large jumps if tab loses focus or freezes
    this._deltaTime = Math.min(rawDelta, GAME_CONFIG.maxDeltaTime) * this._timeScale;
    this._elapsedTime += this._deltaTime;
  }

  public static get deltaTime(): number {
    return this._deltaTime;
  }

  public static get rawDeltaTime(): number {
    return this._rawDeltaTime;
  }

  public static get elapsedTime(): number {
    return this._elapsedTime;
  }

  public static get timeScale(): number {
    return this._timeScale;
  }

  public static set timeScale(value: number) {
    this._timeScale = Math.max(0, value);
  }

  public static reset(): void {
    this._lastTime = 0;
    this._deltaTime = 0;
    this._rawDeltaTime = 0;
    this._elapsedTime = 0;
    this._isFirstFrame = true;
    this._timeScale = 1.0;
  }
}
