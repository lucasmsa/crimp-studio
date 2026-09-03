import type { FaceTree, Point2, WallFace } from '@crimp-studio/wall-geometry'
import { findEdgeThrough, pointToChild, rectOutline, seamFrame } from '@crimp-studio/wall-geometry'
import type { Hold, HoldType, Wall } from '@/stores/wallStore'
import { measureHoldFootprint } from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'

/**
 * Bumped when the shape below changes in a way an older reader cannot handle.
 * 1: faces were rectangles with a named hinge. 2: faces carry an outline and
 * the index of the parent edge they hinge on (ADR-010).
 */
export const WALL_DOCUMENT_VERSION = 2

/** A hold as it is written down: what was chosen, never what was measured */
export interface SavedHold {
  id: string
  type: HoldType
  faceId: string
  u: number
  v: number
  size: number
  rotation?: number
  color?: string
  variant?: string
}

export interface WallDocument {
  version: number
  id: string
  name: string
  /** ISO 8601, so a document sorts and reads without a parser */
  savedAt: string
  wall: {
    width: number
    height: number
    faces: FaceTree
    holds: SavedHold[]
  }
}

/** What the library shows about a wall without opening it */
export interface WallSummary {
  id: string
  name: string
  savedAt: string
  faceCount: number
  holdCount: number
}

export type ParseResult =
  | { ok: true; document: WallDocument }
  | { ok: false; reason: ParseFailure }

/** Why a saved wall was refused, for the message that says so */
export type ParseFailure = 'unreadable' | 'not-a-wall' | 'future-version'

const HOLD_TYPES: HoldType[] = ['jug', 'crimp', 'sloper', 'pinch', 'pocket', 'volume']

/**
 * A wall on its way to storage.
 *
 * Collision boxes are left behind. A box is measured from the hold's model, so
 * a stored one is wrong the moment that model is rescaled, and measuring it
 * again on the way back costs nothing (ADR-009).
 */
export function toDocument(wall: Wall, name: string, savedAt: string, id = wall.id): WallDocument {
  return {
    version: WALL_DOCUMENT_VERSION,
    id,
    name,
    savedAt,
    wall: {
      width: wall.width,
      height: wall.height,
      faces: wall.faces,
      holds: wall.holds.map(savedHold),
    },
  }
}

/** A wall on its way back, with every hold measured for the models in the app now */
export function fromDocument(document: WallDocument): Wall {
  return {
    id: document.id,
    name: document.name,
    width: document.wall.width,
    height: document.wall.height,
    faces: document.wall.faces,
    holds: document.wall.holds.map(restoredHold),
  }
}

/**
 * The wall as a string, for telling whether it has changed since it was last
 * written. Only what is saved counts, so moving the camera or selecting a hold
 * is not a change to the wall.
 */
export function signatureOf(wall: Wall): string {
  return JSON.stringify(toDocument(wall, wall.name, '').wall)
}

export function summarise(document: WallDocument): WallSummary {
  return {
    id: document.id,
    name: document.name,
    savedAt: document.savedAt,
    faceCount: Object.keys(document.wall.faces.byId).length,
    holdCount: document.wall.holds.length,
  }
}

/**
 * Reads a saved wall, or says why it will not.
 *
 * All or nothing: a half-read wall is worse than a refused one, so anything
 * that does not parse or does not have the shape of a wall is turned away and
 * the wall on screen is left alone (ADR-009). A wall written by an older
 * editor is brought up to the current shape on the way in.
 */
export function parseDocument(raw: string): ParseResult {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  if (!isWallEnvelope(value)) return { ok: false, reason: 'not-a-wall' }
  if (value.version > WALL_DOCUMENT_VERSION) return { ok: false, reason: 'future-version' }

  if (value.version <= 1) {
    if (!isFaceTreeOf(value.wall.faces, isWallFaceV1)) return { ok: false, reason: 'not-a-wall' }
    return { ok: true, document: migrateV1toV2(value as WallDocumentV1) }
  }

  if (!isFaceTreeOf(value.wall.faces, isWallFaceV2)) return { ok: false, reason: 'not-a-wall' }
  return { ok: true, document: value as WallDocument }
}

