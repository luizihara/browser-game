/**
 * Centralized color palette for the Stylized Low-Poly Toon Survivor visual direction.
 * Ensures chromatic hierarchy:
 * - Environment: Gentle natural tones (30-50% saturation)
 * - Enemies: High-contrast threat colors (70-85% saturation)
 * - Player: Vibrant heroic colors (90-100% saturation)
 * - VFX & Pickups: Bright emissives
 */
export const PALETTE = {
  // Environment & World
  environment: {
    groundBase: 0x3d6647,
    groundTileA: 0x43704e,
    groundTileB: 0x375d40,
    groundGrid: 0x2b4a33,
    wallStone: 0x475569,
    wallTop: 0x64748b,
    wallRuin: 0x334155,
    treeWood: 0x5c4033,
    treeFoliageA: 0x2d6a4f,
    treeFoliageB: 0x40916c,
    rockDark: 0x495057,
    rockLight: 0x6c757d,
    grassBlade: 0x52b788,
    flowerGold: 0xfbbf24,
    flowerBlue: 0x38bdf8,
    flowerPink: 0xf472b6,
    mushroomCap: 0x00f2fe,
    mushroomStem: 0xf1f5f9,
    pavingStone: 0x64748b,
    pavingStoneTrim: 0x94a3b8,
  },

  // Lighting
  lighting: {
    sunLight: 0xfff8ee,
    skyAmbient: 0xd9eafd,
    groundAmbient: 0xb5d6b2,
  },

  // Hero / Player
  player: {
    tunic: 0x1e56a0,
    armorWhite: 0xf1f5f9,
    trimGold: 0xf6c90e,
    visorGlow: 0x00f2fe,
    bootsLeather: 0x4a2810,
    staffWood: 0x6e473b,
    staffGem: 0x38ef7d,
  },

  // Enemies & Archetypes
  enemies: {
    stalkerBody: 0xd63031,
    stalkerAccent: 0xe17055,
    stalkerEyes: 0xffeaa7,

    skittererBody: 0x6c5ce7,
    skittererLegs: 0x4834d4,
    skittererEyes: 0xfd79a8,

    bruteBody: 0x2d3436,
    bruteCrags: 0x636e72,
    bruteMagma: 0xe17055,
    bruteEyes: 0xff7675,

    goliathArmor: 0x1e272e,
    goliathGold: 0xf1c40f,
    goliathHalo: 0xffd700,
    goliathGlow: 0xe67e22,
  },

  // VFX, Pickups & Highlights
  vfx: {
    xpGemGreen: 0x2ecc71,
    xpGemBlue: 0x3498db,
    xpGemGold: 0xf1c40f,
    hitFlash: 0xffffff,
    shadowTint: 0x1a2e22,
  },
} as const;
