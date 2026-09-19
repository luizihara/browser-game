import type { Disposable } from '../types';
import { Renderer } from './Renderer';

export class Game implements Disposable {
  private canvas: HTMLCanvasElement;
  private uiRoot: HTMLElement;
  private renderer: Renderer;
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

    this.renderer = new Renderer(this.canvas);

    this.handleResize = this.handleResize.bind(this);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    console.info('[Game] Started successfully with WebGLRenderer');
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
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getUiRoot(): HTMLElement {
    return this.uiRoot;
  }

  public getRenderer(): Renderer {
    return this.renderer;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public dispose(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
  }
}
