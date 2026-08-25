import type { CollisionBox, HoldType } from '@/stores/wallStore'
import { getModelVariant, getModelVariants, measureModelCollisionBox } from './holdModels'
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

/**
 * The box that contains every model of a type, extent by extent.
 *
 * Not any one model: models of a type are scaled to a common target footprint
 * but keep their own aspect and depth, so the widest is rarely the tallest. A
 * type offered only when this box fits is a type whose every model fits, which
 * is what lets a random roll land anywhere without being refused (ADR-008).
 */
export function measureWorstCaseFootprint(
  type: HoldType,
  size: number,
  rotationDeg = 0,
): CollisionBox {
  const boxes = getModelVariants(type).map((model) =>
    measureHoldFootprint(type, model.variant, size, rotationDeg),
  )
  if (boxes.length === 0) return measureHoldFootprint(type, undefined, size, rotationDeg)

  return {
    halfW: Math.max(...boxes.map((box) => box.halfW)),
    halfH: Math.max(...boxes.map((box) => box.halfH)),
    depth: Math.max(...boxes.map((box) => box.depth)),
  }
}
