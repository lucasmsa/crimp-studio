import { describe, it, expect } from 'vitest'
import { rectOutline } from '@crimp-studio/wall-geometry'
import type { Point2 } from '@crimp-studio/wall-geometry'
import { clampHoldToFace } from '../holdBounds'

const sheet = rectOutline(400, 500)

describe('clampHoldToFace', () => {
  const box = { halfW: 30, halfH: 20, depth: 10 }

  it('pulls a hold at the edge fully onto the face', () => {
    expect(clampHoldToFace(400, 200, box, sheet)).toEqual({ u: 370, v: 200 })
    expect(clampHoldToFace(0, 0, box, sheet)).toEqual({ u: 30, v: 20 })
  })

  it('leaves an interior position untouched', () => {
    expect(clampHoldToFace(200, 250, box, sheet)).toEqual({ u: 200, v: 250 })
  })

  it('centers a hold wider than the face instead of inverting the range', () => {
    const huge = { halfW: 300, halfH: 20, depth: 10 }

    expect(clampHoldToFace(10, 250, huge, sheet).u).toBe(200)
  })

  it('falls back to center-point clamping without a box', () => {
    expect(clampHoldToFace(-5, 600, undefined, sheet)).toEqual({ u: 0, v: 500 })
  })

  it('clamps onto a shorter face after a cut', () => {
    expect(clampHoldToFace(200, 470, box, rectOutline(400, 300))).toEqual({ u: 200, v: 280 })
  })

  it('keeps a hold beside a slanted edge on the plywood, where a bounding box would not', () => {
    const triangle: Point2[] = [
      [0, 0],
      [400, 0],
      [0, 400],
    ]
    const square = { halfW: 20, halfH: 20, depth: 10 }

    /* Asked for a spot past the hypotenuse: the hold lands against it, its
       whole 40cm box on the plywood */
    const { u, v } = clampHoldToFace(300, 300, square, triangle)
    expect(u + v).toBeLessThanOrEqual(400 - 20 * Math.SQRT2 + 1e-6)
    expect(u).toBeGreaterThan(100)
    expect(v).toBeGreaterThan(100)
  })
})
