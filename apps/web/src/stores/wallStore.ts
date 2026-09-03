import { create } from 'zustand'
import { temporal } from 'zundo'
import { colors } from '@/lib/colors'
import { historyEquality, type LastEdit } from './utils/historyEquality'
import {
  getModelVariant,
  getModelVariants,
  pickModelVariant,
} from '@/pages/editor/components/WallCanvas3D/utils/holdModels'
import { measureHoldFootprint } from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'
import { refitHold } from '@/pages/editor/components/WallCanvas3D/utils/holdRefit'
import { getNextRotation } from '@/pages/editor/components/WallCanvas3D/utils/holdActions'
import { clampHoldToFace } from '@/pages/editor/components/WallCanvas3D/utils/holdBounds'
import type { FaceTree } from '@crimp-studio/wall-geometry'
import {
  createRootFaceTree,
  findLegalFaceAngle,
  findWallOverlaps,
  findHoldObstruction,
  findLegalHoldMove,
  getFace,
  holdPlacementIsClear,
} from '@crimp-studio/wall-geometry'
import type { CutAxis } from '@/pages/editor/components/WallCanvas3D/utils/faceCut'
import {
  canCutFace,
  cutFaceTree,
  mergeFaceIntoParent,
} from '@/pages/editor/components/WallCanvas3D/utils/faceCut'
import {
  clampFaceAngle,
  getAngleLimits,
} from '@/pages/editor/components/WallCanvas3D/config/faceAngleConfig'

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface CollisionBox {
  halfW: number  // half-width in cm (u extent)
  halfH: number  // half-height in cm (v extent)
  depth: number  // how far the hold stands off the panel, cm
}

export interface Hold {
  id: string
  type: HoldType
  /** The face this hold is bolted to; its footprint never leaves that face */
  faceId: string
  u: number       // cm from the face's left edge
  v: number       // cm from the face's bottom edge
  rotation?: number
  size: number
  color?: string   // optional per-hold color override
  /** GLB model variant for this hold; undefined = procedural geometry */
  variant?: string
  /** XY bounding box measured from actual geometry, set by Hold3D after mount */
  collisionBox?: CollisionBox
}

/**
 * A hold being carried by the pointer.
 *
 * The wall does not move until the drag lands, so what the store holds is a
 * wall that can be built even while one is being waved over a neighbour
 * (ADR-007, amended). This is what the renderer draws instead of the hold.
 */
export interface HeldHold {
  id: string
  faceId: string
  u: number
  v: number
  /** Nothing is in the way, so letting go here would land it */
  clear: boolean
  /** The holds it is sitting on, which say so along with it */
  blockedHoldIds: string[]
}

export interface Wall {
  id: string
  name: string
  /** Plywood width in cm. Bending preserves this, so it is not the world width */
  width: number
  /** Plywood height in cm, likewise unchanged by bending */
  height: number
  /** Flat faces hinged into a profile; one root face means a flat wall */
  faces: FaceTree
  holds: Hold[]
}

/** What a click on the canvas is aiming at */
export type EditorMode = 'holds' | 'shape'

interface WallState {
  wall: Wall
  editorMode: EditorMode
  selectedHoldId: string | null
  /** The face being shaped; clicks inside it place holds */
  selectedFaceId: string | null
  /** Where the pointer last landed on a face, so a cut splits there */
  faceCutPoint: { faceId: string; u: number; v: number } | null
  selectedHoldType: HoldType
  /**
   * The model armed for each type, so switching type and back restores the pick
   * rather than resetting it. A type with no entry, or null, is on random: its
   * holds take the model their id hashes to (ADR-008)
   */
  variantByType: Partial<Record<HoldType, string | null>>
  /** Holds playing their pop-off exit animation; removed on animation rest */
  deletingHoldIds: string[]
  /** Holds that stopped the last bend, so the editor can point at them */
  blockingHoldIds: string[]
  /** A hold under the pointer, before the drag lands. Null when none is moving */
  heldHold: HeldHold | null
  /**
   * Holds an undo or redo took off the wall, still drawn while they pop off.
   * The wall itself changed at once; these are what the renderer shows in the
   * meantime, so a step looks like a delete rather than a vanishing (ADR-012)
   */
  leavingHolds: Hold[]
  /**
   * The edit that produced this wall. Every edit writes it; a measurement or a
   * load leaves it alone, which is how history tells the two apart (ADR-012)
   */
  lastEdit: LastEdit | null

