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
import type { Seam } from '../faceCut'
import {
  canCutAlong,
  canMergeIntoParent,
  canTrimAlong,
  cutFaceAlong,
  mergeFaceIntoParent,
  MIN_FACE_SIZE,
  seamAngleDeg,
  seamThrough,
  trimFaceAlong,
  trimPreview,
} from '../faceCut'

const PANEL = '#E8D5B7'
const WIDTH = 400
const HEIGHT = 500

const tree = () => createRootFaceTree(WIDTH, HEIGHT, PANEL)

/** A level seam across the whole sheet, `at` cm up */
const level = (at: number, width = WIDTH): Seam => ({ a: [0, at], b: [width, at] })
/** An upright seam up the whole sheet, `at` cm across */
const upright = (at: number, height = HEIGHT): Seam => ({ a: [at, 0], b: [at, height] })

const makeHold = (faceId: string, u: number, v: number, id = `hold_${u}_${v}`): Hold => ({
  id,
  type: 'jug',
  faceId,
  u,
  v,
  size: 10,
  collisionBox: { halfW: 20, halfH: 15, depth: 10 },
})

describe('seamThrough', () => {
  it('runs the line through the anchor and the cursor out to the border both ways', () => {
    const outline = rectOutline(WIDTH, HEIGHT)

    expect(seamThrough(outline, [200, 250], [300, 250])).toEqual({ a: [0, 250], b: [400, 250] })
    expect(seamThrough(outline, [100, 100], [200, 200])).toEqual({ a: [0, 0], b: [400, 400] })
  })

  it('has no line while the cursor is still on the anchor', () => {
    expect(seamThrough(rectOutline(WIDTH, HEIGHT), [200, 250], [200.5, 250.2])).toBeNull()
  })
})

describe('seamAngleDeg', () => {
  it('reads level as 0, upright as 90, and a diagonal in between', () => {
    const base = tree()

    expect(seamAngleDeg(base, base.rootId, level(250))).toBe(0)
    expect(seamAngleDeg(base, base.rootId, upright(200))).toBe(90)
    expect(seamAngleDeg(base, base.rootId, { a: [0, 0], b: [400, 400] })).toBeCloseTo(45, 6)
    expect(seamAngleDeg(base, base.rootId, { a: [400, 0], b: [0, 400] })).toBeCloseTo(135, 6)
  })

  it('follows the plywood, not the frame, on an arete whose frame runs down the seam', () => {
    const base = tree()
    const { tree: cut, newFaceId } = cutFaceAlong(base, [], base.rootId, upright(300))

    /* Along the arete's u axis is down the wall; along its v axis is across it */
    expect(seamAngleDeg(cut, newFaceId, { a: [100, 20], b: [300, 20] })).toBeCloseTo(90, 6)
    expect(seamAngleDeg(cut, newFaceId, { a: [250, 0], b: [250, 100] })).toBeCloseTo(0, 6)
  })
})

describe('canCutAlong', () => {
  it('allows a cut that leaves both halves usable', () => {
    const base = tree()

    expect(canCutAlong(base, [], base.rootId, level(300)).ok).toBe(true)
  })

  it('refuses a cut that would leave a strip of trim', () => {
    const base = tree()

    expect(canCutAlong(base, [], base.rootId, level(MIN_FACE_SIZE - 1)).reason).toBe('too-small')
    expect(canCutAlong(base, [], base.rootId, level(HEIGHT - 1)).reason).toBe('too-small')
    expect(canCutAlong(base, [], base.rootId, null).reason).toBe('too-small')
  })

  it('refuses a cut that would pass through a hold', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 305)

    const check = canCutAlong(base, [hold], base.rootId, level(300))

    expect(check.ok).toBe(false)
    expect(check.reason).toBe('holds-in-the-way')
    expect(check.blockingHoldIds).toEqual([hold.id])
  })

  it('allows a cut that just clears a hold', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 315)

    expect(canCutAlong(base, [hold], base.rootId, level(300)).ok).toBe(true)
  })

  it('refuses a seam that would cut through the edge a child hinges on', () => {
    const base = tree()
    const withArete = cutFaceAlong(base, [], base.rootId, upright(300))

    expect(canCutAlong(withArete.tree, [], base.rootId, level(250, 300)).reason).toBe(
      'child-in-the-way',
    )
  })

  it('allows an upright cut on the panel above a seam, which shortens its hinge and hangs the far piece on the new seam', () => {
    const base = tree()
    const { tree: stacked, newFaceId: upper } = cutFaceAlong(base, [], base.rootId, level(300))

    expect(canCutAlong(stacked, [], upper, upright(150, 200)).ok).toBe(true)

    const { tree: cut, newFaceId: right } = cutFaceAlong(stacked, [], upper, upright(150, 200))
    expect(getFace(cut, right).parentId).toBe(upper)
    expect(getFace(cut, upper).parentId).toBe(base.rootId)
  })

  it('refuses a diagonal that would leave a sliver', () => {
    const base = tree()

    expect(canCutAlong(base, [], base.rootId, { a: [0, 480], b: [400, 500] }).reason).toBe(
      'too-small',
    )
  })
})

