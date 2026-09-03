import * as THREE from 'three'
import { PANEL_WIDTH_M } from './wallTexture'

export interface FaceUvTransform {
  repeat: [number, number]
  offset: [number, number]
}

/**
 * The plywood tile, one per panel width, with no phase. A panel's geometry
 * carries metre-space UVs, so this turns metres into tiles. Each facet takes
 * its grain from its own frame, which is how a facet wall is skinned: across a
 * seam the grain changes direction, and a shared phase would have nothing to
 * mean (ADR-010).
 */
export const PLYWOOD_UV: FaceUvTransform = {
  repeat: [1 / PANEL_WIDTH_M, 1 / PANEL_WIDTH_M],
  offset: [0, 0],
}

/**
 * Bakes a tiling into a geometry's own UVs, so every panel can share one
 * texture object rather than owning a clone of it.
 */
export function applyFaceUvTransform(
  geometry: THREE.BufferGeometry,
  { repeat, offset }: FaceUvTransform,
): void {
  const uv = geometry.getAttribute('uv')

  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * repeat[0] + offset[0], uv.getY(i) * repeat[1] + offset[1])
  }

  uv.needsUpdate = true
}
