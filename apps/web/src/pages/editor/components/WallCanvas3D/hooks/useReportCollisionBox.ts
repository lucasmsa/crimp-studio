import { useEffect } from 'react'
import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M } from '../constants/editor3d'

/**
 * Measures the hold's XY bounding box from its actual geometry (after rotation)
 * and reports it to the store for collision checks. Refines the synchronous
 * estimate made at placement time.
 */
export function useReportCollisionBox(hold: Hold, geometry: THREE.BufferGeometry): void {
  const updateHold = useWallStore((s) => s.updateHold)

  useEffect(() => {
    const rotated = geometry.clone()
    rotated.rotateZ(THREE.MathUtils.degToRad(hold.rotation ?? 0))
    rotated.computeBoundingBox()
    const box = rotated.boundingBox!

    const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) / CM_TO_M
    const halfH = Math.max(Math.abs(box.min.y), Math.abs(box.max.y)) / CM_TO_M

    updateHold(hold.id, { collisionBox: { halfW, halfH } })
    rotated.dispose()
  }, [geometry, hold.id, hold.rotation, updateHold])
}
