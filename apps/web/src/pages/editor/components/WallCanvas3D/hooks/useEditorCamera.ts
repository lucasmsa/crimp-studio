import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M, CAMERA } from '../constants/editor3d'
import { computeFaceTransforms } from '../utils/faceTransform'
import { computeWallProfile } from '../utils/faceProfile'

/** Room to leave around the profile once it is framed */
const FIT_MARGIN = 1.15
/** Fraction of the remaining distance covered per frame */
const EASE = 3.5
/** Close enough to stop chasing and hand the camera back */
const SETTLED = 0.01

/**
 * Frames the whole profile and follows it when it changes shape. Bending trades
 * height for reach, so the framing comes from the profile's real extents rather
 * than the plywood size; framing on the sheet size walks a roof out of view.
 *
 * The refit only runs while the wall is actually changing shape. Chasing every
 * frame would fight the user's own orbit and zoom.
 */
export function useEditorCamera(): THREE.Vector3 {
  const { camera } = useThree()
  const wall = useWallStore((state) => state.wall)

  /* Mutated in the frame loop and handed to OrbitControls as its orbit
     target, so it has to be one stable object rather than a ref read at render */
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const lastShape = useRef('')
  const refitting = useRef(true)

  useFrame((_, delta) => {
    const profile = computeWallProfile(wall.faces, computeFaceTransforms(wall.faces))
    const shape = `${Math.round(profile.heightCm)}x${Math.round(profile.reachCm)}`
    if (shape !== lastShape.current) {
      lastShape.current = shape
      refitting.current = true
    }
    if (!refitting.current) return

    const heightM = profile.heightCm * CM_TO_M
    const reachM = profile.reachCm * CM_TO_M
    const widthM = wall.width * CM_TO_M
    /* Wall3D re-centers the plywood on screen, so the floor sits at -height/2 */
    const floorY = (-wall.height * CM_TO_M) / 2

    const center = new THREE.Vector3(0, floorY + heightM / 2, reachM / 2)
    const fovRad = THREE.MathUtils.degToRad(CAMERA.FOV)
    const span = Math.max(widthM, heightM, reachM)
    const distance = (span / (2 * Math.tan(fovRad / 2))) * FIT_MARGIN + reachM / 2

    const ease = Math.min(1, delta * EASE)
    target.lerp(center, ease)

    const offset = camera.position.clone().sub(target)
    const eased = THREE.MathUtils.lerp(offset.length(), distance, ease)
    camera.position.copy(target).add(offset.setLength(eased))
    camera.lookAt(target)

    if (
      target.distanceTo(center) < SETTLED &&
      Math.abs(offset.length() - distance) < SETTLED
    ) {
      refitting.current = false
    }
  })

  return target
}
