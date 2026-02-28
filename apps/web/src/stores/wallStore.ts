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

export interface WallPanel {
  id: string
  width: number   // cm
  height: number  // cm
  angle: number   // 0=vertical, negative=slab, positive=overhang
  holds: Hold[]
}

export interface Wall {
  id: string
  name: string
  panels: WallPanel[]
}

interface WallState {
  wall: Wall
  activePanelId: string
  selectedHoldId: string | null
  selectedHoldType: HoldType

  // Panel actions
  addPanel: () => void
  removePanel: (panelId: string) => void
  updatePanel: (panelId: string, updates: Partial<Omit<WallPanel, 'id' | 'holds'>>) => void
  setActivePanel: (panelId: string) => void

  // Hold actions
  addHold: (x: number, y: number, panelId?: string) => void
  updateHold: (id: string, updates: Partial<Hold>) => void
  removeHold: (id: string) => void
  selectHold: (id: string | null) => void
  setSelectedHoldType: (type: HoldType) => void
  clearHolds: () => void
}

const createId = () => Math.random().toString(36).substring(2, 9)

const defaultPanelId = createId()

const defaultPanel: WallPanel = {
  id: defaultPanelId,
  width: 300,
  height: 400,
  angle: 15,
  holds: [],
}

const defaultWall: Wall = {
  id: createId(),
  name: 'My Wall',
  panels: [defaultPanel],
}

export const useWallStore = create<WallState>((set, get) => ({
  wall: defaultWall,
  activePanelId: defaultPanelId,
  selectedHoldId: null,
  selectedHoldType: 'jug',

  addPanel: () => {
    const newPanel: WallPanel = {
      id: createId(),
      width: 300,
      height: 200,
      angle: 0,
      holds: [],
    }

    set((state) => ({
      wall: {
        ...state.wall,
        panels: [...state.wall.panels, newPanel],
      },
      activePanelId: newPanel.id,
    }))
  },

  removePanel: (panelId) =>
    set((state) => {
      if (state.wall.panels.length <= 1) return state

      const remaining = state.wall.panels.filter((p) => p.id !== panelId)
      const newActiveId = state.activePanelId === panelId
        ? remaining[remaining.length - 1].id
        : state.activePanelId

      return {
        wall: { ...state.wall, panels: remaining },
        activePanelId: newActiveId,
        selectedHoldId: null,
      }
    }),

  updatePanel: (panelId, updates) =>
    set((state) => ({
      wall: {
        ...state.wall,
        panels: state.wall.panels.map((p) =>
          p.id === panelId ? { ...p, ...updates } : p
        ),
      },
    })),

  setActivePanel: (panelId) =>
    set({ activePanelId: panelId, selectedHoldId: null }),

  addHold: (x, y, panelId?) => {
    const targetPanelId = panelId ?? get().activePanelId

    set((state) => ({
      wall: {
        ...state.wall,
        panels: state.wall.panels.map((p) =>
          p.id === targetPanelId
            ? {
                ...p,
                holds: [
                  ...p.holds,
                  {
                    id: createId(),
                    type: state.selectedHoldType,
                    x,
                    y,
                    size: 10,
                  },
                ],
              }
            : p
        ),
      },
    }))
  },

  updateHold: (id, updates) =>
    set((state) => ({
      wall: {
        ...state.wall,
        panels: state.wall.panels.map((p) => ({
          ...p,
          holds: p.holds.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),
      },
    })),

  removeHold: (id) =>
    set((state) => ({
      wall: {
        ...state.wall,
        panels: state.wall.panels.map((p) => ({
          ...p,
          holds: p.holds.filter((h) => h.id !== id),
        })),
      },
      selectedHoldId: state.selectedHoldId === id ? null : state.selectedHoldId,
    })),

  selectHold: (id) => set({ selectedHoldId: id }),

  setSelectedHoldType: (type) => set({ selectedHoldType: type }),

  clearHolds: () =>
    set((state) => ({
      wall: {
        ...state.wall,
        panels: state.wall.panels.map((p) => ({ ...p, holds: [] })),
      },
      selectedHoldId: null,
    })),
}))
