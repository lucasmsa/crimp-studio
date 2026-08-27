import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { CAMERA, CAMERA_EASE } from '../constants/editor3d'
import { CM_TO_M } from '@crimp-studio/wall-geometry'
import { computeFaceTransforms } from '@crimp-studio/wall-geometry'
import { computeWallProfile } from '../utils/faceProfile'
import { useSelectionSwing } from './useSelectionSwing'

/** Room to leave around the profile once it is framed */
const FIT_MARGIN = 1.15
/** Close enough to stop chasing and hand the camera back */
const SETTLED = 0.01

/** How much closer than the fit the camera may sit before the wall is cropped */
const DISTANCE_SLACK = 0.15
/** How far off the profile's centre the orbit target may sit, in metres */
const TARGET_SLACK = 0.6
/** Profile changes smaller than this do not count as a new shape, in cm */
const SHAPE_STEP_CM = 5

/**
 * Everything that moves the editor's camera, and the orbit target it hands to
 * OrbitControls. The two movers own different halves of the shot: framing sets
 * the target and how far back the camera sits, the swing sets which direction it
 * sits in, so neither can undo the other.
 */
export function useEditorCamera(): THREE.Vector3 {
  const target = useProfileFraming()
  useSelectionSwing(target)

  return target
}

/**
 * Frames the whole profile and follows it when it changes shape. Bending trades
 * height for depth, so the framing comes from the profile's real extents rather
 * than the plywood size; framing on the sheet size walks a roof out of view.
 *
 * The refit only runs while the wall is actually changing shape. Chasing every
 * frame would fight the user's own orbit and zoom.
 */
function useProfileFraming(): THREE.Vector3 {
  const { camera } = useThree()
  const wall = useWallStore((state) => state.wall)

  /* Mutated in the frame loop and handed to OrbitControls as its orbit
     target, so it has to be one stable object rather than a ref read at render */
  const target = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const lastShape = useRef('')
  const refitting = useRef(true)

  useFrame((_, delta) => {
    const profile = computeWallProfile(wall.faces, computeFaceTransforms(wall.faces))

    const heightM = profile.heightCm * CM_TO_M
    const depthM = profile.depthCm * CM_TO_M
    const widthM = wall.width * CM_TO_M
    /* Wall3D re-centers the plywood on screen, so the floor sits at -height/2 */
    const floorY = (-wall.height * CM_TO_M) / 2

    const center = new THREE.Vector3(0, floorY + heightM / 2, depthM / 2)
    const fovRad = THREE.MathUtils.degToRad(CAMERA.FOV)
    const span = Math.max(widthM, heightM, depthM)
    const distance = (span / (2 * Math.tan(fovRad / 2))) * FIT_MARGIN + depthM / 2

    /* A new shape only re-frames when it no longer fits the shot. Chasing every
       angle step slid the whole scene under the pointer, and the zoom you set by
       hand is yours to keep: the camera moves when the wall would be cropped or
       has wandered off centre, not because it changed. */
    const shape = `${quantise(profile.heightCm)}x${quantise(profile.depthCm)}`
    if (shape !== lastShape.current) {
      lastShape.current = shape
      const cropped = camera.position.distanceTo(target) < distance * (1 - DISTANCE_SLACK)
      if (cropped || target.distanceTo(center) > TARGET_SLACK) refitting.current = true
    }
    if (!refitting.current) return

    const ease = Math.min(1, delta * CAMERA_EASE)
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

function quantise(cm: number): number {
  return Math.round(cm / SHAPE_STEP_CM)
}
