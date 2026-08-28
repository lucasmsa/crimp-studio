import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { WallDocument } from '@/lib/walls'
import { summarise } from '@/lib/walls'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { readoutLine } from '../../../config/editorControlStyles'
import { WallSilhouettePreview } from './WallSilhouettePreview'
import { savedAgo } from '../utils/savedAgo'

interface WallSlotRowProps {
  entry: WallDocument
  /** True when this slot holds the wall on screen */
  current: boolean
  actionLabel: string
  onPick: () => void
  onRemove: () => void
}

/** One saved wall: what it is called, when it was written, and what it looks like */
export function WallSlotRow({ entry, current, actionLabel, onPick, onRemove }: WallSlotRowProps) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const summary = summarise(entry)

  return (
    <li
      className={cn(
        'flex items-center gap-3 border-2 p-2',
        current ? 'border-primary bg-sand/40' : 'border-border bg-card',
      )}
      data-testid={`wall-slot-${entry.id}`}
    >
      <WallSilhouettePreview faces={entry.wall.faces} holds={entry.wall.holds} />

      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold uppercase tracking-wide">
          {summary.name}
        </p>
        <p className={readoutLine} data-testid={`wall-slot-meta-${entry.id}`}>
          {[
            savedAgo(summary.savedAt, t),
            t('editor.faceCount', { count: summary.faceCount }),
            t('editor.holdCount', { count: summary.holdCount }),
          ].join(' \u00b7 ')}
        </p>
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={readoutLine}>{t('editor.library.deleteSure')}</span>
          <Button variant="outline" size="sm" onClick={onRemove} data-testid={`wall-delete-yes-${entry.id}`}>
            {t('editor.library.deleteConfirm')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
            {t('editor.library.deleteCancel')}
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onPick} data-testid={`wall-pick-${entry.id}`}>
            {actionLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
            aria-label={t('editor.library.delete')}
            data-testid={`wall-delete-${entry.id}`}
          >
            {t('editor.library.delete')}
          </Button>
        </div>
      )}
    </li>
  )
}
