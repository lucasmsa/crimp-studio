import { describe, it, expect } from 'vitest'
import type { FaceTree, Point2 } from '../faceTree'
import {
  computeSurfaceArea,
  createRootFaceTree,
  edgeOf,
  getFace,
  getRootFace,
  hingeSegment,
  isConvexCCW,
  listFaces,
  minWidthAcross,
  outlineArea,
  outlineBounds,
  outlineCentroid,
  pointToChild,
  pointToParent,
  rectOutline,
  seamFrame,
  seamOrientation,
  sheetUp,
} from '../faceTree'
import { PANEL, RECT, attach, attachOutline } from './builders'

/** Splits the top off a face, as an across-cut does: the face keeps the bottom */
function stackOn(tree: FaceTree, parentId: string, height: number): { tree: FaceTree; id: string } {
  const parent = getFace(tree, parentId)
  const { uMax, vMax } = outlineBounds(parent.outline)
  const shortened: FaceTree = {
    rootId: tree.rootId,
    byId: { ...tree.byId, [parentId]: { ...parent, outline: rectOutline(uMax, vMax - height) } },
  }
  return attach(shortened, parentId, RECT.top, height)
}

const triangle: Point2[] = [
  [0, 0],
  [300, 0],
  [0, 400],
]

describe('createRootFaceTree', () => {
  it('starts as one face covering the whole sheet, hinged on the floor', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const root = getRootFace(tree)

    expect(root.parentId).toBeNull()
    expect(root.seamEdge).toBeNull()
    expect(root.angle).toBe(0)
    expect(root.outline).toEqual([
      [0, 0],
      [400, 0],
      [400, 500],
      [0, 500],
    ])
    expect(listFaces(tree)).toHaveLength(1)
  })
})

describe('computeSurfaceArea', () => {
  it('is unchanged by splitting the sheet', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const once = stackOn(tree, tree.rootId, 200)
    const twice = stackOn(once.tree, once.id, 100)

    expect(computeSurfaceArea(tree)).toBe(200000)
    expect(computeSurfaceArea(once.tree)).toBe(200000)
    expect(computeSurfaceArea(twice.tree)).toBe(200000)
  })
})

describe('outline helpers', () => {
  it('reads an edge from its start to its end, wrapping at the last', () => {
    const outline = rectOutline(300, 400)

    expect(edgeOf(outline, 0)).toEqual([[0, 0], [300, 0]])
    expect(edgeOf(outline, 3)).toEqual([[0, 400], [0, 0]])
  })

  it('measures area and centroid', () => {
    expect(outlineArea(rectOutline(300, 400))).toBe(120000)
    expect(outlineArea(triangle)).toBe(60000)
    expect(outlineCentroid(rectOutline(300, 400))).toEqual([150, 200])
    expect(outlineCentroid(triangle)).toEqual([100, 400 / 3])
  })

  it('brackets an outline', () => {
    expect(outlineBounds(triangle)).toEqual({ uMin: 0, uMax: 300, vMin: 0, vMax: 400 })
  })

  it('accepts a convex counter-clockwise outline and nothing else', () => {
    expect(isConvexCCW(rectOutline(300, 400))).toBe(true)
    expect(isConvexCCW(triangle)).toBe(true)
    expect(isConvexCCW([...triangle].reverse())).toBe(false)
    expect(
      isConvexCCW([
        [0, 0],
        [300, 0],
        [300, 400],
        [150, 100],
        [0, 400],
      ]),
    ).toBe(false)
  })

  it('finds the narrowest a piece gets, whatever its shape', () => {
    expect(minWidthAcross(rectOutline(300, 400))).toBe(300)
    expect(minWidthAcross(rectOutline(200, 10))).toBe(10)
    /* The right triangle's narrowest span is from its square corner to the
       hypotenuse: 300 * 400 / 500 */
    expect(minWidthAcross(triangle)).toBeCloseTo(240, 5)
  })
})