  /** Places a hold at (u, v) on the given face */
  addHold: (faceId: string, u: number, v: number) => void
  setHoldColor: (id: string, color: string) => void
  /** Records the box measured from the hold's geometry. Not an edit */
  reportCollisionBox: (id: string, collisionBox: CollisionBox) => void
  /**
   * Steps a hold toward a spot, sliding it along whatever is in the way rather
   * than passing through. Keyboard nudges only: a drag is carried and dropped
   */
  moveHold: (id: string, u: number, v: number, faceId?: string) => void
  /** Turns a hold, re-measuring its footprint and refusing if it no longer fits */
  rotateHold: (id: string) => void
  /** Starts the exit animation; HoldMesh calls removeHold when it rests */
  markHoldDeleting: (id: string) => void
  removeHold: (id: string) => void
  /** Removes every hold still popping off, at once, as one edit */
  flushPendingDeletes: () => void
  /** Holds a history step removed, to be drawn leaving. Any that came back are dropped */
  showLeaving: (holds: Hold[]) => void
  /** A leaving hold has finished popping off */
  dismissLeaving: (id: string) => void
  selectHold: (id: string | null) => void
  setEditorMode: (mode: EditorMode) => void
  selectFace: (faceId: string | null) => void
  setFaceCutPoint: (point: { faceId: string; u: number; v: number }) => void
  /** Splits a face in two along the seam; refuses if canCutFace says no */
  cutFace: (faceId: string, axis: CutAxis, at: number) => void
  /** Bends a panel about its seam, stopping where it meets whatever is in the way */
  setFaceAngle: (faceId: string, bendDeg: number) => void
  /** Merges a face back into its parent, undoing its cut */
  removeFace: (faceId: string) => void
  setSelectedHoldType: (type: HoldType) => void
  /** Arms a model for the current type; null puts that type back on random */
  setSelectedVariant: (variant: string | null) => void
  /** Retypes a hold, re-measuring it and refusing if the new shape does not fit */
  setHoldType: (id: string, type: HoldType) => void
  /** Gives a hold another model of its own type, refusing if it does not fit */
  setHoldVariant: (id: string, variant: string) => void
  /** Rolls a hold onto a different model of its type that fits where it sits */
  rollHoldVariant: (id: string) => void
  /** Paints one panel. Colour lives on the face, so neighbours keep theirs */
  setFaceColor: (faceId: string, color: string) => void
  /** Stops pointing at the holds that blocked the last bend */
  clearBlockingHolds: () => void
  clearHolds: () => void
  /** Puts a whole wall in place of the current one, as loading a saved one does */
  replaceWall: (wall: Wall) => void
  /** Carries a hold with the pointer. The wall itself does not move yet */
  holdHold: (id: string, u: number, v: number, faceId?: string) => void
  /** Lets go: the hold lands where it is if it fits, and goes home if it does not */
  dropHold: () => void
}

const createId = () => Math.random().toString(36).substring(2, 9)

/**
 * The model a hold of this type gets. The armed pick when there is one, and
 * otherwise the model the hold's own id hashes to, which is what spreads models
 * across placements while a type is on random.
 */
function armedVariant(
  variantByType: Partial<Record<HoldType, string | null>>,
  type: HoldType,
  holdId: string,
): string | undefined {
  const armed = variantByType[type]
  return armed && getModelVariant(type, armed) ? armed : pickModelVariant(holdId, type)
}

