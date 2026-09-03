import type { Point2 } from '@crimp-studio/wall-geometry'
import { edgeOf, outlineCentroid } from '@crimp-studio/wall-geometry'
import type { CollisionBox } from '@/stores/wallStore'

/** Below this a distance is rounding, not geometry */
const EPSILON = 1e-9

/**
 * Clamps a hold's centre so its measured extents stay on its face. Clamping
 * the centre alone lets big holds (volumes) hang past the edge.
 *
 * The face is shrunk inward by the hold's reach in each edge's direction, and
 * the centre is pulled to the nearest point of what remains. A rectangle gives
 * exactly the old per-axis clamp; a triangle gives a triangle, so a hold beside
 * a slanted edge stays on plywood. A hold wider than the face gets centred on it
 * rather than an inverted clamp range, as before.
 */
export function clampHoldToFace(
  u: number,
  v: number,
  box: CollisionBox | undefined,
  outline: Point2[],
): { u: number; v: number } {
  const halfW = box?.halfW ?? 0
  const halfH = box?.halfH ?? 0

  let room: Point2[] = outline
  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const inward = inwardNormal(a, b)
    /* The hold's reach across this edge, capped at half the face's width across
       it: a hold too big for the face is centred, not pushed out the other side */
    const reach = Math.min(
      halfW * Math.abs(inward[0]) + halfH * Math.abs(inward[1]),
      widthAcross(outline, a, inward) / 2,
    )
    room = clipInside(room, a, inward, reach)
  }

  const [cu, cv] = closestPointIn(room, [u, v], outline)
  return { u: cu, v: cv }
}

function inwardNormal(a: Point2, b: Point2): Point2 {
  const du = b[0] - a[0]
  const dv = b[1] - a[1]
  const length = Math.hypot(du, dv)
  return [-dv / length, du / length]
}

/** How far the outline reaches inward from an edge */
function widthAcross(outline: Point2[], a: Point2, inward: Point2): number {
  return Math.max(...outline.map((p) => (p[0] - a[0]) * inward[0] + (p[1] - a[1]) * inward[1]))
}

/** The part of a polygon at least `offset` inside the line through `a` with the given inward normal */
function clipInside(polygon: Point2[], a: Point2, inward: Point2, offset: number): Point2[] {
  const depth = (p: Point2) => (p[0] - a[0]) * inward[0] + (p[1] - a[1]) * inward[1] - offset
  const kept: Point2[] = []

  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i]
    const q = polygon[(i + 1) % polygon.length]
    const dp = depth(p)
    const dq = depth(q)

    if (dp >= -EPSILON) push(kept, p)
    if ((dp > EPSILON && dq < -EPSILON) || (dp < -EPSILON && dq > EPSILON)) {
      const t = dp / (dp - dq)
      push(kept, [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }

  return kept
}

function push(points: Point2[], point: Point2): void {
  const last = points[points.length - 1]
  if (last && Math.abs(last[0] - point[0]) < EPSILON && Math.abs(last[1] - point[1]) < EPSILON) return
  const first = points[0]
  if (
    points.length > 1 &&
    Math.abs(first[0] - point[0]) < EPSILON &&
    Math.abs(first[1] - point[1]) < EPSILON
  ) {
    return
  }
  points.push(point)
}

/**
 * The nearest point of `room` to `point`. Room can have collapsed to a segment
 * or a point when the hold is as wide as the face, or to nothing when the face
 * is an odd shape the hold cannot fit at all, in which case the face's centre
 * is the honest answer.
 */
function closestPointIn(room: Point2[], point: Point2, outline: Point2[]): Point2 {
  if (room.length === 0) return outlineCentroid(outline)
  if (room.length === 1) return room[0]
  if (room.length === 2) return closestOnSegment(room[0], room[1], point)

  const inside = room.every((_, i) => {
    const [a, b] = edgeOf(room, i)
    return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]) >= -EPSILON
  })
  if (inside) return point

  let best: Point2 = room[0]
  let bestDistance = Infinity
  for (let i = 0; i < room.length; i++) {
    const [a, b] = edgeOf(room, i)
    const candidate = closestOnSegment(a, b, point)
    const distance = Math.hypot(candidate[0] - point[0], candidate[1] - point[1])
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  return best
}

function closestOnSegment(a: Point2, b: Point2, point: Point2): Point2 {
  const du = b[0] - a[0]
  const dv = b[1] - a[1]
  const lengthSq = du * du + dv * dv
  if (lengthSq < EPSILON) return a

  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * du + (point[1] - a[1]) * dv) / lengthSq))
  return [a[0] + du * t, a[1] + dv * t]
}
