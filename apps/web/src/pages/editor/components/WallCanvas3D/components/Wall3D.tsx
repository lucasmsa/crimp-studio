import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { WallFace3D } from './WallFace3D'
import { WALL_DEPTH, CM_TO_M } from '../constants/editor3d'
import { useWallInteraction } from '../hooks/useWallInteraction'
import { useFaceAngleSprings } from '../hooks/useFaceAngleSprings'
import { checkCollision } from '../utils/holdCollision'
import { listFaces } from '../utils/faceTree'
import { computeFaceUvTransform } from '../utils/faceUv'

interface Wall3DProps {
  onDragStateChange: (isDragging: boolean) => void
}

export function Wall3D({ onDragStateChange }: Wall3DProps) {
  const { wall, selectedHoldId, selectedFaceId, deletingHoldIds } = useWallStore()

  const faces = useMemo(() => listFaces(wall.faces), [wall.faces])

  const uvTransforms = useMemo(
    () =>
      Object.fromEntries(
        faces.map((face) => [face.id, computeFaceUvTransform(wall.faces, face.id)]),
      ),
    [faces, wall.faces],
  )

  /* The springs are the only writer of face group transforms; see the hook */
  const faceGroups = useRef(new Map<string, THREE.Group>())
  useFaceAngleSprings(wall.faces, faceGroups)

  const registerFaceGroup = useCallback(
    (faceId: string) => (group: THREE.Group | null) => {
      if (group) faceGroups.current.set(faceId, group)
      else faceGroups.current.delete(faceId)
    },
    [],
  )

  const {
    registerFaceMesh,
    isDragging,
    handleFacePointerDown,
    handleHoldPointerDown,
  } = useWallInteraction()

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

  /* Wall space puts the root face's bottom-left corner at the origin; this
     offset re-centers the whole profile on screen until the camera frames it
     from the computed profile instead */
  const centeringOffset: [number, number, number] = [
    (-wall.width * CM_TO_M) / 2,
    (-wall.height * CM_TO_M) / 2,
    WALL_DEPTH / 2,
  ]

  return (
    <group position={centeringOffset}>
      {faces.map((face) => (
        <WallFace3D
          key={face.id}
          face={face}
          uvTransform={uvTransforms[face.id]}
          groupRef={registerFaceGroup(face.id)}
          holds={wall.holds.filter((hold) => hold.faceId === face.id)}
          wallColor={wall.wallColor}
          selectedHoldId={selectedHoldId}
          collidingHoldIds={collidingHoldIds}
          deletingHoldIds={deletingHoldIds}
          isDraggingAny={isDragging}
          isSelected={face.id === selectedFaceId}
          meshRef={registerFaceMesh(face.id)}
          onPointerDown={handleFacePointerDown(face.id)}
          onHoldPointerDown={handleHoldPointerDown}
        />
      ))}
    </group>
  )
}
