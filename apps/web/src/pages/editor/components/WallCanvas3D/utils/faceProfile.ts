import { CM_TO_M } from '../constants/editor3d'
import type { FaceTree } from './faceTree'
import { computeSurfaceArea, listFaces } from './faceTree'
import type { FaceTransforms } from './faceTransform'
import { faceLocalToWorld } from './faceTransform'

export interface WallProfile {
  /** Floor to the highest point, cm */
  heightCm: number
  /** How far the wall juts out from its base, cm */
  reachCm: number
  /** Plywood across every face, cm^2 */
  surfaceAreaCm2: number
}

/**
 * What the wall measures once it is bent. Bending preserves plywood, not
 * height, so both numbers fall out of the face corners rather than the
 * sheet size.
 */
export function computeWallProfile(tree: FaceTree, transforms: FaceTransforms): WallProfile {
  let maxY = 0
  let maxZ = 0

  for (const face of listFaces(tree)) {
    const transform = transforms[face.id]
    const corners: [number, number][] = [
      [0, 0],
      [face.width, 0],
      [0, face.height],
      [face.width, face.height],
    ]

    for (const [u, v] of corners) {
      const world = faceLocalToWorld(transform, u, v)
      maxY = Math.max(maxY, world.y)
      maxZ = Math.max(maxZ, world.z)
    }
  }

  return {
    heightCm: maxY / CM_TO_M,
    reachCm: maxZ / CM_TO_M,
    surfaceAreaCm2: computeSurfaceArea(tree),
  }
}
