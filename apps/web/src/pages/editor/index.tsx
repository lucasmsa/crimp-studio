import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { WallCanvas3D } from './components/WallCanvas3D'
import { EditorLoading } from './components/EditorLoading'
import { ToolRail } from './components/ToolRail'
import { StatusStrip } from './components/StatusStrip'
import { SelectionPanel } from './components/SelectionPanel'
import { ThemeToggle } from '@/components/ThemeToggle'

/**
 * The wall gets the screen. Chrome is the header, the tool rail, the status
 * strip, and the card the current selection hangs from.
 */
export function EditorPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b-2 border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold font-heading text-primary">
            {t('common.appName')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{t('editor.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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

      <main className="relative flex-1 p-4">
        {/* Absolute rather than stretched: the canvas needs a height a
            percentage can resolve against, and a flex-grown box does not
            give its children one */}
        <div className="absolute inset-4">
          <WallCanvas3D />
        </div>
        <ToolRail />
        <SelectionPanel />
        <StatusStrip />
        <EditorLoading />
      </main>
    </div>
  )
}
