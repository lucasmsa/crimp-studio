import { useEffect } from 'react'
import { useWallStore } from '@/stores/wallStore'
import {
  KEYBOARD_SHORTCUTS,
  NUDGE_DISTANCE,
  NUDGE_DISTANCE_SHIFT,
} from '../constants/editor3d'
import { getNextRotation } from '../utils/holdActions'
import { clampHoldToFace } from '../utils/holdBounds'
import { getFace } from '../utils/faceTree'

/**
 * Handles all keyboard shortcuts for the wall editor:
 * - R: rotate selected hold 45°
 * - Delete/Backspace: remove selected hold
 * - Escape: deselect
 * - WASD/Arrows: nudge selected hold (Shift = larger nudge)
 */
export function useEditorKeyboard() {
  const { wall, selectedHoldId, markHoldDeleting, updateHold, selectHold } = useWallStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedHoldId) return

      if (KEYBOARD_SHORTCUTS.DELETE_HOLD.includes(e.key)) {
        e.preventDefault()
        markHoldDeleting(selectedHoldId)
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
      const face = getFace(wall.faces, hold.faceId)
      const clamped = clampHoldToFace(
        hold.u + dx,
        hold.v + dy,
        hold.collisionBox,
        face.width,
        face.height,
      )
      updateHold(selectedHoldId, { u: clamped.u, v: clamped.v })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedHoldId, markHoldDeleting, updateHold, selectHold, wall.holds, wall.faces])
}
