export const IS_DEV = import.meta.env.DEV;

export class FpsTracker {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private currentFps: number = 60;

  public update(): number {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastTime = now;
    }

    return this.currentFps;
  }

  public get fps(): number {
    return this.currentFps;
  }
}
