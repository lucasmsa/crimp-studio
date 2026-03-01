import { describe, it, expect } from 'vitest'
import { createHoldGeometry, FLAT_SHADED_TYPES } from '../holdGeometry'
import type { HoldType } from '@/stores/wallStore'

const HOLD_TYPES: HoldType[] = ['jug', 'crimp', 'sloper', 'pinch', 'pocket', 'volume']

describe('createHoldGeometry', () => {
  it.each(HOLD_TYPES)('creates valid geometry for %s', (type) => {
    const geometry = createHoldGeometry(type, 0.1)

    expect(geometry).toBeDefined()
    const positions = geometry.getAttribute('position')
    expect(positions).toBeDefined()
    expect(positions.count).toBeGreaterThan(0)
  })

  it.each(HOLD_TYPES)('produces different geometry on repeated calls for %s (procedural variance)', (type) => {
    const geo1 = createHoldGeometry(type, 0.1)
    const geo2 = createHoldGeometry(type, 0.1)

    const pos1 = geo1.getAttribute('position')
    const pos2 = geo2.getAttribute('position')

    let hasDifference = pos1.count !== pos2.count

    if (!hasDifference) {
      for (let i = 0; i < Math.min(pos1.count, 10); i++) {
        if (
          pos1.getX(i) !== pos2.getX(i) ||
          pos1.getY(i) !== pos2.getY(i) ||
          pos1.getZ(i) !== pos2.getZ(i)
        ) {
          hasDifference = true
          break
        }
      }
    }

    expect(hasDifference).toBe(true)
  })

  it('scales geometry based on the scale parameter', () => {
    const small = createHoldGeometry('jug', 0.05)
    const large = createHoldGeometry('jug', 0.2)

    small.computeBoundingSphere()
    large.computeBoundingSphere()

    expect(large.boundingSphere!.radius).toBeGreaterThan(small.boundingSphere!.radius)
  })
})

describe('FLAT_SHADED_TYPES', () => {
  it('only includes volume', () => {
    expect(FLAT_SHADED_TYPES.has('volume')).toBe(true)
    expect(FLAT_SHADED_TYPES.has('jug')).toBe(false)
    expect(FLAT_SHADED_TYPES.has('crimp')).toBe(false)
    expect(FLAT_SHADED_TYPES.has('sloper')).toBe(false)
    expect(FLAT_SHADED_TYPES.has('pinch')).toBe(false)
    expect(FLAT_SHADED_TYPES.has('pocket')).toBe(false)
  })
})
