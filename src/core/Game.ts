import type { Disposable } from '../types';
import { Renderer } from './Renderer';
import { GameLoop } from './GameLoop';
import { SceneManager } from '../scenes/SceneManager';
import type { SceneContext } from '../scenes/Scene';
import { AssetLoader } from '../loaders/AssetLoader';
import { LoadingScene } from '../scenes/LoadingScene';
import { MenuScene } from '../scenes/MenuScene';

export class Game implements Disposable {
  private canvas: HTMLCanvasElement;
  private uiRoot: HTMLElement;
  private renderer: Renderer;
  private gameLoop: GameLoop;
  private sceneManager: SceneManager;
  private assetLoader: AssetLoader;
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
    this.sceneManager = new SceneManager();
    this.assetLoader = new AssetLoader();

    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      () => this.render()
    );

    this.handleResize = this.handleResize.bind(this);
    this.setupScenes();
  }

  private setupScenes(): void {
    const context = this.getContext();
    this.sceneManager.register(new LoadingScene(context, this.assetLoader));
    this.sceneManager.register(new MenuScene(context));
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    window.addEventListener('resize', this.handleResize);
    this.handleResize();

    this.sceneManager.switchScene('loading');
    this.gameLoop.start();

    console.info('[Game] Started with LoadingScene');
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
  }

  private update(deltaTime: number): void {
    if (this.isPaused) return;
    this.sceneManager.update(deltaTime);
  }

  private render(): void {
    this.sceneManager.render();
  }

  public handleResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height);
    this.sceneManager.resize(width, height);
  }

  public getContext(): SceneContext {
    return {
      uiRoot: this.uiRoot,
      switchScene: (name: string) => this.sceneManager.switchScene(name),
    };
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

  public getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  public getAssetLoader(): AssetLoader {
    return this.assetLoader;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public dispose(): void {
    this.isRunning = false;
    window.removeEventListener('resize', this.handleResize);
    this.gameLoop.dispose();
    this.sceneManager.dispose();
    this.renderer.dispose();
  }
}
