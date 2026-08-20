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

/** The point on a hold its controls point at, lifted off the panel it is bolted to */
export function holdSelectionAnchor(transforms: FaceTransforms, hold: Hold): THREE.Vector3 {
  return faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v, ANCHOR_LIFT)
}
