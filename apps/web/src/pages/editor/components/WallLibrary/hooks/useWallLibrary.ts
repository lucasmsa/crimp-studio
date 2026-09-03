import { useCallback, useEffect, useState } from 'react'
import { createDefaultWall, useWallStore, type Wall } from '@/stores/wallStore'
import { useWallLibraryStore } from '@/stores/wallLibrary'
import { clearHistory } from '@/stores/wallHistory'
import type { WallDocument } from '@/lib/walls'
import { fromDocument, signatureOf, toDocument, wallStorage } from '@/lib/walls'

const createId = () => Math.random().toString(36).substring(2, 9)

/** What went wrong, as a key the card looks up a message for */
export type LibraryProblem =
  | 'unreadable'
  | 'not-a-wall'
  | 'future-version'
  | 'missing'
  | 'full'
  | 'unavailable'

/** An action held back because taking it would lose the wall on screen */
type PendingAction = { kind: 'load'; entry: WallDocument } | { kind: 'new' }

/**
 * The saved walls, and the four things the card does with them: write the wall
 * on screen into a slot, bring one back, throw one away, and start fresh.
 *
 * Every one of those either happens or says why. Nothing half-loads: a wall
 * that does not read leaves the wall on screen where it is. Autosave holds only
 * the wall you are on, so anything that replaces it asks first (ADR-009).
 */
export function useWallLibrary(onClose: () => void) {
  const wall = useWallStore((state) => state.wall)
  const replaceWall = useWallStore((state) => state.replaceWall)
  const { savedSignature, markSaved } = useWallLibraryStore()

  const [saved, setSaved] = useState<WallDocument[]>([])
  const [problem, setProblem] = useState<LibraryProblem | null>(null)
  const [name, setName] = useState(wall.name)
  const [pending, setPending] = useState<PendingAction | null>(null)

  const refresh = useCallback(() => wallStorage.list().then(setSaved), [])

  /* The card is mounted only while it is open, so everything above starts
     fresh on each open and reading the library is all this has to do */
  useEffect(() => {
    refresh()
  }, [refresh])

  const put = useCallback(
    (next: Wall) => {
      replaceWall(next)
      markSaved(signatureOf(next))
    },
    [replaceWall, markSaved],
  )

  /** Writes the wall on screen into a slot, or into a new one when given none */
  const write = useCallback(
    async (into: WallDocument | null): Promise<boolean> => {
      const claimed = saved.some((entry) => entry.id === wall.id)
      const id = into?.id ?? (claimed ? createId() : wall.id)
      const title = (into?.name ?? name).trim() || wall.name

      const document = toDocument(wall, title, new Date().toISOString(), id)
      const result = await wallStorage.write(document)
      if (!result.ok) {
        setProblem(result.reason)
        return false
      }

      put(fromDocument(document))
      return true
    },
    [saved, wall, name, put],
  )

  /* Bringing in another wall, or a fresh one, starts its history from nothing:
     the steps behind the wall that just left belonged to it (ADR-012). Saving
     goes through put() too and keeps history, since a save changes nothing */
  const take = useCallback(
    async (action: PendingAction): Promise<boolean> => {
      if (action.kind === 'new') {
        put(createDefaultWall())
        clearHistory()
        return true
      }

      const result = await wallStorage.read(action.entry.id)
      if (!result.ok) {
        setProblem(result.reason)
        refresh()
        return false
      }

      put(fromDocument(result.document))
      clearHistory()
      return true
    },
    [put, refresh],
  )

  const unsaved = savedSignature !== null && signatureOf(wall) !== savedSignature

  const request = useCallback(
    async (action: PendingAction) => {
      if (unsaved) {
        setPending(action)
        return
      }
      if (await take(action)) onClose()
    },
    [unsaved, take, onClose],
  )

  return {
    saved,
    problem,
    pending,
    name,
    setName,
    /** Whether the wall on screen has changes the library does not have */
    unsaved,
    currentId: wall.id,

    save: async (into: WallDocument | null) => {
      if (await write(into)) onClose()
    },
    remove: async (entry: WallDocument) => {
      await wallStorage.remove(entry.id)
      refresh()
    },
    load: (entry: WallDocument) => request({ kind: 'load', entry }),
    startNew: () => request({ kind: 'new' }),

    /** Go ahead and lose the wall on screen */
    confirmPending: async () => {
      const action = pending
      setPending(null)
      if (action && (await take(action))) onClose()
    },
    /** Write the wall on screen down first, into its own slot if it has one */
    savePendingFirst: async () => {
      const action = pending
      setPending(null)
      const into = saved.find((entry) => entry.id === wall.id) ?? null
      if (!(await write(into))) return
      if (action && (await take(action))) onClose()
    },
    cancelPending: () => setPending(null),
  }
}