describe('canTrimAlong', () => {
  it('lets a thin strip go, since the offcut can be any size', () => {
    const base = tree()
    const thin = level(480)

    expect(canCutAlong(base, [], base.rootId, thin).reason).toBe('too-small')
    expect(canTrimAlong(base, [], base.rootId, thin).ok).toBe(true)
  })

  it('still needs the piece that stays to be a panel', () => {
    const base = tree()

    expect(canTrimAlong(base, [], base.rootId, level(20)).reason).toBe('too-small')
  })

  it('lets an offcut carry a panel away, but not cut through the edge one hinges on', () => {
    const base = tree()
    const { tree: stacked } = cutFaceAlong(base, [], base.rootId, level(300))

    expect(canTrimAlong(stacked, [], base.rootId, level(200)).ok).toBe(true)
    expect(canTrimAlong(stacked, [], base.rootId, upright(200, 300)).reason).toBe('child-in-the-way')
  })

  it('refuses a seam through a hold, as a cut does', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 200, 305)

    expect(canTrimAlong(base, [hold], base.rootId, level(300)).blockingHoldIds).toEqual([hold.id])
  })
})

describe('trimPreview', () => {
  it('names the offcut, the panels hinged on it down the tree, and every hold that goes with them', () => {
    const base = tree()
    const stacked = cutFaceAlong(base, [], base.rootId, level(300))
    const upper = stacked.newFaceId
    const tall = cutFaceAlong(stacked.tree, [], upper, level(100))
    const top = tall.newFaceId
    const holds = [
      makeHold(base.rootId, 100, 100, 'kept'),
      makeHold(base.rootId, 100, 250, 'onOffcut'),
      makeHold(upper, 50, 50, 'onUpper'),
      makeHold(top, 50, 50, 'onTop'),
    ]

    const preview = trimPreview(tall.tree, holds, base.rootId, level(200))

    expect(outlineArea(preview.offcut)).toBeCloseTo(400 * 100, 6)
    expect(preview.leavingFaceIds).toEqual([upper, top])
    expect(preview.leavingHoldIds.sort()).toEqual(['onOffcut', 'onTop', 'onUpper'])
  })

  it('leaves a child on the kept side alone', () => {
    const base = tree()
    const { tree: withArete, newFaceId: arete } = cutFaceAlong(base, [], base.rootId, upright(300))

    /* A corner off the top left: the arete on the right edge stays */
    const preview = trimPreview(withArete, [], base.rootId, { a: [0, 400], b: [100, 500] })

    expect(preview.leavingFaceIds).toEqual([])
    expect(getFace(withArete, arete).parentId).toBe(base.rootId)
  })
})

