export const PLAYER_CONFIG = {
  speed: 8, // units per second
  radius: 0.5,
  height: 1.5,
  color: 0x3182ce,
  accentColor: 0x63b3ed,
  initialPosition: { x: 0, y: 0.75, z: 0 },
  maxHp: 100,
  visorSize: { width: 0.3, height: 0.15, depth: 0.3 },
  visorOffsetY: 0.3,
} as const;
