type Translate = (key: string, options?: Record<string, unknown>) => string

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How long ago a wall was saved, in the coarsest unit that still says something.
 * A library row is scanned rather than read, so "2 days ago" beats a timestamp.
 */
export function savedAgo(savedAt: string, t: Translate, now = Date.now()): string {
  const elapsed = now - new Date(savedAt).getTime()
  if (Number.isNaN(elapsed)) return t('editor.library.whenUnknown')

  if (elapsed < MINUTE) return t('editor.library.whenNow')
  if (elapsed < HOUR) return t('editor.library.whenMinutes', { count: Math.floor(elapsed / MINUTE) })
  if (elapsed < DAY) return t('editor.library.whenHours', { count: Math.floor(elapsed / HOUR) })

  return t('editor.library.whenDays', { count: Math.floor(elapsed / DAY) })
}
