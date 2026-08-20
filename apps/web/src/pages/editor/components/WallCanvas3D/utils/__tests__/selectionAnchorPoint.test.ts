import { describe, it, expect } from 'vitest'
import type { Hold } from '@/stores/wallStore'
import { computeFaceTransforms, createRootFaceTree } from '@crimp-studio/wall-geometry'
import { cutFaceTree } from '../faceCut'
import { faceSelectionAnchor, holdSelectionAnchor } from '../selectionAnchorPoint'

const PANEL = '#E8D5B7'

const anchorOf = (tree: ReturnType<typeof createRootFaceTree>, faceId: string) =>
  faceSelectionAnchor(tree, computeFaceTransforms(tree), faceId)

describe('faceSelectionAnchor', () => {
  it('sits at the middle of the right border, off the surface', () => {
    const tree = createRootFaceTree(400, 500, PANEL)

    const anchor = anchorOf(tree, tree.rootId)

    expect(anchor.x).toBeCloseTo(4)
    expect(anchor.y).toBeCloseTo(2.5)
    expect(anchor.z).toBeGreaterThan(0)
  })

  it('rides the bend, so the line keeps pointing at the panel it belongs to', () => {
    const flat = createRootFaceTree(400, 500, PANEL)
    const { tree, newFaceId } = cutFaceTree(flat, [], flat.rootId, 'across', 300)
    const bent = {
      rootId: tree.rootId,
      byId: { ...tree.byId, [newFaceId]: { ...tree.byId[newFaceId], angle: 90 } },
    }

    const upright = anchorOf(tree, newFaceId)
    const roofed = anchorOf(bent, newFaceId)

    expect(roofed.y).toBeLessThan(upright.y)
    expect(roofed.z).toBeGreaterThan(upright.z)
    expect(roofed.x).toBeCloseTo(upright.x)
  })
})

describe('holdSelectionAnchor', () => {
  it('sits at the edge of the hold facing the card, off the panel', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const hold = {
      id: 'h1',
      faceId: tree.rootId,
      u: 120,
      v: 250,
      collisionBox: { halfW: 15, halfH: 15, depth: 10 },
    } as Hold

    const anchor = holdSelectionAnchor(computeFaceTransforms(tree), hold)

    expect(anchor.x).toBeCloseTo(1.35)
    expect(anchor.y).toBeCloseTo(2.5)
    expect(anchor.z).toBeGreaterThan(0)
  })
})
