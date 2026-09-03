import { describe, it, expect, beforeEach } from 'vitest'
import { useWallStore } from '../wallStore'
import { createRootFaceTree, findWallOverlaps } from '@crimp-studio/wall-geometry'
import {
  measureHoldFootprint,
  measureWorstCaseFootprint,
} from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'
import { getModelVariants } from '@/pages/editor/components/WallCanvas3D/utils/holdModels'

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
    variantByType: {},
    deletingHoldIds: [],
    blockingHoldIds: [],
    heldHold: null,
    lastEdit: null,
  })
  useWallStore.temporal.getState().clear()
}

const rootFaceId = () => useWallStore.getState().wall.faces.rootId

/** Places a hold on the root face, which is the whole wall until it is cut */
function place(u: number, v: number) {
  useWallStore.getState().addHold(rootFaceId(), u, v)
}

/**
 * Holds on the root face with one box each, in placement order. A placed hold
 * takes whichever GLB variant its generated id hashes to, so its footprint
 * differs run to run; a test that measures a gap states the box instead.
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
        collisionBox: { halfW: 20, halfH: 20, depth: 10 },
      })),
    },
  }))
}

const holdsNow = () => useWallStore.getState().wall.holds

const wallOverlaps = () =>
  findWallOverlaps(useWallStore.getState().wall.faces, useWallStore.getState().wall.holds)

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

    it('falls back to a random model when the armed one is invalid for the type', () => {
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

    it('remembers a model per type, so switching type and back keeps the pick', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      useWallStore.getState().setSelectedVariant('vol_box')

      useWallStore.getState().setSelectedHoldType('crimp')
      expect(useWallStore.getState().variantByType.crimp).toBeUndefined()

      useWallStore.getState().setSelectedHoldType('volume')
      expect(useWallStore.getState().variantByType.volume).toBe('vol_box')
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

  describe('carrying a hold with the pointer', () => {
    it('moves the preview without moving the wall', () => {
      seedHolds({ u: 100, v: 250 })
      const [hold] = holdsNow()

      useWallStore.getState().holdHold(hold.id, 200, 300)

      expect(useWallStore.getState().heldHold).toMatchObject({ u: 200, v: 300, clear: true })
      expect(holdsNow()[0]).toMatchObject({ u: 100, v: 250 })
    })

    it('lands the hold where it was let go, when it fits', () => {
      seedHolds({ u: 100, v: 250 })
      const [hold] = holdsNow()
      useWallStore.getState().holdHold(hold.id, 200, 300)

      useWallStore.getState().dropHold()

      expect(holdsNow()[0]).toMatchObject({ u: 200, v: 300 })
      expect(useWallStore.getState().heldHold).toBeNull()
    })

    it('goes where the pointer goes, even onto a neighbour, and says whose spot it is', () => {
      seedHolds({ u: 100, v: 250 }, { u: 200, v: 250 })
      const [moving, sitting] = holdsNow()

      useWallStore.getState().holdHold(moving.id, 200, 250)

      expect(useWallStore.getState().heldHold).toMatchObject({
        u: 200,
        v: 250,
        clear: false,
        blockedHoldIds: [sitting.id],
      })
    })

    it('springs back when it is let go with nowhere to land', () => {
      seedHolds({ u: 100, v: 250 }, { u: 200, v: 250 })
      const [moving] = holdsNow()
      useWallStore.getState().holdHold(moving.id, 200, 250)

      useWallStore.getState().dropHold()

      expect(holdsNow()[0]).toMatchObject({ u: 100, v: 250 })
      expect(useWallStore.getState().heldHold).toBeNull()
      expect(wallOverlaps()).toHaveLength(0)
    })

    it('keeps the hold on the plywood, since a hold off it is bolted to nothing', () => {
      seedHolds({ u: 100, v: 250 })
      const [hold] = holdsNow()

      useWallStore.getState().holdHold(hold.id, 5000, 5000)

      const held = useWallStore.getState().heldHold!
      expect(held.u).toBeLessThanOrEqual(WIDTH)
      expect(held.v).toBeLessThanOrEqual(HEIGHT)
      expect(held.clear).toBe(true)
    })

    it('hands the hold to the panel under the pointer', () => {
      place(150, 100)
      const hold = useWallStore.getState().wall.holds[0]
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const upperId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().holdHold(hold.id, 150, 60, upperId)
      useWallStore.getState().dropHold()

      expect(useWallStore.getState().wall.holds[0].faceId).toBe(upperId)
    })

    it('does nothing on a drop that never started', () => {
      seedHolds({ u: 100, v: 250 })

      useWallStore.getState().dropHold()

      expect(holdsNow()[0]).toMatchObject({ u: 100, v: 250 })
    })
  })

  describe('changing a hold that is already on the wall', () => {
    /* The widest jug model, so a retype is a real change in footprint rather
       than whichever model an id happens to hash to */
    const WIDE_JUG = 'ch3_xs'

    function armJugModel() {
      useWallStore.getState().setSelectedHoldType('jug')
      useWallStore.getState().setSelectedVariant(WIDE_JUG)
      useWallStore.getState().setSelectedHoldType('crimp')
    }

    it('retypes a hold and re-measures it for its new shape', () => {
      armJugModel()
      place(150, 250)
      const before = useWallStore.getState().wall.holds[0]

      useWallStore.getState().setHoldType(before.id, 'jug')

      const after = useWallStore.getState().wall.holds[0]
      expect(after.type).toBe('jug')
      expect(after.variant).toBe(WIDE_JUG)
      expect(after.collisionBox).toEqual(measureHoldFootprint('jug', WIDE_JUG, after.size))
    })

    it('refuses a type the wall has no room for', () => {
      armJugModel()
      const crimp = measureWorstCaseFootprint('crimp', 10)
      const jug = measureHoldFootprint('jug', WIDE_JUG, 10)
      /* Far enough apart for two crimps, nowhere near enough for a jug */
      const gap = crimp.halfW * 2 + 2
      expect(gap).toBeLessThan(crimp.halfW + jug.halfW)

      place(150, 250)
      place(150 + gap, 250)
      const [moving] = useWallStore.getState().wall.holds

      useWallStore.getState().setHoldType(moving.id, 'jug')

      expect(useWallStore.getState().wall.holds[0].type).toBe('crimp')
      expect(wallOverlaps()).toHaveLength(0)
    })

    it('gives a hold another model of its own type', () => {
      place(150, 250)
      const hold = useWallStore.getState().wall.holds[0]
      const other = getModelVariants('jug').find((model) => model.variant !== hold.variant)!

      useWallStore.getState().setHoldVariant(hold.id, other.variant)

      const after = useWallStore.getState().wall.holds[0]
      expect(after.variant).toBe(other.variant)
      expect(after.collisionBox).toEqual(measureHoldFootprint('jug', other.variant, after.size))
    })

    it('rolls a hold onto a model it was not already wearing', () => {
      place(150, 250)
      const before = useWallStore.getState().wall.holds[0]

      useWallStore.getState().rollHoldVariant(before.id)

      const after = useWallStore.getState().wall.holds[0]
      expect(after.variant).not.toBe(before.variant)
      expect(getModelVariants('jug').map((model) => model.variant)).toContain(after.variant)
    })

    it('arms random after a roll, since the click asked to be surprised', () => {
      place(150, 250)
      const hold = useWallStore.getState().wall.holds[0]
      useWallStore.getState().setSelectedVariant(hold.variant!)

      useWallStore.getState().rollHoldVariant(hold.id)

      expect(useWallStore.getState().variantByType.jug).toBeNull()
    })

    it('arms what a hold is when it is selected, so letting go leaves the rail there', () => {
      useWallStore.getState().setSelectedHoldType('volume')
      place(150, 250)
      const volume = useWallStore.getState().wall.holds[0]
      useWallStore.getState().setSelectedHoldType('crimp')

      useWallStore.getState().selectHold(volume.id)

      expect(useWallStore.getState().selectedHoldType).toBe('volume')
      expect(useWallStore.getState().variantByType.volume).toBe(volume.variant)
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

  describe('setHoldColor', () => {
    it('sets a custom color on a hold', () => {
      place(100, 100)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().setHoldColor(holdId, '#FF0000')

      expect(useWallStore.getState().wall.holds[0].color).toBe('#FF0000')
    })
  })

  describe('reportCollisionBox', () => {
    it('replaces the measured box and touches nothing else', () => {
      place(100, 100)
      const before = useWallStore.getState().wall.holds[0]
      const marker = useWallStore.getState().lastEdit

      useWallStore.getState().reportCollisionBox(before.id, { halfW: 7, halfH: 8, depth: 9 })

      const after = useWallStore.getState().wall.holds[0]
      expect(after.collisionBox).toEqual({ halfW: 7, halfH: 8, depth: 9 })
      expect(after.u).toBe(before.u)
      expect(after.v).toBe(before.v)
      /* A measurement leaves the edit marker alone, which is what keeps it out of history */
      expect(useWallStore.getState().lastEdit).toBe(marker)
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

  describe('the wall never clips', () => {
    it('stops a bend where the panel would pass through the one below it', () => {
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const upperId = useWallStore.getState().selectedFaceId!
      useWallStore.getState().setFaceAngle(upperId, 90)

      /* Asking the base to lean out swings the roof above it down into itself */
      useWallStore.getState().setFaceAngle(rootFaceId(), 60)

      const { wall } = useWallStore.getState()
      expect(wall.faces.byId[rootFaceId()].angle).toBeLessThan(60)
      expect(findWallOverlaps(wall.faces, wall.holds)).toHaveLength(0)
    })

    it('points at the hold that stopped a bend', () => {
      /* An arete swung past a right angle sweeps back over the face it hinges
         on, and a hold near that seam is what it runs into */
      useWallStore.getState().cutFace(rootFaceId(), 'up', 200)
      const finId = useWallStore.getState().selectedFaceId!
      place(190, 200)
      const holdId = useWallStore.getState().wall.holds[0].id

      useWallStore.getState().setFaceAngle(finId, 135)

      expect(useWallStore.getState().blockingHoldIds).toContain(holdId)
      expect(useWallStore.getState().wall.faces.byId[finId].angle).toBeLessThan(135)
    })

    it('stops a hold short of the one it is dragged onto', () => {
      seedHolds({ u: 100, v: 250 }, { u: 200, v: 250 })
      const [first, second] = holdsNow()

      useWallStore.getState().moveHold(second.id, first.u, first.v)

      /* 20cm half-boxes and a centimetre of air: 41cm apart is the nearest it gets */
      const moved = holdsNow()[1]
      expect(moved.u).toBeGreaterThan(141)
      expect(moved.u).toBeLessThan(141.5)
      expect(wallOverlaps()).toHaveLength(0)
    })

    it('slides a hold along its neighbour instead of freezing it', () => {
      seedHolds({ u: 100, v: 250 }, { u: 200, v: 250 })
      const [mover] = holdsNow()

      /* Dragged up and across into the neighbour. It cannot have the column, and
         40cm of climb is not enough to clear the box either, so it takes the
         climb it was asked for and gives up the rest of the sideways travel */
      useWallStore.getState().moveHold(mover.id, 200, 290)

      const moved = holdsNow()[0]
      expect(moved.v).toBe(290)
      expect(moved.u).toBeGreaterThan(158.5)
      expect(moved.u).toBeLessThan(159)
      expect(wallOverlaps()).toHaveLength(0)
    })

    it('moves a hold that fits', () => {
      place(100, 250)
      const hold = useWallStore.getState().wall.holds[0]

      useWallStore.getState().moveHold(hold.id, 200, 300)

      expect(useWallStore.getState().wall.holds[0]).toMatchObject({ u: 200, v: 300 })
    })

    it('hands a hold to the panel it is dragged onto', () => {
      place(150, 100)
      const hold = useWallStore.getState().wall.holds[0]
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const upperId = useWallStore.getState().selectedFaceId!

      useWallStore.getState().moveHold(hold.id, 150, 60, upperId)

      expect(useWallStore.getState().wall.holds[0]).toMatchObject({
        faceId: upperId,
        u: 150,
        v: 60,
      })
    })

    it('refuses to hand a hold over onto another hold', () => {
      place(150, 100)
      const moving = useWallStore.getState().wall.holds[0]
      useWallStore.getState().cutFace(rootFaceId(), 'across', 250)
      const upperId = useWallStore.getState().selectedFaceId!
      useWallStore.getState().addHold(upperId, 150, 60)

      useWallStore.getState().moveHold(moving.id, 150, 60, upperId)

      expect(useWallStore.getState().wall.holds[0].faceId).toBe(rootFaceId())
    })

    it('re-measures a hold when it turns, since a turned box covers different plywood', () => {
      useWallStore.getState().setSelectedHoldType('pinch')
      place(200, 250)
      const before = useWallStore.getState().wall.holds[0]

      useWallStore.getState().rotateHold(before.id)

      const after = useWallStore.getState().wall.holds[0]
      expect(after.rotation).not.toBe(before.rotation)
      expect(after.collisionBox).not.toEqual(before.collisionBox)
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
