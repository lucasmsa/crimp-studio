import { create } from 'zustand'

export type HoldType = 'jug' | 'crimp' | 'sloper' | 'pinch' | 'pocket' | 'volume'

export interface Hold {
  id: string
  type: HoldType
  x: number
  y: number
  rotation?: number
  size: number
}

export interface Wall {
  id: string
  name: string
  width: number
  height: number
  angle: number
  holds: Hold[]
}

interface WallState {
  wall: Wall
  selectedHoldId: string | null
  selectedHoldType: HoldType

  // Actions
  setWallDimensions: (width: number, height: number) => void
  setWallAngle: (angle: number) => void
  addHold: (x: number, y: number) => void
  updateHold: (id: string, updates: Partial<Hold>) => void
  removeHold: (id: string) => void
  selectHold: (id: string | null) => void
  setSelectedHoldType: (type: HoldType) => void
  clearHolds: () => void
}

const createId = () => Math.random().toString(36).substring(2, 9)

const defaultWall: Wall = {
  id: createId(),
  name: 'My Wall',
  width: 300,  // 3 meters
  height: 400, // 4 meters
  angle: 15,   // slight overhang
  holds: [],
}

export const useWallStore = create<WallState>((set) => ({
  wall: defaultWall,
  selectedHoldId: null,
  selectedHoldType: 'jug',

  setWallDimensions: (width, height) =>
    set((state) => ({
      wall: { ...state.wall, width, height },
    })),

  setWallAngle: (angle) =>
    set((state) => ({
      wall: { ...state.wall, angle },
    })),

  addHold: (x, y) =>
    set((state) => ({
      wall: {
        ...state.wall,
        holds: [
          ...state.wall.holds,
          {
            id: createId(),
            type: state.selectedHoldType,
            x,
            y,
            size: 10,
          },
        ],
      },
    })),

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

  clearHolds: () =>
    set((state) => ({
      wall: { ...state.wall, holds: [] },
      selectedHoldId: null,
    })),
}))
