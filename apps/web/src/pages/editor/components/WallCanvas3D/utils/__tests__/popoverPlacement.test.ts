import { describe, it, expect } from 'vitest'
import { placePopover } from '../popoverPlacement'
import { getSeamLabelKey } from '../panelSeam'

const viewport = { width: 1000, height: 800 }
const popover = { width: 288, height: 300 }

const place = (x: number, y: number) =>
  placePopover({ anchorNdc: { x, y }, viewport, popover })

describe('placePopover', () => {
  it('sits to the right of its anchor while there is room there', () => {
    const placement = place(0, 0)

    expect(placement.side).toBe('right')
    expect(placement.x).toBeGreaterThan(0)
  })

  it('flips to the left when the right edge is too close', () => {
    const placement = place(0.9, 0)

    expect(placement.side).toBe('left')
    expect(placement.x).toBeLessThan(-popover.width)
  })

  it('centres on its anchor when the anchor is mid canvas', () => {
    expect(place(0, 0).y).toBe(-popover.height / 2)
  })

  it('rides down rather than off the top', () => {
    const placement = place(0, 0.95)
    const anchorY = ((1 - 0.95) / 2) * viewport.height

    expect(anchorY + placement.y).toBeGreaterThanOrEqual(0)
  })

  it('rides up rather than off the bottom', () => {
    const placement = place(0, -0.95)
    const anchorY = ((1 + 0.95) / 2) * viewport.height

    expect(anchorY + placement.y + popover.height).toBeLessThanOrEqual(viewport.height)
  })

  it('keeps the top controls reachable when the popover is taller than the canvas', () => {
    const placement = placePopover({
      anchorNdc: { x: 0, y: 0 },
      viewport: { width: 1000, height: 240 },
      popover,
    })

    expect(placement.y + 120).toBeGreaterThanOrEqual(0)
  })
})

describe('getSeamLabelKey', () => {
  it('names the seam a panel bends on', () => {
    expect(getSeamLabelKey('bottom')).toBe('editor.panel.seam.across')
    expect(getSeamLabelKey('left')).toBe('editor.panel.seam.up')
  })

  it('sends the root panel to the floor line, since it hinges on nothing', () => {
    expect(getSeamLabelKey(null)).toBe('editor.panel.seam.floor')
  })
})
