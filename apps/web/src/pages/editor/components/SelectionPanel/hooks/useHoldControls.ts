import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'

/** What the hold popover needs about the selected hold */
export function useHoldControls(hold: Hold) {
  const { setHoldColor, markHoldDeleting, rotateHold } = useWallStore()

  return {
    color: hold.color ?? colors.holds[hold.type],
    setColor: (color: string) => setHoldColor(hold.id, color),
    rotate: () => rotateHold(hold.id),
    remove: () => markHoldDeleting(hold.id),
  }
}