function savedHold(hold: Hold): SavedHold {
  const { id, type, faceId, u, v, size, rotation, color, variant } = hold
  return { id, type, faceId, u, v, size, rotation, color, variant }
}

function restoredHold(hold: SavedHold): Hold {
  return {
    ...hold,
    collisionBox: measureHoldFootprint(hold.type, hold.variant, hold.size, hold.rotation),
  }
}

/* ---- Version 1: rectangular faces with a named hinge ---- */

interface WallFaceV1 {
  id: string
  parentId: string | null
  hinge?: 'bottom' | 'left' | null
  width: number
  height: number
  angle: number
  color: string
  childIds: string[]
}

interface WallDocumentV1 extends Omit<WallDocument, 'wall'> {
  wall: Omit<WallDocument['wall'], 'faces'> & {
    faces: { rootId: string; byId: Record<string, WallFaceV1> }
  }
}

/**
 * A version 1 wall in version 2 terms.
 *
 * A rectangle becomes its four corners. A face hinged 'bottom' sat on its
 * parent's top edge in the same frame, so it only gains the edge's index. A
 * face hinged 'left' sat on the parent's right edge with its frame unturned;
 * version 2 turns a frame to run down a vertical seam, so its corners and holds
 * are re-expressed and its holds turn with it. The world position of every
 * hold is unchanged, which is the one thing that has to survive.
 */
function migrateV1toV2(document: WallDocumentV1): WallDocument {
  const old = document.wall.faces.byId
  const byId: Record<string, WallFace> = {}
  /* Each face's old coordinates in its new frame, and the turn that took them there */
  const remap: Record<string, { map: (p: Point2) => Point2; turnDeg: number }> = {}

  const convert = (faceId: string) => {
    const face = old[faceId]
    const corners = rectOutline(face.width, face.height)

    if (face.parentId === null) {
      byId[faceId] = {
        id: face.id,
        parentId: null,
        seamEdge: null,
        outline: corners,
        angle: face.angle,
        color: face.color,
        childIds: face.childIds,
      }
      remap[faceId] = { map: (p) => p, turnDeg: 0 }
    } else {
      const parent = old[face.parentId]
      const parentNew = byId[face.parentId]
      const parentMap = remap[face.parentId].map

      /* The child's old frame sat at the parent's top-left or bottom-right
         corner with unturned axes; its hinge ran along the parent's whole top
         or right edge */
      const origin: Point2 = face.hinge === 'left' ? [parent.width, 0] : [0, parent.height]
      const edge: [Point2, Point2] =
        face.hinge === 'left'
          ? [
              [parent.width, 0],
              [parent.width, parent.height],
            ]
          : [
              [0, parent.height],
              [parent.width, parent.height],
            ]

      const seamEdge = findEdgeThrough(parentNew.outline, parentMap(edge[0]), parentMap(edge[1]))
      const frame = seamFrame(parentNew, seamEdge)
      const map = (p: Point2): Point2 =>
        pointToChild(frame, parentMap([origin[0] + p[0], origin[1] + p[1]]))

      const at = map([0, 0])
      const along = map([1, 0])
      const turnDeg = (Math.atan2(along[1] - at[1], along[0] - at[0]) * 180) / Math.PI

      byId[faceId] = {
        id: face.id,
        parentId: face.parentId,
        seamEdge,
        outline: corners.map(map),
        angle: face.angle,
        color: face.color,
        childIds: face.childIds,
      }
      remap[faceId] = { map, turnDeg }
    }

    face.childIds.forEach(convert)
  }
  convert(document.wall.faces.rootId)

  const holds = document.wall.holds.map((hold) => {
    const moved = remap[hold.faceId]
    if (!moved) return hold

    const [u, v] = moved.map([hold.u, hold.v])
    if (Math.abs(moved.turnDeg) < 1e-9) return { ...hold, u, v }

    /* The frame turned under the hold; the hold itself did not, so its stored
       rotation, which is read against the frame, gains the turn the old u axis
       now shows in the new frame */
    const rotation = (((hold.rotation ?? 0) + moved.turnDeg) % 360 + 360) % 360
    return { ...hold, u, v, rotation }
  })

  return {
    ...document,
    version: WALL_DOCUMENT_VERSION,
    wall: {
      ...document.wall,
      faces: { rootId: document.wall.faces.rootId, byId },
      holds,
    },
  }
}

