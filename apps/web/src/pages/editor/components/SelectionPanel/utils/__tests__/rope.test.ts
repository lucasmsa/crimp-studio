import { describe, it, expect } from 'vitest'
import { createRope, ROPE, ropePath, stepRope } from '../rope'

const CARD = { x: 900, y: 100 }
const THING = { x: 300, y: 400 }

const settle = (steps = 120) => {
  const rope = createRope(CARD, THING)
  for (let i = 0; i < steps; i++) stepRope(rope, CARD, THING, 1 / 60)
  return rope
}

describe('stepRope', () => {
  it('keeps both ends where they are pinned', () => {
    const rope = settle()

    expect(rope[0]).toMatchObject(CARD)
    expect(rope[rope.length - 1]).toMatchObject(THING)
  })

  it('hangs below the straight line between them', () => {
    const rope = settle()
    const middle = rope[Math.floor(rope.length / 2)]
    const straightY = (CARD.y + THING.y) / 2

    expect(middle.y).toBeGreaterThan(straightY)
  })

  it('comes to rest rather than swinging forever', () => {
    const rope = settle(400)
    const before = rope.map((point) => ({ ...point }))
    stepRope(rope, CARD, THING, 1 / 60)

    const moved = Math.max(...rope.map((point, i) => Math.abs(point.y - before[i].y)))
    expect(moved).toBeLessThan(0.5)
  })

  it('lags behind an end that is yanked, which is what reads as weight', () => {
    const rope = settle()
    const yanked = { x: THING.x + 400, y: THING.y }

    stepRope(rope, CARD, yanked, 1 / 60)
    const middle = rope[Math.floor(rope.length / 2)]
    const straightAfter = (CARD.x + yanked.x) / 2

    expect(middle.x).toBeLessThan(straightAfter)
  })

  it('never stretches past its slack', () => {
    const rope = settle()
    const span = Math.hypot(THING.x - CARD.x, THING.y - CARD.y)
    const { slack } = ROPE
    const length = rope
      .slice(1)
      .reduce(
        (total, point, i) => total + Math.hypot(point.x - rope[i].x, point.y - rope[i].y),
        0,
      )

    expect(length).toBeLessThan(span * (slack + 0.06))
  })
})

describe('ropePath', () => {
  it('starts at the card end', () => {
    expect(ropePath(createRope(CARD, THING))).toMatch(/^M 900 100/)
  })

  it('ends at the thing it points to', () => {
    expect(ropePath(createRope(CARD, THING))).toMatch(/L 300 400$/)
  })
})
