import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { WallFace3D } from './WallFace3D'
import { SelectionAnchorProbe } from './SelectionAnchorProbe'
import { useWallInteraction } from '../hooks/useWallInteraction'
import { useFaceAngleSprings } from '../hooks/useFaceAngleSprings'
import { listFaces } from '@crimp-studio/wall-geometry'
import { computeFaceUvTransform } from '../utils/faceUv'
import { wallCenteringOffset } from '../utils/wallCentering'
import { heldHoldWarnings, heldHoldsOnFace } from '../utils/heldHold'

interface Wall3DProps {
  onDragStateChange: (isDragging: boolean) => void
}

export function Wall3D({ onDragStateChange }: Wall3DProps) {
  const { wall, selectedHoldId, selectedFaceId, deletingHoldIds, blockingHoldIds, heldHold } =
    useWallStore()

  /* A bend that stopped flashes; a hold being carried into a neighbour stays
     lit for as long as it is there. Both arrive the same way here */
  const warned = useMemo(
    () => [...blockingHoldIds, ...heldHoldWarnings(heldHold)],
    [blockingHoldIds, heldHold],
  )

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
    handleFacePointerEnter,
    handleFacePointerLeave,
    handleHoldPointerDown,
  } = useWallInteraction()

  /* Sync isDragging ref to callback so OrbitControls toggle stays responsive */
  const prevDraggingRef = useRef(false)
  useFrame(() => {
    if (isDragging.current !== prevDraggingRef.current) {
      prevDraggingRef.current = isDragging.current
      onDragStateChange(isDragging.current)
    }
  })

  const centering = useMemo(
    () => wallCenteringOffset(wall.width, wall.height),
    [wall.width, wall.height],
  )

  return (
    <group position={centering}>
      {faces.map((face) => (
        <WallFace3D
          key={face.id}
          face={face}
          uvTransform={uvTransforms[face.id]}
          groupRef={registerFaceGroup(face.id)}
          holds={heldHoldsOnFace(wall.holds, heldHold, face.id)}
          selectedHoldId={selectedHoldId}
          blockingHoldIds={warned}
          deletingHoldIds={deletingHoldIds}
          isDraggingAny={isDragging}
          isDimmed={selectedFaceId !== null && face.id !== selectedFaceId}
          meshRef={registerFaceMesh(face.id)}
          onPointerDown={handleFacePointerDown(face.id)}
          onPointerEnter={handleFacePointerEnter}
          onPointerLeave={handleFacePointerLeave}
          onHoldPointerDown={handleHoldPointerDown}
        />
      ))}

      <SelectionAnchorProbe />
    </group>
  )
}
