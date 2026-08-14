import { create } from 'zustand'
import { colors } from '@/lib/colors'
import { hasCollision } from '@/pages/editor/components/WallCanvas3D/utils/holdCollision'
import { measureCollisionBox } from '@/pages/editor/components/WallCanvas3D/utils/holdGeometry'
import {
  getModelVariant,
  measureModelCollisionBox,
  pickModelVariant,
} from '@/pages/editor/components/WallCanvas3D/utils/holdModels'
import { clampHoldToFace } from '@/pages/editor/components/WallCanvas3D/utils/holdBounds'
import { holdGeometryConfigs } from '@/pages/editor/components/WallCanvas3D/config/holdGeometryConfig'
import { CM_TO_M } from '@/pages/editor/components/WallCanvas3D/constants/editor3d'
import type { FaceTree } from '@/pages/editor/components/WallCanvas3D/utils/faceTree'
import { createRootFaceTree, getFace } from '@/pages/editor/components/WallCanvas3D/utils/faceTree'

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface CollisionBox {
  halfW: number  // half-width in cm (u extent)
  halfH: number  // half-height in cm (v extent)
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
  wallColor: string
  holds: Hold[]
}

interface WallState {
  wall: Wall
  selectedHoldId: string | null
  selectedHoldType: HoldType
  /** Model variant for the next placement; null = deterministic auto pick */
  selectedVariant: string | null
  /** Holds playing their pop-off exit animation; removed on animation rest */
  deletingHoldIds: string[]

  /** Places a hold at (u, v) on the given face */
  addHold: (faceId: string, u: number, v: number) => void
  updateHold: (id: string, updates: Partial<Hold>) => void
  /** Starts the exit animation; HoldMesh calls removeHold when it rests */
  markHoldDeleting: (id: string) => void
  removeHold: (id: string) => void
  selectHold: (id: string | null) => void
  setSelectedHoldType: (type: HoldType) => void
  setSelectedVariant: (variant: string | null) => void
  setWallColor: (color: string) => void
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
  faces: createRootFaceTree(WALL_WIDTH, WALL_HEIGHT),
  wallColor: colors.wall.surface,
  holds: [],
}

export const useWallStore = create<WallState>((set) => ({
  wall: defaultWall,
  selectedHoldId: null,
  selectedHoldType: 'jug',
  selectedVariant: null,
  deletingHoldIds: [],

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
      const model = getModelVariant(type, variant)
      const collisionBox = model
        ? measureModelCollisionBox(model, type, size)
        : measureCollisionBox(type, size * CM_TO_M * holdGeometryConfigs[type].sizeMultiplier)

      /* Keep the full extents on the face, not just the center point */
      const clamped = clampHoldToFace(u, v, collisionBox, face.width, face.height)
      const candidate = { faceId, u: clamped.u, v: clamped.v, collisionBox }

      if (hasCollision(candidate, state.wall.holds)) return state

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

  selectHold: (id) => set({ selectedHoldId: id }),

  setSelectedHoldType: (type) => set({ selectedHoldType: type, selectedVariant: null }),

  setSelectedVariant: (variant) => set({ selectedVariant: variant }),

  setWallColor: (color) =>
    set((state) => ({
      wall: { ...state.wall, wallColor: color },
    })),

  clearHolds: () =>
    set((state) => ({
      wall: { ...state.wall, holds: [] },
      deletingHoldIds: [],
      selectedHoldId: null,
    })),
}))
