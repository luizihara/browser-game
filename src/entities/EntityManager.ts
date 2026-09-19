import * as THREE from 'three';
import type { Entity } from './Entity';
import type { Disposable, Updatable } from '../types';

export class EntityManager implements Disposable, Updatable {
  private scene: THREE.Scene;
  private entities: Entity[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public add(entity: Entity): void {
    this.entities.push(entity);
    entity.addToScene(this.scene);
  }

  public remove(entity: Entity): void {
    const index = this.entities.indexOf(entity);
    if (index === -1) return;

    entity.removeFromScene(this.scene);
    entity.dispose();

    // Fast swap-and-pop removal for O(1) without shifting array elements
    const last = this.entities.pop()!;
    if (index < this.entities.length) {
      this.entities[index] = last;
    }
  }

  public update(deltaTime: number): void {
    // Sequential indexed loop for maximum performance with zero allocations
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].update(deltaTime);
    }
  }

  public clear(): void {
    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      entity.removeFromScene(this.scene);
      entity.dispose();
    }
    this.entities.length = 0;
  }

  public getCount(): number {
    return this.entities.length;
  }

  public getEntities(): readonly Entity[] {
    return this.entities;
  }

  public dispose(): void {
    this.clear();
  }
}
