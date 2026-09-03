import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'
import { WallFace3D } from './WallFace3D'
import { SelectionAnchorProbe } from './SelectionAnchorProbe'
import { SeamAngleProbe } from './SeamAngleProbe'
import { useWallInteraction } from '../hooks/useWallInteraction'
import { useFaceAngleSprings } from '../hooks/useFaceAngleSprings'
import { listFaces } from '@crimp-studio/wall-geometry'
import { wallCenteringOffset } from '../utils/wallCentering'
import { heldHoldWarnings, heldHoldsOnFace } from '../utils/heldHold'

interface Wall3DProps {
  onDragStateChange: (isDragging: boolean) => void
}

export function Wall3D({ onDragStateChange }: Wall3DProps) {
  const {
    wall,
    selectedHoldId,
    selectedFaceId,
    deletingHoldIds,
    blockingHoldIds,
    heldHold,
    leavingHolds,
    dismissLeaving,
    drawnSeam,
    justCut,
    leavingPanels,
    dismissLeavingPanel,
  } = useWallStore()

  /* A bend that stopped flashes; a hold being carried into a neighbour stays
     lit for as long as it is there; so does a hold a seam passes through or a
     trim would take. All arrive the same way here */
  const warned = useMemo(
    () => [
      ...blockingHoldIds,
      ...heldHoldWarnings(heldHold),
      ...(drawnSeam?.blockedHoldIds ?? []),
      ...(drawnSeam?.leavingHoldIds ?? []),
    ],
    [blockingHoldIds, heldHold, drawnSeam],
  )

  const faces = useMemo(() => listFaces(wall.faces), [wall.faces])

  /* The springs are the only writer of face group transforms; see the hook */
  const faceGroups = useRef(new Map<string, THREE.Group>())
  useFaceAngleSprings(wall.faces, faceGroups, justCut?.faceId ?? null)

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
          groupRef={registerFaceGroup(face.id)}
          holds={heldHoldsOnFace(wall.holds, heldHold, face.id)}
          leavingHolds={leavingHolds.filter((hold) => hold.faceId === face.id)}
          leavingPanels={leavingPanels.filter((panel) => panel.faceId === face.id)}
          drawnSeam={drawnSeam?.faceId === face.id ? drawnSeam : null}
          cutAt={justCut?.faceId === face.id ? justCut.at : null}
          selectedHoldId={selectedHoldId}
          blockingHoldIds={warned}
          deletingHoldIds={deletingHoldIds}
          isDraggingAny={isDragging}
          isDimmed={selectedFaceId !== null && face.id !== selectedFaceId}
          isDoomed={drawnSeam?.leavingFaceIds.includes(face.id) ?? false}
          meshRef={registerFaceMesh(face.id)}
          onPointerDown={handleFacePointerDown(face.id)}
          onPointerEnter={handleFacePointerEnter}
          onPointerLeave={handleFacePointerLeave}
          onHoldPointerDown={handleHoldPointerDown}
          onHoldLeft={dismissLeaving}
          onPanelLeft={dismissLeavingPanel}
        />
      ))}

      <SelectionAnchorProbe />
      <SeamAngleProbe />
    </group>
  )
}
