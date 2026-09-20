import * as THREE from 'three';
import { Entity } from '../Entity';
import { PLAYER_CONFIG } from '../../config/playerConfig';
import { CharacterBuilder, type PlayerVisualComponents } from '../../art/CharacterBuilder';
import { PALETTE } from '../../art/Palette';

export class Player extends Entity {
  public speed: number = PLAYER_CONFIG.speed;
  public hp: number = PLAYER_CONFIG.maxHp;
  public maxHp: number = PLAYER_CONFIG.maxHp;
  public radius: number = PLAYER_CONFIG.radius;
  private invulnerableTimer: number = 0;

  // Visual components & animation state
  private visualComponents: PlayerVisualComponents;
  private walkTimer: number = 0;
  private idleTimer: number = 0;
  private lastX: number = 0;
  private lastZ: number = 0;
  private isFlashing: boolean = false;

  constructor() {
    const visual = CharacterBuilder.buildPlayerHero();
    super(visual.rootGroup);

    this.visualComponents = visual;

    this.position.set(
      PLAYER_CONFIG.initialPosition.x,
      PLAYER_CONFIG.initialPosition.y,
      PLAYER_CONFIG.initialPosition.z
    );

    this.lastX = this.position.x;
    this.lastZ = this.position.z;
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.hp <= 0) {
      return false;
    }

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = PLAYER_CONFIG.invulnerabilityDuration;

    return true;
  }

  public isInvulnerable(): boolean {
    return this.invulnerableTimer > 0;
  }

  public resetHp(): void {
    this.hp = this.maxHp;
    this.invulnerableTimer = 0;
    this.setFlash(false);
  }

  private setFlash(flash: boolean): void {
    if (this.isFlashing === flash) return;
    this.isFlashing = flash;

    const mats = this.visualComponents.materialsToFlash;
    const colors = this.visualComponents.originalColors;
    const flashColor = PALETTE.vfx.hitFlash;

    for (let i = 0; i < mats.length; i++) {
      mats[i]!.color.setHex(flash ? flashColor : colors[i]!);
    }
  }

  public override update(deltaTime: number): void {
    // 1. Invulnerability and damage flash
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= deltaTime;

      const flash = Math.floor(this.invulnerableTimer * 16) % 2 === 0;
      this.setFlash(flash);

      if (this.invulnerableTimer <= 0) {
        this.invulnerableTimer = 0;
        this.setFlash(false);
      }
    }

    // 2. Procedural walk bobbing & breathing
    const dx = this.position.x - this.lastX;
    const dz = this.position.z - this.lastZ;
    const movedSq = dx * dx + dz * dz;
    const isMoving = movedSq > 0.000001;

    this.lastX = this.position.x;
    this.lastZ = this.position.z;

    const model = this.visualComponents.modelGroup;

    if (isMoving) {
      this.walkTimer += deltaTime * 14.0;
      // Walking bob: bounce up on each step with subtle lateral sway
      model.position.y = Math.abs(Math.sin(this.walkTimer)) * 0.06;
      model.rotation.z = Math.sin(this.walkTimer) * 0.035;
    } else {
      this.idleTimer += deltaTime * 2.5;
      // Idle breathing: soft vertical float
      model.position.y = Math.sin(this.idleTimer) * 0.02;
      model.rotation.z = 0;
    }

    // 3. Staff gem idle spin
    this.visualComponents.staffGemMesh.rotation.y += deltaTime * 2.0;
  }

  public override dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
