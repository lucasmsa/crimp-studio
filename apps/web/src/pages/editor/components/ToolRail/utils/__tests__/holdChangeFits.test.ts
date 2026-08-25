import { describe, it, expect } from 'vitest'
import { createRootFaceTree } from '@crimp-studio/wall-geometry'
import type { Hold } from '@/stores/wallStore'
import {
  measureHoldFootprint,
  measureWorstCaseFootprint,
} from '../../../WallCanvas3D/utils/holdFootprint'
import { getModelVariants } from '../../../WallCanvas3D/utils/holdModels'
import { typeChangeFits, variantChangeFits } from '../holdChangeFits'

const PANEL = '#E8D5B7'
const faces = createRootFaceTree(300, 400, PANEL)

function crimp(id: string, u: number, v: number): Hold {
  const variant = getModelVariants('crimp')[0].variant
  return {
    id,
    type: 'crimp',
    faceId: faces.rootId,
    u,
    v,
    size: 10,
    variant,
    collisionBox: measureHoldFootprint('crimp', variant, 10),
  }
}

describe('typeChangeFits', () => {
  it('lets a hold with the wall to itself become anything', () => {
    const hold = crimp('lone', 150, 200)

    expect(typeChangeFits(faces, [hold], hold, 'jug')).toBe(true)
    expect(typeChangeFits(faces, [hold], hold, 'volume')).toBe(true)
  })

  it('refuses a type whose models would reach into a neighbour', () => {
    const box = measureWorstCaseFootprint('crimp', 10)
    const neighbour = crimp('neighbour', 150 + box.halfW * 2 + 2, 200)
    const hold = crimp('moving', 150, 200)

    expect(typeChangeFits(faces, [hold, neighbour], hold, 'crimp')).toBe(true)
    expect(typeChangeFits(faces, [hold, neighbour], hold, 'jug')).toBe(false)
  })

  it('answers for the whole type, not for the model that happens to fit', () => {
    /* Volume models run from a narrow rail to a box four times its width. Parked
       far enough out for the rail and nowhere near enough for the box, the type
       is still refused: a random roll could land on either */
    const hold = crimp('moving', 150, 200)
    const narrowest = getModelVariants('volume')
      .map((model) => measureHoldFootprint('volume', model.variant, 10))
      .reduce((a, b) => (a.halfW < b.halfW ? a : b))
    const widest = measureWorstCaseFootprint('volume', 10)
    expect(widest.halfW).toBeGreaterThan(narrowest.halfW + 10)

    const gap = hold.collisionBox!.halfW + narrowest.halfW + 3
    const neighbour = crimp('neighbour', 150 + gap, 200)

    expect(typeChangeFits(faces, [hold, neighbour], hold, 'volume')).toBe(false)
  })
})

describe('variantChangeFits', () => {
  it('lets a hold take another model of its type when nothing is beside it', () => {
    const hold = crimp('lone', 150, 200)
    const other = getModelVariants('crimp')[1].variant

    expect(variantChangeFits(faces, [hold], hold, other)).toBe(true)
  })

  it('refuses a model that would reach into a neighbour', () => {
    const hold = crimp('moving', 150, 200)
    const wide = getModelVariants('crimp')
      .map((model) => ({ variant: model.variant, box: measureHoldFootprint('crimp', model.variant, 10) }))
      .reduce((a, b) => (a.box.halfW > b.box.halfW ? a : b))

    const neighbour = crimp('neighbour', 150 + hold.collisionBox!.halfW + wide.box.halfW, 200)

    expect(variantChangeFits(faces, [hold, neighbour], hold, wide.variant)).toBe(false)
  })
})
