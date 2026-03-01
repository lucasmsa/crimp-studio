import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { Hold3D } from './Hold3D'
import { WALL_DEPTH, CM_TO_M } from '../constants/editor3d'
import { useWallInteraction } from '../hooks/useWallInteraction'

interface Wall3DProps {
  onDragStateChange: (isDragging: boolean) => void
}

export function Wall3D({ onDragStateChange }: Wall3DProps) {
  const { wall, selectedHoldId } = useWallStore()

  const wallWidthM = wall.width * CM_TO_M
  const wallHeightM = wall.height * CM_TO_M

  const {
    wallMeshRef,
    isDragging,
    handleWallPointerDown,
    handleHoldPointerDown,
  } = useWallInteraction(wallWidthM, wallHeightM)

  /* Sync isDragging ref to callback so OrbitControls toggle stays responsive */
  const prevDraggingRef = useRef(false)
  useFrame(() => {
    if (isDragging.current !== prevDraggingRef.current) {
      prevDraggingRef.current = isDragging.current
      onDragStateChange(isDragging.current)
    }
  })

  return (
    <group>
      {/* Holds — offset so (0,0) maps to bottom-left of wall */}
      <group position={[-wallWidthM / 2, -wallHeightM / 2, 0]}>
        {wall.holds.map((hold) => (
          <Hold3D
            key={hold.id}
            hold={hold}
            isSelected={hold.id === selectedHoldId}
            onPointerDown={handleHoldPointerDown(hold.id)}
          />
        ))}
      </group>

      {/* Wall surface */}
      <mesh
        ref={wallMeshRef}
        onPointerDown={handleWallPointerDown}
        receiveShadow
      >
        <boxGeometry args={[wallWidthM, wallHeightM, WALL_DEPTH]} />
        <meshStandardMaterial
          color={wall.wallColor}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
    </group>
  )
}
