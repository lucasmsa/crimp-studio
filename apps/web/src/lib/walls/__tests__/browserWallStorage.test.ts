import { describe, it, expect, beforeEach } from 'vitest'
import { createRootFaceTree } from '@crimp-studio/wall-geometry'
import type { Wall } from '@/stores/wallStore'
import { browserWallStorage } from '../browserWallStorage'
import { toDocument } from '../document'

const PANEL = '#E8D5B7'

function memoryStorage(): Storage {
  const entries = new Map<string, string>()

  return {
    get length() {
      return entries.size
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => void entries.set(key, value),
    removeItem: (key: string) => void entries.delete(key),
    clear: () => entries.clear(),
  } as Storage
}

function wall(id: string): Wall {
  const faces = createRootFaceTree(300, 400, PANEL)
  return { id, name: 'My Wall', width: 300, height: 400, faces, holds: [] }
}

const document = (id: string, name: string, savedAt: string) =>
  toDocument(wall(id), name, savedAt, id)

let store: Storage
let walls: ReturnType<typeof browserWallStorage>

beforeEach(() => {
  store = memoryStorage()
  walls = browserWallStorage(store)
})

describe('browserWallStorage', () => {
  it('reads back a wall it wrote', async () => {
    await walls.write(document('a', 'Cave Project', '2026-08-28T10:00:00.000Z'))

    const result = await walls.read('a')

    expect(result.ok && result.document.name).toBe('Cave Project')
  })

  it('says a wall it does not have is missing', async () => {
    expect(await walls.read('nothing')).toEqual({ ok: false, reason: 'missing' })
  })

  it('lists saved walls newest first', async () => {
    await walls.write(document('a', 'Older', '2026-08-20T10:00:00.000Z'))
    await walls.write(document('b', 'Newer', '2026-08-28T10:00:00.000Z'))

    expect((await walls.list()).map((entry) => entry.name)).toEqual(['Newer', 'Older'])
  })

  it('keeps the wall being worked on out of the library', async () => {
    await walls.writeCurrent(document('draft', 'Draft', '2026-08-28T10:00:00.000Z'))

    expect(await walls.list()).toHaveLength(0)
    expect((await walls.readCurrent()).ok).toBe(true)
  })

  it('skips an entry that no longer reads, and leaves it where it is', async () => {
    await walls.write(document('a', 'Fine', '2026-08-28T10:00:00.000Z'))
    store.setItem('crimp.wall.broken', '{ not json')

    expect((await walls.list()).map((entry) => entry.name)).toEqual(['Fine'])
    expect(store.getItem('crimp.wall.broken')).toBe('{ not json')
  })

  it('forgets a wall that is deleted', async () => {
    await walls.write(document('a', 'Cave Project', '2026-08-28T10:00:00.000Z'))

    await walls.remove('a')

    expect(await walls.list()).toHaveLength(0)
    expect((await walls.read('a')).ok).toBe(false)
  })

  it('reports a full store rather than losing the write quietly', async () => {
    const full = {
      ...memoryStorage(),
      setItem: () => {
        const error = new Error('exceeded the quota')
        error.name = 'QuotaExceededError'
        throw error
      },
    } as Storage

    const result = await browserWallStorage(full).write(
      document('a', 'Cave Project', '2026-08-28T10:00:00.000Z'),
    )

    expect(result).toEqual({ ok: false, reason: 'full' })
  })
})
