import { useTranslation } from 'react-i18next'
import { useWallStore } from '@/stores/wallStore'
import { Button } from '@/components/ui/button'
import { colors } from '@/lib/colors'
import { HOLD_TYPES } from './constants/holdTypes'

export function WallConfig() {
  const { t } = useTranslation()
  const {
    wall,
    activePanelId,
    selectedHoldType,
    setActivePanel,
    addPanel,
    removePanel,
    updatePanel,
    setSelectedHoldType,
    clearHolds,
  } = useWallStore()

  const activePanel = wall.panels.find((p) => p.id === activePanelId)

  return (
    <div className="space-y-6">
      {/* Panel selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">{t('editor.panels.title')}</label>
          <Button variant="outline" size="sm" onClick={addPanel}>
            {t('editor.panels.add')}
          </Button>
        </div>

        <div className="space-y-1">
          {wall.panels.map((panel, index) => (
            <div
              key={panel.id}
              className="flex items-center gap-2"
            >
              <button
                onClick={() => setActivePanel(panel.id)}
                className="flex-1 px-2 py-1.5 text-xs text-left rounded border transition-colors"
                style={{
                  borderColor: panel.id === activePanelId ? colors.primary : colors.dark.border,
                  backgroundColor: panel.id === activePanelId ? `${colors.primary}15` : 'transparent',
                }}
              >
                {t('editor.panels.panel')} {index + 1} — {panel.angle}°
              </button>

              {wall.panels.length > 1 && (
                <button
                  onClick={() => removePanel(panel.id)}
                  className="p-1 text-muted-foreground hover:text-error transition-colors"
                  title={t('editor.panels.remove')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active panel dimensions */}
      {activePanel && (
        <div className="space-y-3">
          <label className="text-sm font-medium">{t('editor.settings.wallWidth')} (cm)</label>
          <input
            type="number"
            value={activePanel.width}
            onChange={(e) => updatePanel(activePanel.id, { width: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
          />

          <label className="text-sm font-medium">{t('editor.settings.wallHeight')} (cm)</label>
          <input
            type="number"
            value={activePanel.height}
            onChange={(e) => updatePanel(activePanel.id, { height: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
          />

          <label className="text-sm font-medium">{t('editor.settings.inclination')} (°)</label>
          <input
            type="number"
            value={activePanel.angle}
            onChange={(e) => updatePanel(activePanel.id, { angle: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
          />
        </div>
      )}

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

      {/* Actions */}
      <div className="pt-4 border-t border-border">
        <Button variant="outline" size="sm" className="w-full" onClick={clearHolds}>
          {t('editor.actions.clear')}
        </Button>
      </div>
    </div>
  )
}
