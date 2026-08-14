import { describe, it, expect } from 'vitest'
import {
  getAllModelPaths,
  getModelVariant,
  getModelVariants,
  getModelScaleFactor,
  measureModelCollisionBox,
  pickModelVariant,
} from '../holdModels'
import { holdModelVariants } from '../../config/holdModelConfig.generated'
import { holdGeometryConfigs } from '../../config/holdGeometryConfig'

describe('getModelVariants', () => {
  it('returns variants for every hold type, volume included', () => {
    expect(getModelVariants('jug').length).toBeGreaterThan(0)
    expect(getModelVariants('crimp').length).toBeGreaterThan(0)
    expect(getModelVariants('volume').length).toBeGreaterThan(0)
  })
})

describe('getAllModelPaths', () => {
  it('returns every registered variant path exactly once', () => {
    const paths = getAllModelPaths()
    const expected = Object.values(holdModelVariants).reduce((n, v) => n + v.length, 0)

    expect(paths.length).toBe(expected)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((p) => p.startsWith('/models/holds/'))).toBe(true)
  })
})

describe('getModelVariant', () => {
  it('finds a variant by name', () => {
    const first = holdModelVariants.jug![0]

    expect(getModelVariant('jug', first.variant)).toEqual(first)
  })

  it('returns null for undefined variant', () => {
    expect(getModelVariant('jug', undefined)).toBeNull()
  })

  it('returns null for an unknown variant name', () => {
    expect(getModelVariant('jug', 'does-not-exist')).toBeNull()
  })
})

describe('pickModelVariant', () => {
  it('is deterministic for the same hold id', () => {
    expect(pickModelVariant('abc1234', 'jug')).toBe(pickModelVariant('abc1234', 'jug'))
  })

  it('always returns a valid variant of the type', () => {
    const variants = getModelVariants('crimp').map((v) => v.variant)
    for (let i = 0; i < 50; i++) {
      const picked = pickModelVariant(`hold-${i}`, 'crimp')
      expect(variants).toContain(picked)
    }
  })

  it('spreads picks across more than one variant', () => {
    const picks = new Set(
      Array.from({ length: 50 }, (_, i) => pickModelVariant(`hold-${i}`, 'crimp')),
    )

    expect(picks.size).toBeGreaterThan(1)
  })

  it('picks a valid volume variant now that volumes have models', () => {
    const variants = getModelVariants('volume').map((v) => v.variant)

    expect(variants).toContain(pickModelVariant('abc1234', 'volume'))
  })
})

describe('getModelScaleFactor', () => {
  it('scales the native footprint to the target footprint', () => {
    const model = { variant: 'v', path: '/x.glb', sizeMeters: [0.1, 0.05, 0.03] as [number, number, number] }
    const factor = getModelScaleFactor(model, 'jug', 10)

    const scaledFootprint = 0.1 * factor
    const expected = 10 * 0.01 * holdGeometryConfigs.jug.sizeMultiplier * 4.7
    expect(scaledFootprint).toBeCloseTo(expected, 5)
  })
})

describe('measureModelCollisionBox', () => {
  const model = { variant: 'v', path: '/x.glb', sizeMeters: [0.1, 0.05, 0.03] as [number, number, number] }

  it('returns half-extents in cm proportional to the model aspect', () => {
    const box = measureModelCollisionBox(model, 'jug', 10)

    expect(box.halfW / box.halfH).toBeCloseTo(2, 5)
    expect(box.halfW).toBeGreaterThan(0)
  })

  it('swaps extents at 90 degrees rotation', () => {
    const base = measureModelCollisionBox(model, 'jug', 10)
    const rotated = measureModelCollisionBox(model, 'jug', 10, 90)

    expect(rotated.halfW).toBeCloseTo(base.halfH, 5)
    expect(rotated.halfH).toBeCloseTo(base.halfW, 5)
  })

  it('grows extents at 45 degrees rotation', () => {
    const base = measureModelCollisionBox(model, 'jug', 10)
    const rotated = measureModelCollisionBox(model, 'jug', 10, 45)

    expect(rotated.halfW).toBeGreaterThan(base.halfH)
    expect(rotated.halfW).toBeLessThanOrEqual(base.halfW + base.halfH)
  })
})
