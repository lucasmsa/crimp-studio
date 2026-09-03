import { describe, it, expect } from 'vitest'
import type { Hold } from '@/stores/wallStore'
import {
  computeFaceTransforms,
  computeSurfaceArea,
  createRootFaceTree,
  faceLocalToWorld,
  getFace,
  listFaces,
  outlineArea,
  outlineBounds,
  rectOutline,
} from '@crimp-studio/wall-geometry'
import {
  canCutAlong,
  canCutFace,
  canMergeIntoParent,
  cutFaceAlong,
  cutFaceTree,
  findCutPosition,
  mergeFaceIntoParent,
  MIN_FACE_SIZE,
  seamForAxis,
} from '../faceCut'

const PANEL = '#E8D5B7'

const tree = () => createRootFaceTree(400, 500, PANEL)

const makeHold = (faceId: string, u: number, v: number): Hold => ({
  id: `hold_${u}_${v}`,
  type: 'jug',
  faceId,
  u,
  v,
  size: 10,
  collisionBox: { halfW: 20, halfH: 15, depth: 10 },
})

describe('seamForAxis', () => {
  it('runs level across the sheet, and upright up it', () => {
    const base = tree()

    expect(seamForAxis(base, base.rootId, 'across', 300)).toEqual({ a: [0, 300], b: [400, 300] })
    expect(seamForAxis(base, base.rootId, 'up', 300)).toEqual({ a: [300, 0], b: [300, 500] })
  })

  it('follows the plywood, not the frame, on a panel whose frame has turned', () => {
    /* The arete's frame runs down the vertical seam, so a level seam on it is
       a line of constant u, measured from the floor end */
    const base = tree()
    const { tree: cut, newFaceId } = cutFaceTree(base, [], base.rootId, 'up', 300)

    const seam = seamForAxis(cut, newFaceId, 'across', 200)!
    const transforms = computeFaceTransforms(cut)
    const [a, b] = [seam.a, seam.b].map(([u, v]) => faceLocalToWorld(transforms[newFaceId], u, v))

    expect(a.y).toBeCloseTo(2, 5)
    expect(b.y).toBeCloseTo(2, 5)
    expect(Math.abs(a.x - b.x)).toBeCloseTo(1, 5)
  })
})

describe('canCutFace', () => {
  it('allows a cut that leaves both halves usable', () => {
    const base = tree()

    expect(canCutFace(base, [], base.rootId, 'across', 300).ok).toBe(true)
  })

  it('refuses a cut that would leave a strip of trim', () => {
    const base = tree()

    expect(canCutFace(base, [], base.rootId, 'across', MIN_FACE_SIZE - 1).reason).toBe('too-small')
    expect(canCutFace(base, [], base.rootId, 'across', 500).reason).toBe('too-small')
  })

  it('refuses a cut that would pass through a hold', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 305)

    const check = canCutFace(base, [hold], base.rootId, 'across', 300)

    expect(check.ok).toBe(false)
    expect(check.reason).toBe('holds-in-the-way')
    expect(check.blockingHoldIds).toEqual([hold.id])
  })

  it('allows a cut that just clears a hold', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 315)

    expect(canCutFace(base, [hold], base.rootId, 'across', 300).ok).toBe(true)
  })

  it('refuses an across cut when a child hinges on the edge it would cut through', () => {
    const base = tree()
    const withArete = cutFaceTree(base, [], base.rootId, 'up', 300)

    expect(canCutFace(withArete.tree, [], base.rootId, 'across', 250).reason).toBe(
      'child-in-the-way',
    )
  })

  it('allows an up cut on the panel above a seam, which shortens its hinge and hangs the far piece on the new seam', () => {
    const base = tree()
    const { tree: stacked, newFaceId: upper } = cutFaceTree(base, [], base.rootId, 'across', 300)

    expect(canCutFace(stacked, [], upper, 'up', 150).ok).toBe(true)

    const { tree: cut, newFaceId: right } = cutFaceTree(stacked, [], upper, 'up', 150)
    expect(getFace(cut, right).parentId).toBe(upper)
    expect(getFace(cut, upper).parentId).toBe(base.rootId)
  })

  it('refuses a diagonal that would leave a sliver', () => {
    const base = tree()

    const sliver = canCutAlong(base, [], base.rootId, { a: [0, 480], b: [400, 500] })

    expect(sliver.reason).toBe('too-small')
  })
})

