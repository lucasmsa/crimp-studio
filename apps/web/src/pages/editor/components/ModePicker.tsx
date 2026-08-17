import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import type { EditorMode } from '@/stores/wallStore'
import { cn } from '@/lib/utils'
import {
  holdTypeButtonBase,
  holdTypeButtonStates,
  sectionLabel,
} from './WallConfig/config/wallConfigStyles'

const MODES: EditorMode[] = ['holds', 'shape']

/**
 * Says what a click on the wall is aiming at, and switches it. Clicking a
 * panel and clicking the surface to set a hold are different intentions, and
 * they land on the same pixels.
 */
export function ModePicker() {
  const { t } = useTranslation()
  const { editorMode, setEditorMode } = useWallStore()

  return (
    <div
      className="absolute left-4 top-4 z-10 space-y-2 border-2 border-border bg-gradient-to-b from-card to-background p-3 shadow-[4px_4px_0_0_var(--color-foreground)]"
      data-testid="mode-picker"
    >
      <h2 className={sectionLabel}>{t('editor.mode.label')}</h2>
      <div className="flex gap-2">
        {MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => setEditorMode(mode)}
            className={cn(
              holdTypeButtonBase,
              'px-3',
              editorMode === mode ? holdTypeButtonStates.selected : holdTypeButtonStates.idle,
            )}
            data-testid={`mode-${mode}`}
          >
            {t(`editor.mode.${mode}`)}
          </button>
        ))}
      </div>
    </div>
  )
}
