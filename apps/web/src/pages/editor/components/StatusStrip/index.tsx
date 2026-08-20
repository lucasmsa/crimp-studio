import { useTranslation } from 'react-i18next'
import { countChip } from '../../config/editorControlStyles'
import { useWallReadout } from './hooks/useWallReadout'

/** What is on the wall and what the wall measures, along the bottom of the canvas */
export function StatusStrip() {
  const { t } = useTranslation()
  const { readout, holdCount, panelCount } = useWallReadout()

  return (
    <div
      className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center gap-2"
      data-testid="status-strip"
    >
      <span className={countChip} data-testid="hold-count">
        {t('editor.holdCount', { count: holdCount })}
      </span>
      <span className={countChip} data-testid="face-count">
        {t('editor.faceCount', { count: panelCount })}
      </span>
      <span className={countChip} data-testid="readout-height">
        {t('editor.readout.height', { value: readout.height })}
      </span>
      <span className={countChip} data-testid="readout-depth">
        {t('editor.readout.depth', { value: readout.depth })}
      </span>
      <span className={countChip} data-testid="readout-plywood">
        {t('editor.readout.plywood', { value: readout.plywood })}
      </span>
    </div>
  )
}
