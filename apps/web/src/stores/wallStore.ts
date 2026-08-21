import { create } from 'zustand'
import { colors } from '@/lib/colors'
import {
  getModelVariant,
  pickModelVariant,
} from '@/pages/editor/components/WallCanvas3D/utils/holdModels'
import { measureHoldFootprint } from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'
import { getNextRotation } from '@/pages/editor/components/WallCanvas3D/utils/holdActions'
import { clampHoldToFace } from '@/pages/editor/components/WallCanvas3D/utils/holdBounds'
import type { FaceTree } from '@crimp-studio/wall-geometry'
import {
  createRootFaceTree,
  findLegalFaceAngle,
  getFace,
  holdPlacementIsClear,
  relativeFaceAngle,
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
  /** Model variant for the next placement; null = deterministic auto pick */
  selectedVariant: string | null
  /** Holds playing their pop-off exit animation; removed on animation rest */
  deletingHoldIds: string[]
  /** Holds that stopped the last bend, so the editor can point at them */
  blockingHoldIds: string[]

  /** Places a hold at (u, v) on the given face */
  addHold: (faceId: string, u: number, v: number) => void
  /** Colour, rotation and measured box. Position goes through moveHold */
  updateHold: (id: string, updates: Partial<Hold>) => void
  /**
   * Moves a hold, refusing a spot where it would not fit in world space. Passing
   * a face hands the hold to that panel, which is what dragging across a seam does
   */
  moveHold: (id: string, u: number, v: number, faceId?: string) => void
  /** Turns a hold, re-measuring its footprint and refusing if it no longer fits */
  rotateHold: (id: string) => void
  /** Starts the exit animation; HoldMesh calls removeHold when it rests */
  markHoldDeleting: (id: string) => void
  removeHold: (id: string) => void
  selectHold: (id: string | null) => void
  setEditorMode: (mode: EditorMode) => void
  selectFace: (faceId: string | null) => void
  setFaceCutPoint: (point: { faceId: string; u: number; v: number }) => void
  /** Splits a face in two along the seam; refuses if canCutFace says no */
  cutFace: (faceId: string, axis: CutAxis, at: number) => void
  /** Takes the absolute tilt from vertical, stores it relative to the parent, and
      stops the bend where the panel meets whatever is in the way */
  setFaceAngle: (faceId: string, tiltDeg: number) => void
  /** Merges a face back into its parent, undoing its cut */
  removeFace: (faceId: string) => void
  setSelectedHoldType: (type: HoldType) => void
  setSelectedVariant: (variant: string | null) => void
  /** Paints one panel. Colour lives on the face, so neighbours keep theirs */
  setFaceColor: (faceId: string, color: string) => void
  /** Stops pointing at the holds that blocked the last bend */
  clearBlockingHolds: () => void
  clearHolds: () => void
}

const createId = () => Math.random().toString(36).substring(2, 9)

const WALL_WIDTH = 400
const WALL_HEIGHT = 500

const defaultWall: Wall = {
  id: createId(),
  name: 'My Wall',
  width: WALL_WIDTH,
  height: WALL_HEIGHT,
  faces: createRootFaceTree(WALL_WIDTH, WALL_HEIGHT, colors.wall.surface),
  holds: [],
}

