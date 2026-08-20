import { useMemo } from 'react'
import { useWallStore } from '@/stores/wallStore'
import { computeFaceTransforms } from '@crimp-studio/wall-geometry'
import { facePopoverAnchor, holdPopoverAnchor } from '../utils/popoverAnchor'
import { PanelPopover } from './PanelPopover'
import { HoldPopover } from './HoldPopover'

/**
 * Whichever popover the current selection calls for, or nothing at all.
 *
 * The anchors come from the settled tree rather than from the animated face
 * groups, so a popover holds its place while the wall swings into its new
 * shape instead of chasing the panel across the screen.
 */
export function SelectionPopovers() {
  const { wall, selectedHoldId, selectedFaceId } = useWallStore()

  const transforms = useMemo(() => computeFaceTransforms(wall.faces), [wall.faces])
  const hold = selectedHoldId ? wall.holds.find((h) => h.id === selectedHoldId) : null

  const anchor = useMemo(() => {
    if (hold) return holdPopoverAnchor(transforms, hold)
    if (selectedFaceId) return facePopoverAnchor(wall.faces, transforms, selectedFaceId)
    return null
  }, [hold, selectedFaceId, transforms, wall.faces])

  if (!anchor) return null
  if (hold) return <HoldPopover hold={hold} anchor={anchor} />

  return <PanelPopover anchor={anchor} />
}
