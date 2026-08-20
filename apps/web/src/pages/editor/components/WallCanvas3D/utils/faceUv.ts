import * as THREE from 'three'
import type { FaceTree } from '@crimp-studio/wall-geometry'
import { computeFaceSheetOrigin, getFace } from '@crimp-studio/wall-geometry'
import { PANEL_WIDTH_M } from './wallTexture'

const PANEL_WIDTH_CM = PANEL_WIDTH_M * 100

export interface FaceUvTransform {
  repeat: [number, number]
  offset: [number, number]
}

/**
 * Maps a face onto the plywood tile by where it sits on the unrolled sheet, so
 * the T-nut grid and seams carry across a bend. Phase comes from the sheet
 * position, which no angle can change.
 */
/**
 * Bakes a face's phase into its own UVs, so every panel can share one texture
 * object rather than owning a clone of it.
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

export function computeFaceUvTransform(tree: FaceTree, faceId: string): FaceUvTransform {
  const face = getFace(tree, faceId)
  const { u0, v0 } = computeFaceSheetOrigin(tree, faceId)

  return {
    repeat: [face.width / PANEL_WIDTH_CM, face.height / PANEL_WIDTH_CM],
    offset: [u0 / PANEL_WIDTH_CM, v0 / PANEL_WIDTH_CM],
  }
}
