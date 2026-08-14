import type { CollisionBox } from '@/stores/wallStore'

/**
 * Clamps a hold's center so its measured extents stay on its face; clamping
 * the center alone lets big holds (volumes) hang past the edge. Holds wider
 * than the face get centered instead of an inverted clamp range.
 */
export function clampHoldToFace(
  u: number,
  v: number,
  box: CollisionBox | undefined,
  faceWidth: number,
  faceHeight: number,
): { u: number; v: number } {
  const halfW = Math.min(box?.halfW ?? 0, faceWidth / 2)
  const halfH = Math.min(box?.halfH ?? 0, faceHeight / 2)

  return {
    u: Math.max(halfW, Math.min(faceWidth - halfW, u)),
    v: Math.max(halfH, Math.min(faceHeight - halfH, v)),
  }
}
