import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Hold } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { Hold3D } from './Hold3D'
import { HoldActionsOverlay } from './HoldActionsOverlay'
import { WALL_DEPTH, CM_TO_M } from '../constants/editor3d'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { getPlywoodTexture } from '../utils/wallTexture'
import { getToonGradientMap } from '@/lib/three/toon'
import { createOutlineGeometry } from '@/lib/three/outline'
import type { WallFace } from '../utils/faceTree'
import type { FaceUvTransform } from '../utils/faceUv'
import { applyFaceUvTransform } from '../utils/faceUv'

/** How far an unfocused panel fades toward the background */
const DIM_AMOUNT = 0.55

/** Seam line thickness in metres, and how far it floats off the surface */
const SEAM_WIDTH = 0.018
const SEAM_LIFT = 0.002

interface WallFace3DProps {
  face: WallFace
  uvTransform: FaceUvTransform
  holds: Hold[]
  wallColor: string
  selectedHoldId: string | null
  collidingHoldIds: Set<string>
  deletingHoldIds: string[]
  isDraggingAny: React.RefObject<boolean>
  /** Another panel has the focus, so this one steps back */
  isDimmed: boolean
  /** The angle springs drive this group directly, so it takes no transform props */
  groupRef: React.Ref<THREE.Group>
  meshRef?: React.Ref<THREE.Mesh>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave: () => void
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
  isDimmed,
  groupRef,
  meshRef,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onHoldPointerDown,
}: WallFace3DProps) {
  const widthM = face.width * CM_TO_M
  const heightM = face.height * CM_TO_M

  const texture = getPlywoodTexture()

  /* The panel slab, with the T-nut grid phased by where this face sits on the
     unrolled sheet so the pattern runs on across a seam */
  const panelGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(widthM, heightM, WALL_DEPTH)
    applyFaceUvTransform(box, uvTransform)
    return box
  }, [widthM, heightM, uvTransform])

  useEffect(() => () => panelGeometry.dispose(), [panelGeometry])

  const outlineGeometry = useMemo(() => {
    if (SCENE_STYLE !== 'toon') return null
    const box = new THREE.BoxGeometry(widthM, heightM, WALL_DEPTH)
    const outline = createOutlineGeometry(box, toonConfig.wallOutline)
    box.dispose()
    return outline
  }, [widthM, heightM])

  /* Focus reads by dimming the rest of the wall rather than by thickening this
     panel's rim: a hull stroke is geometry, so it juts out flat wherever the
     panel is seen edge-on, which is exactly where focus matters most */
  const surfaceColor = useMemo(() => {
    const color = new THREE.Color(wallColor)
    return isDimmed ? color.lerp(new THREE.Color(colors.dark.background), DIM_AMOUNT) : color
  }, [wallColor, isDimmed])

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

      {/* Ink line along the hinge. Two panels folded flat leave only a hairline
          between their rims, which reads as nothing at all from the front */}
      {face.hinge && (
        <mesh
          position={
            face.hinge === 'bottom'
              ? [widthM / 2, SEAM_WIDTH / 2, SEAM_LIFT]
              : [SEAM_WIDTH / 2, heightM / 2, SEAM_LIFT]
          }
          raycast={() => null}
        >
          <planeGeometry
            args={
              face.hinge === 'bottom' ? [widthM, SEAM_WIDTH] : [SEAM_WIDTH, heightM]
            }
          />
          <meshBasicMaterial color={colors.scene.outline} />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        position={[widthM / 2, heightM / 2, -WALL_DEPTH / 2]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        castShadow
        receiveShadow
        geometry={panelGeometry}
      >
        {SCENE_STYLE === 'toon' ? (
          <>
            {/* Shadow from the back face: a panel is 8cm of plywood, so its far
                side puts that thickness between caster and receiver */}
            <meshToonMaterial
              color={surfaceColor}
              map={texture}
              gradientMap={getToonGradientMap(toonConfig.gradientSteps)}
              shadowSide={THREE.BackSide}
            />
            {/* Inverted hull rim around the panel */}
            <mesh geometry={outlineGeometry!} raycast={() => null}>
              <meshBasicMaterial color={colors.scene.outline} side={THREE.BackSide} />
            </mesh>
          </>
        ) : (
          <meshStandardMaterial
            color={surfaceColor}
            map={texture}
            roughness={0.85}
            metalness={0.05}
          />
        )}
      </mesh>
    </group>
  )
}
