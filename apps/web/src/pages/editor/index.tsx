import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { WallCanvas } from './components/WallCanvas'
import { WallConfig } from './components/WallConfig'
import { useWallStore } from '@/stores/wallStore'

export function EditorPage() {
  const { t } = useTranslation()
  const { wall } = useWallStore()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold font-heading text-primary">
            {t('common.appName')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{t('editor.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            {t('editor.actions.load')}
          </Button>
          <Button variant="outline" size="sm">
            {t('editor.actions.save')}
          </Button>
          <Button size="sm">
            {t('editor.actions.generate')}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Canvas area */}
        <main className="flex-1 p-4">
          <WallCanvas />
        </main>

        {/* Sidebar */}
        <aside className="w-72 border-l border-border p-4 space-y-6">
          <WallConfig />

          {/* Wall info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{wall.width}cm × {wall.height}cm</p>
            <p>{wall.angle}° {t('editor.settings.inclination').toLowerCase()}</p>
            <p>{wall.holds.length} holds</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
