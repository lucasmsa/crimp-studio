import { useTranslation } from 'react-i18next'
import type * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ColorSwatches } from '../../ColorSwatches'
import { PANEL_SWATCHES } from '../../../config/panelSwatches'
import {
  holdTypeButtonBase,
  holdTypeButtonStates,
  readoutLine,
  sectionLabel,
} from '../../../config/editorControlStyles'
import { usePanelControls } from '../hooks/usePanelControls'
import { SelectionPopover } from './SelectionPopover'

interface PanelPopoverProps {
  anchor: THREE.Vector3
}

/**
 * The selected panel's controls, at the panel: how steep it is, where it
 * splits, what it is painted, and whether it goes back into the panel below.
 */
export function PanelPopover({ anchor }: PanelPopoverProps) {
  const { t } = useTranslation()
  const {
    face,
    tilt,
    presets,
    seamLabelKey,
    cuts,
    canRemove,
    setAngle,
    stepAngle,
    setColor,
    cut,
    remove,
  } = usePanelControls()

  if (!face) return null

  return (
    <SelectionPopover anchor={anchor} label={t('editor.panel.label')} testId="panel-popover">
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
              tilt === preset.angle ? holdTypeButtonStates.selected : holdTypeButtonStates.idle,
              'disabled:pointer-events-none disabled:opacity-40',
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
          {t('editor.face.degrees', { value: tilt })}
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

      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => cut('across')}
          disabled={!cuts.across.ok}
          title={cuts.across.ok ? undefined : t(`editor.face.refusal.${cuts.across.reason}`)}
          className={cn(
            holdTypeButtonBase,
            holdTypeButtonStates.idle,
            'disabled:pointer-events-none disabled:opacity-40',
          )}
          data-testid="face-cut-across"
        >
          {t('editor.face.cutAcross')}
        </button>
        <button
          onClick={() => cut('up')}
          disabled={!cuts.up.ok}
          title={cuts.up.ok ? undefined : t(`editor.face.refusal.${cuts.up.reason}`)}
          className={cn(
            holdTypeButtonBase,
            holdTypeButtonStates.idle,
            'disabled:pointer-events-none disabled:opacity-40',
          )}
          data-testid="face-cut-up"
        >
          {t('editor.face.cutUp')}
        </button>
      </div>

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
          data-testid="face-remove"
        >
          {t('editor.face.remove')}
        </Button>
      )}
    </SelectionPopover>
  )
}