/** Every hold named in a list of overlapping pairs */
function holdsInOverlaps(overlaps: ReturnType<typeof findWallOverlaps>): string[] {
  const ids = new Set<string>()

  for (const { a, b } of overlaps) {
    if (a.kind === 'hold' && a.id) ids.add(a.id)
    if (b.kind === 'hold' && b.id) ids.add(b.id)
  }

  return [...ids]
}

/** The hold as it would be with a different type or model, re-measured and
    pulled back onto its face if the new box would hang off an edge */
function refitAs(
  state: WallState,
  hold: Hold,
  changes: { type?: HoldType; variant?: string },
): Hold {
  const type = changes.type ?? hold.type
  const variant = changes.variant ?? hold.variant
  const collisionBox = measureHoldFootprint(type, variant, hold.size, hold.rotation)

  return refitHold(state.wall.faces, hold, collisionBox, { type, variant })
}

/**
 * A wall change that is history. The key names the action and its target, so a
 * repeat of the same key within the window reads as one edit still going
 * (ADR-012). Every recording action returns through here; a write that does
 * not is a measurement or a load.
 */
function edit(wall: Wall, key: string): Pick<WallState, 'wall' | 'lastEdit'> {
  return { wall, lastEdit: { key, at: Date.now() } }
}

/** Puts a changed hold back on the wall, or leaves the wall alone if it does not fit */
function commitHold(state: WallState, next: Hold, key: string): Partial<WallState> {
  if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, next)) return state

  return edit(
    { ...state.wall, holds: state.wall.holds.map((h) => (h.id === next.id ? next : h)) },
    key,
  )
}

const WALL_WIDTH = 400
const WALL_HEIGHT = 500

/** A fresh sheet of plywood, which is what the editor opens on and what New Wall gives */
export function createDefaultWall(): Wall {
  return {
    id: createId(),
    name: 'My Wall',
    width: WALL_WIDTH,
    height: WALL_HEIGHT,
    faces: createRootFaceTree(WALL_WIDTH, WALL_HEIGHT, colors.wall.surface),
    holds: [],
  }
}

