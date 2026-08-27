import * as THREE from 'three'
import { ORBIT_CONTROLS } from '../constants/editor3d'

/**
 * How far off a panel's surface the camera may sit before selecting the panel
 * turns it, in degrees. A vertical wall from the opening shot is well inside
 * this; a roof is nowhere near it.
 */
export const OBLIQUE_LIMIT_DEG = 35

/** Cross products of near-parallel directions are noise rather than an axis */
const PARALLEL_EPSILON = 1e-6

/**
 * How square the camera is on to a panel: the angle in degrees between the
 * panel's surface normal and the direction from the wall out to the camera.
 * Zero is looking straight at the plywood, 90 is edge on.
 */
export function obliqueness(toCamera: THREE.Vector3, faceNormal: THREE.Vector3): number {
  return THREE.MathUtils.radToDeg(toCamera.angleTo(faceNormal))
}

/**
 * Where the camera should sit to make a panel workable, as a direction out from
 * the orbit target.
 *
 * It turns only as far as it has to: a mild overhang barely moves, a roof swings
 * a long way, and a panel already within the limit does not move at all. The
 * result is then pulled back inside the orbit limits, which is what stops an
 * arete, whose surface faces sideways, from asking for a camera position the
 * editor never allows.
 */
export function swungDirection(
  toCamera: THREE.Vector3,
  faceNormal: THREE.Vector3,
  limitDeg = OBLIQUE_LIMIT_DEG,
): THREE.Vector3 | null {
  const off = obliqueness(toCamera, faceNormal)
  if (off <= limitDeg) return null

  const axis = new THREE.Vector3().crossVectors(toCamera, faceNormal)
  /* Dead behind the panel: every axis turns it the same amount, so take one
     rather than normalising a zero vector */
  if (axis.lengthSq() < PARALLEL_EPSILON) axis.set(0, 1, 0).cross(toCamera)
  if (axis.lengthSq() < PARALLEL_EPSILON) axis.set(1, 0, 0)

  const turn = new THREE.Quaternion().setFromAxisAngle(
    axis.normalize(),
    THREE.MathUtils.degToRad(off - limitDeg),
  )

  return withinOrbitLimits(toCamera.clone().applyQuaternion(turn))
}

/**
 * The nearest direction the editor's orbit actually allows. The camera is held
 * to a wedge in front of the wall and to a band between looking down at it and
 * looking up from under it, so a direction outside that is met at the edge.
 */
export function withinOrbitLimits(direction: THREE.Vector3): THREE.Vector3 {
  const spherical = new THREE.Spherical().setFromVector3(direction)

  spherical.phi = THREE.MathUtils.clamp(
    spherical.phi,
    ORBIT_CONTROLS.MIN_POLAR_ANGLE,
    ORBIT_CONTROLS.MAX_POLAR_ANGLE,
  )
  spherical.theta = THREE.MathUtils.clamp(
    spherical.theta,
    ORBIT_CONTROLS.MIN_AZIMUTH_ANGLE,
    ORBIT_CONTROLS.MAX_AZIMUTH_ANGLE,
  )

  return new THREE.Vector3().setFromSpherical(spherical).normalize()
}
