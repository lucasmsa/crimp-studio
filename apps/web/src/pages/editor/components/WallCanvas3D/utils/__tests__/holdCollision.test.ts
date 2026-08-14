import { describe, it, expect } from 'vitest'
import { checkCollision, hasCollision } from '../holdCollision'
import type { Hold } from '@/stores/wallStore'

const FACE = 'face_root'

const makeHold = (overrides: Partial<Hold> & Pick<Hold, 'u' | 'v'>): Hold => ({
  id: Math.random().toString(36).slice(2),
  type: 'jug',
  faceId: FACE,
  size: 10,
  collisionBox: { halfW: 20, halfH: 10 },
  ...overrides,
})

describe('checkCollision', () => {
  it('detects overlap between two holds at the same position', () => {
    const a = makeHold({ u: 100, v: 100 })
    const b = makeHold({ u: 100, v: 100 })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('detects overlap when holds are within combined half-widths (u axis)', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: { halfW: 20, halfH: 10 } })
    const b = makeHold({ u: 139, v: 100, collisionBox: { halfW: 20, halfH: 10 } })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('returns false when holds are past combined half-widths (u axis)', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: { halfW: 20, halfH: 10 } })
    const b = makeHold({ u: 141, v: 100, collisionBox: { halfW: 20, halfH: 10 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('detects overlap on v axis with tall holds', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: { halfW: 5, halfH: 30 } })
    const b = makeHold({ u: 100, v: 150, collisionBox: { halfW: 5, halfH: 30 } })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('returns false when holds are separated on v axis', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: { halfW: 5, halfH: 30 } })
    const b = makeHold({ u: 100, v: 161, collisionBox: { halfW: 5, halfH: 30 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('no collision when u overlaps but v does not', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: { halfW: 30, halfH: 5 } })
    const b = makeHold({ u: 110, v: 120, collisionBox: { halfW: 30, halfH: 5 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('uses default fallback box when collisionBox is undefined', () => {
    const a = makeHold({ u: 100, v: 100, collisionBox: undefined })
    const b = makeHold({ u: 100, v: 100, collisionBox: undefined })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('ignores holds on another face, which sit on a different plane', () => {
    const a = makeHold({ u: 100, v: 100 })
    const b = makeHold({ u: 100, v: 100, faceId: 'face_other' })

    expect(checkCollision(a, b)).toBe(false)
  })
})

describe('hasCollision', () => {
  it('returns false for empty hold list', () => {
    const candidate = makeHold({ u: 100, v: 100 })

    expect(hasCollision(candidate, [])).toBe(false)
  })

  it('returns true when at least one collision exists', () => {
    const candidate = makeHold({ u: 100, v: 100 })
    const holds = [makeHold({ u: 105, v: 100 })]

    expect(hasCollision(candidate, holds)).toBe(true)
  })

  it('skips self when checking', () => {
    const hold = makeHold({ u: 100, v: 100 })

    expect(hasCollision(hold, [hold])).toBe(false)
  })
})
