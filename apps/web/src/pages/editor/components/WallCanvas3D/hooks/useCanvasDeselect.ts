import { useCallback } from 'react'
import { useWallStore } from '@/stores/wallStore'

/**
 * Lets go of whatever is selected when a click lands past the wall.
 *
 * A popover is DOM sitting over the canvas, and its events bubble to the same
 * element that reports a missed pointer, so a click on a swatch would otherwise
 * both set the colour and close the popover it came from. Only a click that
 * lands on the canvas itself counts as clicking empty space.
 */
export function useCanvasDeselect() {
  const { selectHold, selectFace } = useWallStore()

  return useCallback(
    (event: MouseEvent) => {
      if (!(event.target instanceof HTMLCanvasElement)) return

      selectHold(null)
      selectFace(null)
    },
    [selectHold, selectFace],
  )
}
