/**
 * The gym vocabulary, as tilt from vertical: negative leans back, positive
 * leans out. Free values in between are allowed, clamped to the range below.
 */
export const FACE_ANGLE_PRESETS = [
  { key: 'slab', angle: -15 },
  { key: 'vertical', angle: 0 },
  { key: 'overhang', angle: 30 },
  { key: 'roof', angle: 90 },
] as const

export type FaceAnglePreset = (typeof FACE_ANGLE_PRESETS)[number]['key']

/** Past these a panel folds back through its neighbour instead of shaping a wall */
export const ANGLE_MIN = -45
export const ANGLE_MAX = 135

export const ANGLE_STEP = 5
export const ANGLE_STEP_SHIFT = 15

export function clampFaceAngle(angle: number): number {
  return Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, angle))
}

export function stepFaceAngle(angle: number, direction: 1 | -1, coarse = false): number {
  return clampFaceAngle(angle + direction * (coarse ? ANGLE_STEP_SHIFT : ANGLE_STEP))
}
