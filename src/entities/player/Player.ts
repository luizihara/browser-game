import * as THREE from 'three';
import { Entity } from '../Entity';
import { PLAYER_CONFIG } from '../../config/playerConfig';
import { CharacterBuilder, type PlayerVisualComponents } from '../../art/CharacterBuilder';
import { PALETTE } from '../../art/Palette';
import type { CharacterId } from '../../config/characterConfig';

export class Player extends Entity {
  public speed: number = PLAYER_CONFIG.speed;
  public hp: number = PLAYER_CONFIG.maxHp;
  public maxHp: number = PLAYER_CONFIG.maxHp;
  public radius: number = PLAYER_CONFIG.radius;
  public armor: number = 0;
  public characterId: CharacterId = 'knight';
  private invulnerableTimer: number = 0;

  // Visual components & animation state
  private visualComponents: PlayerVisualComponents;
  private walkTimer: number = 0;
  private idleTimer: number = 0;
  private lastX: number = 0;
  private lastZ: number = 0;
  private isFlashing: boolean = false;

  constructor(characterId: CharacterId = 'knight') {
    const parentGroup = new THREE.Group();
    super(parentGroup);

    this.characterId = characterId;
    this.visualComponents = CharacterBuilder.buildPlayerHero(characterId);
    this.mesh.add(this.visualComponents.rootGroup);

    this.position.set(
      PLAYER_CONFIG.initialPosition.x,
      PLAYER_CONFIG.initialPosition.y,
      PLAYER_CONFIG.initialPosition.z
    );

    this.lastX = this.position.x;
    this.lastZ = this.position.z;
  }

  public setCharacter(characterId: CharacterId): void {
    if (this.characterId === characterId) return;
    this.characterId = characterId;
    this.mesh.remove(this.visualComponents.rootGroup);
    this.visualComponents = CharacterBuilder.buildPlayerHero(characterId);
    this.mesh.add(this.visualComponents.rootGroup);
  }

  public takeDamage(amount: number): boolean {
    if (this.invulnerableTimer > 0 || this.hp <= 0) {
      return false;
    }

    const effectiveDamage = Math.max(1, amount - this.armor);
    this.hp = Math.max(0, this.hp - effectiveDamage);
    this.invulnerableTimer = PLAYER_CONFIG.invulnerabilityDuration;

    return true;
  }

  public heal(amount: number): number {
    if (this.hp <= 0 || amount <= 0) return 0;
    const prev = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - prev;
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
