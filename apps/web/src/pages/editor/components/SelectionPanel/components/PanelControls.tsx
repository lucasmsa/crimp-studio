import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ColorSwatches } from '../../ColorSwatches'
import { PANEL_SWATCHES } from '../../../config/panelSwatches'
import {
  controlState,
  holdTypeButtonBase,
  readoutLine,
  sectionLabel,
} from '../../../config/editorControlStyles'
import { usePanelControls } from '../hooks/usePanelControls'
import { SelectionCard } from './SelectionCard'

interface PanelControlsProps {
  cardRef: React.RefObject<HTMLDivElement | null>
}

/**
 * The selected panel's controls: how steep it is, where it splits, what it is
 * painted, and whether it goes back into the panel below.
 */
export function PanelControls({ cardRef }: PanelControlsProps) {
  const { t } = useTranslation()
  const {
    face,
    bend,
    steepness,
    presets,
    seamLabelKey,
    canRemove,
    canMerge,
    setAngle,
    stepAngle,
    setColor,
    remove,
  } = usePanelControls()

  if (!face) return null

  return (
    <SelectionCard label={t('editor.panel.label')} testId="panel-popover" cardRef={cardRef}>
      <div className="space-y-1">
        <h2 className={sectionLabel}>{t('editor.panel.label')}</h2>
        <p className={readoutLine} data-testid="panel-seam">
          {t(seamLabelKey)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.key}
            onClick={() => setAngle(preset.angle)}
            disabled={!preset.reachable}
            title={preset.reachable ? undefined : t('editor.face.refusal.would-clip')}
            className={cn(
              holdTypeButtonBase,
              controlState({ selected: preset.selected, unavailable: !preset.reachable }),
            )}
            data-testid={`face-angle-${preset.key}`}
          >
            {t(`editor.face.presets.${preset.key}`)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => stepAngle(-1, e.shiftKey)}
          aria-label={t('editor.face.decrease')}
          data-testid="face-angle-decrease"
        >
          -
        </Button>
        <span
          className="flex-1 border-2 border-border py-1 text-center font-mono text-sm tabular-nums text-foreground"
          data-testid="face-angle-value"
        >
          {t('editor.face.bend', { value: bend })}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={(e) => stepAngle(1, e.shiftKey)}
          aria-label={t('editor.face.increase')}
          data-testid="face-angle-increase"
        >
          +
        </Button>
      </div>
      <p className={readoutLine} data-testid="face-steepness">
        {t('editor.face.steepness', { value: steepness })}
      </p>

      <div className="space-y-2">
        <h3 className={sectionLabel}>{t('editor.colors.panelColor')}</h3>
        <ColorSwatches
          swatches={PANEL_SWATCHES}
          value={face.color}
          labelPrefix="editor.panelSwatches"
          testIdPrefix="panel-swatches"
          onPick={setColor}
        />
      </div>

      {canRemove && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={remove}
          disabled={!canMerge}
          title={canMerge ? undefined : t('editor.face.refusal.not-one-panel')}
          data-testid="face-remove"
        >
          {t('editor.face.remove')}
        </Button>
      )}
    </SelectionCard>
  )
}
