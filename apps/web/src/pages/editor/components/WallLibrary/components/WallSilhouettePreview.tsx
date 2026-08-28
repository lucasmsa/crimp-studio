import { useMemo } from 'react'
import type { FaceTree } from '@crimp-studio/wall-geometry'
import type { SavedHold } from '@/lib/walls'
import { colors } from '@/lib/colors'
import { silhouettePath, wallSilhouette } from '../utils/wallSilhouette'

interface WallSilhouettePreviewProps {
  faces: FaceTree
  holds: SavedHold[]
}

/** Hold dot radius, as a share of the drawing's long side */
const DOT_SHARE = 0.035
/** Profile stroke width, likewise */
const STROKE_SHARE = 0.022

/** The wall's side profile, with its holds, drawn small enough for a list row */
export function WallSilhouettePreview({ faces, holds }: WallSilhouettePreviewProps) {
  const silhouette = useMemo(() => wallSilhouette(faces, holds), [faces, holds])

  return (
    <svg
      viewBox={silhouette.viewBox}
      className="h-14 w-20 shrink-0 border-2 border-border bg-card"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      data-testid="wall-silhouette"
    >
      <path
        d={silhouettePath(silhouette.profile)}
        fill="none"
        stroke={colors.scene.outline}
        strokeWidth={silhouette.span * STROKE_SHARE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {silhouette.holds.map((hold, index) => (
        <circle key={index} cx={hold.x} cy={hold.y} r={silhouette.span * DOT_SHARE} fill={colors.holds.jug} />
      ))}
    </svg>
  )
}
