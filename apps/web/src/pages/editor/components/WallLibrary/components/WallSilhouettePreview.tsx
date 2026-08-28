import { useMemo } from 'react'
import type { FaceTree } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'
import { colors } from '@/lib/colors'
import { panelPoints, wallSilhouette } from '../utils/wallSilhouette'

interface WallSilhouettePreviewProps {
  faces: FaceTree
  holds: SavedHold[]
}

/** Hold dot radius, as a share of the drawing's long side */
const DOT_SHARE = 0.035
/** Panel outline width, likewise */
const STROKE_SHARE = 0.012

const holdColor = (hold: SavedHold) => hold.color ?? colors.holds[hold.type]

/** The wall drawn three quarters on, with its holds, small enough for a list row */
export function WallSilhouettePreview({ faces, holds }: WallSilhouettePreviewProps) {
  const silhouette = useMemo(
    () => wallSilhouette(faces, holds, holdColor, colors.wall.surface),
    [faces, holds],
  )
  const stroke = silhouette.span * STROKE_SHARE

  return (
    <svg
      viewBox={silhouette.viewBox}
      className="h-14 w-20 shrink-0 border-2 border-border"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      data-testid="wall-silhouette"
    >
      {/* The wall is painted near white, so it needs the room behind it to read
          as a wall rather than as an empty outline, the same way the scene does */}
      <rect
        x={silhouette.box.left}
        y={silhouette.box.top}
        width={silhouette.box.width}
        height={silhouette.box.height}
        fill={colors.scene.room.light.top}
      />

      {silhouette.panels.map((panel) => (
        <polygon
          key={panel.id}
          points={panelPoints(panel.corners)}
          fill={panel.color}
          stroke={colors.scene.outline}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      ))}
      {silhouette.holds.map((hold) => (
        <circle
          key={hold.id}
          cx={hold.at.x}
          cy={hold.at.y}
          r={silhouette.span * DOT_SHARE}
          fill={hold.color}
          stroke={colors.scene.outline}
          strokeWidth={stroke}
        />
      ))}
    </svg>
  )
}
