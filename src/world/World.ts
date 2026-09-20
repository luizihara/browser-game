import * as THREE from 'three';
import { Ground } from './Ground';
import { Lighting } from './Lighting';
import { ArenaBounds } from './ArenaBounds';
import { PropBuilder } from '../art/PropBuilder';
import { WORLD_CONFIG } from '../config/worldConfig';
import type { Disposable } from '../types';

export class World implements Disposable {
  private ground: Ground;
  private lighting: Lighting;
  private arenaBounds: ArenaBounds;
  private propBuilder: PropBuilder;

  constructor(scene: THREE.Scene) {
    this.ground = new Ground();
    this.lighting = new Lighting();
    this.arenaBounds = new ArenaBounds();
    this.propBuilder = new PropBuilder(WORLD_CONFIG.arenaWidth, WORLD_CONFIG.arenaDepth);

    this.ground.addToScene(scene);
    this.lighting.addToScene(scene);
    this.arenaBounds.addToScene(scene);
    this.propBuilder.addToScene(scene);
  }

  public getBounds(): ArenaBounds {
    return this.arenaBounds;
  }

  public getPropBuilder(): PropBuilder {
    return this.propBuilder;
  }

  public dispose(): void {
    this.ground.dispose();
    this.lighting.dispose();
    this.arenaBounds.dispose();
    this.propBuilder.dispose();
  }
}
