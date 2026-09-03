import type { EditorMode } from '@/stores/wallStore'

export type WallTapAction = 'deselectHold' | 'selectFace' | 'place'

interface WallTapOptions {
  mode: EditorMode
  selectedHoldId: string | null
  /** The face under the pointer */
  hitFaceId: string
}

/**
 * What a tap on a panel does. The mode picker decides rather than the click
 * history: aiming at a panel and aiming at the wall surface are different
 * intentions, and inferring them from click order made the first click on
 * every panel do something other than what it looked like. With a blade or
 * trim armed a tap that drew no seam still picks the panel, so the bend
 * controls stay one tap away.
 */
export function resolveWallTap({ mode, selectedHoldId }: WallTapOptions): WallTapAction {
  if (mode !== 'holds') return 'selectFace'
  if (selectedHoldId) return 'deselectHold'
  return 'place'
}
