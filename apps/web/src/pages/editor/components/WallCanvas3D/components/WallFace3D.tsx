import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Hold } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { useSceneRoom } from '../hooks/useSceneRoom'
import { Hold3D } from './Hold3D'
import { CM_TO_M, hingeSegment, WALL_DEPTH } from '@crimp-studio/wall-geometry'
import type { Point2, WallFace } from '@crimp-studio/wall-geometry'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { getBlurredPlywoodTexture, getPlywoodTexture } from '../utils/wallTexture'
import { getToonGradientMap } from '@/lib/three/toon'
import { createOutlineGeometry } from '@/lib/three/outline'
import { applyFaceUvTransform, PLYWOOD_UV } from '../utils/faceUv'

/** How far an unfocused panel fades toward the background */
const DIM_AMOUNT = 0.45

/** Seam line thickness in metres, and how far it floats off the surface */
const SEAM_WIDTH = 0.018
const SEAM_LIFT = 0.002

interface WallFace3DProps {
  face: WallFace
  holds: Hold[]
  /** Holds history took off this panel, drawn popping off until they are done */
  leavingHolds: Hold[]
  selectedHoldId: string | null
  blockingHoldIds: string[]
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
  onHoldLeft: (holdId: string) => void
}

const ignorePointer = () => {}

/**
 * The panel as plywood: its outline at the surface, z = 0 in the face frame,
 * extruded backwards through the sheet's thickness. Built in the face frame
 * itself, so a pointer hit converts to face coordinates with no offset.
 */
function panelGeometry(outline: Point2[]): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u * CM_TO_M, v * CM_TO_M)))
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: WALL_DEPTH, bevelEnabled: false })
  geometry.translate(0, 0, -WALL_DEPTH)
  return geometry
}

/**
 * One flat panel of the wall, with the holds bolted to it. The group carries
 * the face's hinge transform, so everything under it (holds, overlay, outline)
 * rides the angle without any of them knowing about it.
 *
 * The panel extrudes backwards, surface at local z=0: with a centred slab, two
 * panels bent apart leave a wedge at the seam, and this puts the fold line on
 * both front surfaces instead.
 */
export function WallFace3D({
  face,
  holds,
  leavingHolds,
  selectedHoldId,
  blockingHoldIds,
  deletingHoldIds,
  isDraggingAny,
  isDimmed,
  groupRef,
  meshRef,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onHoldPointerDown,
  onHoldLeft,
}: WallFace3DProps) {
  const room = useSceneRoom()

  /* Unfocused panels lose their detail rather than their colour: a soft
     surface reads as out of focus, and swapping a prebuilt texture costs
     nothing per frame the way a blur pass would */
  const texture = isDimmed ? getBlurredPlywoodTexture() : getPlywoodTexture()

  /* The slab carries metre-space UVs from its extrusion; the plywood tile is
     laid over them one tile per panel width, from this panel's own corner */
  const slab = useMemo(() => {
    const geometry = panelGeometry(face.outline)
    applyFaceUvTransform(geometry, PLYWOOD_UV)
    return geometry
  }, [face.outline])

  useEffect(() => () => slab.dispose(), [slab])

  const outlineGeometry = useMemo(() => {
    if (SCENE_STYLE !== 'toon') return null
    const source = panelGeometry(face.outline)
    const outline = createOutlineGeometry(source, toonConfig.wallOutline)
    source.dispose()
    return outline
  }, [face.outline])

  /* Focus reads by dimming the rest of the wall rather than by thickening this
     panel's rim: a hull stroke is geometry, so it juts out flat wherever the
     panel is seen edge-on, which is exactly where focus matters most */
  const surfaceColor = useMemo(() => {
    const color = new THREE.Color(face.color)
    return isDimmed ? color.lerp(new THREE.Color(room.bottom), DIM_AMOUNT) : color
  }, [face.color, isDimmed, room.bottom])

  const seam = face.parentId ? hingeSegment(face) : null

  return (
    <group ref={groupRef}>
      {holds.map((hold) => (
        <Hold3D
          key={hold.id}
          hold={hold}
          isSelected={hold.id === selectedHoldId}
          isBlocking={blockingHoldIds.includes(hold.id)}
          isDeleting={deletingHoldIds.includes(hold.id)}
          isDimmed={isDimmed}
          isDraggingAny={isDraggingAny}
          onPointerDown={onHoldPointerDown(hold.id)}
        />
      ))}

      {/* Already off the wall; only the pop-off is left to draw. Not
          selectable, not a pointer target */}
      {leavingHolds.map((hold) => (
        <Hold3D
          key={`leaving-${hold.id}`}
          hold={hold}
          isSelected={false}
          isDeleting
          isDimmed={isDimmed}
          isDraggingAny={isDraggingAny}
          onPointerDown={ignorePointer}
          onLeft={() => onHoldLeft(hold.id)}
        />
      ))}

      {/* Ink line along the hinge, which every face keeps at v = 0. Two panels
          folded flat leave only a hairline between their rims, which reads as
          nothing at all from the front */}
      {seam && (
        <mesh
          position={[((seam.from + seam.to) / 2) * CM_TO_M, SEAM_WIDTH / 2, SEAM_LIFT]}
          raycast={() => null}
        >
          <planeGeometry args={[(seam.to - seam.from) * CM_TO_M, SEAM_WIDTH]} />
          <meshBasicMaterial color={colors.scene.outline} />
        </mesh>
      )}

      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        castShadow
        receiveShadow
        geometry={slab}
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
