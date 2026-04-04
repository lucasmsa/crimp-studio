import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { Hold3D } from './Hold3D'
import { WALL_DEPTH, CM_TO_M } from '../constants/editor3d'
import { useWallInteraction } from '../hooks/useWallInteraction'
import { checkCollision } from '../utils/holdCollision'

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

  /* Build set of all hold IDs that overlap with at least one other hold */
  const collidingHoldIds = useMemo(() => {
    const ids = new Set<string>()
    const holds = wall.holds
    for (let i = 0; i < holds.length; i++) {
      for (let j = i + 1; j < holds.length; j++) {
        if (checkCollision(holds[i], holds[j])) {
          ids.add(holds[i].id)
          ids.add(holds[j].id)
        }
      }
    }
    return ids
  }, [wall.holds])

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
            isColliding={collidingHoldIds.has(hold.id)}
            isDraggingAny={isDragging}
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
