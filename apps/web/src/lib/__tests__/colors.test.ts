import { describe, it, expect } from 'vitest'
import { colors } from '../colors'
import { HOLD_SWATCHES } from '@/pages/editor/config/holdSwatches'
import { PANEL_SWATCHES } from '@/pages/editor/config/panelSwatches'
import { HOLD_TYPES } from '@/pages/editor/config/holdTypes'

describe('hold colours', () => {
  it('starts every type on a colour the swatch row offers', () => {
    const swatches = HOLD_SWATCHES.map((swatch) => swatch.hex)

    for (const type of HOLD_TYPES) {
      expect(swatches).toContain(colors.holds[type])
    }
  })

  it('keeps the panel set and the hold set apart, so paint never reads as a hold', () => {
    const holdHexes = new Set(HOLD_SWATCHES.map((swatch) => swatch.hex))

    for (const panel of PANEL_SWATCHES) {
      expect(holdHexes).not.toContain(panel.hex)
    }
  })
})
