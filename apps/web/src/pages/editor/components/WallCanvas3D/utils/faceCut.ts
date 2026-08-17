import type { Hold } from '@/stores/wallStore'
import type { FaceTree, HingeEdge, WallFace } from './faceTree'
import { getFace } from './faceTree'
import { clampHoldToFace } from './holdBounds'

/** 'across' splits the face into a lower and an upper half, 'up' into a left and a right one */
export type CutAxis = 'across' | 'up'

/** A panel smaller than this is not a climbing surface, it is a strip of trim */
export const MIN_FACE_SIZE = 40

export type CutRefusal = 'too-small' | 'child-in-the-way' | 'holds-in-the-way'

export interface CutCheck {
  ok: boolean
  reason?: CutRefusal
  /** Holds the seam would pass through, so the UI can point at them */
  blockingHoldIds: string[]
}

const createFaceId = () => `face_${Math.random().toString(36).substring(2, 9)}`

/* A cut runs the full span of a face, so it collides with any child hinged on
   the edge it crosses: an across-cut crosses a left-hinged child's edge, and
   an up-cut crosses a bottom-hinged one's. */
const CROSSED_HINGE: Record<CutAxis, HingeEdge> = {
  across: 'left',
  up: 'bottom',
}

function faceExtent(face: WallFace, axis: CutAxis): number {
  return axis === 'across' ? face.height : face.width
}

function holdOffset(hold: Hold, axis: CutAxis): number {
  return axis === 'across' ? hold.v : hold.u
}

function holdHalfExtent(hold: Hold, axis: CutAxis): number {
  const box = hold.collisionBox
  if (!box) return 0
  return axis === 'across' ? box.halfH : box.halfW
}

/**
 * A cut is legal when both halves stay usable, no child hinges on the edge it
 * crosses, and it does not pass through a hold. Real holds do not span a bend,
 * so the hold rule keeps the "one hold, one face" invariant intact.
 */
export function canCutFace(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  axis: CutAxis,
  at: number,
): CutCheck {
  const face = getFace(tree, faceId)
  const extent = faceExtent(face, axis)

  if (at < MIN_FACE_SIZE || extent - at < MIN_FACE_SIZE) {
    return { ok: false, reason: 'too-small', blockingHoldIds: [] }
  }

  const crossedHinge = CROSSED_HINGE[axis]
  if (face.childIds.some((id) => getFace(tree, id).hinge === crossedHinge)) {
    return { ok: false, reason: 'child-in-the-way', blockingHoldIds: [] }
  }

  const blockingHoldIds = holds
    .filter((hold) => hold.faceId === faceId)
    .filter((hold) => Math.abs(holdOffset(hold, axis) - at) < holdHalfExtent(hold, axis))
    .map((hold) => hold.id)

  if (blockingHoldIds.length > 0) {
    return { ok: false, reason: 'holds-in-the-way', blockingHoldIds }
  }

  return { ok: true, blockingHoldIds: [] }
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
  const extent = faceExtent(getFace(tree, faceId), axis)
  const legal = (at: number) => canCutFace(tree, holds, faceId, axis, at).ok

  if (legal(preferred)) return preferred

  for (let offset = 5; offset <= extent; offset += 5) {
    if (legal(preferred + offset)) return preferred + offset
    if (legal(preferred - offset)) return preferred - offset
  }

  return null
}

export interface CutResult {
  tree: FaceTree
  holds: Hold[]
  newFaceId: string
}

/**
 * Splits a face in two. The original keeps the near side and its own hinge, so
 * the floor pin never moves; the far side becomes a new child hinged on the
 * seam, flush with its parent until it is angled.
 */
export function cutFaceTree(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
  axis: CutAxis,
  at: number,
): CutResult {
  const face = getFace(tree, faceId)
  const newFaceId = createFaceId()
  const acrossCut = axis === 'across'
  const hinge: HingeEdge = acrossCut ? 'bottom' : 'left'

  /* Children hinged on the far edge move with the piece that still carries
     that edge; a child on the near edge stays where it is */
  const movingChildIds = face.childIds.filter((id) => getFace(tree, id).hinge === hinge)
  const stayingChildIds = face.childIds.filter((id) => !movingChildIds.includes(id))

  const newFace: WallFace = {
    id: newFaceId,
    parentId: faceId,
    hinge,
    width: acrossCut ? face.width : face.width - at,
    height: acrossCut ? face.height - at : face.height,
    angle: 0,
    childIds: movingChildIds,
  }

  const byId: Record<string, WallFace> = {
    ...tree.byId,
    [faceId]: {
      ...face,
      width: acrossCut ? face.width : at,
      height: acrossCut ? at : face.height,
      childIds: [...stayingChildIds, newFaceId],
    },
    [newFaceId]: newFace,
  }

  for (const childId of movingChildIds) {
    byId[childId] = { ...byId[childId], parentId: newFaceId }
  }

  const nextTree: FaceTree = { rootId: tree.rootId, byId }

  const nextHolds = holds.map((hold) => {
    if (hold.faceId !== faceId || holdOffset(hold, axis) < at) return hold

    const moved = acrossCut
      ? { ...hold, faceId: newFaceId, v: hold.v - at }
      : { ...hold, faceId: newFaceId, u: hold.u - at }

    return clampHoldOntoFace(moved, newFace)
  })

  return { tree: nextTree, holds: nextHolds.map((hold) => reclamp(hold, nextTree)), newFaceId }
}

/**
 * Gives a face's surface back to its parent, undoing a cut rather than
 * destroying plywood. The merged face's holds and children come along.
 */
export function mergeFaceIntoParent(
  tree: FaceTree,
  holds: Hold[],
  faceId: string,
): { tree: FaceTree; holds: Hold[] } {
  const face = getFace(tree, faceId)
  if (!face.parentId) return { tree, holds }

  const parent = getFace(tree, face.parentId)
  const acrossHinge = face.hinge === 'bottom'
  const parentExtent = acrossHinge ? parent.height : parent.width

  const mergedParent: WallFace = {
    ...parent,
    width: acrossHinge ? parent.width : parent.width + face.width,
    height: acrossHinge ? parent.height + face.height : parent.height,
    childIds: [...parent.childIds.filter((id) => id !== faceId), ...face.childIds],
  }

  const byId: Record<string, WallFace> = { ...tree.byId, [parent.id]: mergedParent }
  delete byId[faceId]

  for (const childId of face.childIds) {
    byId[childId] = { ...byId[childId], parentId: parent.id }
  }

  const nextTree: FaceTree = { rootId: tree.rootId, byId }

  const nextHolds = holds.map((hold) => {
    if (hold.faceId !== faceId) return hold

    const rebased = acrossHinge
      ? { ...hold, faceId: parent.id, v: hold.v + parentExtent }
      : { ...hold, faceId: parent.id, u: hold.u + parentExtent }

    return clampHoldOntoFace(rebased, mergedParent)
  })

  return { tree: nextTree, holds: nextHolds }
}

/** Pulls every hold back onto its own face, for after a face has shrunk */
export function reclampHolds(tree: FaceTree, holds: Hold[]): Hold[] {
  return holds.map((hold) => reclamp(hold, tree))
}

function reclamp(hold: Hold, tree: FaceTree): Hold {
  return clampHoldOntoFace(hold, getFace(tree, hold.faceId))
}

function clampHoldOntoFace(hold: Hold, face: WallFace): Hold {
  const clamped = clampHoldToFace(hold.u, hold.v, hold.collisionBox, face.width, face.height)
  return { ...hold, u: clamped.u, v: clamped.v }
}
