import * as THREE from 'three'

/**
 * A solid in world space: a box with its own orientation.
 *
 * Panels are rectangular slabs and holds are measured as boxes, so this is the
 * one shape the wall needs. The axes are unit vectors and stay orthonormal,
 * which is what makes the separating-axis test below valid.
 */
export interface Obb {
  center: THREE.Vector3
  /** Unit axes: across the surface, up it, out of it */
  axes: [THREE.Vector3, THREE.Vector3, THREE.Vector3]
  halfExtents: THREE.Vector3
}

/** Cross products of near-parallel edges are noise rather than an axis */
const PARALLEL_EPSILON = 1e-8

/* Scratch, so a test inside the frame loop allocates nothing */
const separation = new THREE.Vector3()
const crossAxis = new THREE.Vector3()
const grownExtents = new THREE.Vector3()

/** A box from a frame: its centre, its orientation, and its half extents */
export function makeObb(
  center: THREE.Vector3,
  quaternion: THREE.Quaternion,
  halfExtents: THREE.Vector3,
): Obb {
  return {
    center,
    axes: [
      new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion),
      new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion),
      new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion),
    ],
    halfExtents,
  }
}

/**
 * Whether two solids come within `gap` metres of each other.
 *
 * The separating-axis theorem: two convex bodies are apart exactly when some
 * axis exists on which their projections do not meet. For boxes it is enough to
 * test each body's three face normals and the nine cross products of their
 * edges. One separating axis proves they are clear, so two distant panels
 * usually exit on the first axis.
 *
 * The gap is applied by growing the first body, which is exact along the face
 * axes and slightly conservative near a corner. A wall that keeps a centimetre
 * of air is the point rather than the last millimetre of it.
 */
export function obbsIntersect(a: Obb, b: Obb, gap = 0): boolean {
  separation.copy(b.center).sub(a.center)
  const aExtents = gap === 0 ? a.halfExtents : grownExtents.copy(a.halfExtents).addScalar(gap)

  for (const ownAxis of a.axes) {
    if (separates(ownAxis, a, aExtents, b)) return false
  }

  for (const otherAxis of b.axes) {
    if (separates(otherAxis, a, aExtents, b)) return false
  }

  for (const ownAxis of a.axes) {
    for (const otherAxis of b.axes) {
      crossAxis.copy(ownAxis).cross(otherAxis)
      if (crossAxis.lengthSq() < PARALLEL_EPSILON) continue

      crossAxis.normalize()
      if (separates(crossAxis, a, aExtents, b)) return false
    }
  }

  return true
}

function separates(
  onAxis: THREE.Vector3,
  a: Obb,
  aExtents: THREE.Vector3,
  b: Obb,
): boolean {
  const between = Math.abs(separation.dot(onAxis))
  return between > reach(a.axes, aExtents, onAxis) + reach(b.axes, b.halfExtents, onAxis)
}

/** How far a box reaches along an axis: its extents projected onto it */
function reach(
  axes: [THREE.Vector3, THREE.Vector3, THREE.Vector3],
  halfExtents: THREE.Vector3,
  onAxis: THREE.Vector3,
): number {
  return (
    Math.abs(axes[0].dot(onAxis)) * halfExtents.x +
    Math.abs(axes[1].dot(onAxis)) * halfExtents.y +
    Math.abs(axes[2].dot(onAxis)) * halfExtents.z
  )
}
