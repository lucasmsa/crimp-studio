import { useMemo } from 'react'
import * as THREE from 'three'
import type { DrawnSeam } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { CM_TO_M } from '@crimp-studio/wall-geometry'
import { getHatchTexture } from '../utils/hatchTexture'
import { panelShape } from '../utils/panelGeometry'
import { SEAM_LIFT, SEAM_WIDTH } from '../config/seamStyle'

/** The drawn seam is a little bolder than a finished one, since it is the thing being aimed */
const DRAWN_SEAM_WIDTH = SEAM_WIDTH * 1.5
/** How much of the offcut the hatching covers, so the plywood still reads through it */
const HATCH_OPACITY = 0.55

interface SeamOverlayProps {
  drawn: DrawnSeam
}

/**
 * The seam being drawn, on the plywood: a line through where the panel was
 * pressed and where the cursor is, run out to the border both ways, in ink
 * where it can be cut and red where it cannot. A trim also hatches the piece
 * that would go (ADR-011).
 */
export function SeamOverlay({ drawn }: SeamOverlayProps) {
  const offcutShape = useMemo(
    () => (drawn.offcut ? panelShape(drawn.offcut) : null),
    [drawn.offcut],
  )

  if (!drawn.seam) return null

  const { a, b } = drawn.seam
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]) * CM_TO_M
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0])
  const color = drawn.clear ? colors.scene.outline : colors.error

  return (
    <>
      {offcutShape && (
        <mesh position-z={SEAM_LIFT} raycast={() => null}>
          <shapeGeometry args={[offcutShape]} />
          <meshBasicMaterial
            map={getHatchTexture()}
            color={color}
            transparent
            opacity={HATCH_OPACITY}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      <mesh
        position={[((a[0] + b[0]) / 2) * CM_TO_M, ((a[1] + b[1]) / 2) * CM_TO_M, 2 * SEAM_LIFT]}
        rotation-z={angle}
        raycast={() => null}
      >
        <planeGeometry args={[length, DRAWN_SEAM_WIDTH]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </>
  )
}
