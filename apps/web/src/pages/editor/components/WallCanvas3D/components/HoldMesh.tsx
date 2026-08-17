import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { animated, useSpring } from '@react-spring/three'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { createGripTexture } from '../utils/holdGeometry'
import { getToonGradientMap } from '@/lib/three/toon'
import { createOutlineGeometry } from '@/lib/three/outline'
import { computeHitCenter, computeHitRadius } from '../utils/holdHitArea'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { getHoldVisualState } from '../config/holdVisualConfig'
import { SCENE_STYLE, toonConfig } from '../config/sceneStyleConfig'
import { CM_TO_M, HOLD_EMBED_DEPTH } from '../constants/editor3d'
import { useHoldHover } from '../hooks/useHoldHover'
import { useReportCollisionBox } from '../hooks/useReportCollisionBox'

/* Shared grip texture — created once, reused across all holds */
let sharedGripTexture: THREE.CanvasTexture | null = null
function getGripTexture(): THREE.CanvasTexture {
  if (!sharedGripTexture) sharedGripTexture = createGripTexture()
  return sharedGripTexture
}

export interface HoldMeshProps {
  hold: Hold
  geometry: THREE.BufferGeometry
  flatShading: boolean
  isSelected: boolean
  isColliding?: boolean
  /** Plays the pop-off exit animation, then removes the hold from the store */
  isDeleting?: boolean
  isDraggingAny: React.RefObject<boolean>
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void
}

/**
 * Shared visual for a hold on the wall: hit sphere, spring animations, and
 * the textured mesh. Geometry comes pre-built (procedural or GLB-backed)
 * with its back face at z=0.
 */
export function HoldMesh({
  hold,
  geometry,
  flatShading,
  isSelected,
  isColliding,
  isDeleting = false,
  isDraggingAny,
  onPointerDown,
}: HoldMeshProps) {
  const { isHovered, onPointerEnter, onPointerLeave } = useHoldHover(isDraggingAny)
  const removeHold = useWallStore((s) => s.removeHold)

  const holdColor = hold.color ?? colors.holds[hold.type]
  const config = holdGeometryConfigs[hold.type]
  /* Suppress hover effect while any hold is being dragged */
  const visual = getHoldVisualState({
    isSelected,
    isHovered: isHovered && !isDraggingAny.current,
    isColliding,
  })

  useReportCollisionBox(hold, geometry)

  /* GLB hold geometry is STL-derived and has no UVs; sampling the grip maps
     without them corrupts the shading (flat plastic look, black under some
     rigs). Only procedural geometries get the grip texture. */
  const hasUVs = geometry.hasAttribute('uv')
  const gripTexture = useMemo(() => (hasUVs ? getGripTexture() : null), [hasUVs])
  /* minZ must clear HOLD_EMBED_DEPTH: the hold sits that far into the wall,
     so a hull floor below it is depth-culled and the stroke detaches wherever
     the silhouette relies on the base ring (bulging holds, upper contours) */
  const outlineGeometry = useMemo(
    () =>
      SCENE_STYLE === 'toon'
        ? createOutlineGeometry(geometry, toonConfig.holdOutline, {
            minZ: HOLD_EMBED_DEPTH + 0.002,
          })
        : null,
    [geometry],
  )
  const hitRadius = useMemo(() => computeHitRadius(geometry), [geometry])
  const hitCenter = useMemo(() => computeHitCenter(geometry), [geometry])

  const posX = hold.u * CM_TO_M
  const posY = hold.v * CM_TO_M
  /* Face frames put the surface at local z=0, so the hold only clears the
     embed depth; the panel itself extrudes backwards behind it */
  const posZ = -HOLD_EMBED_DEPTH + config.zOffset

  const rotationZ = THREE.MathUtils.degToRad(hold.rotation ?? 0)

  const { scale, px, py, rz } = useSpring({
    /* Delete: plain shrink to zero, then remove on rest */
    scale: isDeleting ? 0 : visual.scale,
    rz: rotationZ,
    px: posX,
    py: posY,
    from: { scale: 0, px: posX, py: posY, rz: rotationZ },
    /* Snappy spring; the delete shrink clamps so scale never overshoots
       below zero (which flips the mesh inside-out for a frame) */
    config: (key: string) =>
      key === 'scale' && isDeleting
        ? { tension: 300, friction: 26, clamp: true }
        : { tension: 300, friction: 15 },
    immediate: (key: string) => (key === 'px' || key === 'py') && isDraggingAny.current,
    onRest: () => {
      if (isDeleting) removeHold(hold.id)
    },
  })

  return (
    <animated.group position-x={px} position-y={py} position-z={posZ}>
      {/* Invisible hit sphere — captures all pointer events reliably */}
      <mesh
        visible={false}
        position={[hitCenter.x, hitCenter.y, hitCenter.z]}
        onPointerDown={onPointerDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <sphereGeometry args={[hitRadius, 8, 8]} />
      </mesh>

      {/* Visible hold mesh */}
      <animated.mesh
        geometry={geometry}
        rotation-z={rz}
        scale={scale}
        castShadow
        receiveShadow
        raycast={() => null}
      >
        {SCENE_STYLE === 'toon' ? (
          <>
            <meshToonMaterial
              color={visual.colorOverride ?? holdColor}
              gradientMap={getToonGradientMap(toonConfig.gradientSteps)}
              emissive={visual.colorOverride ?? '#ffffff'}
              emissiveIntensity={visual.emissiveIntensity}
              transparent={visual.opacity < 1}
              opacity={visual.opacity}
            />
            {/* Inverted hull baked along smoothed normals for a uniform stroke */}
            <mesh geometry={outlineGeometry!} raycast={() => null}>
              <meshBasicMaterial color={colors.scene.outline} side={THREE.BackSide} />
            </mesh>
          </>
        ) : (
          <meshStandardMaterial
            color={visual.colorOverride ?? holdColor}
            roughness={0.75}
            metalness={0.05}
            flatShading={flatShading}
            bumpMap={gripTexture ?? undefined}
            bumpScale={gripTexture ? 1.0 : 0}
            roughnessMap={gripTexture ?? undefined}
            emissive={visual.colorOverride ?? '#ffffff'}
            emissiveIntensity={visual.emissiveIntensity}
            transparent={visual.opacity < 1}
            opacity={visual.opacity}
          />
        )}
      </animated.mesh>
    </animated.group>
  )
}
