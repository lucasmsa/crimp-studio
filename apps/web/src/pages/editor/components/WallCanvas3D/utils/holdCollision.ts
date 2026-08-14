import type { Hold, CollisionBox } from '@/stores/wallStore'

/** Default fallback box when geometry hasn't reported dimensions yet */
const DEFAULT_BOX: CollisionBox = { halfW: 15, halfH: 15 }

type CollisionHold = Pick<Hold, 'faceId' | 'u' | 'v' | 'collisionBox'> & { id?: string }

function getBox(hold: CollisionHold): CollisionBox {
  return hold.collisionBox ?? DEFAULT_BOX
}

/**
 * Returns true if two holds' bounding boxes overlap on their shared face.
 * Each hold's box is centered at (hold.u, hold.v) with half-extents from
 * collisionBox. Holds on different faces sit on different planes, so this
 * cannot compare them; that case needs the world-space test.
 */
export function checkCollision(holdA: CollisionHold, holdB: CollisionHold): boolean {
  if (holdA.faceId !== holdB.faceId) return false

  const a = getBox(holdA)
  const b = getBox(holdB)

  return (
    Math.abs(holdA.u - holdB.u) < a.halfW + b.halfW &&
    Math.abs(holdA.v - holdB.v) < a.halfH + b.halfH
  )
}

/**
 * Quick boolean check — does the candidate collide with anything?
 */
export function hasCollision(candidate: CollisionHold, holds: Hold[]): boolean {
  return holds.some((h) => h.id !== candidate.id && checkCollision(candidate, h))
}
