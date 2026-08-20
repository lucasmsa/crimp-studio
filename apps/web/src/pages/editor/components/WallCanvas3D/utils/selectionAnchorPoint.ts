import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import type { FaceTransforms, FaceTree } from '@crimp-studio/wall-geometry'
import { faceLocalToWorld, getFace } from '@crimp-studio/wall-geometry'

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

/** Half a hold's width in cm, until it has reported its measured box */
const UNMEASURED_HALF_WIDTH = 12

/**
 * The point on a hold its cord runs to: the middle of the edge facing the card,
 * off the surface, so the cord stops at the hold rather than crossing it.
 */
export function holdSelectionAnchor(transforms: FaceTransforms, hold: Hold): THREE.Vector3 {
  const halfWidth = hold.collisionBox?.halfW ?? UNMEASURED_HALF_WIDTH
  return faceLocalToWorld(transforms[hold.faceId], hold.u + halfWidth, hold.v, ANCHOR_LIFT)
}
