import { useEffect } from 'react'
import * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M } from '@crimp-studio/wall-geometry'

/**
 * Measures the hold's bounding box from its actual geometry (after rotation)
 * and reports it to the store for collision checks. Refines the synchronous
 * estimate made at placement time.
 */
export function useReportCollisionBox(hold: Hold, geometry: THREE.BufferGeometry): void {
  const reportCollisionBox = useWallStore((s) => s.reportCollisionBox)

  useEffect(() => {
    const rotated = geometry.clone()
    rotated.rotateZ(THREE.MathUtils.degToRad(hold.rotation ?? 0))
    rotated.computeBoundingBox()
    const box = rotated.boundingBox!

    const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) / CM_TO_M
    const halfH = Math.max(Math.abs(box.min.y), Math.abs(box.max.y)) / CM_TO_M
    const depth = (box.max.z - box.min.z) / CM_TO_M

    reportCollisionBox(hold.id, { halfW, halfH, depth })
    rotated.dispose()
  }, [geometry, hold.id, hold.rotation, reportCollisionBox])
}
