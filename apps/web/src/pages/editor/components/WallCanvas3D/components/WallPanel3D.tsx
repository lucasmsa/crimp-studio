import { useEffect } from 'react'
import * as THREE from 'three'
import type { WallPanel } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { Hold3D } from './Hold3D'
import { WALL_DEPTH } from '../constants/editor3d'
import { useWallInteraction } from '../hooks/useWallInteraction'
import type { PanelLayout } from '../utils/wallLayout'

interface WallPanel3DProps {
  panel: WallPanel
  layout: PanelLayout
  onDragStateChange: (isDragging: boolean) => void
}

export function WallPanel3D({ panel, layout, onDragStateChange }: WallPanel3DProps) {
  const { selectedHoldId } = useWallStore()

  const {
    wallMeshRef,
    isActive,
    isDragging,
    handleWallClick,
    handleHoldPointerDown,
    handleHoldPointerMove,
    handleHoldPointerUp,
  } = useWallInteraction(panel, layout.width, layout.height)

  useEffect(() => {
    onDragStateChange(isDragging)
  }, [isDragging, onDragStateChange])

  return (
    <group position={layout.position} rotation={layout.rotation}>
      {/* Holds — offset so (0,0) maps to bottom-left of panel */}
      <group position={[-layout.width / 2, -layout.height / 2, 0]}>
        {panel.holds.map((hold) => (
          <Hold3D
            key={hold.id}
            hold={hold}
            isSelected={hold.id === selectedHoldId}
            onPointerDown={handleHoldPointerDown(hold.id)}
            onPointerMove={handleHoldPointerMove(hold.id)}
            onPointerUp={handleHoldPointerUp}
          />
        ))}
      </group>

      {/* Wall surface */}
      <mesh ref={wallMeshRef} onPointerDown={handleWallClick} receiveShadow>
        <boxGeometry args={[layout.width, layout.height, WALL_DEPTH]} />
        <meshStandardMaterial
          color={colors.wall.surface}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Active panel edge highlight */}
      {isActive && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(layout.width, layout.height, WALL_DEPTH)]} />
          <lineBasicMaterial color={colors.primary} transparent opacity={0.4} />
        </lineSegments>
      )}
    </group>
  )
}
