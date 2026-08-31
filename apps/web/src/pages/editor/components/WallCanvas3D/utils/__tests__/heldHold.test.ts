import { describe, it, expect } from 'vitest'
import type { HeldHold, Hold } from '@/stores/wallStore'
import { heldHoldWarnings, heldHoldsOnFace } from '../heldHold'

const hold = (id: string, faceId: string, u: number, v: number): Hold => ({
  id,
  type: 'jug',
  faceId,
  u,
  v,
  size: 10,
})

const held = (over: Partial<HeldHold> = {}): HeldHold => ({
  id: 'moving',
  faceId: 'root',
  u: 200,
  v: 300,
  clear: true,
  blockedHoldIds: [],
  ...over,
})

const holds = [hold('moving', 'root', 100, 250), hold('sitting', 'root', 250, 250)]

describe('heldHoldsOnFace', () => {
  it('gives a panel its own holds when nothing is being carried', () => {
    expect(heldHoldsOnFace(holds, null, 'root')).toHaveLength(2)
    expect(heldHoldsOnFace(holds, null, 'upper')).toHaveLength(0)
  })

  it('draws the carried hold where the pointer has it', () => {
    const drawn = heldHoldsOnFace(holds, held(), 'root')

    expect(drawn.find((h) => h.id === 'moving')).toMatchObject({ u: 200, v: 300 })
    expect(drawn.find((h) => h.id === 'sitting')).toMatchObject({ u: 250, v: 250 })
  })

  it('draws it on the panel it is being carried over, not the one it belongs to', () => {
    const onUpper = held({ faceId: 'upper', u: 150, v: 60 })

    expect(heldHoldsOnFace(holds, onUpper, 'root').map((h) => h.id)).toEqual(['sitting'])
    expect(heldHoldsOnFace(holds, onUpper, 'upper')).toHaveLength(1)
  })

  it('leaves a carried hold out when its own hold has gone', () => {
    expect(heldHoldsOnFace([holds[1]], held(), 'root').map((h) => h.id)).toEqual(['sitting'])
  })
})

describe('heldHoldWarnings', () => {
  it('says nothing while the spot is free', () => {
    expect(heldHoldWarnings(held())).toEqual([])
    expect(heldHoldWarnings(null)).toEqual([])
  })

  it('names both ends: the one in your hand and what it is sitting on', () => {
    expect(heldHoldWarnings(held({ clear: false, blockedHoldIds: ['sitting'] }))).toEqual([
      'moving',
      'sitting',
    ])
  })

  it('names the carried hold even when what stopped it is plywood', () => {
    expect(heldHoldWarnings(held({ clear: false }))).toEqual(['moving'])
  })
})