export const useWallStore = create<WallState>()(
  temporal(
    (set) => ({
  wall: createDefaultWall(),
  editorMode: 'holds',
  selectedHoldId: null,
  /* The wall opens with nothing selected: controls come to a selection, so an
     editor that opens with a popover already up has nothing to show it about */
  selectedFaceId: null,
  faceCutPoint: null,
  selectedHoldType: 'jug',
  variantByType: {},
  deletingHoldIds: [],
  blockingHoldIds: [],
  heldHold: null,
  leavingHolds: [],
  lastEdit: null,

  addHold: (faceId, u, v) =>
    set((state) => {
      const type = state.selectedHoldType
      const size = 10
      const id = createId()
      const face = getFace(state.wall.faces, faceId)

      const variant = armedVariant(state.variantByType, type, id)
      const collisionBox = measureHoldFootprint(type, variant, size)

      /* Keep the full extents on the face, not just the center point */
      const clamped = clampHoldToFace(u, v, collisionBox, face.outline)
      const candidate = { id, faceId, u: clamped.u, v: clamped.v, collisionBox }

      if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, candidate)) return state

      return edit(
        {
          ...state.wall,
          holds: [
            ...state.wall.holds,
            {
              id,
              type,
              faceId,
              u: clamped.u,
              v: clamped.v,
              size,
              variant,
              collisionBox,
            },
          ],
        },
        `addHold:${id}`,
      )
    }),

  setHoldColor: (id, color) =>
    set((state) =>
      edit(
        {
          ...state.wall,
          holds: state.wall.holds.map((h) => (h.id === id ? { ...h, color } : h)),
        },
        `setHoldColor:${id}`,
      ),
    ),

  reportCollisionBox: (id, collisionBox) =>
    set((state) => {
      /* A hold drawn leaving measures itself too, and has no wall to write to */
      if (!state.wall.holds.some((h) => h.id === id)) return state

      return {
        wall: {
          ...state.wall,
          holds: state.wall.holds.map((h) => (h.id === id ? { ...h, collisionBox } : h)),
        },
      }
    }),

  moveHold: (id, u, v, faceId) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      const face = getFace(state.wall.faces, faceId ?? hold.faceId)
      const clamped = clampHoldToFace(u, v, hold.collisionBox, face.outline)
      const to = { ...hold, faceId: face.id, u: clamped.u, v: clamped.v }

      /* Never snapping back on release: every frame of a drag is a committed
         position, so a hold that cannot have the spot under the pointer goes as
         far toward it as it fits and slides along whatever stopped it */
      const reached = findLegalHoldMove({
        faces: state.wall.faces,
        holds: state.wall.holds,
        from: hold,
        to,
      })
      if (reached.faceId === hold.faceId && reached.u === hold.u && reached.v === hold.v) {
        return state
      }

      const moved = { ...hold, ...reached }

      return edit(
        { ...state.wall, holds: state.wall.holds.map((h) => (h.id === id ? moved : h)) },
        `moveHold:${id}`,
      )
    }),

  rotateHold: (id) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      const rotation = getNextRotation(hold.rotation)
      const collisionBox = measureHoldFootprint(hold.type, hold.variant, hold.size, rotation)
      const face = getFace(state.wall.faces, hold.faceId)
      const clamped = clampHoldToFace(hold.u, hold.v, collisionBox, face.outline)
      const turned = { ...hold, rotation, collisionBox, u: clamped.u, v: clamped.v }

      if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, turned)) return state

      return edit(
        { ...state.wall, holds: state.wall.holds.map((h) => (h.id === id ? turned : h)) },
        `rotateHold:${id}`,
      )
    }),

  markHoldDeleting: (id) =>
    set((state) => ({
      deletingHoldIds: state.deletingHoldIds.includes(id)
        ? state.deletingHoldIds
        : [...state.deletingHoldIds, id],
      selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
    })),

  removeHold: (id) =>
    set((state) => {
      const deletingHoldIds = state.deletingHoldIds.filter((d) => d !== id)
      /* Already gone, which a flush can arrange before the animation rests:
         an identical wall must not become an entry */
      if (!state.wall.holds.some((h) => h.id === id)) return { deletingHoldIds }

      return {
        ...edit(
          { ...state.wall, holds: state.wall.holds.filter((h) => h.id !== id) },
          `removeHold:${id}`,
        ),
        deletingHoldIds,
        selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
      }
    }),

  showLeaving: (holds) =>
    set((state) => {
      const onWall = new Set(state.wall.holds.map((h) => h.id))
      const leavingHolds = [...state.leavingHolds, ...holds].filter((h) => !onWall.has(h.id))
      return { leavingHolds }
    }),

  dismissLeaving: (id) =>
    set((state) => ({ leavingHolds: state.leavingHolds.filter((h) => h.id !== id) })),

  /* One write for all of them, so an undo asked for mid-animation undoes the
     delete the user is watching rather than the edit before it (ADR-012) */
  flushPendingDeletes: () =>
    set((state) => {
      if (state.deletingHoldIds.length === 0) return state
      const leaving = new Set(state.deletingHoldIds)

      return {
        ...edit(
          { ...state.wall, holds: state.wall.holds.filter((h) => !leaving.has(h.id)) },
          'removeHold:flush',
        ),
        deletingHoldIds: [],
        selectedHoldId:
          state.selectedHoldId && leaving.has(state.selectedHoldId) ? null : state.selectedHoldId,
      }
    }),

  /* Selecting one thing lets go of the other, so the card is never showing
     controls for something you are not looking at. Deselecting a hold leaves the
     panel focus alone.
     Selecting also arms what the hold is: the rail reads as the current hold
     type whether or not anything is selected, so letting go of a hold leaves the
     rail where the hold left it rather than jumping back (ADR-008) */
  selectHold: (id) =>
    set((state) => {
      const hold = id ? state.wall.holds.find((h) => h.id === id) : null
      if (!hold) return { selectedHoldId: id, selectedFaceId: id ? null : state.selectedFaceId }

      return {
        selectedHoldId: id,
        selectedFaceId: null,
        selectedHoldType: hold.type,
        variantByType: { ...state.variantByType, [hold.type]: hold.variant ?? null },
      }
    }),

  setEditorMode: (mode) => set({ editorMode: mode, selectedHoldId: null }),

  selectFace: (faceId) => set({ selectedFaceId: faceId, selectedHoldId: null }),

  setFaceCutPoint: (point) => set({ faceCutPoint: point }),

  cutFace: (faceId, axis, at) =>
    set((state) => {
      const check = canCutFace(state.wall.faces, state.wall.holds, faceId, axis, at)
      if (!check.ok) return state

      const cut = cutFaceTree(state.wall.faces, state.wall.holds, faceId, axis, at)

      return {
        ...edit({ ...state.wall, faces: cut.tree, holds: cut.holds }, `cutFace:${cut.newFaceId}`),
        selectedFaceId: cut.newFaceId,
      }
    }),

  setFaceAngle: (faceId, bendDeg) =>
    set((state) => {
      const face = getFace(state.wall.faces, faceId)
      const requested = clampFaceAngle(bendDeg, getAngleLimits(face.parentId === null))

      /* The panel stops where it meets a panel it is not hinged to, a hold, or
         the floor, rather than passing through it (ADR-007) */
      const limit = findLegalFaceAngle({
        faces: state.wall.faces,
        holds: state.wall.holds,
        faceId,
        from: face.angle,
        to: requested,
      })

      /* A preset already in force changes nothing, and nothing is not an edit */
      if (limit.angle === face.angle) return { blockingHoldIds: limit.blockingHoldIds }

      const faces = {
        rootId: state.wall.faces.rootId,
        byId: { ...state.wall.faces.byId, [faceId]: { ...face, angle: limit.angle } },
      }

      return {
        ...edit({ ...state.wall, faces }, `setFaceAngle:${faceId}`),
        blockingHoldIds: limit.blockingHoldIds,
      }
    }),

  removeFace: (faceId) =>
    set((state) => {
      const merged = mergeFaceIntoParent(state.wall.faces, state.wall.holds, faceId)
      if (merged.tree === state.wall.faces) return state

      return {
        ...edit(
          { ...state.wall, faces: merged.tree, holds: merged.holds },
          `removeFace:${faceId}`,
        ),
        selectedFaceId: state.selectedFaceId === faceId ? null : state.selectedFaceId,
      }
    }),

  setSelectedHoldType: (type) => set({ selectedHoldType: type }),

  setSelectedVariant: (variant) =>
    set((state) => ({
      variantByType: { ...state.variantByType, [state.selectedHoldType]: variant },
    })),

  setHoldType: (id, type) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold || hold.type === type) return state

      const variant = armedVariant(state.variantByType, type, hold.id)
      return commitHold(state, refitAs(state, hold, { type, variant }), `setHoldType:${id}`)
    }),

  setHoldVariant: (id, variant) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold || hold.variant === variant) return state

      return commitHold(state, refitAs(state, hold, { variant }), `setHoldVariant:${id}`)
    }),

  /* Rolling arms random rather than the model it landed on: the click said
     "surprise me", and the next hold placed should be surprised too (ADR-008) */
  rollHoldVariant: (id) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      /* Only models that fit where the hold sits, so a roll is never a click
         that quietly does nothing (ADR-008) */
      const reachable = getModelVariants(hold.type)
        .filter((model) => model.variant !== hold.variant)
        .map((model) => refitAs(state, hold, { variant: model.variant }))
        .filter((candidate) =>
          holdPlacementIsClear(state.wall.faces, state.wall.holds, candidate),
        )
      if (reachable.length === 0) return state

      return {
        ...commitHold(
          state,
          reachable[Math.floor(Math.random() * reachable.length)],
          `rollHoldVariant:${id}`,
        ),
        variantByType: { ...state.variantByType, [hold.type]: null },
      }
    }),

  setFaceColor: (faceId, color) =>
    set((state) =>
      edit(
        {
          ...state.wall,
          faces: {
            rootId: state.wall.faces.rootId,
            byId: {
              ...state.wall.faces.byId,
              [faceId]: { ...getFace(state.wall.faces, faceId), color },
            },
          },
        },
        `setFaceColor:${faceId}`,
      ),
    ),

  clearBlockingHolds: () => set({ blockingHoldIds: [] }),

  /* The pointer carries the hold; the wall stays where it is until the drag
     lands. A spot that does not fit is shown rather than refused, so the hold
     goes where your hand goes and says what it is sitting on (ADR-007) */
  holdHold: (id, u, v, faceId) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      const face = getFace(state.wall.faces, faceId ?? state.heldHold?.faceId ?? hold.faceId)
      /* The panel edge stays a wall: a hold off the plywood is bolted to
         nothing, which is a different thing from one too close to a neighbour */
      const clamped = clampHoldToFace(u, v, hold.collisionBox, face.outline)
      const candidate = { ...hold, faceId: face.id, u: clamped.u, v: clamped.v }

      const obstruction = findHoldObstruction(state.wall.faces, state.wall.holds, candidate)

      return {
        heldHold: {
          id,
          faceId: face.id,
          u: clamped.u,
          v: clamped.v,
          clear: obstruction.clear,
          blockedHoldIds: obstruction.holdIds,
        },
      }
    }),

  dropHold: () =>
    set((state) => {
      const held = state.heldHold
      if (!held) return state
      /* Nowhere to land: the hold springs back to where it was picked up */
      if (!held.clear) return { heldHold: null }

      const hold = state.wall.holds.find((h) => h.id === held.id)
      /* Put down where it was picked up: the wall did not change */
      if (!hold || (hold.faceId === held.faceId && hold.u === held.u && hold.v === held.v)) {
        return { heldHold: null }
      }

      return {
        heldHold: null,
        ...edit(
          {
            ...state.wall,
            holds: state.wall.holds.map((h) =>
              h.id === held.id ? { ...h, faceId: held.faceId, u: held.u, v: held.v } : h,
            ),
          },
          `dropHold:${held.id}`,
        ),
      }
    }),

  /* A loaded wall can clip itself: the rules it was built under may not be the
     rules in force now. It comes back as it was saved and the holds that clip
     are pointed at, rather than being refused or quietly dropped (ADR-009) */
  replaceWall: (wall) =>
    set({
      wall,
      selectedHoldId: null,
      selectedFaceId: null,
      faceCutPoint: null,
      deletingHoldIds: [],
      leavingHolds: [],
      blockingHoldIds: holdsInOverlaps(findWallOverlaps(wall.faces, wall.holds)),
    }),

  clearHolds: () =>
    set((state) => {
      if (state.wall.holds.length === 0) return state

      return {
        ...edit({ ...state.wall, holds: [] }, 'clearHolds'),
        deletingHoldIds: [],
        selectedHoldId: null,
      }
    }),
    }),
    {
      limit: 100,
      /* History is the wall and the marker that says what edited it. Selection,
         the armed tool and the red flags are where you were, not what the wall
         is (ADR-009, ADR-012) */
      partialize: (state) => ({ wall: state.wall, lastEdit: state.lastEdit }),
      equality: historyEquality,
    },
  ),
)
