import { describe, it, expect } from 'vitest'
import { HOLD_TYPES } from '../../../../config/holdTypes'
import { measureHoldFootprint, measureWorstCaseFootprint } from '../holdFootprint'
import { getModelVariants } from '../holdModels'

describe('measureWorstCaseFootprint', () => {
  it('contains every model of the type, extent by extent', () => {
    for (const type of HOLD_TYPES) {
      const worst = measureWorstCaseFootprint(type, 10)

      for (const model of getModelVariants(type)) {
        const box = measureHoldFootprint(type, model.variant, 10)
        expect(worst.halfW).toBeGreaterThanOrEqual(box.halfW)
        expect(worst.halfH).toBeGreaterThanOrEqual(box.halfH)
        expect(worst.depth).toBeGreaterThanOrEqual(box.depth)
      }
    }
  })

  it('is not any one model, since the widest is rarely the tallest', () => {
    const boxes = getModelVariants('volume').map((model) =>
      measureHoldFootprint('volume', model.variant, 10),
    )
    const worst = measureWorstCaseFootprint('volume', 10)

    expect(boxes).not.toContainEqual(worst)
  })

  it('turns with the hold, so a rotated type is measured rotated', () => {
    const upright = measureWorstCaseFootprint('pinch', 10)
    const turned = measureWorstCaseFootprint('pinch', 10, 90)

    expect(turned.halfW).toBeCloseTo(upright.halfH, 5)
    expect(turned.halfH).toBeCloseTo(upright.halfW, 5)
  })
})