describe('findCutPosition', () => {
  it('keeps the aimed seam when it is already clear', () => {
    const base = tree()

    expect(findCutPosition(base, [], base.rootId, 'across', 300)).toBe(300)
  })

  it('slides off a hold to the nearest clear line', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 300)

    const at = findCutPosition(base, [hold], base.rootId, 'across', 300)

    expect(at).not.toBeNull()
    expect(Math.abs(at! - 300)).toBeGreaterThanOrEqual(15)
    expect(canCutFace(base, [hold], base.rootId, 'across', at!).ok).toBe(true)
  })

  it('gives up when a child seam already crosses the other way', () => {
    const base = tree()
    const withArete = cutFaceTree(base, [], base.rootId, 'up', 200)

    expect(findCutPosition(withArete.tree, [], base.rootId, 'across', 250)).toBeNull()
  })
})

describe('cutFaceTree', () => {
  it('splits the face and conserves the plywood', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceTree(base, [], base.rootId, 'across', 300)

    expect(getFace(cut, base.rootId).outline).toEqual(rectOutline(400, 300))
    expect(getFace(cut, newFaceId).outline).toEqual(rectOutline(400, 200))
    expect(getFace(cut, newFaceId).seamEdge).toBe(2)
    expect(getFace(cut, newFaceId).angle).toBe(0)
    expect(computeSurfaceArea(cut)).toBe(computeSurfaceArea(base))
  })

  it('splits sideways for an arete, whose frame runs down the seam', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceTree(base, [], base.rootId, 'up', 300)

    expect(getFace(cut, base.rootId).outline).toEqual(rectOutline(300, 500))
    const arete = getFace(cut, newFaceId)
    expect(arete.seamEdge).toBe(1)
    expect(outlineBounds(arete.outline)).toEqual({ uMin: 0, uMax: 500, vMin: 0, vMax: 100 })
    expect(computeSurfaceArea(cut)).toBe(200000)
  })

  it('puts the arete exactly where the plywood was', () => {
    const base = tree()
    const { tree: cut, newFaceId } = cutFaceTree(base, [], base.rootId, 'up', 300)
    const transforms = computeFaceTransforms(cut)

    const corners = getFace(cut, newFaceId).outline.map(([u, v]) =>
      faceLocalToWorld(transforms[newFaceId], u, v),
    )
    const xs = corners.map((c) => c.x)
    const ys = corners.map((c) => c.y)

    expect(Math.min(...xs)).toBeCloseTo(3, 5)
    expect(Math.max(...xs)).toBeCloseTo(4, 5)
    expect(Math.min(...ys)).toBeCloseTo(0, 5)
    expect(Math.max(...ys)).toBeCloseTo(5, 5)
  })

  it('hands holds above the seam to the new face and rebases them', () => {
    const base = tree()
    const below = makeHold(base.rootId, 100, 100)
    const above = makeHold(base.rootId, 100, 400)

    const { holds, newFaceId } = cutFaceTree(base, [below, above], base.rootId, 'across', 300)

    expect(holds[0]).toEqual(below)
    expect(holds[1].faceId).toBe(newFaceId)
    expect(holds[1].v).toBe(100)
  })

  it('keeps a hold handed to an arete at the same spot on the wall', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 350, 200)

    const { tree: cut, holds, newFaceId } = cutFaceTree(base, [hold], base.rootId, 'up', 300)
    const world = faceLocalToWorld(computeFaceTransforms(cut)[newFaceId], holds[0].u, holds[0].v)

    expect(holds[0].faceId).toBe(newFaceId)
    expect(world.x).toBeCloseTo(3.5, 5)
    expect(world.y).toBeCloseTo(2, 5)
  })

  it('gives both halves the paint the panel already had', () => {
    const base = tree()
    const painted = {
      rootId: base.rootId,
      byId: { [base.rootId]: { ...getFace(base, base.rootId), color: '#5A6B78' } },
    }

    const { tree: cut, newFaceId } = cutFaceTree(painted, [], base.rootId, 'across', 300)

    expect(getFace(cut, base.rootId).color).toBe('#5A6B78')
    expect(getFace(cut, newFaceId).color).toBe('#5A6B78')
  })

  it('re-parents a child that hinges on the edge the new face takes', () => {
    const base = tree()
    const first = cutFaceTree(base, [], base.rootId, 'across', 300)
    const second = cutFaceTree(first.tree, [], base.rootId, 'across', 150)

    expect(getFace(second.tree, first.newFaceId).parentId).toBe(second.newFaceId)
    expect(listFaces(second.tree)).toHaveLength(3)
  })

  it('cuts along any straight line, leaving two convex pieces that sum to the sheet', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceAlong(base, [], base.rootId, {
      a: [0, 200],
      b: [400, 500],
    })

    const near = getFace(cut, base.rootId)
    const far = getFace(cut, newFaceId)
    expect(near.outline).toHaveLength(4)
    expect(far.outline).toHaveLength(3)
    expect(outlineArea(near.outline) + outlineArea(far.outline)).toBeCloseTo(200000, 5)
    expect(Math.min(...far.outline.map(([, v]) => v))).toBeCloseTo(0, 6)
    expect(far.seamEdge).toBe(2)
  })
})

