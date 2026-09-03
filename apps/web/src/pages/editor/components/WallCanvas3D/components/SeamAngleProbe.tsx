import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { computeFaceTransforms, faceLocalToWorld } from '@crimp-studio/wall-geometry'
import { wallCenteringOffset } from '../utils/wallCentering'
import { publishSeamLabelAnchor } from '../utils/seamLabelAnchor'

/** How far off the plywood the label's anchor floats, in metres, so it projects in front of the seam */
const LABEL_LIFT = 0.05

/**
 * Projects the cursor end of the seam being drawn to a point on the canvas,
 * every frame, for the degree readout beside it. Renders nothing; see
 * `seamLabelAnchor` for why it writes to a box rather than to state.
 */
export function SeamAngleProbe() {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const { wall, drawnSeam } = useWallStore()

  const projected = useRef(new THREE.Vector3())
  const transforms = useMemo(() => computeFaceTransforms(wall.faces), [wall.faces])
  const centering = useMemo(
    () => wallCenteringOffset(wall.width, wall.height),
    [wall.width, wall.height],
  )

  useFrame(() => {
    const seam = drawnSeam?.seam
    const transform = drawnSeam ? transforms[drawnSeam.faceId] : undefined
    if (!seam || !transform) {
      publishSeamLabelAnchor(0, 0, false)
      return
    }

    /* The seam's b end is the one the cursor is nearest: the chord is ordered
       from the anchor toward the cursor */
    projected.current
      .copy(faceLocalToWorld(transform, seam.b[0], seam.b[1], LABEL_LIFT))
      .add(centering)
      .project(camera)
    publishSeamLabelAnchor(
      ((projected.current.x + 1) / 2) * size.width,
      ((1 - projected.current.y) / 2) * size.height,
      projected.current.z < 1,
    )
  })

  return null
}
