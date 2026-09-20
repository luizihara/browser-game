import * as THREE from 'three';

export interface ToonMaterialOptions {
  emissive?: number;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  wireframe?: boolean;
}

/**
 * Factory for MeshToonMaterial with procedural discrete gradient maps.
 * Implements strict material pooling and sharing to ensure Zero-GC and minimal GPU draw calls.
 */
export class ToonMaterialFactory {
  private static gradientMap: THREE.DataTexture | null = null;
  private static materialCache: Map<string, THREE.MeshToonMaterial> = new Map();

  /**
   * Lazily generates a 3-step discrete cel-shading ramp.
   * Step 0: Shadow (40% brightness)
   * Step 1: Mid-tone (75% brightness)
   * Step 2: Highlight (100% brightness)
   */
  public static getGradientMap(): THREE.DataTexture {
    if (!this.gradientMap) {
      const width = 3;
      const height = 1;
      const data = new Uint8Array([
        100, 100, 100, 255, // Shadow
        190, 190, 190, 255, // Mid-tone
        255, 255, 255, 255, // Highlight
      ]);

      const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;

      this.gradientMap = texture;
    }
    return this.gradientMap;
  }

  /**
   * Retrieves or creates a pooled MeshToonMaterial.
   */
  public static getMaterial(
    color: number,
    options: ToonMaterialOptions = {}
  ): THREE.MeshToonMaterial {
    const emissive = options.emissive ?? 0x000000;
    const emissiveIntensity = options.emissiveIntensity ?? 0;
    const transparent = options.transparent ?? false;
    const opacity = options.opacity ?? 1.0;
    const wireframe = options.wireframe ?? false;

    const key = `${color}_${emissive}_${emissiveIntensity}_${transparent}_${opacity}_${wireframe}`;
    const cached = this.materialCache.get(key);
    if (cached) {
      return cached;
    }

    const material = new THREE.MeshToonMaterial({
      color,
      gradientMap: this.getGradientMap(),
      emissive,
      emissiveIntensity,
      transparent,
      opacity,
      wireframe,
    });

    this.materialCache.set(key, material);
    return material;
  }

  /**
   * Disposes all pooled materials and the gradient texture.
   */
  public static clear(): void {
    this.materialCache.forEach((mat) => mat.dispose());
    this.materialCache.clear();
    if (this.gradientMap) {
      this.gradientMap.dispose();
      this.gradientMap = null;
    }
  }
}
