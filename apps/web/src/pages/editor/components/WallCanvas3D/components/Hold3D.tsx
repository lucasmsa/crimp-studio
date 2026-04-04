import { useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
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
  isColliding?: boolean
  isDraggingAny: React.RefObject<boolean>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
}

export function Hold3D({ hold, isSelected, isColliding, isDraggingAny, onPointerDown }: Hold3DProps) {
  const [isHovered, setIsHovered] = useState(false)

  const holdColor = hold.color ?? colors.holds[hold.type]
  const config = holdGeometryConfigs[hold.type]
  /* Suppress hover effect while any hold is being dragged */
  const visual = getHoldVisualState({ isSelected, isHovered: isHovered && !isDraggingAny.current, isColliding })
  const useFlatShading = FLAT_SHADED_TYPES.has(hold.type)
  const holdScale = hold.size * CM_TO_M * config.sizeMultiplier

  const geometry = useMemo(
    () => createHoldGeometry(hold.type, holdScale),
    [hold.type, holdScale],
  )

  const gripTexture = useMemo(() => getGripTexture(), [])

  const updateHold = useWallStore((s) => s.updateHold)

  /* Measure XY bounding box after rotation and report to store for collision */
  useEffect(() => {
    const rotated = geometry.clone()
    rotated.rotateZ(THREE.MathUtils.degToRad(hold.rotation ?? 0))
    rotated.computeBoundingBox()
    const box = rotated.boundingBox!

    const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x)) / CM_TO_M
    const halfH = Math.max(Math.abs(box.min.y), Math.abs(box.max.y)) / CM_TO_M

    updateHold(hold.id, { collisionBox: { halfW, halfH } })
    rotated.dispose()
  }, [geometry, hold.id, hold.rotation, updateHold])

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

  const posX = hold.x * CM_TO_M
  const posY = hold.y * CM_TO_M
  const posZ = WALL_DEPTH / 2 - HOLD_EMBED_DEPTH + config.zOffset

  const { scale, px, py } = useSpring({
    scale: visual.scale,
    px: posX,
    py: posY,
    from: { scale: 0, px: posX, py: posY },
    /* Snappy spring for snap-back animation, immediate during drag */
    config: { tension: 300, friction: 15 },
    immediate: (key: string) => (key === 'px' || key === 'py') && isDraggingAny.current,
  })

  const rotation: [number, number, number] = [
    0, 0, THREE.MathUtils.degToRad(hold.rotation ?? 0),
  ]

  return (
    <animated.group position-x={px} position-y={py} position-z={posZ}>
      {/* Invisible hit sphere — captures all pointer events reliably */}
      <mesh
        visible={false}
        position={[hitCenter.x, hitCenter.y, hitCenter.z]}
        onPointerDown={onPointerDown}
        onPointerEnter={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          if (!isDraggingAny.current) document.body.style.cursor = 'pointer'
        }}
        onPointerLeave={() => {
          setIsHovered(false)
          if (!isDraggingAny.current) document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[hitRadius, 8, 8]} />
      </mesh>

      {/* Visible hold mesh */}
      <animated.mesh
        geometry={geometry}
        rotation={rotation}
        scale={scale}
        castShadow
        raycast={() => null}
      >
        <meshStandardMaterial
          color={visual.colorOverride ?? holdColor}
          roughness={0.75}
          metalness={0.05}
          flatShading={useFlatShading}
          bumpMap={gripTexture}
          bumpScale={1.0}
          roughnessMap={gripTexture}
          emissive={visual.colorOverride ?? '#ffffff'}
          emissiveIntensity={visual.emissiveIntensity}
          transparent={visual.opacity < 1}
          opacity={visual.opacity}
        />
      </animated.mesh>
    </animated.group>
  )
}
