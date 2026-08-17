import type { EditorMode } from '@/stores/wallStore'

export type WallTapAction = 'deselectHold' | 'selectFace' | 'place'

interface WallTapOptions {
  mode: EditorMode
  selectedHoldId: string | null
  /** The face under the pointer */
  hitFaceId: string
}

/**
 * What a click on a panel does. The mode picker decides rather than the click
 * history: aiming at a panel and aiming at the wall surface are different
 * intentions, and inferring them from click order made the first click on
 * every panel do something other than what it looked like.
 */
export function resolveWallTap({ mode, selectedHoldId }: WallTapOptions): WallTapAction {
  if (mode === 'shape') return 'selectFace'
  if (selectedHoldId) return 'deselectHold'
  return 'place'
}
