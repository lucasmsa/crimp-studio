import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { colors } from '@/lib/colors'
import { HOLD_TYPES } from './constants/holdTypes'

export function WallConfig() {
  const { t } = useTranslation()
  const {
    wall,
    selectedHoldType,
    setWallDimensions,
    setWallAngle,
    setSelectedHoldType,
    clearHolds,
  } = useWallStore()

  return (
    <div className="space-y-6">
      {/* Wall dimensions */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('editor.settings.wallWidth')} (cm)</label>
        <input
          type="number"
          value={wall.width}
          onChange={(e) => setWallDimensions(Number(e.target.value), wall.height)}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
        />

        <label className="text-sm font-medium">{t('editor.settings.wallHeight')} (cm)</label>
        <input
          type="number"
          value={wall.height}
          onChange={(e) => setWallDimensions(wall.width, Number(e.target.value))}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
        />

        <label className="text-sm font-medium">{t('editor.settings.inclination')} (°)</label>
        <input
          type="number"
          value={wall.angle}
          onChange={(e) => setWallAngle(Number(e.target.value))}
          className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
        />
      </div>

      {/* Hold type selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Hold Type</label>
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

      {/* Actions */}
      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full" onClick={clearHolds}>
          {t('editor.actions.clear')}
        </Button>
      </div>
    </div>
  )
}
