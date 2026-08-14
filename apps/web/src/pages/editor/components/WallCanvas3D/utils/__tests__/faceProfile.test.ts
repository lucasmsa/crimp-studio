import { describe, it, expect } from 'vitest'
import type { FaceTree } from '../faceTree'
import { createRootFaceTree } from '../faceTree'
import { computeFaceTransforms } from '../faceTransform'
import { computeWallProfile } from '../faceProfile'

function bendTopSection(sheetHeight: number, topHeight: number, angle: number): FaceTree {
  const base = createRootFaceTree(400, sheetHeight - topHeight)
  const topId = 'face_top'
  const root = base.byId[base.rootId]

  return {
    rootId: base.rootId,
    byId: {
      [base.rootId]: { ...root, childIds: [topId] },
      [topId]: {
        id: topId,
        parentId: base.rootId,
        hinge: 'bottom',
        width: 400,
        height: topHeight,
        angle,
        childIds: [],
      },
    },
  }
}

describe('computeWallProfile', () => {
  it('reports the plywood size for a flat wall', () => {
    const tree = createRootFaceTree(400, 500)

    const profile = computeWallProfile(tree, computeFaceTransforms(tree))

    expect(profile.heightCm).toBeCloseTo(500, 5)
    expect(profile.reachCm).toBeCloseTo(0, 5)
    expect(profile.surfaceAreaCm2).toBe(200000)
  })

  it('trades height for reach when the top bends out', () => {
    const tree = bendTopSection(500, 200, 30)

    const profile = computeWallProfile(tree, computeFaceTransforms(tree))

    expect(profile.heightCm).toBeCloseTo(473.2, 1)
    expect(profile.reachCm).toBeCloseTo(100, 1)
    expect(profile.surfaceAreaCm2).toBe(200000)
  })

  it('keeps the plywood when a roof takes the whole top section out', () => {
    const tree = bendTopSection(500, 200, 90)

    const profile = computeWallProfile(tree, computeFaceTransforms(tree))

    expect(profile.heightCm).toBeCloseTo(300, 5)
    expect(profile.reachCm).toBeCloseTo(200, 5)
    expect(profile.surfaceAreaCm2).toBe(200000)
  })
})
