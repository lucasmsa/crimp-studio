import { describe, it, expect } from 'vitest'
import {
  checkCollision,
  findCollisions,
  hasCollision,
} from '../holdCollision'
import type { Hold } from '@/stores/wallStore'

const makeHold = (overrides: Partial<Hold> & Pick<Hold, 'x' | 'y'>): Hold => ({
  id: Math.random().toString(36).slice(2),
  type: 'jug',
  size: 10,
  collisionBox: { halfW: 20, halfH: 10 },
  ...overrides,
})

describe('checkCollision', () => {
  it('detects overlap between two holds at the same position', () => {
    const a = makeHold({ x: 100, y: 100 })
    const b = makeHold({ x: 100, y: 100 })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('detects overlap when holds are within combined half-widths (X axis)', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: { halfW: 20, halfH: 10 } })
    const b = makeHold({ x: 139, y: 100, collisionBox: { halfW: 20, halfH: 10 } })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('returns false when holds are past combined half-widths (X axis)', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: { halfW: 20, halfH: 10 } })
    const b = makeHold({ x: 141, y: 100, collisionBox: { halfW: 20, halfH: 10 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('detects overlap on Y axis with tall holds', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: { halfW: 5, halfH: 30 } })
    const b = makeHold({ x: 100, y: 150, collisionBox: { halfW: 5, halfH: 30 } })

    expect(checkCollision(a, b)).toBe(true)
  })

  it('returns false when holds are separated on Y axis', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: { halfW: 5, halfH: 30 } })
    const b = makeHold({ x: 100, y: 161, collisionBox: { halfW: 5, halfH: 30 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('no collision when X overlaps but Y does not', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: { halfW: 30, halfH: 5 } })
    const b = makeHold({ x: 110, y: 120, collisionBox: { halfW: 30, halfH: 5 } })

    expect(checkCollision(a, b)).toBe(false)
  })

  it('uses default fallback box when collisionBox is undefined', () => {
    const a = makeHold({ x: 100, y: 100, collisionBox: undefined })
    const b = makeHold({ x: 100, y: 100, collisionBox: undefined })

    expect(checkCollision(a, b)).toBe(true)
  })
})

describe('findCollisions', () => {
  it('returns empty array when no collisions', () => {
    const candidate = makeHold({ x: 0, y: 0 })
    const holds = [
      makeHold({ x: 300, y: 300 }),
      makeHold({ x: 400, y: 400 }),
    ]

    expect(findCollisions(candidate, holds)).toEqual([])
  })

  it('returns IDs of colliding holds', () => {
    const candidate = makeHold({ x: 100, y: 100 })
    const nearby = makeHold({ x: 105, y: 100 })
    const farAway = makeHold({ x: 400, y: 400 })

    const result = findCollisions(candidate, [nearby, farAway])

    expect(result).toEqual([nearby.id])
  })

  it('skips the candidate itself (no self-collision)', () => {
    const hold = makeHold({ x: 100, y: 100 })

    expect(findCollisions(hold, [hold])).toEqual([])
  })

  it('returns multiple colliding hold IDs', () => {
    const candidate = makeHold({ x: 100, y: 100 })
    const nearA = makeHold({ x: 105, y: 100 })
    const nearB = makeHold({ x: 100, y: 105 })

    const result = findCollisions(candidate, [nearA, nearB])

    expect(result).toHaveLength(2)
    expect(result).toContain(nearA.id)
    expect(result).toContain(nearB.id)
  })
})

describe('hasCollision', () => {
  it('returns false for empty hold list', () => {
    const candidate = makeHold({ x: 100, y: 100 })

    expect(hasCollision(candidate, [])).toBe(false)
  })

  it('returns true when at least one collision exists', () => {
    const candidate = makeHold({ x: 100, y: 100 })
    const holds = [makeHold({ x: 105, y: 100 })]

    expect(hasCollision(candidate, holds)).toBe(true)
  })

  it('skips self when checking', () => {
    const hold = makeHold({ x: 100, y: 100 })

    expect(hasCollision(hold, [hold])).toBe(false)
  })
})
