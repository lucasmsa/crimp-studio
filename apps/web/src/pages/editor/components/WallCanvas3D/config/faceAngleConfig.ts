import type { HingeEdge } from '@crimp-studio/wall-geometry'

/**
 * A bottom hinge tilts the panel, so it speaks the gym's vocabulary. A left
 * hinge wraps it around a vertical seam instead, where "roof" would be
 * nonsense: those presets are corners and prows.
 */
const TILT_PRESETS = [
  { key: 'slab', angle: -15 },
  { key: 'vertical', angle: 0 },
  { key: 'overhang', angle: 30 },
  { key: 'roof', angle: 90 },
] as const

const WRAP_PRESETS = [
  { key: 'cornerIn', angle: -45 },
  { key: 'flush', angle: 0 },
  { key: 'prow', angle: 45 },
  { key: 'wall', angle: 90 },
] as const

export type FaceAnglePreset =
  | (typeof TILT_PRESETS)[number]['key']
  | (typeof WRAP_PRESETS)[number]['key']

export function getFaceAnglePresets(hinge: HingeEdge | null) {
  return hinge === 'left' ? WRAP_PRESETS : TILT_PRESETS
}

/**
 * How far a panel may be asked to fold. Where it actually stops is a question
 * for the geometry layer, which stops it at the panel, hold or floor in the way
 * (ADR-007); these are the limits of the control itself.
 */
export const ANGLE_MIN = -45
export const ANGLE_MAX = 135

/**
 * The root panel is the one standing on the floor, and it is hinged to it, so
 * the floor cannot stop it the way it stops the panels above. Taking it to a
 * roof lays the whole wall down as a ceiling at floor height, which is not a
 * wall, so its lean stops well short of horizontal.
 */
export const ROOT_ANGLE_MAX = 60

export const ANGLE_STEP = 5
export const ANGLE_STEP_SHIFT = 15

export interface AngleLimits {
  min: number
  max: number
}

export function getAngleLimits(isRoot: boolean): AngleLimits {
  return { min: ANGLE_MIN, max: isRoot ? ROOT_ANGLE_MAX : ANGLE_MAX }
}

export function clampFaceAngle(angle: number, limits: AngleLimits = getAngleLimits(false)): number {
  return Math.max(limits.min, Math.min(limits.max, angle))
}

export function stepFaceAngle(
  angle: number,
  direction: 1 | -1,
  coarse = false,
  limits?: AngleLimits,
): number {
  return clampFaceAngle(angle + direction * (coarse ? ANGLE_STEP_SHIFT : ANGLE_STEP), limits)
}
