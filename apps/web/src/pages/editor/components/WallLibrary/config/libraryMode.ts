/** Which button opened the library, which is all that differs between the two */
export type LibraryMode = 'save' | 'load'

interface LibraryCopy {
  titleKey: string
  /** Shown above the list when there is nothing in it yet */
  emptyKey: string
  /** Whether picking a slot writes into it or opens it */
  picks: 'overwrite' | 'open'
}

export const LIBRARY_COPY: Record<LibraryMode, LibraryCopy> = {
  save: {
    titleKey: 'editor.library.saveTitle',
    emptyKey: 'editor.library.emptySave',
    picks: 'overwrite',
  },
  load: {
    titleKey: 'editor.library.loadTitle',
    emptyKey: 'editor.library.emptyLoad',
    picks: 'open',
  },
}
