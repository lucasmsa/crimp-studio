import { useEffect } from 'react'
import { useWallStore } from '@/stores/wallStore'
import {
  KEYBOARD_SHORTCUTS,
  NUDGE_DISTANCE,
  NUDGE_DISTANCE_SHIFT,
} from '../constants/editor3d'
import { getNextRotation } from '../utils/holdActions'

/**
 * Handles all keyboard shortcuts for the wall editor:
 * - R: rotate selected hold 45°
 * - Delete/Backspace: remove selected hold
 * - Escape: deselect
 * - WASD/Arrows: nudge selected hold (Shift = larger nudge)
 */
export function useEditorKeyboard() {
  const { wall, selectedHoldId, removeHold, updateHold, selectHold } = useWallStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedHoldId) return

      if (KEYBOARD_SHORTCUTS.DELETE_HOLD.includes(e.key)) {
        e.preventDefault()
        removeHold(selectedHoldId)
        return
      }

      if (KEYBOARD_SHORTCUTS.ROTATE_HOLD.includes(e.key)) {
        e.preventDefault()
        const hold = wall.holds.find((h) => h.id === selectedHoldId)
        if (hold) {
          updateHold(selectedHoldId, { rotation: getNextRotation(hold.rotation) })
        }
        return
      }

      if (KEYBOARD_SHORTCUTS.DESELECT.includes(e.key)) {
        e.preventDefault()
        selectHold(null)
        return
      }

      const nudge = e.shiftKey ? NUDGE_DISTANCE_SHIFT : NUDGE_DISTANCE
      const hold = wall.holds.find((h) => h.id === selectedHoldId)
      if (!hold) return

      let dx = 0
      let dy = 0
      if (KEYBOARD_SHORTCUTS.NUDGE_UP.includes(e.key)) dy = nudge
      else if (KEYBOARD_SHORTCUTS.NUDGE_DOWN.includes(e.key)) dy = -nudge
      else if (KEYBOARD_SHORTCUTS.NUDGE_LEFT.includes(e.key)) dx = -nudge
      else if (KEYBOARD_SHORTCUTS.NUDGE_RIGHT.includes(e.key)) dx = nudge
      else return

      e.preventDefault()
      const newX = Math.max(0, Math.min(wall.width, hold.x + dx))
      const newY = Math.max(0, Math.min(wall.height, hold.y + dy))
      updateHold(selectedHoldId, { x: newX, y: newY })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedHoldId, removeHold, updateHold, selectHold, wall.holds, wall.width, wall.height])
}
