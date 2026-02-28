/** Scale factor: store uses centimeters, Three.js uses meters */
export const CM_TO_M = 0.01

/** Wall panel depth in meters */
export const WALL_DEPTH = 0.05

/** How far holds protrude from the wall surface (meters) */
export const HOLD_SURFACE_OFFSET = 0.03

export const CAMERA = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 100,
  INITIAL_DISTANCE: 6,
} as const

export const ORBIT_CONTROLS = {
  MIN_POLAR_ANGLE: Math.PI / 6,     // 30° - prevent looking from directly above
  MAX_POLAR_ANGLE: (Math.PI * 2) / 3, // 120° - prevent looking from below
  MIN_AZIMUTH_ANGLE: -Math.PI / 4,  // -45°
  MAX_AZIMUTH_ANGLE: Math.PI / 4,   // 45°
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 15,
} as const

export const WALL_LIMITS = {
  WIDTH_MIN: 100,
  WIDTH_MAX: 1000,
  HEIGHT_MIN: 100,
  HEIGHT_MAX: 550,
  ANGLE_MIN: -15,
  ANGLE_MAX: 60,
} as const

export const KEYBOARD_SHORTCUTS = {
  DELETE_HOLD: ['Backspace', 'Delete'],
} as const