describe('mergeFaceIntoParent', () => {
  it('gives the surface back and rebases the holds', () => {
    const base = tree()
    const cut = cutFaceTree(base, [makeHold(base.rootId, 100, 400)], base.rootId, 'across', 300)

    const merged = mergeFaceIntoParent(cut.tree, cut.holds, cut.newFaceId)

    expect(listFaces(merged.tree)).toHaveLength(1)
    expect(getFace(merged.tree, base.rootId).outline).toEqual(rectOutline(400, 500))
    expect(computeSurfaceArea(merged.tree)).toBe(200000)
    expect(merged.holds[0].faceId).toBe(base.rootId)
    expect(merged.holds[0].v).toBe(400)
  })

  it('merges an arete back, turning its holds with its frame', () => {
    const base = tree()
    const cut = cutFaceTree(base, [makeHold(base.rootId, 350, 200)], base.rootId, 'up', 300)

    const merged = mergeFaceIntoParent(cut.tree, cut.holds, cut.newFaceId)

    expect(getFace(merged.tree, base.rootId).outline).toEqual(rectOutline(400, 500))
    expect(merged.holds[0].u).toBeCloseTo(350, 6)
    expect(merged.holds[0].v).toBeCloseTo(200, 6)
  })

  it('leaves the root alone, since it has nothing to merge into', () => {
    const base = tree()

    expect(mergeFaceIntoParent(base, [], base.rootId).tree).toBe(base)
  })

  it('re-parents grandchildren onto the merged face', () => {
    const base = tree()
    const first = cutFaceTree(base, [], base.rootId, 'across', 200)
    const second = cutFaceTree(first.tree, [], first.newFaceId, 'across', 150)

    const merged = mergeFaceIntoParent(second.tree, second.holds, first.newFaceId)

    expect(getFace(merged.tree, second.newFaceId).parentId).toBe(base.rootId)
    expect(getFace(merged.tree, base.rootId).outline).toEqual(rectOutline(400, 350))
  })

  it('refuses to merge a piece that no longer spans the edge it hinges on', () => {
    /* The upper panel was cut upright, so it covers only the left of the seam.
       Merging it would make an L, which is not one panel */
    const base = tree()
    const stacked = cutFaceTree(base, [], base.rootId, 'across', 300)
    const split = cutFaceTree(stacked.tree, [], stacked.newFaceId, 'up', 150)

    expect(canMergeIntoParent(split.tree, stacked.newFaceId)).toBe(false)
    expect(mergeFaceIntoParent(split.tree, split.holds, stacked.newFaceId).tree).toBe(split.tree)
    expect(canMergeIntoParent(split.tree, split.newFaceId)).toBe(true)
  })
})
