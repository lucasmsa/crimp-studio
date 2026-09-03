import { useEffect } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { redo, undo } from '@/stores/wallHistory'
import {
  KEYBOARD_SHORTCUTS,
  NUDGE_DISTANCE,
  NUDGE_DISTANCE_SHIFT,
} from '../constants/editor3d'

/** A text field owns its own keys, its undo included */
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

/**
 * Handles all keyboard shortcuts for the wall editor:
 * - Cmd/Ctrl+Z: undo; with Shift, or as Ctrl+Y: redo
 * - R: rotate selected hold 45°
 * - Delete/Backspace: remove selected hold
 * - Escape: deselect
 * - WASD/Arrows: nudge selected hold (Shift = larger nudge)
 */
export function useEditorKeyboard() {
  const {
    wall,
    selectedHoldId,
    selectedFaceId,
    markHoldDeleting,
    moveHold,
    rotateHold,
    selectHold,
    selectFace,
  } = useWallStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return

      if ((e.metaKey || e.ctrlKey) && KEYBOARD_SHORTCUTS.UNDO.includes(e.key)) {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }

      if (e.ctrlKey && KEYBOARD_SHORTCUTS.REDO.includes(e.key)) {
        e.preventDefault()
        redo()
        return
      }

      /* Escape closes whatever popover is open, which is the keyboard's version
         of clicking empty canvas */
      if (KEYBOARD_SHORTCUTS.DESELECT.includes(e.key) && (selectedHoldId || selectedFaceId)) {
        e.preventDefault()
        selectHold(null)
        selectFace(null)
        return
      }

      if (!selectedHoldId) return

      if (KEYBOARD_SHORTCUTS.DELETE_HOLD.includes(e.key)) {
        e.preventDefault()
        markHoldDeleting(selectedHoldId)
        return
      }

      if (KEYBOARD_SHORTCUTS.ROTATE_HOLD.includes(e.key)) {
        e.preventDefault()
        rotateHold(selectedHoldId)
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
      moveHold(selectedHoldId, hold.u + dx, hold.v + dy)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    selectedHoldId,
    selectedFaceId,
    markHoldDeleting,
    moveHold,
    rotateHold,
    selectHold,
    selectFace,
    wall.holds,
  ])
}
