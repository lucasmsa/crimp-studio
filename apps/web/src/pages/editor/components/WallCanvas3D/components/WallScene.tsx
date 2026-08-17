import { useState, useCallback } from 'react'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, SMAA, Vignette } from '@react-three/postprocessing'
import { Wall3D } from './Wall3D'
import { EditorLights } from './EditorLights'
import { useEditorCamera } from '../hooks/useEditorCamera'
import { useEditorKeyboard } from '../hooks/useEditorKeyboard'
import { ORBIT_CONTROLS } from '../constants/editor3d'

export function WallScene() {
  const [orbitEnabled, setOrbitEnabled] = useState(true)

  const wallCenter = useEditorCamera()
  useEditorKeyboard()

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setOrbitEnabled(!isDragging)
  }, [])

  return (
    <>
      <EditorLights />

      {/* The selected hold's action overlay rides its own face, inside Wall3D */}
      <Wall3D onDragStateChange={handleDragStateChange} />

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
