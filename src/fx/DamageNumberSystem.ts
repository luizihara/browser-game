import * as THREE from 'three';
import { SettingsManager } from '../config/settingsConfig';
import type { Disposable } from '../types';

export type DamageNumberType =
  | 'default'
  | 'crit'
  | 'magic'
  | 'holy'
  | 'shadow'
  | 'hero'
  | 'heal';

interface PooledDamageNumber {
  element: HTMLSpanElement;
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const POOL_SIZE = 60;

export class DamageNumberSystem implements Disposable {
  private container: HTMLDivElement | null = null;
  private pool: PooledDamageNumber[] = [];
  private nextPoolIndex: number = 0;
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private enabled: boolean = true;
  private unsubscribeSettings: (() => void) | null = null;

  constructor() {
    this.unsubscribeSettings = SettingsManager.getInstance().subscribe((s) => {
      this.enabled = s.damageNumbers;
      if (!this.enabled) {
        this.clear();
      }
    });
  }

  public mount(parent: HTMLElement): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'damage-numbers-container';
    parent.appendChild(this.container);

    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      const span = document.createElement('span');
      span.className = 'dmg-num';
      span.style.display = 'none';
      this.container.appendChild(span);

      this.pool.push({
        element: span,
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0.65,
      });
    }
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    amount: number | string,
    type: DamageNumberType = 'default',
    isCrit: boolean = false
  ): void {
    if (!this.enabled || !this.container) return;

    // Grab next item in pool
    const item = this.pool[this.nextPoolIndex];
    this.nextPoolIndex = (this.nextPoolIndex + 1) % POOL_SIZE;

    item.active = true;
    // Slight random offset to avoid overlapping numbers
    item.x = x + (Math.random() - 0.5) * 0.5;
    item.y = y + 0.6 + Math.random() * 0.2;
    item.z = z + (Math.random() - 0.5) * 0.5;
    item.vx = (Math.random() - 0.5) * 0.8;
    item.vy = isCrit ? 2.4 : 1.6;
    item.life = isCrit ? 0.8 : 0.6;
    item.maxLife = item.life;

    const el = item.element;
    const effectiveType = isCrit ? 'crit' : type;

    // Reset and apply styling classes
    el.className = `dmg-num dmg-${effectiveType}`;
    if (isCrit) {
      el.textContent = `CRIT! ${amount}`;
    } else if (type === 'heal') {
      el.textContent = `+${amount}`;
    } else if (type === 'hero') {
      el.textContent = `-${amount}`;
    } else {
      el.textContent = `${amount}`;
    }

    el.style.display = 'block';
    el.style.opacity = '1';
  }

  public update(
    deltaTime: number,
    camera: THREE.Camera,
    viewportWidth: number,
    viewportHeight: number
  ): void {
    if (!this.enabled || !this.container) return;

    const halfW = viewportWidth * 0.5;
    const halfH = viewportHeight * 0.5;

    for (let i = 0; i < POOL_SIZE; i++) {
      const item = this.pool[i];
      if (!item.active) continue;

      item.life -= deltaTime;
      if (item.life <= 0) {
        item.active = false;
        item.element.style.display = 'none';
        continue;
      }

      // Physics progression
      item.x += item.vx * deltaTime;
      item.y += item.vy * deltaTime;
      item.vy -= 2.0 * deltaTime; // gentle gravity deceleration

      // Project world coords to screen
      this.tempVec.set(item.x, item.y, item.z);
      this.tempVec.project(camera);

      // Behind the camera frustum check
      if (this.tempVec.z < -1.0 || this.tempVec.z > 1.0) {
        item.element.style.display = 'none';
        continue;
      }

      const screenX = this.tempVec.x * halfW + halfW;
      const screenY = -this.tempVec.y * halfH + halfH;

      // Off-screen check
      if (
        screenX < -60 ||
        screenX > viewportWidth + 60 ||
        screenY < -60 ||
        screenY > viewportHeight + 60
      ) {
        item.element.style.display = 'none';
        continue;
      }

      const progress = 1.0 - item.life / item.maxLife;
      const opacity = progress > 0.6 ? (1.0 - progress) / 0.4 : 1.0;

      item.element.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
      item.element.style.opacity = opacity.toFixed(2);
    }
  }

  public clear(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
      this.pool[i].element.style.display = 'none';
    }
  }

  public dispose(): void {
    if (this.unsubscribeSettings) {
      this.unsubscribeSettings();
      this.unsubscribeSettings = null;
    }
    this.clear();
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
    this.pool = [];
  }
}
