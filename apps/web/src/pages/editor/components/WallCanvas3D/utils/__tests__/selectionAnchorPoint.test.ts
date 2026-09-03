import { describe, it, expect } from 'vitest'
import type { Hold } from '@/stores/wallStore'
import { computeFaceTransforms, createRootFaceTree } from '@crimp-studio/wall-geometry'
import { cutFaceAlong } from '../faceCut'
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
    const { tree, newFaceId } = cutFaceAlong(flat, [], flat.rootId, { a: [0, 300], b: [400, 300] })
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
  const tree = createRootFaceTree(400, 500, PANEL)
  const transforms = computeFaceTransforms(tree)

  /* A volume is a long thin wedge at a random angle, so the edge of its box at
     the hold's centre height is air beside it. The only point every silhouette
     covers is the hold's own centre */
  it('sits over the centre of the hold, whatever its silhouette', () => {
    const wedge = {
      id: 'h1',
      faceId: tree.rootId,
      u: 120,
      v: 250,
      collisionBox: { halfW: 42, halfH: 38, depth: 20 },
    } as Hold

    const anchor = holdSelectionAnchor(transforms, wedge)

    expect(anchor.x).toBeCloseTo(1.2)
    expect(anchor.y).toBeCloseTo(2.5)
  })

  it('clears the front of the hold, so the cord lands on it rather than inside it', () => {
    const wedge = {
      id: 'h1',
      faceId: tree.rootId,
      u: 120,
      v: 250,
      collisionBox: { halfW: 42, halfH: 38, depth: 20 },
    } as Hold

    const anchor = holdSelectionAnchor(transforms, wedge)

    expect(anchor.z).toBeGreaterThan(0.2)
    expect(anchor.z).toBeLessThan(0.3)
  })

  it('still lifts off the panel before the hold has been measured', () => {
    const unmeasured = { id: 'h2', faceId: tree.rootId, u: 120, v: 250 } as Hold

    const anchor = holdSelectionAnchor(transforms, unmeasured)

    expect(anchor.x).toBeCloseTo(1.2)
    expect(anchor.z).toBeGreaterThan(0)
  })
})
