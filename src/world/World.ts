import * as THREE from 'three';
import { Ground } from './Ground';
import { Lighting } from './Lighting';
import type { Disposable } from '../types';

export class World implements Disposable {
  private ground: Ground;
  private lighting: Lighting;

  constructor(scene: THREE.Scene) {
    this.ground = new Ground();
    this.lighting = new Lighting();

    this.ground.addToScene(scene);
    this.lighting.addToScene(scene);
  }

  public dispose(): void {
    this.ground.dispose();
    this.lighting.dispose();
  }
}
