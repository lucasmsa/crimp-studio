import { useTranslation } from 'react-i18next'
import type * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { ColorSwatches } from '../../ColorSwatches'
import { HOLD_SWATCHES } from '../../../config/holdSwatches'
import { sectionLabel } from '../../../config/editorControlStyles'
import { useHoldControls } from '../hooks/useHoldControls'
import { SelectionPopover } from './SelectionPopover'

interface HoldPopoverProps {
  hold: Hold
  anchor: THREE.Vector3
}

/**
 * The selected hold's controls: its colour, and the two things you do to a hold
 * that is already on the wall. Type and model belong to the next placement, so
 * they stay in the rail rather than being repeated here.
 */
export function HoldPopover({ hold, anchor }: HoldPopoverProps) {
  const { t } = useTranslation()
  const { color, setColor, rotate, remove } = useHoldControls(hold)

  return (
    <SelectionPopover anchor={anchor} label={t('editor.hold.label')} testId="hold-popover">
      <h2 className={sectionLabel}>{t('editor.colors.holdColor')}</h2>
      <ColorSwatches
        swatches={HOLD_SWATCHES}
        value={color}
        labelPrefix="editor.swatches"
        testIdPrefix="hold-swatches"
        onPick={setColor}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="outline" size="sm" onClick={rotate} data-testid="hold-rotate">
          {t('editor.actions.rotate')}
        </Button>
        <Button variant="outline" size="sm" onClick={remove} data-testid="hold-delete">
          {t('editor.actions.delete')}
        </Button>
      </div>
    </SelectionPopover>
  )
}
