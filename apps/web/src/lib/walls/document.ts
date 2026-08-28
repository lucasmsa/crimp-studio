import type { FaceTree, WallFace } from '@crimp-studio/wall-geometry'
import type { Hold, HoldType, Wall } from '@/stores/wallStore'
import { measureHoldFootprint } from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'

/** Bumped when the shape below changes in a way an older reader cannot handle */
export const WALL_DOCUMENT_VERSION = 1

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
 * the wall on screen is left alone (ADR-009).
 */
export function parseDocument(raw: string): ParseResult {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  if (!isWallDocument(value)) return { ok: false, reason: 'not-a-wall' }
  if (value.version > WALL_DOCUMENT_VERSION) return { ok: false, reason: 'future-version' }

  return { ok: true, document: value }
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

function isWallDocument(value: unknown): value is WallDocument {
  if (!isRecord(value)) return false
  if (typeof value.version !== 'number') return false
  if (typeof value.id !== 'string' || typeof value.name !== 'string') return false
  if (typeof value.savedAt !== 'string') return false

  const wall = value.wall
  if (!isRecord(wall)) return false
  if (typeof wall.width !== 'number' || typeof wall.height !== 'number') return false
  if (!Array.isArray(wall.holds) || !wall.holds.every(isSavedHold)) return false

  return isFaceTree(wall.faces)
}

/** A tree, not a bag of faces: every id resolves and every parent is present */
function isFaceTree(value: unknown): value is FaceTree {
  if (!isRecord(value)) return false
  if (typeof value.rootId !== 'string' || !isRecord(value.byId)) return false

  const faces = Object.values(value.byId)
  if (!faces.every(isWallFace)) return false
  if (!(value.rootId in value.byId)) return false

  return faces.every(
    (face) => face.parentId === null || (face.parentId as string) in (value.byId as object),
  )
}

function isWallFace(value: unknown): value is WallFace {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.width !== 'number' || typeof value.height !== 'number') return false
  if (typeof value.angle !== 'number' || typeof value.color !== 'string') return false
  if (!Array.isArray(value.childIds) || !value.childIds.every((id) => typeof id === 'string')) {
    return false
  }

  return value.parentId === null || typeof value.parentId === 'string'
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
