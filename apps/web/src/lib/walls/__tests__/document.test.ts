import { describe, it, expect } from 'vitest'
import { createRootFaceTree } from '@crimp-studio/wall-geometry'
import type { Wall } from '@/stores/wallStore'
import { measureHoldFootprint } from '@/pages/editor/components/WallCanvas3D/utils/holdFootprint'
import {
  WALL_DOCUMENT_VERSION,
  fromDocument,
  parseDocument,
  summarise,
  toDocument,
} from '../document'

const PANEL = '#E8D5B7'
const SAVED_AT = '2026-08-28T12:00:00.000Z'

function wall(): Wall {
  const faces = createRootFaceTree(300, 400, PANEL)
  return {
    id: 'wall_1',
    name: 'My Wall',
    width: 300,
    height: 400,
    faces,
    holds: [
      {
        id: 'hold_1',
        type: 'jug',
        faceId: faces.rootId,
        u: 100,
        v: 250,
        size: 10,
        variant: 'ch1_xs',
        rotation: 20,
        color: '#C1121C',
        collisionBox: { halfW: 1, halfH: 2, depth: 3 },
      },
    ],
  }
}

const roundTrip = (source = wall()) =>
  parseDocument(JSON.stringify(toDocument(source, 'Cave Project', SAVED_AT)))

describe('toDocument', () => {
  it('writes down what was chosen', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)

    expect(document).toMatchObject({
      version: WALL_DOCUMENT_VERSION,
      name: 'Cave Project',
      savedAt: SAVED_AT,
      wall: { width: 300, height: 400 },
    })
    expect(document.wall.holds[0]).toMatchObject({
      type: 'jug',
      u: 100,
      v: 250,
      size: 10,
      variant: 'ch1_xs',
      rotation: 20,
      color: '#C1121C',
    })
  })

  it('leaves the measured box behind', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)

    expect(document.wall.holds[0]).not.toHaveProperty('collisionBox')
  })
})

describe('fromDocument', () => {
  it('measures every hold again for the models the app has now', () => {
    const parsed = roundTrip()
    if (!parsed.ok) throw new Error(parsed.reason)

    const restored = fromDocument(parsed.document)

    expect(restored.holds[0].collisionBox).toEqual(
      measureHoldFootprint('jug', 'ch1_xs', 10, 20),
    )
  })

  it('brings back the wall it was given', () => {
    const source = wall()
    const parsed = roundTrip(source)
    if (!parsed.ok) throw new Error(parsed.reason)

    const restored = fromDocument(parsed.document)

    expect(restored.faces).toEqual(source.faces)
    expect(restored.holds[0]).toMatchObject({ u: 100, v: 250, color: '#C1121C' })
  })
})

describe('parseDocument', () => {
  it('refuses something that is not JSON', () => {
    expect(parseDocument('{ not json')).toEqual({ ok: false, reason: 'unreadable' })
  })

  it('refuses JSON that is not a wall', () => {
    expect(parseDocument('{"hello":"world"}')).toEqual({ ok: false, reason: 'not-a-wall' })
  })

  it('refuses a wall written by a newer editor', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)
    const ahead = JSON.stringify({ ...document, version: WALL_DOCUMENT_VERSION + 1 })

    expect(parseDocument(ahead)).toEqual({ ok: false, reason: 'future-version' })
  })

  it('refuses a face tree whose root is not in it', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)
    document.wall.faces = { ...document.wall.faces, rootId: 'face_missing' }

    expect(parseDocument(JSON.stringify(document))).toEqual({
      ok: false,
      reason: 'not-a-wall',
    })
  })

  it('refuses a face hinged onto a parent that is not there', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)
    const root = document.wall.faces.byId[document.wall.faces.rootId]
    document.wall.faces.byId.orphan = { ...root, id: 'orphan', parentId: 'gone' }

    expect(parseDocument(JSON.stringify(document))).toEqual({
      ok: false,
      reason: 'not-a-wall',
    })
  })

  it('refuses a hold of a type the editor does not have', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)
    const holds = document.wall.holds as unknown as Record<string, unknown>[]
    holds[0].type = 'ladder'

    expect(parseDocument(JSON.stringify(document))).toEqual({
      ok: false,
      reason: 'not-a-wall',
    })
  })

  it('takes a wall it wrote itself', () => {
    const parsed = roundTrip()

    expect(parsed.ok).toBe(true)
  })
})

describe('summarise', () => {
  it('counts what the library row shows', () => {
    const document = toDocument(wall(), 'Cave Project', SAVED_AT)

    expect(summarise(document)).toEqual({
      id: 'wall_1',
      name: 'Cave Project',
      savedAt: SAVED_AT,
      faceCount: 1,
      holdCount: 1,
    })
  })
})
