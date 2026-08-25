import { useWallStore } from '@/stores/wallStore'
import type { HoldType } from '@/stores/wallStore'
import { getModelVariants } from '../../WallCanvas3D/utils/holdModels'
import { HOLD_TYPES } from '../../../config/holdTypes'
import { formatVariantLabel } from '../../../utils/variantLabel'
import { typeChangeFits, variantChangeFits } from '../utils/holdChangeFits'

export interface RailOption {
  active: boolean
  /** The wall cannot take this one where the selected hold sits */
  unavailable: boolean
}

export interface TypeOption extends RailOption {
  type: HoldType
}

export interface ModelOption extends RailOption {
  variant: string
  label: string
}

/**
 * What the hold tool is set to, which is also what the selected hold is.
 *
 * One control with one meaning (ADR-008): with a hold selected these buttons
 * change that hold and arm the next placement from the same click, so nothing is
 * stashed and restored when the selection goes. Selecting a hold arms its type
 * in the store, which is why the type read here is the armed one rather than the
 * hold's.
 */
export function usePlacementOptions() {
  const {
    wall,
    selectedHoldId,
    selectedHoldType,
    variantByType,
    setSelectedHoldType,
    setSelectedVariant,
    setHoldType,
    setHoldVariant,
    rollHoldVariant,
  } = useWallStore()

  const hold = selectedHoldId ? (wall.holds.find((h) => h.id === selectedHoldId) ?? null) : null
  const armed = variantByType[selectedHoldType] ?? null

  const types: TypeOption[] = HOLD_TYPES.map((type) => ({
    type,
    active: type === selectedHoldType,
    unavailable: hold ? !typeChangeFits(wall.faces, wall.holds, hold, type) : false,
  }))

  const models: ModelOption[] = getModelVariants(selectedHoldType).map(({ variant }) => ({
    variant,
    label: formatVariantLabel(variant),
    /* A selected hold shows the model it actually is; with nothing selected the
       row shows what the next tap will place */
    active: hold ? hold.variant === variant : armed === variant,
    unavailable: hold ? !variantChangeFits(wall.faces, wall.holds, hold, variant) : false,
  }))

  return {
    types,
    models,
    /* Random is a verb while a hold is selected, so it never lights up there:
       the hold has one model and the row says which. It is spent when no other
       model of the type would fit */
    random: {
      active: !hold && armed === null,
      unavailable: hold ? !models.some((model) => !model.active && !model.unavailable) : false,
    },
    pickType: (type: HoldType) => {
      setSelectedHoldType(type)
      if (hold) setHoldType(hold.id, type)
    },
    pickModel: (variant: string) => {
      setSelectedVariant(variant)
      if (hold) setHoldVariant(hold.id, variant)
    },
    pickRandom: () => {
      if (hold) rollHoldVariant(hold.id)
      else setSelectedVariant(null)
    },
  }
}
