import { describe, expect, it } from 'vitest'
import { COALESCE_MS, historyEquality } from '../historyEquality'

const marked = (key: string, at: number) => ({ lastEdit: { key, at } })

describe('historyEquality', () => {
  it('skips a write that left the marker untouched', () => {
    const edit = marked('moveHold:a', 1000)
    expect(historyEquality(edit, { lastEdit: edit.lastEdit })).toBe(true)
  })

  it('skips two null markers, which is a fresh store measuring itself', () => {
    expect(historyEquality({ lastEdit: null }, { lastEdit: null })).toBe(true)
  })

  it('records the first edit after a null marker', () => {
    expect(historyEquality({ lastEdit: null }, marked('addHold:a', 1000))).toBe(false)
  })

  it('coalesces the same key inside the window', () => {
    expect(historyEquality(marked('moveHold:a', 1000), marked('moveHold:a', 1000 + COALESCE_MS - 1))).toBe(true)
  })

  it('records the same key once the window has passed', () => {
    expect(historyEquality(marked('moveHold:a', 1000), marked('moveHold:a', 1000 + COALESCE_MS))).toBe(false)
  })

  it('never coalesces different keys, however close', () => {
    expect(historyEquality(marked('moveHold:a', 1000), marked('moveHold:b', 1001))).toBe(false)
    expect(historyEquality(marked('moveHold:a', 1000), marked('rotateHold:a', 1001))).toBe(false)
  })
})
