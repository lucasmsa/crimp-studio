import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { WallCanvas3D } from './components/WallCanvas3D'
import { WallConfig } from './components/WallConfig'
import { EditorLoading } from './components/EditorLoading'
import { useWallStore } from '@/stores/wallStore'

export function EditorPage() {
  const { t } = useTranslation()
  const { wall } = useWallStore()

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

      <div className="flex-1 flex">
        <main className="relative flex-1 p-4">
          <WallCanvas3D />
          <EditorLoading />
        </main>

        <aside className="w-72 border-l-2 border-border bg-gradient-to-b from-card to-background p-4 space-y-6">
          <WallConfig />

          <span className="inline-block border-2 border-border px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t('editor.holdCount', { count: wall.holds.length })}
          </span>
        </aside>
      </div>
    </div>
  )
}
