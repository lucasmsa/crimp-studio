import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import type { FaceTransforms, FaceTree, Point2 } from '@crimp-studio/wall-geometry'
import { CM_TO_M, edgeOf, faceLocalToWorld, getFace, outlineBounds } from '@crimp-studio/wall-geometry'

/** How far off the surface an anchor floats, in metres, so the line clears it */
const ANCHOR_LIFT = 0.12

/**
 * The point on a panel that its cord runs to: the point of its border nearest
 * the middle of its right side, lifted off the surface. The card is parked on
 * the right, so the cord meets the panel at the border facing it rather than
 * reaching across its face. For a rectangle that is the middle of its right
 * edge; for a triangle it is still on the plywood.
 *
 * The transforms passed in are the settled ones, so the cord holds its aim while
 * the bend animates rather than whipping around with the panel.
 */
export function faceSelectionAnchor(
  tree: FaceTree,
  transforms: FaceTransforms,
  faceId: string,
): THREE.Vector3 {
  const { outline } = getFace(tree, faceId)
  const { uMax, vMin, vMax } = outlineBounds(outline)
  const [u, v] = closestOnBorder(outline, [uMax, (vMin + vMax) / 2])
  return faceLocalToWorld(transforms[faceId], u, v, ANCHOR_LIFT)
}

function closestOnBorder(outline: Point2[], point: Point2): Point2 {
  let best: Point2 = outline[0]
  let bestDistance = Infinity

  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const du = b[0] - a[0]
    const dv = b[1] - a[1]
    const t = Math.max(
      0,
      Math.min(1, ((point[0] - a[0]) * du + (point[1] - a[1]) * dv) / (du * du + dv * dv)),
    )
    const candidate: Point2 = [a[0] + du * t, a[1] + dv * t]
    const distance = Math.hypot(candidate[0] - point[0], candidate[1] - point[1])
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  return best
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
