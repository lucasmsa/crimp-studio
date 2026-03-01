import { describe, it, expect } from 'vitest'
import { getNextRotation } from '../holdActions'
import { ROTATION_STEP } from '../../constants/editor3d'

const step = ROTATION_STEP

describe('getNextRotation', () => {
  it('applies rotation step when no current rotation', () => {
    expect(getNextRotation(undefined)).toBe(((0 + step) % 360 + 360) % 360)
  })

  it('applies rotation step when current rotation is 0', () => {
    expect(getNextRotation(0)).toBe(((0 + step) % 360 + 360) % 360)
  })

  it('increments by rotation step', () => {
    expect(getNextRotation(90)).toBe(((90 + step) % 360 + 360) % 360)
    expect(getNextRotation(180)).toBe(((180 + step) % 360 + 360) % 360)
  })

  it('wraps around at 360 boundary', () => {
    const input = Math.abs(step)
    expect(getNextRotation(input)).toBe(((input + step) % 360 + 360) % 360)
  })

  it('handles arbitrary rotation values', () => {
    expect(getNextRotation(270)).toBe(((270 + step) % 360 + 360) % 360)
  })
})
