import type { SeamOrientation } from '@crimp-studio/wall-geometry'

/**
 * A preset in the words a gym uses. On a level seam a panel tilts, and the
 * words are steepnesses from vertical; on an upright seam it wraps, where
 * "roof" would be nonsense, and the words are bends about the seam. A slanted
 * seam does both at once and has no word that is true of it, so it gets none
 * (ADR-010).
 */
export interface FaceAnglePreset {
  key: string
  angle: number
  kind: 'steepness' | 'bend'
}

const TILT_PRESETS: readonly FaceAnglePreset[] = [
  { key: 'slab', angle: -15, kind: 'steepness' },
  { key: 'vertical', angle: 0, kind: 'steepness' },
  { key: 'overhang', angle: 30, kind: 'steepness' },
  { key: 'roof', angle: 90, kind: 'steepness' },
]

const WRAP_PRESETS: readonly FaceAnglePreset[] = [
  { key: 'cornerIn', angle: -45, kind: 'bend' },
  { key: 'flush', angle: 0, kind: 'bend' },
  { key: 'prow', angle: 45, kind: 'bend' },
  { key: 'wall', angle: 90, kind: 'bend' },
]

export function getFaceAnglePresets(orientation: SeamOrientation): readonly FaceAnglePreset[] {
  if (orientation === 'floor' || orientation === 'horizontal') return TILT_PRESETS
  if (orientation === 'vertical') return WRAP_PRESETS
  return []
}

/** Whether a seam's angle is talked about as a steepness from vertical rather than a bend */
export function speaksSteepness(orientation: SeamOrientation): boolean {
  return orientation === 'floor' || orientation === 'horizontal'
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
