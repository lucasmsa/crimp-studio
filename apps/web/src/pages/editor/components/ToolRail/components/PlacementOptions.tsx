import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'
import { HOLD_TYPES } from '../../../config/holdTypes'
import { formatVariantLabel } from '../../../utils/variantLabel'
import {
  holdTypeButtonBase,
  holdTypeButtonStates,
  sectionLabel,
} from '../../../config/editorControlStyles'
import { usePlacementOptions } from '../hooks/usePlacementOptions'

/** The holds tool's settings: what the next tap on the wall bolts on */
export function PlacementOptions() {
  const { t } = useTranslation()
  const {
    selectedHoldType,
    selectedVariant,
    variants,
    setSelectedHoldType,
    setSelectedVariant,
  } = usePlacementOptions()

  return (
    <div className="space-y-3 border-t-2 border-border pt-3" data-testid="placement-options">
      <h3 className={sectionLabel}>{t('editor.holdTypes.label')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {HOLD_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedHoldType(type)}
            className={cn(
              holdTypeButtonBase,
              selectedHoldType === type
                ? holdTypeButtonStates.selected
                : holdTypeButtonStates.idle,
            )}
            data-testid={`place-hold-type-${type}`}
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
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedVariant(null)}
              className={cn(
                holdTypeButtonBase,
                selectedVariant === null
                  ? holdTypeButtonStates.selected
                  : holdTypeButtonStates.idle,
              )}
              data-testid="place-variant-auto"
            >
              {t('editor.model.auto')}
            </button>
            {variants.map((model) => (
              <button
                key={model.variant}
                onClick={() => setSelectedVariant(model.variant)}
                className={cn(
                  holdTypeButtonBase,
                  selectedVariant === model.variant
                    ? holdTypeButtonStates.selected
                    : holdTypeButtonStates.idle,
                )}
                data-testid={`place-variant-${model.variant}`}
              >
                {formatVariantLabel(model.variant)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
