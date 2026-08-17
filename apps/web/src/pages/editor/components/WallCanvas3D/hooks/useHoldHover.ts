import { useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useWallStore } from '@/stores/wallStore'

/**
 * Hover state + cursor side effects for a hold's hit area.
 * Cursor changes are suppressed while any hold is being dragged.
 */
export function useHoldHover(isDraggingAny: React.RefObject<boolean>) {
  const [isHovered, setIsHovered] = useState(false)

  const onPointerEnter = (e: ThreeEvent<PointerEvent>) => {
    if (useWallStore.getState().editorMode === 'shape') return

    e.stopPropagation()
    setIsHovered(true)
    if (!isDraggingAny.current) document.body.style.cursor = 'pointer'
  }

  const onPointerLeave = () => {
    setIsHovered(false)
    if (!isDraggingAny.current) document.body.style.cursor = 'default'
  }

  return { isHovered, onPointerEnter, onPointerLeave }
}
