import type { Disposable } from '../types';
import { Renderer } from './Renderer';
import { GameLoop } from './GameLoop';

export class Game implements Disposable {
  private canvas: HTMLCanvasElement;
  private uiRoot: HTMLElement;
  private renderer: Renderer;
  private gameLoop: GameLoop;
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
    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );

    this.handleResize = this.handleResize.bind(this);
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    this.gameLoop.start();

    console.info('[Game] Started with GameLoop and Time management');
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
  }

  private update(_deltaTime: number): void {
    if (this.isPaused) return;
    // Scenes will be updated here in Scene Architecture task
  }

  private render(): void {
    // Scenes will be rendered here via renderer in Scene Architecture task
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
    this.gameLoop.dispose();
    this.renderer.dispose();
  }
}
