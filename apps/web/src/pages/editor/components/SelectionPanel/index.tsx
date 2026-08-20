import { useRef } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { PanelControls } from './components/PanelControls'
import { HoldControls } from './components/HoldControls'
import { useSelectionRope } from './hooks/useSelectionRope'

/**
 * The controls for whatever is selected, parked in the top right corner with a
 * cord running down to the thing they belong to.
 *
 * Parked rather than pinned to the thing: a popover that follows a panel ends up
 * over the wall it is editing, and the wall is the point. The cord is what keeps
 * the two connected, and it hangs and swings so that the connection is something
 * you watch rather than something you work out.
 */
export function SelectionPanel() {
  const { wall, selectedHoldId, selectedFaceId } = useWallStore()

  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const ropeRef = useRef<SVGPathElement>(null)

  useSelectionRope(ropeRef, cardRef, overlayRef)

  const hold = selectedHoldId ? wall.holds.find((h) => h.id === selectedHoldId) : null
  const showsCard = Boolean(hold) || selectedFaceId !== null

  return (
    <div ref={overlayRef} className="pointer-events-none absolute inset-4 z-20">
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path ref={ropeRef} id="selection-rope" fill="none" />
        </defs>
        {/* Ink first, cord on top: the same stroke idiom the wall uses (ADR-005) */}
        <use
          href="#selection-rope"
          fill="none"
          stroke={colors.scene.outline}
          strokeWidth={7}
          strokeLinecap="round"
        />
        <use
          href="#selection-rope"
          fill="none"
          stroke={colors.secondary}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
      </svg>

      {showsCard && (
        <div className="absolute right-4 top-4">
          {hold ? (
            <HoldControls hold={hold} cardRef={cardRef} />
          ) : (
            <PanelControls cardRef={cardRef} />
          )}
        </div>
      )}
    </div>
  )
}
