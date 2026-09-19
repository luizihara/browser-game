import type { IScene } from './Scene';
import type { Disposable } from '../types';

export class SceneManager implements Disposable {
  private scenes: Map<string, IScene> = new Map();
  private currentScene: IScene | null = null;

  public register(scene: IScene): void {
    if (this.scenes.has(scene.name)) {
      console.warn(`[SceneManager] Scene "${scene.name}" is already registered. Overwriting.`);
    }
    this.scenes.set(scene.name, scene);
    scene.init();
  }

  public switchScene(name: string): void {
    const nextScene = this.scenes.get(name);
    if (!nextScene) {
      throw new Error(`[SceneManager] Scene "${name}" not found`);
    }

    if (this.currentScene) {
      this.currentScene.exit();
    }

    console.info(`[SceneManager] Switching to scene: ${name}`);
    this.currentScene = nextScene;
    this.currentScene.enter();
  }

  public getCurrentScene(): IScene | null {
    return this.currentScene;
  }

  public update(deltaTime: number): void {
    if (this.currentScene) {
      this.currentScene.update(deltaTime);
    }
  }

  public render(): void {
    if (this.currentScene) {
      this.currentScene.render();
    }
  }

  public resize(width: number, height: number): void {
    if (this.currentScene) {
      this.currentScene.resize(width, height);
    }
  }

  public dispose(): void {
    if (this.currentScene) {
      this.currentScene.exit();
      this.currentScene = null;
    }

    for (const scene of this.scenes.values()) {
      scene.dispose();
    }
    this.scenes.clear();
  }
}
