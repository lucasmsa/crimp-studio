import * as THREE from 'three'
import { CM_TO_M, WALL_DEPTH } from '@crimp-studio/wall-geometry'

/**
 * Wall space puts the root panel's bottom-left corner at the origin, so the
 * scene shifts the whole profile to sit in front of the camera. Anything that
 * needs a wall-space point in world space applies this too.
 */
export function wallCenteringOffset(widthCm: number, heightCm: number): THREE.Vector3 {
  return new THREE.Vector3(
    (-widthCm * CM_TO_M) / 2,
    (-heightCm * CM_TO_M) / 2,
    WALL_DEPTH / 2,
  )
}
