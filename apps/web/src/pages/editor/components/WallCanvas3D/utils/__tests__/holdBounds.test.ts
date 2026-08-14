import { describe, it, expect } from 'vitest'
import { clampHoldToWall } from '../holdBounds'

describe('clampHoldToWall', () => {
  const box = { halfW: 30, halfH: 20 }

  it('pulls a hold at the edge fully onto the wall', () => {
    expect(clampHoldToWall(400, 200, box, 400, 500)).toEqual({ x: 370, y: 200 })
    expect(clampHoldToWall(0, 0, box, 400, 500)).toEqual({ x: 30, y: 20 })
  })

  it('leaves an interior position untouched', () => {
    expect(clampHoldToWall(200, 250, box, 400, 500)).toEqual({ x: 200, y: 250 })
  })

  it('centers a hold wider than the wall instead of inverting the range', () => {
    const huge = { halfW: 300, halfH: 20 }

    expect(clampHoldToWall(10, 250, huge, 400, 500).x).toBe(200)
  })

  it('falls back to center-point clamping without a box', () => {
    expect(clampHoldToWall(-5, 600, undefined, 400, 500)).toEqual({ x: 0, y: 500 })
  })
})
