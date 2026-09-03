import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSpring, easings } from '@react-spring/three'
import type { LeavingPanel } from '@/stores/wallStore'
import { CM_TO_M } from '@crimp-studio/wall-geometry'
import { getToonGradientMap } from '@/lib/three/toon'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { applyFaceUvTransform, PLYWOOD_UV } from '../utils/faceUv'
import { panelGeometry } from '../utils/panelGeometry'
import { getPlywoodTexture } from '../utils/wallTexture'
import { Hold3D } from './Hold3D'

/** How far the offcut swings about its seam before it is gone, in radians */
const FALL_RAD = (120 * Math.PI) / 180
const FALL_MS = 700

const ignorePointer = () => {}

interface LeavingPanel3DProps {
  panel: LeavingPanel
  isDraggingAny: React.RefObject<boolean>
  onLeft: () => void
}

/**
 * Plywood a trim took off, swinging away about the seam it was cut along and
 * fading as it goes, its holds still bolted to it. Drawn in the frame of the
 * panel it came from, since that is the frame its outline is in. Already off
 * the wall as far as the store knows; only the fall is left to draw.
 */
export function LeavingPanel3D({ panel, isDraggingAny, onLeft }: LeavingPanel3DProps) {
  const group = useRef<THREE.Group>(null)
  const material = useRef<THREE.Material>(null)

  /* The same plywood it was a moment ago, so what falls is recognisably the
     piece that was cut off and not a new shape */
  const slab = useMemo(() => {
    const geometry = panelGeometry(panel.outline)
    applyFaceUvTransform(geometry, PLYWOOD_UV)
    return geometry
  }, [panel.outline])
  useEffect(() => () => slab.dispose(), [slab])
  const texture = getPlywoodTexture()

  /* The seam is the hinge. The offcut swings toward the climber, whichever side
     of the seam it is on, which is the sign of the cross product below */
  const hinge = useMemo(() => {
    const [a, b] = [panel.seam.a, panel.seam.b]
    const axis = new THREE.Vector3(b[0] - a[0], b[1] - a[1], 0).normalize()
    const centre = panel.outline.reduce(
      (sum, [u, v]) => sum.add(new THREE.Vector3(u, v, 0)),
      new THREE.Vector3(),
    ).divideScalar(panel.outline.length)
    const toCentre = centre.sub(new THREE.Vector3(a[0], a[1], 0))
    const sign = Math.sign(axis.x * toCentre.y - axis.y * toCentre.x) || 1
    return { axis, pivot: new THREE.Vector3(a[0] * CM_TO_M, a[1] * CM_TO_M, 0), sign }
  }, [panel.seam, panel.outline])

  const { progress } = useSpring({
    from: { progress: 0 },
    to: { progress: 1 },
    config: { duration: FALL_MS, easing: easings.easeInQuad },
    onRest: onLeft,
  })

  useFrame(() => {
    const k = progress.get()
    group.current?.quaternion.setFromAxisAngle(hinge.axis, hinge.sign * k * FALL_RAD)
    if (material.current) material.current.opacity = 1 - k
  })

  return (
    <group ref={group} position={hinge.pivot}>
      <group position={hinge.pivot.clone().negate()}>
        <mesh geometry={slab} castShadow raycast={() => null}>
          {SCENE_STYLE === 'toon' ? (
            <meshToonMaterial
              ref={material}
              color={panel.color}
              map={texture}
              gradientMap={getToonGradientMap(toonConfig.gradientSteps)}
              transparent
            />
          ) : (
            <meshStandardMaterial
              ref={material}
              color={panel.color}
              map={texture}
              roughness={0.85}
              transparent
            />
          )}
        </mesh>
        {panel.holds.map((hold) => (
          <Hold3D
            key={hold.id}
            hold={hold}
            isSelected={false}
            isDimmed
            isDraggingAny={isDraggingAny}
            onPointerDown={ignorePointer}
          />
        ))}
      </group>
    </group>
  )
}
