import type { CollisionBox, HoldType } from '@/stores/wallStore'
import { getModelVariant, measureModelCollisionBox } from './holdModels'
import { measureCollisionBox } from './holdGeometry'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { CM_TO_M } from '@crimp-studio/wall-geometry'

/**
 * The footprint a hold occupies on its panel. A GLB variant is measured from
 * the model; a type with no model falls back to the procedural geometry, which
 * carries its own size multiplier.
 */
export function measureHoldFootprint(
  type: HoldType,
  variant: string | undefined,
  size: number,
  rotationDeg = 0,
): CollisionBox {
  const model = getModelVariant(type, variant)

  return model
    ? measureModelCollisionBox(model, type, size, rotationDeg)
    : measureCollisionBox(
        type,
        size * CM_TO_M * holdGeometryConfigs[type].sizeMultiplier,
        rotationDeg,
      )
}
