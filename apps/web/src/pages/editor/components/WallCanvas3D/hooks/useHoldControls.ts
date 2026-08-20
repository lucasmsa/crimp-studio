import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { getNextRotation } from '../utils/holdActions'

/** What the hold popover needs about the selected hold */
export function useHoldControls(hold: Hold) {
  const { updateHold, markHoldDeleting } = useWallStore()

  return {
    color: hold.color ?? colors.holds[hold.type],
    setColor: (color: string) => updateHold(hold.id, { color }),
    rotate: () => updateHold(hold.id, { rotation: getNextRotation(hold.rotation) }),
    remove: () => markHoldDeleting(hold.id),
  }
}
