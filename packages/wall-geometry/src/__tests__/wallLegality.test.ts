import { describe, it, expect } from 'vitest'
import type { FaceTree, HingeEdge } from '../faceTree'
import { createRootFaceTree, getFace } from '../faceTree'
import type { HoldPlacement } from '../wallSolids'
import { findLegalFaceAngle, findWallOverlaps, holdPlacementIsClear, wallIsClear } from '../wallLegality'

const PANEL = '#E8D5B7'

/** Hinges a face onto a parent, the way a cut does, and returns its id */
function hinge(
  tree: FaceTree,
  parentId: string,
  hingeEdge: HingeEdge,
  size: { width: number; height: number },
  angle = 0,
): { tree: FaceTree; id: string } {
  const parent = getFace(tree, parentId)
  const id = `face_${Object.keys(tree.byId).length}`

  return {
    id,
    tree: {
      rootId: tree.rootId,
      byId: {
        ...tree.byId,
        [parentId]: { ...parent, childIds: [...parent.childIds, id] },
        [id]: { id, parentId, hinge: hingeEdge, ...size, angle, color: PANEL, childIds: [] },
      },
    },
  }
}

const hold = (faceId: string, u: number, v: number, id = `hold_${u}_${v}`): HoldPlacement => ({
  id,
  faceId,
  u,
  v,
  collisionBox: { halfW: 12, halfH: 12, depth: 10 },
})

/** A wall with an arete: the right slice wraps around the vertical seam */
function finWall(finAngle = 0) {
  const base = createRootFaceTree(400, 400, PANEL)
  const fin = hinge(base, base.rootId, 'left', { width: 100, height: 400 }, finAngle)
  return { tree: fin.tree, rootId: base.rootId, finId: fin.id }
}

/** Root, a middle section, and a top section, each 400 wide */
function threeStack(middleAngle = 0, topAngle = 0, topHeight = 200) {
  const base = createRootFaceTree(400, 200, PANEL)
  const middle = hinge(base, base.rootId, 'bottom', { width: 400, height: 200 }, middleAngle)
  const top = hinge(middle.tree, middle.id, 'bottom', { width: 400, height: topHeight }, topAngle)
  return { tree: top.tree, rootId: base.rootId, middleId: middle.id, topId: top.id }
}

describe('wallIsClear', () => {
  it('passes a flat wall', () => {
    expect(wallIsClear(createRootFaceTree(400, 500, PANEL), [])).toBe(true)
  })

  it('passes a normal gym profile: vertical, then an overhang, then a roof', () => {
    const { tree } = threeStack(30, 60)

    expect(wallIsClear(tree, [])).toBe(true)
  })

  it('catches a section folded back into the panel two seams below it', () => {
    /* A 2m base, a 1m shelf lying flat off the top of it, and a 2m section
       folding back down off the shelf at 45 degrees. That last one crosses the
       base's surface a metre up, and the base is not what it hinges on */
    const base = createRootFaceTree(400, 200, PANEL)
    const shelf = hinge(base, base.rootId, 'bottom', { width: 400, height: 100 }, 90)
    const folded = hinge(shelf.tree, shelf.id, 'bottom', { width: 400, height: 200 }, 135)

    const overlaps = findWallOverlaps(folded.tree, [])

    expect(
      overlaps.some(
        ({ a, b }) =>
          a.kind === 'panel' &&
          b.kind === 'panel' &&
          [a.id, b.id].includes(base.rootId) &&
          [a.id, b.id].includes(folded.id),
      ),
    ).toBe(true)
  })

  it('leaves a hinged pair alone, since they share their seam', () => {
    const { tree } = threeStack(0, 0)

    expect(findWallOverlaps(tree, [])).toHaveLength(0)
  })

  it('catches a panel swung through the floor', () => {
    const base = createRootFaceTree(400, 100, PANEL)
    const arm = hinge(base, base.rootId, 'bottom', { width: 400, height: 300 }, -120)

    expect(wallIsClear(arm.tree, [])).toBe(false)
  })

  it('leaves the root panel and the floor alone, since the root stands on it', () => {
    expect(wallIsClear(createRootFaceTree(400, 500, PANEL), [])).toBe(true)
  })

  it('catches a hold poking into the panel wrapped around the seam beside it', () => {
    /* Past a right angle the arete sweeps back across the face it hinges on,
       which is where the holds are */
    const { tree, finId } = finWall(135)
    const nearTheSeam = hold(tree.rootId, 388, 200)

    const overlaps = findWallOverlaps(tree, [nearTheSeam])

    expect(overlaps.some(({ a, b }) => [a.id, b.id].includes(finId))).toBe(true)
  })

  it('leaves that same hold alone while the panel beside it is flush', () => {
    const { tree } = finWall(0)

    expect(wallIsClear(tree, [hold(tree.rootId, 388, 200)])).toBe(true)
  })

  it('catches two holds meeting in world space across a seam', () => {
    const { tree, middleId } = threeStack(-90)

    const overlaps = findWallOverlaps(tree, [
      hold(tree.rootId, 200, 195, 'below'),
      hold(middleId, 200, 5, 'above'),
    ])

    expect(overlaps.some(({ a, b }) => a.kind === 'hold' && b.kind === 'hold')).toBe(true)
  })

  it('leaves a hold on its own panel alone', () => {
    const flat = createRootFaceTree(400, 500, PANEL)

    expect(wallIsClear(flat, [hold(flat.rootId, 200, 250)])).toBe(true)
  })
})

