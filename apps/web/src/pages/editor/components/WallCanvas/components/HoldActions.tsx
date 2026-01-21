import { useTranslation } from 'react-i18next'

interface HoldActionsProps {
  x: number
  y: number
  onRotate: () => void
  onDelete: () => void
}

export function HoldActions({ x, y, onRotate, onDelete }: HoldActionsProps) {
  const { t } = useTranslation()

  return (
    <div
      className="absolute flex gap-1 bg-card border border-border rounded-md p-1 shadow-lg"
      style={{
        left: x,
        top: y,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        onClick={onRotate}
        className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
        title={t('editor.actions.rotate')}
      >
        {/* Rotate icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
      </button>
      <button
        onClick={onDelete}
        className="p-1.5 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
        title={t('editor.actions.delete')}
      >
        {/* Trash icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
          <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  )
}
