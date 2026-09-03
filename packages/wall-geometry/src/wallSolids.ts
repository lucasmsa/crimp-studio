import * as THREE from 'three'
import type { FaceTree, WallFace } from './faceTree'
import { listFaces } from './faceTree'
import type { FaceTransform, FaceTransforms } from './faceTransform'
import { computeFaceTransforms } from './faceTransform'
import type { Prism } from './prism'
import { boxPrism, polygonPrism } from './prism'
import { CM_TO_M, WALL_DEPTH } from './units'

/** A hold's footprint on its panel, in cm, plus how far it stands off it */
export interface HoldBox {
  halfW: number
  halfH: number
  /** How far the hold protrudes from the surface, cm */
  depth: number
}

/** What the geometry layer needs to know about a hold. The store's holds fit this */
export interface HoldPlacement {
  id: string
  faceId: string
  u: number
  v: number
  collisionBox?: HoldBox
}

/** A solid and what it belongs to, so a refusal can point at the thing in the way */
export interface WallSolid {
  solid: Prism
  kind: 'panel' | 'hold' | 'floor'
  /** Face id for a panel, hold id for a hold, undefined for the floor */
  id?: string
  /** The face a hold is bolted to, so its own panel is not a collision */
  faceId?: string
}

/** Until a hold reports its measured box, it reserves this much plywood */
const FALLBACK_BOX: HoldBox = { halfW: 15, halfH: 15, depth: 10 }

/** How far off the surface a hold's solid begins, in metres */
const SURFACE_CLEARANCE = 0.001

/**
 * The floor, as a slab wide enough that no wall reaches past it. Its top face is
 * the plane the root panel stands on.
 */
const FLOOR_HALF_SPAN = 50
const FLOOR_HALF_THICKNESS = 0.5

/**
 * A panel as a solid: its outline at the surface, extruded backwards through
 * the plywood's thickness.
 */
export function panelSolid(face: WallFace, transform: FaceTransform): WallSolid {
  return {
    solid: polygonPrism(face.outline, WALL_DEPTH, transform),
    kind: 'panel',
    id: face.id,
  }
}

/**
 * A hold as a solid: the part of it that stands out of the wall.
 *
 * It starts a hair in front of the surface rather than at it. A hold is bolted
 * flush, so its solid and the plywood of a panel flush with its own would
 * otherwise touch along a seam and read as a collision on a perfectly flat wall.
 * The couple of millimetres it is sunk into its own panel to stop z-fighting are
 * not part of its volume either.
 *
 * The box is not turned with the hold's rotation: the stored extents are already
 * measured at that rotation, so turning it here would count it twice.
 */
export function holdSolid(hold: HoldPlacement, transform: FaceTransform): WallSolid {
  const box = hold.collisionBox ?? FALLBACK_BOX
  const depthM = box.depth * CM_TO_M
  const standoff = SURFACE_CLEARANCE + depthM / 2

  const center = new THREE.Vector3(hold.u * CM_TO_M, hold.v * CM_TO_M, standoff)
    .applyQuaternion(transform.quaternion)
    .add(transform.position)

  return {
    solid: boxPrism(
      center,
      transform.quaternion,
      new THREE.Vector3(box.halfW * CM_TO_M, box.halfH * CM_TO_M, depthM / 2),
    ),
    kind: 'hold',
    id: hold.id,
    faceId: hold.faceId,
  }
}

export function floorSolid(): WallSolid {
  return {
    solid: boxPrism(
      new THREE.Vector3(0, -FLOOR_HALF_THICKNESS, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(FLOOR_HALF_SPAN, FLOOR_HALF_THICKNESS, FLOOR_HALF_SPAN),
    ),
    kind: 'floor',
  }
}

/** Every solid the wall is made of, in one world space */
export function collectWallSolids(
  faces: FaceTree,
  holds: HoldPlacement[],
  transforms: FaceTransforms = computeFaceTransforms(faces),
): WallSolid[] {
  const solids = listFaces(faces).map((face) => panelSolid(face, transforms[face.id]))

  for (const hold of holds) {
    const transform = transforms[hold.faceId]
    if (transform) solids.push(holdSolid(hold, transform))
  }

  solids.push(floorSolid())

  return solids
}
