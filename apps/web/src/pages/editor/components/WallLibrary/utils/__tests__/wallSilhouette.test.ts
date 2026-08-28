import { describe, it, expect } from 'vitest'
import type { FaceTree, HingeEdge } from '@crimp-studio/wall-geometry'
import { createRootFaceTree, getFace } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'
import { silhouettePath, wallSilhouette } from '../wallSilhouette'

const PANEL = '#E8D5B7'

function hinge(
  tree: FaceTree,
  parentId: string,
  hingeEdge: HingeEdge,
  size: { width: number; height: number },
  angle: number,
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

const hold = (faceId: string, u: number, v: number): SavedHold => ({
  id: `hold_${u}_${v}`,
  type: 'jug',
  faceId,
  u,
  v,
  size: 10,
})

describe('wallSilhouette', () => {
  it('draws a flat wall as a line from the floor up', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const { profile } = wallSilhouette(flat, [])

    expect(profile).toHaveLength(2)
    expect(profile[0].y).toBeGreaterThan(profile[1].y)
    expect(profile[0].x).toBeCloseTo(profile[1].x, 6)
  })

  it('turns a corner where the wall does', () => {
    const base = createRootFaceTree(300, 200, PANEL)
    const roof = hinge(base, base.rootId, 'bottom', { width: 300, height: 200 }, 90)

    const { profile } = wallSilhouette(roof.tree, [])

    expect(profile).toHaveLength(3)
    /* The roof runs out in depth from the top of the vertical section rather
       than continuing up it */
    expect(profile[2].x - profile[1].x).toBeCloseTo(200, 0)
    expect(profile[2].y).toBeCloseTo(profile[1].y, 0)
  })

  it('leaves an arete out, since a side view cannot show one', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const arete = hinge(base, base.rootId, 'left', { width: 100, height: 400 }, 90)

    const withArete = wallSilhouette(arete.tree, [])
    const without = wallSilhouette(base, [])

    expect(withArete.profile).toEqual(without.profile)
  })

  it('puts each hold where it sits on the wall', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const { holds } = wallSilhouette(flat, [hold(flat.rootId, 150, 100), hold(flat.rootId, 150, 300)])

    expect(holds).toHaveLength(2)
    expect(holds[0].y).toBeGreaterThan(holds[1].y)
  })

  it('skips a hold whose panel is not in the tree', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const { holds } = wallSilhouette(flat, [hold('face_gone', 150, 100)])

    expect(holds).toHaveLength(0)
  })

  it('gives a flat wall a box wide enough to draw in', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const [, , width, height] = wallSilhouette(flat, []).viewBox.split(' ').map(Number)

    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })
})

describe('silhouettePath', () => {
  it('writes a move and a line per point after it', () => {
    expect(silhouettePath([{ x: 0, y: 0 }, { x: 10, y: -20 }])).toBe('M 0 0 L 10 -20')
  })

  it('draws nothing when there is nothing', () => {
    expect(silhouettePath([])).toBe('')
  })
})
