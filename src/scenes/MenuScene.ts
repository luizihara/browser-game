import { BaseScene, type SceneContext } from './Scene';

export class MenuScene extends BaseScene {
  public readonly name: string = 'menu';

  constructor(context: SceneContext) {
    super(context);
  }
}
