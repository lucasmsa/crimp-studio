import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { computeFaceTransforms, faceNormal } from '@crimp-studio/wall-geometry'
import { useWallStore } from '@/stores/wallStore'
import { CAMERA_EASE } from '../constants/editor3d'
import { swungDirection } from '../utils/cameraFocus'

/** Close enough to the direction asked for to stop turning, in radians */
const SETTLED_RAD = 0.005

/**
 * Turns the camera toward a selected panel that is too edge-on to work on.
 *
 * Only the direction the camera sits in: distance and the orbit target stay
 * with the framing, so the two movers cannot disagree. It turns no further than
 * it has to, which is why a mild overhang barely moves and a roof swings a long
 * way, and it gives up the moment the pointer touches the canvas. Letting go of
 * the panel puts back the direction the camera had before, and nothing else.
 *
 * Selection only, never a bend: re-aiming on every angle step turns the shot
 * into something you are riding rather than something you set.
 */
export function useSelectionSwing(target: THREE.Vector3) {
  const { camera, gl } = useThree()
  const selectedFaceId = useWallStore((state) => state.selectedFaceId)

  const goal = useRef<THREE.Vector3 | null>(null)
  /** Where the camera sat before the swing, to hand back on deselect */
  const before = useRef<THREE.Vector3 | null>(null)

  /* The hand always wins. A press that is a click rather than an orbit sets a
     new goal on release, so selecting still swings */
  useEffect(() => {
    const canvas = gl.domElement
    const release = () => {
      goal.current = null
      before.current = null
    }

    canvas.addEventListener('pointerdown', release)
    return () => canvas.removeEventListener('pointerdown', release)
  }, [gl])

  useEffect(() => {
    if (!selectedFaceId) {
      goal.current = before.current
      before.current = null
      return
    }

    const transform = computeFaceTransforms(useWallStore.getState().wall.faces)[selectedFaceId]
    if (!transform) return

    const toCamera = camera.position.clone().sub(target).normalize()
    const swung = swungDirection(toCamera, faceNormal(transform))
    if (!swung) return

    before.current = toCamera.clone()
    goal.current = swung
  }, [selectedFaceId, camera, target])

  useFrame((_, delta) => {
    const to = goal.current
    if (!to) return

    const offset = camera.position.clone().sub(target)
    const distance = offset.length()
    const turned = offset.normalize().lerp(to, Math.min(1, delta * CAMERA_EASE)).normalize()

    camera.position.copy(target).addScaledVector(turned, distance)
    camera.lookAt(target)

    if (turned.angleTo(to) < SETTLED_RAD) goal.current = null
  })
}
