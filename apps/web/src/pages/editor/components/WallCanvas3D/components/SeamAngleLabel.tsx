import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { cn } from '@/lib/utils'
import { seamLabelAnchor } from '../utils/seamLabelAnchor'

/** Where the chip sits relative to the seam's end, in px: up and to the right, clear of the cursor */
const OFFSET_X = 14
const OFFSET_Y = -30

/**
 * The seam's angle on the plywood, in a chip that follows the cursor end of
 * the line while it is drawn. Red, like the line, where the cut is refused.
 * Positioned each frame from the projected anchor rather than through state,
 * for the same reason the selection rope is (ADR-011).
 */
export function SeamAngleLabel() {
  const { t } = useTranslation()
  const drawn = useWallStore((state) => state.drawnSeam)
  const chip = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const tick = () => {
      frame = requestAnimationFrame(tick)
      const element = chip.current
      if (!element) return
      element.style.transform = `translate(${seamLabelAnchor.x + OFFSET_X}px, ${seamLabelAnchor.y + OFFSET_Y}px)`
      element.style.visibility = seamLabelAnchor.onScreen ? 'visible' : 'hidden'
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!drawn?.seam) return null

  return (
    <div
      ref={chip}
      className={cn(
        'pointer-events-none absolute left-0 top-0 border-2 bg-card px-2 py-0.5 font-heading text-xs font-semibold uppercase tracking-wider',
        drawn.clear ? 'border-foreground text-foreground' : 'border-destructive text-destructive',
      )}
      style={{ visibility: 'hidden' }}
      data-testid="seam-angle"
    >
      {t('editor.face.degrees', { value: Math.round(drawn.angleDeg) })}
    </div>
  )
}
