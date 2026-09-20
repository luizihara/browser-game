import * as THREE from 'three';
import type { Player } from '../entities/player/Player';
import type { Enemy } from '../entities/enemy/Enemy';
import type { Boss } from '../entities/boss/Boss';
import type { PickupItem } from '../entities/pickup/PickupItem';
import type { ArenaBounds } from '../world/ArenaBounds';
import type { Disposable } from '../types';

interface OffscreenPointer {
  element: HTMLDivElement;
  textElement: HTMLSpanElement;
  active: boolean;
}

const MAX_POINTERS = 4;

export class RadarSystem implements Disposable {
  private container: HTMLDivElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private pointersContainer: HTMLDivElement | null = null;
  private pointers: OffscreenPointer[] = [];

  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private readonly radarRadius: number = 60; // radius in px
  private readonly radarCenter: number = 70; // center in px (canvas 140x140)

  public mount(parent: HTMLElement): void {
    if (this.container) return;

    // 1. Radar Minimap HUD Element
    this.container = document.createElement('div');
    this.container.className = 'radar-minimap-container';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 140;
    this.canvas.height = 140;
    this.canvas.className = 'radar-canvas';
    this.ctx = this.canvas.getContext('2d');

    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);

    // 2. Offscreen Threat Pointers Container
    this.pointersContainer = document.createElement('div');
    this.pointersContainer.className = 'threat-pointers-container';
    parent.appendChild(this.pointersContainer);

    for (let i = 0; i < MAX_POINTERS; i++) {
      const ptr = document.createElement('div');
      ptr.className = 'threat-pointer';
      ptr.style.display = 'none';

      const label = document.createElement('span');
      label.className = 'threat-pointer-label';
      ptr.appendChild(label);

      this.pointersContainer.appendChild(ptr);
      this.pointers.push({
        element: ptr,
        textElement: label,
        active: false,
      });
    }
  }

  public update(
    player: Player | null,
    boss: Boss | null,
    enemies: readonly Enemy[],
    pickups: readonly PickupItem[],
    bounds: ArenaBounds | null,
    camera: THREE.Camera,
    viewportW: number,
    viewportH: number
  ): void {
    if (!this.ctx || !player) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, 140, 140);

    // 1. Draw Radar Background & Grid
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.radarCenter, this.radarCenter, this.radarRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.stroke();
    ctx.clip();

    // Subtle concentric radar rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.radarCenter, this.radarCenter, this.radarRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Arena Bounds conversion
    const halfArena = bounds ? bounds.halfSize : 30;
    const worldToRadarScale = (this.radarRadius * 0.88) / halfArena;

    const px = player.position.x;
    const pz = player.position.z;

    // Draw Pickups (Chests / Potions)
    for (let i = 0; i < pickups.length; i++) {
      const item = pickups[i];
      if (item.isCollected) continue;

      const relX = (item.position.x - px) * worldToRadarScale;
      const relZ = (item.position.z - pz) * worldToRadarScale;
      const drawX = this.radarCenter + relX;
      const drawY = this.radarCenter + relZ;

      ctx.beginPath();
      ctx.arc(drawX, drawY, item.pickupType === 'chest' ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = item.pickupType === 'chest' ? '#facc15' : '#4ade80';
      ctx.fill();
    }

    // Draw Elite Enemies
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (e.isDead || e.type !== 'elite') continue;

      const relX = (e.position.x - px) * worldToRadarScale;
      const relZ = (e.position.z - pz) * worldToRadarScale;
      const drawX = this.radarCenter + relX;
      const drawY = this.radarCenter + relZ;

      ctx.beginPath();
      ctx.arc(drawX, drawY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }

    // Draw Boss
    if (boss && !boss.isDead) {
      const relX = (boss.position.x - px) * worldToRadarScale;
      const relZ = (boss.position.z - pz) * worldToRadarScale;
      const drawX = this.radarCenter + relX;
      const drawY = this.radarCenter + relZ;

      ctx.beginPath();
      ctx.arc(drawX, drawY, 5.0, 0, Math.PI * 2);
      ctx.fillStyle = '#c084fc';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw Player in Center
    ctx.beginPath();
    ctx.arc(this.radarCenter, this.radarCenter, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // 2. Update Off-Screen Threat Pointers (Target Boss or Elites)
    this.updateOffscreenPointers(player, boss, camera, viewportW, viewportH);
  }

  private updateOffscreenPointers(
    player: Player,
    boss: Boss | null,
    camera: THREE.Camera,
    viewportW: number,
    viewportH: number
  ): void {
    // Reset all pointers
    for (let i = 0; i < this.pointers.length; i++) {
      this.pointers[i].active = false;
      this.pointers[i].element.style.display = 'none';
    }

    if (!boss || boss.isDead) return;

    // Check if boss is offscreen
    this.tempVec.set(boss.position.x, boss.position.y, boss.position.z);
    this.tempVec.project(camera);

    const isBehind = this.tempVec.z > 1.0 || this.tempVec.z < -1.0;
    const screenX = (this.tempVec.x * 0.5 + 0.5) * viewportW;
    const screenY = (-this.tempVec.y * 0.5 + 0.5) * viewportH;

    const margin = 45;
    const isOffscreen =
      isBehind ||
      screenX < margin ||
      screenX > viewportW - margin ||
      screenY < margin ||
      screenY > viewportH - margin;

    if (isOffscreen && this.pointers[0]) {
      const ptr = this.pointers[0];
      ptr.active = true;

      const centerScreenX = viewportW * 0.5;
      const centerScreenY = viewportH * 0.5;

      let dirX = screenX - centerScreenX;
      let dirY = screenY - centerScreenY;
      if (isBehind) {
        dirX = -dirX;
        dirY = -dirY;
      }

      const angle = Math.atan2(dirY, dirX);
      const edgeX = Math.max(margin, Math.min(viewportW - margin, centerScreenX + Math.cos(angle) * (viewportW * 0.45)));
      const edgeY = Math.max(margin, Math.min(viewportH - margin, centerScreenY + Math.sin(angle) * (viewportH * 0.45)));

      const dist = Math.round(
        Math.sqrt(
          (boss.position.x - player.position.x) ** 2 +
          (boss.position.z - player.position.z) ** 2
        )
      );

      ptr.element.style.display = 'flex';
      ptr.element.style.transform = `translate3d(${edgeX.toFixed(1)}px, ${edgeY.toFixed(1)}px, 0)`;
      ptr.textElement.textContent = `💀 ${dist}m`;
    }
  }

  public clear(): void {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, 140, 140);
    }
    for (let i = 0; i < this.pointers.length; i++) {
      this.pointers[i].active = false;
      this.pointers[i].element.style.display = 'none';
    }
  }

  public dispose(): void {
    this.clear();
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
      this.container = null;
    }
    if (this.pointersContainer && this.pointersContainer.parentElement) {
      this.pointersContainer.parentElement.removeChild(this.pointersContainer);
      this.pointersContainer = null;
    }
    this.pointers = [];
    this.canvas = null;
    this.ctx = null;
  }
}
