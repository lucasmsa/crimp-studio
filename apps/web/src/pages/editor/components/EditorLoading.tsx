import { useTranslation } from 'react-i18next'
import { useEditorLoading } from '../hooks/useEditorLoading'

/**
 * Poster-style entry overlay while hold models preload. Fades itself out
 * once the loading manager goes quiet.
 */
export function EditorLoading() {
  const { t } = useTranslation()
  const { ready, progress } = useEditorLoading()

  if (ready) return null

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-background"
      data-testid="editor-loading"
    >
      <span className="-skew-x-6 font-poster text-6xl uppercase text-foreground md:text-8xl">
        {t('editor.loading.title')}
      </span>
      <div className="h-4 w-64 border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--color-foreground)]">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="font-mono text-sm text-muted-foreground">{progress}%</span>
    </div>
  )
}
