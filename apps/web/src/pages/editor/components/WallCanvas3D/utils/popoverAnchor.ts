import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import type { FaceTree } from './faceTree'
import { getFace } from './faceTree'
import type { FaceTransforms } from './faceTransform'
import { faceLocalToWorld } from './faceTransform'

/** How far off the surface an anchor floats, in metres, so the popover clears it */
const ANCHOR_LIFT = 0.12

/**
 * Where a panel's popover hangs: the middle of its right edge, lifted off the
 * surface, so the controls sit beside the panel rather than over it.
 *
 * The transforms passed in are the settled ones, so the popover holds still
 * while the bend animates instead of chasing the panel across the screen.
 */
export function facePopoverAnchor(
  tree: FaceTree,
  transforms: FaceTransforms,
  faceId: string,
): THREE.Vector3 {
  const face = getFace(tree, faceId)
  return faceLocalToWorld(transforms[faceId], face.width, face.height / 2, ANCHOR_LIFT)
}

/** Where a hold's popover hangs: on the hold, lifted off the panel it is bolted to */
export function holdPopoverAnchor(transforms: FaceTransforms, hold: Hold): THREE.Vector3 {
  return faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v, ANCHOR_LIFT)
}