describe('hingeSegment', () => {
  it('runs the whole floor line for a root', () => {
    const tree = createRootFaceTree(400, 500, PANEL)

    expect(hingeSegment(getRootFace(tree))).toEqual({ from: 0, to: 400 })
  })

  it('is the part of the seam a shorter face actually meets', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const { tree, id } = attachOutline(base, base.rootId, RECT.right, [
      [200, 0],
      [400, 0],
      [400, 100],
      [200, 100],
    ])

    expect(hingeSegment(getFace(tree, id))).toEqual({ from: 200, to: 400 })
  })
})

describe('seamFrame', () => {
  it('puts a face on the top edge in the same frame as its parent, shifted up', () => {
    const root = getRootFace(createRootFaceTree(300, 400, PANEL))
    const frame = seamFrame(root, RECT.top)

    expect(frame.origin).toEqual([0, 400])
    expect(frame.u).toEqual([1, 0])
    expect(frame.v).toEqual([0, 1])
  })

  it('turns a face on the right edge a quarter turn, u running down the seam and v pointing out', () => {
    const root = getRootFace(createRootFaceTree(300, 400, PANEL))
    const frame = seamFrame(root, RECT.right)

    expect(frame.origin).toEqual([300, 400])
    expect(frame.u[0]).toBeCloseTo(0, 10)
    expect(frame.u[1]).toBeCloseTo(-1, 10)
    expect(frame.v[0]).toBeCloseTo(1, 10)
    expect(frame.v[1]).toBeCloseTo(0, 10)
  })

  it('maps points both ways and back', () => {
    const root = getRootFace(createRootFaceTree(300, 400, PANEL))
    const frame = seamFrame(root, RECT.right)

    /* 100cm down the seam from the top, 50cm out: beside the parent at height 300 */
    const inParent = pointToParent(frame, [100, 50])
    expect(inParent[0]).toBeCloseTo(350, 10)
    expect(inParent[1]).toBeCloseTo(300, 10)

    const back = pointToChild(frame, inParent)
    expect(back[0]).toBeCloseTo(100, 10)
    expect(back[1]).toBeCloseTo(50, 10)
  })
})

describe('sheetUp and seamOrientation', () => {
  it('is straight up the root and the floor is its seam', () => {
    const tree = createRootFaceTree(300, 400, PANEL)

    expect(sheetUp(tree, tree.rootId)).toEqual([0, 1])
    expect(seamOrientation(tree, tree.rootId)).toBe('floor')
  })

  it('stays up for a face above a horizontal seam', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.top, 200)

    expect(sheetUp(tree, id)).toEqual([0, 1])
    expect(seamOrientation(tree, id)).toBe('horizontal')
  })

  it('runs along u for a face beside a vertical seam, since its frame turned', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.right, 100)

    const up = sheetUp(tree, id)
    expect(up[0]).toBeCloseTo(-1, 10)
    expect(up[1]).toBeCloseTo(0, 10)
    expect(seamOrientation(tree, id)).toBe('vertical')
  })

  it('names a slanted seam for what it is', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const slanted: FaceTree = {
      ...base,
      byId: { [base.rootId]: { ...getRootFace(base), outline: triangle } },
    }
    const { tree, id } = attach(slanted, base.rootId, 1, 100)

    expect(seamOrientation(tree, id)).toBe('diagonal')
  })
})

describe('listFaces', () => {
  it('walks the whole tree from the root', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const { tree: withChild, id } = stackOn(tree, tree.rootId, 200)

    expect(listFaces(withChild).map((f) => f.id)).toEqual([tree.rootId, id])
  })
})

describe('getFace', () => {
  it('throws on an unknown face rather than returning undefined', () => {
    const tree = createRootFaceTree(400, 500, PANEL)

    expect(() => getFace(tree, 'nope')).toThrow('Unknown face: nope')
  })
})
