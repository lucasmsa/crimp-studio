import { create } from 'zustand'
import { colors } from '@/lib/colors'
import { hasCollision } from '@/pages/editor/components/WallCanvas3D/utils/holdCollision'
import { measureCollisionBox } from '@/pages/editor/components/WallCanvas3D/utils/holdGeometry'
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

  addHold: (x: number, y: number) => void
  updateHold: (id: string, updates: Partial<Hold>) => void
  removeHold: (id: string) => void
  selectHold: (id: string | null) => void
  setSelectedHoldType: (type: HoldType) => void
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

  addHold: (x, y) =>
    set((state) => {
      const type = state.selectedHoldType
      const size = 10
      const scale = size * CM_TO_M * holdGeometryConfigs[type].sizeMultiplier
      const collisionBox = measureCollisionBox(type, scale)
      const candidate = { x, y, collisionBox }

      if (hasCollision(candidate, state.wall.holds)) return state

      return {
        wall: {
          ...state.wall,
          holds: [
            ...state.wall.holds,
            {
              id: createId(),
              type,
              x,
              y,
              size,
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

  removeHold: (id) =>
    set((state) => ({
      wall: {
        ...state.wall,
        holds: state.wall.holds.filter((h) => h.id !== id),
      },
      selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
    })),

  selectHold: (id) => set({ selectedHoldId: id }),

  setSelectedHoldType: (type) => set({ selectedHoldType: type }),

  setWallColor: (color) =>
    set((state) => ({
      wall: { ...state.wall, wallColor: color },
    })),

  clearHolds: () =>
    set((state) => ({
      wall: { ...state.wall, holds: [] },
      selectedHoldId: null,
    })),
}))
