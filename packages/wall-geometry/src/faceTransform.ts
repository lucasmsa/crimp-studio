import * as THREE from 'three'
import { CM_TO_M } from './units'
import type { FaceTree, WallFace } from './faceTree'
import { getFace, listFaces, seamFrame } from './faceTree'

export interface FaceTransform {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

export type FaceTransforms = Record<string, FaceTransform>

const X_AXIS = new THREE.Vector3(1, 0, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)

/**
 * Each face's frame has its origin where its seam starts, +X along the seam
 * (u), +Y into the face (v), +Z out of the surface. Wall space puts the root
 * face's bottom-left corner at the origin, so the floor edge is pinned.
 *
 * Transforms are computed from the tree rather than read back out of the scene
 * graph: collision and the camera need a face frame without waiting on a matrix
 * update, and two sources of the same number can disagree.
 */
export function computeFaceTransforms(tree: FaceTree): FaceTransforms {
  const transforms: FaceTransforms = {}

  for (const face of listFaces(tree)) {
    transforms[face.id] = face.parentId
      ? childTransform(face, transforms[face.parentId], getFace(tree, face.parentId))
      : { position: new THREE.Vector3(0, 0, 0), quaternion: bendRotation(face.angle) }
  }

  return transforms
}

/**
 * The seam is an edge reference, so the child's origin and heading are derived
 * from the parent's current outline every time. Storing them would drift the
 * moment a later cut reshaped the parent.
 */
function childTransform(
  face: WallFace,
  parent: FaceTransform,
  parentFace: WallFace,
): FaceTransform {
  if (face.seamEdge === null) throw new Error(`Face ${face.id} has a parent but no seam`)

  const frame = seamFrame(parentFace, face.seamEdge)
  const origin = new THREE.Vector3(frame.origin[0] * CM_TO_M, frame.origin[1] * CM_TO_M, 0)
    .applyQuaternion(parent.quaternion)
  const heading = new THREE.Quaternion().setFromAxisAngle(
    Z_AXIS,
    Math.atan2(frame.u[1], frame.u[0]),
  )

  return {
    position: parent.position.clone().add(origin),
    quaternion: parent.quaternion.clone().multiply(heading).multiply(bendRotation(face.angle)),
  }
}

/**
 * Every face bends about its own seam, which is its u axis. Positive leans the
 * surface toward the climber: an overhang at 30, a roof at 90. On a vertical
 * seam the same rotation is a yaw, and a positive one wraps toward the climber
 * as well.
 */
function bendRotation(angleDeg: number): THREE.Quaternion {
  return new THREE.Quaternion().setFromAxisAngle(X_AXIS, THREE.MathUtils.degToRad(angleDeg))
}

/** Face-local cm to world metres, optionally pushed out along the face normal. */
export function faceLocalToWorld(
  transform: FaceTransform,
  u: number,
  v: number,
  outward = 0,
): THREE.Vector3 {
  return new THREE.Vector3(u * CM_TO_M, v * CM_TO_M, outward)
    .applyQuaternion(transform.quaternion)
    .add(transform.position)
}

export function faceNormal(transform: FaceTransform): THREE.Vector3 {
  return new THREE.Vector3(0, 0, 1).applyQuaternion(transform.quaternion)
}

/**
 * Degrees from vertical, read off the face's world normal: negative leans back
 * (slab), positive leans out (overhang), 90 is a roof. A face that has only
 * yawed reads 0, since its normal is still level. Measured rather than summed
 * down the chain, so a yawed ancestor cannot skew it.
 */
export function faceSteepness(transform: FaceTransform): number {
  const normal = faceNormal(transform)
  return THREE.MathUtils.radToDeg(Math.atan2(-normal.y, Math.hypot(normal.x, normal.z)))
}
