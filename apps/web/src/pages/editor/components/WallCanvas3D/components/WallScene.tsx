import { useState, useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'
import { useWallStore } from '@/stores/wallStore'
import { Wall3D } from './Wall3D'
import { EditorLights } from './EditorLights'
import { HoldActionsOverlay } from './HoldActionsOverlay'
import { useEditorCamera } from '../hooks/useEditorCamera'
import { useEditorKeyboard } from '../hooks/useEditorKeyboard'
import { ORBIT_CONTROLS, CM_TO_M } from '../constants/editor3d'

export function WallScene() {
  const { wall, selectedHoldId } = useWallStore()
  const [orbitEnabled, setOrbitEnabled] = useState(true)

  const wallCenter = useEditorCamera(wall.width, wall.height)
  useEditorKeyboard()

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setOrbitEnabled(!isDragging)
  }, [])

  const selectedHold = selectedHoldId
    ? wall.holds.find((h) => h.id === selectedHoldId) ?? null
    : null

  const wallWidthM = wall.width * CM_TO_M
  const wallHeightM = wall.height * CM_TO_M

  return (
    <>
      <EditorLights />

      <Wall3D onDragStateChange={handleDragStateChange} />

      {/* Actions overlay positioned in the same offset group as holds */}
      {selectedHold && (
        <group position={[-wallWidthM / 2, -wallHeightM / 2, 0]}>
          <HoldActionsOverlay hold={selectedHold} />
        </group>
      )}

      <OrbitControls
        enabled={orbitEnabled}
        target={wallCenter}
        minPolarAngle={ORBIT_CONTROLS.MIN_POLAR_ANGLE}
        maxPolarAngle={ORBIT_CONTROLS.MAX_POLAR_ANGLE}
        minAzimuthAngle={ORBIT_CONTROLS.MIN_AZIMUTH_ANGLE}
        maxAzimuthAngle={ORBIT_CONTROLS.MAX_AZIMUTH_ANGLE}
        minDistance={ORBIT_CONTROLS.MIN_DISTANCE}
        maxDistance={ORBIT_CONTROLS.MAX_DISTANCE}
      />

      {/* multisampling: the composer bypasses canvas MSAA, so without it
          every edge in the editor renders aliased. SMAA on top keeps edges
          clean on dpr-1 displays where MSAA alone still shows steps */}
      <EffectComposer multisampling={8}>
        <SMAA />
        <Vignette eskil={false} offset={0.1} darkness={0.4} />
      </EffectComposer>
    </>
  )
}
