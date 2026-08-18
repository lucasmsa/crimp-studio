import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { colors } from '@/lib/colors'
import { getModelVariants } from '../WallCanvas3D/utils/holdModels'
import { FaceSection } from './components/FaceSection'
import { ColorSwatches } from './components/ColorSwatches'
import { HOLD_SWATCHES } from './config/holdSwatches'
import { PANEL_SWATCHES } from './config/panelSwatches'
import { HOLD_TYPES } from './constants/holdTypes'
import { formatVariantLabel } from './utils/variantLabel'
import { holdTypeButtonBase, holdTypeButtonStates, sectionLabel } from './config/wallConfigStyles'

/**
 * Shows the controls for whatever is selected and nothing else. A panel's angle
 * is noise while you are colouring a hold, and hold models are noise while you
 * are shaping a panel.
 */
export function WallConfig() {
  const { t } = useTranslation()
  const {
    wall,
    selectedHoldId,
    selectedFaceId,
    editorMode,
    selectedHoldType,
    selectedVariant,
    setSelectedHoldType,
    setSelectedVariant,
    setWallColor,
    updateHold,
    clearHolds,
  } = useWallStore()

  const selectedHold = selectedHoldId ? wall.holds.find((h) => h.id === selectedHoldId) : null
  const variants = getModelVariants(selectedHoldType)
  /* The wall opens with its panel focused so the shaping controls have a
     subject, but that focus must not take the sidebar away from placement */
  const shapingPanel = editorMode === 'shape' && selectedFaceId !== null

  return (
    <div className="space-y-6">
      {selectedHold ? (
        <section className="space-y-3 border-b-2 border-border pb-6" data-testid="hold-section">
          <h2 className={sectionLabel}>{t('editor.colors.holdColor')}</h2>
          <ColorSwatches
            swatches={HOLD_SWATCHES}
            value={selectedHold.color ?? colors.holds[selectedHold.type]}
            labelPrefix="editor.swatches"
            testIdPrefix="hold-swatches"
            onPick={(hex) => updateHold(selectedHold.id, { color: hex })}
          />
        </section>
      ) : shapingPanel ? (
        <>
          <FaceSection />

          <section className="space-y-3 border-b-2 border-border pb-6">
            <h2 className={sectionLabel}>{t('editor.colors.wallColor')}</h2>
            <ColorSwatches
              swatches={PANEL_SWATCHES}
              value={wall.wallColor}
              labelPrefix="editor.panelSwatches"
              testIdPrefix="panel-swatches"
              onPick={setWallColor}
            />
          </section>
        </>
      ) : (
        <>
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
        </>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={clearHolds}>
        {t('editor.actions.clear')}
      </Button>
    </div>
  )
}
