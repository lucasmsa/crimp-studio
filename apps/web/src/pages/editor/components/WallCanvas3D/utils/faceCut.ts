import type { Hold } from '@/stores/wallStore'
import type { FaceTree, Point2, SeamFrame, WallFace } from '@crimp-studio/wall-geometry'
import {
  computeFaceTransforms,
  edgeOf,
  faceLocalToWorld,
  findEdgeThrough,
  getFace,
  hingeSegment,
  isConvexCCW,
  minWidthAcross,
  outlineArea,
  pointToChild,
  pointToParent,
  seamFrame,
  sheetUp,
} from '@crimp-studio/wall-geometry'
import { clampHoldToFace } from './holdBounds'

/** A straight seam between two points on a face's border, in the face's frame */
export interface Seam {
  a: Point2
  b: Point2
}

/**
 * The two seams the buttons can make, in the plywood's own terms: 'across'
 * runs level and splits a lower from an upper piece, 'up' runs vertical and
 * splits a left from a right one. Adapters over `cutFaceAlong` until seams are
 * drawn instead (ADR-011).
 */
export type CutAxis = 'across' | 'up'

/** A panel narrower than this anywhere is not a climbing surface, it is a strip of trim */
export const MIN_FACE_SIZE = 40

export type CutRefusal = 'too-small' | 'child-in-the-way' | 'holds-in-the-way'

export interface CutCheck {
  ok: boolean
  reason?: CutRefusal
  /** Holds the seam would pass through, so the UI can point at them */
  blockingHoldIds: string[]
}

export interface CutResult {
  tree: FaceTree
  holds: Hold[]
  newFaceId: string
}

const EPSILON = 1e-6

const createFaceId = () => `face_${Math.random().toString(36).substring(2, 9)}`

const IDENTITY: SeamFrame = { origin: [0, 0], u: [1, 0], v: [0, 1] }

/* 2D helpers, all in one face's frame */
const subtract = (p: Point2, q: Point2): Point2 => [p[0] - q[0], p[1] - q[1]]
const dot = (p: Point2, q: Point2) => p[0] * q[0] + p[1] * q[1]
const cross = (p: Point2, q: Point2) => p[0] * q[1] - p[1] * q[0]
const samePoint = (p: Point2, q: Point2) =>
  Math.abs(p[0] - q[0]) < EPSILON && Math.abs(p[1] - q[1]) < EPSILON

/** Distance from the seam's line, positive to its left */
function sideOf(seam: Seam, point: Point2): number {
  const along = subtract(seam.b, seam.a)
  return cross(along, subtract(point, seam.a)) / Math.hypot(along[0], along[1])
}

