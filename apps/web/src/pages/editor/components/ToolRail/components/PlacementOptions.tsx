import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'
import {
  controlState,
  holdTypeButtonBase,
  sectionLabel,
} from '../../../config/editorControlStyles'
import { usePlacementOptions } from '../hooks/usePlacementOptions'

/**
 * The hold tool's settings: what the next tap on the wall bolts on, and what
 * the selected hold is. The same buttons do both (ADR-008).
 */
export function PlacementOptions() {
  const { t } = useTranslation()
  const { types, models, random, pickType, pickModel, pickRandom } = usePlacementOptions()

  const wontFit = t('editor.hold.wontFit')

  return (
    <div className="space-y-3 border-t-2 border-border pt-3" data-testid="placement-options">
      <h3 className={sectionLabel}>{t('editor.holdTypes.label')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {types.map((option) => (
          <button
            key={option.type}
            onClick={() => pickType(option.type)}
            disabled={option.unavailable}
            title={option.unavailable ? wontFit : undefined}
            aria-pressed={option.active}
            className={cn(
              holdTypeButtonBase,
              controlState({ selected: option.active, unavailable: option.unavailable }),
            )}
            data-testid={`place-hold-type-${option.type}`}
          >
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full border border-foreground/40"
              style={{ backgroundColor: colors.holds[option.type] }}
            />
            {t(`editor.holdTypes.${option.type}`)}
          </button>
        ))}
      </div>

      {models.length > 1 && (
        <div className="space-y-2">
          <h3 className={sectionLabel}>{t('editor.model.label')}</h3>
          <div className="grid grid-cols-2 gap-2">
            {models.map((option) => (
              <button
                key={option.variant}
                onClick={() => pickModel(option.variant)}
                disabled={option.unavailable}
                title={option.unavailable ? wontFit : undefined}
                aria-pressed={option.active}
                className={cn(
                  holdTypeButtonBase,
                  controlState({ selected: option.active, unavailable: option.unavailable }),
                )}
                data-testid={`place-variant-${option.variant}`}
              >
                {option.label}
              </button>
            ))}

            {/* Last, and on its own row: every type has an even number of models,
                so the odd control out is this one rather than a model */}
            <button
              onClick={pickRandom}
              disabled={random.unavailable}
              title={random.unavailable ? wontFit : undefined}
              aria-pressed={random.active}
              className={cn(
                holdTypeButtonBase,
                'col-span-2',
                controlState({ selected: random.active, unavailable: random.unavailable }),
              )}
              data-testid="place-variant-random"
            >
              {t('editor.model.random')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
