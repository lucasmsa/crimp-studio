import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'

/** What the hold popover needs about the selected hold */
export function useHoldControls(hold: Hold) {
  const { updateHold, markHoldDeleting, rotateHold } = useWallStore()

  return {
    color: hold.color ?? colors.holds[hold.type],
    setColor: (color: string) => updateHold(hold.id, { color }),
    rotate: () => rotateHold(hold.id),
    remove: () => markHoldDeleting(hold.id),
  }
}