export const useWallStore = create<WallState>((set) => ({
  wall: defaultWall,
  editorMode: 'holds',
  selectedHoldId: null,
  /* The wall opens with nothing selected: controls come to a selection, so an
     editor that opens with a popover already up has nothing to show it about */
  selectedFaceId: null,
  faceCutPoint: null,
  selectedHoldType: 'jug',
  selectedVariant: null,
  deletingHoldIds: [],
  blockingHoldIds: [],

  addHold: (faceId, u, v) =>
    set((state) => {
      const type = state.selectedHoldType
      const size = 10
      const id = createId()
      const face = getFace(state.wall.faces, faceId)

      /* Explicit pick from the sidebar wins; anything invalid for the type
         falls back to the deterministic auto pick */
      const pickedVariant =
        state.selectedVariant && getModelVariant(type, state.selectedVariant)
          ? state.selectedVariant
          : pickModelVariant(id, type)
      const variant = pickedVariant
      const collisionBox = measureHoldFootprint(type, variant, size)

      /* Keep the full extents on the face, not just the center point */
      const clamped = clampHoldToFace(u, v, collisionBox, face.width, face.height)
      const candidate = { id, faceId, u: clamped.u, v: clamped.v, collisionBox }

      if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, candidate)) return state

      return {
        wall: {
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
      }
    }),

  updateHold: (id, updates) =>
    set((state) => ({
      wall: {
        ...state.wall,
        holds: state.wall.holds.map((h) =>
          h.id === id ? { ...h, ...updates } : h
        ),
      },
    })),

  moveHold: (id, u, v, faceId) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      const face = getFace(state.wall.faces, faceId ?? hold.faceId)
      const clamped = clampHoldToFace(u, v, hold.collisionBox, face.width, face.height)
      const moved = { ...hold, faceId: face.id, u: clamped.u, v: clamped.v }

      /* Refusing outright rather than snapping back on release: every frame of a
         drag is a committed position, so the hold simply stops at the last one
         that fits instead of passing through a panel on the way */
      if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, moved)) return state

      return {
        wall: { ...state.wall, holds: state.wall.holds.map((h) => (h.id === id ? moved : h)) },
      }
    }),

  rotateHold: (id) =>
    set((state) => {
      const hold = state.wall.holds.find((h) => h.id === id)
      if (!hold) return state

      const rotation = getNextRotation(hold.rotation)
      const collisionBox = measureHoldFootprint(hold.type, hold.variant, hold.size, rotation)
      const face = getFace(state.wall.faces, hold.faceId)
      const clamped = clampHoldToFace(hold.u, hold.v, collisionBox, face.width, face.height)
      const turned = { ...hold, rotation, collisionBox, u: clamped.u, v: clamped.v }

      if (!holdPlacementIsClear(state.wall.faces, state.wall.holds, turned)) return state

      return {
        wall: { ...state.wall, holds: state.wall.holds.map((h) => (h.id === id ? turned : h)) },
      }
    }),

  markHoldDeleting: (id) =>
    set((state) => ({
      deletingHoldIds: state.deletingHoldIds.includes(id)
        ? state.deletingHoldIds
        : [...state.deletingHoldIds, id],
      selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
    })),

  removeHold: (id) =>
    set((state) => ({
      wall: {
        ...state.wall,
        holds: state.wall.holds.filter((h) => h.id !== id),
      },
      deletingHoldIds: state.deletingHoldIds.filter((d) => d !== id),
      selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
    })),

  /* Selecting one thing lets go of the other, so the sidebar is never
     showing controls for something you are not looking at. Deselecting a hold
     leaves the panel focus alone. */
  selectHold: (id) =>
    set((state) => ({
      selectedHoldId: id,
      selectedFaceId: id ? null : state.selectedFaceId,
    })),

  setEditorMode: (mode) => set({ editorMode: mode, selectedHoldId: null }),

  selectFace: (faceId) => set({ selectedFaceId: faceId, selectedHoldId: null }),

  setFaceCutPoint: (point) => set({ faceCutPoint: point }),

  cutFace: (faceId, axis, at) =>
    set((state) => {
      const check = canCutFace(state.wall.faces, state.wall.holds, faceId, axis, at)
      if (!check.ok) return state

      const cut = cutFaceTree(state.wall.faces, state.wall.holds, faceId, axis, at)

      return {
        wall: { ...state.wall, faces: cut.tree, holds: cut.holds },
        selectedFaceId: cut.newFaceId,
      }
    }),

  setFaceAngle: (faceId, tiltDeg) =>
    set((state) => {
      const face = getFace(state.wall.faces, faceId)
      const requested = relativeFaceAngle(
        state.wall.faces,
        faceId,
        clampFaceAngle(tiltDeg, getAngleLimits(face.parentId === null)),
      )

      /* The panel stops where it meets a panel it is not hinged to, a hold, or
         the floor, rather than passing through it (ADR-007) */
      const limit = findLegalFaceAngle({
        faces: state.wall.faces,
        holds: state.wall.holds,
        faceId,
        from: face.angle,
        to: requested,
      })

      const faces = {
        rootId: state.wall.faces.rootId,
        byId: { ...state.wall.faces.byId, [faceId]: { ...face, angle: limit.angle } },
      }

      return { wall: { ...state.wall, faces }, blockingHoldIds: limit.blockingHoldIds }
    }),

  removeFace: (faceId) =>
    set((state) => {
      const merged = mergeFaceIntoParent(state.wall.faces, state.wall.holds, faceId)
      if (merged.tree === state.wall.faces) return state

      return {
        wall: { ...state.wall, faces: merged.tree, holds: merged.holds },
        selectedFaceId: state.selectedFaceId === faceId ? null : state.selectedFaceId,
      }
    }),

  setSelectedHoldType: (type) => set({ selectedHoldType: type, selectedVariant: null }),

  setSelectedVariant: (variant) => set({ selectedVariant: variant }),

  setFaceColor: (faceId, color) =>
    set((state) => ({
      wall: {
        ...state.wall,
        faces: {
          rootId: state.wall.faces.rootId,
          byId: {
            ...state.wall.faces.byId,
            [faceId]: { ...getFace(state.wall.faces, faceId), color },
          },
        },
      },
    })),

  clearBlockingHolds: () => set({ blockingHoldIds: [] }),

  clearHolds: () =>
    set((state) => ({
      wall: { ...state.wall, holds: [] },
      deletingHoldIds: [],
      selectedHoldId: null,
    })),
}))