describe('findLegalFaceAngle', () => {
  it('commits the angle asked for when nothing is in the way', () => {
    const { tree, topId } = threeStack()

    const limit = findLegalFaceAngle({ faces: tree, holds: [], faceId: topId, from: 0, to: 45 })

    expect(limit).toEqual({ angle: 45, clamped: false, blockingHoldIds: [] })
  })

  it('stops a fold short of the panel it would pass through', () => {
    const { tree, topId } = threeStack(90, 0, 300)

    const limit = findLegalFaceAngle({ faces: tree, holds: [], faceId: topId, from: 0, to: 135 })

    expect(limit.clamped).toBe(true)
    expect(limit.angle).toBeGreaterThan(0)
    expect(limit.angle).toBeLessThan(135)
    expect(wallIsClear(withAngle(tree, topId, limit.angle), [])).toBe(true)
  })

  it('lands within half a degree of contact, not somewhere safe', () => {
    const { tree, topId } = threeStack(90, 0, 300)

    const limit = findLegalFaceAngle({ faces: tree, holds: [], faceId: topId, from: 0, to: 135 })

    expect(wallIsClear(withAngle(tree, topId, limit.angle + 1), [])).toBe(false)
  })

  it('says which hold stopped a bend', () => {
    const { tree, finId } = finWall()
    const blocker = hold(tree.rootId, 388, 200, 'blocker')

    const limit = findLegalFaceAngle({
      faces: tree,
      holds: [blocker],
      faceId: finId,
      from: 0,
      to: 135,
    })

    expect(limit.clamped).toBe(true)
    expect(limit.blockingHoldIds).toContain('blocker')
    expect(limit.angle).toBeLessThan(135)
  })

  it('lets the same bend through once the hold is out of its way', () => {
    const { tree, finId } = finWall()

    const limit = findLegalFaceAngle({ faces: tree, holds: [], faceId: finId, from: 0, to: 135 })

    expect(limit).toEqual({ angle: 135, clamped: false, blockingHoldIds: [] })
  })

  it('stops a panel at the floor', () => {
    const base = createRootFaceTree(400, 200, PANEL)
    const arm = hinge(base, base.rootId, 'bottom', { width: 400, height: 300 })

    const limit = findLegalFaceAngle({
      faces: arm.tree,
      holds: [],
      faceId: arm.id,
      from: 0,
      to: -135,
    })

    expect(limit.clamped).toBe(true)
    expect(wallIsClear(withAngle(arm.tree, arm.id, limit.angle), [])).toBe(true)
  })
})

describe('holdPlacementIsClear', () => {
  it('lets a hold onto open plywood', () => {
    const flat = createRootFaceTree(400, 500, PANEL)

    expect(holdPlacementIsClear(flat, [], hold(flat.rootId, 200, 250))).toBe(true)
  })

  it('refuses a hold on top of another one', () => {
    const flat = createRootFaceTree(400, 500, PANEL)
    const sitting = hold(flat.rootId, 200, 250, 'sitting')

    expect(holdPlacementIsClear(flat, [sitting], hold(flat.rootId, 205, 250))).toBe(false)
  })

  it('lets a hold move to where it already is', () => {
    const flat = createRootFaceTree(400, 500, PANEL)
    const moving = hold(flat.rootId, 200, 250, 'moving')

    expect(holdPlacementIsClear(flat, [moving], moving)).toBe(true)
  })

  it('refuses a hold that would bury itself in the panel wrapped beside it', () => {
    const { tree } = finWall(135)

    expect(holdPlacementIsClear(tree, [], hold(tree.rootId, 388, 200))).toBe(false)
  })
})

function withAngle(tree: FaceTree, faceId: string, angle: number): FaceTree {
  return {
    rootId: tree.rootId,
    byId: { ...tree.byId, [faceId]: { ...getFace(tree, faceId), angle } },
  }
}
