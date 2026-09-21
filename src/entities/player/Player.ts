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

    // Initial heroic facing south (towards camera, Math.PI)
    this.mesh.rotation.y = Math.PI;

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

    // 2. Procedural locomotion with articulated limbs & dynamic cape
    const dx = this.position.x - this.lastX;
    const dz = this.position.z - this.lastZ;
    const movedSq = dx * dx + dz * dz;
    const isMoving = movedSq > 0.000001;

    this.lastX = this.position.x;
    this.lastZ = this.position.z;

    const model = this.visualComponents.modelGroup;
    const leftLeg = this.visualComponents.leftLeg;
    const rightLeg = this.visualComponents.rightLeg;
    const leftArm = this.visualComponents.leftArm;
    const rightArm = this.visualComponents.rightArm;
    const cape = this.visualComponents.capeMesh;

    if (isMoving) {
      this.walkTimer += deltaTime * 14.0;
      const legStride = Math.sin(this.walkTimer);

      // Articulated leg walking stride
      leftLeg.rotation.x = legStride * 0.55;
      rightLeg.rotation.x = -legStride * 0.55;

      // Arm counter-swing
      leftArm.rotation.x = -legStride * 0.35;
      rightArm.rotation.x = legStride * 0.35;

      // Vertical bounce up on every step
      model.position.y = Math.abs(Math.sin(this.walkTimer)) * 0.05;
      // Lateral weight shift / sway
      model.rotation.z = legStride * 0.035;
      // Slight forward athletic lean when sprinting
      model.rotation.x = 0.08;

      // Dynamic fluttering cape trailing in the wind
      if (cape) {
        cape.rotation.x = 0.15 + 0.18 + Math.sin(this.walkTimer * 2) * 0.12;
      }
    } else {
      this.idleTimer += deltaTime * 2.5;
      const breath = Math.sin(this.idleTimer);

      // Return limbs smoothly to neutral standing pose
      leftLeg.rotation.x *= 0.8;
      rightLeg.rotation.x *= 0.8;
      leftArm.rotation.x *= 0.8;
      rightArm.rotation.x *= 0.8;
      model.rotation.x *= 0.8;
      model.rotation.z *= 0.8;

      // Idle breathing: soft vertical float
      model.position.y = breath * 0.018;

      // Gentle resting cape drape
      if (cape) {
        cape.rotation.x = 0.15 + breath * 0.03;
      }
    }

    // 3. Accessory / Gem / Halo idle spin
    this.visualComponents.staffGemMesh.rotation.y += deltaTime * 2.2;
  }

  public override dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
  }
}
