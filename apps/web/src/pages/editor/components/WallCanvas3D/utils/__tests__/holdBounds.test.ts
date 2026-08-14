import { describe, it, expect } from 'vitest'
import { clampHoldToFace } from '../holdBounds'

describe('clampHoldToFace', () => {
  const box = { halfW: 30, halfH: 20 }

  it('pulls a hold at the edge fully onto the face', () => {
    expect(clampHoldToFace(400, 200, box, 400, 500)).toEqual({ u: 370, v: 200 })
    expect(clampHoldToFace(0, 0, box, 400, 500)).toEqual({ u: 30, v: 20 })
  })

  it('leaves an interior position untouched', () => {
    expect(clampHoldToFace(200, 250, box, 400, 500)).toEqual({ u: 200, v: 250 })
  })

  it('centers a hold wider than the face instead of inverting the range', () => {
    const huge = { halfW: 300, halfH: 20 }

    expect(clampHoldToFace(10, 250, huge, 400, 500).u).toBe(200)
  })

  it('falls back to center-point clamping without a box', () => {
    expect(clampHoldToFace(-5, 600, undefined, 400, 500)).toEqual({ u: 0, v: 500 })
  })

  it('clamps onto a shorter face after a cut', () => {
    expect(clampHoldToFace(200, 470, box, 400, 300)).toEqual({ u: 200, v: 280 })
  })
})
