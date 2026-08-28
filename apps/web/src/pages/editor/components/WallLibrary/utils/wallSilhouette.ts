import type { FaceTree } from '@crimp-studio/wall-geometry'
import { CM_TO_M, computeFaceTransforms, faceLocalToWorld, getFace } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'

export interface SilhouettePoint {
  x: number
  y: number
}

export interface WallSilhouette {
  /** The profile from the floor up, as points in the drawing's own frame */
  profile: SilhouettePoint[]
  /** Where the holds sit along it */
  holds: SilhouettePoint[]
  /** Ready for the svg attribute of the same name */
  viewBox: string
  /** The box's long side, so strokes and dots can be sized against the drawing */
  span: number
}

/** Air left around the drawing, in cm */
const PADDING_CM = 20
/** A flat wall has no depth at all, so the box needs a floor of its own, in cm */
const MIN_SPAN_CM = 60
/**
 * The shape of the box the drawing is fitted into. A flat wall is a line 4m
 * tall and nothing wide, and fitting that to a row-sized box leaves a sliver a
 * few pixels across, so the box is widened to something a picture can live in.
 */
const BOX_ASPECT = 1.4

/**
 * The wall seen from the side, drawn rather than photographed.
 *
 * A slab, a roof and a plain vertical sheet are different shapes, and the shape
 * is what tells two saved walls apart at the size of a list row, where a 3D
 * screenshot is mud (ADR-009). Aretes do not show: they hinge sideways, so from
 * the side they sit exactly behind the panel they hinge from.
 *
 * The drawing's y grows downward, which is what SVG wants, so the wall is
 * flipped once here rather than in every consumer.
 */
export function wallSilhouette(faces: FaceTree, holds: SavedHold[]): WallSilhouette {
  const transforms = computeFaceTransforms(faces)

  const profile = verticalChain(faces).flatMap((faceId, index) => {
    const transform = transforms[faceId]
    const face = getFace(faces, faceId)
    const bottom = point(faceLocalToWorld(transform, 0, 0))
    const top = point(faceLocalToWorld(transform, 0, face.height))

    /* Each face shares its bottom edge with the one below, so only the first
       contributes both ends */
    return index === 0 ? [bottom, top] : [top]
  })

  const dots = holds
    .filter((hold) => transforms[hold.faceId])
    .map((hold) => point(faceLocalToWorld(transforms[hold.faceId], hold.u, hold.v)))

  const box = boxAround([...profile, ...dots])

  return {
    profile,
    holds: dots,
    viewBox: `${round(box.left)} ${round(box.top)} ${round(box.width)} ${round(box.height)}`,
    span: Math.max(box.width, box.height),
  }
}

/** The path attribute for a profile, or empty when there is nothing to draw */
export function silhouettePath(profile: SilhouettePoint[]): string {
  if (profile.length === 0) return ''

  const [start, ...rest] = profile
  return `M ${round(start.x)} ${round(start.y)}` + rest.map((p) => ` L ${round(p.x)} ${round(p.y)}`).join('')
}

/**
 * The faces stacked up the wall: the root and whatever hinges off the top of
 * it, one after another. A left hinge branches across the width instead, and a
 * side view has nothing to say about it.
 */
function verticalChain(faces: FaceTree): string[] {
  const chain = [faces.rootId]

  for (;;) {
    const face = getFace(faces, chain[chain.length - 1])
    const next = face.childIds.find((id) => getFace(faces, id).hinge === 'bottom')
    if (!next) return chain
    chain.push(next)
  }
}

function point(world: { y: number; z: number }): SilhouettePoint {
  return { x: world.z / CM_TO_M, y: -world.y / CM_TO_M }
}

interface Box {
  left: number
  top: number
  width: number
  height: number
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
