import { describe, it, expect } from 'vitest'
import type { Hold } from '@/stores/wallStore'
import { computeFaceTransforms, createRootFaceTree } from '@crimp-studio/wall-geometry'
import { cutFaceTree } from '../faceCut'
import { facePopoverAnchor, holdPopoverAnchor } from '../popoverAnchor'

const PANEL = '#E8D5B7'

const anchorOf = (tree: ReturnType<typeof createRootFaceTree>, faceId: string) =>
  facePopoverAnchor(tree, computeFaceTransforms(tree), faceId)

describe('facePopoverAnchor', () => {
  it('hangs beside the middle of the panel, off its surface', () => {
    const tree = createRootFaceTree(400, 500, PANEL)

    const anchor = anchorOf(tree, tree.rootId)

    expect(anchor.x).toBeCloseTo(4)
    expect(anchor.y).toBeCloseTo(2.5)
    expect(anchor.z).toBeGreaterThan(0)
  })

  it('rides the bend, so the popover stays with the panel it belongs to', () => {
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

describe('holdPopoverAnchor', () => {
  it('sits on the hold, off the panel it is bolted to', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const hold = { id: 'h1', faceId: tree.rootId, u: 120, v: 250 } as Hold

    const anchor = holdPopoverAnchor(computeFaceTransforms(tree), hold)

    expect(anchor.x).toBeCloseTo(1.2)
    expect(anchor.y).toBeCloseTo(2.5)
    expect(anchor.z).toBeGreaterThan(0)
  })
})
