import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Hold } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { Hold3D } from './Hold3D'
import { HoldActionsOverlay } from './HoldActionsOverlay'
import { WALL_DEPTH, CM_TO_M } from '../constants/editor3d'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { createFaceTexture } from '../utils/wallTexture'
import { getToonGradientMap } from '@/lib/three/toon'
import { createOutlineGeometry } from '@/lib/three/outline'
import type { WallFace } from '../utils/faceTree'
import type { FaceUvTransform } from '../utils/faceUv'

interface WallFace3DProps {
  face: WallFace
  uvTransform: FaceUvTransform
  holds: Hold[]
  wallColor: string
  selectedHoldId: string | null
  collidingHoldIds: Set<string>
  deletingHoldIds: string[]
  isDraggingAny: React.RefObject<boolean>
  /** The focused face, the one the sidebar is shaping */
  isSelected: boolean
  /** The angle springs drive this group directly, so it takes no transform props */
  groupRef: React.Ref<THREE.Group>
  meshRef?: React.Ref<THREE.Mesh>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onHoldPointerDown: (holdId: string) => (e: ThreeEvent<PointerEvent>) => void
}

/**
 * One flat panel of the wall, with the holds bolted to it. The group carries
 * the face's hinge transform, so everything under it (holds, overlay, outline)
 * rides the angle without any of them knowing about it.
 *
 * The panel extrudes backwards, surface at local z=0: with a centred box, two
 * panels bent apart leave a wedge at the seam, and this puts the fold line on
 * both front surfaces instead.
 */
export function WallFace3D({
  face,
  uvTransform,
  holds,
  wallColor,
  selectedHoldId,
  collidingHoldIds,
  deletingHoldIds,
  isDraggingAny,
  isSelected,
  groupRef,
  meshRef,
  onPointerDown,
  onHoldPointerDown,
}: WallFace3DProps) {
  const widthM = face.width * CM_TO_M
  const heightM = face.height * CM_TO_M

  /* T-nut grid + plywood seams, phased by where this face sits on the sheet */
  const texture = useMemo(() => createFaceTexture(uvTransform), [uvTransform])

  /* The focused panel wears a heavier rim. Recoloring it instead would have to
     survive a beige wall and a beige primary, and ink always reads */
  const outlineGeometry = useMemo(() => {
    if (SCENE_STYLE !== 'toon') return null
    const box = new THREE.BoxGeometry(widthM, heightM, WALL_DEPTH)
    const thickness = isSelected ? toonConfig.wallOutline * 2.4 : toonConfig.wallOutline
    const outline = createOutlineGeometry(box, thickness)
    box.dispose()
    return outline
  }, [widthM, heightM, isSelected])

  const selectedHold = selectedHoldId ? holds.find((h) => h.id === selectedHoldId) : undefined

  return (
    <group ref={groupRef}>
      {holds.map((hold) => (
        <Hold3D
          key={hold.id}
          hold={hold}
          isSelected={hold.id === selectedHoldId}
          isColliding={collidingHoldIds.has(hold.id)}
          isDeleting={deletingHoldIds.includes(hold.id)}
          isDraggingAny={isDraggingAny}
          onPointerDown={onHoldPointerDown(hold.id)}
        />
      ))}

      {selectedHold && <HoldActionsOverlay hold={selectedHold} />}

      <mesh
        ref={meshRef}
        position={[widthM / 2, heightM / 2, -WALL_DEPTH / 2]}
        onPointerDown={onPointerDown}
        receiveShadow
      >
        <boxGeometry args={[widthM, heightM, WALL_DEPTH]} />
        {SCENE_STYLE === 'toon' ? (
          <>
            <meshToonMaterial
              color={wallColor}
              map={texture}
              gradientMap={getToonGradientMap(toonConfig.gradientSteps)}
            />
            {/* Inverted hull rim around the panel */}
            <mesh geometry={outlineGeometry!} raycast={() => null}>
              <meshBasicMaterial color={colors.scene.outline} side={THREE.BackSide} />
            </mesh>
          </>
        ) : (
          <meshStandardMaterial
            color={wallColor}
            map={texture}
            roughness={0.85}
            metalness={0.05}
          />
        )}
      </mesh>
    </group>
  )
}
