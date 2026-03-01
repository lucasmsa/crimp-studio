import { useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import type { Hold } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { createHoldGeometry, createGripTexture, FLAT_SHADED_TYPES } from '../utils/holdGeometry'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { getHoldVisualState } from '../config/holdVisualConfig'
import { CM_TO_M, WALL_DEPTH, HOLD_EMBED_DEPTH } from '../constants/editor3d'

/* Shared grip texture — created once, reused across all holds */
let sharedGripTexture: THREE.CanvasTexture | null = null
function getGripTexture(): THREE.CanvasTexture {
  if (!sharedGripTexture) sharedGripTexture = createGripTexture()
  return sharedGripTexture
}

interface Hold3DProps {
  hold: Hold
  isSelected: boolean
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
}

export function Hold3D({ hold, isSelected, onPointerDown }: Hold3DProps) {
  const [isHovered, setIsHovered] = useState(false)

  const holdColor = hold.color ?? colors.holds[hold.type]
  const config = holdGeometryConfigs[hold.type]
  const visual = getHoldVisualState({ isSelected, isHovered })
  const useFlatShading = FLAT_SHADED_TYPES.has(hold.type)
  const holdScale = hold.size * CM_TO_M * config.sizeMultiplier

  const geometry = useMemo(
    () => createHoldGeometry(hold.type, holdScale),
    [hold.type, holdScale],
  )

  const gripTexture = useMemo(() => getGripTexture(), [])

  /* Compute bounding sphere radius for invisible hit area */
  const hitRadius = useMemo(() => {
    geometry.computeBoundingSphere()
    const r = geometry.boundingSphere?.radius ?? holdScale
    return r * 1.2
  }, [geometry, holdScale])

  /* Hit sphere center offset — geometry back face is at z=0, so center is at bounding sphere center */
  const hitCenter = useMemo(() => {
    geometry.computeBoundingBox()
    const box = geometry.boundingBox!
    return new THREE.Vector3(0, 0, (box.max.z - box.min.z) / 2)
  }, [geometry])

  const { scale } = useSpring({
    scale: visual.scale,
    from: { scale: 0 },
    config: { tension: 300, friction: 15 },
  })

  const position: [number, number, number] = [
    hold.x * CM_TO_M,
    hold.y * CM_TO_M,
    WALL_DEPTH / 2 - HOLD_EMBED_DEPTH + config.zOffset,
  ]

  const rotation: [number, number, number] = [
    0, 0, THREE.MathUtils.degToRad(hold.rotation ?? 0),
  ]

  return (
    <group position={position}>
      {/* Invisible hit sphere — captures all pointer events reliably */}
      <mesh
        visible={false}
        position={[hitCenter.x, hitCenter.y, hitCenter.z]}
        onPointerDown={onPointerDown}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          setIsHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[hitRadius, 8, 8]} />
      </mesh>

      {/* Visible hold mesh — emissive glow for selection/hover feedback */}
      <animated.mesh
        geometry={geometry}
        rotation={rotation}
        scale={scale}
        castShadow
        raycast={() => null}
      >
        <meshStandardMaterial
          color={holdColor}
          roughness={0.75}
          metalness={0.05}
          flatShading={useFlatShading}
          bumpMap={gripTexture}
          bumpScale={1.0}
          roughnessMap={gripTexture}
          emissive="#ffffff"
          emissiveIntensity={visual.emissiveIntensity}
        />
      </animated.mesh>
    </group>
  )
}
