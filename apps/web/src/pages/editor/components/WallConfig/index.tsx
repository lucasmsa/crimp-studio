import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'
import { getModelVariants } from '../WallCanvas3D/utils/holdModels'
import { FaceSection } from './components/FaceSection'
import { HoldSwatches } from './components/HoldSwatches'
import { HOLD_TYPES } from './constants/holdTypes'
import { formatVariantLabel } from './utils/variantLabel'
import {
  colorInput,
  holdTypeButtonBase,
  holdTypeButtonStates,
  sectionLabel,
} from './config/wallConfigStyles'

export function WallConfig() {
  const { t } = useTranslation()
  const {
    wall,
    selectedHoldId,
    selectedHoldType,
    selectedVariant,
    setSelectedHoldType,
    setSelectedVariant,
    setWallColor,
    updateHold,
    clearHolds,
  } = useWallStore()

  const selectedHold = selectedHoldId
    ? wall.holds.find((h) => h.id === selectedHoldId)
    : null

  const variants = getModelVariants(selectedHoldType)

  return (
    <div className="space-y-6">
      <FaceSection />

      {/* Hold type selector */}
      <section className="space-y-3 border-b-2 border-border pb-6">
        <h2 className={sectionLabel}>{t('editor.holdTypes.label')}</h2>
        <div className="grid grid-cols-2 gap-2.5">
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
      </section>

      {/* Model variant for the next placement */}
      {variants.length > 1 && (
        <section className="space-y-3 border-b-2 border-border pb-6">
          <h2 className={sectionLabel}>{t('editor.model.label')}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setSelectedVariant(null)}
              className={cn(
                holdTypeButtonBase,
                selectedVariant === null
                  ? holdTypeButtonStates.selected
                  : holdTypeButtonStates.idle,
              )}
              data-testid="variant-auto"
            >
              {t('editor.model.auto')}
            </button>
            {variants.map((v) => (
              <button
                key={v.variant}
                onClick={() => setSelectedVariant(v.variant)}
                className={cn(
                  holdTypeButtonBase,
                  selectedVariant === v.variant
                    ? holdTypeButtonStates.selected
                    : holdTypeButtonStates.idle,
                )}
                data-testid={`variant-${v.variant}`}
              >
                {formatVariantLabel(v.variant)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Wall color */}
      <section className="space-y-3 border-b-2 border-border pb-6">
        <h2 className={sectionLabel}>{t('editor.colors.wallColor')}</h2>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={wall.wallColor}
            onChange={(e) => setWallColor(e.target.value)}
            className={colorInput}
          />
          <span className="font-mono text-sm uppercase text-foreground">{wall.wallColor}</span>
        </div>
      </section>

      {/* Selected hold color */}
      {selectedHold && (
        <section className="space-y-3 border-b-2 border-border pb-6">
          <h2 className={sectionLabel}>{t('editor.colors.holdColor')}</h2>

          <HoldSwatches
            value={selectedHold.color ?? colors.holds[selectedHold.type]}
            onPick={(hex) => updateHold(selectedHold.id, { color: hex })}
          />

          {/* The wheel stays for anything the setter palette does not carry */}
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={selectedHold.color ?? colors.holds[selectedHold.type]}
              onChange={(e) => updateHold(selectedHold.id, { color: e.target.value })}
              className={colorInput}
              aria-label={t('editor.colors.custom')}
            />
            <span className="font-mono text-sm uppercase text-foreground">
              {selectedHold.color ?? colors.holds[selectedHold.type]}
            </span>
          </div>
        </section>
      )}

      {/* Actions */}
      <Button variant="outline" size="sm" className="w-full" onClick={clearHolds}>
        {t('editor.actions.clear')}
      </Button>
    </div>
  )
}
