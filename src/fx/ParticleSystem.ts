import * as THREE from 'three';
import { FX_CONFIG } from '../config/fxConfig';
import type { Disposable, Updatable } from '../types';

export class ParticleSystem implements Disposable, Updatable {
  private scene: THREE.Scene | null = null;
  private readonly maxParticles: number;
  private activeCount: number = 0;

  private geometry: THREE.BufferGeometry;
  private material: THREE.ShaderMaterial;
  private pointsMesh: THREE.Points;

  // GPU Buffer attributes
  private positions: Float32Array;
  private colors: Float32Array;
  private alphas: Float32Array;
  private sizes: Float32Array;

  private positionAttribute: THREE.BufferAttribute;
  private colorAttribute: THREE.BufferAttribute;
  private alphaAttribute: THREE.BufferAttribute;
  private sizeAttribute: THREE.BufferAttribute;

  // Pre-allocated physics & simulation state (zero allocation at runtime)
  private velX: Float32Array;
  private velY: Float32Array;
  private velZ: Float32Array;
  private gravity: Float32Array;
  private drag: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private initialSizes: Float32Array;

  constructor(scene?: THREE.Scene, maxParticles: number = FX_CONFIG.maxParticles) {
    this.maxParticles = maxParticles;

    // Allocate continuous typed arrays once
    this.positions = new Float32Array(maxParticles * 3);
    this.colors = new Float32Array(maxParticles * 3);
    this.alphas = new Float32Array(maxParticles);
    this.sizes = new Float32Array(maxParticles);

    this.velX = new Float32Array(maxParticles);
    this.velY = new Float32Array(maxParticles);
    this.velZ = new Float32Array(maxParticles);
    this.gravity = new Float32Array(maxParticles);
    this.drag = new Float32Array(maxParticles);
    this.life = new Float32Array(maxParticles);
    this.maxLife = new Float32Array(maxParticles);
    this.initialSizes = new Float32Array(maxParticles);

    this.geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.BufferAttribute(this.positions, 3);
    this.colorAttribute = new THREE.BufferAttribute(this.colors, 3);
    this.alphaAttribute = new THREE.BufferAttribute(this.alphas, 1);
    this.sizeAttribute = new THREE.BufferAttribute(this.sizes, 1);

    this.positionAttribute.setUsage(THREE.DynamicDrawUsage);
    this.colorAttribute.setUsage(THREE.DynamicDrawUsage);
    this.alphaAttribute.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttribute.setUsage(THREE.DynamicDrawUsage);

    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    this.geometry.setAttribute('alpha', this.alphaAttribute);
    this.geometry.setAttribute('size', this.sizeAttribute);

    this.geometry.setDrawRange(0, 0);

    const vertexShader = `
      attribute float alpha;
      attribute float size;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vColor = color;
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        if (-mvPosition.z > 0.1) {
          gl_PointSize = max(1.0, size * (700.0 / -mvPosition.z));
        } else {
          gl_PointSize = 0.0;
        }
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        if (vAlpha <= 0.001) discard;
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) discard;
        float intensity = 1.0 - smoothstep(0.0, 0.5, dist);
        intensity = pow(intensity, 1.2);
        gl_FragColor = vec4(vColor, vAlpha * intensity);
      }
    `;

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.pointsMesh = new THREE.Points(this.geometry, this.material);
    this.pointsMesh.frustumCulled = false;

    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;

    if (this.scene && this.pointsMesh.parent === this.scene) {
      this.scene.remove(this.pointsMesh);
    }

    this.scene = scene;
    this.scene.add(this.pointsMesh);
  }

  private allocateSlot(): number {
    if (this.activeCount < this.maxParticles) {
      const slot = this.activeCount;
      this.activeCount++;
      return slot;
    }
    // Pool at maximum capacity: overwrite an existing active particle
    return Math.floor(Math.random() * this.maxParticles);
  }

  private setColorAt(slot: number, hex: number): void {
    const idx = slot * 3;
    this.colors[idx] = ((hex >> 16) & 255) / 255;
    this.colors[idx + 1] = ((hex >> 8) & 255) / 255;
    this.colors[idx + 2] = (hex & 255) / 255;
  }

  public emitHitSparks(
    x: number,
    y: number,
    z: number,
    color?: number,
    count?: number
  ): void {
    const cfg = FX_CONFIG.hitSparks;
    const numSparks = count ?? cfg.count;
    const colors = cfg.colors;

    for (let c = 0; c < numSparks; c++) {
      const slot = this.allocateSlot();
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI * 0.35;
      const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);

      const pIdx = slot * 3;
      this.positions[pIdx] = x + (Math.random() - 0.5) * 0.1;
      this.positions[pIdx + 1] = y + (Math.random() - 0.5) * 0.1;
      this.positions[pIdx + 2] = z + (Math.random() - 0.5) * 0.1;

      this.velX[slot] = Math.cos(phi) * Math.cos(theta) * speed;
      this.velY[slot] = Math.sin(theta) * speed + 1.5;
      this.velZ[slot] = Math.sin(phi) * Math.cos(theta) * speed;

      const sparkColor =
        color ?? colors[Math.floor(Math.random() * colors.length)];
      this.setColorAt(slot, sparkColor);

      this.alphas[slot] = 1.0;
      const sz = cfg.size * (0.8 + Math.random() * 0.4);
      this.sizes[slot] = sz;
      this.initialSizes[slot] = sz;

      this.life[slot] = 0;
      this.maxLife[slot] =
        cfg.minLifetime + Math.random() * (cfg.maxLifetime - cfg.minLifetime);
      this.gravity[slot] = cfg.gravity;
      this.drag[slot] = cfg.drag;
    }

