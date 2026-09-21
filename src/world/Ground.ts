import * as THREE from 'three';
import { WORLD_CONFIG } from '../config/worldConfig';
import { PALETTE } from '../art/Palette';
import { ToonMaterialFactory } from '../art/ToonMaterialFactory';
import type { StageId } from '../config/stageConfig';
import type { Disposable } from '../types';

export class Ground implements Disposable {
  private mesh: THREE.Mesh;
  private arenaBorderLine: THREE.LineLoop | null = null;
  private currentBiome: StageId = 'verdant';

  public getCurrentBiome(): StageId {
    return this.currentBiome;
  }

  constructor() {
    const segments = 60;
    const geometry = new THREE.PlaneGeometry(
      WORLD_CONFIG.size,
      WORLD_CONFIG.size,
      segments,
      segments
    );

    const count = geometry.attributes.position!.count;
    const colors = new Float32Array(count * 3);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshToonMaterial({
      gradientMap: ToonMaterialFactory.getGradientMap(),
      vertexColors: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;

    // Apply initial verdant coloration
    this.applyBiomeColors(
      PALETTE.environment.groundBase,
      PALETTE.environment.groundTileA,
      PALETTE.environment.groundTileB,
      'verdant'
    );

    // Soft stylized boundary outline on the ground
    const halfW = WORLD_CONFIG.arenaWidth / 2;
    const halfD = WORLD_CONFIG.arenaDepth / 2;
    const borderPoints = [
      new THREE.Vector3(-halfW, 0.03, -halfD),
      new THREE.Vector3(halfW, 0.03, -halfD),
      new THREE.Vector3(halfW, 0.03, halfD),
      new THREE.Vector3(-halfW, 0.03, halfD),
    ];
    const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
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

  public applyBiomeColors(
    baseColor: number,
    tileA: number,
    tileB: number,
    biome: StageId = 'verdant'
  ): void {
    this.currentBiome = biome;
    const geometry = this.mesh.geometry as THREE.PlaneGeometry;
    const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
    if (!colorAttr) return;

    const colors = colorAttr.array as Float32Array;
    const count = geometry.attributes.position!.count;
    const posAttr = geometry.attributes.position!;

    const colorBase = new THREE.Color(baseColor);
    const colorTileA = new THREE.Color(tileA);
    const colorTileB = new THREE.Color(tileB);
    const tempColor = new THREE.Color();
    const plazaCenterColor = new THREE.Color(
      biome === 'inferno' ? 0x292524 : biome === 'glacial' ? 0x0284c7 : 0x78716c
    );
    const plazaRuneColor = new THREE.Color(
      biome === 'inferno' ? 0xf97316 : biome === 'glacial' ? 0x38bdf8 : 0xfbbf24
    );
    const pathColor = new THREE.Color(
      biome === 'inferno' ? 0x44403c : biome === 'glacial' ? 0x075985 : 0x854d0e
    );
    const fissureGlowColor = new THREE.Color(
      biome === 'inferno' ? 0xef4444 : biome === 'glacial' ? 0x7dd3fc : 0x84cc16
    );

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const distFromCenter = Math.sqrt(x * x + y * y);

      // Multi-octave organic noise for soft, natural ground shading
      const n1 = Math.sin(x * 0.08) * Math.cos(y * 0.08);
      const n2 = Math.sin(x * 0.22 + y * 0.18) * 0.5;
      const n3 = Math.cos(x * 0.45 - y * 0.35) * 0.25;
      const noise = (n1 + n2 + n3) * 0.5 + 0.5;
      const factor = Math.min(1.0, Math.max(0, noise));

      if (factor < 0.5) {
        tempColor.lerpColors(colorTileB, colorBase, factor * 2);
      } else {
        tempColor.lerpColors(colorBase, colorTileA, (factor - 0.5) * 2);
      }

      // 1. Central Sacred Sanctuary Plaza (dist < 6.5)
      if (distFromCenter < 6.5) {
        const ringStep = Math.sin(distFromCenter * Math.PI * 1.5);
        if (distFromCenter < 1.6) {
          tempColor.lerp(plazaCenterColor, 0.7);
        } else if (distFromCenter >= 2.6 && distFromCenter <= 3.4) {
          // Inner glowing runic circle
          tempColor.lerp(plazaRuneColor, 0.65);
        } else if (distFromCenter >= 5.6 && distFromCenter <= 6.5) {
          // Outer carved stone curb
          tempColor.lerp(plazaCenterColor, 0.8);
        } else {
          tempColor.lerp(plazaCenterColor, 0.4 + ringStep * 0.15);
        }
      }
      // 2. Cardinal Avenues & Concentric Outer Rings
      else if ((Math.abs(x) < 2.2 || Math.abs(y) < 2.2) && distFromCenter < 28) {
        const pathFactor = Math.abs(Math.abs(x) < 2.2 ? x : y) / 2.2;
        tempColor.lerp(pathColor, (1.0 - pathFactor) * 0.45);
      } else if (Math.abs(distFromCenter - 14.5) < 1.2 || Math.abs(distFromCenter - 21.0) < 1.0) {
        // Concentric paved outer rings connecting the avenues
        tempColor.lerp(pathColor, 0.35);
      }

      // 3. Biome-specific Fissures & Veins
      if (biome === 'inferno') {
        const fissureNoise = Math.abs(Math.sin(x * 0.32 + Math.cos(y * 0.28) * 2.2));
        if (fissureNoise < 0.08 && distFromCenter > 7) {
          tempColor.lerp(fissureGlowColor, 0.85);
        }
      } else if (biome === 'glacial') {
        const frostCracks = Math.abs(Math.cos(x * 0.28 - Math.sin(y * 0.32) * 2.0));
        if (frostCracks < 0.07 && distFromCenter > 7) {
          tempColor.lerp(fissureGlowColor, 0.75);
        }
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    colorAttr.needsUpdate = true;

    // Update border line color according to active biome
    if (this.arenaBorderLine) {
      const mat = this.arenaBorderLine.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.color.setHex(
          biome === 'inferno' ? 0xf97316 : biome === 'glacial' ? 0x38bdf8 : 0x84cc16
        );
      }
    }
  }
}
