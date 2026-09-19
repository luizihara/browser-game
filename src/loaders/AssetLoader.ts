export class AssetLoader {
  private cache: Map<string, unknown> = new Map();

  public async loadAll(onProgress?: (progress: number) => void): Promise<void> {
    // Initial foundation loader: Simulates or prepares assets loading with progress
    if (onProgress) onProgress(0);

    // Minimal delay to ensure smooth initial transition
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (onProgress) onProgress(0.5);

    await new Promise((resolve) => setTimeout(resolve, 200));
    if (onProgress) onProgress(1.0);
  }

  public get<T>(key: string): T | undefined {
    return this.cache.get(key) as T | undefined;
  }

  public set(key: string, asset: unknown): void {
    this.cache.set(key, asset);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }
}
