import { useTranslation } from 'react-i18next'
import type * as THREE from 'three'
import type { Hold } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'
import { ColorSwatches } from '../../ColorSwatches'
import { HOLD_SWATCHES } from '../../../config/holdSwatches'
import { HOLD_TYPES } from '../../../config/holdTypes'
import { formatVariantLabel } from '../../../utils/variantLabel'
import {
  holdTypeButtonBase,
  holdTypeButtonStates,
  sectionLabel,
} from '../../../config/editorControlStyles'
import { useHoldControls } from '../hooks/useHoldControls'
import { SelectionPopover } from './SelectionPopover'

interface HoldPopoverProps {
  hold: Hold
  anchor: THREE.Vector3
}

/** The selected hold's controls, at the hold: what it is, which model, its colour */
export function HoldPopover({ hold, anchor }: HoldPopoverProps) {
  const { t } = useTranslation()
  const { variants, color, setType, setVariant, setColor, rotate, remove } = useHoldControls(hold)

  return (
    <SelectionPopover anchor={anchor} label={t('editor.hold.label')} testId="hold-popover">
      <h2 className={sectionLabel}>{t('editor.holdTypes.label')}</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {HOLD_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setType(type)}
            className={cn(
              holdTypeButtonBase,
              hold.type === type ? holdTypeButtonStates.selected : holdTypeButtonStates.idle,
            )}
            data-testid={`hold-type-${type}`}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full border border-foreground/40"
              style={{ backgroundColor: colors.holds[type] }}
            />
            {t(`editor.holdTypes.${type}`)}
          </button>
        ))}
      </div>

      {variants.length > 1 && (
        <div className="space-y-2">
          <h3 className={sectionLabel}>{t('editor.model.label')}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {variants.map((model) => (
              <button
                key={model.variant}
                onClick={() => setVariant(model.variant)}
                className={cn(
                  holdTypeButtonBase,
                  hold.variant === model.variant
                    ? holdTypeButtonStates.selected
                    : holdTypeButtonStates.idle,
                )}
                data-testid={`variant-${model.variant}`}
              >
                {formatVariantLabel(model.variant)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className={sectionLabel}>{t('editor.colors.holdColor')}</h3>
        <ColorSwatches
          swatches={HOLD_SWATCHES}
          value={color}
          labelPrefix="editor.swatches"
          testIdPrefix="hold-swatches"
          onPick={setColor}
        />
      </div>

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
