import * as THREE from 'three';
import { Ground } from './Ground';
import { Lighting } from './Lighting';
import { ArenaBounds } from './ArenaBounds';
import type { Disposable } from '../types';

export class World implements Disposable {
  private ground: Ground;
  private lighting: Lighting;
  private arenaBounds: ArenaBounds;

  constructor(scene: THREE.Scene) {
    this.ground = new Ground();
    this.lighting = new Lighting();
    this.arenaBounds = new ArenaBounds();

    this.ground.addToScene(scene);
    this.lighting.addToScene(scene);
    this.arenaBounds.addToScene(scene);
  }

  public getBounds(): ArenaBounds {
    return this.arenaBounds;
  }

  public dispose(): void {
    this.ground.dispose();
    this.lighting.dispose();
    this.arenaBounds.dispose();
  }
}
