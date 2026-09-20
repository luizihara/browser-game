import { PALETTE } from '../art/Palette';

export const WORLD_CONFIG = {
  size: 200,
  groundColor: PALETTE.environment.groundBase,
  gridColor1: PALETTE.environment.groundTileA,
  gridColor2: PALETTE.environment.groundGrid,
  gridDivisions: 100,

  // Arena Boundaries
  arenaWidth: 100,
  arenaDepth: 100,
  wallHeight: 1.4,
  wallThickness: 0.8,
  wallColor: PALETTE.environment.wallStone,
  wallEmissive: 0x1e293b,
  wallEmissiveIntensity: 0.05,

  // Stylized Toon Lighting
  hemisphereSkyColor: PALETTE.lighting.skyAmbient,
  hemisphereGroundColor: PALETTE.lighting.groundAmbient,
  hemisphereIntensity: 0.85,
  directionalColor: PALETTE.lighting.sunLight,
  directionalIntensity: 1.35,
  directionalPosition: { x: 30, y: 50, z: 25 },
} as const;
