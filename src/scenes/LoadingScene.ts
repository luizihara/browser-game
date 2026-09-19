import { BaseScene, type SceneContext } from './Scene';
import { LoadingScreen } from '../ui/LoadingScreen';
import { AssetLoader } from '../loaders/AssetLoader';

export class LoadingScene extends BaseScene {
  public readonly name: string = 'loading';
  private loadingScreen: LoadingScreen;
  private assetLoader: AssetLoader;

  constructor(context: SceneContext, assetLoader: AssetLoader) {
    super(context);
    this.loadingScreen = new LoadingScreen();
    this.assetLoader = assetLoader;
  }

  public override enter(): void {
    this.loadingScreen.mount(this.context.uiRoot);

    this.assetLoader.loadAll((progress) => {
      this.loadingScreen.setProgress(progress);
    }).then(() => {
      this.context.switchScene('menu');
    }).catch((err: unknown) => {
      console.error('[LoadingScene] Error loading assets:', err);
    });
  }

  public override exit(): void {
    this.loadingScreen.unmount();
  }

  public override dispose(): void {
    this.loadingScreen.unmount();
  }
}
