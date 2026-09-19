import { BaseScene, type SceneContext } from './Scene';
import { MainMenu } from '../ui/MainMenu';

export class MenuScene extends BaseScene {
  public readonly name: string = 'menu';
  private mainMenu: MainMenu;

  constructor(context: SceneContext) {
    super(context);
    this.mainMenu = new MainMenu(() => {
      this.context.switchScene('game');
    });
  }

  public override enter(): void {
    this.mainMenu.mount(this.context.uiRoot);
  }

  public override exit(): void {
    this.mainMenu.unmount();
  }

  public override dispose(): void {
    this.mainMenu.unmount();
  }
}
