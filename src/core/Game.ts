import type { Disposable } from '../types';

export class Game implements Disposable {
  private canvas: HTMLCanvasElement;
  private uiRoot: HTMLElement;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    const canvas = document.getElementById('game-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element #game-canvas not found');
    }

    const uiRoot = document.getElementById('ui-root');
    if (!(uiRoot instanceof HTMLElement)) {
      throw new Error('UI root element #ui-root not found');
    }

    this.canvas = canvas;
    this.uiRoot = uiRoot;

    this.handleResize = this.handleResize.bind(this);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    console.info('[Game] Started successfully');
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
  }

  public handleResize(): void {
    // Will be wired to Renderer, Camera, and Scenes in subsequent tasks
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getUiRoot(): HTMLElement {
    return this.uiRoot;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public dispose(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
  }
}
