import { create } from 'zustand'
import { colors } from '@/lib/colors'
import { hasCollision } from '@/pages/editor/components/WallCanvas3D/utils/holdCollision'
import { measureCollisionBox } from '@/pages/editor/components/WallCanvas3D/utils/holdGeometry'
import {
  getModelVariant,
  measureModelCollisionBox,
  pickModelVariant,
} from '@/pages/editor/components/WallCanvas3D/utils/holdModels'
import { clampHoldToWall } from '@/pages/editor/components/WallCanvas3D/utils/holdBounds'
import { holdGeometryConfigs } from '@/pages/editor/components/WallCanvas3D/config/holdGeometryConfig'

const CM_TO_M = 0.01

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface CollisionBox {
  halfW: number  // half-width in cm (X extent)
  halfH: number  // half-height in cm (Y extent)
}

export interface Hold {
  id: string
  type: HoldType
  x: number       // cm from left edge
  y: number       // cm from bottom edge
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
  width: number    // cm (fixed at 300)
  height: number   // cm (fixed at 400)
  angle: number    // 0 = vertical (fixed at 0)
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

  addHold: (x: number, y: number) => void
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

const defaultWall: Wall = {
  id: createId(),
  name: 'My Wall',
  width: 400,
  height: 500,
  angle: 0,
  wallColor: colors.wall.surface,
  holds: [],
}

export const useWallStore = create<WallState>((set) => ({
  wall: defaultWall,
  selectedHoldId: null,
  selectedHoldType: 'jug',
  selectedVariant: null,
  deletingHoldIds: [],

  addHold: (x, y) =>
    set((state) => {
      const type = state.selectedHoldType
      const size = 10
      const id = createId()

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

      /* Keep the full extents on the wall, not just the center point */
      const clamped = clampHoldToWall(x, y, collisionBox, state.wall.width, state.wall.height)
      const candidate = { x: clamped.x, y: clamped.y, collisionBox }

      if (hasCollision(candidate, state.wall.holds)) return state

      return {
        wall: {
          ...state.wall,
          holds: [
            ...state.wall.holds,
            {
              id,
              type,
              x: clamped.x,
              y: clamped.y,
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
