import { describe, expect, it } from 'vitest'
import { createRootFaceTree } from '@crimp-studio/wall-geometry'
import type { Hold, Wall } from '@/stores/wallStore'
import { selectionAfterStep } from '../selectionAfterStep'

function wall(holds: Hold[] = []): Wall {
  return {
    id: 'w',
    name: 'Wall',
    width: 300,
    height: 400,
    faces: createRootFaceTree(300, 400, '#E8D5B7'),
    holds,
  }
}

function hold(id: string, faceId: string, u = 100, v = 100): Hold {
  return { id, type: 'jug', faceId, u, v, size: 10 }
}

describe('selectionAfterStep', () => {
  it('selects the one hold that moved', () => {
    const before = wall()
    const a = hold('a', before.faces.rootId)
    const moved = { ...a, u: 150 }
    expect(selectionAfterStep({ ...before, holds: [a] }, { ...before, holds: [moved] })).toEqual({
      holdId: 'a',
    })
  })

  it('selects the one hold that appeared', () => {
    const before = wall()
    const a = hold('a', before.faces.rootId)
    expect(selectionAfterStep(before, { ...before, holds: [a] })).toEqual({ holdId: 'a' })
  })

  it('selects nothing when the one hold vanished', () => {
    const before = wall()
    const a = hold('a', before.faces.rootId)
    expect(selectionAfterStep({ ...before, holds: [a] }, before)).toBeNull()
  })

  it('selects nothing when several holds changed', () => {
    const before = wall()
    const a = hold('a', before.faces.rootId)
    const b = hold('b', before.faces.rootId, 200, 200)
    const after = { ...before, holds: [{ ...a, u: 120 }, { ...b, u: 220 }] }
    expect(selectionAfterStep({ ...before, holds: [a, b] }, after)).toBeNull()
  })

  it('leaves an unchanged hold alone: shared objects are not a change', () => {
    const before = wall()
    const a = hold('a', before.faces.rootId)
    const b = hold('b', before.faces.rootId, 200, 200)
    const after = { ...before, holds: [a, { ...b, u: 220 }] }
    expect(selectionAfterStep({ ...before, holds: [a, b] }, after)).toEqual({ holdId: 'b' })
  })

  it('selects the one face that changed when no hold did', () => {
    const before = wall()
    const root = before.faces.byId[before.faces.rootId]
    const after: Wall = {
      ...before,
      faces: { ...before.faces, byId: { [root.id]: { ...root, angle: 20 } } },
    }
    expect(selectionAfterStep(before, after)).toEqual({ faceId: root.id })
  })

  it('selects nothing when a cut touched two faces', () => {
    const before = wall()
    const root = before.faces.byId[before.faces.rootId]
    const child = { ...root, id: 'child', parentId: root.id, hinge: 'bottom' as const, height: 200 }
    const after: Wall = {
      ...before,
      faces: {
        ...before.faces,
        byId: {
          [root.id]: { ...root, height: 200, childIds: ['child'] },
          child,
        },
      },
    }
    expect(selectionAfterStep(before, after)).toBeNull()
  })

  it('prefers the hold when both a hold and a face changed', () => {
    const before = wall()
    const root = before.faces.byId[before.faces.rootId]
    const a = hold('a', root.id)
    const after: Wall = {
      ...before,
      holds: [{ ...a, v: 300 }],
      faces: { ...before.faces, byId: { [root.id]: { ...root, angle: 20 } } },
    }
    expect(selectionAfterStep({ ...before, holds: [a] }, after)).toEqual({ holdId: 'a' })
  })

  it('selects nothing when nothing changed', () => {
    const before = wall()
    expect(selectionAfterStep(before, before)).toBeNull()
  })
})
