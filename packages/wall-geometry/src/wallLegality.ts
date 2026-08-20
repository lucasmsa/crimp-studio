import type { FaceTree } from './faceTree'
import { getFace } from './faceTree'
import { computeFaceTransforms } from './faceTransform'
import { obbsIntersect } from './obb'
import type { HoldPlacement, WallSolid } from './wallSolids'
import { collectWallSolids, holdSolid } from './wallSolids'

/**
 * Air the wall insists on between two holds, in metres. Holds that merely fail
 * to overlap are unusable: a hand needs room between them, and the measured
 * boxes are coarse enough that touching boxes can mean touching plastic.
 */
export const BUILD_GAP = 0.01

/** How close the search gets to the true contact angle, in degrees */
export const ANGLE_PRECISION = 0.5

/**
 * Slack for plywood, in metres. Panels cut from one sheet meet exactly along
 * their seams, and exact face contact is indistinguishable from penetration to
 * a separating-axis test, so a millimetre of overlap does not count as one.
 */
const TOUCH_TOLERANCE = 0.001

export interface SolidPair {
  a: WallSolid
  b: WallSolid
}

/**
 * How much air a particular pair needs.
 *
 * Only two holds. Anything involving plywood is tested for penetration alone,
 * because touching plywood is what a wall is: the panels are one folded sheet,
 * so a panel meets the panel across a seam from it and a hold is bolted flush
 * against a surface. Demanding air there makes a plain flat wall illegal.
 */
function gapFor(a: WallSolid, b: WallSolid): number {
  return a.kind === 'hold' && b.kind === 'hold' ? BUILD_GAP : -TOUCH_TOLERANCE
}

/**
 * A panel whose bottom edge rests on the floor by construction, so the floor
 * cannot be what stops it. That is the root panel and anything hinged sideways
 * off it: an arete stands on the ground exactly as the root does. A panel above
 * a horizontal seam does not, and the floor does stop that one.
 */
function standsOnFloor(faces: FaceTree, faceId: string): boolean {
  let face = getFace(faces, faceId)

  while (face.parentId) {
    if (face.hinge === 'bottom') return false
    face = getFace(faces, face.parentId)
  }

  return true
}

/**
 * Whether two solids are allowed to touch.
 *
 * A parent and child share their hinge edge by construction, so testing them
 * would report contact at every angle. A hold is bolted to its own panel, and
 * holds are left out of the floor test: the floor is not drawn, so a hold dipping
 * below it clips nothing, and blocking placement along the bottom of the wall
 * would read as a bug.
 */
function pairIsExempt(faces: FaceTree, a: WallSolid, b: WallSolid): boolean {
  if (a.kind === 'hold' && b.kind === 'hold') return false

  if (a.kind === 'floor' || b.kind === 'floor') {
    const other = a.kind === 'floor' ? b : a
    if (other.kind === 'hold') return true
    return standsOnFloor(faces, other.id!)
  }

  if (a.kind === 'hold' || b.kind === 'hold') {
    const hold = a.kind === 'hold' ? a : b
    const panel = a.kind === 'hold' ? b : a
    return hold.faceId === panel.id
  }

  const first = getFace(faces, a.id!)
  const second = getFace(faces, b.id!)
  return first.parentId === second.id || second.parentId === first.id
}

/** Every pair of solids that is closer than the build gap allows */
export function findWallOverlaps(faces: FaceTree, holds: HoldPlacement[]): SolidPair[] {
  const solids = collectWallSolids(faces, holds)
  const overlaps: SolidPair[] = []

  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      const a = solids[i]
      const b = solids[j]
      if (pairIsExempt(faces, a, b)) continue
      if (obbsIntersect(a.obb, b.obb, gapFor(a, b))) overlaps.push({ a, b })
    }
  }

  return overlaps
}

export function wallIsClear(faces: FaceTree, holds: HoldPlacement[]): boolean {
  return findWallOverlaps(faces, holds).length === 0
}

/** Whether a face could sit at an angle at all, for a control that offers it */
export function faceAngleIsClear(
  faces: FaceTree,
  holds: HoldPlacement[],
  faceId: string,
  angle: number,
): boolean {
  return wallIsClear(withFaceAngle(faces, faceId, angle), holds)
}

export interface AngleLimit {
  /** The angle that can actually be committed */
  angle: number
  /** True when the wall stopped the requested angle short */
  clamped: boolean
  /** Holds that stood in the way, so the editor can point at them */
  blockingHoldIds: string[]
}

interface AngleSearch {
  faces: FaceTree
  holds: HoldPlacement[]
  faceId: string
  /** The angle currently committed for this face, which is legal */
  from: number
  /** The angle asked for */
  to: number
}

/**
 * The angle a panel can actually reach on its way to the one asked for.
 *
 * A face's angle moves everything hinged above it, so legality is a question
 * about the whole wall rather than one panel: each candidate rebuilds the tree
 * and tests every pair. Bisecting between the committed angle and the requested
 * one lands within half a degree in a handful of tests, whatever the geometry,
 * which is why this is not a closed-form limit per pair of panels.
 *
 * `from` is assumed legal, which the caller guarantees by only ever committing
 * angles that came out of here.
 */
export function findLegalFaceAngle({ faces, holds, faceId, from, to }: AngleSearch): AngleLimit {
  const at = (angle: number) => withFaceAngle(faces, faceId, angle)

  const requested = findWallOverlaps(at(to), holds)
  if (requested.length === 0) return { angle: to, clamped: false, blockingHoldIds: [] }

  const blockingHoldIds = holdsInvolvedIn(requested)

  let legal = from
  let illegal = to
  while (Math.abs(illegal - legal) > ANGLE_PRECISION) {
    const midpoint = (legal + illegal) / 2
    if (wallIsClear(at(midpoint), holds)) legal = midpoint
    else illegal = midpoint
  }

  return { angle: roundToPrecision(legal), clamped: true, blockingHoldIds }
}

/** Whether a hold can sit where it is being put */
export function holdPlacementIsClear(
  faces: FaceTree,
  holds: HoldPlacement[],
  candidate: HoldPlacement,
): boolean {
  const others = holds.filter((hold) => hold.id !== candidate.id)
  const transforms = computeFaceTransforms(faces)
  const transform = transforms[candidate.faceId]
  if (!transform) return false

  const solid = holdSolid(candidate, transform)

  return collectWallSolids(faces, others, transforms).every(
    (other) =>
      pairIsExempt(faces, solid, other) ||
      !obbsIntersect(solid.obb, other.obb, gapFor(solid, other)),
  )
}

/** The tree as it would be with one face at a different angle */
function withFaceAngle(faces: FaceTree, faceId: string, angle: number): FaceTree {
  return {
    rootId: faces.rootId,
    byId: { ...faces.byId, [faceId]: { ...getFace(faces, faceId), angle } },
  }
}

function holdsInvolvedIn(overlaps: SolidPair[]): string[] {
  const ids = new Set<string>()

  for (const { a, b } of overlaps) {
    if (a.kind === 'hold' && a.id) ids.add(a.id)
    if (b.kind === 'hold' && b.id) ids.add(b.id)
  }

  return [...ids]
}

/* Rounding can only take the angle further from contact, never past it */
function roundToPrecision(angle: number): number {
  const rounded = Math.round(angle / ANGLE_PRECISION) * ANGLE_PRECISION
  return Math.abs(rounded) > Math.abs(angle) ? angle : rounded
}
