import type { CollisionBox, HoldType } from '@/stores/wallStore'
import { holdModelVariants, type HoldModelVariant } from '../config/holdModelConfig.generated'
import { holdGeometryConfigs } from '../config/holdGeometryConfig'
import { CM_TO_M } from '../constants/editor3d'

/**
 * Target on-wall footprint per type, in scene units per (size * sizeMultiplier).
 * Matched to the procedural geometries' measured footprints so model-backed holds
 * land at the same visual size the editor already uses.
 */
const FOOTPRINT_FACTORS: Partial<Record<HoldType, number>> = {
  jug: 4.7,
  crimp: 2.5,
  sloper: 3.3,
  pinch: 3.6,
  pocket: 3.7,
  volume: 3.2,
}

export function getModelVariants(type: HoldType): HoldModelVariant[] {
  return holdModelVariants[type] ?? []
}

/** Every GLB path in the registry, for editor-mount preloading */
export function getAllModelPaths(): string[] {
  return Object.values(holdModelVariants).flatMap((variants) => variants.map((v) => v.path))
}

export function getModelVariant(type: HoldType, variant?: string): HoldModelVariant | null {
  if (!variant) return null
  return getModelVariants(type).find((v) => v.variant === variant) ?? null
}

/**
 * Deterministically picks a model variant for a new hold from its id,
 * so placement spreads across variants without randomness in the store.
 * Returns undefined for types without models (procedural geometry is used).
 */
export function pickModelVariant(holdId: string, type: HoldType): string | undefined {
  const variants = getModelVariants(type)
  if (variants.length === 0) return undefined

  let hash = 0
  for (const char of holdId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return variants[Math.abs(hash) % variants.length].variant
}

/**
 * Uniform scale factor that brings a model's native XY footprint to the
 * hold's target on-wall footprint.
 */
export function getModelScaleFactor(model: HoldModelVariant, type: HoldType, size: number): number {
  const factor = FOOTPRINT_FACTORS[type] ?? 3
  const target = size * CM_TO_M * holdGeometryConfigs[type].sizeMultiplier * factor
  const nativeFootprint = Math.max(model.sizeMeters[0], model.sizeMeters[1])
  return target / nativeFootprint
}

/**
 * Collision half-extents (cm) for a model-backed hold, computed synchronously
 * from the model's native dimensions. Used by the store at placement time,
 * before the 3D component mounts and reports the measured box.
 */
export function measureModelCollisionBox(
  model: HoldModelVariant,
  type: HoldType,
  size: number,
  rotationDeg = 0,
): CollisionBox {
  const scaleFactor = getModelScaleFactor(model, type, size)
  const halfWMeters = (model.sizeMeters[0] * scaleFactor) / 2
  const halfHMeters = (model.sizeMeters[1] * scaleFactor) / 2

  const rad = (rotationDeg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))

  return {
    halfW: (halfWMeters * cos + halfHMeters * sin) / CM_TO_M,
    halfH: (halfWMeters * sin + halfHMeters * cos) / CM_TO_M,
  }
}
