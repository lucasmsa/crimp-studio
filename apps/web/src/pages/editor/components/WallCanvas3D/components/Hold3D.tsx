import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Hold } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { createHoldGeometry } from '../utils/holdGeometry'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { getHoldVisualState } from '../config/holdVisualConfig'
import { CM_TO_M, HOLD_SURFACE_OFFSET } from '../constants/editor3d'

interface Hold3DProps {
  hold: Hold
  isSelected: boolean
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void
  onPointerUp: () => void
}

export function Hold3D({
  hold,
  isSelected,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Hold3DProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)

  const color = colors.holds[hold.type]
  const config = holdGeometryConfigs[hold.type]
  const visual = getHoldVisualState({ isSelected, isHovered })

  const geometry = useMemo(
    () => createHoldGeometry(hold.type, hold.size * CM_TO_M * config.sizeMultiplier),
    [hold.type, hold.size, config.sizeMultiplier],
  )

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[
        hold.x * CM_TO_M,
        hold.y * CM_TO_M,
        HOLD_SURFACE_OFFSET,
      ]}
      rotation={[0, 0, THREE.MathUtils.degToRad(hold.rotation ?? 0)]}
      scale={visual.scale}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
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
      <meshStandardMaterial
        color={color}
        roughness={0.9}
        metalness={0.1}
        flatShading
        emissive={visual.emissive}
        emissiveIntensity={visual.emissiveIntensity}
      />
    </mesh>
  )
}
