import type { FaceTree } from './faceTree'
import { getFace, hingeSegment } from './faceTree'
import type { FaceTransforms } from './faceTransform'
import { computeFaceTransforms, faceLocalToWorld } from './faceTransform'
import { prismsIntersect } from './prism'
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

/** How close a blocked move gets to the true point of contact, in cm */
export const MOVE_PRECISION = 0.2

/**
 * Slack for plywood, in metres. Panels cut from one sheet meet exactly along
 * their seams, and exact face contact is indistinguishable from penetration to
 * a separating-axis test, so a millimetre of overlap does not count as one.
 */
const TOUCH_TOLERANCE = 0.001

/** A seam endpoint this close to the floor plane, in metres, is standing on it */
const FLOOR_EPSILON = 1e-4

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
 * A panel whose seam reaches the floor rests on it by construction, so the
 * floor cannot be what stops it. That is the root panel, whose seam is the
 * floor line, and anything hinged on a seam that comes down to the ground: an
 * arete stands there exactly as the root does. A panel above a horizontal seam
 * does not, and the floor does stop that one (ADR-010).
 */
function standsOnFloor(faces: FaceTree, transforms: FaceTransforms, faceId: string): boolean {
  const face = getFace(faces, faceId)
  const transform = transforms[faceId]
  const { from, to } = hingeSegment(face)

  return [from, to].some((u) => faceLocalToWorld(transform, u, 0).y < FLOOR_EPSILON)
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
function pairIsExempt(
  faces: FaceTree,
  transforms: FaceTransforms,
  a: WallSolid,
  b: WallSolid,
): boolean {
  if (a.kind === 'hold' && b.kind === 'hold') return false

  if (a.kind === 'floor' || b.kind === 'floor') {
    const other = a.kind === 'floor' ? b : a
    if (other.kind === 'hold') return true
    return standsOnFloor(faces, transforms, other.id!)
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
  const transforms = computeFaceTransforms(faces)
  const solids = collectWallSolids(faces, holds, transforms)
  const overlaps: SolidPair[] = []

  for (let i = 0; i < solids.length; i++) {
    for (let j = i + 1; j < solids.length; j++) {
      const a = solids[i]
      const b = solids[j]
      if (pairIsExempt(faces, transforms, a, b)) continue
      if (prismsIntersect(a.solid, b.solid, gapFor(a, b))) overlaps.push({ a, b })
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
  const fits = fitTest(faces, holds, candidate.id)
  return fits(candidate)
}

/** What a hold is up against where it is being held */
export interface HoldObstruction {
  /** Nothing is in the way: this is a spot the hold could be let go in */
  clear: boolean
  /** The holds it sits on top of, so an editor can point at them as well */
  holdIds: string[]
}

/**
 * What stands in the way of a hold at a candidate position.
 *
 * The same test as `holdPlacementIsClear`, answering with the names rather than
 * a yes or no: a drag that follows the pointer has to say what it is sitting on
 * while it sits there, instead of refusing to go (ADR-007).
 */
export function findHoldObstruction(
  faces: FaceTree,
  holds: HoldPlacement[],
  candidate: HoldPlacement,
): HoldObstruction {
  const transforms = computeFaceTransforms(faces)
  const transform = transforms[candidate.faceId]
  if (!transform) return { clear: false, holdIds: [] }

  const solid = holdSolid(candidate, transform)
  const others = collectWallSolids(
    faces,
    holds.filter((hold) => hold.id !== candidate.id),
    transforms,
  )

  const holdIds: string[] = []
  let clear = true

  for (const other of others) {
    if (pairIsExempt(faces, transforms, solid, other)) continue
    if (!prismsIntersect(solid.solid, other.solid, gapFor(solid, other))) continue

    clear = false
    if (other.kind === 'hold' && other.id) holdIds.push(other.id)
  }

  return { clear, holdIds }
}

/** Where a hold is, in the frame of the panel it is bolted to */
export interface HoldPosition {
  faceId: string
  u: number
  v: number
}

interface MoveSearch {
  faces: FaceTree
  holds: HoldPlacement[]
  /** Where the hold sits now, which is legal */
  from: HoldPlacement
  /** Where it is being asked to go, already inside the bounds of its face */
  to: HoldPlacement
}

/**
 * The position a hold can actually reach on its way to the one asked for.
 *
 * A drag commits every frame, so a hold that cannot have the spot under the
 * pointer has to do something better than stop where it last fitted: it goes as
 * far as it can and slides along whatever is in the way. Resolving one axis at a
 * time is what produces the slide, and the two orders answer different questions:
 * across first keeps the sideways travel and gives up the climb, up first does
 * the opposite. Whichever lands nearer the pointer wins, so a hold pushed up
 * under a neighbour stops under it rather than stepping aside.
 *
 * `from` is assumed legal, which the caller guarantees by only ever committing
 * positions that came out of here.
 */
export function findLegalHoldMove({ faces, holds, from, to }: MoveSearch): HoldPosition {
  const fits = fitTest(faces, holds, from.id)
  if (fits(to)) return positionOf(to)

  /* u and v measure different plywood on each panel, so there is nothing to
     slide along across a seam: the hold either lands on the new panel or stays */
  if (to.faceId !== from.faceId) return positionOf(from)

  const acrossFirst = slide(fits, from, to, ['u', 'v'])
  const upFirst = slide(fits, from, to, ['v', 'u'])

  return distanceTo(to, acrossFirst) <= distanceTo(to, upFirst) ? acrossFirst : upFirst
}

/**
 * Whether a candidate position for one hold clears everything else on the wall.
 *
 * The transforms and the other solids are built once and reused, since a single
 * blocked move asks this a few dozen times while it bisects.
 */
function fitTest(
  faces: FaceTree,
  holds: HoldPlacement[],
  movingId: string,
): (candidate: HoldPlacement) => boolean {
  const transforms = computeFaceTransforms(faces)
  const obstacles = collectWallSolids(
    faces,
    holds.filter((hold) => hold.id !== movingId),
    transforms,
  )

  return (candidate) => {
    const transform = transforms[candidate.faceId]
    if (!transform) return false

    const solid = holdSolid(candidate, transform)

    return obstacles.every(
      (other) =>
        pairIsExempt(faces, transforms, solid, other) ||
        !prismsIntersect(solid.solid, other.solid, gapFor(solid, other)),
    )
  }
}

type MoveAxis = 'u' | 'v'

/** One axis then the other, each going as far as the wall lets it */
function slide(
  fits: (candidate: HoldPlacement) => boolean,
  from: HoldPlacement,
  to: HoldPlacement,
  order: readonly [MoveAxis, MoveAxis],
): HoldPosition {
  let at = from

  for (const axis of order) {
    at = { ...at, [axis]: reachAlong(fits, at, axis, to[axis]) }
  }

  return positionOf(at)
}

/**
 * How far along one axis a hold gets before something stops it.
 *
 * Bisecting between where it is and where it is going lands within a couple of
 * millimetres of contact in a dozen tests, whatever is in the way, which is why
 * this is not a closed-form distance per pair of boxes.
 */
function reachAlong(
  fits: (candidate: HoldPlacement) => boolean,
  at: HoldPlacement,
  axis: MoveAxis,
  target: number,
): number {
  const fitsAt = (value: number) => fits({ ...at, [axis]: value })
  if (fitsAt(target)) return target

  let legal = at[axis]
  let blocked = target
  while (Math.abs(blocked - legal) > MOVE_PRECISION) {
    const midpoint = (legal + blocked) / 2
    if (fitsAt(midpoint)) legal = midpoint
    else blocked = midpoint
  }

  return legal
}

function distanceTo(to: HoldPlacement, reached: HoldPosition): number {
  return Math.hypot(to.u - reached.u, to.v - reached.v)
}

function positionOf({ faceId, u, v }: HoldPlacement): HoldPosition {
  return { faceId, u, v }
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