describe('cutFaceAlong', () => {
  it('splits the face and conserves the plywood', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceAlong(base, [], base.rootId, level(300))

    expect(getFace(cut, base.rootId).outline).toEqual(rectOutline(400, 300))
    expect(getFace(cut, newFaceId).outline).toEqual(rectOutline(400, 200))
    expect(getFace(cut, newFaceId).seamEdge).toBe(2)
    expect(getFace(cut, newFaceId).angle).toBe(0)
    expect(computeSurfaceArea(cut)).toBe(computeSurfaceArea(base))
  })

  it('splits sideways for an arete, whose frame runs down the seam', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceAlong(base, [], base.rootId, upright(300))

    expect(getFace(cut, base.rootId).outline).toEqual(rectOutline(300, 500))
    const arete = getFace(cut, newFaceId)
    expect(arete.seamEdge).toBe(1)
    expect(outlineBounds(arete.outline)).toEqual({ uMin: 0, uMax: 500, vMin: 0, vMax: 100 })
    expect(computeSurfaceArea(cut)).toBe(200000)
  })

  it('puts the arete exactly where the plywood was', () => {
    const base = tree()
    const { tree: cut, newFaceId } = cutFaceAlong(base, [], base.rootId, upright(300))
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

    const { holds, newFaceId } = cutFaceAlong(base, [below, above], base.rootId, level(300))

    expect(holds[0]).toEqual(below)
    expect(holds[1].faceId).toBe(newFaceId)
    expect(holds[1].v).toBe(100)
  })

  it('keeps a hold handed to an arete at the same spot on the wall', () => {
    const base = tree()
    const hold = makeHold(base.rootId, 350, 200)

    const { tree: cut, holds, newFaceId } = cutFaceAlong(base, [hold], base.rootId, upright(300))
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

    const { tree: cut, newFaceId } = cutFaceAlong(painted, [], base.rootId, level(300))

    expect(getFace(cut, base.rootId).color).toBe('#5A6B78')
    expect(getFace(cut, newFaceId).color).toBe('#5A6B78')
  })

  it('re-parents a child that hinges on the edge the new face takes', () => {
    const base = tree()
    const first = cutFaceAlong(base, [], base.rootId, level(300))
    const second = cutFaceAlong(first.tree, [], base.rootId, level(150))

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

describe('trimFaceAlong', () => {
  it('keeps the hinge side and throws the offcut away, panels and holds included', () => {
    const base = tree()
    const stacked = cutFaceAlong(base, [], base.rootId, level(300))
    const upper = stacked.newFaceId
    const holds = [
      makeHold(base.rootId, 100, 100, 'kept'),
      makeHold(base.rootId, 100, 250, 'onOffcut'),
      makeHold(upper, 50, 50, 'onUpper'),
    ]

    const trimmed = trimFaceAlong(stacked.tree, holds, base.rootId, level(200))

    expect(listFaces(trimmed.tree).map((face) => face.id)).toEqual([base.rootId])
    expect(getFace(trimmed.tree, base.rootId).outline).toEqual(rectOutline(400, 200))
    expect(getFace(trimmed.tree, base.rootId).childIds).toEqual([])
    expect(computeSurfaceArea(trimmed.tree)).toBe(80000)
    expect(trimmed.holds.map((hold) => hold.id)).toEqual(['kept'])
    expect(outlineArea(trimmed.offcut)).toBeCloseTo(40000, 6)
    expect(trimmed.offcutHolds).toEqual([holds[1]])
  })

  it('takes a diagonal corner off and leaves a valid convex panel', () => {
    const base = tree()

    const trimmed = trimFaceAlong(base, [], base.rootId, { a: [200, 500], b: [400, 300] })

    const kept = getFace(trimmed.tree, base.rootId)
    expect(kept.outline).toHaveLength(5)
    expect(computeSurfaceArea(trimmed.tree) + outlineArea(trimmed.offcut)).toBeCloseTo(200000, 6)
  })
})

describe('mergeFaceIntoParent', () => {
  it('gives the surface back and rebases the holds', () => {
    const base = tree()
    const cut = cutFaceAlong(base, [makeHold(base.rootId, 100, 400)], base.rootId, level(300))

    const merged = mergeFaceIntoParent(cut.tree, cut.holds, cut.newFaceId)

    expect(listFaces(merged.tree)).toHaveLength(1)
    expect(getFace(merged.tree, base.rootId).outline).toEqual(rectOutline(400, 500))
    expect(computeSurfaceArea(merged.tree)).toBe(200000)
    expect(merged.holds[0].faceId).toBe(base.rootId)
    expect(merged.holds[0].v).toBe(400)
  })

  it('merges an arete back, turning its holds with its frame', () => {
    const base = tree()
    const cut = cutFaceAlong(base, [makeHold(base.rootId, 350, 200)], base.rootId, upright(300))

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
    const first = cutFaceAlong(base, [], base.rootId, level(200))
    const second = cutFaceAlong(first.tree, [], first.newFaceId, level(150))

    const merged = mergeFaceIntoParent(second.tree, second.holds, first.newFaceId)

    expect(getFace(merged.tree, second.newFaceId).parentId).toBe(base.rootId)
    expect(getFace(merged.tree, base.rootId).outline).toEqual(rectOutline(400, 350))
  })

  it('refuses to merge a piece that no longer spans the edge it hinges on', () => {
    /* The upper panel was cut upright, so it covers only the left of the seam.
       Merging it would make an L, which is not one panel */
    const base = tree()
    const stacked = cutFaceAlong(base, [], base.rootId, level(300))
    const split = cutFaceAlong(stacked.tree, [], stacked.newFaceId, upright(150, 200))

    expect(canMergeIntoParent(split.tree, stacked.newFaceId)).toBe(false)
    expect(mergeFaceIntoParent(split.tree, split.holds, stacked.newFaceId).tree).toBe(split.tree)
    expect(canMergeIntoParent(split.tree, split.newFaceId)).toBe(true)
  })
})