/** The part of a convex outline on one side of the seam, the seam included */
function clipToSide(outline: Point2[], seam: Seam, keepLeft: boolean): Point2[] {
  const sign = keepLeft ? 1 : -1
  const kept: Point2[] = []

  for (let i = 0; i < outline.length; i++) {
    const [p, q] = edgeOf(outline, i)
    const dp = sign * sideOf(seam, p)
    const dq = sign * sideOf(seam, q)

    if (dp >= -EPSILON) pushDistinct(kept, p)
    if ((dp > EPSILON && dq < -EPSILON) || (dp < -EPSILON && dq > EPSILON)) {
      const t = dp / (dp - dq)
      pushDistinct(kept, [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }

  return kept
}

function pushDistinct(points: Point2[], point: Point2): void {
  if (points.some((known) => samePoint(known, point))) return
  points.push(point)
}

/** The edge whose endpoints are the seam's, in either order, or -1 */
function edgeMatching(outline: Point2[], p: Point2, q: Point2): number {
  return outline.findIndex((_, i) => {
    const [a, b] = edgeOf(outline, i)
    return (samePoint(a, p) && samePoint(b, q)) || (samePoint(a, q) && samePoint(b, p))
  })
}

/** Whether the seam cuts through the inside of an edge, rather than missing it or meeting its end */
function seamCrossesEdge(seam: Seam, edge: [Point2, Point2]): boolean {
  const r = subtract(seam.b, seam.a)
  const s = subtract(edge[1], edge[0])
  const denominator = cross(r, s)
  if (Math.abs(denominator) < EPSILON) return false

  const offset = subtract(edge[0], seam.a)
  const alongSeam = cross(offset, s) / denominator
  const alongEdge = cross(offset, r) / denominator

  return alongEdge > EPSILON && alongEdge < 1 - EPSILON && alongSeam > -EPSILON && alongSeam < 1 + EPSILON
}

/** Whether the seam passes through a hold's box, touching its border not counted */
function seamHitsHold(seam: Seam, hold: Hold): boolean {
  const box = hold.collisionBox
  if (!box) return false

  const direction = subtract(seam.b, seam.a)
  const centre: Point2 = [hold.u, hold.v]
  const half: Point2 = [box.halfW, box.halfH]
  let enter = 0
  let leave = 1

  for (const axis of [0, 1] as const) {
    const low = centre[axis] - half[axis]
    const high = centre[axis] + half[axis]
    if (Math.abs(direction[axis]) < EPSILON) {
      if (seam.a[axis] <= low + EPSILON || seam.a[axis] >= high - EPSILON) return false
      continue
    }
    const at = (seam.a[axis] - low) / -direction[axis]
    const to = (seam.a[axis] - high) / -direction[axis]
    enter = Math.max(enter, Math.min(at, to))
    leave = Math.min(leave, Math.max(at, to))
    if (enter >= leave - EPSILON) return false
  }

  return true
}

/** A frame given inside another, expressed in the outer frame's parent */
function frameToParent(outer: SeamFrame, inner: SeamFrame): SeamFrame {
  const turn = (d: Point2): Point2 => [
    d[0] * outer.u[0] + d[1] * outer.v[0],
    d[0] * outer.u[1] + d[1] * outer.v[1],
  ]
  return { origin: pointToParent(outer, inner.origin), u: turn(inner.u), v: turn(inner.v) }
}

/**
 * Re-expresses a face and its holds from one frame to another, both given in a
 * shared frame. A child whose seam edge kept its line but moved its end sees
 * its numbers shift; its world position does not.
 */
function rebase(
  face: WallFace,
  holds: Hold[],
  from: SeamFrame,
  to: SeamFrame,
  changes: Pick<WallFace, 'parentId' | 'seamEdge'>,
): { face: WallFace; holds: Hold[] } {
  const map = (p: Point2): Point2 => pointToChild(to, pointToParent(from, p))
  const moved = { ...face, ...changes, outline: face.outline.map(map) }

  return {
    face: moved,
    holds: holds.map((hold) => {
      if (hold.faceId !== face.id) return hold
      const [u, v] = map([hold.u, hold.v])
      return { ...hold, u, v }
    }),
  }
}

/**
 * Which side of the seam keeps the face. The piece holding the hinge end that
 * is lowest in the world, ties broken toward the seam's start: the floor pin
 * never moves, an arete cut level keeps its foot, and a root cut upright keeps
 * its left half, all as before.
 */
function nearSideIsLeft(tree: FaceTree, face: WallFace, seam: Seam): boolean {
  const transform = computeFaceTransforms(tree)[face.id]
  const { from, to } = hingeSegment(face)
  const ends: Point2[] = [
    [from, 0],
    [to, 0],
  ]
  const byHeight = ends
    .map((end) => ({ end, height: faceLocalToWorld(transform, end[0], 0).y }))
    .sort((p, q) => p.height - q.height || p.end[0] - q.end[0])

  for (const { end } of byHeight) {
    const side = sideOf(seam, end)
    if (Math.abs(side) > EPSILON) return side > 0
  }
  return true
}

/** The seam's two border points, from a point on its line and its direction, or null if it misses the face */
function chordThrough(outline: Point2[], point: Point2, direction: Point2): Seam | null {
  const hits: { t: number; at: Point2 }[] = []

  for (let i = 0; i < outline.length; i++) {
    const [a, b] = edgeOf(outline, i)
    const edge = subtract(b, a)
    const denominator = cross(direction, edge)
    if (Math.abs(denominator) < EPSILON) continue

    const offset = subtract(a, point)
    const alongEdge = cross(offset, direction) / denominator
    if (alongEdge < -EPSILON || alongEdge > 1 + EPSILON) continue

    const t = cross(offset, edge) / denominator
    hits.push({ t, at: [a[0] + edge[0] * alongEdge, a[1] + edge[1] * alongEdge] })
  }

  if (hits.length < 2) return null
  hits.sort((p, q) => p.t - q.t)
  const first = hits[0].at
  const last = hits[hits.length - 1].at
  return samePoint(first, last) ? null : { a: first, b: last }
}

/** The plywood's axes in a face's frame: up the sheet, and across it to the right */
function sheetAxes(tree: FaceTree, faceId: string): { up: Point2; right: Point2 } {
  const up = sheetUp(tree, faceId)
  return { up, right: [up[1], 0 - up[0]] }
}

function axisAlong(tree: FaceTree, faceId: string, axis: CutAxis): Point2 {
  const { up, right } = sheetAxes(tree, faceId)
  return axis === 'across' ? up : right
}

/** How much of a face there is to cut along an axis, in cm */
export function sheetExtent(tree: FaceTree, faceId: string, axis: CutAxis): number {
  const along = axisAlong(tree, faceId, axis)
  const levels = getFace(tree, faceId).outline.map((p) => dot(p, along))
  return Math.max(...levels) - Math.min(...levels)
}

/** Where a point on the face sits along an axis, from the face's low side, in cm */
export function sheetOffset(tree: FaceTree, faceId: string, point: Point2, axis: CutAxis): number {
  const along = axisAlong(tree, faceId, axis)
  const min = Math.min(...getFace(tree, faceId).outline.map((p) => dot(p, along)))
  return dot(point, along) - min
}

/** The seam a button makes: level for 'across', upright for 'up', `at` cm from the face's low side */
export function seamForAxis(tree: FaceTree, faceId: string, axis: CutAxis, at: number): Seam | null {
  const { up, right } = sheetAxes(tree, faceId)
  const along = axis === 'across' ? up : right
  const direction = axis === 'across' ? right : up
  const outline = getFace(tree, faceId).outline
  const level = Math.min(...outline.map((p) => dot(p, along))) + at

  return chordThrough(outline, [along[0] * level, along[1] * level], direction)
}

/**
 * A cut is legal when both pieces stay usable, no child hinges on an edge the
 * seam would cut through, and it does not pass through a hold. Real holds do
 * not span a bend, so the hold rule keeps the "one hold, one face" invariant.
 */
export function canCutAlong(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  seam: Seam | null,
): CutCheck {
  if (!seam) return { ok: false, reason: 'too-small', blockingHoldIds: [] }

  const face = getFace(tree, faceId)
  const pieces = [clipToSide(face.outline, seam, true), clipToSide(face.outline, seam, false)]
  const usable = pieces.every(
    (piece) => piece.length >= 3 && outlineArea(piece) > EPSILON && minWidthAcross(piece) >= MIN_FACE_SIZE,
  )
  if (!usable) return { ok: false, reason: 'too-small', blockingHoldIds: [] }

  const childInTheWay = face.childIds.some((childId) => {
    const child = getFace(tree, childId)
    return child.seamEdge !== null && seamCrossesEdge(seam, edgeOf(face.outline, child.seamEdge))
  })
  if (childInTheWay) return { ok: false, reason: 'child-in-the-way', blockingHoldIds: [] }

  const blockingHoldIds = holds
    .filter((hold) => hold.faceId === faceId && seamHitsHold(seam, hold))
    .map((hold) => hold.id)
  if (blockingHoldIds.length > 0) return { ok: false, reason: 'holds-in-the-way', blockingHoldIds }

  return { ok: true, blockingHoldIds: [] }
}

export function canCutFace(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  axis: CutAxis,
  at: number,
): CutCheck {
  return canCutAlong(tree, holds, faceId, seamForAxis(tree, faceId, axis, at))
}

/**
 * The seam nearest to where the user aimed that is actually legal. Aiming and
 * placing are the same click, so the aimed spot is often exactly where a hold
 * just landed; this walks outward from there to the first clear line rather
 * than leaving the cut button dead with no way forward.
 */
export function findCutPosition(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  axis: CutAxis,
  preferred: number,
): number | null {
  const extent = sheetExtent(tree, faceId, axis)
  const legal = (at: number) => canCutFace(tree, holds, faceId, axis, at).ok

  if (legal(preferred)) return preferred

  for (let offset = 5; offset <= extent; offset += 5) {
    if (legal(preferred + offset)) return preferred + offset
    if (legal(preferred - offset)) return preferred - offset
  }

  return null
}

/**
 * Splits a face in two along a seam. The near piece keeps the face, its hinge
 * and its angle, so the floor pin never moves; the far piece becomes a new
 * child hinged on the seam, flush with its parent until it is angled. Children
 * of the face follow whichever piece still carries the edge they hinge on.
 */
export function cutFaceAlong(tree: FaceTree, holds: Hold[], faceId: string, seam: Seam): CutResult {
  const face = getFace(tree, faceId)
  const left = clipToSide(face.outline, seam, true)
  const right = clipToSide(face.outline, seam, false)
  const nearIsLeft = nearSideIsLeft(tree, face, seam)
  const nearOutline = nearIsLeft ? left : right
  const farInFace = nearIsLeft ? right : left

  const newFaceId = createFaceId()
  const farSeam = edgeMatching(nearOutline, seam.a, seam.b)
  const near: WallFace = { ...face, outline: nearOutline, childIds: [] }
  const farFrame = seamFrame(near, farSeam)
  const far: WallFace = {
    id: newFaceId,
    parentId: faceId,
    seamEdge: farSeam,
    outline: startAtHinge(farInFace.map((p) => pointToChild(farFrame, p))),
    angle: 0,
    /* A cut splits one painted panel, so both halves keep the paint */
    color: face.color,
    childIds: [],
  }

  const byId: Record<string, WallFace> = { ...tree.byId, [faceId]: near, [newFaceId]: far }
  const nearChildren: string[] = []
  const farChildren: string[] = []
  let nextHolds = holds

  for (const childId of face.childIds) {
    const child = getFace(tree, childId)
    const [p, q] = edgeOf(face.outline, child.seamEdge!)
    const oldFrame = seamFrame(face, child.seamEdge!)

    const onNear = findEdgeThrough(nearOutline, p, q)
    if (onNear >= 0) {
      const moved = rebase(child, nextHolds, oldFrame, seamFrame(near, onNear), {
        parentId: faceId,
        seamEdge: onNear,
      })
      byId[childId] = moved.face
      nextHolds = moved.holds
      nearChildren.push(childId)
      continue
    }

    const onFar = findEdgeThrough(far.outline, pointToChild(farFrame, p), pointToChild(farFrame, q))
    const moved = rebase(child, nextHolds, oldFrame, frameToParent(farFrame, seamFrame(far, onFar)), {
      parentId: newFaceId,
      seamEdge: onFar,
    })
    byId[childId] = moved.face
    nextHolds = moved.holds
    farChildren.push(childId)
  }

  byId[faceId] = { ...near, childIds: [...nearChildren, newFaceId] }
  byId[newFaceId] = { ...far, childIds: farChildren }

  nextHolds = nextHolds.map((hold) => {
    if (hold.faceId !== faceId) return hold

    const at: Point2 = [hold.u, hold.v]
    const onLeft = sideOf(seam, at) > EPSILON
    if (onLeft === nearIsLeft) return clampOnto(hold, nearOutline)

    const [u, v] = pointToChild(farFrame, at)
    return clampOnto({ ...hold, faceId: newFaceId, u, v }, far.outline)
  })

  return { tree: { rootId: tree.rootId, byId }, holds: nextHolds, newFaceId }
}

/** Rotates an outline so it starts where its hinge does, which is easier to read and to test */
function startAtHinge(outline: Point2[]): Point2[] {
  let start = 0
  for (let i = 1; i < outline.length; i++) {
    const [u, v] = outline[i]
    const [su, sv] = outline[start]
    if (v < sv - EPSILON || (Math.abs(v - sv) < EPSILON && u < su)) start = i
  }
  return [...outline.slice(start), ...outline.slice(0, start)]
}

export function cutFaceTree(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  axis: CutAxis,
  at: number,
): CutResult {
  const seam = seamForAxis(tree, faceId, axis, at)
  if (!seam) throw new Error(`No ${axis} seam at ${at} on face ${faceId}`)
  return cutFaceAlong(tree, holds, faceId, seam)
}

/** Whether a face can be merged back into its parent: its seam spans the parent's whole edge and the union stays convex */
export function canMergeIntoParent(tree: FaceTree, faceId: string): boolean {
  return mergedOutline(tree, getFace(tree, faceId)) !== null
}

/**
 * Gives a face's surface back to its parent, undoing a cut rather than
 * destroying plywood. The merged face's holds and children come along.
 *
 * Refused, leaving the tree as it is, when the face no longer spans the whole
 * edge it hinges on or the union would not be convex: a later cut has made an
 * L of the pair, and the tree cannot hold one.
 */
export function mergeFaceIntoParent(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
): { tree: FaceTree; holds: Hold[] } {
  const face = getFace(tree, faceId)
  if (!face.parentId || face.seamEdge === null) return { tree, holds }

  const merged = mergedOutline(tree, face)
  if (!merged) return { tree, holds }

  const parent = getFace(tree, face.parentId)
  const frame = seamFrame(parent, face.seamEdge)
  const mergedParent: WallFace = { ...parent, outline: merged, childIds: [] }

  const byId: Record<string, WallFace> = { ...tree.byId, [parent.id]: mergedParent }
  delete byId[faceId]
  const children: string[] = []
  let nextHolds = holds.map((hold) => {
    if (hold.faceId !== faceId) return hold
    const [u, v] = pointToParent(frame, [hold.u, hold.v])
    return clampOnto({ ...hold, faceId: parent.id, u, v }, merged)
  })

  /* The parent's other children keep their edge lines but the edges may have
     been renumbered or extended; the merged face's children arrive through
     its frame. Both are the same re-attachment */
  const reattach = (childId: string, viaFrame: SeamFrame, from: WallFace) => {
    const child = getFace(tree, childId)
    const [p, q] = edgeOf(from.outline, child.seamEdge!)
    const inParent: [Point2, Point2] = [pointToParent(viaFrame, p), pointToParent(viaFrame, q)]
    const onMerged = findEdgeThrough(merged, inParent[0], inParent[1])
    const oldFrame = frameToParent(viaFrame, seamFrame(from, child.seamEdge!))
    const moved = rebase(child, nextHolds, oldFrame, seamFrame(mergedParent, onMerged), {
      parentId: parent.id,
      seamEdge: onMerged,
    })
    byId[childId] = moved.face
    nextHolds = moved.holds
    children.push(childId)
  }

  for (const childId of parent.childIds) {
    if (childId !== faceId) reattach(childId, IDENTITY, parent)
  }
  for (const childId of face.childIds) reattach(childId, frame, face)

  byId[parent.id] = { ...mergedParent, childIds: children }

  return { tree: { rootId: tree.rootId, byId }, holds: nextHolds }
}

/** The parent's outline with the face's plywood added, or null when the pair cannot be one convex panel */
function mergedOutline(tree: FaceTree, face: WallFace): Point2[] | null {
  if (!face.parentId || face.seamEdge === null) return null

  const parent = getFace(tree, face.parentId)
  const frame = seamFrame(parent, face.seamEdge)
  const [a, b] = edgeOf(parent.outline, face.seamEdge)
  const seamLength = Math.hypot(a[0] - b[0], a[1] - b[1])

  const { from, to } = hingeSegment(face)
  if (from > EPSILON || Math.abs(to - seamLength) > EPSILON) return null

  const inParent = face.outline.map((p) => pointToParent(frame, p))
  const atA = inParent.findIndex((p) => samePoint(p, a))
  const atB = inParent.findIndex((p) => samePoint(p, b))
  if (atA < 0 || atB < 0) return null

  /* Walk the face's border from A round to B: that is the parent's edge A->B
     replaced by everything the face adds beyond it */
  const beyond: Point2[] = []
  for (let i = (atA + 1) % inParent.length; i !== atB; i = (i + 1) % inParent.length) {
    beyond.push(inParent[i])
  }

  const k = face.seamEdge
  const union = dropCollinear([...parent.outline.slice(0, k + 1), ...beyond, ...parent.outline.slice(k + 1)])
  return isConvexCCW(union) ? union : null
}

function dropCollinear(outline: Point2[]): Point2[] {
  const kept: Point2[] = []
  for (let i = 0; i < outline.length; i++) {
    const previous = outline[(i + outline.length - 1) % outline.length]
    const point = outline[i]
    const next = outline[(i + 1) % outline.length]
    if (samePoint(point, next)) continue
    const turn = cross(subtract(point, previous), subtract(next, point))
    if (Math.abs(turn) < EPSILON) continue
    kept.push(point)
  }
  return kept
}

/** Pulls every hold back onto its own face, for after a face has shrunk */
export function reclampHolds(tree: FaceTree, holds: Hold[]): Hold[] {
  return holds.map((hold) => clampOnto(hold, getFace(tree, hold.faceId).outline))
}

function clampOnto(hold: Hold, outline: Point2[]): Hold {
  const clamped = clampHoldToFace(hold.u, hold.v, hold.collisionBox, outline)
  return { ...hold, u: clamped.u, v: clamped.v }
}
