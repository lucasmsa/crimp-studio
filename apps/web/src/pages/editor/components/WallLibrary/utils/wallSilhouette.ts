import type { FaceTree } from '@crimp-studio/wall-geometry'
import { CM_TO_M, computeFaceTransforms, faceLocalToWorld, listFaces } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'

export interface SilhouettePoint {
  x: number
  y: number
}

export interface SilhouettePanel {
  id: string
  /** The panel's four corners, ready for a polygon */
  corners: SilhouettePoint[]
  /** How far back it sits, for drawing the far ones first */
  depth: number
  color: string
}

export interface SilhouetteHold {
  id: string
  at: SilhouettePoint
  color: string
}

export interface WallSilhouette {
  panels: SilhouettePanel[]
  holds: SilhouetteHold[]
  /** The drawing's own frame, for anything that has to fill it */
  box: Box
  /** Ready for the svg attribute of the same name */
  viewBox: string
  /** The box's long side, so strokes and dots can be sized against the drawing */
  span: number
}

export interface Box {
  left: number
  top: number
  width: number
  height: number
}

/** Air left around the drawing, in cm */
const PADDING_CM = 25
/** A wall with no depth still needs a box with two dimensions, in cm */
const MIN_SPAN_CM = 60
/** The shape of the box the drawing is fitted into */
const BOX_ASPECT = 1.4

/**
 * How far depth pushes a point across and down the page. A wall drawn straight
 * from the side is a line, which is what a flat wall is: seen at three quarters
 * it is a surface with holds spread over it, and a roof reads as a roof.
 */
const DEPTH_X = 0.5
const DEPTH_Y = 0.32

/**
 * The wall as a small drawing, generated rather than photographed.
 *
 * A slab, a roof and a plain sheet are different shapes, and the shape plus
 * where the holds sit is what tells two saved walls apart at the size of a list
 * row, where a 3D screenshot is mud (ADR-009).
 */
export function wallSilhouette(
  faces: FaceTree,
  holds: SavedHold[],
  holdColor: (hold: SavedHold) => string,
  panelFallback = '#F6F4F0',
): WallSilhouette {
  const transforms = computeFaceTransforms(faces)

  const panels = listFaces(faces)
    .map((face) => {
      const corners = [
        [0, 0],
        [face.width, 0],
        [face.width, face.height],
        [0, face.height],
      ].map(([u, v]) => project(faceLocalToWorld(transforms[face.id], u, v)))

      return {
        id: face.id,
        corners,
        depth: depthOf(faces, transforms, face.id),
        color: face.color || panelFallback,
      }
    })
    /* Far ones first, so a roof lies over the wall it hangs off rather than
       under it */
    .sort((a, b) => b.depth - a.depth)

  const dots = holds
    .filter((hold) => transforms[hold.faceId])
    .map((hold) => ({
      id: hold.id,
      at: project(faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v)),
      color: holdColor(hold),
    }))

  const box = boxAround([...panels.flatMap((panel) => panel.corners), ...dots.map((d) => d.at)])

  return {
    panels,
    holds: dots,
    box,
    viewBox: `${round(box.left)} ${round(box.top)} ${round(box.width)} ${round(box.height)}`,
    span: Math.max(box.width, box.height),
  }
}

/** The points attribute for a panel */
export function panelPoints(corners: SilhouettePoint[]): string {
  return corners.map((corner) => `${round(corner.x)},${round(corner.y)}`).join(' ')
}

/** Three quarters on, with depth pushing a point across the page and down it */
function project(world: { x: number; y: number; z: number }): SilhouettePoint {
  const x = world.x / CM_TO_M
  const y = world.y / CM_TO_M
  const z = world.z / CM_TO_M

  return { x: x + z * DEPTH_X, y: -y + z * DEPTH_Y }
}

function depthOf(
  faces: FaceTree,
  transforms: ReturnType<typeof computeFaceTransforms>,
  faceId: string,
): number {
  const face = listFaces(faces).find((candidate) => candidate.id === faceId)!
  const middle = faceLocalToWorld(transforms[faceId], face.width / 2, face.height / 2)

  return middle.z / CM_TO_M
}

function boxAround(points: SilhouettePoint[]): Box {
  if (points.length === 0) {
    return { left: 0, top: 0, width: MIN_SPAN_CM * BOX_ASPECT, height: MIN_SPAN_CM }
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const left = Math.min(...xs) - PADDING_CM
  const top = Math.min(...ys) - PADDING_CM
  const width = Math.max(Math.max(...xs) + PADDING_CM - left, MIN_SPAN_CM)
  const height = Math.max(Math.max(...ys) + PADDING_CM - top, MIN_SPAN_CM)

  return grownToAspect({ left, top, width, height })
}

/** Widens or heightens a box around its own middle until it is worth drawing in */
function grownToAspect(box: Box): Box {
  if (box.width < box.height * BOX_ASPECT) {
    const width = box.height * BOX_ASPECT
    return { ...box, left: box.left - (width - box.width) / 2, width }
  }

  if (box.height < box.width / BOX_ASPECT) {
    const height = box.width / BOX_ASPECT
    return { ...box, top: box.top - (height - box.height) / 2, height }
  }

  return box
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
