import { useTranslation } from 'react-i18next'
import { Html } from '@react-three/drei'
import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { CM_TO_M, HOLD_SURFACE_OFFSET } from '../constants/editor3d'
import type { PanelLayout } from '../utils/wallLayout'

interface HoldActionsOverlayProps {
  hold: Hold
  layout: PanelLayout
}

const ROTATION_STEP = 45

export function HoldActionsOverlay({ hold, layout }: HoldActionsOverlayProps) {
  const { t } = useTranslation()
  const { updateHold, removeHold } = useWallStore()

  const handleRotate = () => {
    const newRotation = ((hold.rotation ?? 0) + ROTATION_STEP) % 360
    updateHold(hold.id, { rotation: newRotation })
  }

  const handleDelete = () => {
    removeHold(hold.id)
  }

  // Position above the hold in panel-local space, then transform with layout
  const holdX = (hold.x * CM_TO_M) - layout.width / 2
  const holdY = (hold.y * CM_TO_M) - layout.height / 2 + 0.15
  const holdZ = HOLD_SURFACE_OFFSET + 0.05

  return (
    <group position={layout.position} rotation={layout.rotation}>
      <Html
        position={[holdX, holdY, holdZ]}
        center
        style={{ pointerEvents: 'auto' }}
        zIndexRange={[100, 0]}
      >
        <div className="flex gap-1 bg-surface border border-border rounded-md p-1 shadow-lg">
          <button
            onClick={handleRotate}
            className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title={t('editor.actions.rotate')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-error/20 rounded text-muted-foreground hover:text-error transition-colors"
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
    </group>
  )
}
