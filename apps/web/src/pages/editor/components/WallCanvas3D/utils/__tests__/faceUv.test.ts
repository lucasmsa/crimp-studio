import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { applyFaceUvTransform, PLYWOOD_UV } from '../faceUv'
import { PANEL_WIDTH_M } from '../wallTexture'

describe('applyFaceUvTransform', () => {
  it('turns metre-space UVs into plywood tiles', () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute([0, 0, PANEL_WIDTH_M, 0, 2 * PANEL_WIDTH_M, PANEL_WIDTH_M], 2),
    )

    applyFaceUvTransform(geometry, PLYWOOD_UV)

    const uv = geometry.getAttribute('uv')
    expect(uv.getX(1)).toBeCloseTo(1, 5)
    expect(uv.getX(2)).toBeCloseTo(2, 5)
    expect(uv.getY(2)).toBeCloseTo(1, 5)
  })
})
