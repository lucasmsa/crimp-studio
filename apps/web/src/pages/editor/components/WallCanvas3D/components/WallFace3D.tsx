import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import type { DrawnSeam, Hold, LeavingPanel } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { useSceneRoom } from '../hooks/useSceneRoom'
import { Hold3D } from './Hold3D'
import { LeavingPanel3D } from './LeavingPanel3D'
import { SeamOverlay } from './SeamOverlay'
import { CM_TO_M, hingeSegment } from '@crimp-studio/wall-geometry'
import type { WallFace } from '@crimp-studio/wall-geometry'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { SEAM_FLASH_MS, SEAM_LIFT, SEAM_WIDTH } from '../config/seamStyle'
import { getBlurredPlywoodTexture, getPlywoodTexture } from '../utils/wallTexture'
import { getToonGradientMap } from '@/lib/three/toon'
import { createOutlineGeometry } from '@/lib/three/outline'
import { applyFaceUvTransform, PLYWOOD_UV } from '../utils/faceUv'
import { panelGeometry } from '../utils/panelGeometry'

/** How far an unfocused panel fades toward the background */
const DIM_AMOUNT = 0.45
/** How far a panel about to be trimmed off fades toward red */
const DOOM_AMOUNT = 0.5

const INK = new THREE.Color(colors.scene.outline)
const BRIGHT = new THREE.Color(colors.wall.surface)

interface WallFace3DProps {
  face: WallFace
  holds: Hold[]
  /** Holds history took off this panel, drawn popping off until they are done */
  leavingHolds: Hold[]
  /** Offcuts a trim took off this panel, drawn falling until they are done */
  leavingPanels: LeavingPanel[]
  /** A seam being drawn on this panel */
  drawnSeam: DrawnSeam | null
  /** When this panel was made by a blade, so its seam flashes and it opens and settles */
  cutAt: number | null
  selectedHoldId: string | null
  blockingHoldIds: string[]
  deletingHoldIds: string[]
  isDraggingAny: React.RefObject<boolean>
  /** Another panel has the focus, so this one steps back */
  isDimmed: boolean
  /** A trim being drawn would take this panel with the offcut */
  isDoomed: boolean
  /** The angle springs drive this group directly, so it takes no transform props */
  groupRef: React.Ref<THREE.Group>
  meshRef?: React.Ref<THREE.Mesh>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  onPointerEnter: (e: ThreeEvent<PointerEvent>) => void
  onPointerLeave: () => void
  onHoldPointerDown: (holdId: string) => (e: ThreeEvent<PointerEvent>) => void
  onHoldLeft: (holdId: string) => void
  onPanelLeft: (panelId: string) => void
}

const ignorePointer = () => {}

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
  leavingPanels,
  drawnSeam,
  cutAt,
  selectedHoldId,
  blockingHoldIds,
  deletingHoldIds,
  isDraggingAny,
  isDimmed,
  isDoomed,
  groupRef,
  meshRef,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onHoldPointerDown,
  onHoldLeft,
  onPanelLeft,
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
     panel is seen edge-on, which is exactly where focus matters most. A panel a
     trim would take turns red the same way */
  const surfaceColor = useMemo(() => {
    const color = new THREE.Color(face.color)
    if (isDoomed) return color.lerp(new THREE.Color(colors.error), DOOM_AMOUNT)
    return isDimmed ? color.lerp(new THREE.Color(room.bottom), DIM_AMOUNT) : color
  }, [face.color, isDimmed, isDoomed, room.bottom])

  const seam = face.parentId ? hingeSegment(face) : null

  /* A seam a blade just made flashes bright, then is ink like the others */
  const { glow } = useSpring({
    from: { glow: cutAt ? 1 : 0 },
    to: { glow: 0 },
    reset: true,
    config: { duration: SEAM_FLASH_MS },
  })
  const seamColor = glow.to((k) => `#${INK.clone().lerp(BRIGHT, k).getHexString()}`)

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

      {leavingPanels.map((panel) => (
        <LeavingPanel3D
          key={panel.id}
          panel={panel}
          isDraggingAny={isDraggingAny}
          onLeft={() => onPanelLeft(panel.id)}
        />
      ))}

      {drawnSeam && <SeamOverlay drawn={drawnSeam} />}

      {/* Ink line along the hinge, which every face keeps at v = 0. Two panels
          folded flat leave only a hairline between their rims, which reads as
          nothing at all from the front */}
      {seam && (
        <mesh
          position={[((seam.from + seam.to) / 2) * CM_TO_M, SEAM_WIDTH / 2, SEAM_LIFT]}
          raycast={() => null}
        >
          <planeGeometry args={[(seam.to - seam.from) * CM_TO_M, SEAM_WIDTH]} />
          <animated.meshBasicMaterial color={seamColor} />
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
