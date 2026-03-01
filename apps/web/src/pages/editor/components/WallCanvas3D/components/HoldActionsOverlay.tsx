import { useTranslation } from 'react-i18next'
import { Html } from '@react-three/drei'
import type { Hold } from '@/stores/wallStore'
import { useHoldActions } from '../hooks/useHoldActions'
import { CM_TO_M, WALL_DEPTH } from '../constants/editor3d'

interface HoldActionsOverlayProps {
  hold: Hold
}

export function HoldActionsOverlay({ hold }: HoldActionsOverlayProps) {
  const { t } = useTranslation()
  const { handleRotate, handleDelete } = useHoldActions(hold)

  return (
    <Html
      position={[
        hold.x * CM_TO_M,
        hold.y * CM_TO_M + 0.25,
        WALL_DEPTH / 2 + 0.1,
      ]}
      center
      style={{ pointerEvents: 'auto' }}
      zIndexRange={[100, 0]}
    >
      <div
        className="flex gap-1 rounded-lg p-1.5 shadow-lg border border-white/20"
        style={{
          background: 'rgba(23, 23, 23, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <button
          onClick={handleRotate}
          className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
          title={t('editor.actions.rotate')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-error transition-colors"
          title={t('editor.actions.delete')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
            <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </Html>
  )
}
