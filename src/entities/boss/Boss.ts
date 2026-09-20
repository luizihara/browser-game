import * as THREE from 'three';
import { Enemy } from '../enemy/Enemy';
import { BOSS_CONFIG, type BossId, type BossConfig } from '../../config/bossConfig';
import type { Player } from '../player/Player';
import type { TelegraphSystem } from '../../systems/TelegraphSystem';

export type BossState = 'chase' | 'telegraphing' | 'executing' | 'recovery';

export class Boss extends Enemy {
  public readonly bossId: BossId;
  public readonly config: BossConfig;
  public contactDamage: number;

  private state: BossState = 'chase';
  private stateTimer: number = 0;
  private attackCooldowns: number[] = [];

  // Hit flash & materials
  protected override flashTimer: number = 0;
  private baseMaterials: THREE.Material[] = [];
  private static flashMaterial: THREE.MeshBasicMaterial | null = null;
  private meshes: THREE.Mesh[] = [];

  // Movement & charge execution vectors
  private chargeDirX: number = 0;
  private chargeDirZ: number = 0;
  private chargeSpeed: number = 0;
  private chargeDuration: number = 0;

  // Visual animation timers
  private animTimer: number = 0;

  constructor(bossId: BossId, x: number, z: number) {
    const parentGroup = new THREE.Group();
    super(x, z, 'elite', undefined, parentGroup);

    this.bossId = bossId;
    this.config = BOSS_CONFIG[bossId];
    this.hp = this.config.maxHp;
    this.maxHp = this.config.maxHp;
    this.speed = this.config.speed;
    this.radius = this.config.radius;
    this.damage = this.config.contactDamage;
    this.contactDamage = this.config.contactDamage;
    this.xpReward = 1500;
    this.gemTier = 'gold';
    this.originalColor = this.config.color;

    this.attackCooldowns = this.config.attacks.map((a) => a.cooldown * 0.4); // Initial staggered cooldown

    this.buildBossModel();

    this.position.set(x, this.config.height * 0.5, z);
  }

  public override getColor(): number {
    return this.config.color;
  }

  public override update(_deltaTime: number): void {
    // Boss uses custom updateAI driven by GameScene
  }

  private static getFlashMat(): THREE.MeshBasicMaterial {
    if (!Boss.flashMaterial) {
      Boss.flashMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    }
    return Boss.flashMaterial;
  }

