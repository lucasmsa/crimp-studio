import type { CollisionBox } from '@/stores/wallStore'

/**
 * Clamps a hold's center so its measured extents stay on the wall; clamping
 * the center alone lets big holds (volumes) hang past the edge. Holds wider
 * than the wall get centered instead of an inverted clamp range.
 */
export function clampHoldToWall(
  x: number,
  y: number,
  box: CollisionBox | undefined,
  wallWidth: number,
  wallHeight: number,
): { x: number; y: number } {
  const halfW = Math.min(box?.halfW ?? 0, wallWidth / 2)
  const halfH = Math.min(box?.halfH ?? 0, wallHeight / 2)

  return {
    x: Math.max(halfW, Math.min(wallWidth - halfW, x)),
    y: Math.max(halfH, Math.min(wallHeight - halfH, y)),
  }
}
