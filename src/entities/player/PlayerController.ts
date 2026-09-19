import * as THREE from 'three';
import type { Player } from './Player';
import { InputAction, type InputSystem } from '../../systems/InputSystem';
import type { Updatable } from '../../types';

export class PlayerController implements Updatable {
  private player: Player;
  private inputSystem: InputSystem;
  // Reusable Vector3 to eliminate per-frame allocations
  private moveDirection: THREE.Vector3 = new THREE.Vector3();

  constructor(player: Player, inputSystem: InputSystem) {
    this.player = player;
    this.inputSystem = inputSystem;
  }

  public update(deltaTime: number): void {
    let dx = 0;
    let dz = 0;

    if (this.inputSystem.isActionActive(InputAction.MoveUp)) {
      dz -= 1;
    }
    if (this.inputSystem.isActionActive(InputAction.MoveDown)) {
      dz += 1;
    }
    if (this.inputSystem.isActionActive(InputAction.MoveLeft)) {
      dx -= 1;
    }
    if (this.inputSystem.isActionActive(InputAction.MoveRight)) {
      dx += 1;
    }

    if (dx !== 0 || dz !== 0) {
      // Normalize vector so diagonal movement is not faster than cardinal movement
      this.moveDirection.set(dx, 0, dz).normalize();

      // Apply movement scaled by speed and deltaTime (frame-rate independent)
      this.player.position.addScaledVector(
        this.moveDirection,
        this.player.speed * deltaTime
      );

      // Rotate player mesh toward movement direction
      const angle = Math.atan2(this.moveDirection.x, this.moveDirection.z);
      this.player.getMesh().rotation.y = angle;
    } else {
      this.moveDirection.set(0, 0, 0);
    }
  }

  public getMoveDirection(): THREE.Vector3 {
    return this.moveDirection;
  }
}
