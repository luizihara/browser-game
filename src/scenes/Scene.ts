import type { Disposable } from '../types';

export interface SceneContext {
  readonly uiRoot: HTMLElement;
  readonly switchScene: (sceneName: string) => void;
}

export interface IScene extends Disposable {
  readonly name: string;
  init(): void;
  enter(): void;
  update(deltaTime: number): void;
  render(): void;
  resize(width: number, height: number): void;
  exit(): void;
}

export abstract class BaseScene implements IScene {
  public abstract readonly name: string;
  protected context: SceneContext;

  constructor(context: SceneContext) {
    this.context = context;
  }

  public init(): void {}
  public enter(): void {}
  public update(_deltaTime: number): void {}
  public render(): void {}
  public resize(_width: number, _height: number): void {}
  public exit(): void {}
  public dispose(): void {}
}
