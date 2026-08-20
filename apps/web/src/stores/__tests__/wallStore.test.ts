import { describe, it, expect, beforeEach } from 'vitest'
import { useWallStore } from '../wallStore'
import { createRootFaceTree } from '@/pages/editor/components/WallCanvas3D/utils/faceTree'
import {
  getModelVariant,
  getModelVariants,
} from '@/pages/editor/components/WallCanvas3D/utils/holdModels'

const PANEL = '#E8D5B7'

const WIDTH = 300
const HEIGHT = 400

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
    selectedVariant: null,
    deletingHoldIds: [],
  })
}

const rootFaceId = () => useWallStore.getState().wall.faces.rootId

/** Places a hold on the root face, which is the whole wall until it is cut */
function place(u: number, v: number) {
  useWallStore.getState().addHold(rootFaceId(), u, v)
}

describe('wallStore', () => {
  beforeEach(() => {
    resetStore()
  })

  describe('addHold', () => {
    it('adds a hold at the given position', () => {
      place(100, 200)

      const holds = useWallStore.getState().wall.holds
      expect(holds).toHaveLength(1)
      expect(holds[0].u).toBe(100)
      expect(holds[0].v).toBe(200)
      expect(holds[0].faceId).toBe(rootFaceId())
      expect(holds[0].type).toBe('jug')
      expect(holds[0].size).toBe(10)
    })

    it('uses the currently selected hold type', () => {
      useWallStore.getState().setSelectedHoldType('crimp')
      place(50, 50)

      expect(useWallStore.getState().wall.holds[0].type).toBe('crimp')
    })

    it('generates unique ids', () => {
      place(10, 10)
      place(100, 100)

      const holds = useWallStore.getState().wall.holds
      expect(holds[0].id).not.toBe(holds[1].id)
    })

    it('assigns a model variant for types with GLB models', () => {
      place(100, 200)

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.type).toBe('jug')
      expect(hold.variant).toBeDefined()
    })

    it('assigns a model variant for volume holds', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      place(100, 200)

      expect(useWallStore.getState().wall.holds[0].variant).toMatch(/^vol_/)
    })

    it('uses the explicitly selected variant when set', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      useWallStore.getState().setSelectedVariant('vol_rail_long')
      place(100, 200)

      expect(useWallStore.getState().wall.holds[0].variant).toBe('vol_rail_long')
    })

    it('falls back to auto pick when the selected variant is invalid for the type', () => {
      useWallStore.getState().setSelectedHoldType('jug')
      useWallStore.getState().setSelectedVariant('vol_rail_long')
      place(100, 200)

      const variant = useWallStore.getState().wall.holds[0].variant
      expect(variant).toBeDefined()
      expect(variant).not.toBe('vol_rail_long')
    })

    it('pulls placements at the face edge inward by the hold extents', () => {
      place(300, 400)

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.u + hold.collisionBox!.halfW).toBeLessThanOrEqual(300)
      expect(hold.v + hold.collisionBox!.halfH).toBeLessThanOrEqual(400)
    })

    it('marks a hold as deleting and deselects it, then removeHold clears both', () => {
      place(100, 200)
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
      place(100, 200)

      const box = useWallStore.getState().wall.holds[0].collisionBox
      expect(box).toBeDefined()
      expect(box!.halfW).toBeGreaterThan(0)
      expect(box!.halfH).toBeGreaterThan(0)
    })

    it('blocks placement when colliding with an existing hold (same position)', () => {
      place(100, 100)

      place(100, 100)

      expect(useWallStore.getState().wall.holds).toHaveLength(1)
    })

    it('allows placement when far enough from existing holds', () => {
      place(100, 100)

      place(300, 300)

      expect(useWallStore.getState().wall.holds).toHaveLength(2)
    })
  })

  describe('removeHold', () => {
    it('removes the hold with the given id', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().removeHold(holdId)

      expect(useWallStore.getState().wall.holds).toHaveLength(0)
    })

    it('deselects the hold if it was selected', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id
      useWallStore.getState().selectHold(holdId)

      useWallStore.getState().removeHold(holdId)

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })

    it('keeps selection if a different hold is removed', () => {
      place(100, 100)
      place(200, 200)
      const [hold1, hold2] = useWallStore.getState().wall.holds
      useWallStore.getState().selectHold(hold1.id)

      useWallStore.getState().removeHold(hold2.id)

      expect(useWallStore.getState().selectedHoldId).toBe(hold1.id)
    })
  })

  describe('updateHold', () => {
    it('updates a hold with partial data', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().updateHold(holdId, { rotation: 90, u: 150 })

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.rotation).toBe(90)
      expect(hold.u).toBe(150)
      expect(hold.v).toBe(100)
    })

    it('can set a custom color on a hold', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().updateHold(holdId, { color: '#FF0000' })

      expect(useWallStore.getState().wall.holds[0].color).toBe('#FF0000')
    })
  })

  describe('selectHold', () => {
    it('selects a hold by id', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().selectHold(holdId)

      expect(useWallStore.getState().selectedHoldId).toBe(holdId)
    })

    it('deselects when null is passed', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id
      useWallStore.getState().selectHold(holdId)

      useWallStore.getState().selectHold(null)

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })
  })

  describe('clearHolds', () => {
    it('removes all holds', () => {
      place(100, 100)
      place(200, 200)

      useWallStore.getState().clearHolds()

      expect(useWallStore.getState().wall.holds).toHaveLength(0)
    })

    it('deselects the selected hold', () => {
      place(100, 100)
      useWallStore.getState().selectHold(useWallStore.getState().wall.holds[0].id)

      useWallStore.getState().clearHolds()

      expect(useWallStore.getState().selectedHoldId).toBeNull()
    })
  })

  describe('setHoldType', () => {
    it('retypes the hold and gives it a model of the new type', () => {
      place(150, 250)
      const before = useWallStore.getState().wall.holds[0]

      useWallStore.getState().setHoldType(before.id, 'volume')

      const after = useWallStore.getState().wall.holds[0]
      expect(after.type).toBe('volume')
      expect(getModelVariant('volume', after.variant)).not.toBeNull()
    })

    /* Pinch to pocket, because every pinch model measures the same and so does
       every pocket one: the footprint grows whichever variant gets picked */
    it('re-measures the footprint, since a different shape covers different plywood', () => {
      useWallStore.getState().setSelectedHoldType('pinch')
      place(150, 250)
      const before = useWallStore.getState().wall.holds[0]

      useWallStore.getState().setHoldType(before.id, 'pocket')

      const after = useWallStore.getState().wall.holds[0]
      expect(after.collisionBox!.halfW).toBeGreaterThan(before.collisionBox!.halfW)
    })

    it('refuses a type whose bigger footprint would land on a neighbour', () => {
      useWallStore.getState().setSelectedHoldType('pinch')
      place(100, 250)
      const first = useWallStore.getState().wall.holds[0]
      place(100 + first.collisionBox!.halfW * 2 + 1, 250)

      useWallStore.getState().setHoldType(first.id, 'pocket')

      expect(useWallStore.getState().wall.holds[0].type).toBe('pinch')
    })
  })

  describe('setHoldVariant', () => {
    it('swaps the model and keeps the type', () => {
      useWallStore.getState().setSelectedHoldType('crimp')
      place(150, 250)
      const before = useWallStore.getState().wall.holds[0]
      const other = getModelVariants('crimp').find((v) => v.variant !== before.variant)!

      useWallStore.getState().setHoldVariant(before.id, other.variant)

      const after = useWallStore.getState().wall.holds[0]
      expect(after.variant).toBe(other.variant)
      expect(after.type).toBe('crimp')
    })
  })

  describe('setFaceColor', () => {
    it('paints one panel', () => {
      useWallStore.getState().setFaceColor(rootFaceId(), '#FF5722')

      expect(useWallStore.getState().wall.faces.byId[rootFaceId()].color).toBe('#FF5722')
    })

    it('leaves the neighbouring panel alone', () => {
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const upperId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().setFaceColor(upperId, '#FF5722')

      expect(useWallStore.getState().wall.faces.byId[rootFaceId()].color).toBe(PANEL)
    })
  })

  describe('cutFace', () => {
    it('splits the root and selects the new face', () => {
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)

      const { wall, selectedFaceId } = useWallStore.getState()
      expect(Object.keys(wall.faces.byId)).toHaveLength(2)
      expect(selectedFaceId).not.toBeNull()
      expect(wall.faces.byId[rootFaceId()].height).toBe(250)
    })

    it('refuses a cut through a hold and leaves the wall alone', () => {
      place(150, 250)
      const before = useWallStore.getState().wall.faces

      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)

      expect(useWallStore.getState().wall.faces).toBe(before)
    })

    it('moves holds above the seam onto the new face', () => {
      place(150, 350)
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)

      const hold = useWallStore.getState().wall.holds[0]
      expect(hold.faceId).toBe(useWallStore.getState().selectedFaceId)
      expect(hold.v).toBe(100)
    })
  })

  describe('setFaceAngle', () => {
    it('stores the root tilt as given', () => {
      useWallStore.getState().setFaceAngle(rootFaceId(), 30)

      expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(30)
    })

    it('stops the base panel short of horizontal, since it stands on the floor', () => {
      useWallStore.getState().setFaceAngle(rootFaceId(), 200)
      expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(60)

      useWallStore.getState().setFaceAngle(rootFaceId(), -90)
      expect(useWallStore.getState().wall.faces.byId[rootFaceId()].angle).toBe(-45)
    })

    it('lets a panel above the base go all the way to a roof', () => {
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const childId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().setFaceAngle(childId, 200)

      expect(useWallStore.getState().wall.faces.byId[childId].angle).toBe(135)
    })

    it('stores a child angle relative to its parent, so the absolute tilt is what was asked for', () => {
      useWallStore.getState().setFaceAngle(rootFaceId(), 20)
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const childId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().setFaceAngle(childId, 30)

      expect(useWallStore.getState().wall.faces.byId[childId].angle).toBeCloseTo(10, 5)
    })
  })

  describe('removeFace', () => {
    it('merges a face back into its parent', () => {
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const childId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().removeFace(childId)

      const { wall, selectedFaceId } = useWallStore.getState()
      expect(Object.keys(wall.faces.byId)).toHaveLength(1)
      expect(wall.faces.byId[rootFaceId()].height).toBe(HEIGHT)
      expect(selectedFaceId).toBeNull()
    })

    it('ignores the root, which has nothing to merge into', () => {
      const before = useWallStore.getState().wall.faces

      useWallStore.getState().removeFace(rootFaceId())

      expect(useWallStore.getState().wall.faces).toBe(before)
    })
  })

  describe('selectFace', () => {
    it('selects and clears', () => {
      useWallStore.getState().selectFace(rootFaceId())
      expect(useWallStore.getState().selectedFaceId).toBe(rootFaceId())

      useWallStore.getState().selectFace(null)
      expect(useWallStore.getState().selectedFaceId).toBeNull()
    })
  })

  describe('setSelectedHoldType', () => {
    it('updates the selected hold type', () => {
      useWallStore.getState().setSelectedHoldType('volume')

      expect(useWallStore.getState().selectedHoldType).toBe('volume')
    })
  })
})