/* ---- Shape checks ---- */

/** Everything about a saved wall except the shape of its faces, which is versioned */
function isWallEnvelope(
  value: unknown,
): value is WallDocument & { wall: { faces: { rootId: string; byId: Record<string, unknown> } } } {
  if (!isRecord(value)) return false
  if (typeof value.version !== 'number') return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
  if (typeof value.savedAt !== 'string') return false

  const wall = value.wall
  if (!isRecord(wall)) return false
  if (typeof wall.width !== 'number' || typeof wall.height !== 'number') return false
  if (!Array.isArray(wall.holds) || !wall.holds.every(isSavedHold)) return false

  const faces = wall.faces
  return isRecord(faces) && typeof faces.rootId === 'string' && isRecord(faces.byId)
}

/** A tree, not a bag of faces: every id resolves and every parent is present */
function isFaceTreeOf<T extends { parentId: string | null }>(
  value: { rootId: string; byId: Record<string, unknown> },
  isFace: (face: unknown, byId: Record<string, unknown>) => face is T,
): boolean {
  const faces = Object.values(value.byId)
  if (!faces.every((face) => isFace(face, value.byId))) return false
  if (!(value.rootId in value.byId)) return false

  return faces.every(
    (face) => (face as T).parentId === null || ((face as T).parentId as string) in value.byId,
  )
}

function isWallFaceBase(value: unknown): value is Record<string, unknown> & {
  id: string
  angle: number
  color: string
  childIds: string[]
  parentId: string | null
} {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.angle !== 'number' || typeof value.color !== 'string') return false
  if (!Array.isArray(value.childIds) || !value.childIds.every((id) => typeof id === 'string')) {
    return false
  }

  return value.parentId === null || typeof value.parentId === 'string'
}

function isWallFaceV1(value: unknown): value is WallFaceV1 {
  if (!isWallFaceBase(value)) return false
  if (typeof value.width !== 'number' || typeof value.height !== 'number') return false

  return value.hinge === undefined || value.hinge === null || value.hinge === 'bottom' || value.hinge === 'left'
}

/** An outline of at least three points and, off the root, a seam that names one of the parent's edges */
function isWallFaceV2(value: unknown, byId: Record<string, unknown>): value is WallFace {
  if (!isWallFaceBase(value)) return false

  const outline = value.outline
  if (!Array.isArray(outline) || outline.length < 3 || !outline.every(isPoint)) return false

  if (value.parentId === null) return value.seamEdge === null

  const parent = byId[value.parentId]
  const edges = isRecord(parent) && Array.isArray(parent.outline) ? parent.outline.length : 0
  return Number.isInteger(value.seamEdge) && (value.seamEdge as number) >= 0 && (value.seamEdge as number) < edges
}

function isPoint(value: unknown): value is Point2 {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  )
}

function isSavedHold(value: unknown): value is SavedHold {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || typeof value.faceId !== 'string') return false
  if (!HOLD_TYPES.includes(value.type as HoldType)) return false
  if (typeof value.u !== 'number' || typeof value.v !== 'number') return false

  return typeof value.size === 'number'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
