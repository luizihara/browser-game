import { Time } from './Time';
import type { Disposable } from '../types';

export type UpdateCallback = (deltaTime: number) => void;
export type RenderCallback = () => void;

export class GameLoop implements Disposable {
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private onUpdate: UpdateCallback;
  private onRender: RenderCallback;

  constructor(onUpdate: UpdateCallback, onRender: RenderCallback) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;

    this.tick = this.tick.bind(this);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    Time.reset();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private tick(timestamp: number): void {
    if (!this.isRunning) return;

    Time.update(timestamp);

    this.onUpdate(Time.deltaTime);
    this.onRender();

    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  public dispose(): void {
    this.stop();
  }
}
