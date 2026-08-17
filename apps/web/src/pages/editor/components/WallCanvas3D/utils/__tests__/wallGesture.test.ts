import { describe, it, expect } from 'vitest'
import { resolveWallTap } from '../wallGesture'

describe('resolveWallTap', () => {
  it('picks the panel while shaping, whatever is selected', () => {
    expect(
      resolveWallTap({ mode: 'shape', selectedHoldId: null, hitFaceId: 'face_1' }),
    ).toBe('selectFace')

    expect(
      resolveWallTap({ mode: 'shape', selectedHoldId: 'hold_1', hitFaceId: 'face_1' }),
    ).toBe('selectFace')
  })

  it('places a hold when that is what clicks are aimed at', () => {
    expect(
      resolveWallTap({ mode: 'holds', selectedHoldId: null, hitFaceId: 'face_1' }),
    ).toBe('place')
  })

  it('dismisses a selected hold first, so one click does not both deselect and place', () => {
    expect(
      resolveWallTap({ mode: 'holds', selectedHoldId: 'hold_1', hitFaceId: 'face_1' }),
    ).toBe('deselectHold')
  })
})
