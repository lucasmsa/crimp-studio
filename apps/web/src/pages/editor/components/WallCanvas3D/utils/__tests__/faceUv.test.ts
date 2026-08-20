import { describe, it, expect } from 'vitest'
import { createRootFaceTree } from '../faceTree'
import { cutFaceTree } from '../faceCut'
import { computeFaceUvTransform } from '../faceUv'

const PANEL = '#E8D5B7'

describe('computeFaceUvTransform', () => {
  it('maps a whole sheet by its size in plywood panels', () => {
    const tree = createRootFaceTree(244, 122, PANEL)

    const uv = computeFaceUvTransform(tree, tree.rootId)

    expect(uv.repeat).toEqual([2, 1])
    expect(uv.offset).toEqual([0, 0])
  })

  it('picks up the pattern where the face below leaves off', () => {
    const base = createRootFaceTree(400, 500, PANEL)
    const { tree, newFaceId } = cutFaceTree(base, [], base.rootId, 'across', 300)

    const lower = computeFaceUvTransform(tree, base.rootId)
    const upper = computeFaceUvTransform(tree, newFaceId)

    expect(lower.offset[1] + lower.repeat[1]).toBeCloseTo(upper.offset[1], 10)
  })

  it('does the same across an arete seam', () => {
    const base = createRootFaceTree(400, 500, PANEL)
    const { tree, newFaceId } = cutFaceTree(base, [], base.rootId, 'up', 300)

    const left = computeFaceUvTransform(tree, base.rootId)
    const right = computeFaceUvTransform(tree, newFaceId)

    expect(left.offset[0] + left.repeat[0]).toBeCloseTo(right.offset[0], 10)
  })
})
