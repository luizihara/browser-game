export const WORLD_CONFIG = {
  size: 200,
  groundColor: 0x1a202c,
  gridColor1: 0x2d3748,
  gridColor2: 0x4a5568,
  gridDivisions: 100,
  // Arena Boundaries
  arenaWidth: 100,
  arenaDepth: 100,
  wallHeight: 1.2,
  wallThickness: 0.6,
  wallColor: 0x2d3748,
  wallEmissive: 0x3182ce,
  wallEmissiveIntensity: 0.15,
  // Lighting
  hemisphereSkyColor: 0xffffff,
  hemisphereGroundColor: 0x222233,
  hemisphereIntensity: 0.6,
  directionalColor: 0xfff5ea,
  directionalIntensity: 1.2,
  directionalPosition: { x: 20, y: 40, z: 20 },
} as const;
