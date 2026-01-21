import { useRef, useEffect, useState, useCallback } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { CANVAS_ELEMENTS, CANVAS_CONFIG, KEYBOARD_SHORTCUTS } from '../constants/canvas'

export function useWallCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  const { wall, selectedHoldId, addHold, selectHold, updateHold, removeHold } = useWallStore()

  // Scale to fit wall in canvas while preserving aspect ratio
  const scale = Math.min(
    canvasSize.width / wall.width,
    canvasSize.height / wall.height
  ) * CANVAS_CONFIG.PADDING_FACTOR

  // Center the wall within the canvas
  const offsetX = (canvasSize.width - wall.width * scale) / 2
  const offsetY = (canvasSize.height - wall.height * scale) / 2

  // Keep canvas size in sync with container
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Keyboard shortcuts for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedHoldId && KEYBOARD_SHORTCUTS.DELETE_HOLD.includes(e.key)) {
        e.preventDefault()
        removeHold(selectedHoldId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedHoldId, removeHold])

  // Wall coords have Y=0 at bottom (like climbing), canvas has Y=0 at top
  const canvasToWall = useCallback((canvasX: number, canvasY: number) => ({
    x: (canvasX - offsetX) / scale,
    y: wall.height - (canvasY - offsetY) / scale,
  }), [offsetX, offsetY, scale, wall.height])

  const wallToCanvas = useCallback((wallX: number, wallY: number) => ({
    x: offsetX + wallX * scale,
    y: offsetY + (wall.height - wallY) * scale,
  }), [offsetX, offsetY, scale, wall.height])

  const isWithinBounds = useCallback((wallX: number, wallY: number) => (
    wallX >= 0 && wallX <= wall.width && wallY >= 0 && wallY <= wall.height
  ), [wall.width, wall.height])

  // Constrain position to wall bounds (used during drag)
  const clampToWall = useCallback((wallX: number, wallY: number) => ({
    x: Math.max(0, Math.min(wall.width, wallX)),
    y: Math.max(0, Math.min(wall.height, wallY)),
  }), [wall.width, wall.height])

  // Konva dragBoundFunc - constrains drag to canvas wall bounds in real-time
  const getDragBounds = useCallback((pos: { x: number; y: number }) => {
    const wallPos = canvasToWall(pos.x, pos.y)
    const clampedWallPos = clampToWall(wallPos.x, wallPos.y)
    return wallToCanvas(clampedWallPos.x, clampedWallPos.y)
  }, [canvasToWall, clampToWall, wallToCanvas])

  // Click behavior: if hold selected -> deselect, otherwise add new hold
  const handleStageClick = useCallback((e: any) => {
    const clickedElement = e.target
    const isWallBackground = clickedElement === clickedElement.getStage() ||
      clickedElement.name() === CANVAS_ELEMENTS.WALL_BACKGROUND

    if (!isWallBackground) {
      return
    }

    // If a hold is selected, deselect it first
    if (selectedHoldId) {
      selectHold(null)
      return
    }

    // No hold selected - add a new one
    const pos = clickedElement.getStage().getPointerPosition()
    const wallPos = canvasToWall(pos.x, pos.y)

    if (isWithinBounds(wallPos.x, wallPos.y)) {
      addHold(wallPos.x, wallPos.y)
    }
  }, [canvasToWall, isWithinBounds, addHold, selectHold, selectedHoldId])

  // Stop propagation so stage click doesn't fire
  const handleHoldClick = useCallback((holdId: string, e: any) => {
    e.cancelBubble = true
    selectHold(holdId)
  }, [selectHold])

  // Update hold position after drag, clamped to wall bounds
  const handleHoldDragEnd = useCallback((holdId: string, e: any) => {
    const rawPos = canvasToWall(e.target.x(), e.target.y())
    const clampedPos = clampToWall(rawPos.x, rawPos.y)
    updateHold(holdId, { x: clampedPos.x, y: clampedPos.y })
  }, [canvasToWall, clampToWall, updateHold])

  // Rotate hold by fixed step
  const handleRotateHold = useCallback((holdId: string) => {
    const hold = wall.holds.find((h) => h.id === holdId)
    if (hold) {
      const newRotation = ((hold.rotation || 0) + CANVAS_CONFIG.ROTATION_STEP) % 360
      updateHold(holdId, { rotation: newRotation })
    }
  }, [wall.holds, updateHold])

  // Delete selected hold
  const handleDeleteHold = useCallback((holdId: string) => {
    removeHold(holdId)
  }, [removeHold])

  return {
    containerRef,
    canvasSize,
    wall,
    selectedHoldId,
    scale,
    offsetX,
    offsetY,
    wallToCanvas,
    getDragBounds,
    handleStageClick,
    handleHoldClick,
    handleHoldDragEnd,
    handleRotateHold,
    handleDeleteHold,
  }
}
