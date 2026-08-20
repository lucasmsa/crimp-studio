import { useEffect } from 'react'
import { useWallStore } from '@/stores/wallStore'

/** How long a hold stays lit after it stopped a bend, in ms */
const FLASH_MS = 900

/**
 * A bend that stops early is invisible without saying why, so the hold that
 * stopped it lights up. It is a flash rather than a state: the wall is not
 * wrong, it just cannot go further, and the answer stops being useful once it
 * has been read.
 */
export function useBlockingHoldFlash() {
  const blockingHoldIds = useWallStore((state) => state.blockingHoldIds)
  const clearBlockingHolds = useWallStore((state) => state.clearBlockingHolds)

  useEffect(() => {
    if (blockingHoldIds.length === 0) return

    const timer = setTimeout(clearBlockingHolds, FLASH_MS)
    return () => clearTimeout(timer)
  }, [blockingHoldIds, clearBlockingHolds])
}
