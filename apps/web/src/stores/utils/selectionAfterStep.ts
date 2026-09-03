import type { Wall } from '@/stores/wallStore'

export type StepSelection = { holdId: string } | { faceId: string } | null

interface Diff {
  /** Present on both sides as different objects. Snapshots share what did not change */
  changed: string[]
  added: string[]
  removed: string[]
}

/**
 * What an undo or redo should leave selected: the one thing it touched, so the
 * camera turns to it and the popover shows it. A step that touched several
 * things, or removed the one it touched, selects nothing (ADR-012).
 */
export function selectionAfterStep(before: Wall, after: Wall): StepSelection {
  const holds = diffById(
    Object.fromEntries(before.holds.map((hold) => [hold.id, hold])),
    Object.fromEntries(after.holds.map((hold) => [hold.id, hold])),
  )

  if (touchedAnything(holds)) {
    const id = theOneTouched(holds)
    return id ? { holdId: id } : null
  }

  const faces = diffById(before.faces.byId, after.faces.byId)
  if (touchedAnything(faces)) {
    const id = theOneTouched(faces)
    return id ? { faceId: id } : null
  }

  return null
}

function diffById<T>(before: Record<string, T>, after: Record<string, T>): Diff {
  const changed: string[] = []
  const added: string[] = []
  const removed: string[] = []

  for (const id of Object.keys(after)) {
    if (!(id in before)) added.push(id)
    else if (before[id] !== after[id]) changed.push(id)
  }

  for (const id of Object.keys(before)) {
    if (!(id in after)) removed.push(id)
  }

  return { changed, added, removed }
}

function touchedAnything({ changed, added, removed }: Diff): boolean {
  return changed.length + added.length + removed.length > 0
}

/** The single id that changed or appeared, or null when the step did more, or removed it */
function theOneTouched({ changed, added, removed }: Diff): string | null {
  if (removed.length > 0) return null
  const present = [...changed, ...added]
  return present.length === 1 ? present[0] : null
}
