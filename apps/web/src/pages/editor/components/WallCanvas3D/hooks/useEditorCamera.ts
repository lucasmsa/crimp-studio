import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { CM_TO_M, CAMERA } from '../constants/editor3d'

/**
 * Frames the camera to show the entire wall on mount / dimension change.
 * Returns the wall center point for use as the orbit target.
 */
export function useEditorCamera(wallWidth: number, wallHeight: number) {
  const { camera } = useThree()

  const wallWidthM = wallWidth * CM_TO_M
  const wallHeightM = wallHeight * CM_TO_M

  useEffect(() => {
    const fovRad = THREE.MathUtils.degToRad(CAMERA.FOV)
    const distance = Math.max(wallWidthM, wallHeightM) / (2 * Math.tan(fovRad / 2)) * 1.2
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
  }, [wallWidthM, wallHeightM, camera])

  return new THREE.Vector3(0, 0, 0)
}
