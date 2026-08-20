/** Which side of its anchor a popover sits on */
export type PopoverSide = 'right' | 'left'

/** Breathing room between the anchor and the popover, in pixels */
const GAP_PX = 14
/** How close to the canvas edge the popover may come, in pixels */
const MARGIN_PX = 12

export interface PopoverPlacementInput {
  /** Anchor in normalised device coordinates: -1 to +1, +1 being right and top */
  anchorNdc: { x: number; y: number }
  /** Canvas size in pixels */
  viewport: { width: number; height: number }
  /** Measured popover size in pixels */
  popover: { width: number; height: number }
}

export interface PopoverOffset {
  /** Pixels from the anchor to the popover's top-left corner */
  x: number
  y: number
  side: PopoverSide
}

/**
 * Puts a popover beside its anchor rather than above it. The camera frames the
 * whole wall, so a panel's edges sit at the edges of the canvas and there is no
 * room over the top; there is always room to the side of it.
 *
 * It takes the right side when the popover fits there and the left when it does
 * not, and rides up or down so it never runs off the top or bottom.
 */
export function placePopover({
  anchorNdc,
  viewport,
  popover,
}: PopoverPlacementInput): PopoverOffset {
  const anchorX = ((anchorNdc.x + 1) / 2) * viewport.width
  const anchorY = ((1 - anchorNdc.y) / 2) * viewport.height

  const roomRight = viewport.width - anchorX - GAP_PX - MARGIN_PX
  const side: PopoverSide = roomRight >= popover.width ? 'right' : 'left'

  const centred = -popover.height / 2
  const highest = MARGIN_PX - anchorY
  const lowest = viewport.height - MARGIN_PX - popover.height - anchorY

  return {
    x: side === 'right' ? GAP_PX : -(GAP_PX + popover.width),
    /* Highest wins the tie: a popover taller than the canvas keeps its top
       controls reachable rather than its bottom ones */
    y: Math.max(Math.min(centred, lowest), highest),
    side,
  }
}
