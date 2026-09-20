import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import { PALETTE } from '../art/Palette';
import { ToonMaterialFactory } from '../art/ToonMaterialFactory';
import type { Disposable } from '../types';

export class Ground implements Disposable {
  private mesh: THREE.Mesh;
  private arenaBorderLine: THREE.LineLoop | null = null;

  constructor() {
    const segments = 40;
    const geometry = new THREE.PlaneGeometry(
      WORLD_CONFIG.size,
      WORLD_CONFIG.size,
      segments,
      segments
    );

    // Apply vertex colors with soft pastel variations to create a stylized meadow pattern
    const count = geometry.attributes.position!.count;
    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color(PALETTE.environment.groundBase);
    const colorB = new THREE.Color(PALETTE.environment.groundTileA);
    const colorC = new THREE.Color(PALETTE.environment.groundTileB);
    const tempColor = new THREE.Color();

    const posAttr = geometry.attributes.position!;

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);

      // Procedural soft noise variation based on coordinates
      const val = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      const checker = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0 ? 0.15 : 0;
      const factor = Math.min(1.0, Math.max(0, val * 0.8 + checker));

      if (factor < 0.5) {
        tempColor.lerpColors(colorC, colorA, factor * 2);
      } else {
        tempColor.lerpColors(colorA, colorB, (factor - 0.5) * 2);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshToonMaterial({
      gradientMap: ToonMaterialFactory.getGradientMap(),
      vertexColors: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;

    // Soft stylized boundary outline on the ground
    const halfW = WORLD_CONFIG.arenaWidth / 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2;
    const borderPoints = [
      new THREE.Vector3(-halfW, 0.02, -halfD),
      new THREE.Vector3(halfW, 0.02, -halfD),
      new THREE.Vector3(halfW, 0.02, halfD),
      new THREE.Vector3(-halfW, 0.02, halfD),
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({
      color: PALETTE.environment.groundGrid,
      linewidth: 2,
    });
    this.arenaBorderLine = new THREE.LineLoop(borderGeo, borderMat);
  }

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.mesh);
    if (this.arenaBorderLine) {
      scene.add(this.arenaBorderLine);
    }
  }

  public removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.mesh);
    if (this.arenaBorderLine) {
      scene.remove(this.arenaBorderLine);
    }
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
    if (this.arenaBorderLine) {
      this.arenaBorderLine.geometry.dispose();
      (this.arenaBorderLine.material as THREE.Material).dispose();
      this.arenaBorderLine = null;
    }
  }
}
