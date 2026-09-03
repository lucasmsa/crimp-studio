/** Two writes of the same key closer than this are one edit still going, in ms */
export const COALESCE_MS = 300

/** The edit that produced a state: which action, on what, and when */
export interface LastEdit {
  key: string
  at: number
}

interface Marked {
  lastEdit: LastEdit | null
}

/**
 * Whether a state change counts as history, in the shape zundo's `equality`
 * option expects: true means skip.
 *
 * A write that left the marker alone was a measurement or a load, so it is not
 * an edit. A repeat of the same key inside the window is the same edit still
 * going, so holding an arrow key is one entry rather than thirty. A skipped
 * write neither pushes a past state nor clears the future ones (ADR-012).
 */
export function historyEquality(past: Marked, current: Marked): boolean {
  if (past.lastEdit === current.lastEdit) return true
  if (!past.lastEdit || !current.lastEdit) return false

  return (
    past.lastEdit.key === current.lastEdit.key &&
    current.lastEdit.at - past.lastEdit.at < COALESCE_MS
  )
}
