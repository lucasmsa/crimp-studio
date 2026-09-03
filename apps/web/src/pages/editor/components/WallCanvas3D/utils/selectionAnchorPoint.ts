import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import type { FaceTransforms, FaceTree } from '@crimp-studio/wall-geometry'
import { CM_TO_M, faceLocalToWorld, getFace } from '@crimp-studio/wall-geometry'

/** How far off the surface an anchor floats, in metres, so the line clears it */
const ANCHOR_LIFT = 0.12

/**
 * The point on a panel that its cord runs to: the middle of its right edge,
 * lifted off the surface. The card is parked on the right, so the cord meets the
 * panel at the border facing it rather than reaching across its face.
 *
 * The transforms passed in are the settled ones, so the cord holds its aim while
 * the bend animates rather than whipping around with the panel.
 */
export function faceSelectionAnchor(
  tree: FaceTree,
  transforms: FaceTransforms,
  faceId: string,
): THREE.Vector3 {
  const face = getFace(tree, faceId)
  return faceLocalToWorld(transforms[faceId], face.width, face.height / 2, ANCHOR_LIFT)
}

/** How far a hold stands off the panel in cm, until it has reported its measured box */
const UNMEASURED_DEPTH = 10

/** Air between a hold's front and the cord's end, in metres */
const HOLD_CLEARANCE = 0.03

/**
 * The point on a hold its cord runs to: the middle of its front, just clear of
 * the surface facing the camera.
 *
 * Not the edge of its box. A volume is a long wedge bolted at a random angle,
 * so the box's edge at the hold's centre height is air beside it, and the cord
 * looked cut loose. The centre is the one point every silhouette covers, and
 * lifting it past the measured depth puts the cord on the hold's face instead
 * of inside it.
 */
export function holdSelectionAnchor(transforms: FaceTransforms, hold: Hold): THREE.Vector3 {
  const depth = (hold.collisionBox?.depth ?? UNMEASURED_DEPTH) * CM_TO_M
  return faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v, depth + HOLD_CLEARANCE)
}
