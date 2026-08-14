import { describe, it, expect } from 'vitest'
import type { FaceTree, HingeEdge } from '../faceTree'
import { createRootFaceTree } from '../faceTree'
import {
  computeFaceTransforms,
  faceLocalToWorld,
  faceNormal,
  getFaceTilt,
} from '../faceTransform'

/** Splits the tree's last face, giving the new one the requested angle */
function addFace(
  tree: FaceTree,
  parentId: string,
  hinge: HingeEdge,
  size: { width: number; height: number },
  angle: number,
): { tree: FaceTree; id: string } {
  const id = `face_${Object.keys(tree.byId).length}`
  const parent = tree.byId[parentId]

  return {
    id,
    tree: {
      rootId: tree.rootId,
      byId: {
        ...tree.byId,
        [parentId]: { ...parent, childIds: [...parent.childIds, id] },
        [id]: { id, parentId, hinge, ...size, angle, childIds: [] },
      },
    },
  }
}

describe('computeFaceTransforms', () => {
  it('maps a flat wall straight through, which is what keeps holds where they were', () => {
    const tree = createRootFaceTree(400, 500)
    const transforms = computeFaceTransforms(tree)
    const world = faceLocalToWorld(transforms[tree.rootId], 250, 130)

    expect(world.x).toBeCloseTo(2.5, 5)
    expect(world.y).toBeCloseTo(1.3, 5)
    expect(world.z).toBeCloseTo(0, 5)
  })

  it('hinges a bottom child at the top of its parent and leans it out', () => {
    const base = createRootFaceTree(400, 300)
    const { tree, id } = addFace(base, base.rootId, 'bottom', { width: 400, height: 200 }, 30)

    const transform = computeFaceTransforms(tree)[id]

    expect(transform.position.y).toBeCloseTo(3, 5)
    expect(transform.position.z).toBeCloseTo(0, 5)

    const top = faceLocalToWorld(transform, 0, 200)
    expect(top.y).toBeCloseTo(3 + 2 * Math.cos(Math.PI / 6), 5)
    expect(top.z).toBeCloseTo(2 * Math.sin(Math.PI / 6), 5)
  })

  it('turns a 90 degree face into a roof', () => {
    const base = createRootFaceTree(400, 300)
    const { tree, id } = addFace(base, base.rootId, 'bottom', { width: 400, height: 200 }, 90)

    const transform = computeFaceTransforms(tree)[id]
    const normal = faceNormal(transform)

    expect(normal.y).toBeCloseTo(-1, 5)
    expect(faceLocalToWorld(transform, 0, 200).z).toBeCloseTo(2, 5)
  })

  it('leans a negative face back into a slab', () => {
    const base = createRootFaceTree(400, 300)
    const { tree, id } = addFace(base, base.rootId, 'bottom', { width: 400, height: 200 }, -15)

    expect(faceLocalToWorld(computeFaceTransforms(tree)[id], 0, 200).z).toBeLessThan(0)
  })

  it('hinges a left child at its parent right edge and wraps it toward the climber', () => {
    const base = createRootFaceTree(300, 400)
    const { tree, id } = addFace(base, base.rootId, 'left', { width: 100, height: 400 }, 90)

    const transform = computeFaceTransforms(tree)[id]

    expect(transform.position.x).toBeCloseTo(3, 5)

    /* At 90 the panel stands square to the wall, its far edge a metre out and
       its surface facing across the prow rather than at the wall */
    expect(faceLocalToWorld(transform, 100, 0).z).toBeCloseTo(1, 5)
    expect(faceNormal(transform).x).toBeCloseTo(-1, 5)
  })

  it('compounds down a chain, so a third face rides the second', () => {
    const base = createRootFaceTree(400, 200)
    const second = addFace(base, base.rootId, 'bottom', { width: 400, height: 200 }, 30)
    const third = addFace(second.tree, second.id, 'bottom', { width: 400, height: 200 }, 30)

    const transforms = computeFaceTransforms(third.tree)

    expect(getFaceTilt(transforms[second.id])).toBeCloseTo(30, 5)
    expect(getFaceTilt(transforms[third.id])).toBeCloseTo(60, 5)
  })
})

describe('getFaceTilt', () => {
  it('reads zero for a flat wall and ignores a pure yaw', () => {
    const base = createRootFaceTree(300, 400)
    const { tree, id } = addFace(base, base.rootId, 'left', { width: 100, height: 400 }, 45)

    const transforms = computeFaceTransforms(tree)

    expect(getFaceTilt(transforms[tree.rootId])).toBeCloseTo(0, 5)
    expect(getFaceTilt(transforms[id])).toBeCloseTo(0, 5)
  })
})
