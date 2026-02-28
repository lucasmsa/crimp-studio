import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { useWallStore, type WallPanel } from '@/stores/wallStore'
import { CM_TO_M } from '../constants/editor3d'

/**
 * Handles all wall + hold interaction logic:
 * - Click wall to place holds
 * - Click hold to select
 * - Drag hold to reposition
 * - Keyboard shortcuts for deletion
 */
export function useWallInteraction(panel: WallPanel, panelWidthM: number, panelHeightM: number) {
  const wallMeshRef = useRef<THREE.Mesh>(null)
  const [draggingHoldId, setDraggingHoldId] = useState<string | null>(null)

  const {
    selectedHoldId,
    activePanelId,
    addHold,
    selectHold,
    updateHold,
    setActivePanel,
  } = useWallStore()

  const isActive = activePanelId === panel.id

  const worldToWallCoords = useCallback((worldPoint: THREE.Vector3) => {
    if (!wallMeshRef.current) return null

    const localPoint = wallMeshRef.current.worldToLocal(worldPoint.clone())
    const wallX = (localPoint.x + panelWidthM / 2) / CM_TO_M
    const wallY = (localPoint.y + panelHeightM / 2) / CM_TO_M

    return { x: wallX, y: wallY }
  }, [panelWidthM, panelHeightM])

  const isWithinBounds = useCallback((wallX: number, wallY: number) => {
    return wallX >= 0 && wallX <= panel.width && wallY >= 0 && wallY <= panel.height
  }, [panel.width, panel.height])

  const clampToBounds = useCallback((wallX: number, wallY: number) => ({
    x: Math.max(0, Math.min(panel.width, wallX)),
    y: Math.max(0, Math.min(panel.height, wallY)),
  }), [panel.width, panel.height])

  const handleWallClick = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()

    if (!isActive) {
      setActivePanel(panel.id)
    }

    if (selectedHoldId) {
      selectHold(null)
      return
    }

    const coords = worldToWallCoords(e.point)
    if (coords && isWithinBounds(coords.x, coords.y)) {
      addHold(coords.x, coords.y, panel.id)
    }
  }, [isActive, selectedHoldId, panel.id, addHold, selectHold, setActivePanel, worldToWallCoords, isWithinBounds])

  const handleHoldPointerDown = useCallback((holdId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    selectHold(holdId)
    setDraggingHoldId(holdId)
  }, [selectHold])

  const handleHoldPointerMove = useCallback((holdId: string) => (e: ThreeEvent<PointerEvent>) => {
    if (draggingHoldId !== holdId || !wallMeshRef.current) return
    e.stopPropagation()

    // Raycast against wall mesh to get projected position on wall surface
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const canvas = (e.nativeEvent.target as HTMLElement)?.closest('canvas')
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(pointer, e.camera)
    const intersects = raycaster.intersectObject(wallMeshRef.current)

    if (intersects.length > 0) {
      const coords = worldToWallCoords(intersects[0].point)
      if (coords) {
        const clamped = clampToBounds(coords.x, coords.y)
        updateHold(holdId, { x: clamped.x, y: clamped.y })
      }
    }
  }, [draggingHoldId, worldToWallCoords, clampToBounds, updateHold])

  const handleHoldPointerUp = useCallback(() => {
    setDraggingHoldId(null)
  }, [])

  return {
    wallMeshRef,
    isActive,
    isDragging: draggingHoldId !== null,
    handleWallClick,
    handleHoldPointerDown,
    handleHoldPointerMove,
    handleHoldPointerUp,
  }
}
