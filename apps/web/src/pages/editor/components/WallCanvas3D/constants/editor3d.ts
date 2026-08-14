/** Scale factor: store uses centimeters, Three.js uses meters */
export const CM_TO_M = 0.01

/** Wall panel depth in meters (thicker = more realistic visual weight) */
export const WALL_DEPTH = 0.08

/** Hold base offset into the wall (meters). Just enough to stop z-fighting;
    deeper embedding visibly sinks holds at glancing view angles */
export const HOLD_EMBED_DEPTH = 0.002

export const CAMERA = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 100,
  INITIAL_DISTANCE: 6,
} as const

export const ORBIT_CONTROLS = {
  MIN_POLAR_ANGLE: Math.PI / 6,       // 30°
  MAX_POLAR_ANGLE: (Math.PI * 2) / 3, // 120°
  MIN_AZIMUTH_ANGLE: -Math.PI / 4,    // -45°
  MAX_AZIMUTH_ANGLE: Math.PI / 4,     // 45°
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 15,
} as const

export const KEYBOARD_SHORTCUTS = {
  DELETE_HOLD: ['Backspace', 'Delete'] as readonly string[],
  ROTATE_HOLD: ['r', 'R'] as readonly string[],
  DESELECT: ['Escape', 'Enter'] as readonly string[],
  NUDGE_UP: ['ArrowUp', 'w', 'W'] as readonly string[],
  NUDGE_DOWN: ['ArrowDown', 's', 'S'] as readonly string[],
  NUDGE_LEFT: ['ArrowLeft', 'a', 'A'] as readonly string[],
  NUDGE_RIGHT: ['ArrowRight', 'd', 'D'] as readonly string[],
} as const

/** Hold nudge distance in cm */
export const NUDGE_DISTANCE = 5

/** Hold nudge distance with Shift key in cm */
export const NUDGE_DISTANCE_SHIFT = 20

/** Rotation step in degrees */
export const ROTATION_STEP = -10
