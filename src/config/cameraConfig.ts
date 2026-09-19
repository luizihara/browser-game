export const CAMERA_CONFIG = {
  fov: 50,
  near: 0.1,
  far: 1000,
  // Top-down / isometric angle offset relative to player
  offset: {
    x: 0,
    y: 16,
    z: 12,
  },
  lookAtOffset: {
    x: 0,
    y: 0.5,
    z: 0,
  },
  smoothFactor: 8.0, // Used with deltaTime for frame-rate independent dampening
} as const;
