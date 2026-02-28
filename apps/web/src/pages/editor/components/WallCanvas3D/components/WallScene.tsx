import { useMemo, useState, useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useWallStore, type WallPanel, type Hold } from '@/stores/wallStore'
import { WallPanel3D } from './WallPanel3D'
import { EditorLights } from './EditorLights'
import { HoldActionsOverlay } from './HoldActionsOverlay'
import { calculatePanelLayouts, getWallCenter, getCameraDistance, type PanelLayout } from '../utils/wallLayout'
import { ORBIT_CONTROLS, CAMERA, KEYBOARD_SHORTCUTS } from '../constants/editor3d'

function findSelectedHold(
  selectedHoldId: string | null,
  panels: WallPanel[],
  layouts: PanelLayout[],
): { hold: Hold; layout: PanelLayout } | null {
  if (!selectedHoldId) return null

  for (let i = 0; i < panels.length; i++) {
    const hold = panels[i].holds.find((h) => h.id === selectedHoldId)
    if (hold && layouts[i]) {
      return { hold, layout: layouts[i] }
    }
  }
  return null
}

export function WallScene() {
  const { wall, selectedHoldId, removeHold } = useWallStore()
  const [orbitEnabled, setOrbitEnabled] = useState(true)
  const { camera } = useThree()

  const layouts = useMemo(
    () => calculatePanelLayouts(wall.panels),
    [wall.panels],
  )

  const wallCenter = useMemo(() => getWallCenter(layouts), [layouts])

  // Frame the wall when panels change
  useEffect(() => {
    const distance = getCameraDistance(layouts, CAMERA.FOV)
    camera.position.set(wallCenter.x, wallCenter.y, distance)
    camera.lookAt(wallCenter)
  }, [layouts, wallCenter, camera])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedHoldId && (KEYBOARD_SHORTCUTS.DELETE_HOLD as readonly string[]).includes(e.key)) {
        e.preventDefault()
        removeHold(selectedHoldId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedHoldId, removeHold])

  const handleDragStateChange = useCallback((isDragging: boolean) => {
    setOrbitEnabled(!isDragging)
  }, [])

  // Find the selected hold's position for the actions overlay
  const selectedHoldInfo = findSelectedHold(selectedHoldId, wall.panels, layouts)

  return (
    <>
      <EditorLights />

      {wall.panels.map((panel, i) => {
        const layout = layouts[i]
        if (!layout) return null

        return (
          <WallPanel3D
            key={panel.id}
            panel={panel}
            layout={layout}
            onDragStateChange={handleDragStateChange}
          />
        )
      })}

      {selectedHoldInfo && (
        <HoldActionsOverlay
          hold={selectedHoldInfo.hold}
          layout={selectedHoldInfo.layout}
        />
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
    </>
  )
}
