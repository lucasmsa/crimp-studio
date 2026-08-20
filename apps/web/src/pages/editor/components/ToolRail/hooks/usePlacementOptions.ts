import { useWallStore } from '@/stores/wallStore'
import { getModelVariants } from '../../WallCanvas3D/utils/holdModels'

/**
 * What the next hold will be. This is the holds tool's own setting, not a
 * property of anything on the wall, which is why it lives in the rail and not
 * in a popover.
 */
export function usePlacementOptions() {
  const { selectedHoldType, selectedVariant, setSelectedHoldType, setSelectedVariant } =
    useWallStore()

  return {
    selectedHoldType,
    selectedVariant,
    variants: getModelVariants(selectedHoldType),
    setSelectedHoldType,
    setSelectedVariant,
  }
}
