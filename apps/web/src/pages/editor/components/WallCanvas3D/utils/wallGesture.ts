export type WallTapAction = 'deselectHold' | 'selectFace' | 'place'

interface WallTapOptions {
  selectedHoldId: string | null
  selectedFaceId: string | null
  /** The face under the pointer */
  hitFaceId: string
}

/**
 * One click on the wall has three jobs, so it resolves in this order: a
 * selected hold gets dismissed first, then an unfocused face gets focused,
 * and only a click inside the focused face places a hold. Focusing first is
 * what stops holds landing on a roof that is barely visible edge-on.
 */
export function resolveWallTap({
  selectedHoldId,
  selectedFaceId,
  hitFaceId,
}: WallTapOptions): WallTapAction {
  if (selectedHoldId) return 'deselectHold'
  if (selectedFaceId !== hitFaceId) return 'selectFace'
  return 'place'
}
