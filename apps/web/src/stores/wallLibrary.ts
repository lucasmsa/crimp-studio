import { create } from 'zustand'

interface WallLibraryState {
  /**
   * The wall as it stood the last time it was written to the library, or as it
   * arrived. Comparing against it is how the editor knows there is something to
   * lose before loading another wall (ADR-009).
   */
  savedSignature: string | null
  markSaved: (signature: string) => void
}

/**
 * What the editor knows about the wall's relationship to the library. Kept out
 * of the wall store, which holds the wall itself and has no business knowing
 * whether it has been written down.
 */
export const useWallLibraryStore = create<WallLibraryState>((set) => ({
  savedSignature: null,
  markSaved: (signature) => set({ savedSignature: signature }),
}))
