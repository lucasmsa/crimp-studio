import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { colors } from '@/lib/colors'
import { HOLD_TYPES } from './constants/holdTypes'

export function WallConfig() {
  const { t } = useTranslation()
  const {
    wall,
    selectedHoldId,
    selectedHoldType,
    setSelectedHoldType,
    setWallColor,
    updateHold,
    clearHolds,
  } = useWallStore()

  const selectedHold = selectedHoldId
    ? wall.holds.find((h) => h.id === selectedHoldId)
    : null

  return (
    <div className="space-y-6">
      {/* Hold type selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('editor.holdTypes.label')}</label>
        <div className="grid grid-cols-3 gap-2">
          {HOLD_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedHoldType(type)}
              className="px-2 py-1.5 text-xs rounded border border-border transition-colors"
              style={{
                backgroundColor: selectedHoldType === type ? colors.holds[type] : 'transparent',
                color: selectedHoldType === type ? colors.dark.background : colors.dark.text,
              }}
            >
              {t(`editor.holdTypes.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Wall color */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('editor.colors.wallColor')}</label>
        <input
          type="color"
          value={wall.wallColor}
          onChange={(e) => setWallColor(e.target.value)}
          className="w-full h-8 rounded border border-border cursor-pointer"
        />
      </div>

      {/* Selected hold color */}
      {selectedHold && (
        <div className="space-y-3">
          <label className="text-sm font-medium">{t('editor.colors.holdColor')}</label>
          <input
            type="color"
            value={selectedHold.color ?? colors.holds[selectedHold.type]}
            onChange={(e) => updateHold(selectedHold.id, { color: e.target.value })}
            className="w-full h-8 rounded border border-border cursor-pointer"
          />
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full" onClick={clearHolds}>
          {t('editor.actions.clear')}
        </Button>
      </div>
    </div>
  )
}
