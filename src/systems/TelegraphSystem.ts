import * as THREE from 'three';
import type { Disposable } from '../types';

interface CircleTelegraphSlot {
  active: boolean;
  group: THREE.Group;
  outerRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  innerFill: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
  x: number;
  z: number;
  targetRadius: number;
  elapsed: number;
  duration: number;
  onComplete: (() => void) | null;
}

interface RectTelegraphSlot {
  active: boolean;
  group: THREE.Group;
  borderMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  fillMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  startX: number;
  startZ: number;
  dirX: number;
  dirZ: number;
  width: number;
  length: number;
  elapsed: number;
  duration: number;
  onComplete: (() => void) | null;
}

const MAX_CIRCLES = 16;
const MAX_RECTS = 6;

export class TelegraphSystem implements Disposable {
  private scene: THREE.Scene | null = null;
  private rootGroup: THREE.Group = new THREE.Group();
  private circles: CircleTelegraphSlot[] = [];
  private rects: RectTelegraphSlot[] = [];

  constructor(scene?: THREE.Scene) {
    this.initPools();
    if (scene) {
      this.setScene(scene);
    }
  }

  public setScene(scene: THREE.Scene): void {
    if (this.scene === scene) return;
    if (this.scene) {
      this.scene.remove(this.rootGroup);
    }
    this.scene = scene;
    this.scene.add(this.rootGroup);
  }

  private initPools(): void {
    // 1. Pre-allocate circular telegraphs
    for (let i = 0; i < MAX_CIRCLES; i++) {
      const group = new THREE.Group();
      group.visible = false;
      group.position.y = 0.05;

      const ringGeo = new THREE.RingGeometry(0.96, 1.0, 32);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const outerRing = new THREE.Mesh(ringGeo, ringMat);
      group.add(outerRing);

      const circleGeo = new THREE.CircleGeometry(0.96, 32);
      circleGeo.rotateX(-Math.PI / 2);
      const circleMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const innerFill = new THREE.Mesh(circleGeo, circleMat);
      group.add(innerFill);

      this.rootGroup.add(group);
      this.circles.push({
        active: false,
        group,
        outerRing,
        innerFill,
        x: 0,
        z: 0,
        targetRadius: 1,
        elapsed: 0,
        duration: 1,
        onComplete: null,
      });
    }

    // 2. Pre-allocate rectangular telegraphs
    for (let i = 0; i < MAX_RECTS; i++) {
      const group = new THREE.Group();
      group.visible = false;
      group.position.y = 0.05;

      const borderGeo = new THREE.PlaneGeometry(1, 1);
      borderGeo.rotateX(-Math.PI / 2);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.65,
        wireframe: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      group.add(borderMesh);

      const fillGeo = new THREE.PlaneGeometry(1, 1);
      fillGeo.rotateX(-Math.PI / 2);
      const fillMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      group.add(fillMesh);

      this.rootGroup.add(group);
      this.rects.push({
        active: false,
        group,
        borderMesh,
        fillMesh,
        startX: 0,
        startZ: 0,
        dirX: 0,
        dirZ: 1,
        width: 1,
        length: 1,
        elapsed: 0,
        duration: 1,
        onComplete: null,
      });
    }
  }

  public spawnCircle(
    x: number,
    z: number,
    radius: number,
    duration: number,
    onComplete?: () => void
  ): boolean {
    const slot = this.circles.find((c) => !c.active);
    if (!slot) return false;

    slot.active = true;
    slot.x = x;
    slot.z = z;
    slot.targetRadius = radius;
    slot.elapsed = 0;
    slot.duration = Math.max(0.1, duration);
    slot.onComplete = onComplete ?? null;

    slot.group.position.set(x, 0.05, z);
    slot.group.visible = true;

    // Scale outer ring to full radius
    slot.outerRing.scale.set(radius, 1, radius);
    slot.innerFill.scale.set(0.01, 1, 0.01);
    slot.innerFill.material.opacity = 0.25;

    return true;
  }

  public spawnRect(
    startX: number,
    startZ: number,
    dirX: number,
    dirZ: number,
    width: number,
    length: number,
    duration: number,
    onComplete?: () => void
  ): boolean {
    const slot = this.rects.find((r) => !r.active);
    if (!slot) return false;

    slot.active = true;
    slot.startX = startX;
    slot.startZ = startZ;
    slot.dirX = dirX;
    slot.dirZ = dirZ;
    slot.width = width;
    slot.length = length;
    slot.elapsed = 0;
    slot.duration = Math.max(0.1, duration);
    slot.onComplete = onComplete ?? null;

    const angle = Math.atan2(dirX, dirZ);
    slot.group.rotation.y = angle;

    // Center the group halfway along the length
    const midX = startX + (dirX * length) / 2;
    const midZ = startZ + (dirZ * length) / 2;
    slot.group.position.set(midX, 0.05, midZ);
    slot.group.visible = true;

    slot.borderMesh.scale.set(width, 1, length);
    slot.fillMesh.scale.set(width, 1, 0.01);

    return true;
  }

  public update(deltaTime: number): void {
    // 1. Update active circles
    for (let i = 0; i < this.circles.length; i++) {
      const c = this.circles[i];
      if (!c.active) continue;

      c.elapsed += deltaTime;
      const progress = Math.min(1.0, c.elapsed / c.duration);

      // Expand inner fill
      const currentFillRadius = c.targetRadius * progress;
      c.innerFill.scale.set(currentFillRadius, 1, currentFillRadius);

      // Pulse opacity as it nears completion
      const pulse = 0.3 + Math.sin(c.elapsed * 18.0) * 0.15;
      c.innerFill.material.opacity = pulse + progress * 0.3;

      if (c.elapsed >= c.duration) {
        c.active = false;
        c.group.visible = false;
        if (c.onComplete) {
          c.onComplete();
        }
      }
    }

    // 2. Update active rects
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      if (!r.active) continue;

      r.elapsed += deltaTime;
      const progress = Math.min(1.0, r.elapsed / r.duration);

      // Scale fill forward along the length
      r.fillMesh.scale.set(r.width, 1, r.length * progress);
      r.fillMesh.position.z = (-r.length * (1 - progress)) / 2;

      const pulse = 0.3 + Math.sin(r.elapsed * 18.0) * 0.15;
      r.fillMesh.material.opacity = pulse + progress * 0.3;

      if (r.elapsed >= r.duration) {
        r.active = false;
        r.group.visible = false;
        if (r.onComplete) {
          r.onComplete();
        }
      }
    }
  }

  public clear(): void {
    for (let i = 0; i < this.circles.length; i++) {
      this.circles[i].active = false;
      this.circles[i].group.visible = false;
      this.circles[i].onComplete = null;
    }
    for (let i = 0; i < this.rects.length; i++) {
      this.rects[i].active = false;
      this.rects[i].group.visible = false;
      this.rects[i].onComplete = null;
    }
  }

  public dispose(): void {
    this.clear();
    if (this.scene) {
      this.scene.remove(this.rootGroup);
    }
    this.rootGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.circles = [];
    this.rects = [];
    this.scene = null;
  }
}
