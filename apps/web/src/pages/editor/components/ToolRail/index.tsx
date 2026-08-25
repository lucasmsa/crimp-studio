import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EDITOR_TOOLS } from './config/tools'
import { PlacementOptions } from './components/PlacementOptions'
import { useToolRail } from './hooks/useToolRail'
import {
  chromePanel,
  holdTypeButtonBase,
  holdTypeButtonStates,
  sectionLabel,
} from '../../config/editorControlStyles'

/**
 * The tools, down the left edge of the canvas. One of them is armed at all
 * times, and the armed tool brings its own settings with it.
 */
export function ToolRail() {
  const { t } = useTranslation()
  const { editorMode, setEditorMode, collapsed, toggleCollapsed, clearHolds } = useToolRail()

  return (
    <div
      className={cn('absolute left-4 top-4 z-10 space-y-3 p-3', collapsed ? 'w-14' : 'w-52', chromePanel)}
      data-testid="tool-rail"
      data-collapsed={collapsed}
    >
      <div className="flex items-center justify-between gap-2">
        {!collapsed && <h2 className={sectionLabel}>{t('editor.rail.label')}</h2>}
        <button
          onClick={toggleCollapsed}
          aria-label={t(collapsed ? 'editor.rail.expand' : 'editor.rail.collapse')}
          aria-expanded={!collapsed}
          className={cn(
            holdTypeButtonBase,
            holdTypeButtonStates.idle,
            'ml-auto h-7 w-7 px-0 text-sm leading-none',
          )}
          data-testid="rail-toggle"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <div className="space-y-2">
        {EDITOR_TOOLS.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => setEditorMode(tool.mode)}
            title={t(`editor.rail.tools.${tool.mode}`)}
            aria-pressed={editorMode === tool.mode}
            className={cn(
              holdTypeButtonBase,
              'w-full',
              collapsed ? 'justify-center px-0' : 'justify-start gap-2 px-2',
              editorMode === tool.mode
                ? holdTypeButtonStates.selected
                : holdTypeButtonStates.idle,
            )}
            data-testid={`tool-${tool.mode}`}
          >
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d={tool.icon} />
            </svg>
            {!collapsed && t(`editor.rail.tools.${tool.mode}`)}
          </button>
        ))}
      </div>

      {!collapsed && editorMode === 'holds' && <PlacementOptions />}

      {!collapsed && (
        <div className="border-t-2 border-border pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={clearHolds}
            data-testid="clear-holds"
          >
            {t('editor.actions.clear')}
          </Button>
        </div>
      )}
    </div>
  )
}
