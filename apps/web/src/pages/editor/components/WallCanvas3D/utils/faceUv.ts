import type { FaceTree } from './faceTree'
import { computeFaceSheetOrigin, getFace } from './faceTree'
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
export function computeFaceUvTransform(tree: FaceTree, faceId: string): FaceUvTransform {
  const face = getFace(tree, faceId)
  const { u0, v0 } = computeFaceSheetOrigin(tree, faceId)

  return {
    repeat: [face.width / PANEL_WIDTH_CM, face.height / PANEL_WIDTH_CM],
    offset: [u0 / PANEL_WIDTH_CM, v0 / PANEL_WIDTH_CM],
  }
}
