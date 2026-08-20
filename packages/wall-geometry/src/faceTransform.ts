import * as THREE from 'three'
import { CM_TO_M } from './units'
import type { FaceTree, WallFace } from './faceTree'
import { getFace, listFaces } from './faceTree'

export interface FaceTransform {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

export type FaceTransforms = Record<string, FaceTransform>

/**
 * Each face's frame has its origin at the face's bottom-left corner, +X across
 * the face (u), +Y up the face (v), +Z out of the surface. Wall space puts the
 * root face's bottom-left corner at the origin, so the floor edge is pinned.
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
      : {
          position: new THREE.Vector3(0, 0, 0),
          quaternion: hingeRotation('bottom', face.angle),
        }
  }

  return transforms
}

function childTransform(
  face: WallFace,
  parent: FaceTransform,
  parentFace: WallFace,
): FaceTransform {
  const hinge = face.hinge ?? 'bottom'

  /* The hinge is an edge reference, so the child's origin is derived from the
     parent's current size every time. Storing an offset would drift the moment
     a later cut resized the parent. */
  const edgeOffset =
    hinge === 'bottom'
      ? new THREE.Vector3(0, parentFace.height * CM_TO_M, 0)
      : new THREE.Vector3(parentFace.width * CM_TO_M, 0, 0)

  return {
    position: parent.position.clone().add(edgeOffset.applyQuaternion(parent.quaternion)),
    quaternion: parent.quaternion.clone().multiply(hingeRotation(hinge, face.angle)),
  }
}

/**
 * Positive angle leans the surface toward the climber: about +X for a bottom
 * hinge (overhang at 30, roof at 90), about -Y for a left hinge so a positive
 * arete wraps the same way.
 */
function hingeRotation(hinge: 'bottom' | 'left', angleDeg: number): THREE.Quaternion {
  const angle = THREE.MathUtils.degToRad(angleDeg)
  const axis = hinge === 'bottom' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, -1, 0)
  return new THREE.Quaternion().setFromAxisAngle(axis, angle)
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
 * Degrees from vertical, read off the face's world up-vector: negative leans
 * back (slab), positive leans out (overhang), 90 is a roof. Measured rather
 * than summed down the chain, so a yawed ancestor cannot skew it.
 */
export function getFaceTilt(transform: FaceTransform): number {
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(transform.quaternion)
  return THREE.MathUtils.radToDeg(Math.atan2(up.z, up.y))
}

/**
 * The angle to store for a face so that it reads as `tiltDeg` from vertical.
 *
 * Angles are stored relative to the parent, so bending a lower panel swings
 * everything above it as one assembly. A left hinge yaws rather than tilts, so
 * its angle has no absolute reading to convert and passes straight through.
 */
export function relativeFaceAngle(tree: FaceTree, faceId: string, tiltDeg: number): number {
  const face = getFace(tree, faceId)
  if (face.hinge === 'left' || !face.parentId) return tiltDeg

  const parentTilt = getFaceTilt(computeFaceTransforms(tree)[face.parentId])
  return tiltDeg - parentTilt
}
