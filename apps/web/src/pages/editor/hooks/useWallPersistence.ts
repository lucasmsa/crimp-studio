import { useEffect, useState } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { useWallLibraryStore } from '@/stores/wallLibrary'
import { fromDocument, signatureOf, toDocument, wallStorage } from '@/lib/walls'

/** How long the wall has to sit still before it is written, in ms */
const SETTLE_MS = 400

/**
 * Keeps the wall you are working on across a reload.
 *
 * This is what actually saves your work; the library buttons are for keeping
 * and naming versions (ADR-009). It writes the wall itself and nothing about
 * where you were looking, so returning puts the wall back rather than the
 * session.
 */
export function useWallPersistence() {
  const markSaved = useWallLibraryStore((state) => state.markSaved)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    let cancelled = false
    /* The wall as it stands before storage answers. A wall touched while the
       read was in flight is the user's, and it wins */
    const untouched = signatureOf(useWallStore.getState().wall)

    wallStorage.readCurrent().then((result) => {
      if (cancelled) return

      const current = useWallStore.getState().wall
      const wall =
        result.ok && signatureOf(current) === untouched ? fromDocument(result.document) : null

      if (wall) useWallStore.getState().replaceWall(wall)
      markSaved(signatureOf(wall ?? current))
      setRestored(true)
    })

    return () => {
      cancelled = true
    }
  }, [markSaved])

  useEffect(() => {
    /* Nothing is written until the read has come back. Writing first would let
       the empty wall the editor starts with land on top of the saved one */
    if (!restored) return

    let timer: ReturnType<typeof setTimeout> | undefined

    /* Written once the wall stops moving rather than on every frame of a drag:
       a drag is hundreds of store updates and every one of them would serialise
       the whole wall */
    const unsubscribe = useWallStore.subscribe((state, previous) => {
      if (state.wall === previous.wall) return

      clearTimeout(timer)
      timer = setTimeout(() => {
        const wall = useWallStore.getState().wall
        wallStorage.writeCurrent(toDocument(wall, wall.name, new Date().toISOString()))
      }, SETTLE_MS)
    })

    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [restored])
}
