import type { Hold, CollisionBox } from '@/stores/wallStore'

/** Default fallback box when geometry hasn't reported dimensions yet */
const DEFAULT_BOX: CollisionBox = { halfW: 15, halfH: 15 }

type CollisionHold = Pick<Hold, 'x' | 'y' | 'collisionBox'> & { id?: string }

function getBox(hold: CollisionHold): CollisionBox {
  return hold.collisionBox ?? DEFAULT_BOX
}

/**
 * Returns true if two holds' axis-aligned bounding boxes overlap.
 * Each hold's box is centered at (hold.x, hold.y) with half-extents from collisionBox.
 */
export function checkCollision(holdA: CollisionHold, holdB: CollisionHold): boolean {
  const a = getBox(holdA)
  const b = getBox(holdB)

  return (
    Math.abs(holdA.x - holdB.x) < a.halfW + b.halfW &&
    Math.abs(holdA.y - holdB.y) < a.halfH + b.halfH
  )
}

/**
 * Checks a candidate hold against all other holds for collisions.
 * Returns the list of hold IDs that collide with the candidate.
 * Skips the candidate itself if it appears in the list (by id).
 */
export function findCollisions(candidate: CollisionHold, holds: Hold[]): string[] {
  return holds
    .filter((h) => h.id !== candidate.id && checkCollision(candidate, h))
    .map((h) => h.id)
}

/**
 * Quick boolean check — does the candidate collide with anything?
 */
export function hasCollision(candidate: CollisionHold, holds: Hold[]): boolean {
  return holds.some((h) => h.id !== candidate.id && checkCollision(candidate, h))
}
