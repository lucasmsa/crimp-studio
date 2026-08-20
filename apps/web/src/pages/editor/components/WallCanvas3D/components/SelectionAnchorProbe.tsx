import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { computeFaceTransforms } from '@crimp-studio/wall-geometry'
import { faceSelectionAnchor, holdSelectionAnchor } from '../utils/selectionAnchorPoint'
import { wallCenteringOffset } from '../utils/wallCentering'
import { publishSelectionAnchor } from '../utils/selectionAnchor'

/**
 * Projects whatever is selected to a point on the canvas, every frame, for the
 * line that runs from the pinned controls to it.
 *
 * It renders nothing. The projection has to happen inside the scene, where the
 * camera is, but the line it feeds is DOM, so this writes to a mutable box
 * rather than to state (see `selectionAnchor`).
 */
export function SelectionAnchorProbe() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const { wall, selectedHoldId, selectedFaceId } = useWallStore()

  const projected = useRef(new THREE.Vector3())

  const anchor = useMemo(() => {
    const transforms = computeFaceTransforms(wall.faces)
    const hold = selectedHoldId ? wall.holds.find((h) => h.id === selectedHoldId) : null

    if (hold) return holdSelectionAnchor(transforms, hold)
    if (selectedFaceId) return faceSelectionAnchor(wall.faces, transforms, selectedFaceId)
    return null
  }, [wall.faces, wall.holds, selectedHoldId, selectedFaceId])

  const centering = useMemo(
    () => wallCenteringOffset(wall.width, wall.height),
    [wall.width, wall.height],
  )

  useFrame(() => {
    if (!anchor) {
      publishSelectionAnchor(0, 0, false)
      return
    }

    projected.current.copy(anchor).add(centering).project(camera)
    publishSelectionAnchor(
      ((projected.current.x + 1) / 2) * size.width,
      ((1 - projected.current.y) / 2) * size.height,
      projected.current.z < 1,
    )
  })

  return null
}
