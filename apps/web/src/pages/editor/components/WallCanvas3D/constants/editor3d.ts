export const CAMERA = {
  FOV: 50,
  NEAR: 0.1,
  FAR: 100,
  INITIAL_DISTANCE: 6,
} as const

/**
 * Fraction of the remaining distance the camera covers per second, shared by
 * everything that moves it: slow enough to read as the camera following the
 * wall rather than cutting to a new shot.
 */
export const CAMERA_EASE = 1.6

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
  /* Escape alone: Enter activates whatever control the popover has focused,
     so closing the selection on it would undo the click it just made */
  DESELECT: ['Escape'] as readonly string[],
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
