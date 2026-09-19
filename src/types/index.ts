export interface Disposable {
  dispose(): void;
}

export interface Updatable {
  update(deltaTime: number): void;
}
