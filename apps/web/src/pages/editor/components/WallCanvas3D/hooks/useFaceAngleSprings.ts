import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { FaceTree } from '../utils/faceTree'
import { listFaces } from '../utils/faceTree'
import { computeFaceTransforms } from '../utils/faceTransform'

/** Stiff enough to feel like plywood swinging, damped enough not to wobble */
const STIFFNESS = 90
const DAMPING = 18
/** Below this the spring has arrived and the per-frame rebuild can stop */
const REST_EPSILON = 0.01

interface AngleSpring {
  value: number
  velocity: number
}

/**
 * Animates a bend by springing the angles and rebuilding the tree from them
 * every frame, then writing the result straight onto the face groups.
 *
 * Springing the angles rather than the finished transforms is what keeps the
 * wall watertight: a face's position comes from its parent's rotation, so
 * easing positions and orientations separately walks each origin off its hinge
 * and cracks the seam open mid-animation. Every frame here is a valid tree.
 *
 * The groups are driven imperatively for the same reason the transforms are
 * not React state: a re-render between frames would snap the wall to its
 * settled shape.
 */
export function useFaceAngleSprings(
  faces: FaceTree,
  faceGroups: React.RefObject<Map<string, THREE.Group>>,
) {
  const springs = useRef(new Map<string, AngleSpring>())
  const writtenFaces = useRef<FaceTree | null>(null)

  const targets = useMemo(
    () => new Map(listFaces(faces).map((face) => [face.id, face.angle])),
    [faces],
  )

  useFrame((_, delta) => {
    /* A long frame (tab wake-up, heavy load) would overshoot the spring */
    const step = Math.min(delta, 1 / 30)
    let moving = false

    for (const [faceId, target] of targets) {
      const spring = springs.current.get(faceId) ?? { value: target, velocity: 0 }
      const offset = target - spring.value

      if (Math.abs(offset) < REST_EPSILON && Math.abs(spring.velocity) < REST_EPSILON) {
        spring.value = target
        spring.velocity = 0
      } else {
        spring.velocity += (offset * STIFFNESS - spring.velocity * DAMPING) * step
        spring.value += spring.velocity * step
        moving = true
      }

      springs.current.set(faceId, spring)
    }

    for (const faceId of springs.current.keys()) {
      if (!targets.has(faceId)) springs.current.delete(faceId)
    }

    /* A new tree (a cut, a merge, a fresh angle) has to be written once even
       when no spring is travelling, or the new face renders at the origin */
    const treeChanged = writtenFaces.current !== faces
    if (!moving && !treeChanged) return
    writtenFaces.current = faces

    const transforms = computeFaceTransforms(withSprungAngles(faces, springs.current))

    for (const [faceId, group] of faceGroups.current) {
      const transform = transforms[faceId]
      if (!transform) continue
      group.position.copy(transform.position)
      group.quaternion.copy(transform.quaternion)
    }
  })
}

function withSprungAngles(faces: FaceTree, springs: Map<string, AngleSpring>): FaceTree {
  const byId = { ...faces.byId }

  for (const [faceId, spring] of springs) {
    if (byId[faceId]) byId[faceId] = { ...byId[faceId], angle: spring.value }
  }

  return { rootId: faces.rootId, byId }
}