  private buildBossModel(): void {
    if (this.bossId === 'gorgonath') {
      this.buildGorgonathModel();
    } else {
      this.buildMalakorModel();
    }

    // Cache base materials for hit flash restoration
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.meshes.push(child);
        this.baseMaterials.push(child.material);
        child.castShadow = true;
      }
    });
  }

  private buildGorgonathModel(): void {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x451a03,
      roughness: 0.85,
      metalness: 0.1,
    });
    const magmaMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });

    // 1. Massive Torso
    const torsoGeo = new THREE.DodecahedronGeometry(1.6, 0);
    torsoGeo.scale(1.2, 1.4, 1.0);
    const torso = new THREE.Mesh(torsoGeo, stoneMat);
    this.mesh.add(torso);

    // 2. Magma Core Chest
    const coreGeo = new THREE.SphereGeometry(0.8, 8, 8);
    const core = new THREE.Mesh(coreGeo, magmaMat);
    core.position.set(0, 0.2, 0.6);
    this.mesh.add(core);

    // 3. Shoulder Boulders with Magma Spikes
    const shoulderL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), stoneMat);
    shoulderL.position.set(-1.6, 0.9, 0);
    this.mesh.add(shoulderL);

    const spikeL = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 5), magmaMat);
    spikeL.position.set(-1.7, 1.6, 0);
    this.mesh.add(spikeL);

    const shoulderR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 0), stoneMat);
    shoulderR.position.set(1.6, 0.9, 0);
    this.mesh.add(shoulderR);

    const spikeR = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 5), magmaMat);
    spikeR.position.set(1.7, 1.6, 0);
    this.mesh.add(spikeR);

    // 4. Head with Glowing Eyes
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), stoneMat);
    head.position.set(0, 1.5, 0.5);
    this.mesh.add(head);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.15), eyeMat);
    eyeL.position.set(-0.25, 1.55, 0.95);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.15), eyeMat);
    eyeR.position.set(0.25, 1.55, 0.95);
    this.mesh.add(eyeR);
  }

  private buildMalakorModel(): void {
    const voidMat = new THREE.MeshStandardMaterial({
      color: 0x2e1065,
      roughness: 0.4,
      metalness: 0.6,
    });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0xc084fc,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const goldHornMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.6,
      metalness: 0.8,
    });

    // 1. Torso
    const torsoGeo = new THREE.ConeGeometry(1.4, 2.8, 6);
    const torso = new THREE.Mesh(torsoGeo, voidMat);
    this.mesh.add(torso);

    // 2. Nether Robe Collar / Cape
    const capeGeo = new THREE.BoxGeometry(2.4, 2.2, 0.3);
    const cape = new THREE.Mesh(capeGeo, flameMat);
    cape.position.set(0, 0.2, -0.6);
    this.mesh.add(cape);

    // 3. Head with Demonic Horns
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.75, 8, 8), voidMat);
    head.position.set(0, 1.6, 0);
    this.mesh.add(head);

    // Curved Horns
    const hornGeo = new THREE.ConeGeometry(0.22, 1.4, 5);
    hornGeo.rotateZ(0.4);
    const hornL = new THREE.Mesh(hornGeo, goldHornMat);
    hornL.position.set(-0.6, 2.3, 0);
    this.mesh.add(hornL);

    const hornRGeo = new THREE.ConeGeometry(0.22, 1.4, 5);
    hornRGeo.rotateZ(-0.4);
    const hornR = new THREE.Mesh(hornRGeo, goldHornMat);
    hornR.position.set(0.6, 2.3, 0);
    this.mesh.add(hornR);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
    eyeL.position.set(-0.22, 1.65, 0.68);
    this.mesh.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), eyeMat);
    eyeR.position.set(0.22, 1.65, 0.68);
    this.mesh.add(eyeR);

    // 4. Spectral Wings
    const wingGeo = new THREE.ConeGeometry(0.3, 2.2, 4);
    wingGeo.rotateZ(1.2);
    const wingL = new THREE.Mesh(wingGeo, flameMat);
    wingL.position.set(-1.8, 1.0, -0.5);
    this.mesh.add(wingL);

    const wingRGeo = new THREE.ConeGeometry(0.3, 2.2, 4);
    wingRGeo.rotateZ(-1.2);
    const wingR = new THREE.Mesh(wingRGeo, flameMat);
    wingR.position.set(1.8, 1.0, -0.5);
    this.mesh.add(wingR);
  }

  public updateAI(
    deltaTime: number,
    player: Player,
    telegraphSystem: TelegraphSystem,
    onImpact: (x: number, y: number, z: number, damage: number, radius: number) => void,
    onSpawnRadialHellfire?: (x: number, y: number, z: number) => void
  ): void {
    if (this.isDead || player.hp <= 0) return;

    this.animTimer += deltaTime;

    // Hit flash timer
    if (this.flashTimer > 0) {
      this.flashTimer -= deltaTime;
      if (this.flashTimer <= 0) {
        this.flashTimer = 0;
        for (let i = 0; i < this.meshes.length; i++) {
          this.meshes[i].material = this.baseMaterials[i];
        }
      }
    }

    // Cooldown timers
    for (let i = 0; i < this.attackCooldowns.length; i++) {
      this.attackCooldowns[i] -= deltaTime;
    }

    const px = player.position.x;
    const pz = player.position.z;
    const bx = this.position.x;
    const bz = this.position.z;
    const dx = px - bx;
    const dz = pz - bz;
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
    const invDist = 1 / dist;

    // Face player
    this.mesh.rotation.y = Math.atan2(dx, dz);

    switch (this.state) {
      case 'chase': {
        // Idle/chase floating animation
        this.position.y = this.config.height * 0.5 + Math.sin(this.animTimer * 3.5) * 0.12;

        // Check if ready to cast any attack
        let readyAttackIdx = -1;
        for (let i = 0; i < this.attackCooldowns.length; i++) {
          if (this.attackCooldowns[i] <= 0) {
            readyAttackIdx = i;
            break;
          }
        }

        if (readyAttackIdx !== -1) {
          const atk = this.config.attacks[readyAttackIdx];
          this.state = 'telegraphing';
          this.stateTimer = atk.chargeTime;
          this.attackCooldowns[readyAttackIdx] = atk.cooldown;

          // Dispatch telegraph based on attack id
          if (atk.id === 'slam' || atk.id === 'cataclysm') {
            const rad = atk.radius ?? 5.0;
            telegraphSystem.spawnCircle(bx, bz, rad, atk.chargeTime, () => {
              this.state = 'executing';
              onImpact(this.position.x, this.position.y, this.position.z, atk.damage, rad);
              this.stateTimer = 0.4; // brief recovery
            });
          } else if (atk.id === 'charge') {
            const dirX = dx * invDist;
            const dirZ = dz * invDist;
            this.chargeDirX = dirX;
            this.chargeDirZ = dirZ;
            this.chargeSpeed = 13.0;
            this.chargeDuration = (atk.length ?? 12.0) / this.chargeSpeed;

            telegraphSystem.spawnRect(
              bx,
              bz,
              dirX,
              dirZ,
              atk.width ?? 2.6,
              atk.length ?? 12.0,
              atk.chargeTime,
              () => {
                this.state = 'executing';
                this.stateTimer = this.chargeDuration;
              }
            );
          } else if (atk.id === 'hellfire') {
            telegraphSystem.spawnCircle(bx, bz, 4.0, atk.chargeTime, () => {
              if (onSpawnRadialHellfire) {
                onSpawnRadialHellfire(this.position.x, this.position.y, this.position.z);
              }
              this.state = 'executing';
              this.stateTimer = 0.3;
            });
          }
          return;
        }

        // Standard movement toward player
        this.position.x += dx * invDist * this.speed * deltaTime;
        this.position.z += dz * invDist * this.speed * deltaTime;
        break;
      }

      case 'telegraphing': {
        // Vibrating / gathering energy charge animation
        const shake = Math.sin(this.animTimer * 40.0) * 0.05;
        this.position.x += shake;
        break;
      }

      case 'executing': {
        this.stateTimer -= deltaTime;
        if (this.chargeDuration > 0) {
          // Fast dash forward during charge
          this.position.x += this.chargeDirX * this.chargeSpeed * deltaTime;
          this.position.z += this.chargeDirZ * this.chargeSpeed * deltaTime;

          // Check contact hit during charge
          const cDist = this.radius + player.radius;
          const hitDx = player.position.x - this.position.x;
          const hitDz = player.position.z - this.position.z;
          if (hitDx * hitDx + hitDz * hitDz <= cDist * cDist) {
            player.takeDamage(this.config.contactDamage * 1.5);
          }
        }

        if (this.stateTimer <= 0) {
          this.state = 'recovery';
          this.stateTimer = 0.5;
          this.chargeDuration = 0;
        }
        break;
      }

      case 'recovery': {
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
          this.state = 'chase';
        }
        break;
      }
    }
  }

  public override takeDamage(amount: number): boolean {
    if (this.isDead) return true;

    this.hp = Math.max(0, this.hp - amount);
    this.flashTimer = 0.08;

    const flash = Boss.getFlashMat();
    for (let i = 0; i < this.meshes.length; i++) {
      this.meshes[i].material = flash;
    }

    if (this.hp <= 0) {
      this.isDead = true;
      return true;
    }
    return false;
  }

  public override applyKnockback(_dirX: number, _dirZ: number, _force: number): void {
    // Bosses are immune to crowd-control and knockback
  }

  public override dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    });
    this.meshes = [];
    this.baseMaterials = [];
  }
}
