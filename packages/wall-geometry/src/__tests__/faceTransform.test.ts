import { describe, it, expect } from 'vitest'
import { createRootFaceTree } from '../faceTree'
import {
  computeFaceTransforms,
  faceLocalToWorld,
  faceNormal,
  faceSteepness,
} from '../faceTransform'
import { PANEL, RECT, attach } from './builders'

describe('computeFaceTransforms', () => {
  it('maps a flat wall straight through, which is what keeps holds where they were', () => {
    const tree = createRootFaceTree(400, 500, PANEL)
    const transforms = computeFaceTransforms(tree)
    const world = faceLocalToWorld(transforms[tree.rootId], 250, 130)

    expect(world.x).toBeCloseTo(2.5, 5)
    expect(world.y).toBeCloseTo(1.3, 5)
    expect(world.z).toBeCloseTo(0, 5)
  })

  it('hinges a face on the top of its parent and leans it out', () => {
    const base = createRootFaceTree(400, 300, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.top, 200, 30)

    const transform = computeFaceTransforms(tree)[id]

    expect(transform.position.y).toBeCloseTo(3, 5)
    expect(transform.position.z).toBeCloseTo(0, 5)

    const top = faceLocalToWorld(transform, 0, 200)
    expect(top.y).toBeCloseTo(3 + 2 * Math.cos(Math.PI / 6), 5)
    expect(top.z).toBeCloseTo(2 * Math.sin(Math.PI / 6), 5)
  })

  it('turns a 90 degree face into a roof', () => {
    const base = createRootFaceTree(400, 300, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.top, 200, 90)

    const transform = computeFaceTransforms(tree)[id]
    const normal = faceNormal(transform)

    expect(normal.y).toBeCloseTo(-1, 5)
    expect(faceLocalToWorld(transform, 0, 200).z).toBeCloseTo(2, 5)
  })

  it('leans a negative face back into a slab', () => {
    const base = createRootFaceTree(400, 300, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.top, 200, -15)

    expect(faceLocalToWorld(computeFaceTransforms(tree)[id], 0, 200).z).toBeLessThan(0)
  })

  it('hinges a face on its parent right edge and wraps it toward the climber', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.right, 100, 90)

    const transform = computeFaceTransforms(tree)[id]

    /* The frame starts at the top of the seam and runs down it */
    expect(transform.position.x).toBeCloseTo(3, 5)
    expect(transform.position.y).toBeCloseTo(4, 5)

    /* At 90 the panel stands square to the wall: the corner 400cm down the seam
       and 100cm out is on the floor, a metre out, and the surface faces across
       the prow rather than at the wall */
    const outerFoot = faceLocalToWorld(transform, 400, 100)
    expect(outerFoot.x).toBeCloseTo(3, 5)
    expect(outerFoot.y).toBeCloseTo(0, 5)
    expect(outerFoot.z).toBeCloseTo(1, 5)
    expect(faceNormal(transform).x).toBeCloseTo(-1, 5)
  })

  it('compounds down a chain, so a third face rides the second', () => {
    const base = createRootFaceTree(400, 200, PANEL)
    const second = attach(base, base.rootId, RECT.top, 200, 30)
    const third = attach(second.tree, second.id, RECT.top, 200, 30)

    const transforms = computeFaceTransforms(third.tree)

    expect(faceSteepness(transforms[second.id])).toBeCloseTo(30, 5)
    expect(faceSteepness(transforms[third.id])).toBeCloseTo(60, 5)
  })
})

describe('faceSteepness', () => {
  it('reads zero for a flat wall and ignores a pure yaw', () => {
    const base = createRootFaceTree(300, 400, PANEL)
    const { tree, id } = attach(base, base.rootId, RECT.right, 100, 45)

    const transforms = computeFaceTransforms(tree)

    expect(faceSteepness(transforms[tree.rootId])).toBeCloseTo(0, 5)
    expect(faceSteepness(transforms[id])).toBeCloseTo(0, 5)
  })

  it('reads a slab as negative and a roof as 90', () => {
    const base = createRootFaceTree(400, 300, PANEL)
    const slab = attach(base, base.rootId, RECT.top, 200, -15)
    const roof = attach(base, base.rootId, RECT.top, 200, 90)

    expect(faceSteepness(computeFaceTransforms(slab.tree)[slab.id])).toBeCloseTo(-15, 5)
    expect(faceSteepness(computeFaceTransforms(roof.tree)[roof.id])).toBeCloseTo(90, 5)
  })
})
