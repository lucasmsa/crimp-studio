export const CANVAS_ELEMENTS = {
  WALL_BACKGROUND: 'wall-bg',
} as const

export const CANVAS_CONFIG = {
  PADDING_FACTOR: 0.9,
  MIN_HOLD_RADIUS: 12,
  HOLD_RADIUS: 15,
} as const

export const WALL_LIMITS = {
  WIDTH_MIN: 100,
  WIDTH_MAX: 1000,
  WIDTH_DEFAULT: 300,
  HEIGHT_MIN: 200,
  HEIGHT_MAX: 550,
  HEIGHT_DEFAULT: 400,
  ANGLE_MIN: -15,
  ANGLE_MAX: 60,
  ANGLE_DEFAULT: 15,
} as const

export const KEYBOARD_SHORTCUTS = {
  DELETE_HOLD: ['Backspace', 'Delete'],
} as const
