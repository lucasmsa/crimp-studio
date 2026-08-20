import { describe, it, expect } from 'vitest'
import { formatWallReadout } from '../formatReadout'

describe('formatWallReadout', () => {
  it('reads a wall in metres, since that is how a gym talks about one', () => {
    const readout = formatWallReadout({ heightCm: 500, reachCm: 0, surfaceAreaCm2: 200_000 })

    expect(readout.height).toBe('5.00')
    expect(readout.reach).toBe('0.00')
    expect(readout.plywood).toBe('20.0')
  })

  it('keeps centimetre detail in the height, where a bend shows up', () => {
    const readout = formatWallReadout({ heightCm: 483.6, reachCm: 128.4, surfaceAreaCm2: 200_000 })

    expect(readout.height).toBe('4.84')
    expect(readout.reach).toBe('1.28')
  })
})
