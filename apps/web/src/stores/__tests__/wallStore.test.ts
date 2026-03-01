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
      useWallStore.getState().addHold(20, 20)

      const holds = useWallStore.getState().wall.holds
      expect(holds[0].id).not.toBe(holds[1].id)
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
