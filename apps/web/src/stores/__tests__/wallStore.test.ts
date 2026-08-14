import { describe, it, expect, beforeEach } from 'vitest'
import { useWallStore } from '../wallStore'

function resetStore() {
  useWallStore.setState({
    wall: {
      id: 'test',
      name: 'My Wall',
      width: 300,
      height: 400,
      angle: 0,
      wallColor: '#E8D5B7',
      holds: [],
    },
    selectedHoldId: null,
    selectedHoldType: 'jug',
    selectedVariant: null,
    deletingHoldIds: [],
  })
}

describe('wallStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('addHold', () => {
    it('adds a hold at the given position', () => {
      useWallStore.getState().addHold(100, 200)

      const holds = useWallStore.getState().wall.holds
      expect(holds).toHaveLength(1)
      expect(holds[0].x).toBe(100)
      expect(holds[0].y).toBe(200)
      expect(holds[0].type).toBe('jug')
      expect(holds[0].size).toBe(10)
    })

    it('uses the currently selected hold type', () => {
      useWallStore.getState().setSelectedHoldType('crimp')
      useWallStore.getState().addHold(50, 50)

      expect(useWallStore.getState().wall.holds[0].type).toBe('crimp')
    })

    it('generates unique ids', () => {
      useWallStore.getState().addHold(10, 10)
      useWallStore.getState().addHold(100, 100)

      const holds = useWallStore.getState().wall.holds
      expect(holds[0].id).not.toBe(holds[1].id)
    })

    it('assigns a model variant for types with GLB models', () => {
      useWallStore.getState().addHold(100, 200)

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.type).toBe('jug')
      expect(hold.variant).toBeDefined()
    })

    it('assigns a model variant for volume holds', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      useWallStore.getState().addHold(100, 200)

      expect(useWallStore.getState().wall.holds[0].variant).toMatch(/^vol_/)
    })

    it('uses the explicitly selected variant when set', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      useWallStore.getState().setSelectedVariant('vol_rail_long')
      useWallStore.getState().addHold(100, 200)

      expect(useWallStore.getState().wall.holds[0].variant).toBe('vol_rail_long')
    })

    it('falls back to auto pick when the selected variant is invalid for the type', () => {
      useWallStore.getState().setSelectedHoldType('jug')
      useWallStore.getState().setSelectedVariant('vol_rail_long')
      useWallStore.getState().addHold(100, 200)

      const variant = useWallStore.getState().wall.holds[0].variant
      expect(variant).toBeDefined()
      expect(variant).not.toBe('vol_rail_long')
    })

    it('pulls placements at the wall edge inward by the hold extents', () => {
      useWallStore.getState().addHold(300, 400)

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.x + hold.collisionBox!.halfW).toBeLessThanOrEqual(300)
      expect(hold.y + hold.collisionBox!.halfH).toBeLessThanOrEqual(400)
    })

    it('marks a hold as deleting and deselects it, then removeHold clears both', () => {
      useWallStore.getState().addHold(100, 200)
      const id = useWallStore.getState().wall.holds[0].id
      useWallStore.getState().selectHold(id)

      useWallStore.getState().markHoldDeleting(id)

      expect(useWallStore.getState().deletingHoldIds).toContain(id)
      expect(useWallStore.getState().selectedHoldId).toBeNull()

      useWallStore.getState().removeHold(id)

      expect(useWallStore.getState().deletingHoldIds).not.toContain(id)
      expect(useWallStore.getState().wall.holds).toHaveLength(0)
    })

    it('resets the selected variant when the hold type changes', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      useWallStore.getState().setSelectedVariant('vol_box')

      useWallStore.getState().setSelectedHoldType('crimp')

      expect(useWallStore.getState().selectedVariant).toBeNull()
    })

    it('sets a collision box from the model dimensions at placement', () => {
      useWallStore.getState().addHold(100, 200)

      const box = useWallStore.getState().wall.holds[0].collisionBox
      expect(box).toBeDefined()
      expect(box!.halfW).toBeGreaterThan(0)
      expect(box!.halfH).toBeGreaterThan(0)
    })

    it('blocks placement when colliding with an existing hold (same position)', () => {
      useWallStore.getState().addHold(100, 100)

      useWallStore.getState().addHold(100, 100)

      expect(useWallStore.getState().wall.holds).toHaveLength(1)
    })

    it('allows placement when far enough from existing holds', () => {
      useWallStore.getState().addHold(100, 100)

      useWallStore.getState().addHold(300, 300)

      expect(useWallStore.getState().wall.holds).toHaveLength(2)
    })
  })

  describe('removeHold', () => {
    it('removes the hold with the given id', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().removeHold(holdId)

      expect(useWallStore.getState().wall.holds).toHaveLength(0)
    })

    it('deselects the hold if it was selected', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id
      useWallStore.getState().selectHold(holdId)

      useWallStore.getState().removeHold(holdId)

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })

    it('keeps selection if a different hold is removed', () => {
      useWallStore.getState().addHold(100, 100)
      useWallStore.getState().addHold(200, 200)
      const [hold1, hold2] = useWallStore.getState().wall.holds
      useWallStore.getState().selectHold(hold1.id)

      useWallStore.getState().removeHold(hold2.id)

      expect(useWallStore.getState().selectedHoldId).toBe(hold1.id)
    })
  })

  describe('updateHold', () => {
    it('updates a hold with partial data', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().updateHold(holdId, { rotation: 90, x: 150 })

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.rotation).toBe(90)
      expect(hold.x).toBe(150)
      expect(hold.y).toBe(100)
    })

    it('can set a custom color on a hold', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().updateHold(holdId, { color: '#FF0000' })

      expect(useWallStore.getState().wall.holds[0].color).toBe('#FF0000')
    })
  })

  describe('selectHold', () => {
    it('selects a hold by id', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().selectHold(holdId)

      expect(useWallStore.getState().selectedHoldId).toBe(holdId)
    })

    it('deselects when null is passed', () => {
      useWallStore.getState().addHold(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id
      useWallStore.getState().selectHold(holdId)

      useWallStore.getState().selectHold(null)

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })
  })

  describe('clearHolds', () => {
    it('removes all holds', () => {
      useWallStore.getState().addHold(100, 100)
      useWallStore.getState().addHold(200, 200)

      useWallStore.getState().clearHolds()

      expect(useWallStore.getState().wall.holds).toHaveLength(0)
    })

    it('deselects the selected hold', () => {
      useWallStore.getState().addHold(100, 100)
      useWallStore.getState().selectHold(useWallStore.getState().wall.holds[0].id)

      useWallStore.getState().clearHolds()

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })
  })

  describe('setWallColor', () => {
    it('updates the wall color', () => {
      useWallStore.getState().setWallColor('#FF5722')

      expect(useWallStore.getState().wall.wallColor).toBe('#FF5722')
    })
  })

  describe('setSelectedHoldType', () => {
    it('updates the selected hold type', () => {
      useWallStore.getState().setSelectedHoldType('volume')

      expect(useWallStore.getState().selectedHoldType).toBe('volume')
    })
  })
})
