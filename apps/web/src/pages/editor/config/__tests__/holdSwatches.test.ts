import { describe, it, expect } from 'vitest'
import { HOLD_SWATCHES } from '../holdSwatches'
import { PANEL_SWATCHES } from '../panelSwatches'

describe('HOLD_SWATCHES', () => {
  it('stays a curated set rather than a colour wheel', () => {
    expect(HOLD_SWATCHES.length).toBeLessThanOrEqual(12)
  })

  it('carries no duplicate colours or keys', () => {
    expect(new Set(HOLD_SWATCHES.map((s) => s.hex)).size).toBe(HOLD_SWATCHES.length)
    expect(new Set(HOLD_SWATCHES.map((s) => s.key)).size).toBe(HOLD_SWATCHES.length)
  })

  it('records where every value came from, so nothing is a guess', () => {
    for (const swatch of HOLD_SWATCHES) {
      expect(swatch.hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(swatch.source.length).toBeGreaterThan(0)
    }
  })
})

describe('PANEL_SWATCHES', () => {
  it('never shares a tone with the hold set', () => {
    const holdTones = new Set(HOLD_SWATCHES.map((s) => s.hex.toUpperCase()))

    for (const panel of PANEL_SWATCHES) {
      expect(holdTones.has(panel.hex.toUpperCase())).toBe(false)
    }
  })

  it('stays a short set of materials', () => {
    expect(PANEL_SWATCHES.length).toBeLessThanOrEqual(8)
    expect(new Set(PANEL_SWATCHES.map((s) => s.key)).size).toBe(PANEL_SWATCHES.length)
  })
})
