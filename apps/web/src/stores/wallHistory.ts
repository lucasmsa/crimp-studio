import { useStore } from 'zustand'
import { useWallStore } from './wallStore'
import { selectionAfterStep } from './utils/selectionAfterStep'

/**
 * Steps the wall back one edit.
 *
 * Holds still popping off leave first, as one edit, so an undo asked for
 * mid-animation undoes the delete being watched rather than the edit before
 * it (ADR-012).
 */
export function undo(): void {
  useWallStore.getState().flushPendingDeletes()
  step(() => useWallStore.temporal.getState().undo())
}

export function redo(): void {
  step(() => useWallStore.temporal.getState().redo())
}

/** Forgets every step. Loading or starting a wall does this: the stack belonged to the old one */
export function clearHistory(): void {
  useWallStore.temporal.getState().clear()
}

/**
 * Moves through history and then selects what the step touched, so the camera
 * turns to it and the popover shows it. A step that changed nothing leaves the
 * selection alone.
 */
function step(move: () => void): void {
  const before = useWallStore.getState().wall
  move()
  const after = useWallStore.getState().wall
  if (after === before) return

  const { selectHold, selectFace, showLeaving } = useWallStore.getState()

  /* Holds the step took away are drawn popping off, as a delete is, rather
     than vanishing. A hold whose panel also went has nowhere to be drawn */
  showLeaving(
    before.holds.filter(
      (hold) => !after.holds.some((h) => h.id === hold.id) && hold.faceId in after.faces.byId,
    ),
  )

  const selection = selectionAfterStep(before, after)

  if (!selection) {
    selectHold(null)
    selectFace(null)
  } else if ('holdId' in selection) {
    selectHold(selection.holdId)
  } else {
    selectFace(selection.faceId)
  }
}

/** What the header needs: whether each direction has anywhere to go, and the way there */
export function useHistory() {
  const canUndo = useStore(useWallStore.temporal, (state) => state.pastStates.length > 0)
  const canRedo = useStore(useWallStore.temporal, (state) => state.futureStates.length > 0)

  return { canUndo, canRedo, undo, redo }
}
