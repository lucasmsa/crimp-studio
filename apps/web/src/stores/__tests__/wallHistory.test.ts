import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRootFaceTree } from '@crimp-studio/wall-geometry'
import { useWallStore } from '../wallStore'
import { clearHistory, redo, undo } from '../wallHistory'
import { COALESCE_MS } from '../utils/historyEquality'

const PANEL = '#E8D5B7'
const WIDTH = 300
const HEIGHT = 400
const T0 = 1_000_000

function resetStore() {
  useWallStore.setState({
    wall: {
      id: 'test',
      name: 'My Wall',
      width: WIDTH,
      height: HEIGHT,
      faces: createRootFaceTree(WIDTH, HEIGHT, PANEL),
      holds: [],
    },
    selectedHoldId: null,
    selectedFaceId: null,
    selectedHoldType: 'jug',
    variantByType: {},
    deletingHoldIds: [],
    blockingHoldIds: [],
    heldHold: null,
    leavingHolds: [],
    lastEdit: null,
  })
  useWallStore.temporal.getState().clear()
}

const rootFaceId = () => useWallStore.getState().wall.faces.rootId
const holds = () => useWallStore.getState().wall.holds
const holdById = (id: string) => holds().find((h) => h.id === id)
const past = () => useWallStore.temporal.getState().pastStates.length
const future = () => useWallStore.temporal.getState().futureStates.length

/**
 * Holds with a stated box, so a test that moves one is not at the mercy of
 * which model its id would have hashed to. Seeding is not an edit, so history
 * is cleared afterwards to keep the slate clean.
 */
function seedHolds(...positions: Array<{ u: number; v: number }>) {
  useWallStore.setState((state) => ({
    wall: {
      ...state.wall,
      holds: positions.map(({ u, v }, index) => ({
        id: `hold_${index}`,
        type: 'jug' as const,
        faceId: state.wall.faces.rootId,
        size: 10,
        u,
        v,
        collisionBox: { halfW: 10, halfH: 10, depth: 10 },
      })),
    },
  }))
  useWallStore.temporal.getState().clear()
}

