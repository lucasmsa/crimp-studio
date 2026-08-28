import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { holdTypeButtonBase, holdTypeButtonStates, readoutLine, sectionLabel } from '../../config/editorControlStyles'
import { LIBRARY_COPY, type LibraryMode } from './config/libraryMode'
import { useWallLibrary } from './hooks/useWallLibrary'
import { WallSlotRow } from './components/WallSlotRow'

interface WallLibraryProps {
  mode: LibraryMode | null
  onClose: () => void
}

/**
 * The saved walls. One card for both buttons, since saving and loading are the
 * same list seen from two directions: SAVE writes into a slot or a new one,
 * LOAD opens one (ADR-009).
 */
export function WallLibrary({ mode, onClose }: WallLibraryProps) {
  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent data-testid="wall-library">
        {mode && <LibraryBody mode={mode} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

/* Mounted only while the card is open, so every open starts from nothing:
   no name half typed, no refusal from last time, no confirm left standing */
function LibraryBody({ mode, onClose }: { mode: LibraryMode; onClose: () => void }) {
  const { t } = useTranslation()
  const copy = LIBRARY_COPY[mode]
  const library = useWallLibrary(onClose)

  return (
    <>
        <DialogHeader>
          <DialogTitle>{t(copy.titleKey)}</DialogTitle>
          <DialogDescription className={readoutLine}>
            {library.unsaved ? t('editor.library.unsaved') : t('editor.library.subtitle')}
          </DialogDescription>
        </DialogHeader>

        {mode === 'save' && (
          <div className="space-y-2">
            <label className={sectionLabel} htmlFor="wall-name">
              {t('editor.library.nameLabel')}
            </label>
            <div className="flex gap-2">
              <input
                id="wall-name"
                value={library.name}
                onChange={(event) => library.setName(event.target.value)}
                maxLength={60}
                className="min-w-0 flex-1 border-2 border-border bg-card px-2 py-1.5 font-body text-sm text-foreground outline-none focus-visible:border-primary"
                data-testid="wall-name"
              />
              <Button variant="outline" size="sm" onClick={() => library.save(null)} data-testid="wall-save-new">
                {t('editor.library.saveNew')}
              </Button>
            </div>
          </div>
        )}

        {mode === 'load' && (
          <button
            onClick={library.startNew}
            className={cn(holdTypeButtonBase, holdTypeButtonStates.idle, 'w-full')}
            data-testid="wall-new"
          >
            {t('editor.library.newWall')}
          </button>
        )}

        {library.pending && (
          <div
            className="space-y-2 border-2 border-primary bg-card p-2"
            role="alertdialog"
            aria-label={t('editor.library.confirm.title')}
            data-testid="wall-library-confirm"
          >
            <p className="font-body text-sm text-foreground">
              {t('editor.library.confirm.title')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" onClick={library.savePendingFirst} data-testid="wall-confirm-save">
                {t('editor.library.confirm.saveFirst')}
              </Button>
              <Button variant="outline" size="sm" onClick={library.confirmPending} data-testid="wall-confirm-anyway">
                {t('editor.library.confirm.anyway')}
              </Button>
              <Button variant="outline" size="sm" onClick={library.cancelPending} data-testid="wall-confirm-cancel">
                {t('editor.library.confirm.cancel')}
              </Button>
            </div>
          </div>
        )}

        {library.problem && (
          <p className="border-2 border-error bg-card p-2 font-body text-sm text-foreground" role="alert" data-testid="wall-library-problem">
            {t(`editor.library.problem.${library.problem}`)}
          </p>
        )}

        {library.saved.length === 0 ? (
          <p className={readoutLine} data-testid="wall-library-empty">
            {t(copy.emptyKey)}
          </p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto" data-testid="wall-library-list">
            {library.saved.map((entry) => (
              <WallSlotRow
                key={entry.id}
                entry={entry}
                current={entry.id === library.currentId}
                actionLabel={t(
                  copy.picks === 'overwrite' ? 'editor.library.overwrite' : 'editor.library.open',
                )}
                onPick={() => (mode === 'save' ? library.save(entry) : library.load(entry))}
                onRemove={() => library.remove(entry)}
              />
            ))}
          </ul>
        )}
    </>
  )
}
