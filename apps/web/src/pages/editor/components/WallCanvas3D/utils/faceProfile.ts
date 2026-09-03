import { CM_TO_M } from '@crimp-studio/wall-geometry'
import type { FaceTransforms, FaceTree } from '@crimp-studio/wall-geometry'
import { computeSurfaceArea, faceLocalToWorld, listFaces } from '@crimp-studio/wall-geometry'

export interface WallProfile {
  /** Floor to the highest point, cm */
  heightCm: number
  /** Floor space the profile occupies, cm. Panels can fold either way from the
      base, so this is the whole depth span and not the forward reach alone */
  depthCm: number
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
  let minZ = 0

  for (const face of listFaces(tree)) {
    const transform = transforms[face.id]

    for (const [u, v] of face.outline) {
      const world = faceLocalToWorld(transform, u, v)
      maxY = Math.max(maxY, world.y)
      maxZ = Math.max(maxZ, world.z)
      minZ = Math.min(minZ, world.z)
    }
  }

  return {
    heightCm: maxY / CM_TO_M,
    depthCm: (maxZ - minZ) / CM_TO_M,
    surfaceAreaCm2: computeSurfaceArea(tree),
  }
}
