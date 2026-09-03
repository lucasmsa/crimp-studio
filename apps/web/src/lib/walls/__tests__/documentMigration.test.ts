import { describe, expect, it } from 'vitest'
import { computeFaceTransforms, faceLocalToWorld, rectOutline } from '@crimp-studio/wall-geometry'
import { parseDocument, WALL_DOCUMENT_VERSION } from '../document'

const PANEL = '#E8D5B7'

/**
 * A wall as version 1 wrote it: rectangles with a named hinge. The root, a
 * panel on top of it, a side panel hinged on its right edge that a later cut
 * left shorter than that edge, and a panel on top of the side panel.
 */
function versionOne(angles: { top?: number; side?: number } = {}) {
  return JSON.stringify({
    version: 1,
    id: 'w1',
    name: 'Old wall',
    savedAt: '2026-08-30T00:00:00.000Z',
    wall: {
      width: 400,
      height: 500,
      faces: {
        rootId: 'root',
        byId: {
          root: {
            id: 'root',
            parentId: null,
            hinge: null,
            width: 400,
            height: 500,
            angle: 0,
            color: PANEL,
            childIds: ['top', 'side'],
          },
          top: {
            id: 'top',
            parentId: 'root',
            hinge: 'bottom',
            width: 400,
            height: 200,
            angle: angles.top ?? 0,
            color: PANEL,
            childIds: [],
          },
          side: {
            id: 'side',
            parentId: 'root',
            hinge: 'left',
            width: 100,
            height: 300,
            angle: angles.side ?? 0,
            color: '#5A6B78',
            childIds: ['wing'],
          },
          wing: {
            id: 'wing',
            parentId: 'side',
            hinge: 'bottom',
            width: 100,
            height: 200,
            angle: 0,
            color: PANEL,
            childIds: [],
          },
        },
      },
      holds: [
        { id: 'onTop', type: 'jug', faceId: 'top', u: 100, v: 50, size: 10, rotation: 20 },
        { id: 'onSide', type: 'crimp', faceId: 'side', u: 50, v: 100, size: 10 },
        { id: 'onWing', type: 'sloper', faceId: 'wing', u: 30, v: 40, size: 10, rotation: 10 },
      ],
    },
  })
}

function migrated(angles?: { top?: number; side?: number }) {
  const result = parseDocument(versionOne(angles))
  if (!result.ok) throw new Error(`refused: ${result.reason}`)
  return result.document
}

describe('parseDocument, given a version 1 wall', () => {
  it('brings it up to the current version', () => {
    expect(migrated().version).toBe(WALL_DOCUMENT_VERSION)
  })

  it('turns each rectangle into its corners and names the parent edge it hinges on', () => {
    const { byId } = migrated().wall.faces

    expect(byId.root.outline).toEqual(rectOutline(400, 500))
    expect(byId.root.seamEdge).toBeNull()

    expect(byId.top.outline).toEqual(rectOutline(400, 200))
    expect(byId.top.seamEdge).toBe(2)

    /* The side panel's frame now runs down the vertical seam from the top, so
       its 300cm of height are the u range from 200 to 500 */
    expect(byId.side.seamEdge).toBe(1)
    expect(byId.side.outline).toEqual([
      [500, 0],
      [500, 100],
      [200, 100],
      [200, 0],
    ])
    expect(byId.side.color).toBe('#5A6B78')

    expect(byId.wing.parentId).toBe('side')
    expect(byId.wing.seamEdge).toBe(2)
    expect(byId.wing.outline).toEqual(rectOutline(100, 200))
  })

  it('keeps every angle', () => {
    const { byId } = migrated({ top: 30, side: 45 }).wall.faces

    expect(byId.top.angle).toBe(30)
    expect(byId.side.angle).toBe(45)
  })

  it('re-expresses holds on a turned frame and turns their rotation with it', () => {
    const holds = Object.fromEntries(migrated().wall.holds.map((hold) => [hold.id, hold]))

    expect(holds.onTop).toMatchObject({ u: 100, v: 50, rotation: 20 })
    expect(holds.onSide).toMatchObject({ u: 400, v: 50, rotation: 90 })
    /* Two quarter turns cancel: the wing's frame ends up where it started */
    expect(holds.onWing).toMatchObject({ u: 30, v: 40, rotation: 10 })
  })

  it('leaves every hold at the same point on the wall, which is the invariant that matters', () => {
    const document = migrated()
    const transforms = computeFaceTransforms(document.wall.faces)
    const world = (id: string) => {
      const hold = document.wall.holds.find((h) => h.id === id)!
      return faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v)
    }

    /* Where version 1 put them: top at (100, 500 + 50), side at (400 + 50, 100),
       wing at (400 + 30, 300 + 40), all in cm on a flat wall */
    expect(world('onTop').x).toBeCloseTo(1, 6)
    expect(world('onTop').y).toBeCloseTo(5.5, 6)
    expect(world('onSide').x).toBeCloseTo(4.5, 6)
    expect(world('onSide').y).toBeCloseTo(1, 6)
    expect(world('onWing').x).toBeCloseTo(4.3, 6)
    expect(world('onWing').y).toBeCloseTo(3.4, 6)
  })
})

describe('parseDocument, given a version 2 wall', () => {
  it('refuses a face whose seam names an edge its parent does not have', () => {
    const document = migrated()
    document.wall.faces.byId.top = { ...document.wall.faces.byId.top, seamEdge: 7 }

    expect(parseDocument(JSON.stringify(document))).toEqual({ ok: false, reason: 'not-a-wall' })
  })

  it('refuses a face with fewer than three corners', () => {
    const document = migrated()
    document.wall.faces.byId.top = {
      ...document.wall.faces.byId.top,
      outline: [
        [0, 0],
        [400, 0],
      ],
    }

    expect(parseDocument(JSON.stringify(document))).toEqual({ ok: false, reason: 'not-a-wall' })
  })

  it('reads back what it migrated, unchanged', () => {
    const document = migrated()

    expect(parseDocument(JSON.stringify(document))).toEqual({ ok: true, document })
  })
})