describe('wall history', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    resetStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('undoes a placement and redoes it', () => {
    useWallStore.getState().addHold(rootFaceId(), 100, 100)
    expect(holds()).toHaveLength(1)
    expect(past()).toBe(1)

    undo()
    expect(holds()).toHaveLength(0)
    expect(future()).toBe(1)

    redo()
    expect(holds()).toHaveLength(1)
    expect(future()).toBe(0)
  })

  it('keeps redo alive through a measurement, which is not an edit', () => {
    seedHolds({ u: 100, v: 100 })
    useWallStore.getState().moveHold('hold_0', 150, 100)
    undo()
    expect(future()).toBe(1)

    useWallStore.getState().reportCollisionBox('hold_0', { halfW: 12, halfH: 12, depth: 8 })

    expect(holdById('hold_0')?.collisionBox?.halfW).toBe(12)
    expect(future()).toBe(1)
    expect(past()).toBe(0)
  })

  it('coalesces a nudge run into one entry and separates a later nudge', () => {
    seedHolds({ u: 100, v: 100 })
    const { moveHold } = useWallStore.getState()

    moveHold('hold_0', 105, 100)
    vi.setSystemTime(T0 + 100)
    moveHold('hold_0', 110, 100)
    vi.setSystemTime(T0 + 200)
    moveHold('hold_0', 115, 100)
    expect(past()).toBe(1)

    vi.setSystemTime(T0 + 200 + COALESCE_MS)
    moveHold('hold_0', 120, 100)
    expect(past()).toBe(2)

    undo()
    expect(holdById('hold_0')?.u).toBe(115)
    undo()
    expect(holdById('hold_0')?.u).toBe(100)
  })

  it('never coalesces nudges of different holds', () => {
    seedHolds({ u: 100, v: 100 }, { u: 200, v: 200 })
    const { moveHold } = useWallStore.getState()

    moveHold('hold_0', 105, 100)
    vi.setSystemTime(T0 + 50)
    moveHold('hold_1', 205, 200)
    expect(past()).toBe(2)
  })

  it('undoes the delete being watched when asked mid-animation', () => {
    seedHolds({ u: 100, v: 100 })
    useWallStore.getState().markHoldDeleting('hold_0')
    expect(holds()).toHaveLength(1)
    expect(useWallStore.getState().deletingHoldIds).toEqual(['hold_0'])

    undo()

    expect(holds()).toHaveLength(1)
    expect(useWallStore.getState().deletingHoldIds).toEqual([])
    expect(future()).toBe(1)

    redo()
    expect(holds()).toHaveLength(0)
  })

  it('does not record a second entry when the animation rests after a flush', () => {
    seedHolds({ u: 100, v: 100 })
    useWallStore.getState().markHoldDeleting('hold_0')
    useWallStore.getState().flushPendingDeletes()
    expect(past()).toBe(1)

    useWallStore.getState().removeHold('hold_0')
    expect(past()).toBe(1)
  })

  it('forgets everything on clearHistory, and a load records nothing', () => {
    useWallStore.getState().addHold(rootFaceId(), 100, 100)
    undo()
    expect(past() + future()).toBe(1)

    clearHistory()
    expect(past()).toBe(0)
    expect(future()).toBe(0)

    useWallStore.getState().replaceWall({
      id: 'other',
      name: 'Other',
      width: WIDTH,
      height: HEIGHT,
      faces: createRootFaceTree(WIDTH, HEIGHT, PANEL),
      holds: [],
    })
    expect(past()).toBe(0)
  })

  it('restores the exact stored angle', () => {
    useWallStore.getState().setFaceAngle(rootFaceId(), 20)
    expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(20)

    undo()
    expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(0)
    redo()
    expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(20)
  })

  it('does not record a preset that is already in force', () => {
    useWallStore.getState().setFaceAngle(rootFaceId(), 20)
    useWallStore.getState().setFaceAngle(rootFaceId(), 20)
    expect(past()).toBe(1)
  })

  it('records a drag once, at the drop, and not at all when put back where it was', () => {
    seedHolds({ u: 100, v: 100 })
    const { holdHold, dropHold } = useWallStore.getState()

    holdHold('hold_0', 120, 100)
    holdHold('hold_0', 140, 100)
    expect(past()).toBe(0)

    dropHold()
    expect(holdById('hold_0')?.u).toBe(140)
    expect(past()).toBe(1)

    holdHold('hold_0', 140, 100)
    dropHold()
    expect(past()).toBe(1)
  })

  it('selects what the step touched', () => {
    seedHolds({ u: 100, v: 100 }, { u: 200, v: 200 })
    useWallStore.getState().moveHold('hold_1', 220, 200)
    useWallStore.getState().selectHold('hold_0')

    undo()
    expect(useWallStore.getState().selectedHoldId).toBe('hold_1')

    useWallStore.getState().setFaceAngle(rootFaceId(), 15)
    undo()
    expect(useWallStore.getState().selectedFaceId).toBe(rootFaceId())
    expect(useWallStore.getState().selectedHoldId).toBeNull()
  })

  it('leaves the selection alone when there is nothing to undo', () => {
    seedHolds({ u: 100, v: 100 })
    useWallStore.getState().selectHold('hold_0')
    undo()
    expect(useWallStore.getState().selectedHoldId).toBe('hold_0')
  })

  it('lets an undone placement animate out instead of vanishing', () => {
    useWallStore.getState().addHold(rootFaceId(), 100, 100)
    const id = holds()[0].id

    undo()

    expect(holds()).toHaveLength(0)
    expect(useWallStore.getState().leavingHolds.map((h) => h.id)).toEqual([id])

    useWallStore.getState().dismissLeaving(id)
    expect(useWallStore.getState().leavingHolds).toEqual([])
  })

  it('dismisses a leaving hold the moment a redo brings it back', () => {
    useWallStore.getState().addHold(rootFaceId(), 100, 100)
    undo()
    redo()

    expect(holds()).toHaveLength(1)
    expect(useWallStore.getState().leavingHolds).toEqual([])
  })

  it('animates out every hold a step removed, on the face it was on', () => {
    seedHolds({ u: 100, v: 100 }, { u: 200, v: 200 })
    useWallStore.getState().clearHolds()

    undo()
    expect(holds()).toHaveLength(2)
    expect(useWallStore.getState().leavingHolds).toEqual([])

    redo()
    expect(holds()).toHaveLength(0)
    expect(useWallStore.getState().leavingHolds.map((h) => h.id)).toEqual(['hold_0', 'hold_1'])
    expect(useWallStore.getState().leavingHolds[0].faceId).toBe(rootFaceId())
  })
})
