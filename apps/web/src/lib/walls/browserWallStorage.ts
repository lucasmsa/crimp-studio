import { parseDocument, type WallDocument } from './document'
import type { ReadResult, WallStorage, WriteResult } from './storage'

/** One key per wall, so a wall is written without rewriting the library */
const WALL_PREFIX = 'crimp.wall.'
/** The wall being worked on, which is not a library entry until it is saved */
const CURRENT_KEY = 'crimp.wall.current'

/**
 * Saved walls in the browser's own storage.
 *
 * The keys are readable and each holds one document, so a wall can be pulled
 * out of devtools and pasted back in. That is also why the reader checks what
 * it finds rather than trusting it (ADR-009).
 */
export function browserWallStorage(store: Storage = localStorage): WallStorage {
  const readAt = (key: string): ReadResult => {
    let raw: string | null
    try {
      raw = store.getItem(key)
    } catch {
      return { ok: false, reason: 'unreadable' }
    }
    if (raw === null) return { ok: false, reason: 'missing' }

    const parsed = parseDocument(raw)
    return parsed.ok
      ? { ok: true, document: parsed.document }
      : { ok: false, reason: parsed.reason }
  }

  const writeAt = (key: string, document: WallDocument): WriteResult => {
    try {
      store.setItem(key, JSON.stringify(document))
      return { ok: true }
    } catch (error) {
      return { ok: false, reason: isQuotaError(error) ? 'full' : 'unavailable' }
    }
  }

  return {
    async list(): Promise<WallDocument[]> {
      const documents: WallDocument[] = []

      for (const key of savedKeys(store)) {
        const result = readAt(key)
        /* A wall that no longer reads is left in place rather than swept up:
           the library skips it, and it stays there to be recovered by hand */
        if (result.ok) documents.push(result.document)
      }

      return documents.sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    },

    async read(id) {
      return readAt(WALL_PREFIX + id)
    },

    async write(document) {
      return writeAt(WALL_PREFIX + document.id, document)
    },

    async remove(id) {
      try {
        store.removeItem(WALL_PREFIX + id)
      } catch {
        /* Nothing to do about a store that will not delete, and nothing the
           editor could offer the user either */
      }
    },

    async readCurrent() {
      return readAt(CURRENT_KEY)
    },

    async writeCurrent(document) {
      return writeAt(CURRENT_KEY, document)
    },
  }
}

function savedKeys(store: Storage): string[] {
  const keys: string[] = []

  for (let index = 0; index < store.length; index++) {
    const key = store.key(index)
    if (key?.startsWith(WALL_PREFIX) && key !== CURRENT_KEY) keys.push(key)
  }

  return keys
}

/** Every browser names the quota error differently; all of them set a name */
function isQuotaError(error: unknown): boolean {
  return error instanceof Error && /quota|exceeded/i.test(error.name + error.message)
}
