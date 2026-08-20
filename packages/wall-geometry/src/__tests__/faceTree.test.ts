import { describe, it, expect } from 'vitest'
import type { FaceTree } from '../faceTree'
import {
  computeFaceSheetOrigin,
  computeSurfaceArea,
  createRootFaceTree,
  getFace,
  getRootFace,
  listFaces,
} from '../faceTree'

const PANEL = '#E8D5B7'

/** Stacks a face on top of the given parent, as an across-cut would */
function stackOn(tree: FaceTree, parentId: string, height: number): { tree: FaceTree; id: string } {
  const parent = getFace(tree, parentId)
  const id = `face_${Object.keys(tree.byId).length}`

  return {
    id,
    tree: {
      rootId: tree.rootId,
      byId: {
        ...tree.byId,
        [parentId]: { ...parent, height: parent.height - height, childIds: [...parent.childIds, id] },
        [id]: {
          id,
          parentId,
          hinge: 'bottom',
          width: parent.width,
          height,
          angle: 0,
          color: PANEL,
          childIds: [],
        },
      },
    },
  }
}

describe('createRootFaceTree', () => {
  it('starts as one face covering the whole sheet', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const root = getRootFace(tree)

    expect(root.parentId).toBeNull()
    expect(root.hinge).toBeNull()
    expect(root.angle).toBe(0)
    expect(root.width).toBe(400)
    expect(root.height).toBe(500)
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

describe('computeFaceSheetOrigin', () => {
  it('measures a face position on the unrolled sheet, not in the world', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const middle = stackOn(tree, tree.rootId, 200)
    const top = stackOn(middle.tree, middle.id, 100)

    expect(computeFaceSheetOrigin(top.tree, top.tree.rootId)).toEqual({ u0: 0, v0: 0 })
    expect(computeFaceSheetOrigin(top.tree, middle.id)).toEqual({ u0: 0, v0: 300 })
    expect(computeFaceSheetOrigin(top.tree, top.id)).toEqual({ u0: 0, v0: 400 })
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
