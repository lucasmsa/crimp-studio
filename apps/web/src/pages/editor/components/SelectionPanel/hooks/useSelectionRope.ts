import { useEffect, useRef } from 'react'
import { selectionAnchor } from '../../WallCanvas3D/utils/selectionAnchor'
import type { RopePoint } from '../utils/rope'
import { createRope, ropePath, stepRope } from '../utils/rope'

/**
 * Runs the rope between the pinned card and whatever is selected.
 *
 * The path is written straight to the SVG element each frame rather than held in
 * state: it moves whenever the camera does, and a re-render per frame would cost
 * more than the wall does. The card end is measured from the DOM, so the rope
 * stays attached however the card is laid out.
 */
export function useSelectionRope(
  pathRef: React.RefObject<SVGPathElement | null>,
  cardRef: React.RefObject<HTMLElement | null>,
  overlayRef: React.RefObject<HTMLElement | null>,
) {
  const rope = useRef<RopePoint[] | null>(null)

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const delta = (now - last) / 1000
      last = now

      const path = pathRef.current
      if (!path) return

      const card = cardRef.current
      const overlay = overlayRef.current

      /* No card means nothing is selected, and a cord to nothing hangs there
         looking like a bug */
      if (!card || !overlay || !selectionAnchor.onScreen) {
        path.setAttribute('d', '')
        rope.current = null
        return
      }

      const cardBox = card.getBoundingClientRect()
      const overlayBox = overlay.getBoundingClientRect()
      /* Leaves from the bottom-right corner of the card, the way a cord hangs off
         the thing it is plugged into */
      const from = {
        x: cardBox.right - overlayBox.left - 14,
        y: cardBox.bottom - overlayBox.top,
      }
      const to = { x: selectionAnchor.x, y: selectionAnchor.y }

      rope.current ??= createRope(from, to)
      stepRope(rope.current, from, to, delta)
      path.setAttribute('d', ropePath(rope.current))
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [pathRef, cardRef, overlayRef])
}
