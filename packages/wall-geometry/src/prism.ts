import * as THREE from 'three'
import type { Point2 } from './faceTree'
import type { FaceTransform } from './faceTransform'
import { faceLocalToWorld, faceNormal } from './faceTransform'

/**
 * A solid in world space: a convex polygon with a thickness.
 *
 * Panels are plywood cut to a convex outline and holds are measured as boxes,
 * so one shape covers both; a box is the four-vertex case. What the separating
 * axis test below needs is precomputed here: the face normal, the directions
 * of the front face's edges, the normals of the sides, and every corner.
 */
export interface Prism {
  /** Unit, out of the front face */
  normal: THREE.Vector3
  /** Unit directions of the front face's edges plus the normal, parallels merged */
  edgeDirs: THREE.Vector3[]
  /** Unit normals of the side faces, parallels merged */
  sideNormals: THREE.Vector3[]
  /** Front corners then back corners */
  vertices: THREE.Vector3[]
}

/** Cross products of near-parallel edges are noise rather than an axis */
const PARALLEL_EPSILON = 1e-8

/** Two unit directions this close are the same axis */
const SAME_AXIS = 1 - 1e-6

/* Scratch, so a test inside the frame loop allocates nothing */
const crossAxis = new THREE.Vector3()

/** A box from a frame: its centre, its orientation, and its half extents */
export function boxPrism(
  center: THREE.Vector3,
  quaternion: THREE.Quaternion,
  halfExtents: THREE.Vector3,
): Prism {
  const corner = (sx: number, sy: number, sz: number) =>
    new THREE.Vector3(sx * halfExtents.x, sy * halfExtents.y, sz * halfExtents.z)
      .applyQuaternion(quaternion)
      .add(center)

  return buildPrism(
    [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)],
    [corner(-1, -1, -1), corner(1, -1, -1), corner(1, 1, -1), corner(-1, 1, -1)],
    new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion),
  )
}

/**
 * A panel as a solid. The outline is the climbing surface at z = 0 in the
 * face frame, and the plywood extrudes backwards by `depth` metres.
 */
export function polygonPrism(outline: Point2[], depth: number, transform: FaceTransform): Prism {
  return buildPrism(
    outline.map(([u, v]) => faceLocalToWorld(transform, u, v, 0)),
    outline.map(([u, v]) => faceLocalToWorld(transform, u, v, -depth)),
    faceNormal(transform),
  )
}

function buildPrism(front: THREE.Vector3[], back: THREE.Vector3[], normal: THREE.Vector3): Prism {
  const edgeDirs: THREE.Vector3[] = []
  const sideNormals: THREE.Vector3[] = []

  for (let i = 0; i < front.length; i++) {
    const dir = front[(i + 1) % front.length].clone().sub(front[i])
    if (dir.lengthSq() < PARALLEL_EPSILON) continue
    dir.normalize()

    /* The outline runs counter-clockwise seen from the front, so edge x normal
       points out of the side; the test only reads the axis, not its sign */
    addAxis(sideNormals, dir.clone().cross(normal).normalize())
    addAxis(edgeDirs, dir)
  }
  edgeDirs.push(normal)

  return { normal, edgeDirs, sideNormals, vertices: [...front, ...back] }
}

function addAxis(axes: THREE.Vector3[], axis: THREE.Vector3): void {
  if (!axes.some((known) => Math.abs(known.dot(axis)) > SAME_AXIS)) axes.push(axis)
}

/**
 * Whether two solids come within `gap` metres of each other.
 *
 * The separating-axis theorem: two convex bodies are apart exactly when some
 * axis exists on which their projections do not meet. For two prisms it is
 * enough to test each body's face normals and the cross products of their
 * edge directions. One separating axis proves they are clear, so two distant
 * panels usually exit on the first axis.
 *
 * The gap widens the first body's projection, which is exact along its face
 * axes and slightly conservative near a corner. A wall that keeps a centimetre
 * of air is the point rather than the last millimetre of it. A negative gap is
 * a tolerance: bodies that only touch are not counted as meeting.
 */
export function prismsIntersect(a: Prism, b: Prism, gap = 0): boolean {
  if (separatedAlong(a.normal, a, b, gap) || separatedAlong(b.normal, a, b, gap)) return false

  for (const axis of a.sideNormals) {
    if (separatedAlong(axis, a, b, gap)) return false
  }

  for (const axis of b.sideNormals) {
    if (separatedAlong(axis, a, b, gap)) return false
  }

  for (const own of a.edgeDirs) {
    for (const other of b.edgeDirs) {
      crossAxis.copy(own).cross(other)
      if (crossAxis.lengthSq() < PARALLEL_EPSILON) continue

      crossAxis.normalize()
      if (separatedAlong(crossAxis, a, b, gap)) return false
    }
  }

  return true
}

function separatedAlong(axis: THREE.Vector3, a: Prism, b: Prism, gap: number): boolean {
  let aMin = Infinity
  let aMax = -Infinity
  for (const vertex of a.vertices) {
    const along = vertex.dot(axis)
    if (along < aMin) aMin = along
    if (along > aMax) aMax = along
  }

  let bMin = Infinity
  let bMax = -Infinity
  for (const vertex of b.vertices) {
    const along = vertex.dot(axis)
    if (along < bMin) bMin = along
    if (along > bMax) bMax = along
  }

  return aMax + gap < bMin || bMax < aMin - gap
}
