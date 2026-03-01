import { ROTATION_STEP } from '../constants/editor3d'

/** Calculate the next rotation value (wraps around at 360°) */
export function getNextRotation(currentRotation?: number): number {
  return (((currentRotation ?? 0) + ROTATION_STEP) % 360 + 360) % 360
}
