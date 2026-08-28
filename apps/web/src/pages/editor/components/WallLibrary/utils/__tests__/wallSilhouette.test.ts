import { describe, it, expect } from 'vitest'
import type { FaceTree, HingeEdge } from '@crimp-studio/wall-geometry'
import { createRootFaceTree, getFace } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'
import { panelPoints, wallSilhouette } from '../wallSilhouette'

const PANEL = '#E8D5B7'
const holdColor = (hold: SavedHold) => hold.color ?? '#25E712'

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

const hold = (faceId: string, u: number, v: number, color?: string): SavedHold => ({
  id: `hold_${u}_${v}`,
  type: 'jug',
  faceId,
  u,
  v,
  size: 10,
  color,
})

const draw = (faces: FaceTree, holds: SavedHold[] = []) =>
  wallSilhouette(faces, holds, holdColor, '#F6F4F0')

describe('wallSilhouette', () => {
  it('draws a flat wall as a surface rather than a line', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const { panels } = draw(flat)

    expect(panels).toHaveLength(1)
    expect(panels[0].corners).toHaveLength(4)
    const xs = panels[0].corners.map((corner) => corner.x)
    const ys = panels[0].corners.map((corner) => corner.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(300, 0)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(400, 0)
  })

  it('gives every panel its own quad', () => {
    const base = createRootFaceTree(300, 200, PANEL)
    const roof = hinge(base, base.rootId, 'bottom', { width: 300, height: 200 }, 90)

    const { panels } = draw(roof.tree)

    expect(panels).toHaveLength(2)
  })

  it('pushes a roof back and across, so it reads as a roof', () => {
    const base = createRootFaceTree(300, 200, PANEL)
    const roof = hinge(base, base.rootId, 'bottom', { width: 300, height: 200 }, 90)

    const { panels } = draw(roof.tree)
    const upper = panels.find((panel) => panel.id === roof.id)!
    const lower = panels.find((panel) => panel.id === base.rootId)!

    expect(upper.depth).toBeGreaterThan(lower.depth)
    expect(Math.max(...upper.corners.map((c) => c.x))).toBeGreaterThan(
      Math.max(...lower.corners.map((c) => c.x)),
    )
  })

  it('draws the far panels first, so nearer ones sit over them', () => {
    const base = createRootFaceTree(300, 200, PANEL)
    const roof = hinge(base, base.rootId, 'bottom', { width: 300, height: 200 }, 90)

    const { panels } = draw(roof.tree)

    expect(panels[0].depth).toBeGreaterThanOrEqual(panels[1].depth)
  })

  it('shows an arete, which a flat side view could not', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const arete = hinge(base, base.rootId, 'left', { width: 100, height: 400 }, 90)

    expect(draw(arete.tree).panels).toHaveLength(2)
  })

  it('puts each hold where it sits, in the colour it is painted', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const { holds } = draw(flat, [
      hold(flat.rootId, 100, 100, '#C1121C'),
      hold(flat.rootId, 200, 300),
    ])

    expect(holds).toHaveLength(2)
    expect(holds[0].color).toBe('#C1121C')
    expect(holds[0].at.x).toBeLessThan(holds[1].at.x)
    expect(holds[0].at.y).toBeGreaterThan(holds[1].at.y)
  })

  it('skips a hold whose panel is not in the tree', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    expect(draw(flat, [hold('face_gone', 150, 100)]).holds).toHaveLength(0)
  })

  it('fits the drawing into a box worth drawing in', () => {
    const flat = createRootFaceTree(300, 400, PANEL)

    const [, , width, height] = draw(flat).viewBox.split(' ').map(Number)

    expect(width / height).toBeCloseTo(1.4, 1)
  })
})

describe('panelPoints', () => {
  it('writes a corner per point', () => {
    expect(panelPoints([{ x: 0, y: 0 }, { x: 10, y: -20 }])).toBe('0,0 10,-20')
  })
})
