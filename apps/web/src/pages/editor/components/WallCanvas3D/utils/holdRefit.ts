import type { FaceTree } from '@crimp-studio/wall-geometry'
import { getFace } from '@crimp-studio/wall-geometry'
import type { CollisionBox, Hold } from '@/stores/wallStore'
import { clampHoldToFace } from './holdBounds'

/**
 * A hold as it would be wearing a different box.
 *
 * Changing a hold's type or model changes how much plywood it covers, so the
 * hold is pulled back onto its face when the new box would hang past an edge,
 * the way turning one already does. Whether it then clears its neighbours is a
 * separate question, for the geometry package.
 */
export function refitHold(
  faces: FaceTree,
  hold: Hold,
  collisionBox: CollisionBox,
  changes: Partial<Hold> = {},
): Hold {
  const face = getFace(faces, hold.faceId)
  const { u, v } = clampHoldToFace(hold.u, hold.v, collisionBox, face.width, face.height)

  return { ...hold, ...changes, collisionBox, u, v }
}