    this.markBuffersUpdated();
  }

  public emitDeathExplosion(
    x: number,
    y: number,
    z: number,
    color?: number,
    count?: number
  ): void {
    const cfg = FX_CONFIG.deathExplosion;
    const numParticles = count ?? cfg.count;
    const colors = cfg.colors;

    for (let c = 0; c < numParticles; c++) {
      const slot = this.allocateSlot();
      const phi = Math.random() * Math.PI * 2;
      const theta = (Math.random() - 0.2) * Math.PI * 0.5;
      const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);

      const pIdx = slot * 3;
      this.positions[pIdx] = x + (Math.random() - 0.5) * 0.2;
      this.positions[pIdx + 1] = y + (Math.random() - 0.5) * 0.2;
      this.positions[pIdx + 2] = z + (Math.random() - 0.5) * 0.2;

      this.velX[slot] = Math.cos(phi) * Math.cos(theta) * speed;
      this.velY[slot] = Math.abs(Math.sin(theta)) * speed + 2.0;
      this.velZ[slot] = Math.sin(phi) * Math.cos(theta) * speed;

      const pColor =
        color ?? colors[Math.floor(Math.random() * colors.length)];
      this.setColorAt(slot, pColor);

      this.alphas[slot] = 1.0;
      const sz = cfg.size * (0.8 + Math.random() * 0.5);
      this.sizes[slot] = sz;
      this.initialSizes[slot] = sz;

      this.life[slot] = 0;
      this.maxLife[slot] =
        cfg.minLifetime + Math.random() * (cfg.maxLifetime - cfg.minLifetime);
      this.gravity[slot] = cfg.gravity;
      this.drag[slot] = cfg.drag;
    }

    this.markBuffersUpdated();
  }

  public emitLevelUpBurst(x: number, y: number, z: number): void {
    const cfg = FX_CONFIG.levelUpBurst;
    const count = cfg.count;
    const colors = cfg.colors;

    for (let c = 0; c < count; c++) {
      const slot = this.allocateSlot();
      const angle = (c / count) * Math.PI * 6 + Math.random() * 0.5;
      const radius = 0.3 + Math.random() * 1.5;
      const speed = cfg.minSpeed + Math.random() * (cfg.maxSpeed - cfg.minSpeed);

      const pIdx = slot * 3;
      this.positions[pIdx] = x + Math.cos(angle) * radius;
      this.positions[pIdx + 1] = y + Math.random() * 0.5;
      this.positions[pIdx + 2] = z + Math.sin(angle) * radius;

      this.velX[slot] = Math.cos(angle) * (1.5 + Math.random() * 2.0);
      this.velY[slot] = speed;
      this.velZ[slot] = Math.sin(angle) * (1.5 + Math.random() * 2.0);

      const pColor = colors[Math.floor(Math.random() * colors.length)];
      this.setColorAt(slot, pColor);

      this.alphas[slot] = 1.0;
      const sz = cfg.size * (0.8 + Math.random() * 0.5);
      this.sizes[slot] = sz;
      this.initialSizes[slot] = sz;

      this.life[slot] = 0;
      this.maxLife[slot] =
        cfg.minLifetime + Math.random() * (cfg.maxLifetime - cfg.minLifetime);
      this.gravity[slot] = cfg.gravity;
      this.drag[slot] = cfg.drag;
    }

    this.markBuffersUpdated();
  }

  public emitAmbientEmbers(x: number, z: number, count: number = 3): void {
    const colors = [0xf97316, 0xfbbf24, 0xef4444];
    for (let c = 0; c < count; c++) {
      const slot = this.allocateSlot();
      const pIdx = slot * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 3.0 + Math.random() * 12.0;

      this.positions[pIdx] = x + Math.cos(angle) * dist;
      this.positions[pIdx + 1] = 0.1 + Math.random() * 0.4;
      this.positions[pIdx + 2] = z + Math.sin(angle) * dist;

      this.velX[slot] = (Math.random() - 0.5) * 0.6;
      this.velY[slot] = 0.8 + Math.random() * 1.2;
      this.velZ[slot] = (Math.random() - 0.5) * 0.6;

      const pColor = colors[Math.floor(Math.random() * colors.length)];
      this.setColorAt(slot, pColor);

      this.alphas[slot] = 0.85;
      const sz = 0.18 + Math.random() * 0.12;
      this.sizes[slot] = sz;
      this.initialSizes[slot] = sz;

      this.life[slot] = 0;
      this.maxLife[slot] = 1.8 + Math.random() * 1.4;
      this.gravity[slot] = 0;
      this.drag[slot] = 0.05;
    }
    this.markBuffersUpdated();
  }

  public emitAmbientSnow(x: number, z: number, count: number = 4): void {
    const colors = [0xf8fafc, 0xe0f2fe, 0xbae6fd];
    for (let c = 0; c < count; c++) {
      const slot = this.allocateSlot();
      const pIdx = slot * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 2.0 + Math.random() * 14.0;

      this.positions[pIdx] = x + Math.cos(angle) * dist;
      this.positions[pIdx + 1] = 5.0 + Math.random() * 3.0;
      this.positions[pIdx + 2] = z + Math.sin(angle) * dist;

      this.velX[slot] = (Math.random() - 0.5) * 0.8 + 0.3;
      this.velY[slot] = -(1.2 + Math.random() * 1.0);
      this.velZ[slot] = (Math.random() - 0.5) * 0.8;

      const pColor = colors[Math.floor(Math.random() * colors.length)];
      this.setColorAt(slot, pColor);

      this.alphas[slot] = 0.75;
      const sz = 0.16 + Math.random() * 0.12;
      this.sizes[slot] = sz;
      this.initialSizes[slot] = sz;

      this.life[slot] = 0;
      this.maxLife[slot] = 2.5 + Math.random() * 1.5;
      this.gravity[slot] = 0;
      this.drag[slot] = 0.02;
    }
    this.markBuffersUpdated();
  }

  public update(deltaTime: number): void {
    if (this.activeCount === 0) {
      if (this.geometry.drawRange.count !== 0) {
        this.geometry.setDrawRange(0, 0);
      }
      return;
    }

    const decayFactor = Math.min(1.0, deltaTime * 60);

    for (let i = this.activeCount - 1; i >= 0; i--) {
      this.life[i] += deltaTime;
      const maxL = this.maxLife[i];

      if (this.life[i] >= maxL) {
        // Swap-and-pop with the last active particle
        const last = this.activeCount - 1;
        if (i !== last) {
          const pIdx = i * 3;
          const lastPIdx = last * 3;
          this.positions[pIdx] = this.positions[lastPIdx];
          this.positions[pIdx + 1] = this.positions[lastPIdx + 1];
          this.positions[pIdx + 2] = this.positions[lastPIdx + 2];

          this.colors[pIdx] = this.colors[lastPIdx];
          this.colors[pIdx + 1] = this.colors[lastPIdx + 1];
          this.colors[pIdx + 2] = this.colors[lastPIdx + 2];

          this.alphas[i] = this.alphas[last];
          this.sizes[i] = this.sizes[last];
          this.initialSizes[i] = this.initialSizes[last];

          this.velX[i] = this.velX[last];
          this.velY[i] = this.velY[last];
          this.velZ[i] = this.velZ[last];
          this.gravity[i] = this.gravity[last];
          this.drag[i] = this.drag[last];
          this.life[i] = this.life[last];
          this.maxLife[i] = this.maxLife[last];
        }
        this.activeCount--;
        continue;
      }

      // Physics Kinematics
      this.velY[i] += this.gravity[i] * deltaTime;
      const dragCoeff = 1.0 - (1.0 - this.drag[i]) * decayFactor;
      this.velX[i] *= dragCoeff;
      this.velZ[i] *= dragCoeff;

      const pIdx = i * 3;
      this.positions[pIdx] += this.velX[i] * deltaTime;
      this.positions[pIdx + 1] += this.velY[i] * deltaTime;
      this.positions[pIdx + 2] += this.velZ[i] * deltaTime;

      // Floor bounce & friction
      if (this.positions[pIdx + 1] < 0.05) {
        this.positions[pIdx + 1] = 0.05;
        if (this.velY[i] < 0) {
          this.velY[i] = -this.velY[i] * 0.35;
        }
        this.velX[i] *= 0.8;
        this.velZ[i] *= 0.8;
      }

      const progress = this.life[i] / maxL;
      this.alphas[i] = Math.max(0, 1.0 - progress);
      this.sizes[i] = this.initialSizes[i] * (1.0 - progress * 0.4);
    }

    this.markBuffersUpdated();
  }

  private markBuffersUpdated(): void {
    this.geometry.setDrawRange(0, this.activeCount);
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.alphaAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
  }

  public clear(): void {
    this.activeCount = 0;
    this.geometry.setDrawRange(0, 0);
  }

  public dispose(): void {
    this.clear();
    if (this.pointsMesh.parent) {
      this.pointsMesh.parent.remove(this.pointsMesh);
    }
    this.geometry.dispose();
    this.material.dispose();
    this.scene = null;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getMaxParticles(): number {
    return this.maxParticles;
  }

  public getMesh(): THREE.Points {
    return this.pointsMesh;
  }
}
