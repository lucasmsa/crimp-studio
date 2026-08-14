import { describe, it, expect } from 'vitest'
import { resolveWallTap } from '../wallGesture'

describe('resolveWallTap', () => {
  it('dismisses a selected hold before anything else', () => {
    expect(
      resolveWallTap({ selectedHoldId: 'hold_1', selectedFaceId: 'face_1', hitFaceId: 'face_1' }),
    ).toBe('deselectHold')
  })

  it('focuses a face that is not focused yet', () => {
    expect(
      resolveWallTap({ selectedHoldId: null, selectedFaceId: null, hitFaceId: 'face_1' }),
    ).toBe('selectFace')
  })

  it('switches focus when another face is tapped', () => {
    expect(
      resolveWallTap({ selectedHoldId: null, selectedFaceId: 'face_1', hitFaceId: 'face_2' }),
    ).toBe('selectFace')
  })

  it('places a hold inside the focused face', () => {
    expect(
      resolveWallTap({ selectedHoldId: null, selectedFaceId: 'face_1', hitFaceId: 'face_1' }),
    ).toBe('place')
  })
})
