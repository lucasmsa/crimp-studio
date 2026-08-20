import type { Hold } from '@/stores/wallStore'
import { useWallStore } from '@/stores/wallStore'
import { colors } from '@/lib/colors'
import { getNextRotation } from '../utils/holdActions'
import { getModelVariants } from '../utils/holdModels'

/**
 * Everything the hold popover needs about the selected hold. A placed hold has
 * a definite model, so its variants are listed without the auto entry the
 * placement tool offers.
 */
export function useHoldControls(hold: Hold) {
  const { updateHold, markHoldDeleting, setHoldType, setHoldVariant } = useWallStore()

  return {
    variants: getModelVariants(hold.type),
    color: hold.color ?? colors.holds[hold.type],
    setType: (type: Hold['type']) => setHoldType(hold.id, type),
    setVariant: (variant: string) => setHoldVariant(hold.id, variant),
    setColor: (color: string) => updateHold(hold.id, { color }),
    rotate: () => updateHold(hold.id, { rotation: getNextRotation(hold.rotation) }),
    remove: () => markHoldDeleting(hold.id),
  }
}
