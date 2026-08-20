import { describe, it, expect } from 'vitest'
import type { Hold } from '@/stores/wallStore'
import { createRootFaceTree, computeSurfaceArea, getFace, listFaces } from '@crimp-studio/wall-geometry'
import {
  canCutFace,
  cutFaceTree,
  findCutPosition,
  mergeFaceIntoParent,
  MIN_FACE_SIZE,
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
  collisionBox: { halfW: 20, halfH: 15 },
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

  it('refuses an across cut when a left-hinged child spans the seam', () => {
    const base = tree()
    const withArete = cutFaceTree(base, [], base.rootId, 'up', 300)

    expect(canCutFace(withArete.tree, [], base.rootId, 'across', 250).reason).toBe(
      'child-in-the-way',
    )
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

    expect(getFace(cut, base.rootId).height).toBe(300)
    expect(getFace(cut, newFaceId).height).toBe(200)
    expect(getFace(cut, newFaceId).hinge).toBe('bottom')
    expect(getFace(cut, newFaceId).angle).toBe(0)
    expect(computeSurfaceArea(cut)).toBe(computeSurfaceArea(base))
  })

  it('splits sideways for an arete', () => {
    const base = tree()

    const { tree: cut, newFaceId } = cutFaceTree(base, [], base.rootId, 'up', 300)

    expect(getFace(cut, base.rootId).width).toBe(300)
    expect(getFace(cut, newFaceId).width).toBe(100)
    expect(getFace(cut, newFaceId).hinge).toBe('left')
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
})

describe('mergeFaceIntoParent', () => {
  it('gives the surface back and rebases the holds', () => {
    const base = tree()
    const cut = cutFaceTree(base, [makeHold(base.rootId, 100, 400)], base.rootId, 'across', 300)

    const merged = mergeFaceIntoParent(cut.tree, cut.holds, cut.newFaceId)

    expect(listFaces(merged.tree)).toHaveLength(1)
    expect(getFace(merged.tree, base.rootId).height).toBe(500)
    expect(computeSurfaceArea(merged.tree)).toBe(200000)
    expect(merged.holds[0].faceId).toBe(base.rootId)
    expect(merged.holds[0].v).toBe(400)
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
    expect(getFace(merged.tree, base.rootId).height).toBe(350)
  })
})
